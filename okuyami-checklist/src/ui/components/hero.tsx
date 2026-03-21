import type { FC } from "hono/jsx";

const LANDING_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-LeOD5wDcaXUINfQd7n_ipFZfeQZYR9u4M7RuTKnh--K10ulTTKw95car-iXd94sHw13zBWlk4M1c0dZS9h0nVvR0jGhSEl-U9vWXzVQqTNtEcxiD5ojpEpRPFmwAoMcsF3dy8QdOfpuPrCd-4jlVf2KsKMS8_zGx35bVZEoP5go1i6sahDAyumEoonRMZRrZcAQaszIuEwQ6ouPB5ykLnBc-bcnUe6akVNTj4XnZBFiybFFDZNCQrIezp7xfoVp08VUQ--9n0u8h";

const heroStyles = `
  .landing-page {
    display: grid;
    gap: 0;
  }

  .landing-shell {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 20px 88px;
  }

  .landing-rule {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.34em;
    text-transform: uppercase;
  }

  .landing-rule::before {
    content: "";
    width: 44px;
    height: 1px;
    background: currentColor;
  }

  .landing-hero {
    display: grid;
    gap: 28px;
    align-items: stretch;
    min-height: min(78vh, 860px);
  }

  .landing-copy {
    display: grid;
    align-content: center;
    gap: 18px;
    padding: 18px 0 10px;
  }

  .landing-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(42px, 8vw, 82px);
    line-height: 1.06;
    letter-spacing: -0.06em;
    color: var(--accent-strong);
  }

  .landing-lead {
    margin: 0;
    max-width: 32rem;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.95;
  }

  .landing-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
    align-items: center;
    padding-top: 12px;
  }

  .landing-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 58px;
    padding: 0 28px;
    background: var(--accent);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    transition: background-color 160ms ease;
  }

  .landing-primary:hover,
  .landing-primary:focus-visible {
    background: var(--accent-strong);
  }

  .landing-trust {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(133, 120, 107, 0.35);
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .landing-trust::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--accent);
    opacity: 0.85;
  }

  .landing-visual {
    position: relative;
    overflow: hidden;
    min-height: 420px;
    background: var(--surface-soft);
  }

  .landing-visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.84) contrast(1.04);
  }

  .landing-visual::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(247, 247, 246, 0.96) 0%, rgba(247, 247, 246, 0.65) 26%, rgba(247, 247, 246, 0.12) 60%, rgba(247, 247, 246, 0.05) 100%);
  }

  .landing-visual::before {
    content: "";
    position: absolute;
    inset: auto 12% 12% auto;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.34), transparent 72%);
    z-index: 1;
  }

  .landing-context {
    background: var(--surface-muted);
    border-top: 1px solid rgba(214, 205, 194, 0.4);
    border-bottom: 1px solid rgba(214, 205, 194, 0.4);
  }

  .landing-context-grid {
    display: grid;
    gap: 24px;
    align-items: start;
  }

  .landing-context-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(28px, 4vw, 48px);
    line-height: 1.08;
    letter-spacing: -0.05em;
    color: var(--accent-strong);
  }

  .landing-context-copy {
    margin: 0;
    max-width: 44rem;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 2;
  }

  .landing-metrics {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .landing-metric {
    padding-top: 10px;
    border-top: 1px solid rgba(214, 205, 194, 0.7);
  }

  .landing-metric-value {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--font-display);
    font-size: clamp(34px, 6vw, 54px);
    line-height: 1;
    color: var(--accent);
    letter-spacing: -0.05em;
  }

  .landing-metric-value span:last-child {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0;
  }

  .landing-metric-label {
    margin-top: 8px;
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .landing-flow {
    background: var(--bg);
  }

  .landing-flow-grid {
    display: grid;
    gap: 20px;
  }

  .landing-step {
    position: relative;
    min-height: 250px;
    padding: 28px 24px 26px;
    border-top: 1px solid rgba(214, 205, 194, 0.8);
  }

  .landing-step-number {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(52px, 9vw, 88px);
    line-height: 0.9;
    letter-spacing: -0.08em;
    color: rgba(141, 116, 83, 0.18);
  }

  .landing-step-title {
    margin: 10px 0 0;
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1.35;
    letter-spacing: -0.04em;
  }

  .landing-step-copy {
    margin: 16px 0 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.9;
  }

  .landing-cta-band {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(244, 244, 241, 0.6), rgba(241, 224, 205, 0.72));
  }

  .landing-cta-band::after {
    content: "";
    position: absolute;
    inset: auto -15% -120px auto;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: rgba(141, 116, 83, 0.08);
  }

  .landing-cta-content {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    text-align: center;
  }

  .landing-cta-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(30px, 4.8vw, 56px);
    line-height: 1.18;
    letter-spacing: -0.05em;
    color: var(--accent-strong);
  }

  .landing-cta-copy {
    margin: 18px auto 0;
    max-width: 42rem;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.95;
  }

  .landing-cta-note {
    margin: 20px 0 0;
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  .landing-disclaimer {
    max-width: 44rem;
    margin: 18px 0 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.85;
  }

  .landing-disclaimer strong {
    color: var(--text);
    font-weight: 700;
  }

  @media (min-width: 980px) {
    .landing-shell {
      padding-left: 32px;
      padding-right: 32px;
    }

    .landing-hero {
      grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
      gap: 48px;
    }

    .landing-context-grid {
      grid-template-columns: minmax(240px, 0.42fr) minmax(0, 0.58fr);
      gap: 40px;
    }

    .landing-flow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 40px;
    }
  }
`;

export const Hero: FC = () => {
  return (
    <div class="landing-page">
      <style>{heroStyles}</style>

      <section class="landing-shell landing-hero">
        <div class="landing-copy">
          <span class="landing-rule">Compass for the bereaved</span>
          <h1 class="landing-title">
            <span>大切な人を送った後の、</span>
            <br />
            <br />
            歩き出すための地図を。
          </h1>
          <p class="landing-lead">
            相続や名義変更をいきなり判断するのではなく、まず何を確認すべきかだけを落ち着いて整理するための無料診断です。
            約3分で、あなたに必要な手続き候補を期限順に並べます。
          </p>

          <div class="landing-actions">
            <a class="landing-primary" href="/diagnosis">
              無料で診断を始める
            </a>
            <div class="landing-trust">一般案内として、公式確認先まで静かにつなぎます</div>
          </div>

          <p class="landing-disclaimer" aria-label="legal-disclaimer">
            <strong>一般案内です。</strong>
            個別事情の法的判断・税務判断・相続判断は行いません。表示後は公式窓口や専門家で必ず確認してください。
          </p>
        </div>

        <div class="landing-visual" aria-hidden="true">
          <img alt="" src={LANDING_HERO_IMAGE} />
        </div>
      </section>

      <section class="landing-context" id="guide">
        <div class="landing-shell landing-context-grid">
          <h2 class="landing-context-title">
            わずか3分、
            <br />
            数問の答えで。
          </h2>
          <div>
            <p class="landing-context-copy">
              自治体や年金、保険、相続の情報はそれぞれ別の場所にあり、必要な人ほど最初の全体像が見えにくくなります。
              おくやみ手続きナビは、いま必要になりそうなものだけを静かに束ねて、次の確認先まで見失いにくくするための導線です。
            </p>
            <div class="landing-metrics">
              <div class="landing-metric">
                <div class="landing-metric-value">
                  <span>100</span>
                  <span>項目以上</span>
                </div>
                <div class="landing-metric-label">Total procedures</div>
              </div>
              <div class="landing-metric">
                <div class="landing-metric-value">
                  <span>3</span>
                  <span>分</span>
                </div>
                <div class="landing-metric-label">Diagnosis time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-flow" id="flow">
        <div class="landing-shell landing-flow-grid">
          <article class="landing-step">
            <p class="landing-step-number">01</p>
            <h2 class="landing-step-title">
              パーソナライズされた
              <br />
              「やることリスト」
            </h2>
            <p class="landing-step-copy">
              回答内容から、急ぎやすい手続きを期限ごとに整理します。見なくてよい項目まで一度に抱え込まない構成です。
            </p>
          </article>
          <article class="landing-step">
            <p class="landing-step-number">02</p>
            <h2 class="landing-step-title">
              必要な窓口や確認先を
              <br />
              一目で把握
            </h2>
            <p class="landing-step-copy">
              一般案内だけで終わらず、各手続きの公式確認先や注意点も併記します。曖昧なケースは専門家相談へ逃がします。
            </p>
          </article>
        </div>
      </section>

      <section class="landing-cta-band">
        <div class="landing-shell landing-cta-content">
          <h2 class="landing-cta-title">迷う時間を、大切な人を想う時間に。</h2>
          <p class="landing-cta-copy">
            いま必要な確認を整理したうえで、次の一歩へ進めるように。登録なしで無料診断から始められます。
          </p>
          <div class="landing-actions" style="justify-content:center;">
            <a class="landing-primary" href="/diagnosis">
              無料診断へ進む
            </a>
          </div>
          <p class="landing-cta-note">No registration required for diagnosis</p>
        </div>
      </section>
    </div>
  );
};
