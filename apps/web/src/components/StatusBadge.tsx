import type { SubmissionStatus } from "@code-optimizer/shared";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  optimizing: "bg-blue-100 text-blue-700",
  benchmarking: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  optimizing: "Optimizing",
  benchmarking: "Benchmarking",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
