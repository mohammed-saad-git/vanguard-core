import React from "react";
import { Sliders, Info, AlertCircle, Send, RefreshCw } from "lucide-react";
import { STADIUMS, MATCH_PHASES, CROWD_DENSITIES, TEAM_PRESETS } from "../data";

interface TelemetryFormProps {
  stadiumName: string;
  setStadiumName: (val: string) => void;
  currentMatchPhase: string;
  setCurrentMatchPhase: (val: string) => void;
  playingTeams: string;
  setPlayingTeams: (val: string) => void;
  currentCrowdDensity: "Low" | "Medium" | "High" | "Critical";
  setCurrentCrowdDensity: (val: "Low" | "Medium" | "High" | "Critical") => void;
  incidentReport: string;
  setIncidentReport: (val: string) => void;
  errorMsg: string | null;
  isOrchestrating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TelemetryForm({
  stadiumName,
  setStadiumName,
  currentMatchPhase,
  setCurrentMatchPhase,
  playingTeams,
  setPlayingTeams,
  currentCrowdDensity,
  setCurrentCrowdDensity,
  incidentReport,
  setIncidentReport,
  errorMsg,
  isOrchestrating,
  onSubmit
}: TelemetryFormProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl" id="telemetry-ingestion-form">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={14} className="text-rose-500" />
          Raw Telemetry Ingestion Portal
        </h3>
        <span className="text-[10px] font-mono text-cyan-400">INGEST_V2.0</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        
        {/* Stadium Dropdown Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
            1. Target Stadium
          </label>
          <select
            value={stadiumName}
            onChange={(e) => setStadiumName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
          >
            {STADIUMS.map((stad) => (
              <option key={stad.id} value={stad.name}>
                {stad.name} ({stad.city})
              </option>
            ))}
          </select>
        </div>

        {/* Match Phase & Playing Teams row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              2. Match Phase
            </label>
            <select
              value={currentMatchPhase}
              onChange={(e) => setCurrentMatchPhase(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
            >
              {MATCH_PHASES.map((phase, idx) => (
                <option key={idx} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex justify-between">
              <span>3. Playing Teams</span>
              <span className="text-[10px] text-slate-500 lowercase">(for languages)</span>
            </label>
            <select
              value={playingTeams}
              onChange={(e) => setPlayingTeams(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
            >
              {TEAM_PRESETS.map((team, idx) => (
                <option key={idx} value={team.teams}>
                  {team.teams} ({team.languages.split(",")[0]} implied)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Crowd Density Level Selector Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
            4. Current Crowd Density Level
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {CROWD_DENSITIES.map((density) => {
              const isActive = currentCrowdDensity === density;
              let btnColor = "border-slate-800 text-slate-400 bg-slate-950/40";
              if (isActive) {
                if (density === "Critical") btnColor = "bg-red-500/25 border-red-500 text-red-200 font-bold";
                else if (density === "High") btnColor = "bg-amber-500/25 border-amber-500 text-amber-200 font-bold";
                else if (density === "Medium") btnColor = "bg-yellow-500/20 border-yellow-400 text-yellow-100 font-bold";
                else btnColor = "bg-emerald-500/25 border-emerald-500 text-emerald-200 font-bold";
              }

              return (
                <button
                  key={density}
                  type="button"
                  onClick={() => setCurrentCrowdDensity(density)}
                  className={`py-2 text-center rounded text-[10px] font-mono border uppercase transition-all ${btnColor}`}
                >
                  {density}
                </button>
              );
            })}
          </div>
        </div>

        {/* Incident Report Text Area */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              5. Incident Report / Staff Telemetry Log
            </label>
            <span className="text-[10px] text-rose-400 font-mono">* required</span>
          </div>
          <textarea
            value={incidentReport}
            onChange={(e) => setIncidentReport(e.target.value)}
            placeholder="Describe turnstile blockages, gate crowding, medical alerts, fire hazard, structural indicators or security bottlenecks here. Vanguard-Core logic checks for safety risk words..."
            rows={4}
            maxLength={500}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none leading-relaxed font-mono resize-none"
          ></textarea>
          <div className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
            <Info size={12} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Try including words like <strong className="text-red-400">"medical"</strong>, <strong className="text-red-400">"crush"</strong>, <strong className="text-red-400">"fire"</strong>, or <strong className="text-red-400">"structural failure"</strong> to test critical emergency routing logic.
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-xs text-red-200 flex items-start gap-2 animate-shake">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isOrchestrating}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 ${
            isOrchestrating
              ? "bg-slate-800 text-slate-400 border border-slate-700 pointer-events-none cursor-not-allowed"
              : "bg-rose-600 hover:bg-rose-500 text-white font-mono hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/40"
          }`}
        >
          {isOrchestrating ? (
            <>
              <RefreshCw size={14} className="animate-spin text-cyan-400" />
              RUNNING GEN-AI C2 DECISION SEQUENCING...
            </>
          ) : (
            <>
              <Send size={14} />
              ENGAGE GEN-AI ORCHESTRATION
            </>
          )}
        </button>

      </form>
    </section>
  );
}
