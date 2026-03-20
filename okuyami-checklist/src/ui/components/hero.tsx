import type { FC } from "hono/jsx";

const heroStyles = `
  .hero-panel {
    background: var(--paper-soft);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
  }

  .hero-eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
    letter-spacing: 0.08em;
  }

  .hero-title {
    margin: 10px 0 12px;
    font-size: 30px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .hero-lead {
    margin: 0 0 12px;
  }

  .hero-subtitle {
    margin: 24px 0 10px;
    font-size: 20px;
    line-height: 1.35;
  }

  .hero-list {
    margin: 0 0 14px;
    padding-left: 20px;
  }

  .hero-list li + li {
    margin-top: 8px;
  }

  .hero-cta {
    display: inline-block;
    margin-top: 6px;
    padding: 11px 18px;
    border-radius: 999px;
    background: var(--signal);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 15px;
    line-height: 1.2;
  }

  .hero-cta:hover,
  .hero-cta:focus-visible {
    background: var(--signal-strong);
  }

  .hero-note {
    margin: 10px 0 0;
    color: var(--ink-soft);
    font-size: 14px;
  }

  .hero-disclaimer {
    margin: 16px 0 0;
    padding: 12px 14px;
    border-left: 4px solid var(--line);
    background: var(--paper);
    font-size: 14px;
    color: var(--ink-soft);
  }

  @media (min-width: 768px) {
    .hero-panel {
      padding: 28px;
      border-radius: 16px;
    }

    .hero-title {
      font-size: 38px;
    }
  }
`;

export const Hero: FC = () => {
  return (
    <section class="hero-panel">
      <style>{heroStyles}</style>
      <p class="hero-eyebrow">ご家族の初動を落ち着いて整理するために</p>
      <h1 class="hero-title">3分で必要な手続きを整理</h1>
      <p class="hero-lead">
        大切な人を見送った直後は、何を先に進めるべきかが分かりにくくなりがちです。
        このページでは、今の状況に合わせて優先手続きを見落としにくくします。
      </p>

      <h2 class="hero-subtitle">まずは無料で診断フォームを確認できます</h2>
      <ul class="hero-list">
        <li>スマホで短い質問に答えるだけで、着手優先度の目安を表示</li>
        <li>市区町村や公的機関でよく必要になる確認項目を中心に整理</li>
        <li>購入前に質問内容を確認して、必要かどうかを判断可能</li>
      </ul>

      <a class="hero-cta" href="/diagnosis">
        無料で3分診断を始める
      </a>
      <p class="hero-note">
        結果ページは次のステップで対応予定です。現時点では診断フォームの質問項目を無料で確認できます。
      </p>

      <p class="hero-disclaimer">
        本サービスは一般的な制度情報に基づく案内です。個別事情の法的判断・税務判断・相続判断は、
        弁護士・税理士・司法書士などの専門家にご確認ください。
      </p>
    </section>
  );
};
