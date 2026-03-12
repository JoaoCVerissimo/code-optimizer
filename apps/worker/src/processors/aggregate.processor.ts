import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dbSchema as schema } from "@code-optimizer/shared";
import { getConfig } from "../config.js";
import type { OptimizationGoal } from "@code-optimizer/shared";

function createDb() {
  const pool = new pg.Pool({ connectionString: getConfig().databaseUrl });
  return { db: drizzle(pool, { schema }), pool };
}

interface VariantMetrics {
  variantId: string;
  avgExecutionTimeMs: number;
  avgPeakMemoryBytes: number;
  successRate: number;
}

// Score weights by optimization goal (which metric matters most)
const SCORE_WEIGHTS: Record<
  OptimizationGoal,
  { performance: number; memory: number; security: number; reliability: number; readability: number }
> = {
  performance: { performance: 0.6, memory: 0.15, security: 0.05, reliability: 0.15, readability: 0.05 },
  memory: { performance: 0.15, memory: 0.6, security: 0.05, reliability: 0.15, readability: 0.05 },
  security: { performance: 0.05, memory: 0.05, security: 0.6, reliability: 0.2, readability: 0.1 },
  reliability: { performance: 0.1, memory: 0.05, security: 0.1, reliability: 0.6, readability: 0.15 },
  readability: { performance: 0.05, memory: 0.05, security: 0.05, reliability: 0.1, readability: 0.75 },
};

export async function processAggregation(
  submissionId: string,
): Promise<void> {
  const { db, pool } = createDb();

  try {
    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, submissionId))
      .limit(1);

    if (!submission) throw new Error(`Submission ${submissionId} not found`);

    const goal = submission.optimizationGoal as OptimizationGoal;

    // Get all variants
    const variants = await db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.submissionId, submissionId));

    // Compute average metrics per variant
    const metricsPerVariant: VariantMetrics[] = [];

    for (const variant of variants) {
      const benchmarks = await db
        .select()
        .from(schema.benchmarkResults)
        .where(eq(schema.benchmarkResults.variantId, variant.id));

      const successful = benchmarks.filter(
        (b) => b.exitCode === 0 && !b.timedOut,
      );

      const avgTime =
        successful.length > 0
          ? successful.reduce((s, b) => s + (b.executionTimeMs ?? 0), 0) /
            successful.length
          : Infinity;

      const avgMemory =
        successful.length > 0
          ? successful.reduce((s, b) => s + (b.peakMemoryBytes ?? 0), 0) /
            successful.length
          : Infinity;

      const successRate =
        benchmarks.length > 0 ? successful.length / benchmarks.length : 0;

      metricsPerVariant.push({
        variantId: variant.id,
        avgExecutionTimeMs: avgTime,
        avgPeakMemoryBytes: avgMemory,
        successRate,
      });
    }

    // Normalize scores to 0-100 (lower time/memory = higher score)
    const times = metricsPerVariant
      .map((m) => m.avgExecutionTimeMs)
      .filter((t) => isFinite(t));
    const memories = metricsPerVariant
      .map((m) => m.avgPeakMemoryBytes)
      .filter((m) => isFinite(m));

    const minTime = Math.min(...times, 1);
    const maxTime = Math.max(...times, 1);
    const minMem = Math.min(...memories, 1);
    const maxMem = Math.max(...memories, 1);

    const weights = SCORE_WEIGHTS[goal];

    const scoredVariants = metricsPerVariant.map((m) => {
      const perfScore =
        maxTime === minTime
          ? 100
          : isFinite(m.avgExecutionTimeMs)
            ? ((maxTime - m.avgExecutionTimeMs) / (maxTime - minTime)) * 100
            : 0;

      const memScore =
        maxMem === minMem
          ? 100
          : isFinite(m.avgPeakMemoryBytes)
            ? ((maxMem - m.avgPeakMemoryBytes) / (maxMem - minMem)) * 100
            : 0;

      const reliabilityScore = m.successRate * 100;
      // Security and readability default to 50 until scanning is implemented
      const securityScore = 50;
      const readabilityScore = 50;

      const overall =
        perfScore * weights.performance +
        memScore * weights.memory +
        securityScore * weights.security +
        reliabilityScore * weights.reliability +
        readabilityScore * weights.readability;

      return {
        variantId: m.variantId,
        performanceScore: Math.round(perfScore * 10) / 10,
        memoryScore: Math.round(memScore * 10) / 10,
        securityScore,
        reliabilityScore: Math.round(reliabilityScore * 10) / 10,
        readabilityScore,
        overallScore: Math.round(overall * 10) / 10,
      };
    });

    // Sort by overall score descending and assign ranks
    scoredVariants.sort((a, b) => b.overallScore - a.overallScore);

    for (let i = 0; i < scoredVariants.length; i++) {
      const sv = scoredVariants[i]!;
      await db.insert(schema.variantScores).values({
        variantId: sv.variantId,
        performanceScore: sv.performanceScore,
        memoryScore: sv.memoryScore,
        securityScore: sv.securityScore,
        reliabilityScore: sv.reliabilityScore,
        readabilityScore: sv.readabilityScore,
        overallScore: sv.overallScore,
        rank: i + 1,
      });
    }

    // Mark submission as completed
    await db
      .update(schema.submissions)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during aggregation";
    await db
      .update(schema.submissions)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId));
    throw error;
  } finally {
    await pool.end();
  }
}
