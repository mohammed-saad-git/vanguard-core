import { CROWD_DENSITIES, MATCH_PHASES, STADIUMS } from "../data";
import { CrowdDensity, TelemetryInput } from "../types";
import { TEXT_LIMITS } from "./config";
import { sanitizeText } from "./sanitize";

export interface OrchestrationInput extends TelemetryInput {}

export interface ValidationResult {
  ok: boolean;
  value?: OrchestrationInput;
  status?: number;
  error?: string;
  details?: string;
}

const DEFAULT_TEAMS = "United States vs Mexico";

export interface FieldRule<T> {
  valid: boolean;
  value?: T;
  error?: string;
  details?: string;
}

/** Pre-computed lookup sets keep payload validation O(1) per field. */
const ALLOWED_STADIUMS: ReadonlySet<string> = new Set(STADIUMS.map((s) => s.name));
const ALLOWED_PHASES: ReadonlySet<string> = new Set(MATCH_PHASES);
const ALLOWED_DENSITIES: ReadonlySet<CrowdDensity> = new Set<CrowdDensity>(CROWD_DENSITIES);

function reject(status: number, error: string, details: string): ValidationResult {
  return { ok: false, status, error, details };
}

/**
 * Validate, normalise and sanitise an incoming orchestration payload.
 *
 * Returns the typed, trusted value on success. The returned object is always a
 * fresh structure so callers can hand it straight to Gemini without leaking
 * attacker-controlled fields.
 */
export function validateOrchestrationPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object") {
    return reject(400, "Invalid request body.", "Expected a JSON object with stadium telemetry fields.");
  }

  const body = payload as Partial<Record<keyof OrchestrationInput, unknown>>;
  const {
    stadium_name,
    current_match_phase,
    incident_report,
    current_crowd_density_level,
    playing_teams
  } = body;

  if (
    stadium_name === undefined ||
    current_match_phase === undefined ||
    incident_report === undefined ||
    current_crowd_density_level === undefined
  ) {
    return reject(
      400,
      "Missing required inputs.",
      "Please specify stadium_name, current_match_phase, incident_report, and current_crowd_density_level."
    );
  }

  if (
    typeof stadium_name !== "string" ||
    typeof current_match_phase !== "string" ||
    typeof incident_report !== "string" ||
    typeof current_crowd_density_level !== "string" ||
    (playing_teams !== undefined && typeof playing_teams !== "string")
  ) {
    return reject(400, "Invalid input types.", "All telemetry values must be strings.");
  }

  if (!ALLOWED_STADIUMS.has(stadium_name)) {
    return reject(400, "Invalid stadium name.", `Must be one of: ${[...ALLOWED_STADIUMS].join(", ")}`);
  }

  if (!ALLOWED_PHASES.has(current_match_phase)) {
    return reject(400, "Invalid match phase.", `Must be one of: ${[...ALLOWED_PHASES].join(", ")}`);
  }

  if (!ALLOWED_DENSITIES.has(current_crowd_density_level as CrowdDensity)) {
    return reject(400, "Invalid crowd density level.", `Must be one of: ${[...ALLOWED_DENSITIES].join(", ")}`);
  }

  const cleanReport = sanitizeText(incident_report, TEXT_LIMITS.INCIDENT_REPORT_MAX);
  if (cleanReport.length === 0) {
    return reject(400, "Invalid incident report length.", "Incident report must be between 1 and 500 safe characters.");
  }

  const cleanTeams =
    typeof playing_teams === "string" ? sanitizeText(playing_teams, TEXT_LIMITS.PLAYING_TEAMS_MAX) || DEFAULT_TEAMS : DEFAULT_TEAMS;

  return {
    ok: true,
    value: {
      stadium_name,
      current_match_phase,
      incident_report: cleanReport,
      current_crowd_density_level: current_crowd_density_level as CrowdDensity,
      playing_teams: cleanTeams
    }
  };
}
