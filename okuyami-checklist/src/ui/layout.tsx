import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps extends PropsWithChildren {
  title: string;
  description: string;
}

const navigationItems = [
  { href: "/#guide", label: "はじめての方へ" },
  { href: "/#flow", label: "お手続きの流れ" },
  { href: "/articles", label: "よくある質問" },
  { href: "/diagnosis", label: "お問い合わせ" }
] as const;

const footerItems = [
  { href: "/articles", label: "利用規約" },
  { href: "/articles", label: "プライバシーポリシー" },
  { href: "/articles", label: "運営会社" },
  { href: "/articles", label: "特定商取引法に基づく表記" }
] as const;

const baseStyles = `
  :root {
    color-scheme: light;
    --bg: #F7F7F6;
    --surface: #FFFFFF;
    --surface-muted: #F4F4F1;
    --surface-soft: #EEEEEB;
    --paper: #F9F7F3;
    --text: #1C1916;
    --text-muted: #5E564D;
    --text-subtle: #85786B;
    --line: #D6CDC2;
    --line-strong: #1C1916;
    --accent: #8D7453;
    --accent-strong: #70573C;
    --accent-soft: #F1E0CD;
    --font-display: "Plus Jakarta Sans", "Noto Sans JP", sans-serif;
    --font-body: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: var(--bg);
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    text-rendering: optimizeLegibility;
    letter-spacing: -0.01em;
  }

  main {
    display: block;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  ::selection {
    background: var(--accent);
    color: #ffffff;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .site-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid rgba(214, 205, 194, 0.55);
    background: rgba(247, 247, 246, 0.92);
    backdrop-filter: blur(14px);
  }

  .site-header-inner,
  .site-footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 18px 20px;
  }

  .site-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .site-brand {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--accent-strong);
    letter-spacing: -0.03em;
    white-space: nowrap;
  }

  .site-nav {
    display: none;
    align-items: center;
    gap: 28px;
  }

  .site-nav a {
    color: color-mix(in srgb, var(--text) 72%, transparent);
    font-size: 13px;
    font-weight: 500;
    transition: color 160ms ease;
  }

  .site-nav a:hover,
  .site-nav a:focus-visible {
    color: var(--accent);
  }

  .site-login {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 18px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    transition:
      background-color 160ms ease,
      border-color 160ms ease;
  }

  .site-login:hover,
  .site-login:focus-visible {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }

  .site-main {
    flex: 1;
  }

  .site-footer {
    margin-top: auto;
    border-top: 1px solid rgba(214, 205, 194, 0.5);
    background: var(--surface-muted);
  }

  .site-footer-inner {
    display: grid;
    gap: 16px;
    color: var(--text-muted);
    font-size: 12px;
  }

  .site-footer-brand {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--accent-strong);
  }

  .site-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 22px;
  }

  .site-footer-links a {
    transition: color 160ms ease;
  }

  .site-footer-links a:hover,
  .site-footer-links a:focus-visible {
    color: var(--accent);
  }

  .site-footer-copy {
    font-size: 11px;
    letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--text-subtle) 80%, transparent);
    text-transform: uppercase;
  }

  @media (min-width: 900px) {
    .site-header-inner,
    .site-footer-inner {
      padding-left: 32px;
      padding-right: 32px;
    }

    .site-nav {
      display: flex;
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{baseStyles}</style>
      </head>
      <body>
        <div class="site-shell">
          <header class="site-header">
            <div class="site-header-inner">
              <a class="site-brand" href="/">
                おくやみ手続きナビ
              </a>
              <nav class="site-nav" aria-label="primary">
                {navigationItems.map((item) => (
                  <a href={item.href} key={item.label}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <a class="site-login" href="/diagnosis">
                ログイン
              </a>
            </div>
          </header>
          <main class="site-main">{children}</main>
          <footer class="site-footer">
            <div class="site-footer-inner">
              <div class="site-footer-brand">おくやみ手続きナビ</div>
              <div class="site-footer-links">
                {footerItems.map((item) => (
                  <a href={item.href} key={item.label}>
                    {item.label}
                  </a>
                ))}
              </div>
              <div class="site-footer-copy">© OUTLIANT TETSUZUKI NAVI. ALL RIGHTS RESERVED.</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};
