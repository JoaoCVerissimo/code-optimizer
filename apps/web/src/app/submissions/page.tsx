import { SubmissionList } from "@/components/SubmissionList";

export default function SubmissionsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Submission History
      </h1>
      <SubmissionList />
    </div>
  );
}
