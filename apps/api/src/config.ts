interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  redisUrl: string;
  anthropicApiKey: string;
}

let _config: Config | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getConfig(): Config {
  if (!_config) {
    _config = {
      port: parseInt(process.env["PORT"] ?? "4000", 10),
      host: process.env["HOST"] ?? "0.0.0.0",
      databaseUrl: requireEnv("DATABASE_URL"),
      redisUrl: requireEnv("REDIS_URL"),
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"] ?? "",
    };
  }
  return _config;
}
