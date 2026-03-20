import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const ARTICLES_DIR = resolve(PROJECT_ROOT, "content/articles");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "src/lib/article-manifest.generated.ts");

const entries = await readdir(ARTICLES_DIR, { withFileTypes: true });
const markdownEntries = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

const records = await Promise.all(
  markdownEntries.map(async (fileName) => {
    const slug = fileName.replace(/\.md$/u, "");
    const source = await readFile(resolve(ARTICLES_DIR, fileName), "utf8");
    return parseArticleSource(slug, source);
  })
);

const body = [
  "// This file is generated from content/articles/*.md. Do not edit by hand.",
  "",
  "export const articleManifestBySlug = {",
  ...records.map(
    ({ slug, title, description, markdown }) =>
      `  ${JSON.stringify(slug)}: { slug: ${JSON.stringify(slug)}, title: ${JSON.stringify(
        title
      )}, description: ${JSON.stringify(description)}, markdown: ${JSON.stringify(markdown)} },`
  ),
  "} as const;",
  ""
].join("\n");

await writeFile(OUTPUT_PATH, body, "utf8");

function parseArticleSource(slug, source) {
  const frontMatterMatch = source.match(/^---\n([\s\S]*?)\n---\n*/u);
  if (!frontMatterMatch) {
    throw new Error(`Missing front matter in ${slug}.md`);
  }

  const metadata = {};
  for (const line of frontMatterMatch[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key.length > 0 && value.length > 0) {
      metadata[key] = value;
    }
  }

  if (typeof metadata.title !== "string" || typeof metadata.description !== "string") {
    throw new Error(`Missing title/description in ${slug}.md front matter`);
  }

  return {
    slug,
    title: metadata.title,
    description: metadata.description,
    markdown: source.slice(frontMatterMatch[0].length)
  };
}
