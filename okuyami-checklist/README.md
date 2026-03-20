# okuyami-checklist

おくやみ手続きの一般案内を、無料診断と有料 PDF 配布フローで整理する Cloudflare Workers アプリです。

## Local Setup

1. 依存関係を入れます。

```bash
npm install
```

2. `.dev.vars.example` を `.dev.vars` にコピーして値を入れます。

```bash
cp .dev.vars.example .dev.vars
```

必要な値:

- `APP_URL=http://localhost:8787`
- `SNAPSHOT_TOKEN_SECRET`
- `DOWNLOAD_TOKEN_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `PAYMENT_MODE=test`

3. ローカル D1 にマイグレーションを適用します。

```bash
npx wrangler d1 migrations apply DB --local
```

4. 開発サーバーを起動します。

```bash
npm run dev
```

## Stripe Webhooks

ローカルで本物の Stripe Checkout を試す場合は `PAYMENT_MODE=live` にして、別ターミナルで webhook を転送します。

```bash
stripe listen --forward-to http://127.0.0.1:8787/webhooks/stripe
```

表示された signing secret を `.dev.vars` の `STRIPE_WEBHOOK_SECRET` に入れてから `npm run dev` を再起動してください。

`PAYMENT_MODE=test` のときはアプリ内のテスト決済画面から同じ完了処理を通すため、外部 Stripe 画面なしで購入完了、ダウンロード、再送まで確認できます。

## Resend

Resend API キーを `.dev.vars` の `RESEND_API_KEY` に設定してください。ローカル確認で実メールを避けたい場合は、ルートテストや E2E ではテストモード経由の疑似配信を使い、実配送の確認は Resend の検証済み送信元でのみ行ってください。

## Test Commands

ユニットとルートテスト:

```bash
npm run test
```

型チェック:

```bash
npm run typecheck
```

Playwright ブラウザの初回セットアップ:

```bash
npx playwright install
```

有料フロー E2E:

```bash
APP_URL=http://127.0.0.1:8787 \
SNAPSHOT_TOKEN_SECRET=dev-snapshot-secret \
DOWNLOAD_TOKEN_SECRET=dev-download-secret \
STRIPE_SECRET_KEY=sk_test_local \
STRIPE_WEBHOOK_SECRET=whsec_local \
RESEND_API_KEY=resend_local \
PAYMENT_MODE=test \
npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts
```

E2E の前に一度ローカル D1 マイグレーションを流しておくこと:

```bash
npx wrangler d1 migrations apply DB --local
```
