import { Queue } from "bullmq";
import { getConfig } from "../config.js";

let _optimizationQueue: Queue | null = null;

function getConnectionConfig() {
  const config = getConfig();
  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379", 10),
    maxRetriesPerRequest: null as null,
  };
}

export function getOptimizationQueue(): Queue {
  if (!_optimizationQueue) {
    _optimizationQueue = new Queue("optimization", {
      connection: getConnectionConfig(),
    });
  }
  return _optimizationQueue;
}

export async function enqueueOptimization(submissionId: string): Promise<void> {
  const queue = getOptimizationQueue();
  await queue.add(
    "optimize",
    { submissionId },
    {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}

export async function closeQueues(): Promise<void> {
  if (_optimizationQueue) {
    await _optimizationQueue.close();
    _optimizationQueue = null;
  }
}
