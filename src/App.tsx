import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import Header from "./components/Header";
import PresetScenarios from "./components/PresetScenarios";
import TelemetryForm from "./components/TelemetryForm";
import IncidentAuditTrail from "./components/IncidentAuditTrail";
import StadiumMap from "./components/StadiumMap";
import ActionResultsPanel from "./components/ActionResultsPanel";
import {
  createSimulationResult,
  getRerouteSectorIds,
  getPriorityBadgeClass,
  resolveAffectedSectorId,
  updateSectorDensityById
} from "./lib";
import type { ScenarioPreset, IncidentHistoryItem, IncidentResult, StadiumSector, CrowdDensity, BroadcastLanguage } from "./types";
import { INITIAL_HISTORY, INITIAL_SECTORS, SCENARIO_PRESETS } from "./data";

const FALLBACK_ERROR_MESSAGE =
  "Please provide telemetry or a text description of the stadium incident report.";

interface ActiveIncidentInput {
  stadium_name: string;
  current_match_phase: string;
  incident_report: string;
  current_crowd_density_level: CrowdDensity;
  playing_teams: string;
}

export default function App() {
  const [sectors, setSectors] = useState<StadiumSector[]>(INITIAL_SECTORS);
  const [history, setHistory] = useState<IncidentHistoryItem[]>(INITIAL_HISTORY);

  const [stadiumName, setStadiumName] = useState<string>(SCENARIO_PRESETS[0].stadium_name);
  const [currentMatchPhase, setCurrentMatchPhase] = useState<string>(SCENARIO_PRESETS[0].current_match_phase);
  const [incidentReport, setIncidentReport] = useState<string>("");
  const [currentCrowdDensity, setCurrentCrowdDensity] = useState<CrowdDensity>("Medium");
  const [playingTeams, setPlayingTeams] = useState<string>(SCENARIO_PRESETS[0].playing_teams);

  const [activeIncident, setActiveIncident] = useState<IncidentHistoryItem | null>(INITIAL_HISTORY[0]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [broadcastLanguage, setBroadcastLanguage] = useState<BroadcastLanguage>("english");

  const updateSectorDensity = useCallback((sectorId: string, density: CrowdDensity) => {
    setSectors((prev) => updateSectorDensityById(prev, sectorId, density));
  }, []);

  const buildCurrentInput = useCallback(
    (): ActiveIncidentInput => ({
      stadium_name: stadiumName,
      current_match_phase: currentMatchPhase,
      incident_report: incidentReport,
      current_crowd_density_level: currentCrowdDensity,
      playing_teams: playingTeams
    }),
    [stadiumName, currentMatchPhase, incidentReport, currentCrowdDensity, playingTeams]
  );

  const handleSelectPreset = useCallback(
    (preset: ScenarioPreset) => {
      setStadiumName(preset.stadium_name);
      setCurrentMatchPhase(preset.current_match_phase);
      setIncidentReport(preset.incident_report);
      setCurrentCrowdDensity(preset.current_crowd_density_level);
      setPlayingTeams(preset.playing_teams);
      updateSectorDensity(resolveAffectedSectorId(preset.incident_report), preset.current_crowd_density_level);
    },
    [updateSectorDensity]
  );

  const handleSelectSector = useCallback((sector: StadiumSector) => {
    setCurrentCrowdDensity(sector.density);
    setIncidentReport((prev) => {
      const base = `Critical monitoring report for ${sector.name}. Sector capacity state is currently ${sector.density} density with ${sector.currentCount.toLocaleString()} spectators. `;
      return prev.length < 10 ? `${base}Inflow gate bottleneck reported at entrance stairs.` : prev;
    });

    if (activeIncident) {
      setActiveIncident(null);
    }
  }, [activeIncident]);

  const addHistoryItem = useCallback(
    (result: IncidentResult, status: IncidentHistoryItem["status"], input: ActiveIncidentInput) => {
      const newHistoryItem: IncidentHistoryItem = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        input,
        result,
        status
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
      setActiveIncident(newHistoryItem);
      setBroadcastLanguage("english");
      updateSectorDensity(resolveAffectedSectorId(input.incident_report), input.current_crowd_density_level);
    },
    [updateSectorDensity]
  );

  const handleTriggerOrchestration = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!incidentReport.trim()) {
        setErrorMsg(FALLBACK_ERROR_MESSAGE);
        return;
      }

      setIsOrchestrating(true);
      setErrorMsg(null);

      const input = buildCurrentInput();

      try {
        const response = await fetch("/api/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `Server returned HTTP state ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.error) {
          throw new Error(responseData.error);
        }

        addHistoryItem(responseData.data as IncidentResult, responseData.status || "success", input);
      } catch (error: unknown) {
        console.warn("Backend API not reachable. Switching to client-side fallback simulation...", error);
        addHistoryItem(createSimulationResult(input), "simulation", input);
      } finally {
        setIsOrchestrating(false);
      }
    },
    [incidentReport, buildCurrentInput, addHistoryItem]
  );

  const handleRestoreHistory = useCallback((item: IncidentHistoryItem) => {
    setActiveIncident(item);
    setStadiumName(item.input.stadium_name);
    setCurrentMatchPhase(item.input.current_match_phase);
    setIncidentReport(item.input.incident_report);
    setCurrentCrowdDensity(item.input.current_crowd_density_level);
    setPlayingTeams(item.input.playing_teams);
    setBroadcastLanguage("english");
  }, []);

  const mapState = useMemo(() => {
    if (!activeIncident) {
      return { activeId: undefined, reroutes: [] as string[] };
    }

    const incidentText = `${activeIncident.input.incident_report} ${activeIncident.result.tactical_action_plan.crowd_flow_instruction}`;
    const activeId = resolveAffectedSectorId(incidentText);
    return {
      activeId,
      reroutes: getRerouteSectorIds(sectors, activeId)
    };
  }, [activeIncident, sectors]);

  const handleBroadcastLanguageChange = useCallback((language: BroadcastLanguage) => {
    setBroadcastLanguage(language);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600/30 selection:text-white antialiased">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <PresetScenarios
            stadiumName={stadiumName}
            currentCrowdDensity={currentCrowdDensity}
            onSelectPreset={handleSelectPreset}
          />

          <TelemetryForm
            stadiumName={stadiumName}
            setStadiumName={setStadiumName}
            currentMatchPhase={currentMatchPhase}
            setCurrentMatchPhase={setCurrentMatchPhase}
            playingTeams={playingTeams}
            setPlayingTeams={setPlayingTeams}
            currentCrowdDensity={currentCrowdDensity}
            setCurrentCrowdDensity={setCurrentCrowdDensity}
            incidentReport={incidentReport}
            setIncidentReport={setIncidentReport}
            errorMsg={errorMsg}
            isOrchestrating={isOrchestrating}
            onSubmit={handleTriggerOrchestration}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-6">
          <StadiumMap
            sectors={sectors}
            activeSectorId={mapState.activeId}
            rerouteToIds={mapState.reroutes}
            onSelectSector={handleSelectSector}
          />

          <ActionResultsPanel
            activeIncident={activeIncident}
            broadcastLanguage={broadcastLanguage}
            onChangeBroadcastLanguage={handleBroadcastLanguageChange}
          />
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <IncidentAuditTrail
            history={history}
            activeIncidentId={activeIncident?.id}
            onRestoreHistory={handleRestoreHistory}
            getPriorityBadgeClass={getPriorityBadgeClass}
          />

          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
            <span>Copyright 2026 FIFA World Cup Stadium Logistics Division - Vanguard-Core Orchestrator v2.0.0</span>
            <span className="flex items-center gap-1">
              <Info size={10} className="text-rose-500" aria-hidden="true" />
              Ingress and Egress Safety Compliant Model
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
