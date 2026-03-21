import type { FC } from "hono/jsx";
import type { ResultSnapshot } from "../../domain/result-snapshot";

interface ResultSummaryProps {
  snapshot: ResultSnapshot;
  snapshotToken: string;
}

const RESULTS_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCOVZPETqMHFlu735NbLFShrA6KvoZCzl5UbMo3QfGDoMwvr5uK_M7g_BL6xs50rhvB_iJ8cRDo6BwC0xICUUXMi99xPyrmS6WZLNk0i7voxmm9PtBtaRf2FrRj1RbCIPiUWuUh6iOHVmDsaJxXHui1rCI-rOYmLE5hSvonEvvaqcdotA0p53DXd618GhgIyhFJrR8LlzEgStImSiebWPQLWD3Nrsx8JmEwJctE-UxEEo1D2fZkQZuwT3MfTlNR2jG0HGV5djFn4gNX";

const resultSummaryStyles = `
  .results-page {
    padding: 30px 20px 92px;
  }

  .results-shell {
    max-width: 1280px;
    margin: 0 auto;
  }

  .results-hero {
    display: grid;
    gap: 28px;
    padding-bottom: 34px;
    border-bottom: 1px solid rgba(214, 205, 194, 0.6);
  }

  .results-copy {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  .results-kicker {
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  .results-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(36px, 5.8vw, 72px);
    line-height: 1.08;
    letter-spacing: -0.06em;
  }

  .results-lead {
    margin: 0;
    max-width: 34rem;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.95;
  }

  .results-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: end;
  }

  .results-count {
    display: inline-flex;
    align-items: end;
    gap: 10px;
    font-family: var(--font-display);
    color: var(--accent);
  }

  .results-count strong {
    font-size: clamp(40px, 7vw, 84px);
    line-height: 0.9;
    letter-spacing: -0.07em;
  }

  .results-count span {
    padding-bottom: 8px;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
  }

  .results-safety {
    max-width: 32rem;
    padding-top: 8px;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.9;
  }

  .results-safety strong {
    color: var(--text);
    font-weight: 700;
  }

  .results-visual {
    position: relative;
    overflow: hidden;
    min-height: 280px;
    background: var(--surface-muted);
  }

  .results-visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.9) grayscale(0.12);
  }

  .results-visual-card {
    position: absolute;
    inset: auto auto 20px 20px;
    z-index: 1;
    min-width: 160px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(214, 205, 194, 0.8);
  }

  .results-visual-card-label {
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .results-visual-card-value {
    margin-top: 6px;
    font-family: var(--font-display);
    font-size: 38px;
    line-height: 1;
    letter-spacing: -0.08em;
  }

  .results-nav {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding: 8px 0 0;
    border-bottom: 1px solid rgba(214, 205, 194, 0.6);
  }

  .results-nav-link {
    flex: 0 0 auto;
    min-width: 136px;
    padding: 18px 0 16px;
    border-bottom: 2px solid transparent;
    color: var(--text-subtle);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
  }

  .results-nav-link--active,
  .results-nav-link:hover,
  .results-nav-link:focus-visible {
    border-color: var(--accent);
    color: var(--accent);
  }

  .results-sections {
    display: grid;
    gap: 36px;
    padding-top: 28px;
  }

  .result-section {
    display: grid;
    gap: 18px;
  }

  .result-section-header {
    display: grid;
    gap: 10px;
    align-items: end;
  }

  .result-section-index {
    font-family: var(--font-display);
    font-size: clamp(34px, 6vw, 54px);
    line-height: 1;
    letter-spacing: -0.08em;
    color: rgba(141, 116, 83, 0.55);
  }

  .result-section-heading {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 36px);
    line-height: 1.2;
    letter-spacing: -0.05em;
  }

  .result-section-copy {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.9;
  }

  .result-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 14px;
  }

  .result-item {
    display: grid;
    gap: 12px;
    padding: 18px;
    border: 1px solid rgba(214, 205, 194, 0.7);
    background: var(--surface);
  }

  .result-item--urgent {
    border-top: 2px solid var(--accent);
  }

  .result-item--needs-confirmation {
    background: rgba(241, 224, 205, 0.2);
  }

  .result-item--expert {
    background: var(--surface-muted);
  }

  .result-item-label-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .result-label {
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .result-badge {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border: 1px solid rgba(214, 205, 194, 0.8);
    background: rgba(255, 255, 255, 0.85);
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  .result-item h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 21px;
    line-height: 1.35;
    letter-spacing: -0.04em;
  }

  .result-description,
  .result-meta {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.85;
  }

  .result-meta strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .result-link {
    color: var(--accent-strong);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.16em;
  }

  .advisory-board {
    display: grid;
    gap: 14px;
  }

  .advisory-card {
    padding: 22px 20px;
    background: var(--surface-muted);
    border-left: 3px solid var(--accent);
  }

  .advisory-card h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1.3;
    letter-spacing: -0.04em;
  }

  .advisory-card p {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.85;
  }

  .checkout-box {
    margin-top: 8px;
    display: grid;
    gap: 16px;
    padding: 28px 24px;
    background: linear-gradient(135deg, var(--accent-strong), var(--accent));
    color: #ffffff;
  }

  .checkout-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(26px, 4vw, 40px);
    line-height: 1.18;
    letter-spacing: -0.04em;
  }

  .checkout-copy,
  .checkout-note {
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    font-size: 14px;
    line-height: 1.9;
  }

  .checkout-form {
    display: grid;
    gap: 12px;
  }

  .checkout-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .checkout-input {
    width: 100%;
    min-height: 56px;
    padding: 0 18px;
    border: 0;
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-size: 16px;
  }

  .checkout-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .checkout-input:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }

  .checkout-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: 0 24px;
    border: 0;
    background: #ffffff;
    color: var(--accent-strong);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      color 160ms ease;
  }

  .checkout-submit:hover,
  .checkout-submit:focus-visible {
    background: rgba(255, 255, 255, 0.9);
    color: var(--accent);
  }

  @media (min-width: 960px) {
    .results-page {
      padding-left: 32px;
      padding-right: 32px;
    }

    .results-hero {
      grid-template-columns: minmax(0, 0.9fr) minmax(320px, 0.7fr);
      gap: 40px;
      align-items: stretch;
    }

    .result-section-header {
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 16px;
      align-items: end;
    }

    .result-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .advisory-board {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .checkout-form {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
    }

    .checkout-label {
      grid-column: 1 / -1;
    }

    .checkout-submit {
      min-width: 220px;
    }
  }
`;

export const ResultSummary: FC<ResultSummaryProps> = ({ snapshot, snapshotToken }) => {
  return (
    <section class="results-page">
      <style>{resultSummaryStyles}</style>
      <div class="results-shell">
        <section class="results-hero">
          <div class="results-copy">
            <p class="results-kicker">Result summary</p>
            <h1 class="results-title">診断結果: あなたに必要な手続き</h1>
            <p class="results-lead">
              回答内容に基づいて、いま確認したい手続きを期限ごとに整理しました。先に着手しやすいものから順番に確認できます。
            </p>
            <div class="results-meta">
              <div class="results-count">
                <strong>{snapshot.procedures.length}</strong>
                <span>手続き候補</span>
              </div>
            </div>
            <div class="results-safety">
              <strong>一般的な案内です。</strong>
              実際に進める前に、必ず公式確認先で最新情報を確認してください。判断が分かれるときは、公式窓口や専門家へつないでください。
            </div>
          </div>

          <div class="results-visual" aria-hidden="true">
            <img alt="" src={RESULTS_HERO_IMAGE} />
            <div class="results-visual-card">
              <div class="results-visual-card-label">Current status</div>
              <div class="results-visual-card-value">{snapshot.procedures.length}</div>
            </div>
          </div>
        </section>

        <nav class="results-nav" aria-label="deadline sections">
          {snapshot.sections.map((section, index) => (
            <a
              class={`results-nav-link${index === 0 ? " results-nav-link--active" : ""}`}
              href={`#section-${index + 1}`}
              key={section.slug}
            >
              {index + 1}. {sectionShortLabel(section.slug)}
            </a>
          ))}
        </nav>

        <div class="results-sections">
          {snapshot.sections.map((section, index) => (
            <section class="result-section" id={`section-${index + 1}`} key={section.slug}>
              <div class="result-section-header">
                <div class="result-section-index">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <h2 class="result-section-heading">{section.title}</h2>
                  <p class="result-section-copy">{sectionDescription(section.slug)}</p>
                </div>
              </div>
              <ul class="result-list">
                {section.procedures.map((procedure) => (
                  <li class={resultItemClassName(section.slug)} key={`${section.slug}-${procedure.id}`}>
                    <div class="result-item-label-row">
                      <span class="result-label">{cardLabel(section.slug)}</span>
                      <span class="result-badge">{procedure.confirmation_source_type}</span>
                    </div>
                    <h3>{procedure.name}</h3>
                    <p class="result-description">{procedure.short_description}</p>
                    <p class="result-meta">
                      <strong>Why shown</strong>
                      {procedure.display_reason}
                    </p>
                    <p class="result-meta">
                      <strong>公式確認先</strong>
                      <a
                        class="result-link"
                        href={procedure.official_link}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        公式ページを確認する
                      </a>
                    </p>
                    <p class="result-meta">
                      <strong>注意</strong>
                      {procedure.caution_text}
                    </p>
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
          <h2 class="checkout-title">個別ガイドPDFを受け取る</h2>
          <p class="checkout-copy">
            診断結果をそのまま印刷しやすい一覧へ整え、持ち物の確認や家族共有に使いやすい PDF にまとめます。
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
              placeholder="example@navigation.jp"
            />
            <button class="checkout-submit" type="submit">
              続きを有料版で受け取る
            </button>
          </form>
          <p class="checkout-note">
            無料版の内容は変えず、そのまま落ち着いて確認できる帳票レイアウトへ整えてお渡しします。
          </p>
        </section>
      </div>
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
    return "Check deadline";
  }

  if (sectionSlug === "expert-consultation") {
    return "Consult";
  }

  return "Procedure";
}

function sectionShortLabel(sectionSlug: ResultSnapshot["sections"][number]["slug"]) {
  switch (sectionSlug) {
    case "first-two-weeks":
      return "2週間以内";
    case "within-three-months":
      return "3か月以内";
    case "within-ten-months":
      return "10か月以内";
    case "needs-confirmation":
      return "期限確認";
    default:
      return "専門家相談";
  }
}

function sectionDescription(sectionSlug: ResultSnapshot["sections"][number]["slug"]) {
  switch (sectionSlug) {
    case "first-two-weeks":
      return "死亡直後に確認しやすい行政手続きや返却物を先に並べています。";
    case "within-three-months":
      return "相続放棄や各種手続きの期限を見落としやすい期間です。";
    case "within-ten-months":
      return "税や名義変更など、中期で確認したい項目をまとめています。";
    case "needs-confirmation":
      return "期限が個別事情で動く可能性があるものは、ここで改めて確認してください。";
    default:
      return "一般案内だけでは判断しにくいケースです。早めの相談先確保をおすすめします。";
  }
}

function escalationTitle(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "専門家相談を検討したいこと";
  }

  return "追加確認が必要な可能性";
}

function escalationMessage(escalation: string): string {
  if (escalation === "expert-consultation") {
    return "借金の可能性や相続人調整など、一般案内だけでは判断しにくい可能性があります。法的期限を含めて、公式窓口や専門家へ早めにつないでください。";
  }

  return "一般案内だけで判断しにくい可能性があります。公式窓口や専門家への確認をおすすめします。";
}
