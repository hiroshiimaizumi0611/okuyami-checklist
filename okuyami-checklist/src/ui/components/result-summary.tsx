import type { FC } from "hono/jsx";
import type { ResultSnapshot } from "../../domain/result-snapshot";

interface ResultSummaryProps {
  snapshot: ResultSnapshot;
  snapshotToken: string;
}

const resultSummaryStyles = `
  .results-panel {
    display: grid;
    gap: 24px;
    padding: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .results-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: var(--text-subtle);
  }

  .results-title {
    margin: 12px 0 0;
    max-width: 11em;
    font-size: 32px;
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .results-lead {
    margin: 14px 0 0;
    max-width: 42rem;
    color: var(--text-muted);
  }

  .results-summary-note {
    margin: 12px 0 0;
    color: var(--text);
    font-size: 14px;
  }

  .results-safety {
    padding: 18px;
    border: 1px solid var(--line);
    background: var(--surface-muted);
  }

  .results-safety p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .results-safety strong {
    color: var(--text);
    font-weight: 600;
  }

  .results-sections {
    display: grid;
    gap: 20px;
  }

  .result-section {
    display: grid;
    gap: 12px;
  }

  .result-section-heading {
    margin: 0;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.35;
  }

  .result-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
  }

  .result-item {
    display: grid;
    gap: 10px;
    padding: 18px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .result-item--urgent {
    border-color: var(--line-strong);
  }

  .result-item--needs-confirmation {
    background: var(--accent-soft);
  }

  .result-item--expert {
    background: var(--surface-muted);
    border-color: var(--line-strong);
  }

  .result-item h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    line-height: 1.45;
  }

  .result-description,
  .result-meta {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .result-label {
    color: var(--text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
  }

  .result-link {
    color: var(--accent-strong);
  }

  .advisory-board {
    display: grid;
    gap: 12px;
  }

  .advisory-card {
    padding: 18px;
    border: 1px solid var(--line);
    background: var(--accent-soft);
  }

  .advisory-card h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }

  .advisory-card p {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .checkout-box {
    display: grid;
    gap: 12px;
    padding: 20px;
    border: 1px solid var(--line);
    background: var(--surface-muted);
  }

  .checkout-title {
    margin: 0;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.35;
  }

  .checkout-copy,
  .checkout-note {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .checkout-form {
    display: grid;
    gap: 10px;
  }

  .checkout-label {
    color: var(--text-muted);
    font-size: 13px;
  }

  .checkout-input {
    width: 100%;
    min-height: 48px;
    padding: 11px 14px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--text);
    font-size: 16px;
  }

  .checkout-input:hover {
    border-color: var(--accent);
  }

  .checkout-input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-color: var(--accent);
  }

  .checkout-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .checkout-submit:hover,
  .checkout-submit:focus-visible {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }

  @media (min-width: 768px) {
    .results-panel {
      gap: 28px;
      padding: 32px;
    }

    .results-title {
      font-size: 42px;
    }

    .result-section-heading,
    .checkout-title {
      font-size: 24px;
    }
  }
`;

export const ResultSummary: FC<ResultSummaryProps> = ({ snapshot, snapshotToken }) => {
  return (
    <section class="results-panel">
      <style>{resultSummaryStyles}</style>
      <div>
        <p class="results-eyebrow">RESULT SUMMARY</p>
        <h1 class="results-title">期限順の手続き候補</h1>
        <p class="results-lead">
          回答内容に基づいて、今確認したい手続きを期限ごとに並べました。迷いやすいものは後半にまとめてあります。
        </p>
        <p class="results-summary-note">無料診断で抽出された項目数: {snapshot.procedures.length}件</p>
      </div>

      <section class="results-safety">
        <p>
          <strong>一般的な案内です。</strong>
          実際に進める前に、必ず公式確認先で最新情報を確認してください。判断が分かれるときは、公式窓口や専門家へつないでください。
        </p>
      </section>

      <div class="results-sections">
        {snapshot.sections.map((section) => (
          <section class="result-section" key={section.slug}>
            <h2 class="result-section-heading">{section.title}</h2>
            <ul class="result-list">
              {section.procedures.map((procedure) => (
                <li class={resultItemClassName(section.slug)} key={`${section.slug}-${procedure.id}`}>
                  <p class="result-label">{cardLabel(section.slug)}</p>
                  <h3>{procedure.name}</h3>
                  <p class="result-description">{procedure.short_description}</p>
                  <p class="result-meta">
                    <span class="result-label">WHY SHOWN</span>
                    <br />
                    {procedure.display_reason}
                  </p>
                  <p class="result-meta">
                    <span class="result-label">公式確認先</span>
                    <br />
                    <a
                      class="result-link"
                      href={procedure.official_link}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      公式ページを確認する
                    </a>
                  </p>
                  <p class="result-meta">{procedure.caution_text}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {snapshot.escalations.length > 0 ? (
        <section class="advisory-board" aria-label="risk-cards">
          {snapshot.escalations.map((escalation) => (
            <div class="advisory-card" key={escalation}>
              <h2>{escalationTitle(escalation)}</h2>
              <p>{escalationMessage(escalation)}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section class="checkout-box">
        <h2 class="checkout-title">有料版 PDF を受け取る</h2>
        <p class="checkout-copy">
          期限順の一覧に加えて、持ち物メモと家族共有しやすいチェック欄を PDF にまとめます。
        </p>
        <form class="checkout-form" method="post" action="/checkout">
          <input name="snapshot_token" type="hidden" value={snapshotToken} />
          <label class="checkout-label" htmlFor="checkout-email">
            受け取りメールアドレス
          </label>
          <input
            class="checkout-input"
            id="checkout-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <button class="checkout-submit" type="submit">
            続きを有料版で受け取る
          </button>
        </form>
        <p class="checkout-note">無料版の内容は変えず、そのまま印刷しやすい形式で整理して送ります。</p>
      </section>
    </section>
  );
};

function resultItemClassName(sectionSlug: ResultSnapshot["sections"][number]["slug"]) {
  if (sectionSlug === "first-two-weeks") {
    return "result-item result-item--urgent";
  }

  if (sectionSlug === "needs-confirmation") {
    return "result-item result-item--needs-confirmation";
  }

  if (sectionSlug === "expert-consultation") {
    return "result-item result-item--expert";
  }

  return "result-item";
}

function cardLabel(sectionSlug: ResultSnapshot["sections"][number]["slug"]): string {
  if (sectionSlug === "needs-confirmation") {
    return "CHECK DEADLINE";
  }

  if (sectionSlug === "expert-consultation") {
    return "CONSULT";
  }

  return "PROCEDURE";
}

function escalationTitle(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "専門家相談を検討";
  }

  return "追加確認が必要な可能性";
}

function escalationMessage(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "一般案内だけで判断しにくい可能性があります。法的期限や相続人調整を含めて、公式窓口や専門家へ早めにつないでください。";
  }

  return "一般案内だけで判断しにくい可能性があります。公式窓口や専門家への確認をおすすめします。";
}
