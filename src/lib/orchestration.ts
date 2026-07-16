import { CROWD_DENSITIES, MATCH_PHASES, STADIUMS } from "../data";
import { IncidentResult, StadiumSector } from "../types";

export type CrowdDensity = StadiumSector["density"];

export interface OrchestrationInput {
  stadium_name: string;
  current_match_phase: string;
  incident_report: string;
  current_crowd_density_level: CrowdDensity;
  playing_teams: string;
}

export interface ValidationResult {
  ok: boolean;
  value?: OrchestrationInput;
  status?: number;
  error?: string;
  details?: string;
}

const CRITICAL_TERMS = ["medical", "crush", "fire", "structural"];
const DEFAULT_TEAMS = "United States vs Mexico";
const SAFE_TEXT_PATTERN = /[^\p{L}\p{N}\s.,!?:()'"-]/gu;

export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, "")
    .replace(SAFE_TEXT_PATTERN, "")
    .slice(0, maxLength)
    .trim();
}

export function validateOrchestrationPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      status: 400,
      error: "Invalid request body.",
      details: "Expected a JSON object with stadium telemetry fields."
    };
  }

  const body = payload as Partial<Record<keyof OrchestrationInput, unknown>>;
  const {
    stadium_name,
    current_match_phase,
    incident_report,
    current_crowd_density_level,
    playing_teams
  } = body;

  if (!stadium_name || !current_match_phase || !incident_report || !current_crowd_density_level) {
    return {
      ok: false,
      status: 400,
      error: "Missing required inputs.",
      details: "Please specify stadium_name, current_match_phase, incident_report, and current_crowd_density_level."
    };
  }

  if (
    typeof stadium_name !== "string" ||
    typeof current_match_phase !== "string" ||
    typeof incident_report !== "string" ||
    typeof current_crowd_density_level !== "string" ||
    (playing_teams !== undefined && typeof playing_teams !== "string")
  ) {
    return {
      ok: false,
      status: 400,
      error: "Invalid input types.",
      details: "All telemetry values must be strings."
    };
  }

  const allowedStadiums = STADIUMS.map((stadium) => stadium.name);
  if (!allowedStadiums.includes(stadium_name)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid stadium name.",
      details: `Must be one of: ${allowedStadiums.join(", ")}`
    };
  }

  if (!MATCH_PHASES.includes(current_match_phase)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid match phase.",
      details: `Must be one of: ${MATCH_PHASES.join(", ")}`
    };
  }

  if (!CROWD_DENSITIES.includes(current_crowd_density_level as CrowdDensity)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid crowd density level.",
      details: `Must be one of: ${CROWD_DENSITIES.join(", ")}`
    };
  }

  const cleanReport = sanitizeText(incident_report, 500);
  if (cleanReport.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Invalid incident report length.",
      details: "Incident report must be between 1 and 500 safe characters."
    };
  }

  const cleanTeams = typeof playing_teams === "string"
    ? sanitizeText(playing_teams, 100) || DEFAULT_TEAMS
    : DEFAULT_TEAMS;

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

export function resolveAffectedSectorId(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("104") || lowerText.includes("west gate") || lowerText.includes("collapse")) {
    return "sec-104";
  }

  if (lowerText.includes("107") || lowerText.includes("south east") || lowerText.includes("pyro")) {
    return "sec-107";
  }

  if (
    lowerText.includes("105") ||
    lowerText.includes("south west") ||
    lowerText.includes("blackout") ||
    lowerText.includes("gate c")
  ) {
    return "sec-105";
  }

  if (lowerText.includes("101") || lowerText.includes("turnstile")) {
    return "sec-101";
  }

  return "sec-102";
}

export function updateSectorDensityById(
  sectors: StadiumSector[],
  sectorId: string,
  density: CrowdDensity
): StadiumSector[] {
  const fillRatios: Record<CrowdDensity, number> = {
    Low: 0.2,
    Medium: 0.48,
    High: 0.82,
    Critical: 0.98
  };

  return sectors.map((sector) => {
    if (sector.id !== sectorId) {
      return sector;
    }

    return {
      ...sector,
      density,
      currentCount: Math.round(sector.capacity * fillRatios[density])
    };
  });
}

export function getRerouteSectorIds(sectors: StadiumSector[], activeSectorId?: string): string[] {
  if (!activeSectorId) {
    return [];
  }

  const sectorById = new Map(sectors.map((sector) => [sector.id, sector]));
  const activeSector = sectorById.get(activeSectorId);

  if (!activeSector) {
    return [];
  }

  return activeSector.adjacentSectors.filter((sectorId) => {
    const targetSector = sectorById.get(sectorId);
    return targetSector ? targetSector.density !== "Critical" : false;
  });
}

export function assessSeverity(report: string, density: CrowdDensity) {
  const lowerReport = report.toLowerCase();
  const isCritical = CRITICAL_TERMS.some((term) => lowerReport.includes(term));

  return {
    isCritical,
    priority: isCritical ? 1 : density === "Critical" ? 2 : density === "High" ? 3 : 4,
    urgency: isCritical ? "Immediate" : density === "Critical" || density === "High" ? "Elevated" : "Routine",
    impactRadius: isCritical ? "Stadium Wide" : density === "Critical" ? "Zone Wide" : "Localized Sector"
  } as const;
}

export function randomIncidentId(): string {
  return `STAD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createSimulationResult(
  input: OrchestrationInput,
  makeIncidentId: () => string = randomIncidentId
): IncidentResult {
  const severity = assessSeverity(input.incident_report, input.current_crowd_density_level);
  const criticalReason = input.incident_report.toLowerCase().includes("medical")
    ? "medical emergency"
    : "high risk crowd scenario";

  return {
    incident_id: makeIncidentId(),
    severity_assessment: {
      priority_level: severity.priority,
      urgency: severity.urgency,
      impact_radius: severity.impactRadius
    },
    tactical_action_plan: {
      immediate_directives: [
        `Dispatch immediate sector response teams to the affected area in ${input.stadium_name}.`,
        severity.isCritical
          ? "Alert emergency medical responders and route them through designated fast-track service tunnels."
          : "Deploy stadium marshals to set up physical guidance barricades.",
        "Activate dynamic wayfinding signage in concourses to display alternative safe pathways."
      ],
      staff_dispatch_assignment: severity.isCritical
        ? "CRITICAL: Deploy 4 medical response teams, 8 security marshals, and 12 guest experience volunteers to clear emergency lanes immediately."
        : "Deploy 6 crowd-flow marshals and 4 security officers to manage turnstile gates and ease bottlenecking.",
      crowd_flow_instruction: severity.isCritical
        ? "RE-ROUTE ALERT: Direct fans away from the affected sector toward adjacent low-density sectors 102 and 108. Do not route spectators through zones marked High or Critical."
        : "CROWD REGULATION: Temporarily pause ingress at the affected gate and divert queue streams to the East Gate Annex."
    },
    automated_broadcasts: {
      english:
        "Attention World Cup fans: an incident has occurred nearby. Please remain calm, follow security personnel, and move slowly toward the indicated adjacent sectors.",
      spanish:
        "Atencion aficionados de la Copa Mundial: se ha producido un incidente cerca de ustedes. Mantengan la calma, sigan al personal de seguridad y avancen lentamente hacia los sectores indicados.",
      localized_team_language:
        "Attention fans: please remain calm, follow staff instructions, and move slowly toward the indicated safe sectors."
    },
    operational_justification: `Decision formulated due to ${
      severity.isCritical ? `critical risk elements (${criticalReason})` : "standard operating procedure for high density congestion"
    }. Re-routing diverts crowd flow to adjacent open sectors and avoids critical bottlenecks to preserve safe ingress and egress channels.`
  };
}

export function getPolygonCentroid(coordinates: string): { x: number; y: number } {
  const points = coordinates
    .trim()
    .split(/\s+/)
    .map((point) => point.split(",").map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  if (points.length === 0) {
    return { x: 150, y: 110 };
  }

  const totals = points.reduce(
    (sum, [x, y]) => ({
      x: sum.x + x,
      y: sum.y + y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: Math.round(totals.x / points.length),
    y: Math.round(totals.y / points.length)
  };
}
