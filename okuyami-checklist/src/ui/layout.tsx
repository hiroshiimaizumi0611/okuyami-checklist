import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps extends PropsWithChildren {
  title: string;
  description: string;
}

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

  * {
    box-sizing: border-box;
  }

  html {
    background: var(--bg);
  }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
    font-size: 16px;
    line-height: 1.6;
    letter-spacing: 0;
    text-rendering: optimizeLegibility;
  }

  main {
    display: block;
  }

  a {
    color: var(--accent-strong);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.14em;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .site-shell {
    min-height: 100vh;
    padding: 16px;
  }

  .container {
    max-width: 880px;
    margin: 0 auto;
  }

  .site-header {
    padding: 8px 0 18px;
  }

  .site-brand {
    margin: 0;
    color: var(--text-subtle);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
  }

  .site-footer {
    padding: 18px 0 8px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-muted);
  }

  @media (min-width: 768px) {
    .site-shell {
      padding: 28px 24px;
    }
  }

  @media (min-width: 1024px) {
    .site-shell {
      padding: 32px;
    }
  }
`;

export const Layout: FC<LayoutProps> = ({ title, description, children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>{title}</title>
        <meta name="description" content={description} />
        <style>{baseStyles}</style>
      </head>
      <body>
        <div class="site-shell">
          <div class="container">
            <header class="site-header">
              <p class="site-brand">おくやみ手続きナビ</p>
            </header>
            <main>{children}</main>
            <footer class="site-footer">
              一般的な公的情報の整理を支援する診断ツールです。
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
};
