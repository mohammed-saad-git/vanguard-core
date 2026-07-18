import { CrowdDensity } from "../types";


/**
 * Centralised configuration and tuning constants.
 * Keeping these in one place prevents magic numbers from leaking across the codebase
 * and makes security/performance knobs easy to audit and tune.
 */

export const APP_NAME = "Vanguard-Core";
export const APP_VERSION = "2.0.0";

export const TEXT_LIMITS = {
  INCIDENT_REPORT_MAX: 500,
  PLAYING_TEAMS_MAX: 100,
  STADIUM_NAME_MAX: 80,
  MATCH_PHASE_MAX: 60
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000,
  MAX_REQUESTS: 15,
  /** Drop stale IP buckets periodically so the Map cannot grow without bound. */
  SWEEP_INTERVAL_MS: 5 * 60 * 1000
} as const;

export const HTTP_BODY_LIMIT = "10kb";

/** Capacity-utilisation ratio applied to a sector's max capacity when its density changes. */
export const DENSITY_FILL_RATIO: Record<CrowdDensity, number> = {
  Low: 0.2,
  Medium: 0.48,
  High: 0.82,
  Critical: 0.98
};

/** Priority levels used by the severity engine. 1 == Critical Emergency. */
export const PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  ROUTINE: 4
} as const;

export type PriorityLevel = (typeof PRIORITY)[keyof typeof PRIORITY];

/** Fallback centroid used when SVG polygon coordinates cannot be parsed. */
export const FALLBACK_CENTROID = { x: 150, y: 110 } as const;

/** Terms that escalate any incident to critical priority regardless of density. */
export const CRITICAL_INCIDENT_TERMS = [
  "medical",
  "crush",
  "fire",
  "smoke",
  "structural",
  "collapse",
  "pyro",
  "respiratory",
  "breathing",
  "compressed",
  "trapped"
] as const;

/** Density states that disqualify a sector from being a reroute target. */
export const BLOCKED_REROUTE_DENSITIES: ReadonlySet<CrowdDensity> = new Set<CrowdDensity>([
  "High",
  "Critical"
]);
