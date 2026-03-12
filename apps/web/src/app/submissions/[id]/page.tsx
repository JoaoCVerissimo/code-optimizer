"use client";

import { use } from "react";
import { useSubmission } from "@/hooks/useSubmission";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ExecutionTimeChart,
  MemoryChart,
  ScoresRadarChart,
} from "@/components/ResultsChart";
import { VariantDiff } from "@/components/VariantDiff";
import type { SubmissionStatus, SupportedLanguage } from "@code-optimizer/shared";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { submission, status, loading, error } = useSubmission(id);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600">
        Error: {error.message}
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="py-8 text-center text-gray-500">
        Submission not found.
      </div>
    );
  }

  const isInProgress =
    submission.status === "pending" ||
    submission.status === "optimizing" ||
    submission.status === "benchmarking";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Optimization Results
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            <span className="capitalize">{submission.language}</span>
            {" — "}
            <span className="capitalize">{submission.optimizationGoal}</span>
          </p>
        </div>
        <StatusBadge status={submission.status as SubmissionStatus} />
      </div>

      {/* Progress indicator */}
      {isInProgress && status?.progress && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="mb-2 text-sm font-medium text-blue-800">
            {status.progress.message}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${(status.progress.current / Math.max(status.progress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {submission.status === "failed" && submission.errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {submission.errorMessage}
        </div>
      )}

      {/* Results (only shown when completed) */}
      {submission.status === "completed" && submission.variants.length > 0 && (
        <>
          {/* Winner banner */}
          {(() => {
            const winner = submission.variants.find((v) => v.rank === 1);
            return winner ? (
              <div className="rounded-lg bg-green-50 p-4">
                <div className="text-sm font-medium text-green-800">
                  Best variant: {winner.label}
                </div>
                {winner.scores?.overallScore != null && (
                  <div className="mt-1 text-xs text-green-600">
                    Overall score: {winner.scores.overallScore.toFixed(1)} / 100
                  </div>
                )}
              </div>
            ) : null;
          })()}

          {/* Charts */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <ExecutionTimeChart variants={submission.variants} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <MemoryChart variants={submission.variants} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <ScoresRadarChart variants={submission.variants} />
          </div>

          {/* Code variants */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <VariantDiff
              variants={submission.variants}
              language={submission.language as SupportedLanguage}
            />
          </div>
        </>
      )}
    </div>
  );
}
