/**
 * Shared domain types for the Vanguard-Core stadium operations dashboard.
 *
 * All names intentionally mirror the Gemini response schema so server output can
 * flow directly into the UI without an intermediate mapping layer.
 */

export type CrowdDensity = "Low" | "Medium" | "High" | "Critical";

export type MatchUrgency = "Immediate" | "Elevated" | "Routine";
export type ImpactRadius = "Localized Sector" | "Zone Wide" | "Stadium Wide";
export type IncidentStatus = "success" | "simulation";

export interface SeverityAssessment {
  /** 1 = Critical Emergency, 4 = Routine Inconvenience. */
  priority_level: number;
  urgency: MatchUrgency | string;
  impact_radius: ImpactRadius | string;
}

export interface TacticalActionPlan {
  immediate_directives: string[];
  staff_dispatch_assignment: string;
  crowd_flow_instruction: string;
}

export interface AutomatedBroadcasts {
  english: string;
  spanish: string;
  localized_team_language: string;
}

export interface IncidentResult {
  incident_id: string;
  severity_assessment: SeverityAssessment;
  tactical_action_plan: TacticalActionPlan;
  automated_broadcasts: AutomatedBroadcasts;
  operational_justification: string;
}

export interface TelemetryInput {
  stadium_name: string;
  current_match_phase: string;
  incident_report: string;
  current_crowd_density_level: CrowdDensity;
  playing_teams: string;
}

export interface IncidentHistoryItem {
  id: string;
  timestamp: string;
  input: TelemetryInput;
  result: IncidentResult;
  status: IncidentStatus;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
}

export interface TeamPreset {
  teams: string;
  languages: string;
}

export interface ScenarioPreset {
  title: string;
  stadium_name: string;
  current_match_phase: string;
  incident_report: string;
  current_crowd_density_level: CrowdDensity;
  playing_teams: string;
}

export interface StadiumSector {
  id: string;
  name: string;
  density: CrowdDensity;
  capacity: number;
  currentCount: number;
  /** SVG polygon coordinates as space-separated `x,y` pairs. */
  coordinates: string;
  /** Sector IDs we may re-route spectators to. */
  adjacentSectors: string[];
}

export type BroadcastLanguage = "english" | "spanish" | "localized_team_language";
