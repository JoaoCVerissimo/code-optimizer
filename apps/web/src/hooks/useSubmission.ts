"use client";

import { useState, useEffect, useCallback } from "react";
import { getSubmission, getSubmissionStatus } from "@/lib/api";
import { usePolling } from "./usePolling";
import type {
  SubmissionDetailResponse,
  SubmissionStatusResponse,
} from "@code-optimizer/shared";

export function useSubmission(id: string) {
  const [submission, setSubmission] =
    useState<SubmissionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isInProgress =
    submission?.status === "pending" ||
    submission?.status === "optimizing" ||
    submission?.status === "benchmarking";

  // Poll status while in progress
  const statusFetcher = useCallback(
    () => getSubmissionStatus(id),
    [id],
  );
  const { data: statusData } = usePolling<SubmissionStatusResponse>(
    statusFetcher,
    2000,
    isInProgress,
  );

  // Fetch full submission on mount and when status changes to completed/failed
  const fetchSubmission = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubmission(id);
      setSubmission(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  // Refetch when status transitions to completed/failed
  useEffect(() => {
    if (
      statusData &&
      (statusData.status === "completed" || statusData.status === "failed")
    ) {
      fetchSubmission();
    }
  }, [statusData?.status, fetchSubmission]);

  return {
    submission,
    status: statusData,
    loading,
    error,
    refetch: fetchSubmission,
  };
}
