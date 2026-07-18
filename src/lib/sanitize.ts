import { CrowdDensity } from "../types";
import { TEXT_LIMITS } from "./config";

/**
 * Defensive text sanitiser shared by the server and the offline simulation path.
 *
 * The pipeline is deliberately layered:
 *   1. Strip HTML tags (blocks the common `<script>` vector).
 *   2. Strip obfuscated `javascript:` URIs even if attackers insert whitespace.
 *   3. Allow only a safe Unicode subset so emoji/whitespace/markup can't smuggle
 *      control characters into the Gemini prompt or the rendered UI.
 *   4. Clamp to the configured maximum length to keep prompts bounded.
 */
const HTML_TAG_PATTERN = /<[^>]*>/g;
const JAVASCRIPT_URI_PATTERN = /j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi;
const SAFE_TEXT_PATTERN = /[^\p{L}\p{N}\s.,!?:()'"-]/gu;

export function sanitizeText(value: string, maxLength: number = TEXT_LIMITS.INCIDENT_REPORT_MAX): string {
  return value
    .replace(HTML_TAG_PATTERN, "")
    .replace(JAVASCRIPT_URI_PATTERN, "")
    .replace(SAFE_TEXT_PATTERN, "")
    .slice(0, maxLength)
    .trim();
}

/** True when `value` is a non-empty string post-sanitisation. */
export function isNonEmptySanitized(value: unknown, maxLength: number): boolean {
  return typeof value === "string" && sanitizeText(value, maxLength).length > 0;
}

export type { CrowdDensity };
