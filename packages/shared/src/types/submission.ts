import type { OptimizationGoal, SupportedLanguage } from "./optimization.js";

export type SubmissionStatus =
  | "pending"
  | "optimizing"
  | "benchmarking"
  | "completed"
  | "failed";

export interface Submission {
  id: string;
  language: SupportedLanguage;
  originalCode: string;
  optimizationGoal: OptimizationGoal;
  status: SubmissionStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  submissionId: string;
  variantIndex: number;
  label: string;
  code: string;
  explanation: string | null;
  createdAt: string;
}

export interface BenchmarkResult {
  id: string;
  variantId: string;
  runNumber: number;
  executionTimeMs: number | null;
  cpuTimeMs: number | null;
  peakMemoryBytes: number | null;
  exitCode: number | null;
  stdout: string | null;
  stderr: string | null;
  timedOut: boolean;
  createdAt: string;
}

export interface SecurityResult {
  id: string;
  variantId: string;
  vulnerabilityCount: number;
  findings: SecurityFinding[];
  createdAt: string;
}

export interface SecurityFinding {
  severity: "high" | "medium" | "low";
  description: string;
  line: number | null;
}

export interface ReliabilityResult {
  id: string;
  variantId: string;
  totalTests: number;
  passedTests: number;
  failureDetails: ReliabilityFailure[];
  createdAt: string;
}

export interface ReliabilityFailure {
  testName: string;
  error: string;
}

export interface VariantScore {
  id: string;
  variantId: string;
  performanceScore: number | null;
  memoryScore: number | null;
  securityScore: number | null;
  reliabilityScore: number | null;
  readabilityScore: number | null;
  overallScore: number | null;
  rank: number | null;
  createdAt: string;
}
