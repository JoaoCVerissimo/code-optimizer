import { Worker } from "bullmq";
import { getRedisConnectionConfig, type OptimizationJobData } from "./queues/optimization.queue.js";
import { processOptimization } from "./processors/optimize.processor.js";
import { processBenchmarks } from "./processors/benchmark.processor.js";
import { processAggregation } from "./processors/aggregate.processor.js";

async function main() {
  const connection = getRedisConnectionConfig();

  console.log("Starting optimization worker...");

  const worker = new Worker<OptimizationJobData>(
    "optimization",
    async (job) => {
      const { submissionId } = job.data;
      console.log(`Processing submission ${submissionId}`);

      // Step 1: Generate optimized variants via Claude
      await job.updateProgress({ step: "optimizing" });
      await processOptimization(submissionId);

      // Step 2: Run benchmarks in sandboxes
      await job.updateProgress({ step: "benchmarking" });
      await processBenchmarks(submissionId);

      // Step 3: Aggregate scores and rank
      await job.updateProgress({ step: "aggregating" });
      await processAggregation(submissionId);

      console.log(`Completed submission ${submissionId}`);
    },
    {
      connection,
      concurrency: 2,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down worker...");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("Worker is ready and listening for jobs.");
}

main().catch((err) => {
  console.error("Failed to start worker:", err);
  process.exit(1);
});
