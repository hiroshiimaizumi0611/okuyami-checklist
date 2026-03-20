export interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface EventRepository {
  track(eventName: string, payload: Record<string, unknown>): Promise<string>;
  listRecent(limit?: number): Promise<AnalyticsEventRecord[]>;
}
