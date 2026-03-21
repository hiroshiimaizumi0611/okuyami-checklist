import type { Context } from "hono";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { readRequiredEnv, type AppContextEnv } from "../../lib/env";
import { signDownloadToken } from "../../lib/download-token";
import { processStripeWebhookEvent } from "./webhooks";
import { Layout } from "../../ui/layout";

const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const purchaseSuccessStyles = `
  .purchase-panel {
    display: grid;
    gap: 14px;
    padding: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .purchase-panel--pending,
  .purchase-panel--test {
    background: var(--surface-muted);
  }

  .purchase-kicker {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-subtle);
    letter-spacing: 0.16em;
  }

  .purchase-title {
    margin: 0;
    max-width: 12em;
    font-size: 32px;
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .purchase-copy,
  .purchase-note {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .purchase-primary {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .purchase-button,
  .resend-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
    text-decoration: none;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
  }

  .purchase-button:hover,
  .purchase-button:focus-visible,
  .resend-button:hover,
  .resend-button:focus-visible {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }

  .purchase-form,
  .resend-form {
    display: grid;
    gap: 10px;
  }

  .purchase-secondary {
    display: grid;
    gap: 10px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .purchase-label {
    color: var(--text-muted);
    font-size: 13px;
  }

  .purchase-input {
    min-height: 48px;
    padding: 11px 14px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 16px;
  }

  .purchase-input:hover {
    border-color: var(--accent);
  }

  .purchase-input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-color: var(--accent);
  }

  .purchase-status {
    margin: 0;
    padding: 14px 16px;
    border: 1px solid var(--line);
    background: var(--accent-soft);
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.7;
  }

  @media (min-width: 768px) {
    .purchase-panel {
      padding: 32px;
    }

    .purchase-title {
      font-size: 42px;
    }
  }
`;

export async function renderPurchaseSuccess(c: Context<AppContextEnv>) {
  const purchaseId = c.req.query("purchaseId");
  if (!purchaseId) {
    return c.text("purchaseId is required.", 400);
  }

  const purchaseRepository = createD1PurchaseRepository(c.env.DB);
  const purchase = await purchaseRepository.findById(purchaseId);

  if (!purchase) {
    return c.text("Purchase not found.", 404);
  }

  if (purchase.status !== "paid") {
    if (shouldRenderTestCheckout(c, purchaseId, purchase.stripeSessionId)) {
      return c.html(
        <Layout
          title="おくやみ手続きナビ | テスト決済"
          description="テストモードの決済完了画面です。"
        >
          <section class="purchase-panel purchase-panel--test">
            <style>{purchaseSuccessStyles}</style>
            <p class="purchase-kicker">TEST MODE</p>
            <h1 class="purchase-title">テスト決済を完了する</h1>
            <p class="purchase-copy">この画面は PAYMENT_MODE=test のときだけ表示されます。</p>
            <p class="purchase-note">本番では Stripe Checkout に遷移します。</p>
            <form class="purchase-form" method="post" action="/purchase/success">
              <input name="purchaseId" type="hidden" value={purchaseId} />
              <input name="sessionId" type="hidden" value={purchase.stripeSessionId ?? ""} />
              <button class="purchase-button" type="submit">
                テスト決済を完了する
              </button>
            </form>
          </section>
        </Layout>
      );
    }

    return c.html(
      <Layout
        title="おくやみ手続きナビ | 決済確認中"
        description="Stripe 決済の反映を確認しています。"
      >
        <section class="purchase-panel purchase-panel--pending">
          <style>{purchaseSuccessStyles}</style>
          <p class="purchase-kicker">確認中</p>
          <h1 class="purchase-title">お支払い確認を待っています</h1>
          <p class="purchase-copy">
            Webhook の到着を待っています。数秒から数分後にこの画面を再読み込みしてください。
          </p>
        </section>
      </Layout>
    );
  }

  const downloadToken = await createDownloadToken(c.env, purchase.id);

  return c.html(
    <Layout
      title="おくやみ手続きナビ | 購入完了"
      description="有料版のダウンロードリンクを表示しています。"
    >
      <section class="purchase-panel">
        <style>{purchaseSuccessStyles}</style>
        <p class="purchase-kicker">SUCCESS</p>
        <h1 class="purchase-title">お支払いを確認しました</h1>
        <p class="purchase-copy">有料版のダウンロードリンクを用意しました。</p>
        {c.req.query("resent") === "1" && (
          <p class="purchase-status" role="status">
            ダウンロードリンクを再送しました。
          </p>
        )}
        <div class="purchase-primary">
          <a class="purchase-button" href={`/download?token=${downloadToken}`}>
            有料版のダウンロード
          </a>
          <p class="purchase-note">リンクの有効期限内であれば、そのまま PDF を取得できます。</p>
        </div>
        <section class="purchase-secondary">
          <p class="purchase-note">必要なら、同じリンクを購入時のメールアドレスへ再送できます。</p>
          <form
            action="/resend?redirect=1"
            class="resend-form"
            method="post"
          >
            <input name="purchaseId" type="hidden" value={purchase.id} />
            <label class="purchase-label" htmlFor="resend-email">
              購入時のメールアドレス
            </label>
            <input
              class="purchase-input"
              id="resend-email"
              name="email"
              type="email"
              required
              value={purchase.email ?? ""}
            />
            <button class="resend-button" type="submit">
              ダウンロードリンクを再送する
            </button>
          </form>
        </section>
      </section>
    </Layout>
  );
}

export async function completeTestPurchase(c: Context<AppContextEnv>) {
  if (c.env.PAYMENT_MODE !== "test") {
    return c.notFound();
  }

  const formData = await c.req.formData();
  const purchaseId = getFormValue(formData, "purchaseId");
  const sessionId = getFormValue(formData, "sessionId");

  if (!purchaseId || !sessionId) {
    return c.text("Invalid test payment submission.", 400);
  }

  const purchaseRepository = createD1PurchaseRepository(c.env.DB);
  const purchase = await purchaseRepository.findById(purchaseId);
  if (!purchase || purchase.stripeSessionId !== sessionId) {
    return c.text("Purchase not found.", 404);
  }

  const result = await processStripeWebhookEvent(c.env, {
    waitUntil() {
      return undefined;
    }
  }, {
    id: `evt_test_checkout_${sessionId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        metadata: {
          purchaseId
        }
      }
    }
  });

  if (result.status !== 200) {
    return c.text(result.message, 500);
  }

  return c.redirect(`/purchase/success?purchaseId=${purchaseId}`, 303);
}

async function createDownloadToken(env: AppContextEnv["Bindings"], purchaseId: string) {
  const downloadSecret = readRequiredEnv(env, "DOWNLOAD_TOKEN_SECRET");
  const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS);

  return signDownloadToken(
    {
      purchase_id: purchaseId,
      expires_at: expiresAt.toISOString()
    },
    downloadSecret
  );
}

function shouldRenderTestCheckout(
  c: Context<AppContextEnv>,
  purchaseId: string,
  stripeSessionId: string | null
): boolean {
  return (
    c.env.PAYMENT_MODE === "test" &&
    c.req.query("purchaseId") === purchaseId &&
    c.req.query("testSessionId") === stripeSessionId &&
    typeof stripeSessionId === "string" &&
    stripeSessionId.length > 0
  );
}

function getFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : null;
}
