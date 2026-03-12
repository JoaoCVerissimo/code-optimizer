interface WorkerConfig {
  databaseUrl: string;
  redisUrl: string;
  anthropicApiKey: string;
  sandboxTimeoutMs: number;
  benchmarkRuns: number;
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
    _config = {
      databaseUrl: requireEnv("DATABASE_URL"),
      redisUrl: requireEnv("REDIS_URL"),
      anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
      sandboxTimeoutMs: parseInt(
        process.env["SANDBOX_TIMEOUT_MS"] ?? "30000",
        10,
      ),
      benchmarkRuns: parseInt(process.env["BENCHMARK_RUNS"] ?? "3", 10),
    };
  }
  return _config;
}
