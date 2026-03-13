import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load root .env if not already loaded
function loadDotenv() {
  try {
    const envPath = resolve(process.cwd(), "../../.env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env may not exist
  }
}
loadDotenv();

interface WorkerConfig {
  databaseUrl: string;
  redisUrl: string;
  anthropicApiKey: string;
  sandboxTimeoutMs: number;
  benchmarkRuns: number;
  mockMode: boolean;
}

let _config: WorkerConfig | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getConfig(): WorkerConfig {
  if (!_config) {
    const mockMode = process.env["MOCK_AI"] === "true";
    _config = {
      databaseUrl: requireEnv("DATABASE_URL"),
      redisUrl: requireEnv("REDIS_URL"),
      anthropicApiKey: mockMode ? "mock" : requireEnv("ANTHROPIC_API_KEY"),
      sandboxTimeoutMs: parseInt(
        process.env["SANDBOX_TIMEOUT_MS"] ?? "30000",
        10,
      ),
      benchmarkRuns: parseInt(process.env["BENCHMARK_RUNS"] ?? "3", 10),
      mockMode,
    };
  }
  return _config;
}
