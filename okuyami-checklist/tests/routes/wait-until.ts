export function createExecutionContextHarness() {
  const tasks: Promise<unknown>[] = [];

  return {
    executionCtx: {
      waitUntil(promise: Promise<unknown>) {
        tasks.push(Promise.resolve(promise));
      },
      passThroughOnException() {
        return undefined;
      }
    } as ExecutionContext,
    async drain() {
      await Promise.allSettled(tasks);
    }
  };
}
