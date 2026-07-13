import React, { useState, useEffect } from "react";
import { AlertTriangle, Info, Award } from "lucide-react";
import Header from "./components/Header";
import PresetScenarios from "./components/PresetScenarios";
import TelemetryForm from "./components/TelemetryForm";
import IncidentAuditTrail from "./components/IncidentAuditTrail";
import StadiumMap from "./components/StadiumMap";
import BroadcastSimulator from "./components/BroadcastSimulator";

import { 
  INITIAL_SECTORS, 
  SCENARIO_PRESETS, 
  INITIAL_HISTORY 
} from "./data";
import { StadiumSector, IncidentHistoryItem, IncidentResult } from "./types";

export default function App() {
  // Application State
  const [sectors, setSectors] = useState<StadiumSector[]>(INITIAL_SECTORS);
  const [history, setHistory] = useState<IncidentHistoryItem[]>(INITIAL_HISTORY);
  
  // Active Form Controls
  const [stadiumName, setStadiumName] = useState(SCENARIO_PRESETS[0].stadium_name);
  const [currentMatchPhase, setCurrentMatchPhase] = useState(SCENARIO_PRESETS[0].current_match_phase);
  const [incidentReport, setIncidentReport] = useState("");
  const [currentCrowdDensity, setCurrentCrowdDensity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [playingTeams, setPlayingTeams] = useState(SCENARIO_PRESETS[0].playing_teams);
  
  // Active Orchestrated Incident State
  const [activeIncident, setActiveIncident] = useState<IncidentHistoryItem | null>(INITIAL_HISTORY[0]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Simulator State
  const [broadcastLanguage, setBroadcastLanguage] = useState<"english" | "spanish" | "localized_team_language">("english");
  const [liveUtcTime, setLiveUtcTime] = useState("");

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveUtcTime(now.toUTCString().replace("GMT", "UTC"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Preset Handler
  const handleSelectPreset = (preset: typeof SCENARIO_PRESETS[0]) => {
    setStadiumName(preset.stadium_name);
    setCurrentMatchPhase(preset.current_match_phase);
    setIncidentReport(preset.incident_report);
    setCurrentCrowdDensity(preset.current_crowd_density_level);
    setPlayingTeams(preset.playing_teams);
    
    // Automatically locate corresponding sector if applicable
    const lowerReport = preset.incident_report.toLowerCase();
    let targetSectorId = "sec-102"; // default fallback
    if (lowerReport.includes("104") || lowerReport.includes("collapse")) {
      targetSectorId = "sec-104";
    } else if (lowerReport.includes("107") || lowerReport.includes("pyro")) {
      targetSectorId = "sec-107";
    } else if (lowerReport.includes("105") || lowerReport.includes("gate c")) {
      targetSectorId = "sec-105";
    } else if (lowerReport.includes("101") || lowerReport.includes("turnstile")) {
      targetSectorId = "sec-101";
    }
    
    // Set targeted sector density to match preset density
    updateSectorDensity(targetSectorId, preset.current_crowd_density_level);
  };

  // Map click handler - pre-populates the sector context
  const handleSelectSector = (sector: StadiumSector) => {
    setCurrentCrowdDensity(sector.density);
    setIncidentReport((prev) => {
      const base = `Critical monitoring report for ${sector.name}. Sector capacity state is currently ${sector.density} density with ${sector.currentCount.toLocaleString()} spectators. `;
      if (prev.length < 10) return base + "Inflow gate bottleneck reported at entrance stairs.";
      return prev;
    });
    
    if (activeIncident) {
      setActiveIncident(null);
    }
  };

  const updateSectorDensity = (sectorId: string, density: "Low" | "Medium" | "High" | "Critical") => {
    setSectors(prev => prev.map(sec => {
      if (sec.id === sectorId) {
        let currentCount = sec.currentCount;
        if (density === "Critical") currentCount = Math.round(sec.capacity * 0.98);
        else if (density === "High") currentCount = Math.round(sec.capacity * 0.82);
        else if (density === "Medium") currentCount = Math.round(sec.capacity * 0.48);
        else currentCount = Math.round(sec.capacity * 0.20);

        return { ...sec, density, currentCount };
      }
      return sec;
    }));
  };

  // Main Orchestration Trigger
  const handleTriggerOrchestration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentReport.trim()) {
      setErrorMsg("Please provide some telemetry or text description of the stadium incident report.");
      return;
    }

    setIsOrchestrating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stadium_name: stadiumName,
          current_match_phase: currentMatchPhase,
          incident_report: incidentReport,
          current_crowd_density_level: currentCrowdDensity,
          playing_teams: playingTeams
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned HTTP state ${response.status}`);
      }

      const responseData = await response.json();
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const result: IncidentResult = responseData.data;

      const newHistoryItem: IncidentHistoryItem = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        input: {
          stadium_name: stadiumName,
          current_match_phase: currentMatchPhase,
          incident_report: incidentReport,
          current_crowd_density_level: currentCrowdDensity,
          playing_teams: playingTeams
        },
        result,
        status: responseData.status || "success"
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setActiveIncident(newHistoryItem);
      setBroadcastLanguage("english");

      // Dynamic adjustment of sectors based on Gen-AI Tactical decision instructions
      const lowerReport = incidentReport.toLowerCase();
      let affectedSecId = "sec-102";
      if (lowerReport.includes("104") || lowerReport.includes("collapse")) affectedSecId = "sec-104";
      if (lowerReport.includes("107") || lowerReport.includes("pyro")) affectedSecId = "sec-107";
      if (lowerReport.includes("105") || lowerReport.includes("gate c")) affectedSecId = "sec-105";
      if (lowerReport.includes("101") || lowerReport.includes("turnstile")) affectedSecId = "sec-101";

      updateSectorDensity(affectedSecId, currentCrowdDensity);

    } catch (error: unknown) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Communication failure. Please ensure the server is active.");
    } finally {
      setIsOrchestrating(false);
    }
  };

  // Restore history state to active view
  const handleRestoreHistory = (item: IncidentHistoryItem) => {
    setActiveIncident(item);
    setStadiumName(item.input.stadium_name);
    setCurrentMatchPhase(item.input.current_match_phase);
    setIncidentReport(item.input.incident_report);
    setCurrentCrowdDensity(item.input.current_crowd_density_level);
    setPlayingTeams(item.input.playing_teams);
    setBroadcastLanguage("english");
  };

  // Get active sector and reroute sectors based on Tactical action plan logic
  const getActiveSectorAndReroutes = () => {
    if (!activeIncident) return { activeId: undefined, reroutes: [] };
    
    const textStr = (activeIncident.input.incident_report + " " + activeIncident.result.tactical_action_plan.crowd_flow_instruction).toLowerCase();
    
    let activeId = "sec-102"; // default North Gate
    if (textStr.includes("104") || textStr.includes("west gate") || textStr.includes("collapse")) activeId = "sec-104";
    else if (textStr.includes("107") || textStr.includes("south east") || textStr.includes("pyro")) activeId = "sec-107";
    else if (textStr.includes("105") || textStr.includes("south west") || textStr.includes("blackout") || textStr.includes("gate c")) activeId = "sec-105";
    else if (textStr.includes("101") || textStr.includes("turnstile")) activeId = "sec-101";

    const activeSecObj = sectors.find(s => s.id === activeId);
    let reroutes: string[] = [];
    if (activeSecObj) {
      reroutes = activeSecObj.adjacentSectors.filter(adjId => {
        const targetSec = sectors.find(s => s.id === adjId);
        return targetSec ? targetSec.density !== "Critical" : true;
      });
    }

    return { activeId, reroutes };
  };

  const { activeId: mapActiveSectorId, reroutes: mapRerouteToIds } = getActiveSectorAndReroutes();

  // Color mapping utilities for priority
  const getPriorityBadgeClass = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-500/20 text-red-400 border-red-500/50 ring-2 ring-red-500/20";
      case 2:
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case 3:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "1 - Critical Emergency";
      case 2: return "2 - High Hazard";
      case 3: return "3 - Medium Risk";
      default: return "4 - Routine Inconvenience";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600/30 selection:text-white antialiased">
      
      {/* Real-time Ticking HUD Header */}
      <Header liveUtcTime={liveUtcTime} />

      {/* Main Grid Workspace */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - INPUT & CONTEXT INGESTION (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Quick Scenario Presets */}
          <PresetScenarios
            stadiumName={stadiumName}
            currentCrowdDensity={currentCrowdDensity}
            onSelectPreset={handleSelectPreset}
          />

          {/* Core Telemetry Input Form */}
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

        {/* RIGHT COLUMN - LIVE PROTOCOLS & RESULTS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">

          {/* Interactive Live Telemetry Map Widget */}
          <StadiumMap
            sectors={sectors}
            activeSectorId={mapActiveSectorId}
            rerouteToIds={mapRerouteToIds}
            onSelectSector={handleSelectSector}
          />

          {/* Command Decision Protocol Result */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="orchestrated-results-panel">
            
            {activeIncident?.result.severity_assessment.priority_level === 1 && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full pointer-events-none"></div>
            )}
            
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Live Action Command Protocol
                </h3>
              </div>
              {activeIncident && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    ID: {activeIncident.result.incident_id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    activeIncident.status === "simulation" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  }`}>
                    {activeIncident.status === "simulation" ? "OFFLINE SIMULATION" : "LIVE GEN-AI PRODUCER"}
                  </span>
                </div>
              )}
            </div>

            {activeIncident ? (
              <div className="space-y-4">
                
                {/* 1. SEVERITY ASSESSMENT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Severity Priority</span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded border block text-center ${getPriorityBadgeClass(activeIncident.result.severity_assessment.priority_level)}`}>
                      {getPriorityLabel(activeIncident.result.severity_assessment.priority_level)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Urgency State</span>
                    <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block text-center">
                      {activeIncident.result.severity_assessment.urgency}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Impact Radius</span>
                    <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block text-center">
                      {activeIncident.result.severity_assessment.impact_radius}
                    </span>
                  </div>
                </div>

                {/* 2. TACTICAL ACTION PLAN */}
                <div className="space-y-3">
                  
                  {/* Immediate Directives List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Tactical Dispatch Directives:
                    </span>
                    <div className="space-y-1">
                      {activeIncident.result.tactical_action_plan.immediate_directives.map((dir, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800 text-xs">
                          <span className="text-rose-500 font-mono font-bold mt-0.5 shrink-0">0{idx + 1}.</span>
                          <p className="text-slate-300 leading-relaxed font-mono">{dir}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Staff Assignment & Crowd Flow Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                        👥 Ground Volunteers Assignment:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {activeIncident.result.tactical_action_plan.staff_dispatch_assignment}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                        🔄 Crowd Flow Instruction:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {activeIncident.result.tactical_action_plan.crowd_flow_instruction}
                      </p>
                    </div>
                  </div>

                </div>

                {/* 3. BROADCAST SPEECH SIMULATOR */}
                <BroadcastSimulator
                  broadcasts={activeIncident.result.automated_broadcasts}
                  activeLanguage={broadcastLanguage}
                  onChangeLanguage={(lang) => setBroadcastLanguage(lang)}
                  stadiumName={activeIncident.input.stadium_name}
                />

                {/* 4. OPERATIONAL SAFETY JUSTIFICATION */}
                <div className="bg-rose-500/[0.03] border border-rose-500/10 p-3.5 rounded-lg text-xs leading-relaxed">
                  <div className="font-mono text-rose-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1.5">
                    <Info size={12} className="text-rose-400" />
                    Operational Security Justification (Stadium Physics Rule-base):
                  </div>
                  <p className="text-slate-300 font-mono text-[11px]">
                    {activeIncident.result.operational_justification}
                  </p>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
                <AlertTriangle size={32} className="text-slate-600 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-300 font-mono uppercase">Vanguard Command System Offline</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Ingest stadium raw data on the left panel or click one of the presets to generate a GenAI response.
                </p>
              </div>
            )}

          </section>

        </div>

      </main>

      {/* FOOTER & LOG AUDIT TRAIL */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Historical Logs Audit Trail */}
          <IncidentAuditTrail
            history={history}
            activeIncidentId={activeIncident?.id}
            onRestoreHistory={handleRestoreHistory}
            getPriorityBadgeClass={getPriorityBadgeClass}
          />

          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
            <span>© 2026 FIFA World Cup Stadium Logistics Division • Vanguard-Core Orchestrator v2.0.0</span>
            <span className="flex items-center gap-1">
              <Award size={10} className="text-rose-500" />
              Ingress & Egress Safety Compliant Model
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
