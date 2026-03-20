import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/server/app";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import { createTestD1Database } from "../repositories/d1-test-helpers";
import { createExecutionContextHarness } from "./wait-until";

describe("GET /", () => {
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

  it("renders trust copy and diagnosis CTA target without over-promising results", async () => {
    const { executionCtx, drain } = createExecutionContextHarness();
    const res = await app.fetch(new Request("http://localhost/"), {
      DB: db
    } as never, executionCtx);
    const html = await res.text();
    await drain();
    const events = await createD1EventRepository(db).listRecent();

    expect(res.status).toBe(200);
    expect(html).toContain("3分で必要な手続きを整理");
    expect(html).toContain("本サービスは一般的な制度情報に基づく案内です。");
    expect(html).toContain('href="/diagnosis"');
    expect(html).toContain("結果ページは次のステップで対応予定です。");
    expect(html).not.toContain("まずは無料で結果を確認できます");
    expect(events[0]?.eventName).toBe("landing_view");
  });
});
