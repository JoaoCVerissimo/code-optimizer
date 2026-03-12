import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

let exitCode = 0;
let errorMsg = "";

const startMemory = process.memoryUsage();
const startTime = performance.now();
const startCpu = process.cpuUsage();

try {
  await import("/code/solution.mjs");
} catch (e) {
  exitCode = 1;
  errorMsg = e instanceof Error ? e.message : String(e);
}

const elapsed = performance.now() - startTime;
const cpuUsage = process.cpuUsage(startCpu);
const endMemory = process.memoryUsage();

const metrics = {
  execution_time_ms: Math.round(elapsed * 10000) / 10000,
  cpu_time_ms:
    Math.round(((cpuUsage.user + cpuUsage.system) / 1000) * 10000) / 10000,
  peak_memory_bytes: endMemory.heapUsed - startMemory.heapUsed,
  exit_code: exitCode,
  error: errorMsg,
};

writeFileSync("/results/metrics.json", JSON.stringify(metrics));
process.exit(exitCode);
