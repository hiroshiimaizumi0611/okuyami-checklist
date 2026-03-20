import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createD1EventRepository } from "../../src/repositories/d1-event-repository";
import { createTestD1Database } from "./d1-test-helpers";

describe("D1EventRepository", () => {
  let mf: { dispose(): Promise<void> };
  let db: D1Database;

  beforeEach(async () => {
    const state = await createTestD1Database();
    mf = state.mf;
    db = state.db;
  });

  afterEach(async () => {
    if (mf) {
      await mf.dispose();
    }
  });

  it("stores an analytics event payload", async () => {
    const eventRepository = createD1EventRepository(db);

    await eventRepository.track("diagnosis_completed", { procedureCount: 4 });

    const events = await eventRepository.listRecent();

    expect(events[0]?.eventName).toBe("diagnosis_completed");
    expect(events[0]?.payload).toEqual({ procedureCount: 4 });
  });
});
