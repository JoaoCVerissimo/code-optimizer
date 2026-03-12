import Docker from "dockerode";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SupportedLanguage } from "@code-optimizer/shared";
import {
  SANDBOX_MEMORY_BYTES,
  SANDBOX_CPU_NANO,
  SANDBOX_PID_LIMIT,
  SANDBOX_TIMEOUT_MS,
} from "@code-optimizer/shared";
import { LANGUAGE_FILENAMES } from "@code-optimizer/shared";

const docker = new Docker();

export interface BenchmarkMetrics {
  executionTimeMs: number;
  cpuTimeMs: number | null;
  peakMemoryBytes: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

const RUN_COMMANDS: Record<SupportedLanguage, string[]> = {
  python: ["python", "/harness/run.py"],
  javascript: ["node", "/harness/run.mjs"],
  typescript: ["npx", "tsx", "/harness/run.mjs"],
  go: ["go", "run", "/harness/run.go"],
};

export async function runBenchmark(
  code: string,
  language: SupportedLanguage,
  timeoutMs: number = SANDBOX_TIMEOUT_MS,
): Promise<BenchmarkMetrics> {
  const tmpDir = await mkdtemp(join(tmpdir(), "optimizer-sandbox-"));
  const codeDir = join(tmpDir, "code");
  const resultsDir = join(tmpDir, "results");

  await mkdir(codeDir, { recursive: true });
  await mkdir(resultsDir, { recursive: true });

  const filename = LANGUAGE_FILENAMES[language];
  await writeFile(join(codeDir, filename), code, "utf-8");

  let container: Docker.Container | null = null;

  try {
    container = await docker.createContainer({
      Image: `optimizer-sandbox-${language}:latest`,
      Cmd: RUN_COMMANDS[language],
      HostConfig: {
        Binds: [`${codeDir}:/code:ro`, `${resultsDir}:/results:rw`],
        Memory: SANDBOX_MEMORY_BYTES,
        NanoCpus: SANDBOX_CPU_NANO,
        NetworkMode: "none",
        ReadonlyRootfs: false, // harness needs tmp write access
        SecurityOpt: ["no-new-privileges"],
        PidsLimit: SANDBOX_PID_LIMIT,
        CapDrop: ["ALL"],
      },
      User: "1000",
      WorkingDir: "/code",
    });

    await container.start();

    // Wait with timeout
    const waitPromise = container.wait();
    const timeoutPromise = new Promise<{ timedOut: true }>((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), timeoutMs),
    );

    const result = await Promise.race([waitPromise, timeoutPromise]);

    if ("timedOut" in result) {
      await container.kill().catch(() => {});
      return {
        executionTimeMs: timeoutMs,
        cpuTimeMs: null,
        peakMemoryBytes: 0,
        exitCode: -1,
        stdout: "",
        stderr: "Execution timed out",
        timedOut: true,
      };
    }

    // Collect stdout/stderr
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
    });

    const logOutput = logs.toString("utf-8");

    // Read metrics from results
    let metrics: Record<string, unknown> = {};
    try {
      const metricsJson = await readFile(
        join(resultsDir, "metrics.json"),
        "utf-8",
      );
      metrics = JSON.parse(metricsJson);
    } catch {
      // metrics file may not exist if the code crashed before writing it
    }

    return {
      executionTimeMs: (metrics["execution_time_ms"] as number) ?? 0,
      cpuTimeMs: (metrics["cpu_time_ms"] as number) ?? null,
      peakMemoryBytes: (metrics["peak_memory_bytes"] as number) ?? 0,
      exitCode: result.StatusCode,
      stdout: logOutput,
      stderr: (metrics["error"] as string) ?? "",
      timedOut: false,
    };
  } finally {
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
    await rm(tmpDir, { recursive: true, force: true });
  }
}
