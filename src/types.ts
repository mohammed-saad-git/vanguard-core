export interface SeverityAssessment {
  priority_level: number; // 1-4
  urgency: 'Immediate' | 'Elevated' | 'Routine' | string;
  impact_radius: 'Localized Sector' | 'Zone Wide' | 'Stadium Wide' | string;
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

export interface IncidentHistoryItem {
  id: string;
  timestamp: string;
  input: {
    stadium_name: string;
    current_match_phase: string;
    incident_report: string;
    current_crowd_density_level: 'Low' | 'Medium' | 'High' | 'Critical';
    playing_teams: string;
  };
  result: IncidentResult;
  status: 'success' | 'simulation';
}

export interface StadiumSector {
  id: string;
  name: string;
  density: 'Low' | 'Medium' | 'High' | 'Critical';
  capacity: number;
  currentCount: number;
  coordinates: string; // SVG path or polygon coordinate
  adjacentSectors: string[]; // Sector IDs we can re-route to
}
