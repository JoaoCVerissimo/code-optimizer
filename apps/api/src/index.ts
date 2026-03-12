import Fastify from "fastify";
import { getConfig } from "./config.js";
import { registerCors } from "./plugins/cors.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { submissionRoutes } from "./routes/submissions.js";
import { closeDb } from "./db/client.js";
import { closeQueues } from "./services/queue.service.js";

async function main() {
  const config = getConfig();

  const app = Fastify({
    logger: {
      level: process.env["LOG_LEVEL"] ?? "info",
    },
  });

  // Plugins
  await registerCors(app);
  registerErrorHandler(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(submissionRoutes);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    await closeQueues();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Start
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`API server running on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
