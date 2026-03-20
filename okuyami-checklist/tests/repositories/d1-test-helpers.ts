import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(TESTS_DIR, "../../migrations");

export async function createTestD1Database(): Promise<{ db: D1Database; mf: Miniflare }> {
  const mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"]
  });
  const db = await mf.getD1Database("DB");

  for (const migrationPath of await listMigrationFiles()) {
    const migrationSql = await readFile(migrationPath, "utf8");
    const statements = migrationSql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await db.prepare(statement).run();
    }
  }

  return { db, mf };
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR, {
    withFileTypes: true
  });

  return entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/u.test(entry.name))
    .map((entry) => resolve(MIGRATIONS_DIR, entry.name))
    .sort((left, right) => left.localeCompare(right));
}
