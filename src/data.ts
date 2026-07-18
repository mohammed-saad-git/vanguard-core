import { IncidentHistoryItem, ScenarioPreset, Stadium, StadiumSector, TeamPreset } from "./types";

export const STADIUMS: readonly Stadium[] = [
  { id: "metlife", name: "MetLife Stadium", city: "East Rutherford, NJ", capacity: 82500 },
  { id: "sofi", name: "Los Angeles Stadium", city: "Inglewood, CA", capacity: 70000 },
  { id: "mercedes", name: "Atlanta Stadium", city: "Atlanta, GA", capacity: 71000 },
  { id: "azteca", name: "Aztec Stadium", city: "Mexico City, MX", capacity: 87500 },
  { id: "bmo", name: "Toronto Stadium", city: "Toronto, ON", capacity: 45000 }
];

export const MATCH_PHASES: readonly string[] = [
  "Pre-match ingress",
  "1st Half - 15th Minute",
  "Half-time",
  "2nd Half - 75th Minute",
  "Post-match egress"
];

export const CROWD_DENSITIES = ["Low", "Medium", "High", "Critical"] as const;

export const TEAM_PRESETS: readonly TeamPreset[] = [
  { teams: "USA vs Mexico", languages: "English, Spanish" },
  { teams: "Mexico vs Germany", languages: "Spanish, German, English" },
  { teams: "Argentina vs France", languages: "Spanish, French, English" },
  { teams: "Japan vs Brazil", languages: "Japanese, Portuguese, English" },
  { teams: "Canada vs Morocco", languages: "English, French, Arabic" },
  { teams: "England vs Italy", languages: "English, Italian" }
];

export const INITIAL_SECTORS: StadiumSector[] = [
  { id: "sec-101", name: "Sector 101 (North East)", density: "Medium", capacity: 4500, currentCount: 2200, coordinates: "10,10 90,10 80,70 10,60", adjacentSectors: ["sec-102", "sec-108"] },
  { id: "sec-102", name: "Sector 102 (North Gate)", density: "High", capacity: 5000, currentCount: 4200, coordinates: "90,10 170,10 160,70 80,70", adjacentSectors: ["sec-101", "sec-103"] },
  { id: "sec-103", name: "Sector 103 (North West)", density: "Low", capacity: 4500, currentCount: 1100, coordinates: "170,10 250,10 240,60 160,70", adjacentSectors: ["sec-102", "sec-104"] },
  { id: "sec-104", name: "Sector 104 (West Gate)", density: "Critical", capacity: 5500, currentCount: 5450, coordinates: "250,10 290,90 230,120 240,60", adjacentSectors: ["sec-103", "sec-105"] },
  { id: "sec-105", name: "Sector 105 (South West)", density: "Medium", capacity: 4500, currentCount: 2000, coordinates: "290,90 290,170 230,150 230,120", adjacentSectors: ["sec-104", "sec-106"] },
  { id: "sec-106", name: "Sector 106 (South Gate)", density: "Low", capacity: 5000, currentCount: 950, coordinates: "290,170 210,210 150,150 230,150", adjacentSectors: ["sec-105", "sec-107"] },
  { id: "sec-107", name: "Sector 107 (South East)", density: "High", capacity: 4500, currentCount: 3800, coordinates: "210,210 130,210 110,150 150,150", adjacentSectors: ["sec-106", "sec-108"] },
  { id: "sec-108", name: "Sector 108 (East Gate)", density: "Low", capacity: 5500, currentCount: 1500, coordinates: "130,210 10,170 60,110 110,150", adjacentSectors: ["sec-107", "sec-101"] }
];

export const SCENARIO_PRESETS: readonly ScenarioPreset[] = [
  {
    title: "Turnstile Failure (MetLife)",
    stadium_name: "MetLife Stadium",
    current_match_phase: "Pre-match ingress",
    incident_report: "Turnstile reader system at Gate B failed entirely. Crowds of incoming fans are building rapidly. Families are starting to get pressed against outer security barricades, posing a mild crush hazard.",
    current_crowd_density_level: "Critical",
    playing_teams: "USA vs Mexico"
  },
  {
    title: "Medical Collapse (SoFi)",
    stadium_name: "Los Angeles Stadium",
    current_match_phase: "Half-time",
    incident_report: "An adult fan collapsed in Sector 104 West Gate concourse with breathing difficulties and chest pains. A crowd of bystanders has gathered around, blocking the evacuation stairs and first-aid access routes.",
    current_crowd_density_level: "Medium",
    playing_teams: "Canada vs Morocco"
  },
  {
    title: "Smoke Pyro Incident (Atlanta)",
    stadium_name: "Atlanta Stadium",
    current_match_phase: "2nd Half - 75th Minute",
    incident_report: "Unauthorized red smoke pyrotechnic ignited in upper Sector 107 South East. Smoke is dense and blowing into exit corridor Gate D, triggering alarms and causing mild respiratory discomfort and minor pushing toward the East Gate.",
    current_crowd_density_level: "High",
    playing_teams: "Argentina vs France"
  },
  {
    title: "Power Loss Lockout (Azteca)",
    stadium_name: "Aztec Stadium",
    current_match_phase: "Post-match egress",
    incident_report: "Gate C egress gates suffered localized power blackout, triggering automatic magnetic fail-secure locks. Fans exiting Sector 105 are unable to pass through, creating a heavy bottleneck in the exit corridor with vocal fan frustration.",
    current_crowd_density_level: "Critical",
    playing_teams: "Mexico vs Germany"
  }
];

export const INITIAL_HISTORY: IncidentHistoryItem[] = [
  {
    id: "hist-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    input: {
      stadium_name: "MetLife Stadium",
      current_match_phase: "Pre-match ingress",
      incident_report: "Turnstile reader system at Gate B failed entirely. Crowds of incoming fans are building rapidly. Families are starting to get pressed against outer security barricades, posing a mild crush hazard.",
      current_crowd_density_level: "Critical",
      playing_teams: "USA vs Mexico"
    },
    result: {
      incident_id: "STAD-2026-9042",
      severity_assessment: {
        priority_level: 1,
        urgency: "Immediate",
        impact_radius: "Stadium Wide"
      },
      tactical_action_plan: {
        immediate_directives: [
          "Deploy emergency crowd-control marshals to set up physical guiding corridors at Gate B.",
          "Manually release fail-secure gates and switch to manual bar-code ticket validation.",
          "Instruct digital wayfinding teams to divert approaching fans from North Transit Hub to East Gates."
        ],
        staff_dispatch_assignment: "CRITICAL: Deploy 12x Safety Stewards to manage Gate B pressure, and route 2x paramedic teams to stand by at Sector 104.",
        crowd_flow_instruction: "RE-ROUTE PORT: Direct all approaching Gate B queue lines eastward to Gate E (Sector 108), which has extremely low density (1,500/5,500 fans)."
      },
      automated_broadcasts: {
        english: "Attention MetLife Stadium visitors approaching Gate B: Please stay calm and follow crowd control officials. Gate B is temporarily re-routing ingress to adjacent East Gates. Please walk slowly.",
        spanish: "Atención visitantes de MetLife Stadium en la entrada B: Mantengan la calma y sigan al personal de control. La entrada B está desviando temporalmente el ingreso a las puertas del este. Por favor camine despacio.",
        localized_team_language: "Attention fans: Gate B is closed. Divert Eastward. Sigan al este."
      },
      operational_justification: "Critical Priority: 1 triggered due to potential crowd crush indicators at Gate B. Rerouting directs spectators exclusively to Sector 108 (East Gate), which operates at a highly comfortable low-density state."
    },
    status: "success"
  },
  {
    id: "hist-2",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    input: {
      stadium_name: "Los Angeles Stadium",
      current_match_phase: "1st Half - 15th Minute",
      incident_report: "A broken step on concourse stairwell 4A has caused minor trips. No major injuries, but fans are slowing down to look, causing a mild pedestrian flow bottleneck.",
      current_crowd_density_level: "Low",
      playing_teams: "Japan vs Brazil"
    },
    result: {
      incident_id: "STAD-2026-3820",
      severity_assessment: {
        priority_level: 3,
        urgency: "Routine",
        impact_radius: "Localized Sector"
      },
      tactical_action_plan: {
        immediate_directives: [
          "Erect hazard warning cones and yellow tape around the fractured step.",
          "Post 2x volunteers to actively wave fans away from the damaged side.",
          "Issue a high-priority repair ticket to on-site stadium maintenance."
        ],
        staff_dispatch_assignment: "Dispatch 2x maintenance carpenters to Stairwell 4A, and post 1x guest-services volunteer at the top and bottom.",
        crowd_flow_instruction: "Instruct fans to use Escalator Bank 3 or East Stairs instead of Stairwell 4A."
      },
      automated_broadcasts: {
        english: "Notice for fans near Sector 103: Please exercise caution on Stairwell 4A due to maintenance. Use alternative exit ways.",
        spanish: "Aviso para aficionados cerca del Sector 103: Tengan precaución en la escalera 4A por mantenimiento. Usen accesos alternativos.",
        localized_team_language: "セクター103周辺のファンの皆様：階段4Aはメンテナンス中のためご注意ください。/ Atenção adeptos no Sector 103: cuidado na escada 4A."
      },
      operational_justification: "Assigned Priority 3 as there are no immediate medical or physical crush threats. Localized intervention isolates the staircase bottleneck and bypasses traffic smoothly."
    },
    status: "success"
  }
];
