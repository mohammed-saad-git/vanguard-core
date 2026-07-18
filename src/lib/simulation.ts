import { IncidentResult } from "../types";
import { OrchestrationInput } from "./validation";
import { assessSeverity } from "./severity";

const INCIDENT_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate a collision-resistant STAD-2026-XXXX incident id. */
export function randomIncidentId(): string {
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += INCIDENT_ID_ALPHABET[Math.floor(Math.random() * INCIDENT_ID_ALPHABET.length)];
  }
  return `STAD-2026-${suffix}`;
}

const CRITICAL_DIRECTIVES = [
  "Alert emergency medical responders and route them through designated fast-track service tunnels.",
  "Initiate controlled evacuation of the affected sector toward pre-planned low-density overflow sectors.",
  "Override dynamic wayfinding signage to display alternative safe pathways and disable escalators feeding the affected zone."
];

const ROUTINE_DIRECTIVES = [
  "Deploy stadium marshals to set up physical guidance barricades.",
  "Pre-position medical responders on standby one zone away from the affected area.",
  "Activate dynamic wayfinding signage in concourses to display alternative safe pathways."
];

function buildSpanishBroadcast(): string {
  return "Atencion aficionados de la Copa Mundial: se ha producido un incidente cerca de ustedes. Mantengan la calma, sigan al personal de seguridad y avancen lentamente hacia los sectores indicados.";
}

/**
 * Deterministic offline simulation result.
 *
 * Mirrors the Gemini response schema 1:1 so the offline fallback is
 * indistinguishable to the UI from a live AI orchestration result.
 */
export function createSimulationResult(
  input: OrchestrationInput,
  makeIncidentId: () => string = randomIncidentId
): IncidentResult {
  const severity = assessSeverity(input.incident_report, input.current_crowd_density_level);

  const directives = [
    `Dispatch immediate sector response teams to the affected area in ${input.stadium_name}.`,
    severity.isCritical ? CRITICAL_DIRECTIVES[0] : ROUTINE_DIRECTIVES[0],
    severity.isCritical ? CRITICAL_DIRECTIVES[1] : ROUTINE_DIRECTIVES[1]
  ];

  const staff = severity.isCritical
    ? "CRITICAL: Deploy 4 medical response teams, 8 security marshals, and 12 guest experience volunteers to clear emergency lanes immediately."
    : "Deploy 6 crowd-flow marshals and 4 security officers to manage turnstile gates and ease bottlenecking.";

  const crowdFlow = severity.isCritical
    ? "RE-ROUTE ALERT: Direct fans away from the affected sector toward adjacent low-density sectors 102 and 108. Do not route spectators through zones marked High or Critical."
    : "CROWD REGULATION: Temporarily pause ingress at the affected gate and divert queue streams to the East Gate Annex.";

  return {
    incident_id: makeIncidentId(),
    severity_assessment: {
      priority_level: severity.priority,
      urgency: severity.urgency,
      impact_radius: severity.impactRadius
    },
    tactical_action_plan: {
      immediate_directives: directives,
      staff_dispatch_assignment: staff,
      crowd_flow_instruction: crowdFlow
    },
    automated_broadcasts: {
      english:
        "Attention World Cup fans: an incident has occurred nearby. Please remain calm, follow security personnel, and move slowly toward the indicated adjacent sectors.",
      spanish: buildSpanishBroadcast(),
      localized_team_language:
        "Attention fans: please remain calm, follow staff instructions, and move slowly toward the indicated safe sectors."
    },
    operational_justification: buildJustification(severity)
  };
}

function buildJustification(
  severity: ReturnType<typeof assessSeverity>
): string {
  if (severity.isCritical) {
    return `Decision formulated due to critical risk elements (${severity.reason}). Re-routing diverts crowd flow to adjacent open sectors and avoids critical bottlenecks to preserve safe ingress and egress channels.`;
  }
  return `Decision formulated due to standard operating procedure for ${severity.reason}. Re-routing diverts crowd flow to adjacent open sectors and avoids critical bottlenecks to preserve safe ingress and egress channels.`;
}
