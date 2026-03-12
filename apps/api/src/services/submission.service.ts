import { eq, desc, sql, and } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  submissions,
  variants,
  benchmarkResults,
  securityResults,
  variantScores,
} from "../db/schema.js";
import type {
  CreateSubmissionInput,
  ListSubmissionsInput,
} from "@code-optimizer/shared";
import type {
  SubmissionDetailResponse,
  VariantResponse,
  ListSubmissionsResponse,
  SubmissionStatusResponse,
} from "@code-optimizer/shared";

export async function createSubmission(input: CreateSubmissionInput) {
  const db = getDb();
  const [row] = await db
    .insert(submissions)
    .values({
      language: input.language,
      originalCode: input.code,
      optimizationGoal: input.optimizationGoal,
    })
    .returning();

  return row!;
}

export async function getSubmissionById(
  id: string,
): Promise<SubmissionDetailResponse | null> {
  const db = getDb();

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  if (!submission) return null;

  const variantRows = await db
    .select()
    .from(variants)
    .where(eq(variants.submissionId, id))
    .orderBy(variants.variantIndex);

  const variantResponses: VariantResponse[] = await Promise.all(
    variantRows.map(async (v) => {
      const benchmarks = await db
        .select()
        .from(benchmarkResults)
        .where(eq(benchmarkResults.variantId, v.id))
        .orderBy(benchmarkResults.runNumber);

      const [security] = await db
        .select()
        .from(securityResults)
        .where(eq(securityResults.variantId, v.id))
        .limit(1);

      const [scores] = await db
        .select()
        .from(variantScores)
        .where(eq(variantScores.variantId, v.id))
        .limit(1);

      const validBenchmarks = benchmarks.filter(
        (b) => b.executionTimeMs != null,
      );
      const avgExecutionTimeMs =
        validBenchmarks.length > 0
          ? validBenchmarks.reduce((sum, b) => sum + b.executionTimeMs!, 0) /
            validBenchmarks.length
          : null;
      const avgPeakMemoryBytes =
        validBenchmarks.length > 0
          ? validBenchmarks.reduce((sum, b) => sum + (b.peakMemoryBytes ?? 0), 0) /
            validBenchmarks.length
          : null;

      return {
        id: v.id,
        variantIndex: v.variantIndex,
        label: v.label,
        code: v.code,
        explanation: v.explanation,
        rank: scores?.rank ?? null,
        scores: scores
          ? {
              id: scores.id,
              variantId: scores.variantId,
              performanceScore: scores.performanceScore,
              memoryScore: scores.memoryScore,
              securityScore: scores.securityScore,
              reliabilityScore: scores.reliabilityScore,
              readabilityScore: scores.readabilityScore,
              overallScore: scores.overallScore,
              rank: scores.rank,
              createdAt: scores.createdAt.toISOString(),
            }
          : null,
        benchmarks: {
          runs: benchmarks.map((b) => ({
            id: b.id,
            variantId: b.variantId,
            runNumber: b.runNumber,
            executionTimeMs: b.executionTimeMs,
            cpuTimeMs: b.cpuTimeMs,
            peakMemoryBytes: b.peakMemoryBytes,
            exitCode: b.exitCode,
            stdout: b.stdout,
            stderr: b.stderr,
            timedOut: b.timedOut,
            createdAt: b.createdAt.toISOString(),
          })),
          avgExecutionTimeMs,
          avgPeakMemoryBytes,
        },
        security: security
          ? {
              id: security.id,
              variantId: security.variantId,
              vulnerabilityCount: security.vulnerabilityCount,
              findings: security.findings as Array<{
                severity: "high" | "medium" | "low";
                description: string;
                line: number | null;
              }>,
              createdAt: security.createdAt.toISOString(),
            }
          : null,
      };
    }),
  );

  return {
    id: submission.id,
    language: submission.language as SubmissionDetailResponse["language"],
    originalCode: submission.originalCode,
    optimizationGoal:
      submission.optimizationGoal as SubmissionDetailResponse["optimizationGoal"],
    status: submission.status as SubmissionDetailResponse["status"],
    errorMessage: submission.errorMessage,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    variants: variantResponses,
  };
}

export async function listSubmissions(
  input: ListSubmissionsInput,
): Promise<ListSubmissionsResponse> {
  const db = getDb();
  const offset = (input.page - 1) * input.limit;

  const conditions = input.status
    ? and(eq(submissions.status, input.status))
    : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)
    .where(conditions);

  const rows = await db
    .select()
    .from(submissions)
    .where(conditions)
    .orderBy(desc(submissions.createdAt))
    .limit(input.limit)
    .offset(offset);

  return {
    items: rows.map((r) => ({
      id: r.id,
      language: r.language as ListSubmissionsResponse["items"][number]["language"],
      originalCode: r.originalCode,
      optimizationGoal:
        r.optimizationGoal as ListSubmissionsResponse["items"][number]["optimizationGoal"],
      status: r.status as ListSubmissionsResponse["items"][number]["status"],
      errorMessage: r.errorMessage,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: countResult?.count ?? 0,
    page: input.page,
    limit: input.limit,
  };
}

export async function getSubmissionStatus(
  id: string,
): Promise<SubmissionStatusResponse | null> {
  const db = getDb();

  const [submission] = await db
    .select({ status: submissions.status })
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  if (!submission) return null;

  // Determine progress by counting completed variants/benchmarks
  const [variantCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(variants)
    .where(eq(variants.submissionId, id));

  const totalVariants = variantCount?.count ?? 0;

  let progress: SubmissionStatusResponse["progress"] = null;

  if (submission.status === "optimizing") {
    progress = {
      step: "optimizing",
      current: totalVariants,
      total: 4, // original + 3 AI variants
      message: `Generating optimized variants (${totalVariants}/4)...`,
    };
  } else if (submission.status === "benchmarking") {
    const [benchCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(benchmarkResults)
      .innerJoin(variants, eq(benchmarkResults.variantId, variants.id))
      .where(eq(variants.submissionId, id));

    const completedBenchmarks = benchCount?.count ?? 0;
    const totalBenchmarks = totalVariants * 3; // 3 runs each

    progress = {
      step: "benchmarking",
      current: completedBenchmarks,
      total: totalBenchmarks,
      message: `Running benchmarks (${completedBenchmarks}/${totalBenchmarks})...`,
    };
  }

  return {
    status: submission.status,
    progress,
  };
}
