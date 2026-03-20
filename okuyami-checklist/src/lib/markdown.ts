import { marked } from "marked";
import { articleManifestBySlug } from "./article-manifest.generated";

export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
}

export interface ArticleDocument extends ArticleSummary {
  html: string;
}

const articleCache = new Map<string, Promise<ArticleDocument>>();
const launchArticles = Object.values(articleManifestBySlug).map((article) => ({
  slug: article.slug,
  title: article.title,
  description: article.description
}));

marked.setOptions({
  gfm: true
});

export function listLaunchArticles(): ArticleSummary[] {
  return [...launchArticles];
}

export async function getArticleBySlug(slug: string): Promise<ArticleDocument | null> {
  const article = articleManifestBySlug[
    slug as keyof typeof articleManifestBySlug
  ];
  if (!article) {
    return null;
  }

  const cached = articleCache.get(slug);
  if (cached) {
    return cached;
  }

  const loader = loadArticle(article);
  articleCache.set(slug, loader);
  return loader;
}

async function loadArticle(
  article: (typeof articleManifestBySlug)[keyof typeof articleManifestBySlug]
): Promise<ArticleDocument> {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    html: await marked.parse(article.markdown)
  };
}
