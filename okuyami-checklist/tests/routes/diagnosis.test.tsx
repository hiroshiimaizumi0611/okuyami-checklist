import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/server/app";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import questionsData from "../../content/questions.json";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createExecutionContextHarness } from "./wait-until";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const orderedQuestions = [...questionsData].sort((a, b) => a.order - b.order);

describe("GET /diagnosis", () => {
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

  it("renders all diagnosis questions in order with explicit fallback semantics", async () => {
    const { executionCtx, drain } = createExecutionContextHarness();
    const res = await app.fetch(new Request("http://localhost/diagnosis"), {
      DB: db
    } as never, executionCtx);
    const html = await res.text();
    await drain();
    const events = await createD1EventRepository(db).listRecent();

    expect(res.status).toBe(200);
    expect(html).toContain("必要な手続きを診断します");
    expect(html).toContain(`${orderedQuestions.length}問の質問`);
    expect(html).toContain('method="post" action="/results"');
    expect(html).toContain("一般案内です。");
    expect(html).toContain("公式確認先");
    expect(html).toContain("専門家");

    orderedQuestions.forEach((question) => {
      expect(html).toContain(question.text);
    });

    const fieldsetCount = (html.match(/class="question-card"/g) ?? []).length;
    expect(fieldsetCount).toBe(orderedQuestions.length);

    const positions = orderedQuestions.map((question) =>
      html.search(new RegExp(escapeRegex(question.text)))
    );
    positions.forEach((position) => {
      expect(position).toBeGreaterThan(-1);
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(events[0]?.eventName).toBe("diagnosis_started");
  });
});

describe("POST /diagnosis", () => {
  it("redirects back to diagnosis form instead of 404", async () => {
    const res = await app.request("/diagnosis", { method: "POST" });

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/diagnosis");
  });
});
