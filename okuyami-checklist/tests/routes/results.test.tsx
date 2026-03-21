import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/server/app";
import { verifySnapshotToken } from "../../src/lib/snapshot-token";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import { basicCase, debtRiskCase } from "../fixtures/answers";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createExecutionContextHarness } from "./wait-until";

function asFormPayload(input: Record<string, string | boolean>) {
  return new URLSearchParams(
    Object.entries(input).map(([key, value]) => [key, String(value)])
  );
}

describe("POST /results", () => {
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

  it("renders deadline buckets for a valid submission", async () => {
    const { executionCtx, drain } = createExecutionContextHarness();
    const res = await app.fetch(
      new Request("http://localhost/results", {
        method: "POST",
        body: asFormPayload(basicCase),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      }),
      { DB: db } as never
      ,
      executionCtx
    );

    const html = await res.text();
    await drain();
    const events = await createD1EventRepository(db).listRecent();

    expect(res.status).toBe(200);
    expect(html).toContain("まず2週間以内に確認したいこと");
    expect(html).toContain("3か月以内に要注意のこと");
    expect(html).toContain("10か月以内に確認すること");
    expect(html).toContain("期限の確認が必要なこと");
    expect(html).toContain("一般的な案内です。");
    expect(html).toContain("公式確認先");
    expect(html).toContain("有料版 PDF を受け取る");
    expect(html).toContain('name="snapshot_token"');
    expect(events[0]?.eventName).toBe("diagnosis_completed");
    expect(events[0]?.payload).toMatchObject({
      resultCount: expect.any(Number),
      escalationCount: expect.any(Number)
    });
  });

  it("renders content from the same trusted snapshot carried by snapshot_token", async () => {
    const res = await app.request(
      "/results",
      {
        method: "POST",
        body: asFormPayload(basicCase),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      },
      { DB: db } as never
    );

    const html = await res.text();
    const snapshotToken = html.match(/name="snapshot_token" type="hidden" value="([^"]+)"/u)?.[1];
    expect(snapshotToken).toBeDefined();

    const snapshot = await verifySnapshotToken(
      snapshotToken ?? "",
      "vitest-snapshot-token-secret"
    );

    expect(res.status).toBe(200);
    snapshot.sections.forEach((section) => {
      expect(html).toContain(section.title);
      section.procedures.forEach((procedure) => {
        expect(html).toContain(procedure.name);
      });
    });
    snapshot.escalations.forEach((escalation) => {
      expect(html).toContain(escalation === "expert-consultation" ? "専門家相談を検討" : escalation);
    });
  });

  it("returns 400 with guidance when submitted answers are invalid", async () => {
    const invalid = {
      ...basicCase,
      health_insurance_type: "invalid-insurance-type",
      date_of_death: "2026-99-99"
    };

    const res = await app.request(
      "/results",
      {
        method: "POST",
        body: asFormPayload(invalid),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      },
      { DB: db } as never
    );

    const html = await res.text();

    expect(res.status).toBe(400);
    expect(html).toContain("入力内容を確認してください");
    expect(html).toContain("14問中");
    expect(html).toContain('class="question-card"');
    expect(html).toContain("一般案内です。");
    expect(html).toContain("health_insurance_type");
  });

  it("shows escalation messaging when expert review should be considered", async () => {
    const res = await app.request(
      "/results",
      {
        method: "POST",
        body: asFormPayload(debtRiskCase),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      },
      { DB: db } as never
    );

    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("専門家相談を検討");
    expect(html).toContain("公式窓口や専門家");
  });
});

describe("GET /results", () => {
  it("renders a canceled-state page when Stripe returns with canceled=1", async () => {
    const res = await app.request("/results?canceled=1");
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("決済はキャンセルされました");
    expect(html).toContain('href="/diagnosis"');
  });
});
