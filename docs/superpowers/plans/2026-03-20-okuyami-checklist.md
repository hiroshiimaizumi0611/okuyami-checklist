# Okuyami Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Japanese bereavement-procedure web app that gives users a free personalized summary and sells a paid PDF checklist.

**Architecture:** Build a single Cloudflare Workers application with Hono that serves the landing page, diagnosis form, free results, Stripe checkout, and paid download flow. Keep diagnosis content in versioned JSON files and run a deterministic rule engine over user answers so results are explainable and easy to update. Persist purchase state and analytics events in D1, and regenerate the PDF from a stored result snapshot so download and resend behavior stay consistent.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, D1, Stripe Checkout + webhooks, `pdf-lib`, Resend, Vitest, Playwright

---

## Assumptions

- New project root: `okuyami-checklist/`
- Deployment target: Cloudflare Workers
- Payments: Stripe Checkout
- Transactional email: Resend
- Content source of truth: JSON files committed to git
- Initial launch uses nationwide common procedures only, not municipality-specific branching

## Planned File Structure

### Project root

- Create: `okuyami-checklist/package.json`
- Create: `okuyami-checklist/tsconfig.json`
- Create: `okuyami-checklist/wrangler.toml`
- Create: `okuyami-checklist/vitest.config.ts`
- Create: `okuyami-checklist/playwright.config.ts`
- Create: `okuyami-checklist/.dev.vars.example`
- Create: `okuyami-checklist/README.md`

### App and routes

- Create: `okuyami-checklist/src/index.ts`
- Create: `okuyami-checklist/src/server/app.ts`
- Create: `okuyami-checklist/src/server/routes/health.ts`
- Create: `okuyami-checklist/src/server/routes/landing.tsx`
- Create: `okuyami-checklist/src/server/routes/diagnosis.tsx`
- Create: `okuyami-checklist/src/server/routes/results.tsx`
- Create: `okuyami-checklist/src/server/routes/checkout.ts`
- Create: `okuyami-checklist/src/server/routes/purchase-success.tsx`
- Create: `okuyami-checklist/src/server/routes/webhooks.ts`
- Create: `okuyami-checklist/src/server/routes/download.ts`
- Create: `okuyami-checklist/src/server/routes/resend.ts`
- Create: `okuyami-checklist/src/server/routes/articles.tsx`

### UI

- Create: `okuyami-checklist/src/ui/layout.tsx`
- Create: `okuyami-checklist/src/ui/components/hero.tsx`
- Create: `okuyami-checklist/src/ui/components/diagnosis-form.tsx`
- Create: `okuyami-checklist/src/ui/components/result-summary.tsx`
- Create: `okuyami-checklist/src/ui/components/article-layout.tsx`

### Domain and content

- Create: `okuyami-checklist/content/questions.json`
- Create: `okuyami-checklist/content/procedures.json`
- Create: `okuyami-checklist/content/result-rules.json`
- Create: `okuyami-checklist/content/articles/parent-died-first-steps.md`
- Create: `okuyami-checklist/content/articles/inheritance-renunciation-deadline.md`
- Create: `okuyami-checklist/content/articles/death-procedure-checklist.md`
- Create: `okuyami-checklist/content/articles/national-pension-death-report.md`
- Create: `okuyami-checklist/content/articles/health-insurance-bereavement-checklist.md`
- Create: `okuyami-checklist/src/domain/types.ts`
- Create: `okuyami-checklist/src/domain/load-content.ts`
- Create: `okuyami-checklist/src/domain/diagnosis-engine.ts`
- Create: `okuyami-checklist/src/domain/result-snapshot.ts`
- Create: `okuyami-checklist/src/lib/download-token.ts`
- Create: `okuyami-checklist/src/lib/snapshot-token.ts`

### Services and persistence

- Create: `okuyami-checklist/src/lib/env.ts`
- Create: `okuyami-checklist/src/lib/analytics.ts`
- Create: `okuyami-checklist/src/lib/download-token.ts`
- Create: `okuyami-checklist/src/lib/markdown.ts`
- Create: `okuyami-checklist/src/services/payments/stripe-client.ts`
- Create: `okuyami-checklist/src/services/pdf/checklist-pdf-model.ts`
- Create: `okuyami-checklist/src/services/pdf/checklist-pdf.ts`
- Create: `okuyami-checklist/src/services/email/email-service.ts`
- Create: `okuyami-checklist/src/services/email/resend-email-service.ts`
- Create: `okuyami-checklist/src/repositories/purchase-repository.ts`
- Create: `okuyami-checklist/src/repositories/event-repository.ts`
- Create: `okuyami-checklist/src/repositories/d1-purchase-repository.ts`
- Create: `okuyami-checklist/src/repositories/d1-event-repository.ts`
- Create: `okuyami-checklist/migrations/0001_initial.sql`

### Tests

- Create: `okuyami-checklist/tests/routes/health.test.ts`
- Create: `okuyami-checklist/tests/routes/landing.test.tsx`
- Create: `okuyami-checklist/tests/routes/diagnosis.test.tsx`
- Create: `okuyami-checklist/tests/routes/results.test.tsx`
- Create: `okuyami-checklist/tests/routes/checkout.test.ts`
- Create: `okuyami-checklist/tests/routes/purchase-success.test.tsx`
- Create: `okuyami-checklist/tests/routes/webhooks.test.ts`
- Create: `okuyami-checklist/tests/routes/download.test.ts`
- Create: `okuyami-checklist/tests/routes/resend.test.ts`
- Create: `okuyami-checklist/tests/routes/articles.test.tsx`
- Create: `okuyami-checklist/tests/domain/diagnosis-engine.test.ts`
- Create: `okuyami-checklist/tests/repositories/d1-purchase-repository.test.ts`
- Create: `okuyami-checklist/tests/repositories/d1-event-repository.test.ts`
- Create: `okuyami-checklist/tests/services/checklist-pdf.test.ts`
- Create: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`
- Create: `okuyami-checklist/tests/fixtures/answers.ts`

## Task 1: Bootstrap the Worker app and test harness

**Files:**
- Create: `okuyami-checklist/package.json`
- Create: `okuyami-checklist/tsconfig.json`
- Create: `okuyami-checklist/wrangler.toml`
- Create: `okuyami-checklist/vitest.config.ts`
- Create: `okuyami-checklist/playwright.config.ts`
- Create: `okuyami-checklist/.dev.vars.example`
- Create: `okuyami-checklist/src/index.ts`
- Create: `okuyami-checklist/src/server/app.ts`
- Create: `okuyami-checklist/src/server/routes/health.ts`
- Test: `okuyami-checklist/tests/routes/health.test.ts`

- [ ] **Step 1: Write the failing health-route test**

```ts
import { describe, expect, it } from "vitest";
import { app } from "../../src/server/app";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run the test to verify the app does not exist yet**

Run: `cd okuyami-checklist && npm run test -- tests/routes/health.test.ts`

Expected: FAIL with missing module or missing `app` export.

- [ ] **Step 3: Add the minimal Worker scaffold**

```ts
import { Hono } from "hono";

export const app = new Hono();
app.get("/health", (c) => c.json({ ok: true }));
```

Also add scripts for `dev`, `test`, `test:e2e`, `typecheck`, and `deploy`, plus a `wrangler.toml` with `DB` binding placeholders.
Add `.dev.vars.example` entries for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SNAPSHOT_TOKEN_SECRET`, and `APP_URL`.
Install runtime deps explicitly: `hono`, `stripe`, `pdf-lib`, `resend`, `marked`.
Install test/dev deps explicitly: `typescript`, `wrangler`, `vitest`, `@playwright/test`, `miniflare`, and `@cloudflare/vitest-pool-workers` as the Worker test adapter for `app.request()`.

- [ ] **Step 4: Run the route test and typecheck**

Run: `cd okuyami-checklist && npm run test -- tests/routes/health.test.ts && npm run typecheck`

Expected: PASS for the health test and no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: scaffold okuyami checklist worker"
```

## Task 2: Implement structured content loading and the diagnosis engine

**Files:**
- Create: `okuyami-checklist/content/questions.json`
- Create: `okuyami-checklist/content/procedures.json`
- Create: `okuyami-checklist/content/result-rules.json`
- Create: `okuyami-checklist/src/domain/types.ts`
- Create: `okuyami-checklist/src/domain/load-content.ts`
- Create: `okuyami-checklist/src/domain/diagnosis-engine.ts`
- Create: `okuyami-checklist/tests/domain/diagnosis-engine.test.ts`
- Create: `okuyami-checklist/tests/fixtures/answers.ts`

- [ ] **Step 1: Write failing tests for result selection, ordering, and escalation**

```ts
it("returns time-ordered procedures for a basic bereavement case", () => {
  const result = runDiagnosis(fixtures.basicCase);
  expect(result.sections[0].slug).toBe("first-two-weeks");
  expect(result.procedures.map((item) => item.id)).toContain("national-pension-loss-report");
});

it("flags expert escalation when debt risk is present", () => {
  const result = runDiagnosis(fixtures.debtRiskCase);
  expect(result.escalations).toContain("expert-consultation");
});
```

- [ ] **Step 2: Run the domain test file**

Run: `cd okuyami-checklist && npm run test -- tests/domain/diagnosis-engine.test.ts`

Expected: FAIL because content loaders and `runDiagnosis` are not implemented.

- [ ] **Step 3: Add content JSON and the deterministic engine**

Implement:
- `questions.json` with the 14 approved diagnosis prompts and the exact fields `id`, `text`, `answer_type`, `options`, `order`, and `help_text`
- `procedures.json` with nationwide common procedure entries and the exact fields `id`, `name`, `short_description`, `deadline_bucket`, `official_link`, `caution_text`, `national_or_local_flag`, `requires_expert_flag`, `required_items_hint`, `confirmation_source_type`, and `updated_at`
- `result-rules.json` with the exact fields `id`, `condition_expression`, `procedure_id`, `priority`, `visibility_reason`, and `escalation_flag`
- `runDiagnosis()` that loads content, matches rules, sorts by deadline bucket, and annotates each procedure with a display reason

```ts
export function runDiagnosis(input: DiagnosisAnswers): DiagnosisResult {
  const matchedRules = rules.filter((rule) => matches(rule.condition, input));
  const procedures = sortByDeadline(dedupeByProcedure(matchedRules, proceduresById));
  return buildResult(procedures, matchedRules, input);
}
```

- [ ] **Step 4: Run the domain tests**

Run: `cd okuyami-checklist && npm run test -- tests/domain/diagnosis-engine.test.ts`

Expected: PASS with the basic-case and debt-risk assertions green.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/content okuyami-checklist/src/domain okuyami-checklist/tests/domain okuyami-checklist/tests/fixtures
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add diagnosis content and rule engine"
```

## Task 3: Build the landing page and diagnosis form

**Files:**
- Create: `okuyami-checklist/src/ui/layout.tsx`
- Create: `okuyami-checklist/src/ui/components/hero.tsx`
- Create: `okuyami-checklist/src/ui/components/diagnosis-form.tsx`
- Create: `okuyami-checklist/src/server/routes/landing.tsx`
- Create: `okuyami-checklist/src/server/routes/diagnosis.tsx`
- Modify: `okuyami-checklist/src/server/app.ts`
- Test: `okuyami-checklist/tests/routes/landing.test.tsx`
- Test: `okuyami-checklist/tests/routes/diagnosis.test.tsx`

- [ ] **Step 1: Write failing route tests for the landing page and diagnosis page**

```ts
it("renders the landing CTA", async () => {
  const res = await app.request("/");
  const html = await res.text();
  expect(res.status).toBe(200);
  expect(html).toContain("3分で必要な手続きを整理");
});

it("renders all diagnosis questions", async () => {
  const res = await app.request("/diagnosis");
  const html = await res.text();
  expect(html).toContain("亡くなった方との関係");
  expect(html).toContain("借金や保証債務の不安があるか");
});
```

- [ ] **Step 2: Run the route tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/landing.test.tsx tests/routes/diagnosis.test.tsx`

Expected: FAIL because the routes and UI components are missing.

- [ ] **Step 3: Implement the SSR pages and shared layout**

Implement:
- a simple Japanese landing page with trust copy and diagnosis CTA
- a `/diagnosis` route that renders the 14-question form from `questions.json`
- a shared layout with mobile-first spacing and no client-side framework requirement for MVP

```ts
app.get("/", renderLandingPage);
app.get("/diagnosis", renderDiagnosisForm);
```

- [ ] **Step 4: Run route tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/landing.test.tsx tests/routes/diagnosis.test.tsx`

Expected: PASS and HTML contains the expected Japanese copy.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/src/ui okuyami-checklist/src/server/routes/landing.tsx okuyami-checklist/src/server/routes/diagnosis.tsx okuyami-checklist/tests/routes/landing.test.tsx okuyami-checklist/tests/routes/diagnosis.test.tsx
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add landing page and diagnosis form"
```

## Task 4: Validate answers and render the free result summary

**Files:**
- Create: `okuyami-checklist/src/server/routes/results.tsx`
- Create: `okuyami-checklist/src/ui/components/result-summary.tsx`
- Create: `okuyami-checklist/src/domain/result-snapshot.ts`
- Create: `okuyami-checklist/src/lib/download-token.ts`
- Create: `okuyami-checklist/src/lib/snapshot-token.ts`
- Modify: `okuyami-checklist/src/server/routes/diagnosis.tsx`
- Modify: `okuyami-checklist/src/server/app.ts`
- Test: `okuyami-checklist/tests/routes/results.test.tsx`

- [ ] **Step 1: Write failing tests for valid submission, invalid submission, and escalation messaging**

```ts
it("renders deadline buckets for a valid submission", async () => {
  const res = await app.request("/results", {
    method: "POST",
    body: new URLSearchParams(validAnswers),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  const html = await res.text();
  expect(res.status).toBe(200);
  expect(html).toContain("まず1〜2週間で確認したいこと");
  expect(html).toContain("専門家相談を検討");
});
```

- [ ] **Step 2: Run the results test**

Run: `cd okuyami-checklist && npm run test -- tests/routes/results.test.tsx`

Expected: FAIL because `/results` does not exist and the form is not validated.

- [ ] **Step 3: Implement result submission and rendering**

Implement:
- server-side form parsing and validation
- `runDiagnosis()` call
- free summary output with deadline sections, short reasons, official links, and risk cards
- snapshot serialization for the exact result set that paid delivery will later use
- HMAC-signed snapshot token creation so `/checkout` can trust the submitted result payload
- a hidden checkout form field that carries the signed token from the results page into the paid flow
- visible safety copy stating this is general guidance and that official links must be checked before acting

```ts
const result = runDiagnosis(parseDiagnosisSubmission(formData));
const snapshot = createResultSnapshot(result);
const snapshotToken = signSnapshotToken(snapshot, env.SNAPSHOT_TOKEN_SECRET);
return c.html(<ResultSummary result={result} snapshot={snapshot} snapshotToken={snapshotToken} />);
```

- [ ] **Step 4: Run route tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/results.test.tsx`

Expected: PASS for valid and invalid submissions.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/src/server/routes/results.tsx okuyami-checklist/src/ui/components/result-summary.tsx okuyami-checklist/src/domain/result-snapshot.ts okuyami-checklist/src/lib/snapshot-token.ts okuyami-checklist/tests/routes/results.test.tsx
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add free diagnosis results"
```

## Task 5: Add D1 persistence for purchases and analytics events

**Files:**
- Create: `okuyami-checklist/migrations/0001_initial.sql`
- Create: `okuyami-checklist/src/repositories/purchase-repository.ts`
- Create: `okuyami-checklist/src/repositories/event-repository.ts`
- Create: `okuyami-checklist/src/repositories/d1-purchase-repository.ts`
- Create: `okuyami-checklist/src/repositories/d1-event-repository.ts`
- Create: `okuyami-checklist/src/lib/env.ts`
- Create: `okuyami-checklist/src/lib/analytics.ts`
- Modify: `okuyami-checklist/wrangler.toml`
- Test: `okuyami-checklist/tests/repositories/d1-purchase-repository.test.ts`
- Test: `okuyami-checklist/tests/repositories/d1-event-repository.test.ts`

- [ ] **Step 1: Write failing tests for event logging and purchase snapshot persistence**

```ts
it("stores a pending purchase with a result snapshot", async () => {
  const id = await purchaseRepository.createPending({
    email: "test@example.com",
    snapshotJson: JSON.stringify(snapshot),
  });
  expect(id).toMatch(/^pur_/);
});

it("stores an analytics event payload", async () => {
  await eventRepository.track("diagnosis_completed", { procedureCount: 4 });
  const events = await eventRepository.listRecent();
  expect(events[0]?.eventName).toBe("diagnosis_completed");
});
```

- [ ] **Step 2: Run the repository-focused tests**

Run: `cd okuyami-checklist && npm run test -- tests/repositories/d1-purchase-repository.test.ts tests/repositories/d1-event-repository.test.ts`

Expected: FAIL because the repositories and D1 schema do not exist.

- [ ] **Step 3: Add the D1 schema and repository implementations**

Create tables for:
- `purchases`
- `analytics_events`

Include columns for purchase status, email, Stripe session id, result snapshot JSON, timestamps, and event payload JSON.
Also add:
- `delivery_email_sent_at` on `purchases`
- a `processed_webhook_events` table keyed by Stripe event id for idempotency

```sql
create table purchases (
  id text primary key,
  email text,
  stripe_session_id text,
  status text not null,
  snapshot_json text not null,
  created_at text not null,
  paid_at text,
  delivery_email_sent_at text
);
```

- [ ] **Step 4: Run tests and a local migration**

Run: `cd okuyami-checklist && npx wrangler d1 execute DB --local --file=./migrations/0001_initial.sql && npm run test -- tests/repositories/d1-purchase-repository.test.ts tests/repositories/d1-event-repository.test.ts`

Expected: local D1 schema bootstraps successfully, then repository tests PASS against the initialized schema.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/migrations okuyami-checklist/src/repositories okuyami-checklist/src/lib okuyami-checklist/tests/repositories okuyami-checklist/wrangler.toml
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add purchase and analytics persistence"
```

## Task 6: Implement Stripe checkout and paid purchase confirmation

**Files:**
- Create: `okuyami-checklist/src/services/payments/stripe-client.ts`
- Create: `okuyami-checklist/src/server/routes/checkout.ts`
- Create: `okuyami-checklist/src/server/routes/purchase-success.tsx`
- Create: `okuyami-checklist/src/server/routes/webhooks.ts`
- Modify: `okuyami-checklist/src/server/app.ts`
- Test: `okuyami-checklist/tests/routes/checkout.test.ts`
- Test: `okuyami-checklist/tests/routes/purchase-success.test.tsx`
- Test: `okuyami-checklist/tests/routes/webhooks.test.ts`

- [ ] **Step 1: Write failing tests for checkout creation and webhook confirmation**

```ts
it("creates a stripe checkout session from a result snapshot", async () => {
  const res = await app.request("/checkout", { method: "POST", body: new URLSearchParams(checkoutForm) });
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toContain("checkout.stripe.com");
});

it("marks the purchase as paid on checkout.session.completed", async () => {
  const res = await app.request("/webhooks/stripe", {
    method: "POST",
    body: stripePayload,
    headers: stripeHeaders,
  });
  expect(res.status).toBe(200);
});

it("shows a waiting state on success until the webhook marks the purchase paid", async () => {
  const res = await app.request("/purchase/success?purchaseId=pur_pending");
  const html = await res.text();
  expect(html).toContain("入金確認中");
});

it("ignores duplicate webhook deliveries for the same stripe event id", async () => {
  await app.request("/webhooks/stripe", { method: "POST", body: stripePayload, headers: stripeHeaders });
  const second = await app.request("/webhooks/stripe", { method: "POST", body: stripePayload, headers: stripeHeaders });
  expect(second.status).toBe(200);
  expect(emailService.sendPurchaseReadyEmail).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the checkout and webhook tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/checkout.test.ts tests/routes/webhooks.test.ts`

Expected: FAIL because Stripe service wiring is absent.

- [ ] **Step 3: Implement checkout and webhook handlers**

Implement:
- `POST /checkout` that validates email + signed snapshot token, decodes the trusted snapshot, stores it with the pending purchase, and creates a Stripe Checkout session
- add a `PaymentGateway` interface with a real Stripe implementation and a fake test implementation selected by `PAYMENT_MODE=test`
- `PAYMENT_MODE=test` must still persist the purchase, require webhook completion, and issue the same signed download token path as production so E2E covers the real paid-flow logic
- `POST /webhooks/stripe` that verifies the signature and marks the matching purchase paid
- `POST /webhooks/stripe` must be idempotent by recording processed Stripe event ids and only sending the first delivery email if `delivery_email_sent_at` is still null
- `GET /purchase/success` that checks the stored purchase status and either renders a waiting state or shows the paid download CTA with a signed, expiring download token
- `buildPdfLineItem()` must use a named `PAID_PDF_PRICE_JPY = 1480` constant so the monetization amount is fixed and testable
- success and cancel URLs that return to the app

```ts
const snapshot = verifySnapshotToken(snapshotToken, env.SNAPSHOT_TOKEN_SECRET);
const PAID_PDF_PRICE_JPY = 1480;
const session = await paymentGateway.createCheckoutSession({
  mode: "payment",
  line_items: [buildPdfLineItem(PAID_PDF_PRICE_JPY)],
  success_url: `${env.APP_URL}/purchase/success?purchaseId=${purchase.id}`,
  cancel_url: `${env.APP_URL}/results?canceled=1`,
  metadata: { purchaseId: purchase.id },
});
```

- [ ] **Step 4: Run tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/checkout.test.ts tests/routes/purchase-success.test.tsx tests/routes/webhooks.test.ts`

Expected: PASS with Stripe mocked at the service boundary.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/src/services/payments okuyami-checklist/src/server/routes/checkout.ts okuyami-checklist/src/server/routes/purchase-success.tsx okuyami-checklist/src/server/routes/webhooks.ts okuyami-checklist/tests/routes/checkout.test.ts okuyami-checklist/tests/routes/purchase-success.test.tsx okuyami-checklist/tests/routes/webhooks.test.ts
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add stripe checkout flow"
```

## Task 7: Generate the paid PDF and resend delivery email

**Files:**
- Create: `okuyami-checklist/src/services/pdf/checklist-pdf-model.ts`
- Create: `okuyami-checklist/src/services/pdf/checklist-pdf.ts`
- Create: `okuyami-checklist/src/services/email/email-service.ts`
- Create: `okuyami-checklist/src/services/email/resend-email-service.ts`
- Create: `okuyami-checklist/src/server/routes/download.ts`
- Create: `okuyami-checklist/src/server/routes/resend.ts`
- Modify: `okuyami-checklist/src/lib/download-token.ts`
- Modify: `okuyami-checklist/src/server/routes/webhooks.ts`
- Modify: `okuyami-checklist/src/server/app.ts`
- Test: `okuyami-checklist/tests/services/checklist-pdf.test.ts`
- Test: `okuyami-checklist/tests/routes/download.test.ts`
- Test: `okuyami-checklist/tests/routes/resend.test.ts`
- Test: `okuyami-checklist/tests/routes/webhooks.test.ts`

- [ ] **Step 1: Write failing tests for PDF content completeness, automatic email delivery, and authenticated download**

```ts
it("builds a pdf view model with all required checklist fields", () => {
  const model = buildChecklistPdfModel(paidSnapshot);
  expect(model.sections[0].title).toBe("まず1〜2週間で確認したいこと");
  expect(model.sections[0].items[0].requiredItemsHint).toBeTruthy();
  expect(model.sections[0].items[0].officialLink).toContain("http");
  expect(model.expertFlags.length).toBeGreaterThanOrEqual(0);
  expect(model.updatedAtLabel).toContain("更新");
  expect(model.disclaimer).toContain("一般的な案内");
  expect(model.memoLines.length).toBeGreaterThan(0);
});

it("creates a pdf from the validated view model", async () => {
  const bytes = await buildChecklistPdf(buildChecklistPdfModel(paidSnapshot));
  expect(bytes.byteLength).toBeGreaterThan(1000);
});

it("allows download only for paid purchases", async () => {
  const res = await app.request(`/download?token=${signedDownloadToken}`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("application/pdf");
});

it("resends a fresh paid download link to the recorded purchase email", async () => {
  const res = await app.request("/resend", {
    method: "POST",
    body: new URLSearchParams({ purchaseId: "pur_paid", email: "buyer@example.com" }),
  });
  expect(res.status).toBe(200);
  expect(emailService.sendPurchaseReadyEmail).toHaveBeenCalled();
});

it("sends the first paid download email after checkout completion", async () => {
  const res = await app.request("/webhooks/stripe", {
    method: "POST",
    body: stripePayload,
    headers: stripeHeaders,
  });
  expect(res.status).toBe(200);
  expect(emailService.sendPurchaseReadyEmail).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the PDF, webhook, download, and resend tests**

Run: `cd okuyami-checklist && npm run test -- tests/services/checklist-pdf.test.ts tests/routes/download.test.ts tests/routes/resend.test.ts tests/routes/webhooks.test.ts`

Expected: FAIL because PDF generation, email delivery wiring, and download routes do not exist.

- [ ] **Step 3: Implement PDF generation, download, and resend**

Implement:
- `buildChecklistPdfModel()` that maps the stored snapshot into the full paid-tier detail set for each row: procedure name, reason shown, deadline bucket, preparation hints, confirmation source type, official link, memo space, update date label, disclaimer text, and expert escalation flag
- `buildChecklistPdf()` using `pdf-lib`
- `GET /download` that verifies a signed, expiring download token, loads the paid purchase, regenerates the PDF from `snapshot_json`, and streams it
- webhook-driven first email delivery after payment confirmation
- `POST /resend` that sends a fresh download link through Resend after verifying the purchase email

```ts
const { purchaseId } = verifyDownloadToken(token, env.DOWNLOAD_TOKEN_SECRET);
const model = buildChecklistPdfModel(snapshot);
const pdf = await buildChecklistPdf(model);
return new Response(pdf, {
  headers: {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename=\"okuyami-checklist-${purchase.id}.pdf\"`,
  },
});
```

- [ ] **Step 4: Run tests**

Run: `cd okuyami-checklist && npm run test -- tests/services/checklist-pdf.test.ts tests/routes/download.test.ts tests/routes/resend.test.ts tests/routes/webhooks.test.ts`

Expected: PASS and the suite confirms required PDF content, signed-download protection, authenticated delivery, automatic post-purchase email sending, and manual resend behavior.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/src/services/pdf okuyami-checklist/src/services/email okuyami-checklist/src/lib/download-token.ts okuyami-checklist/src/server/routes/download.ts okuyami-checklist/src/server/routes/resend.ts okuyami-checklist/src/server/routes/webhooks.ts okuyami-checklist/tests/services/checklist-pdf.test.ts okuyami-checklist/tests/routes/download.test.ts okuyami-checklist/tests/routes/resend.test.ts okuyami-checklist/tests/routes/webhooks.test.ts
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add paid pdf delivery"
```

## Task 8: Add SEO article pages, analytics instrumentation, and end-to-end coverage

**Files:**
- Create: `okuyami-checklist/src/lib/markdown.ts`
- Create: `okuyami-checklist/src/server/routes/articles.tsx`
- Create: `okuyami-checklist/src/ui/components/article-layout.tsx`
- Create: `okuyami-checklist/content/articles/parent-died-first-steps.md`
- Create: `okuyami-checklist/content/articles/inheritance-renunciation-deadline.md`
- Create: `okuyami-checklist/content/articles/death-procedure-checklist.md`
- Create: `okuyami-checklist/content/articles/national-pension-death-report.md`
- Create: `okuyami-checklist/content/articles/health-insurance-bereavement-checklist.md`
- Modify: `okuyami-checklist/src/server/app.ts`
- Modify: `okuyami-checklist/src/lib/analytics.ts`
- Create: `okuyami-checklist/tests/routes/articles.test.tsx`
- Create: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`
- Modify: `okuyami-checklist/README.md`

- [ ] **Step 1: Write failing tests for article rendering and the full purchase journey**

```ts
it("serves a search-intent article with internal diagnosis CTA", async () => {
  const res = await app.request("/articles/parent-died-first-steps");
  const html = await res.text();
  expect(html).toContain("親が亡くなった直後");
  expect(html).toContain("/diagnosis");
});

it("serves five launch articles for search acquisition", async () => {
  const slugs = [
    "parent-died-first-steps",
    "inheritance-renunciation-deadline",
    "death-procedure-checklist",
    "national-pension-death-report",
    "health-insurance-bereavement-checklist",
  ];
  const pages = await Promise.all(slugs.map((slug) => app.request(`/articles/${slug}`)));
  expect(pages.every((res) => res.status === 200)).toBe(true);
});
```

```ts
test("user can complete diagnosis, purchase the pdf, and resend the link", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "無料で診断する" }).click();
  await page.getByLabel("亡くなった方との関係").selectOption("parent");
  await page.getByRole("button", { name: "結果を見る" }).click();
  await expect(page.getByText("まず1〜2週間で確認したいこと")).toBeVisible();
  await expect(page.getByText("一般的な案内")).toBeVisible();
  await page.getByLabel("メールアドレス").fill("buyer@example.com");
  await page.getByRole("button", { name: "詳細PDFを購入する" }).click();
  // In E2E, PAYMENT_MODE=test returns an in-app success path instead of leaving for Stripe.
  await request.post("/webhooks/stripe", { data: mockStripeCheckoutCompletedPayload });
  await page.goto("/purchase/success?purchaseId=pur_paid");
  await page.getByRole("link", { name: "PDFをダウンロード" }).click();
  await page.getByRole("button", { name: "メールで再送する" }).click();
  await expect(page.getByText("再送しました")).toBeVisible();
});
```

- [ ] **Step 2: Run article and E2E tests**

Run: `cd okuyami-checklist && npm run test -- tests/routes/articles.test.tsx && npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`

Expected: FAIL because article routes, analytics hooks, and the complete user flow are not fully wired.

- [ ] **Step 3: Implement article pages, analytics events, and README launch docs**

Implement:
- static article routing from five launch markdown files using `marked` to convert trusted local markdown to HTML on the server
- event tracking for `landing_view`, `diagnosis_started`, `diagnosis_completed`, `checkout_started`, and `purchase_completed`
- a README section covering local D1 setup, Stripe webhook forwarding, Resend configuration, and test commands
- an end-to-end paid-flow test covering snapshot token creation, checkout creation, webhook completion, signed download, and resend

```ts
await analytics.track("diagnosis_completed", {
  resultCount: result.procedures.length,
  escalationCount: result.escalations.length,
});
```

- [ ] **Step 4: Run the full verification set**

Run: `cd okuyami-checklist && npm run test && npm run typecheck && npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`

Expected: PASS for unit, route, typecheck, and end-to-end coverage.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents add okuyami-checklist/content/articles okuyami-checklist/src/server/routes/articles.tsx okuyami-checklist/src/ui/components/article-layout.tsx okuyami-checklist/src/lib/analytics.ts okuyami-checklist/tests/routes/articles.test.tsx okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts okuyami-checklist/README.md
git -C /Users/hiroshiimaizumi/Documents commit -m "feat: add launch content and full flow coverage"
```

## Final Verification

- [ ] Run: `cd okuyami-checklist && npm run test`
- [ ] Run: `cd okuyami-checklist && npm run typecheck`
- [ ] Run: `cd okuyami-checklist && npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`
- [ ] Run: `cd okuyami-checklist && npx wrangler deploy --dry-run`
- [ ] Confirm the app can produce:
  - a free diagnosis result with deadline sections
  - a Stripe checkout redirect
  - a paid PDF download
  - an email resend for a paid purchase
  - at least five indexable article pages with diagnosis CTAs

## Execution Notes

- Do not add municipality-specific procedure branching in the first implementation pass.
- Keep the diagnosis engine deterministic; do not add LLM-based answer generation.
- Any legal or tax guidance must stay at the “general information + official source link + expert escalation” line.
- If PDF formatting becomes a time sink, simplify the visual design before changing the delivery requirement.
- Use frequent commits exactly as listed so review checkpoints stay small.
