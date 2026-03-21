import type { FC } from "hono/jsx";

const heroStyles = `
  .hero-panel {
    display: grid;
    gap: 24px;
  }

  .hero-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-subtle);
    letter-spacing: 0.16em;
  }

  .hero-title {
    margin: 14px 0 0;
    max-width: 9em;
    font-size: 34px;
    line-height: 1.18;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .hero-lead {
    margin: 16px 0 0;
    max-width: 42rem;
    color: var(--text-muted);
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
    line-height: 1.2;
  }

  .hero-cta:hover,
  .hero-cta:focus-visible {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
    color: #ffffff;
  }

  .hero-trust {
    margin: 0;
    max-width: 40rem;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.7;
  }

  .hero-cards {
    display: grid;
    gap: 12px;
  }

  .hero-card {
    padding: 18px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .hero-card-label {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: var(--text-subtle);
  }

  .hero-card-title {
    margin: 10px 0 0;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.35;
  }

  .hero-card-copy {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .hero-disclaimer {
    padding: 18px;
    border: 1px solid var(--line);
    background: var(--surface-muted);
  }

  .hero-disclaimer p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .hero-disclaimer strong {
    color: var(--text);
    font-weight: 600;
  }

  @media (min-width: 768px) {
    .hero-title {
      font-size: 50px;
    }

    .hero-actions {
      flex-direction: row;
      align-items: center;
    }

    .hero-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

export const Hero: FC = () => {
  return (
    <section class="hero-panel">
      <style>{heroStyles}</style>
      <div>
        <p class="hero-eyebrow">GENERAL GUIDANCE</p>
        <h1 class="hero-title">何を先に確認すべきかを、静かに整理する</h1>
        <p class="hero-lead">
          ご家族が亡くなったあとに必要な手続きを、いまの状況に合わせて期限順に見直せる無料診断です。
          最初の一歩を見失いにくくするための一般案内に絞っています。
        </p>
      </div>

      <div class="hero-actions">
        <a class="hero-cta" href="/diagnosis">
          無料で診断を始める
        </a>
        <p class="hero-trust">
          一般案内として優先順と公式確認先を整理します。判断が分かれるケースは、公式窓口や専門家で確認してください。
        </p>
      </div>

      <div class="hero-cards">
        <section class="hero-card">
          <p class="hero-card-label">DEADLINE ORDER</p>
          <h2 class="hero-card-title">期限順で、今見るべき手続きを絞り込みます</h2>
          <p class="hero-card-copy">
            まず 1〜2 週間、3か月、10か月のように時期ごとに整理して、急ぎやすい手続きを先に確認できます。
          </p>
        </section>
        <section class="hero-card">
          <p class="hero-card-label">OFFICIAL CHECK</p>
          <h2 class="hero-card-title">一般案内のまま終わらせず、公式確認先へつなぎます</h2>
          <p class="hero-card-copy">
            診断結果は制度の概要整理です。手続きごとに公式情報を確認しやすいよう、確認先もあわせて表示します。
          </p>
        </section>
      </div>

      <section class="hero-disclaimer" aria-label="legal-disclaimer">
        <p>
          <strong>一般案内です。</strong>
          個別事情の法的判断・税務判断・相続判断は、弁護士・税理士・司法書士などの専門家にご確認ください。
        </p>
      </section>
    </section>
  );
};
