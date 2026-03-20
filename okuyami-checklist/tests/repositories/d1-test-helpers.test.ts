import { afterEach, describe, expect, it } from "vitest";
import { createTestD1Database } from "./d1-test-helpers";

describe("createTestD1Database", () => {
  let mf: { dispose(): Promise<void> } | undefined;

  afterEach(async () => {
    if (mf) {
      await mf.dispose();
    }
  });

  it("applies all migration files in order", async () => {
    const state = await createTestD1Database();
    mf = state.mf;

    const purchasesTable = await state.db
      .prepare("select name from sqlite_master where type = 'table' and name = ?1")
      .bind("purchases")
      .first<{ name: string }>();
    const claimsTable = await state.db
      .prepare("select name from sqlite_master where type = 'table' and name = ?1")
      .bind("webhook_event_claims")
      .first<{ name: string }>();

    expect(purchasesTable?.name).toBe("purchases");
    expect(claimsTable?.name).toBe("webhook_event_claims");
  });
});
