import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/server/app";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { signSnapshotToken } from "../../src/lib/snapshot-token";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import { basicCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createExecutionContextHarness } from "./wait-until";

const SNAPSHOT_TOKEN_SECRET = "checkout-test-snapshot-secret";

describe("POST /checkout", () => {
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

  it("creates a Stripe checkout session from a trusted result snapshot and redirects there", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const snapshotToken = await signSnapshotToken(snapshot, SNAPSHOT_TOKEN_SECRET);
    const { executionCtx, drain } = createExecutionContextHarness();

    const res = await app.fetch(
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
        SNAPSHOT_TOKEN_SECRET,
        DOWNLOAD_TOKEN_SECRET: "checkout-test-download-secret",
        STRIPE_SECRET_KEY: "sk_test_checkout",
        STRIPE_WEBHOOK_SECRET: "whsec_checkout",
        RESEND_API_KEY: "resend_checkout",
        PAYMENT_MODE: "test"
      },
      executionCtx
    );

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(
      /^\/purchase\/success\?purchaseId=.*&testSessionId=cs_/u
    );

    const purchase = await db
      .prepare(
        "select email, status, stripe_session_id, snapshot_json from purchases order by created_at desc limit 1"
      )
      .first<{
        email: string;
        status: string;
        stripe_session_id: string | null;
        snapshot_json: string;
      }>();
    await drain();
    const events = await createD1EventRepository(db).listRecent();

    expect(purchase).toMatchObject({
      email: "buyer@example.com",
      status: "pending",
      stripe_session_id: expect.stringMatching(/^cs_/u),
      snapshot_json: JSON.stringify(snapshot)
    });
    expect(events[0]?.eventName).toBe("checkout_started");
  });
});
