import type { Context } from "hono";
import {
  getExecutionCtxOrUndefined,
  trackAnalyticsInBackground
} from "../../lib/analytics";
import { Hero } from "../../ui/components/hero";
import { Layout } from "../../ui/layout";

export async function renderLandingPage(c: Context) {
  trackAnalyticsInBackground(getExecutionCtxOrUndefined(c), c.env, "landing_view", {
    path: "/"
  });

  return c.html(
    <Layout
      title="おくやみ手続きナビ | 無料3分診断"
      description="ご家族が亡くなったあとに何を先に確認すべきかを静かに整理する、一般案内の無料診断ページです。"
    >
      <Hero />
    </Layout>
  );
}
