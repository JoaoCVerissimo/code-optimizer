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

export async function callClaude<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
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
