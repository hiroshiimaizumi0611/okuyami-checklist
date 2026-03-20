import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps extends PropsWithChildren {
  title: string;
  description: string;
}

const baseStyles = `
  :root {
    color-scheme: light;
    --paper: #f8f4ea;
    --paper-strong: #efe5d2;
    --paper-soft: #fffdf8;
    --ink: #242018;
    --ink-soft: #5e5543;
    --line: #d8ccb7;
    --signal: #355f56;
    --signal-strong: #264f47;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
    line-height: 1.7;
    letter-spacing: 0.01em;
  }

  main {
    display: block;
  }

  .site-shell {
    min-height: 100vh;
    padding: 16px;
  }

  .container {
    max-width: 860px;
    margin: 0 auto;
  }

  .site-header {
    padding: 4px 0 14px;
  }

  .site-brand {
    margin: 0;
    color: var(--ink-soft);
    font-size: 13px;
    font-family: "Hiragino Mincho ProN", "Yu Mincho", serif;
    letter-spacing: 0.08em;
  }

  .site-footer {
    padding: 14px 2px 4px;
    font-size: 12px;
    color: var(--ink-soft);
  }

  @media (min-width: 768px) {
    .site-shell {
      padding: 30px 24px;
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
