import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config.js";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: getConfig().anthropicApiKey });
  }
  return _client;
}

export interface OptimizationVariant {
  label: string;
  code: string;
  explanation: string;
}

export interface OptimizationResult {
  variants: OptimizationVariant[];
}

export interface SecurityScanResult {
  findings: Array<{
    severity: "high" | "medium" | "low";
    description: string;
    line: number | null;
  }>;
}

export interface ReadabilityScoreResult {
  score: number;
  reasoning: string;
}

function generateMockOptimization(userPrompt: string): OptimizationResult {
  // Extract the code from the prompt
  const codeMatch = userPrompt.match(/```\w+\n([\s\S]*?)```/);
  const originalCode = codeMatch?.[1]?.trim() ?? "// original code";

  return {
    variants: [
      {
        label: "Algorithmic Optimization",
        code: `// Optimized: algorithmic improvement\n${originalCode}\n// Added: early termination and reduced iterations`,
        explanation:
          "Applied algorithmic optimization by reducing unnecessary iterations and adding early termination conditions for better average-case performance.",
      },
      {
        label: "Caching & Memoization",
        code: `// Optimized: caching layer\nconst _cache = new Map();\n${originalCode}\n// Added: result caching for repeated inputs`,
        explanation:
          "Added a caching layer using a Map to memoize results of expensive computations, avoiding redundant calculations on repeated inputs.",
      },
      {
        label: "Data Structure Optimization",
        code: `// Optimized: efficient data structures\n${originalCode}\n// Refactored: using Set/Map for O(1) lookups`,
        explanation:
          "Replaced linear search patterns with Set and Map data structures to achieve O(1) lookup times instead of O(n), significantly improving performance for large inputs.",
      },
    ],
  };
}

export async function callClaude<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const config = getConfig();

  if (config.mockMode) {
    // Return mock data based on the system prompt
    await new Promise((r) => setTimeout(r, 500)); // simulate latency
    if (systemPrompt.includes("code optimizer")) {
      return generateMockOptimization(userPrompt) as T;
    }
    if (systemPrompt.includes("security auditor")) {
      return { findings: [] } as T;
    }
    if (systemPrompt.includes("code quality")) {
      return { score: 72, reasoning: "Good structure with room for improvement in naming conventions." } as T;
    }
    return {} as T;
  }

  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Strip any accidental markdown fences
  let text = textBlock.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(text) as T;
}
