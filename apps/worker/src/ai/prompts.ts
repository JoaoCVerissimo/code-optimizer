import type { OptimizationGoal, SupportedLanguage } from "@code-optimizer/shared";

export const SYSTEM_PROMPT = `You are an expert code optimizer. You will receive source code and an optimization goal.
Generate exactly 3 optimized variants of the code. Each variant must:
1. Be functionally equivalent to the original (same inputs produce same outputs).
2. Be syntactically valid and runnable as-is.
3. Use a different optimization strategy.
4. Include a brief explanation of the optimization applied.

Return your response as JSON with this exact structure:
{
  "variants": [
    {
      "label": "Short name of optimization strategy",
      "code": "the full optimized code",
      "explanation": "2-3 sentences explaining what was changed and why"
    }
  ]
}
Return ONLY the JSON. No markdown fences. No commentary outside the JSON.`;

const GOAL_PROMPTS: Record<OptimizationGoal, string> = {
  performance: `Optimization goal: PERFORMANCE (minimize execution time and CPU usage)

Optimize the following {language} code for maximum execution speed.
Strategies to consider:
- Algorithmic improvements (better time complexity)
- Caching/memoization
- Loop optimization and vectorization
- Data structure changes for faster access patterns
- Avoiding unnecessary allocations
- Language-specific performance idioms`,

  memory: `Optimization goal: MEMORY (minimize peak memory usage)

Optimize the following {language} code for minimal memory consumption.
Strategies to consider:
- Generators/iterators instead of materializing lists
- In-place operations
- Streaming processing
- Reducing object overhead
- Buffer reuse
- Avoiding unnecessary copies`,

  security: `Optimization goal: SECURITY (eliminate vulnerabilities)

Harden the following {language} code against security vulnerabilities.
Strategies to consider:
- Input validation and sanitization
- Preventing injection attacks
- Safe error handling (no information leakage)
- Bounds checking
- Safe use of cryptographic primitives
- Avoiding deprecated/unsafe functions
- Principle of least privilege`,

  reliability: `Optimization goal: RELIABILITY (maximize robustness)

Make the following {language} code more reliable and fault-tolerant.
Strategies to consider:
- Comprehensive error handling
- Edge case handling (empty inputs, overflow, null)
- Retry logic for transient failures
- Defensive programming
- Type safety improvements
- Resource cleanup (finally/defer/context managers)`,

  readability: `Optimization goal: READABILITY (maximize clarity and maintainability)

Refactor the following {language} code for maximum readability and maintainability.
Strategies to consider:
- Clear naming conventions
- Function decomposition (single responsibility)
- Removing dead code and redundancy
- Adding type annotations
- Idiomatic patterns for the language
- Consistent formatting
- Self-documenting code structure`,
};

export function buildOptimizationPrompt(
  goal: OptimizationGoal,
  language: SupportedLanguage,
  code: string,
): string {
  const goalPrompt = GOAL_PROMPTS[goal].replace("{language}", language);
  return `${goalPrompt}

Code:
\`\`\`${language}
${code}
\`\`\``;
}

export const SECURITY_SCANNER_SYSTEM = `You are a security auditor. Analyze the given code for security vulnerabilities.
Return your findings as JSON with this exact structure:
{ "findings": [{ "severity": "high"|"medium"|"low", "description": "...", "line": <number or null> }] }
Return ONLY the JSON. No markdown fences.`;

export function buildSecurityScanPrompt(
  language: SupportedLanguage,
  code: string,
): string {
  return `Analyze this ${language} code for security vulnerabilities:
\`\`\`${language}
${code}
\`\`\``;
}

export const READABILITY_SCORER_SYSTEM = `You are a code quality reviewer. Score the readability of the given code from 0 to 100.
Return your assessment as JSON with this exact structure:
{ "score": <number 0-100>, "reasoning": "..." }
Return ONLY the JSON. No markdown fences.`;

export function buildReadabilityPrompt(
  language: SupportedLanguage,
  code: string,
): string {
  return `Score the readability of this ${language} code:
\`\`\`${language}
${code}
\`\`\``;
}
