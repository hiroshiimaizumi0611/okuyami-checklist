import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { signDownloadToken } from "../../src/lib/download-token";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";
import { app } from "../../src/server/app";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";

const DOWNLOAD_TOKEN_SECRET = "download-route-secret";

describe("GET /download", () => {
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

  it("streams a PDF only for paid purchases", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const pendingPurchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    const paidPurchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });
    await purchaseRepository.markPaid({
      id: paidPurchaseId,
      stripeSessionId: "cs_test_download_1",
      paidAt: "2026-03-20T01:00:00.000Z"
    });

    const pendingToken = await signDownloadToken(
      {
        purchase_id: pendingPurchaseId,
        expires_at: "2026-03-27T00:00:00.000Z"
      },
      DOWNLOAD_TOKEN_SECRET
    );
    const paidToken = await signDownloadToken(
      {
        purchase_id: paidPurchaseId,
        expires_at: "2026-03-27T00:00:00.000Z"
      },
      DOWNLOAD_TOKEN_SECRET
    );

    const env = {
      DB: db,
      APP_URL: "http://localhost:8787",
      SNAPSHOT_TOKEN_SECRET: "download-snapshot-secret",
      DOWNLOAD_TOKEN_SECRET,
      STRIPE_SECRET_KEY: "sk_test_download",
      STRIPE_WEBHOOK_SECRET: "whsec_download",
      RESEND_API_KEY: "resend_download",
      PAYMENT_MODE: "test" as const
    };

    const deniedRes = await app.request(`/download?token=${pendingToken}`, undefined, env);
    const allowedRes = await app.request(`/download?token=${paidToken}`, undefined, env);

    expect(deniedRes.status).toBe(403);

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.headers.get("content-type")).toContain("application/pdf");
    expect(allowedRes.headers.get("content-disposition")).toContain(
      `okuyami-checklist-${paidPurchaseId}.pdf`
    );
    expect(allowedRes.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect((await allowedRes.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
});
