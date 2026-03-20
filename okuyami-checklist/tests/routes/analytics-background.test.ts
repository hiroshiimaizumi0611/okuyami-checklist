import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventRepository } from "../../src/repositories/event-repository";
import { app } from "../../src/server/app";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { signSnapshotToken } from "../../src/lib/snapshot-token";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createExecutionContextHarness } from "./wait-until";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

function createSlowEventRepository() {
  const deferred = createDeferred<string>();
  const eventRepository: EventRepository = {
    track: vi.fn(() => deferred.promise),
    listRecent: vi.fn(async () => [])
  };
  return { deferred, eventRepository };
}

async function settlesQuickly<T>(promise: Promise<T>, timeoutMs = 250): Promise<boolean> {
  return (
    (await Promise.race([
      promise.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), timeoutMs))
    ])) === true
  );
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

describe("analytics deferral", () => {
  let mf: { dispose(): Promise<void> };
  let db: D1Database;

  beforeEach(async () => {
    const state = await createTestD1Database();
    mf = state.mf;
    db = state.db;
  });

  afterEach(async () => {
    await mf.dispose();
  });

  it("does not block landing page renders on analytics writes", async () => {
    const { deferred, eventRepository } = createSlowEventRepository();
    const { executionCtx, drain } = createExecutionContextHarness();

    const responsePromise = Promise.resolve(
      app.fetch(
      new Request("http://localhost/"),
      {
        DB: db,
        ANALYTICS_EVENT_REPOSITORY: eventRepository
      } as never,
      executionCtx
      )
    );

    expect(await settlesQuickly(responsePromise, 1000)).toBe(true);

    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(eventRepository.track).toHaveBeenCalledWith("landing_view", {
      path: "/"
    });

    deferred.resolve("evt_landing");
    await drain();
  });

  it("does not block checkout redirects on analytics writes", async () => {
    const { deferred, eventRepository } = createSlowEventRepository();
    const { executionCtx, drain } = createExecutionContextHarness();
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const snapshotToken = await signSnapshotToken(snapshot, "checkout-test-snapshot-secret");

    const responsePromise = Promise.resolve(
      app.fetch(
      new Request("http://localhost/checkout", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: "buyer@example.com",
          snapshot_token: snapshotToken
        }).toString()
      }),
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "checkout-test-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET: "checkout-test-download-secret",
        STRIPE_SECRET_KEY: "sk_test_checkout",
        STRIPE_WEBHOOK_SECRET: "whsec_checkout",
        RESEND_API_KEY: "resend_checkout",
        PAYMENT_MODE: "test",
        ANALYTICS_EVENT_REPOSITORY: eventRepository
      } as never,
      executionCtx
      )
    );

    expect(await settlesQuickly(responsePromise, 1000)).toBe(true);

    const response = await responsePromise;
    expect(response.status).toBe(303);
    expect(eventRepository.track).toHaveBeenCalledWith(
      "checkout_started",
      expect.objectContaining({
        purchaseId: expect.any(String),
        resultCount: expect.any(Number)
      })
    );

    deferred.resolve("evt_checkout");
    await drain();
  });

  it("does not block webhook acknowledgements on analytics writes", async () => {
    const { deferred, eventRepository } = createSlowEventRepository();
    const { executionCtx, drain } = createExecutionContextHarness();
    const purchaseRepository = createD1PurchaseRepository(db);
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot),
      stripeSessionId: "cs_test_webhook_bg_1"
    });
    const body = JSON.stringify({
      id: "evt_bg_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_webhook_bg_1",
          metadata: {
            purchaseId
          }
        }
      }
    });
    const signature = await signWebhookPayload(body, "whsec_bg");
    const sendDeliveryEmail = vi.fn(async () => undefined);

    const responsePromise = Promise.resolve(
      app.fetch(
      new Request("http://localhost/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature
        },
        body
      }),
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "webhook-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET: "webhook-download-secret",
        STRIPE_SECRET_KEY: "sk_test_webhook",
        STRIPE_WEBHOOK_SECRET: "whsec_bg",
        RESEND_API_KEY: "resend_webhook",
        PAYMENT_MODE: "test",
        PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail,
        ANALYTICS_EVENT_REPOSITORY: eventRepository
      } as never,
      executionCtx
      )
    );

    expect(await settlesQuickly(responsePromise, 1000)).toBe(true);

    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(eventRepository.track).toHaveBeenCalledWith("purchase_completed", {
      purchaseId,
      stripeSessionId: "cs_test_webhook_bg_1"
    });

    deferred.resolve("evt_webhook");
    await drain();
  });
});
