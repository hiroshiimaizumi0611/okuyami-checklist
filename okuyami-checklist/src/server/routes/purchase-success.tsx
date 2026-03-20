import type { Context } from "hono";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { readRequiredEnv, type AppContextEnv } from "../../lib/env";
import { signDownloadToken } from "../../lib/download-token";
import { processStripeWebhookEvent } from "./webhooks";
import { Layout } from "../../ui/layout";

const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const purchaseSuccessStyles = `
  .purchase-panel {
    background: var(--paper-soft);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
  }

  .purchase-panel h1 {
    margin: 0 0 10px;
    font-size: 30px;
    line-height: 1.25;
  }

  .purchase-panel p {
    margin: 0 0 12px;
  }

  .purchase-button,
  .resend-button {
    display: inline-block;
    padding: 11px 18px;
    border-radius: 999px;
    background: var(--signal);
    color: #fff;
    text-decoration: none;
    border: none;
    cursor: pointer;
    font: inherit;
    font-weight: 700;
  }

  .purchase-form,
  .resend-form {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .resend-form {
    max-width: 420px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .purchase-input {
    min-height: 40px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    font: inherit;
  }

  .purchase-status {
    margin-top: 10px;
    font-size: 14px;
    color: var(--ink-soft);
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
          <section class="purchase-panel">
            <style>{purchaseSuccessStyles}</style>
            <h1>テスト決済を完了する</h1>
            <p>この画面は PAYMENT_MODE=test のときだけ表示されます。</p>
            <p>本番では Stripe Checkout に遷移します。</p>
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
        <section class="purchase-panel">
          <style>{purchaseSuccessStyles}</style>
          <h1>決済の反映を確認中です</h1>
          <p>Webhook の到着を待っています。数秒から数分後にこの画面を再読み込みしてください。</p>
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
        <h1>お支払いを確認しました</h1>
        <p>有料版のダウンロードリンクを用意しました。</p>
        {c.req.query("resent") === "1" && (
          <p class="purchase-status" role="status">
            ダウンロードリンクを再送しました。
          </p>
        )}
        <p>
          <a class="purchase-button" href={`/download?token=${downloadToken}`}>
            有料版のダウンロード
          </a>
        </p>
        <form
          action="/resend?redirect=1"
          class="resend-form"
          method="post"
        >
          <input name="purchaseId" type="hidden" value={purchase.id} />
          <label htmlFor="resend-email">購入時のメールアドレス</label>
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
