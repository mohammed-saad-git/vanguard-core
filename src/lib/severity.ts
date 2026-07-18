import { CrowdDensity, ImpactRadius, MatchUrgency } from "../types";
import { CRITICAL_INCIDENT_TERMS, PriorityLevel } from "./config";

export interface SeverityDecision {
  isCritical: boolean;
  priority: PriorityLevel;
  urgency: MatchUrgency;
  impactRadius: ImpactRadius;
  /** Human-readable category used downstream for justification text and audit. */
  reason: "medical emergency" | "crowd crush" | "fire or smoke hazard" | "structural failure" | "high density congestion" | "routine bottleneck";
}

const CRITICAL_REASON_PATTERNS: Array<{ terms: readonly string[]; reason: SeverityDecision["reason"] }> = [
  { terms: ["medical", "respiratory", "breathing", "chest"], reason: "medical emergency" },
  { terms: ["crush", "pressed", "trapped", "bottleneck"], reason: "crowd crush" },
  { terms: ["fire", "smoke", "pyro", "pyrotechnic"], reason: "fire or smoke hazard" },
  { terms: ["structural", "collapse", "fractured", "broken step"], reason: "structural failure" }
];

function pickCriticalReason(lowerReport: string): SeverityDecision["reason"] {
  for (const { terms, reason } of CRITICAL_REASON_PATTERNS) {
    if (terms.some((term) => lowerReport.includes(term))) {
      return reason;
    }
  }
  return "crowd crush";
}

function densityFallback(density: CrowdDensity): Pick<SeverityDecision, "priority" | "urgency" | "impactRadius"> {
  switch (density) {
    case "Critical":
      return { priority: 2, urgency: "Elevated", impactRadius: "Zone Wide" };
    case "High":
      return { priority: 3, urgency: "Elevated", impactRadius: "Localized Sector" };
    case "Medium":
      return { priority: 4, urgency: "Routine", impactRadius: "Localized Sector" };
    case "Low":
    default:
      return { priority: 4, urgency: "Routine", impactRadius: "Localized Sector" };
  }
}

/**
 * Pure deterministic severity assessment.
 *
 * Severity engine rules:
 *   1. Any critical incident term forces Priority 1 + Immediate urgency + Stadium Wide impact.
 *      This guarantees medical/crush/fire/structural events can never be downgraded by density.
 *   2. Otherwise density controls priority and urgency — Critical density escalates to 2,
 *      High to 3, and Low/Medium to 4 so operators get a clear visual separation.
 */
export function assessSeverity(report: string, density: CrowdDensity): SeverityDecision {
  const lowerReport = report.toLowerCase();
  const isCritical = CRITICAL_INCIDENT_TERMS.some((term) => lowerReport.includes(term));

  if (isCritical) {
    return {
      isCritical: true,
      priority: 1,
      urgency: "Immediate",
      impactRadius: "Stadium Wide",
      reason: pickCriticalReason(lowerReport)
    };
  }

  const fallback = densityFallback(density);
  return {
    isCritical: false,
    reason: density === "Critical" || density === "High" ? "high density congestion" : "routine bottleneck",
    ...fallback
  };
}
