import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { verifyDownloadToken } from "../../src/lib/download-token";
import { app } from "../../src/server/app";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";

const SNAPSHOT_TOKEN_SECRET = "purchase-success-snapshot-secret";
const DOWNLOAD_TOKEN_SECRET = "purchase-success-download-secret";

describe("GET /purchase/success", () => {
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

  it("shows a waiting state until the purchase is marked paid", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });

    const pendingRes = await app.request(
      `/purchase/success?purchaseId=${purchaseId}`,
      undefined,
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET,
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_success",
        STRIPE_WEBHOOK_SECRET: "whsec_success",
        RESEND_API_KEY: "resend_success",
        PAYMENT_MODE: "test"
      }
    );

    const pendingHtml = await pendingRes.text();

    expect(pendingRes.status).toBe(200);
    expect(pendingHtml).toContain("決済情報を確認しています");
    expect(pendingHtml).not.toContain("ダウンロードリンクを再送する");
    expect(pendingHtml).not.toContain("download?token=");

    await purchaseRepository.markPaid({
      id: purchaseId,
      stripeSessionId: "cs_test_paid_success",
      paidAt: "2026-03-20T01:00:00.000Z"
    });

    const paidRes = await app.request(
      `/purchase/success?purchaseId=${purchaseId}`,
      undefined,
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET,
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_success",
        STRIPE_WEBHOOK_SECRET: "whsec_success",
        RESEND_API_KEY: "resend_success",
        PAYMENT_MODE: "test"
      }
    );

    const paidHtml = await paidRes.text();
    const token = paidHtml.match(/href="\/download\?token=([^"]+)"/u)?.[1];

    expect(paidRes.status).toBe(200);
    expect(paidHtml).toContain("ご購入手続きが完了いたしました");
    expect(paidHtml).toContain("有料版のダウンロード");
    expect(paidHtml).toContain("購入時のメールアドレス");
    expect(token).toBeDefined();

    const verified = await verifyDownloadToken(token ?? "", DOWNLOAD_TOKEN_SECRET);
    expect(verified.purchase_id).toBe(purchaseId);
  });

  it("shows the dedicated test-checkout state in PAYMENT_MODE=test", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: JSON.stringify(snapshot),
      stripeSessionId: "cs_test_waiting_checkout"
    });

    const res = await app.request(
      `/purchase/success?purchaseId=${purchaseId}&testSessionId=cs_test_waiting_checkout`,
      undefined,
      {
        DB: db,
        APP_URL: "http://localhost:8787",
        SNAPSHOT_TOKEN_SECRET,
        DOWNLOAD_TOKEN_SECRET,
        STRIPE_SECRET_KEY: "sk_test_success",
        STRIPE_WEBHOOK_SECRET: "whsec_success",
        RESEND_API_KEY: "resend_success",
        PAYMENT_MODE: "test"
      }
    );

    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("テスト決済");
    expect(html).toContain("テスト決済を完了する");
  });
});
