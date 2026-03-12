import type { OptimizationGoal, SupportedLanguage } from "./optimization.js";
import type {
  BenchmarkResult,
  SecurityResult,
  Submission,
  VariantScore,
} from "./submission.js";

// --- Request types ---

export interface CreateSubmissionRequest {
  code: string;
  language: SupportedLanguage;
  optimizationGoal: OptimizationGoal;
}

export interface ListSubmissionsQuery {
  page?: number;
  limit?: number;
  status?: string;
}

// --- Response types ---

export interface CreateSubmissionResponse {
  id: string;
  status: string;
  language: SupportedLanguage;
  optimizationGoal: OptimizationGoal;
  createdAt: string;
}

export interface VariantResponse {
  id: string;
  variantIndex: number;
  label: string;
  code: string;
  explanation: string | null;
  rank: number | null;
  scores: VariantScore | null;
  benchmarks: {
    runs: BenchmarkResult[];
    avgExecutionTimeMs: number | null;
    avgPeakMemoryBytes: number | null;
  };
  security: SecurityResult | null;
}

export interface SubmissionDetailResponse extends Submission {
  variants: VariantResponse[];
}

export interface ListSubmissionsResponse {
  items: Submission[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmissionStatusResponse {
  status: string;
  progress: {
    step: string;
    current: number;
    total: number;
    message: string;
  } | null;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  services: {
    database: boolean;
    redis: boolean;
  };
}
