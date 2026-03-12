import { getConfig } from "../config.js";

export interface OptimizationJobData {
  submissionId: string;
}

export interface BenchmarkJobData {
  submissionId: string;
}

export function getRedisConnectionConfig() {
  const config = getConfig();
  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379", 10),
    maxRetriesPerRequest: null as null,
  };
}
