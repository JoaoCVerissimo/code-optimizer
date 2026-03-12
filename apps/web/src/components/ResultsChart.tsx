"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import type { VariantResponse } from "@code-optimizer/shared";

const COLORS = ["#6b7280", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface ResultsChartProps {
  variants: VariantResponse[];
}

export function ExecutionTimeChart({ variants }: ResultsChartProps) {
  const data = variants.map((v) => ({
    name: v.label.length > 20 ? v.label.slice(0, 20) + "..." : v.label,
    "Avg Time (ms)": v.benchmarks.avgExecutionTimeMs != null
      ? Math.round(v.benchmarks.avgExecutionTimeMs * 1000) / 1000
      : 0,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Execution Time (lower is better)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="Avg Time (ms)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemoryChart({ variants }: ResultsChartProps) {
  const data = variants.map((v) => ({
    name: v.label.length > 20 ? v.label.slice(0, 20) + "..." : v.label,
    "Memory (KB)": v.benchmarks.avgPeakMemoryBytes != null
      ? Math.round(v.benchmarks.avgPeakMemoryBytes / 1024)
      : 0,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Peak Memory Usage (lower is better)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="Memory (KB)" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoresRadarChart({ variants }: ResultsChartProps) {
  const scored = variants.filter((v) => v.scores);
  if (scored.length === 0) return null;

  const metrics = [
    "Performance",
    "Memory",
    "Security",
    "Reliability",
    "Readability",
  ];

  const data = metrics.map((metric) => {
    const entry: Record<string, string | number> = { metric };
    scored.forEach((v) => {
      if (!v.scores) return;
      const key = metric.toLowerCase() as keyof typeof v.scores;
      const scoreKey = `${key}Score` as keyof typeof v.scores;
      entry[v.label] = (v.scores[scoreKey] as number) ?? 0;
    });
    return entry;
  });

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-700">
        Score Comparison
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} />
          {scored.map((v, i) => (
            <Radar
              key={v.id}
              name={v.label}
              dataKey={v.label}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
