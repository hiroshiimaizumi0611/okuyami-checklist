import type { AnalyticsEventRecord, EventRepository } from "./event-repository";

interface D1EventRepositoryOptions {
  now?: () => Date;
  createId?: () => string;
}

interface EventRow {
  id: string;
  event_name: string;
  payload_json: string;
  created_at: string;
}

const DEFAULT_LIMIT = 50;

export function createD1EventRepository(
  db: D1Database,
  options: D1EventRepositoryOptions = {}
): EventRepository {
  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? (() => createRecordId("evt", now()));

  return {
    async track(eventName: string, payload: Record<string, unknown>): Promise<string> {
      const id = createId();
      await db
        .prepare(
          `
            insert into analytics_events (id, event_name, payload_json, created_at)
            values (?1, ?2, ?3, ?4)
          `
        )
        .bind(id, eventName, JSON.stringify(payload), now().toISOString())
        .run();
      return id;
    },

    async listRecent(limit: number = DEFAULT_LIMIT): Promise<AnalyticsEventRecord[]> {
      const { results } = await db
        .prepare(
          `
            select id, event_name, payload_json, created_at
            from analytics_events
            order by created_at desc
            limit ?1
          `
        )
        .bind(limit)
        .all<EventRow>();

      return results.map((row) => ({
        id: row.id,
        eventName: row.event_name,
        payload: safeJsonParse(row.payload_json),
        createdAt: row.created_at
      }));
    }
  };
}

function safeJsonParse(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return parsed as Record<string, unknown>;
}

function createRecordId(prefix: string, date: Date): string {
  const entropy = crypto.randomUUID().replace(/-/gu, "").slice(0, 10);
  return `${prefix}_${date.getTime().toString(36)}${entropy}`;
}
