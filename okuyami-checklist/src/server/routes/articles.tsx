import type { Context } from "hono";
import { getArticleBySlug, listLaunchArticles } from "../../lib/markdown";
import { ArticleLayout } from "../../ui/components/article-layout";

export async function renderArticlePage(c: Context) {
  const slug = c.req.param("slug");
  if (!slug) {
    return c.notFound();
  }

  const article = await getArticleBySlug(slug);

  if (!article) {
    return c.notFound();
  }

  return c.html(
    <ArticleLayout
      article={article}
      relatedArticles={listLaunchArticles().filter((entry) => entry.slug !== slug)}
    />
  );
}
