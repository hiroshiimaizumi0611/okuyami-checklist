# okuyami-checklist Repository

このリポジトリの主対象は、`okuyami-checklist/` 配下にある Cloudflare Workers アプリです。

おくやみ手続きの一般案内を、無料診断と有料 PDF 配布フローで整理する Web サービスを実装しています。

## Main App

- App directory: [`okuyami-checklist/`](./okuyami-checklist)
- App README: [`okuyami-checklist/README.md`](./okuyami-checklist/README.md)

## What Is Included

- 無料診断フォームと期限別の結果表示
- Stripe / test-mode の購入フロー
- 有料 PDF の生成、ダウンロード、メール再送
- SEO 向けの記事ページ
- D1 永続化、analytics 記録、Playwright E2E

## Quick Start

```bash
cd okuyami-checklist
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply DB --local
npm run dev
```

詳しいローカル設定、Stripe webhook、Resend、テスト実行方法は [`okuyami-checklist/README.md`](./okuyami-checklist/README.md) を見てください。
