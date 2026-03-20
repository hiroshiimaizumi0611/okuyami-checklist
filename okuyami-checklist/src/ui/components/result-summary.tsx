import type { FC } from "hono/jsx";
import type { ResultSnapshot } from "../../domain/result-snapshot";

interface ResultSummaryProps {
  snapshot: ResultSnapshot;
  snapshotToken: string;
}

const resultSummaryStyles = `
  .results-panel {
    background: var(--paper-soft);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
  }

  .results-title {
    margin: 8px 0 10px;
    font-size: 30px;
    line-height: 1.25;
    letter-spacing: 0.01em;
  }

  .results-eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
    letter-spacing: 0.08em;
  }

  .results-lead {
    margin: 0;
    color: var(--ink-soft);
  }

  .safety-copy {
    margin: 14px 0 0;
    padding: 12px 14px;
    border-left: 4px solid var(--line);
    background: var(--paper);
    font-size: 14px;
    color: var(--ink-soft);
  }

  .result-section {
    margin-top: 20px;
  }

  .result-section h2 {
    margin: 0 0 10px;
    font-size: 20px;
    line-height: 1.4;
  }

  .result-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }

  .result-item {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px;
    background: #fffdfa;
  }

  .result-item h3 {
    margin: 0;
    font-size: 16px;
  }

  .result-item p {
    margin: 7px 0 0;
    font-size: 14px;
  }

  .result-label {
    color: var(--ink-soft);
    font-weight: 700;
    margin-right: 6px;
  }

  .result-link {
    color: var(--signal-strong);
    text-decoration-thickness: from-font;
  }

  .risk-board {
    margin-top: 18px;
    display: grid;
    gap: 10px;
  }

  .risk-card {
    border: 1px solid #d9a979;
    background: #fff6ec;
    border-radius: 12px;
    padding: 12px;
  }

  .risk-card h2 {
    margin: 0;
    font-size: 17px;
  }

  .risk-card p {
    margin: 8px 0 0;
    font-size: 14px;
    color: #5e4531;
  }

  .checkout-box {
    margin-top: 18px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fffdfa;
  }

  .checkout-title {
    margin: 0 0 8px;
    font-size: 17px;
  }

  .checkout-input {
    width: 100%;
    min-height: 40px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    font: inherit;
    background: #fff;
    color: inherit;
  }

  .checkout-input:focus-visible {
    outline: 2px solid var(--signal);
    outline-offset: 1px;
  }

  .checkout-submit {
    margin-top: 10px;
    display: inline-block;
    padding: 11px 18px;
    border-radius: 999px;
    background: var(--signal);
    color: #fff;
    border: none;
    font-weight: 700;
    cursor: pointer;
    font-size: 15px;
    line-height: 1.2;
  }

  .checkout-submit:hover,
  .checkout-submit:focus-visible {
    background: var(--signal-strong);
  }

  .checkout-note {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--ink-soft);
  }

  @media (min-width: 768px) {
    .results-panel {
      padding: 28px;
      border-radius: 16px;
    }

    .results-title {
      font-size: 38px;
    }
  }
`;

export const ResultSummary: FC<ResultSummaryProps> = ({ snapshot, snapshotToken }) => {
  return (
    <section class="results-panel">
      <style>{resultSummaryStyles}</style>
      <p class="results-eyebrow">無料診断結果</p>
      <h1 class="results-title">期限順の手続き候補</h1>
      <p class="results-lead">
        回答内容に基づき、まず着手したい手続きを期限順に整理しました。
      </p>
      <p class="safety-copy">
        この結果は一般的な案内です。実際に進める前に、必ず公式確認先で最新情報を確認してください。
      </p>

      {snapshot.sections.map((section) => (
        <section class="result-section" key={section.slug}>
          <h2>{section.title}</h2>
          <ul class="result-list">
            {section.procedures.map((procedure) => (
              <li class="result-item" key={procedure.id}>
                <h3>{procedure.name}</h3>
                <p>{procedure.short_description}</p>
                <p>
                  <span class="result-label">表示理由</span>
                  {procedure.display_reason}
                </p>
                <p>
                  <span class="result-label">公式確認先</span>
                  <a
                    class="result-link"
                    href={procedure.official_link}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    公的ページを開く
                  </a>
                </p>
                <p>{procedure.caution_text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {snapshot.escalations.length > 0 && (
        <section class="risk-board" aria-label="risk-cards">
          {snapshot.escalations.map((escalation) => (
            <div class="risk-card" key={escalation}>
              <h2>{escalationTitle(escalation)}</h2>
              <p>{escalationMessage(escalation)}</p>
            </div>
          ))}
        </section>
      )}

      <section class="checkout-box">
        <h2 class="checkout-title">有料版の続きチェックリストを作成する</h2>
        <form method="post" action="/checkout">
          <input name="snapshot_token" type="hidden" value={snapshotToken} />
          <label htmlFor="checkout-email">受け取りメールアドレス</label>
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
        <p class="checkout-note">無料診断で抽出された項目数: {snapshot.procedures.length}件</p>
      </section>
    </section>
  );
};

function escalationTitle(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "専門家相談を検討";
  }

  return "追加確認が必要な可能性";
}

function escalationMessage(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "法的期限や相続人間調整が絡む可能性があります。早めに弁護士・税理士・司法書士等へ相談してください。";
  }

  return "一般案内だけで判断しにくい可能性があります。公式窓口や専門家への確認をおすすめします。";
}
