import { describe, expect, it } from "vitest";
import { app } from "../../src/server/app";

const launchSlugs = [
  "parent-died-first-steps",
  "inheritance-renunciation-deadline",
  "death-procedure-checklist",
  "national-pension-death-report",
  "health-insurance-bereavement-checklist"
] as const;

describe("GET /articles/:slug", () => {
  it("renders the launch article for urgent first steps with a diagnosis CTA", async () => {
    const res = await app.request("/articles/parent-died-first-steps");
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("親が亡くなった直後にまず確認したいこと");
    expect(html).toContain(
      "親が亡くなった当日から1週間の初動で確認したい死亡届、葬儀準備、役所連絡の一般情報を整理します。"
    );
    expect(html).toContain("死亡届");
    expect(html).toContain(
      "家族内で「死亡届を出す人」「葬儀社と連絡を取る人」「勤務先や学校へ連絡する人」を先に決めておくと、初動の混乱を減らしやすくなります。"
    );
    expect(html).toContain("このページは一般的な制度情報の整理です。");
    expect(html).toContain('href="/diagnosis"');
  });

  it.each(launchSlugs)("returns 200 for %s", async (slug) => {
    const res = await app.request(`/articles/${slug}`);

    expect(res.status).toBe(200);
  });
});
