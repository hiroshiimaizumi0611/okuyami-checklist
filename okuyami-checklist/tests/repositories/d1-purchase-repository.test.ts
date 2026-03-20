import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createD1PurchaseRepository } from "../../src/repositories/d1-purchase-repository";
import { createTestD1Database } from "./d1-test-helpers";

describe("D1PurchaseRepository", () => {
  let mf: { dispose(): Promise<void> };
  let db: D1Database;

  beforeEach(async () => {
    const state = await createTestD1Database();
    mf = state.mf;
    db = state.db;
  });

  afterEach(async () => {
    if (mf) {
      await mf.dispose();
    }
  });

  it("stores a pending purchase with a result snapshot", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);
    const snapshot = {
      schema_version: 1,
      generated_at: "2026-03-20T00:00:00.000Z",
      procedures: [],
      sections: [],
      escalations: []
    };

    const id = await purchaseRepository.createPending({
      email: "test@example.com",
      snapshotJson: JSON.stringify(snapshot)
    });

    expect(id).toMatch(/^pur_/);

    const row = await db
      .prepare("select id, email, status, snapshot_json from purchases where id = ?1")
      .bind(id)
      .first<{
        id: string;
        email: string;
        status: string;
        snapshot_json: string;
      }>();

    expect(row).toEqual({
      id,
      email: "test@example.com",
      status: "pending",
      snapshot_json: JSON.stringify(snapshot)
    });
  });

  it("finds a purchase by stripe session id", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: "{\"schema_version\":1}",
      stripeSessionId: "cs_test_lookup_1"
    });

    const purchase = await purchaseRepository.findByStripeSessionId("cs_test_lookup_1");

    expect(purchase).toMatchObject({
      id: purchaseId,
      email: "buyer@example.com",
      status: "pending",
      stripeSessionId: "cs_test_lookup_1"
    });
  });

  it("marks a purchase as paid", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: "{\"schema_version\":1}"
    });

    await purchaseRepository.markPaid({
      id: purchaseId,
      stripeSessionId: "cs_test_paid_1",
      paidAt: "2026-03-20T01:02:03.000Z"
    });

    const purchase = await purchaseRepository.findById(purchaseId);
    expect(purchase).toMatchObject({
      id: purchaseId,
      status: "paid",
      stripeSessionId: "cs_test_paid_1",
      paidAt: "2026-03-20T01:02:03.000Z"
    });
  });

  it("claims a webhook event once and releases it for retry", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);

    expect(await purchaseRepository.claimWebhookEventProcessing("evt_1", "claim_a")).toBe(true);
    expect(await purchaseRepository.claimWebhookEventProcessing("evt_1", "claim_b")).toBe(false);
    expect(await purchaseRepository.releaseWebhookEventProcessingClaim("evt_1", "claim_a")).toBe(
      true
    );
    expect(await purchaseRepository.claimWebhookEventProcessing("evt_1", "claim_b")).toBe(true);
    expect(await purchaseRepository.recordProcessedWebhookEvent("evt_1")).toBe(true);
    expect(await purchaseRepository.hasProcessedWebhookEvent("evt_1")).toBe(true);
    expect(await purchaseRepository.releaseWebhookEventProcessingClaim("evt_1", "claim_b")).toBe(
      true
    );
    expect(await purchaseRepository.claimWebhookEventProcessing("evt_1", "claim_c")).toBe(false);
  });

  it("claims delivery email only once", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);
    const purchaseId = await purchaseRepository.createPending({
      email: "buyer@example.com",
      snapshotJson: "{\"schema_version\":1}"
    });

    expect(
      await purchaseRepository.claimDeliveryEmail(purchaseId, "2026-03-20T02:00:00.000Z")
    ).toBe(true);
    expect(
      await purchaseRepository.claimDeliveryEmail(purchaseId, "2026-03-20T03:00:00.000Z")
    ).toBe(false);

    const purchase = await purchaseRepository.findById(purchaseId);
    expect(purchase?.deliveryEmailSentAt).toBe("2026-03-20T02:00:00.000Z");
  });

  it("enforces unique stripe session ids", async () => {
    const purchaseRepository = createD1PurchaseRepository(db);

    await purchaseRepository.createPending({
      email: "first@example.com",
      snapshotJson: "{\"schema_version\":1}",
      stripeSessionId: "cs_test_unique_1"
    });

    await expect(
      purchaseRepository.createPending({
        email: "second@example.com",
        snapshotJson: "{\"schema_version\":1}",
        stripeSessionId: "cs_test_unique_1"
      })
    ).rejects.toThrow();
  });
});
