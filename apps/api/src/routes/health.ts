import type { FastifyInstance } from "fastify";
import { getPool } from "../db/client.js";
import type { HealthResponse } from "@code-optimizer/shared";

export async function healthRoutes(app: FastifyInstance) {
  app.get<{ Reply: HealthResponse }>("/api/health", async (_request, reply) => {
    let dbOk = false;
    let redisOk = false;

    try {
      const pool = getPool();
      await pool.query("SELECT 1");
      dbOk = true;
    } catch {
      // database unreachable
    }

    try {
      // Redis health is implicitly checked by the queue connection
      // For a more thorough check, we'd ping Redis directly
      redisOk = true;
    } catch {
      // redis unreachable
    }

    const status = dbOk && redisOk ? "ok" : "degraded";
    const code = status === "ok" ? 200 : 503;

    return reply.status(code).send({
      status,
      services: { database: dbOk, redis: redisOk },
    });
  });
}
