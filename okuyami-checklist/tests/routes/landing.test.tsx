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
    expect(html).toContain("何を先に確認すべきかを");
    expect(html).toContain("--bg: #F5F5F2");
    expect(html).toContain("--accent: #5B665F");
    expect(html).toContain("&quot;Noto Sans JP&quot;, &quot;Hiragino Sans&quot;, &quot;Yu Gothic&quot;, sans-serif");
    expect(html).not.toContain("--paper:");
    expect(html).not.toContain("--signal:");
    expect(html).toContain("一般案内");
    expect(html).toContain("個別事情の法的判断・税務判断・相続判断");
    expect(html).toContain('href="/diagnosis"');
    expect(html).not.toContain("結果ページは次のステップで対応予定です。");
    expect(events[0]?.eventName).toBe("landing_view");
  });
});
