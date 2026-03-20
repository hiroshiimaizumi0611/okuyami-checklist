import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { verifyDownloadToken } from "../../src/lib/download-token";
import { app } from "../../src/server/app";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import { createExecutionContextHarness } from "./wait-until";

const WEBHOOK_SECRET = "webhook-test-secret";
const DOWNLOAD_TOKEN_SECRET = "webhook-download-secret";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

async function signWebhookPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `v1.${Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

describe("POST /webhooks/stripe", () => {
  let mf: { dispose(): Promise<void> };
  let db: D1Database;
  let purchaseRepository: ReturnType<typeof createD1PurchaseRepository>;

  beforeEach(async () => {
    const state = await createTestD1Database();
    mf = state.mf;
    db = state.db;
    purchaseRepository = createD1PurchaseRepository(db);
  });

  afterEach(async () => {
    await mf.dispose();
  });

  it("recovers on retry after a delivery email failure and only sets sent_at after success", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot),
      stripeSessionId: "cs_test_retry_1"
    });
    const sendDeliveryEmail = vi
      .fn()
      .mockRejectedValueOnce(new Error("smtp unavailable"))
      .mockResolvedValueOnce(undefined);
    const event = {
      id: "evt_retry_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_retry_1",
          metadata: {
            purchaseId
          }
        }
      }
    };
    const body = JSON.stringify(event);
    const signature = await signWebhookPayload(body, WEBHOOK_SECRET);
    const requestInit = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature
      },
      body
    };

    const env = {
      DB: db,
      APP_URL: "http://localhost:8787",
      SNAPSHOT_TOKEN_SECRET: "webhook-snapshot-secret",
      DOWNLOAD_TOKEN_SECRET,
      STRIPE_SECRET_KEY: "sk_test_webhook",
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      RESEND_API_KEY: "resend_webhook",
      PAYMENT_MODE: "test" as const,
      PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
    };

    const firstRes = await app.request("/webhooks/stripe", requestInit, env);
    const firstPurchase = await purchaseRepository.findById(purchaseId);
    const firstProcessedEventCount = await db
      .prepare("select count(*) as count from processed_webhook_events where stripe_event_id = ?1")
      .bind("evt_retry_1")
      .first<{ count: number }>();

    const secondRes = await app.request("/webhooks/stripe", requestInit, env);
    const secondPurchase = await purchaseRepository.findById(purchaseId);
    const secondProcessedEventCount = await db
      .prepare("select count(*) as count from processed_webhook_events where stripe_event_id = ?1")
      .bind("evt_retry_1")
      .first<{ count: number }>();

    expect(firstRes.status).toBe(500);
    expect(firstPurchase).toMatchObject({
      id: purchaseId,
      status: "paid",
      deliveryEmailSentAt: null
    });
    expect(firstProcessedEventCount?.count).toBe(0);
    expect(sendDeliveryEmail).toHaveBeenCalledTimes(2);

    expect(secondRes.status).toBe(200);
    expect(secondPurchase).toMatchObject({
      id: purchaseId,
      status: "paid",
      deliveryEmailSentAt: expect.any(String)
    });
    expect(secondProcessedEventCount?.count).toBe(1);
  });

  it("uses metadata.purchaseId when the stripe session id was never persisted", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    const sendDeliveryEmail = vi.fn(
      async (_purchase: unknown, _delivery: { downloadUrl: string }) => undefined
    );
    const event = {
      id: "evt_metadata_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_missing_session_1",
          metadata: {
            purchaseId
          }
        }
      }
    };
    const body = JSON.stringify(event);
    const signature = await signWebhookPayload(body, WEBHOOK_SECRET);

    const res = await app.request(
      "/webhooks/stripe",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature
        },
        body
      },
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "webhook-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_webhook",
        STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
        RESEND_API_KEY: "resend_webhook",
        PAYMENT_MODE: "test",
        PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
      }
    );

    const purchase = await purchaseRepository.findById(purchaseId);

    expect(res.status).toBe(200);
    expect(purchase).toMatchObject({
      id: purchaseId,
      status: "paid",
      stripeSessionId: "cs_test_missing_session_1",
      deliveryEmailSentAt: expect.any(String)
    });
    expect(sendDeliveryEmail).toHaveBeenCalledTimes(1);

    const delivery = (sendDeliveryEmail.mock.calls[0] as [unknown, { downloadUrl: string }])[1];
    const url = new URL(delivery.downloadUrl);
    const token = url?.searchParams.get("token");

    expect(url?.pathname).toBe("/download");
    expect(token).toBeTruthy();

    const verified = await verifyDownloadToken(token ?? "", DOWNLOAD_TOKEN_SECRET);
    expect(verified.purchase_id).toBe(purchaseId);
  });

  it("serializes concurrent duplicate deliveries so the sender runs once", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot),
      stripeSessionId: "cs_test_webhook_1"
    });
    const deliveryGate = createDeferred<void>();
    const sendDeliveryEmail = vi.fn(() => deliveryGate.promise);
    const event = {
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_webhook_1",
          metadata: {
            purchaseId
          }
        }
      }
    };
    const body = JSON.stringify(event);
    const signature = await signWebhookPayload(body, WEBHOOK_SECRET);
    const requestInit = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature
      },
      body
    };

    const env = {
      DB: db,
      APP_URL: "http://localhost:8787",
      SNAPSHOT_TOKEN_SECRET: "webhook-snapshot-secret",
      DOWNLOAD_TOKEN_SECRET,
      STRIPE_SECRET_KEY: "sk_test_webhook",
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      RESEND_API_KEY: "resend_webhook",
      PAYMENT_MODE: "test" as const,
      PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
    };
    const { executionCtx, drain } = createExecutionContextHarness();

    const firstRequest = app.fetch(
      new Request("http://localhost/webhooks/stripe", requestInit),
      env,
      executionCtx
    );
    await vi.waitFor(() => expect(sendDeliveryEmail).toHaveBeenCalledTimes(1));
    const secondRequest = app.fetch(
      new Request("http://localhost/webhooks/stripe", requestInit),
      env,
      executionCtx
    );
    await vi.waitFor(() => expect(sendDeliveryEmail).toHaveBeenCalledTimes(1));
    deliveryGate.resolve();

    const [firstRes, secondRes] = await Promise.all([firstRequest, secondRequest]);
    await drain();

    const purchase = await purchaseRepository.findById(purchaseId);
    const processedEventCount = await db
      .prepare("select count(*) as count from processed_webhook_events where stripe_event_id = ?1")
      .bind("evt_test_1")
      .first<{ count: number }>();
    const events = await createD1EventRepository(db).listRecent();

    expect(firstRes.status).toBe(200);
    expect(secondRes.status).toBe(200);
    expect(purchase).toMatchObject({
      id: purchaseId,
      status: "paid",
      stripeSessionId: "cs_test_webhook_1"
    });
    expect(processedEventCount?.count).toBe(1);
    expect(sendDeliveryEmail).toHaveBeenCalledTimes(1);
    expect(events[0]?.eventName).toBe("purchase_completed");
  });
});
