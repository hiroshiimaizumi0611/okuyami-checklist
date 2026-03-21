import type { Context } from "hono";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { readRequiredEnv, type AppContextEnv } from "../../lib/env";
import { signDownloadToken } from "../../lib/download-token";
import { processStripeWebhookEvent } from "./webhooks";
import { Layout } from "../../ui/layout";

const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const PURCHASE_SUCCESS_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-LeOD5wDcaXUINfQd7n_ipFZfeQZYR9u4M7RuTKnh--K10ulTTKw95car-iXd94sHw13zBWlk4M1c0dZS9h0nVvR0jGhSEl-U9vWXzVQqTNtEcxiD5ojpEpRPFmwAoMcsF3dy8QdOfpuPrCd-4jlVf2KsKMS8_zGx35bVZEoP5go1i6sahDAyumEoonRMZRrZcAQaszIuEwQ6ouPB5ykLnBc-bcnUe6akVNTj4XnZBFiybFFDZNCQrIezp7xfoVp08VUQ--9n0u8h";

const purchaseSuccessStyles = `
  .purchase-page {
    padding: 34px 20px 92px;
  }

  .purchase-shell {
    max-width: 1280px;
    margin: 0 auto;
  }

  .purchase-grid {
    display: grid;
    gap: 18px;
    align-items: stretch;
  }

  .purchase-hero {
    position: relative;
    overflow: hidden;
    min-height: 420px;
    background: linear-gradient(135deg, rgba(112, 87, 60, 0.88), rgba(141, 116, 83, 0.72));
    color: #ffffff;
  }

  .purchase-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.9) contrast(1.02);
  }

  .purchase-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(28, 25, 22, 0.22), rgba(28, 25, 22, 0.72));
  }

  .purchase-hero-content {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 28px;
  }

  .purchase-kicker {
    color: rgba(255, 255, 255, 0.82);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  .purchase-title {
    margin: 0;
    max-width: 8em;
    font-family: var(--font-display);
    font-size: clamp(34px, 5vw, 60px);
    line-height: 1.06;
    letter-spacing: -0.06em;
  }

  .purchase-copy,
  .purchase-note {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.9;
  }

  .purchase-copy--inverse,
  .purchase-note--inverse {
    color: rgba(255, 255, 255, 0.88);
  }

  .purchase-download {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 66px;
    padding: 0 22px;
    background: var(--accent);
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    transition: background-color 160ms ease;
  }

  .purchase-download:hover,
  .purchase-download:focus-visible {
    background: var(--accent-strong);
  }

  .purchase-download::after {
    content: "↓";
    font-size: 18px;
  }

  .purchase-footnote {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(28, 25, 22, 0.38);
    font-size: 12px;
    line-height: 1.7;
  }

  .purchase-footnote::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    flex: none;
  }

  .purchase-side {
    display: grid;
    gap: 18px;
    align-content: start;
    padding: 28px 24px;
    background: var(--surface);
    border: 1px solid rgba(214, 205, 194, 0.55);
  }

  .purchase-side-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px;
    line-height: 1.18;
    letter-spacing: -0.05em;
  }

  .purchase-status {
    margin: 0;
    padding: 14px 16px;
    background: rgba(241, 224, 205, 0.35);
    border-left: 3px solid var(--accent);
    color: var(--text);
    font-size: 14px;
    line-height: 1.7;
  }

  .purchase-form,
  .resend-form {
    display: grid;
    gap: 12px;
  }

  .purchase-label {
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }

  .purchase-input {
    width: 100%;
    min-height: 54px;
    padding: 0;
    border: 0;
    border-bottom: 1px solid rgba(214, 205, 194, 0.9);
    background: transparent;
    color: var(--text);
    font-size: 15px;
  }

  .purchase-input:focus-visible {
    outline: none;
    border-bottom-color: var(--accent);
  }

  .purchase-button,
  .resend-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: 0 22px;
    border: 0;
    background: var(--surface-soft);
    color: var(--accent-strong);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      color 160ms ease;
  }

  .purchase-button:hover,
  .purchase-button:focus-visible,
  .resend-button:hover,
  .resend-button:focus-visible {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .purchase-link {
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
  }

  .purchase-pending {
    display: grid;
    gap: 22px;
    max-width: 1100px;
    margin: 0 auto;
    padding: 54px 0 18px;
    align-items: start;
  }

  .purchase-pending-visual {
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .purchase-pending-box {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    max-width: 220px;
    border: 1px solid rgba(214, 205, 194, 0.5);
    background: var(--surface);
    color: rgba(141, 116, 83, 0.34);
    font-family: var(--font-display);
    font-size: 88px;
    line-height: 1;
  }

  .purchase-pending-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .purchase-pending-label::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--accent);
  }

  .purchase-pending-content {
    display: grid;
    gap: 24px;
    align-content: start;
  }

  .purchase-pending-line {
    display: grid;
    gap: 8px;
  }

  .purchase-pending-rule {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(214, 205, 194, 0.5);
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .purchase-step {
    display: grid;
    gap: 6px;
  }

  .purchase-step strong {
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1;
    letter-spacing: -0.06em;
    color: var(--accent);
  }

  .purchase-step h2 {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .purchase-step p {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.8;
  }

  .purchase-test {
    max-width: 760px;
    margin: 0 auto;
    display: grid;
    gap: 18px;
    padding: 38px 28px;
    background: var(--surface);
    border: 1px solid rgba(214, 205, 194, 0.65);
  }

  @media (min-width: 980px) {
    .purchase-page {
      padding-left: 32px;
      padding-right: 32px;
    }

    .purchase-grid {
      grid-template-columns: minmax(0, 0.88fr) minmax(320px, 0.62fr);
    }

    .purchase-hero-content,
    .purchase-side {
      padding: 40px;
    }

    .purchase-pending {
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 44px;
      padding-top: 70px;
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
          <section class="purchase-page">
            <style>{purchaseSuccessStyles}</style>
            <div class="purchase-test">
              <p class="purchase-label">テスト決済</p>
              <h1 class="purchase-side-title">テスト決済を完了する</h1>
              <p class="purchase-copy">
                この画面は PAYMENT_MODE=test のときだけ表示されます。本番環境では Stripe Checkout に遷移します。
              </p>
              <form class="purchase-form" method="post" action="/purchase/success">
                <input name="purchaseId" type="hidden" value={purchaseId} />
                <input name="sessionId" type="hidden" value={purchase.stripeSessionId ?? ""} />
                <button class="purchase-button" type="submit">
                  テスト決済を完了する
                </button>
              </form>
            </div>
          </section>
        </Layout>
      );
    }

    return c.html(
      <Layout
        title="おくやみ手続きナビ | 決済確認中"
        description="Stripe 決済の反映を確認しています。"
      >
        <section class="purchase-page">
          <style>{purchaseSuccessStyles}</style>
          <div class="purchase-pending">
            <div class="purchase-pending-visual">
              <div class="purchase-pending-box" aria-hidden="true">
                ⌛
              </div>
              <div class="purchase-pending-label">Current status 確認中</div>
            </div>
            <div class="purchase-pending-content">
              <div>
                <h1 class="purchase-side-title">決済情報を確認しています</h1>
                <p class="purchase-copy">
                  完了までしばらくお待ちください。情報の安全を保つため、画面を閉じたりブラウザの戻るボタンを押さないようお願いします。
                </p>
              </div>
              <div class="purchase-pending-line">
                <div class="purchase-pending-rule">
                  <span>Processing request</span>
                  <span>EST. 30s</span>
                </div>
                <div class="purchase-step">
                  <strong>01</strong>
                  <h2>Security check</h2>
                  <p>安全な認証プロセスを確認しています。</p>
                </div>
                <div class="purchase-step" style="opacity:0.45;">
                  <strong>02</strong>
                  <h2>Authorization</h2>
                  <p>カード会社からの応答を待機しています。</p>
                </div>
              </div>
            </div>
          </div>
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
      <section class="purchase-page">
        <style>{purchaseSuccessStyles}</style>
        <div class="purchase-shell purchase-grid">
          <div class="purchase-hero">
            <img alt="" src={PURCHASE_SUCCESS_IMAGE} />
            <div class="purchase-hero-content">
              <div>
                <p class="purchase-kicker">Confirmation</p>
                <h1 class="purchase-title">ご購入手続きが完了いたしました</h1>
                <p class="purchase-copy purchase-copy--inverse">
                  このたびは「おくやみ手続きナビ 有料版」をご購入いただきありがとうございます。診断に沿って印刷しやすいPDFを用意しました。
                </p>
              </div>
              <div>
                <a class="purchase-download" href={`/download?token=${downloadToken}`}>
                  有料版のダウンロード
                </a>
                <div class="purchase-footnote">
                  ダウンロードしたファイルは、そのまま家族共有やメモ書きに使いやすい形で整理されています。
                </div>
              </div>
            </div>
          </div>

          <aside class="purchase-side">
            <div>
              <p class="purchase-label">Resend</p>
              <h2 class="purchase-side-title">リンクが見当たらない場合</h2>
            </div>
            <p class="purchase-copy">
              ご案内メールが見つからない場合は、購入時のメールアドレス宛にダウンロードリンクを再送できます。
            </p>
            {c.req.query("resent") === "1" ? (
              <p class="purchase-status" role="status">
                ダウンロードリンクを再送しました。
              </p>
            ) : null}
            <form action="/resend?redirect=1" class="resend-form" method="post">
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
            <p class="purchase-note">
              取得できない場合は、購入完了から一定時間内に再度この画面へアクセスしてください。
            </p>
            <a class="purchase-link" href="/articles">
              既定商取引について
            </a>
          </aside>
        </div>
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

  const result = await processStripeWebhookEvent(
    c.env,
    {
      waitUntil() {
        return undefined;
      }
    },
    {
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
    }
  );

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
