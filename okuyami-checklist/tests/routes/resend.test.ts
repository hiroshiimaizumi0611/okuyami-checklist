import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { verifyDownloadToken } from "../../src/lib/download-token";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";
import { app } from "../../src/server/app";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";

const DOWNLOAD_TOKEN_SECRET = "resend-route-secret";

describe("POST /resend", () => {
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

  it("sends a fresh paid download link to the recorded purchase email", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    await purchaseRepository.markPaid({
      id: purchaseId,
      stripeSessionId: "cs_test_resend_1",
      paidAt: "2026-03-20T01:00:00.000Z"
    });

    const sendDeliveryEmail = vi.fn(
      async (_purchase: unknown, _delivery: { downloadUrl: string }) => undefined
    );

    const res = await app.request(
      "/resend",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          purchaseId,
          email: "buyer@example.com"
        })
      },
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "resend-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_resend",
        STRIPE_WEBHOOK_SECRET: "whsec_resend",
        RESEND_API_KEY: "resend_resend",
        PAYMENT_MODE: "test",
        PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
      }
    );

    expect(res.status).toBe(200);
    expect(sendDeliveryEmail).toHaveBeenCalledTimes(1);

    const delivery = (sendDeliveryEmail.mock.calls[0] as [unknown, { downloadUrl: string }])[1];
    const url = new URL(delivery.downloadUrl);
    const token = url?.searchParams.get("token");

    expect(url?.pathname).toBe("/download");
    expect(token).toBeTruthy();

    const verified = await verifyDownloadToken(token ?? "", DOWNLOAD_TOKEN_SECRET);
    expect(verified.purchase_id).toBe(purchaseId);
  });

  it("rejects resend when the purchase email does not match", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    await purchaseRepository.markPaid({
      id: purchaseId,
      stripeSessionId: "cs_test_resend_2",
      paidAt: "2026-03-20T01:00:00.000Z"
    });

    const sendDeliveryEmail = vi.fn(
      async (_purchase: unknown, _delivery: { downloadUrl: string }) => undefined
    );

    const res = await app.request(
      "/resend",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          purchaseId,
          email: "wrong@example.com"
        })
      },
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "resend-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_resend",
        STRIPE_WEBHOOK_SECRET: "whsec_resend",
        RESEND_API_KEY: "resend_resend",
        PAYMENT_MODE: "test",
        PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
      }
    );

    expect(res.status).toBe(404);
    expect(sendDeliveryEmail).not.toHaveBeenCalled();
  });

  it("accepts application/x-www-form-urlencoded resend requests", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    await purchaseRepository.markPaid({
      id: purchaseId,
      stripeSessionId: "cs_test_resend_3",
      paidAt: "2026-03-20T01:00:00.000Z"
    });

    const sendDeliveryEmail = vi.fn(
      async (_purchase: unknown, _delivery: { downloadUrl: string }) => undefined
    );

    const form = new URLSearchParams({
      purchaseId,
      email: "buyer@example.com"
    });

    const res = await app.request(
      "/resend",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      },
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET: "resend-snapshot-secret",
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_resend",
        STRIPE_WEBHOOK_SECRET: "whsec_resend",
        RESEND_API_KEY: "resend_resend",
        PAYMENT_MODE: "test",
        PURCHASE_DELIVERY_EMAIL_SENDER: sendDeliveryEmail
      }
    );

    expect(res.status).toBe(200);
    expect(sendDeliveryEmail).toHaveBeenCalledTimes(1);
  });
});
