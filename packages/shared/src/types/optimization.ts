export const OPTIMIZATION_GOALS = [
  "performance",
  "memory",
  "security",
  "reliability",
  "readability",
] as const;

export type OptimizationGoal = (typeof OPTIMIZATION_GOALS)[number];

export const SUPPORTED_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "go",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  python: "py",
  javascript: "mjs",
  typescript: "ts",
  go: "go",
};

export const LANGUAGE_FILENAMES: Record<SupportedLanguage, string> = {
  python: "solution.py",
  javascript: "solution.mjs",
  typescript: "solution.ts",
  go: "solution.go",
};
