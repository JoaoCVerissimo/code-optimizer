import {
  callClaude,
  type SecurityScanResult,
} from "../ai/client.js";
import {
  SECURITY_SCANNER_SYSTEM,
  buildSecurityScanPrompt,
} from "../ai/prompts.js";
import type { SupportedLanguage } from "@code-optimizer/shared";

export async function scanForVulnerabilities(
  code: string,
  language: SupportedLanguage,
): Promise<SecurityScanResult> {
  const prompt = buildSecurityScanPrompt(language, code);
  return callClaude<SecurityScanResult>(SECURITY_SCANNER_SYSTEM, prompt);
}
