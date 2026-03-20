import type { WorkerEnv } from "./env";
import { createD1EventRepository } from "../repositories/d1-event-repository";
import type { EventRepository } from "../repositories/event-repository";

export interface Analytics {
  track(eventName: string, payload?: Record<string, unknown>): Promise<void>;
}

const noopAnalytics: Analytics = {
  async track() {
    return undefined;
  }
};

export function createAnalytics(
  eventRepository: EventRepository | null | undefined
): Analytics {
  if (!eventRepository) {
    return noopAnalytics;
  }

  return {
    async track(eventName: string, payload: Record<string, unknown> = {}): Promise<void> {
      try {
        await eventRepository.track(eventName, payload);
      } catch {
        // Analytics should never break the primary flow.
      }
    }
  };
}

export function createAnalyticsFromEnv(
  env: Partial<WorkerEnv> | null | undefined
): Analytics {
  if (env?.ANALYTICS_EVENT_REPOSITORY) {
    return createAnalytics(env.ANALYTICS_EVENT_REPOSITORY);
  }

  if (!env?.DB) {
    return noopAnalytics;
  }

  return createAnalytics(createD1EventRepository(env.DB));
}

export function trackAnalyticsInBackground(
  executionCtx: Pick<ExecutionContext, "waitUntil"> | undefined,
  env: Partial<WorkerEnv> | null | undefined,
  eventName: string,
  payload: Record<string, unknown> = {}
): void {
  const task = createAnalyticsFromEnv(env).track(eventName, payload);

  if (executionCtx) {
    executionCtx.waitUntil(task);
    return;
  }

  void task;
}

export function getExecutionCtxOrUndefined(context: {
  executionCtx: Pick<ExecutionContext, "waitUntil">;
}): Pick<ExecutionContext, "waitUntil"> | undefined {
  try {
    return context.executionCtx;
  } catch {
    return undefined;
  }
}
