import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dbSchema as schema } from "@code-optimizer/shared";
import { runBenchmark } from "../sandbox/runner.js";
import { getConfig } from "../config.js";
import type { SupportedLanguage } from "@code-optimizer/shared";

function createDb() {
  const pool = new pg.Pool({ connectionString: getConfig().databaseUrl });
  return { db: drizzle(pool, { schema }), pool };
}

export async function processBenchmarks(
  submissionId: string,
): Promise<void> {
  const { db, pool } = createDb();
  const config = getConfig();

  try {
    // Get submission for language info
    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, submissionId))
      .limit(1);

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const language = submission.language as SupportedLanguage;

    // Get all variants for this submission
    const variants = await db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.submissionId, submissionId))
      .orderBy(schema.variants.variantIndex);

    // Run benchmarks for each variant
    for (const variant of variants) {
      for (let run = 1; run <= config.benchmarkRuns; run++) {
        const metrics = await runBenchmark(
          variant.code,
          language,
          config.sandboxTimeoutMs,
        );

        await db.insert(schema.benchmarkResults).values({
          variantId: variant.id,
          runNumber: run,
          executionTimeMs: metrics.executionTimeMs,
          cpuTimeMs: metrics.cpuTimeMs,
          peakMemoryBytes: metrics.peakMemoryBytes,
          exitCode: metrics.exitCode,
          stdout: metrics.stdout,
          stderr: metrics.stderr,
          timedOut: metrics.timedOut,
        });
      }
    }
  } finally {
    await pool.end();
  }
}
