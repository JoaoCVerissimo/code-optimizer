import { SubmitForm } from "@/components/SubmitForm";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Optimize Your Code
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Submit a function or code snippet, choose an optimization goal, and
          let AI generate optimized variants. Each variant is benchmarked in an
          isolated sandbox so you can compare real performance.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
