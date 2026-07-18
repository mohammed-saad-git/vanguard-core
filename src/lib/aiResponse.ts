import { IncidentResult } from "../types";

/**
 * Validates the Gemini model's response shape before it is returned to the
 * client. Defends against schema drift, partial responses and prompt-injected
 * output that violates the configured responseSchema.
 */
const REQUIRED_DIRECTIVE_MIN = 1;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") && value.length >= REQUIRED_DIRECTIVE_MIN;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function validateIncidentResult(payload: unknown): IncidentResult | null {
  if (!isObject(payload)) return null;

  const severity = payload.severity_assessment;
  if (!isObject(severity)) return null;
  const priority = severity.priority_level;
  const urgency = getString(severity, "urgency");
  const impact = getString(severity, "impact_radius");
  if (typeof priority !== "number" || priority < 1 || priority > 4 || !urgency || !impact) {
    return null;
  }

  const tactical = payload.tactical_action_plan;
  if (!isObject(tactical)) return null;
  const directives = tactical.immediate_directives;
  const staff = getString(tactical, "staff_dispatch_assignment");
  const crowdFlow = getString(tactical, "crowd_flow_instruction");
  if (!isStringArray(directives) || !staff || !crowdFlow) return null;

  const broadcasts = payload.automated_broadcasts;
  if (!isObject(broadcasts)) return null;
  const english = getString(broadcasts, "english");
  const spanish = getString(broadcasts, "spanish");
  const localized = getString(broadcasts, "localized_team_language");
  if (!english || !spanish || !localized) return null;

  const incidentId = getString(payload, "incident_id");
  const justification = getString(payload, "operational_justification");
  if (!incidentId || !justification) return null;

  return {
    incident_id: incidentId,
    severity_assessment: { priority_level: priority, urgency, impact_radius: impact },
    tactical_action_plan: {
      immediate_directives: directives,
      staff_dispatch_assignment: staff,
      crowd_flow_instruction: crowdFlow
    },
    automated_broadcasts: {
      english,
      spanish,
      localized_team_language: localized
    },
    operational_justification: justification
  };
}
