"use client";

import { useState, useEffect } from "react";
import { listSubmissions } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import type { ListSubmissionsResponse, SubmissionStatus } from "@code-optimizer/shared";

export function SubmissionList() {
  const [data, setData] = useState<ListSubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    listSubmissions({ page, limit: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading...</div>;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No submissions yet. Submit some code to get started!
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Language
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Goal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Created
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.items.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm capitalize">
                  {sub.language}
                </td>
                <td className="px-4 py-3 text-sm capitalize">
                  {sub.optimizationGoal}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={sub.status as SubmissionStatus} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(sub.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/submissions/${sub.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded px-3 py-1 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
