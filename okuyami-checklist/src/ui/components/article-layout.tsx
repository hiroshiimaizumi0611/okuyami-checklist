import type { FC } from "hono/jsx";
import type { ArticleDocument, ArticleSummary } from "../../lib/markdown";
import { Layout } from "../layout";

interface ArticleLayoutProps {
  article: ArticleDocument;
  relatedArticles: ArticleSummary[];
}

const articleStyles = `
  .article-shell {
    display: grid;
    gap: 18px;
  }

  .article-card,
  .article-cta,
  .article-related {
    background: var(--paper-soft);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
  }

  .article-breadcrumb {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
    letter-spacing: 0.05em;
  }

  .article-title {
    margin: 10px 0 12px;
    font-size: 32px;
    line-height: 1.25;
  }

  .article-description {
    margin: 0;
    color: var(--ink-soft);
  }

  .article-prose {
    margin-top: 18px;
    font-size: 16px;
  }

  .article-prose h2,
  .article-prose h3 {
    margin: 26px 0 10px;
    line-height: 1.4;
  }

  .article-prose p,
  .article-prose ul,
  .article-prose ol {
    margin: 0 0 14px;
  }

  .article-prose a,
  .article-link {
    color: var(--signal-strong);
    text-decoration-thickness: from-font;
  }

  .article-prose li + li {
    margin-top: 8px;
  }

  .article-note {
    margin: 18px 0 0;
    padding: 14px;
    border-left: 4px solid var(--line);
    background: var(--paper);
    color: var(--ink-soft);
    font-size: 14px;
  }

  .article-cta h2,
  .article-related h2 {
    margin: 0 0 10px;
    font-size: 22px;
  }

  .article-cta p,
  .article-related p {
    margin: 0;
  }

  .article-cta-link {
    display: inline-block;
    margin-top: 14px;
    padding: 12px 18px;
    border-radius: 999px;
    background: var(--signal);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
  }

  .article-related-list {
    margin: 14px 0 0;
    padding-left: 18px;
  }

  .article-related-list li + li {
    margin-top: 10px;
  }
`;

export const ArticleLayout: FC<ArticleLayoutProps> = ({ article, relatedArticles }) => {
  return (
    <Layout title={`${article.title} | おくやみ手続きナビ`} description={article.description}>
      <section class="article-shell">
        <style>{articleStyles}</style>

        <article class="article-card">
          <p class="article-breadcrumb">
            <a class="article-link" href="/">
              トップ
            </a>
            {" / "}
            <span>記事</span>
          </p>
          <h1 class="article-title">{article.title}</h1>
          <p class="article-description">{article.description}</p>
          <div class="article-prose" dangerouslySetInnerHTML={{ __html: article.html }} />
          <p class="article-note">
            このページは一般的な制度情報の整理です。最終判断の前に必ず公式案内を確認し、
            相続・税務・法的判断が絡む場合は専門家へ相談してください。
          </p>
        </article>

        <section class="article-cta">
          <h2>状況に合わせて手続き候補を整理する</h2>
          <p>
            亡くなった方との関係や資産状況に応じて、優先順位が変わることがあります。無料診断で次の一歩を整理できます。
          </p>
          <a class="article-cta-link" href="/diagnosis">
            無料で診断を始める
          </a>
        </section>

        <section class="article-related">
          <h2>関連記事</h2>
          <p>近いテーマの確認メモもあわせて見ておくと、抜け漏れを減らしやすくなります。</p>
          <ul class="article-related-list">
            {relatedArticles.map((related) => (
              <li key={related.slug}>
                <a class="article-link" href={`/articles/${related.slug}`}>
                  {related.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </Layout>
  );
};
