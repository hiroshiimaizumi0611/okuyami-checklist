# Okuyami Checklist UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the app UI and paid PDF so the full bereavement flow feels minimal, refined, and trustworthy without changing diagnosis, checkout, or download behavior.

**Architecture:** Keep the existing Hono + Workers structure and update presentation in place: shared design tokens in the app shell, screen-specific component rewrites for landing/diagnosis/results/purchase-success, and a print-aware PDF layout update in the existing `pdf-lib` generator. Preserve all route behavior and content semantics while tightening visual hierarchy, state treatment, and document layout according to the approved UI refresh spec.

**Tech Stack:** TypeScript, Hono JSX, Cloudflare Workers, `pdf-lib`, Vitest, Playwright

---

## Inputs

- Spec: `docs/superpowers/specs/2026-03-21-okuyami-ui-refresh-design.md`
- Existing implementation plan: `docs/superpowers/plans/2026-03-20-okuyami-checklist.md`
- Project root: `/Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist`

## Assumptions

- No route URLs, diagnosis questions, result rules, or payment/download behavior change.
- Existing analytics events remain unchanged unless a test proves a regression.
- UI copy can be tightened, but required trust/legal meaning must remain visible per spec.
- The domain presentation model may grow one optional deadline bucket for `期限の確認が必要なこと`, while continuing to hide empty sections and preserving diagnosis match behavior.
- PDF continues to use the embedded `Noto Sans CJK JP subset` asset already in the repository.

## Planned File Structure

### Shared shell and design system

- Modify: `okuyami-checklist/src/ui/layout.tsx`
- Test: `okuyami-checklist/tests/routes/landing.test.tsx`
- Test: `okuyami-checklist/tests/routes/diagnosis.test.tsx`

### Landing and diagnosis surfaces

- Modify: `okuyami-checklist/src/ui/components/hero.tsx`
- Modify: `okuyami-checklist/src/ui/components/diagnosis-form.tsx`
- Modify: `okuyami-checklist/src/server/routes/landing.tsx`
- Modify: `okuyami-checklist/src/server/routes/diagnosis.tsx`
- Test: `okuyami-checklist/tests/routes/landing.test.tsx`
- Test: `okuyami-checklist/tests/routes/diagnosis.test.tsx`

### Results and purchase states

- Modify: `okuyami-checklist/src/domain/types.ts`
- Modify: `okuyami-checklist/src/domain/diagnosis-engine.ts`
- Modify: `okuyami-checklist/src/domain/result-snapshot.ts`
- Modify: `okuyami-checklist/src/ui/components/result-summary.tsx`
- Modify: `okuyami-checklist/src/server/routes/results.tsx`
- Modify: `okuyami-checklist/src/server/routes/purchase-success.tsx`
- Test: `okuyami-checklist/tests/domain/diagnosis-engine.test.ts`
- Test: `okuyami-checklist/tests/domain/result-snapshot.test.ts`
- Test: `okuyami-checklist/tests/routes/results.test.tsx`
- Test: `okuyami-checklist/tests/routes/purchase-success.test.tsx`
- Test: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`

### Paid PDF

- Modify: `okuyami-checklist/src/services/pdf/checklist-pdf-model.ts`
- Modify: `okuyami-checklist/src/services/pdf/checklist-pdf.ts`
- Test: `okuyami-checklist/tests/services/checklist-pdf.test.ts`

### Final verification

- Re-run: `okuyami-checklist/tests/routes/*.test.tsx`
- Re-run: `okuyami-checklist/tests/services/checklist-pdf.test.ts`
- Re-run: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`
- Manual review: landing, diagnosis, results, purchase-success, generated PDF

## Task 1: Replace the shared visual system in the app shell

**Files:**
- Modify: `okuyami-checklist/src/ui/layout.tsx`
- Test: `okuyami-checklist/tests/routes/landing.test.tsx`

- [ ] **Step 1: Tighten the landing-shell test so the old palette cannot survive**

Add assertions that the rendered HTML includes the new shared tokens and no longer includes the old paper/signal token names:

```ts
expect(html).toContain("--bg: #F5F5F2");
expect(html).toContain('--accent: #5B665F');
expect(html).toContain('"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif');
expect(html).not.toContain("--paper:");
expect(html).not.toContain("--signal:");
```

- [ ] **Step 2: Run the landing test to verify it fails against the current shell**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/landing.test.tsx`

Expected: FAIL because `layout.tsx` still emits the old paper/signal token set.

- [ ] **Step 3: Rewrite the shared shell styles in `src/ui/layout.tsx`**

Replace the old warm-paper palette and serif brand treatment with the approved shell tokens, exact font stack, sharper surfaces, editorial labels, link styling, shared button/input/focus defaults, and breakpoint spacing.

Implementation sketch:

```ts
const baseStyles = `
  :root {
    color-scheme: light;
    --bg: #F5F5F2;
    --surface: #FFFFFF;
    --surface-muted: #FAFAF7;
    --text: #111111;
    --text-muted: #666666;
    --text-subtle: #8A8A8A;
    --line: #DCDCD7;
    --line-strong: #111111;
    --accent: #5B665F;
    --accent-strong: #445048;
    --accent-soft: #EEF1EE;
  }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }
`;
```

Keep the existing `Layout` component API unchanged.

- [ ] **Step 4: Re-run the landing test and typecheck**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/landing.test.tsx && npm run typecheck`

Expected: PASS for the landing test and no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/src/ui/layout.tsx okuyami-checklist/tests/routes/landing.test.tsx
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "refactor: replace shared UI design tokens"
```

## Task 2: Refresh the landing page and diagnosis form

**Files:**
- Modify: `okuyami-checklist/src/ui/components/hero.tsx`
- Modify: `okuyami-checklist/src/ui/components/diagnosis-form.tsx`
- Modify: `okuyami-checklist/src/server/routes/landing.tsx`
- Modify: `okuyami-checklist/src/server/routes/diagnosis.tsx`
- Modify: `okuyami-checklist/src/server/routes/results.tsx`
- Test: `okuyami-checklist/tests/routes/landing.test.tsx`
- Test: `okuyami-checklist/tests/routes/diagnosis.test.tsx`
- Test: `okuyami-checklist/tests/routes/results.test.tsx`

- [ ] **Step 1: Make the landing and diagnosis tests demand the new hierarchy**

Update `tests/routes/landing.test.tsx` to assert:

```ts
expect(html).toContain("何を先に確認すべきかを");
expect(html).toContain("一般案内");
expect(html).toContain("個別事情の法的判断");
expect(html).not.toContain("結果ページは次のステップで対応予定です。");
```

Update `tests/routes/diagnosis.test.tsx` to assert:

```ts
expect(html).toContain(`14問中`);
expect(html).not.toContain("進捗表示: 全14問");
expect(html).toContain('class="question-card"');
expect(html).toContain("一般案内です。");
expect(html).toContain("公式確認先");
expect(html).toContain("専門家");
```

Update the invalid-submission route assertion in `tests/routes/results.test.tsx` so it requires the refreshed form shell when `POST /results` returns `400`:

```ts
expect(html).toContain("入力内容を確認してください");
expect(html).toContain(`14問中`);
expect(html).toContain('class="question-card"');
expect(html).toContain("一般案内です。");
```

- [ ] **Step 2: Run the landing + diagnosis tests to verify they fail**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/landing.test.tsx tests/routes/diagnosis.test.tsx`

Expected: FAIL because current copy and progress treatment still reflect the older UI.

- [ ] **Step 3: Rewrite `hero.tsx` for the A2 landing hierarchy**

Implement the approved layout:

- one strong hero headline
- one short supporting paragraph
- one primary CTA
- one quiet trust statement near the hero
- two supporting cards with deadline-order value and general-guidance framing

Implementation sketch:

```tsx
<section class="hero-panel">
  <p class="hero-eyebrow">GENERAL GUIDANCE</p>
  <h1 class="hero-title">何を先に確認すべきかを静かに整理する</h1>
  <p class="hero-lead">...</p>
  <a class="hero-cta" href="/diagnosis">無料で診断を始める</a>
  <p class="hero-trust">一般案内です。実際に進める前に公式確認先を確認してください。</p>
</section>
```

- [ ] **Step 4: Rewrite `diagnosis-form.tsx` around the new question-card rhythm and cover invalid states**

Implement:

- text-based progress label instead of the `<progress>` meter
- sharper card borders and quieter option rows
- 16px input text and 13px helper/disclaimer text
- explicit hover/focus/checked/invalid/disabled states that match the shared token system
- one bottom trust note only

Implementation sketch:

```tsx
<p class="progress-label">{questions.length}問中 1問目から順に回答してください</p>
<fieldset class="question-card">
  <legend>...</legend>
  <p class="question-help">...</p>
  <div class="option-list">...</div>
</fieldset>
```

Keep form field names, method, and action unchanged.

Also update `src/server/routes/results.tsx` only as needed so the invalid-submission branch reuses the refreshed diagnosis presentation instead of falling back to stale wrapper copy.

- [ ] **Step 5: Re-run the focused route tests**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/landing.test.tsx tests/routes/diagnosis.test.tsx`

Expected: PASS with new copy and progress assertions green.

- [ ] **Step 6: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/src/ui/components/hero.tsx okuyami-checklist/src/ui/components/diagnosis-form.tsx okuyami-checklist/src/server/routes/landing.tsx okuyami-checklist/src/server/routes/diagnosis.tsx okuyami-checklist/tests/routes/landing.test.tsx okuyami-checklist/tests/routes/diagnosis.test.tsx
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "refactor: refresh landing and diagnosis UI"
```

## Task 3: Rebuild the result summary hierarchy and paid CTA treatment

**Files:**
- Modify: `okuyami-checklist/src/domain/types.ts`
- Modify: `okuyami-checklist/src/domain/diagnosis-engine.ts`
- Modify: `okuyami-checklist/src/domain/result-snapshot.ts`
- Modify: `okuyami-checklist/src/ui/components/result-summary.tsx`
- Modify: `okuyami-checklist/src/server/routes/results.tsx`
- Test: `okuyami-checklist/tests/domain/diagnosis-engine.test.ts`
- Test: `okuyami-checklist/tests/domain/result-snapshot.test.ts`
- Test: `okuyami-checklist/tests/routes/results.test.tsx`

- [ ] **Step 1: Strengthen the domain and results tests around canonical sections and CTA structure**

Update `tests/domain/diagnosis-engine.test.ts` and `tests/domain/result-snapshot.test.ts` so the presentation model can carry an optional `needs-confirmation` bucket without breaking ordering or snapshot round-trips. Preserve the expectation that existing fixtures still expose `10か月以内に確認すること` and omit empty sections.

Update `tests/routes/results.test.tsx` so it requires:

```ts
expect(html).toContain("まず2週間以内に確認したいこと");
expect(html).toContain("3か月以内に要注意のこと");
expect(html).toContain("10か月以内に確認すること");
expect(html).toContain("期限の確認が必要なこと");
expect(html).toContain("一般的な案内です。");
expect(html).toContain("公式確認先");
expect(html).toContain("有料版 PDF を受け取る");
```

Add one focused escalation assertion so warning treatment copy stays visible:

```ts
expect(html).toContain("専門家相談を検討");
expect(html).toContain("公式窓口や専門家");
```

- [ ] **Step 2: Run the results route tests to verify they fail**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/domain/diagnosis-engine.test.ts tests/domain/result-snapshot.test.ts tests/routes/results.test.tsx`

Expected: FAIL because the current result page still uses the older copy and hierarchy, and the domain model does not yet support the extra presentation bucket.

- [ ] **Step 3: Extend the domain presentation model and snapshot parsing for canonical ordering**

Update `src/domain/types.ts`, `src/domain/diagnosis-engine.ts`, and `src/domain/result-snapshot.ts` so UI/PDF rendering can represent the spec's canonical order:

- `first-two-weeks`
- `within-three-months`
- `within-ten-months`
- `needs-confirmation`
- `expert-consultation`

Map existing diagnosis results into `needs-confirmation` only where the procedure/presentation rules call for it, keep empty sections hidden, and preserve deterministic snapshot parsing/serialization.

- [ ] **Step 4: Rework `result-summary.tsx` to match the canonical section design**

Implement:

- short top summary
- trust/safety block before the first section
- canonical section order from the spec
- default/urgent/warning card treatments
- quieter paid CTA box with email input and single primary action

Implementation sketch:

```tsx
<section class="results-panel">
  <p class="results-eyebrow">RESULT SUMMARY</p>
  <h1 class="results-title">期限順の手続き候補</h1>
  <div class="results-safety">一般的な案内です。...</div>
  {snapshot.sections.map((section) => (
    <section class="result-section" key={section.slug}>
      <h2>{section.title}</h2>
      ...
    </section>
  ))}
  <section class="checkout-box">...</section>
</section>
```

- [ ] **Step 5: Keep the `POST /results` behavior stable while aligning the copy**

Only adjust `src/server/routes/results.tsx` where copy or wrapper structure must support the refreshed component. Do not change parsing, validation, snapshot creation, or analytics behavior.

- [ ] **Step 6: Re-run the domain + results tests**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/domain/diagnosis-engine.test.ts tests/domain/result-snapshot.test.ts tests/routes/results.test.tsx`

Expected: PASS with the new section hierarchy, optional bucket handling, and paid CTA assertions green.

- [ ] **Step 7: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/src/domain/types.ts okuyami-checklist/src/domain/diagnosis-engine.ts okuyami-checklist/src/domain/result-snapshot.ts okuyami-checklist/src/ui/components/result-summary.tsx okuyami-checklist/src/server/routes/results.tsx okuyami-checklist/tests/domain/diagnosis-engine.test.ts okuyami-checklist/tests/domain/result-snapshot.test.ts okuyami-checklist/tests/routes/results.test.tsx
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "refactor: rebuild results page hierarchy"
```

## Task 4: Refresh purchase-success, pending, and test-payment states

**Files:**
- Modify: `okuyami-checklist/src/server/routes/purchase-success.tsx`
- Test: `okuyami-checklist/tests/routes/purchase-success.test.tsx`
- Test: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`

- [ ] **Step 1: Extend the purchase-success test to lock in the new state hierarchy**

Update `tests/routes/purchase-success.test.tsx` so it asserts:

```ts
expect(pendingHtml).toContain("確認中");
expect(pendingHtml).not.toContain("ダウンロードリンクを再送する");
expect(paidHtml).toContain("有料版のダウンロード");
expect(paidHtml).toContain("購入時のメールアドレス");
```

Add a test-mode-specific assertion:

```ts
expect(testHtml).toContain("TEST MODE");
expect(testHtml).toContain("テスト決済を完了する");
```

- [ ] **Step 2: Run the purchase-success tests to verify they fail**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/purchase-success.test.tsx`

Expected: FAIL because the current templates do not expose the new labels/hierarchy.

- [ ] **Step 3: Rework `purchase-success.tsx` templates without changing route behavior**

Implement the approved treatments:

- `pending`: calm waiting surface, no dominant primary CTA
- `test`: `TEST MODE` label + one primary completion button
- `success`: dominant download action, resend form clearly secondary

Implementation sketch:

```tsx
<section class="purchase-panel purchase-panel--success">
  <p class="purchase-kicker">SUCCESS</p>
  <h1>お支払いを確認しました</h1>
  <a class="purchase-button" href={`/download?token=${downloadToken}`}>有料版のダウンロード</a>
  <form class="resend-form" ...>...</form>
</section>
```

- [ ] **Step 4: Re-run the purchase-success test**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/routes/purchase-success.test.tsx`

Expected: PASS with the new state labels and CTA hierarchy.

- [ ] **Step 5: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/src/server/routes/purchase-success.tsx okuyami-checklist/tests/routes/purchase-success.test.tsx
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "refactor: refresh purchase state UI"
```

## Task 5: Redesign the paid PDF as a print-aware checklist

**Files:**
- Modify: `okuyami-checklist/src/services/pdf/checklist-pdf-model.ts`
- Modify: `okuyami-checklist/src/services/pdf/checklist-pdf.ts`
- Test: `okuyami-checklist/tests/services/checklist-pdf.test.ts`

- [ ] **Step 1: Tighten the PDF tests around print-aware layout rules**

Update `tests/services/checklist-pdf.test.ts` to assert:

```ts
expect(model.generatedAtLabel).toContain("作成日:");
expect(drawnStrings).toContain("CHECKLIST");
expect(drawnStrings).toContain("一般案内");
expect(drawnStrings).toContain("公式情報");
```

Add a long-content pagination assertion by building a snapshot with many procedures and expecting multi-page output:

```ts
const pdfDoc = await PDFDocument.load(pdf);
expect(pdfDoc.getPageCount()).toBeGreaterThan(1);
```

- [ ] **Step 2: Run the PDF tests to verify they fail**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/services/checklist-pdf.test.ts`

Expected: FAIL because the current PDF still uses the older card-heavy layout and lacks the new document-level copy.

- [ ] **Step 3: Update the PDF view model for the new title block and section language**

In `checklist-pdf-model.ts`, keep the same input shape but expose the exact strings and ordering required by the spec, including:

- canonical section titles
- document-level trust copy
- printable block labels if needed by the renderer

Implementation sketch:

```ts
return {
  title: "おくやみ手続きナビ 有料版チェックリスト",
  generatedAtLabel: `作成日: ${formatDateLabel(snapshot.generated_at)}`,
  trustNotice: "一般案内です。実際に進める前に公式情報を確認してください。",
  sections: canonicalizeSections(snapshot.sections)
};
```

- [ ] **Step 4: Rebuild `checklist-pdf.ts` around A4 print rules**

Implement:

- A4 portrait layout
- 40pt page margins
- first-page title block only
- section headers that do not orphan at page bottoms
- block-level page breaking for procedures
- quiet rules/memo lines instead of web-style cards

Implementation sketch:

```ts
if (cursorY - requiredHeight < PAGE_MARGIN) {
  page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cursorY = PAGE_HEIGHT - PAGE_MARGIN;
  drawContinuationHeader(sectionTitle);
}
```

Preserve Japanese wrapping correctness and do not change the exported function signature.

- [ ] **Step 5: Re-run the PDF tests**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test -- tests/services/checklist-pdf.test.ts`

Expected: PASS with Japanese text, multi-page overflow, and document-level trust copy verified.

- [ ] **Step 6: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/src/services/pdf/checklist-pdf-model.ts okuyami-checklist/src/services/pdf/checklist-pdf.ts okuyami-checklist/tests/services/checklist-pdf.test.ts
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "refactor: redesign paid checklist pdf"
```

## Task 6: Run end-to-end verification and capture visual approval artifacts

**Files:**
- Modify: `okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts`
- Output: `okuyami-checklist/test-results/ui-refresh/`
- Optional notes: `okuyami-checklist/README.md` only if local verification instructions changed materially

- [ ] **Step 1: Tighten the E2E spec around visible hierarchy that matters**

Add assertions that the rendered UI exposes the new hierarchy rather than only functional flow:

```ts
await expect(page.getByText("一般案内")).toBeVisible();
await expect(page.getByRole("heading", { name: "期限順の手続き候補" })).toBeVisible();
await expect(page.getByRole("link", { name: "有料版のダウンロード" })).toBeVisible();
```

Keep the payment/download/resend flow unchanged.

- [ ] **Step 2: Run the E2E test to verify it fails if the hierarchy is not present**

Run: `cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist && npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`

Expected: FAIL until the refreshed UI is fully wired through.

- [ ] **Step 3: Re-run the full verification suite after all UI/PDF work is merged**

Run:

```bash
cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist
npm run test
npm run typecheck
npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts
```

Expected:

- `npm run test`: PASS with all route/domain/PDF tests green
- `npm run typecheck`: PASS
- `npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`: PASS

- [ ] **Step 4: Perform the manual visual review required by the spec**

Run the app locally:

```bash
cd /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist/okuyami-checklist
npx wrangler d1 migrations apply DB --local
npm run dev
```

Then manually verify:

- landing page: one dominant CTA, trust copy near hero
- diagnosis page: text-based progress, spacious question cards, 16px inputs
- results page: canonical section order, clear trust note, natural paid CTA handoff
- purchase-success page: download action visually stronger than resend
- generated PDF: A4 portrait feel, title block, trust copy, readable multi-page overflow

- [ ] **Step 5: Capture approval artifacts for before/after review**

Create `okuyami-checklist/test-results/ui-refresh/` and save:

- landing/results/purchase-success screenshots
- one generated PDF artifact or export
- a short text note naming the verified local URL and date

These artifacts are for review only and should stay untracked unless the user explicitly asks to keep them.

- [ ] **Step 6: Commit**

```bash
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist add okuyami-checklist/tests/e2e/diagnosis-purchase.spec.ts
git -C /Users/hiroshiimaizumi/Documents/.worktrees/codex/okuyami-checklist commit -m "test: lock in refreshed UI flow"
```
