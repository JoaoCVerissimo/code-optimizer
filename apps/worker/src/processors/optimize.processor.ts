import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dbSchema as schema } from "@code-optimizer/shared";
import {
  callClaude,
  type OptimizationResult,
} from "../ai/client.js";
import {
  SYSTEM_PROMPT,
  buildOptimizationPrompt,
} from "../ai/prompts.js";
import { getConfig } from "../config.js";
import type { OptimizationGoal, SupportedLanguage } from "@code-optimizer/shared";

function createDb() {
  const pool = new pg.Pool({ connectionString: getConfig().databaseUrl });
  return { db: drizzle(pool, { schema }), pool };
}

export async function processOptimization(
  submissionId: string,
): Promise<void> {
  const { db, pool } = createDb();

  try {
    // Fetch submission
    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, submissionId))
      .limit(1);

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Update status to optimizing
    await db
      .update(schema.submissions)
      .set({ status: "optimizing", updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId));

    // Insert the original as variant 0
    await db.insert(schema.variants).values({
      submissionId,
      variantIndex: 0,
      label: "Original",
      code: submission.originalCode,
      explanation: null,
    });

    // Call Claude to generate optimized variants
    const goal = submission.optimizationGoal as OptimizationGoal;
    const language = submission.language as SupportedLanguage;

    const prompt = buildOptimizationPrompt(goal, language, submission.originalCode);
    const result = await callClaude<OptimizationResult>(SYSTEM_PROMPT, prompt);

    // Validate and insert AI variants
    if (!result.variants || !Array.isArray(result.variants)) {
      throw new Error("Invalid response from Claude: missing variants array");
    }

    for (let i = 0; i < result.variants.length; i++) {
      const variant = result.variants[i]!;
      await db.insert(schema.variants).values({
        submissionId,
        variantIndex: i + 1,
        label: variant.label,
        code: variant.code,
        explanation: variant.explanation,
      });
    }

    // Update status to benchmarking
    await db
      .update(schema.submissions)
      .set({ status: "benchmarking", updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId));
  } catch (error) {
    // Mark submission as failed
    const message =
      error instanceof Error ? error.message : "Unknown error during optimization";
    await db
      .update(schema.submissions)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId));
    throw error;
  } finally {
    await pool.end();
  }
}
