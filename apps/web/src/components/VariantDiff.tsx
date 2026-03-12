"use client";

import { useState } from "react";
import { CodeEditor } from "./CodeEditor";
import type { VariantResponse } from "@code-optimizer/shared";
import type { SupportedLanguage } from "@code-optimizer/shared";

interface VariantDiffProps {
  variants: VariantResponse[];
  language: SupportedLanguage;
}

export function VariantDiff({ variants, language }: VariantDiffProps) {
  const [selected, setSelected] = useState<number>(0);
  const variant = variants[selected];

  if (!variant) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Code Variants</h3>

      {/* Variant tabs */}
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setSelected(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selected === i
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            }`}
          >
            {v.rank != null && (
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                #{v.rank}
              </span>
            )}
            {v.label}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {variant.explanation && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          {variant.explanation}
        </div>
      )}

      {/* Code */}
      <CodeEditor
        value={variant.code}
        onChange={() => {}}
        language={language}
        readOnly
        height="400px"
      />

      {/* Benchmark details */}
      {variant.benchmarks.runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Run
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Time (ms)
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Memory (KB)
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Exit Code
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variant.benchmarks.runs.map((run) => (
                <tr key={run.runNumber}>
                  <td className="px-4 py-2">{run.runNumber}</td>
                  <td className="px-4 py-2">
                    {run.executionTimeMs != null
                      ? run.executionTimeMs.toFixed(3)
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {run.peakMemoryBytes != null
                      ? Math.round(run.peakMemoryBytes / 1024)
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {run.timedOut ? (
                      <span className="text-red-600">Timeout</span>
                    ) : (
                      run.exitCode
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
