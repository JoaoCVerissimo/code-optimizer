"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "./CodeEditor";
import { createSubmission } from "@/lib/api";
import {
  SUPPORTED_LANGUAGES,
  OPTIMIZATION_GOALS,
  type SupportedLanguage,
  type OptimizationGoal,
} from "@code-optimizer/shared";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  go: "Go",
};

const GOAL_LABELS: Record<OptimizationGoal, string> = {
  performance: "Performance",
  memory: "Memory Efficiency",
  security: "Security",
  reliability: "Reliability",
  readability: "Readability",
};

const GOAL_DESCRIPTIONS: Record<OptimizationGoal, string> = {
  performance: "Minimize execution time and CPU usage",
  memory: "Minimize peak memory consumption",
  security: "Eliminate vulnerabilities and harden code",
  reliability: "Maximize robustness and fault tolerance",
  readability: "Maximize clarity and maintainability",
};

const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print(fibonacci(35))
`,
  javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(35));
`,
  typescript: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(35));
`,
  go: `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println(fibonacci(35))
}
`,
};

export function SubmitForm() {
  const router = useRouter();
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [goal, setGoal] = useState<OptimizationGoal>("performance");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    // Only reset code if it matches the previous language's default
    if (code === DEFAULT_CODE[language]) {
      setCode(DEFAULT_CODE[newLang]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await createSubmission({
        code,
        language,
        optimizationGoal: goal,
      });
      router.push(`/submissions/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Language
        </label>
        <div className="flex gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                language === lang
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Code editor */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Code
        </label>
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      {/* Optimization goal */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Optimization Goal
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIMIZATION_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`rounded-lg p-4 text-left transition ${
                goal === g
                  ? "bg-blue-50 ring-2 ring-blue-600"
                  : "bg-white ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                {GOAL_LABELS[g]}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {GOAL_DESCRIPTIONS[g]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !code.trim()}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Optimize Code"}
      </button>
    </div>
  );
}
