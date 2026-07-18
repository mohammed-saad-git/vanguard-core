import { memo, type FormEvent } from "react";
import { Sliders, Info, AlertCircle, Send, RefreshCw } from "lucide-react";
import { STADIUMS, MATCH_PHASES, CROWD_DENSITIES, TEAM_PRESETS } from "../data";
import type { CrowdDensity } from "../types";

interface TelemetryFormProps {
  stadiumName: string;
  setStadiumName: (val: string) => void;
  currentMatchPhase: string;
  setCurrentMatchPhase: (val: string) => void;
  playingTeams: string;
  setPlayingTeams: (val: string) => void;
  currentCrowdDensity: CrowdDensity;
  setCurrentCrowdDensity: (val: CrowdDensity) => void;
  incidentReport: string;
  setIncidentReport: (val: string) => void;
  errorMsg: string | null;
  isOrchestrating: boolean;
  onSubmit: (e: FormEvent) => void;
}

const DENSITY_BUTTON_ACTIVE: Record<CrowdDensity, string> = {
  Critical: "bg-red-500/25 border-red-500 text-red-200 font-bold",
  High: "bg-amber-500/25 border-amber-500 text-amber-200 font-bold",
  Medium: "bg-yellow-500/20 border-yellow-400 text-yellow-100 font-bold",
  Low: "bg-emerald-500/25 border-emerald-500 text-emerald-200 font-bold"
};

const DENSITY_BUTTON_IDLE = "border-slate-800 text-slate-400 bg-slate-950/40";

const INPUT_CLASS =
  "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none";

const TelemetryForm = memo(function TelemetryForm({
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
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl" id="telemetry-ingestion-form" aria-labelledby="telemetry-heading">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
        <h2 id="telemetry-heading" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={14} className="text-rose-500" aria-hidden="true" />
          Raw Telemetry Ingestion Portal
        </h2>
        <span className="text-[10px] font-mono text-cyan-400">INGEST_V2.0</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="stadium-name" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
            1. Target Stadium
          </label>
          <select id="stadium-name" value={stadiumName} onChange={(event) => setStadiumName(event.target.value)} className={INPUT_CLASS}>
            {STADIUMS.map((stadium) => (
              <option key={stadium.id} value={stadium.name}>
                {stadium.name} ({stadium.city})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="match-phase" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              2. Match Phase
            </label>
            <select id="match-phase" value={currentMatchPhase} onChange={(event) => setCurrentMatchPhase(event.target.value)} className={INPUT_CLASS}>
              {MATCH_PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="playing-teams" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              <span>3. Playing Teams</span>
              <span className="text-[10px] text-slate-500 lowercase ml-2">(for languages)</span>
            </label>
            <select id="playing-teams" value={playingTeams} onChange={(event) => setPlayingTeams(event.target.value)} className={INPUT_CLASS}>
              {TEAM_PRESETS.map((team) => (
                <option key={team.teams} value={team.teams}>
                  {team.teams} ({team.languages.split(",")[0]} implied)
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
            4. Current Crowd Density Level
          </legend>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Current crowd density level">
            {CROWD_DENSITIES.map((density) => {
              const isActive = currentCrowdDensity === density;
              return (
                <button
                  key={density}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setCurrentCrowdDensity(density)}
                  className={`py-2 text-center rounded text-[10px] font-mono border uppercase transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isActive ? DENSITY_BUTTON_ACTIVE[density] : DENSITY_BUTTON_IDLE
                  }`}
                >
                  {density}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="incident-report" className="block text-xs font-semibold text-slate-300 uppercase">
              5. Incident Report / Staff Telemetry Log
            </label>
            <span className="text-[10px] text-rose-400 font-mono">* required</span>
          </div>
          <textarea
            id="incident-report"
            value={incidentReport}
            onChange={(event) => setIncidentReport(event.target.value)}
            placeholder="Describe turnstile blockages, gate crowding, medical alerts, fire hazard, structural indicators or security bottlenecks here. Vanguard-Core logic checks for safety risk words..."
            rows={4}
            maxLength={500}
            required
            aria-describedby="incident-help"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none leading-relaxed font-mono resize-none"
          />
          <div id="incident-help" className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
            <Info size={12} className="text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Try including words like <strong className="text-red-400">medical</strong>, <strong className="text-red-400">crush</strong>,{" "}
              <strong className="text-red-400">fire</strong>, or <strong className="text-red-400">structural failure</strong> to test critical
              emergency routing logic.
            </span>
          </div>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-xs text-red-200 flex items-start gap-2 animate-shake">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isOrchestrating}
          aria-busy={isOrchestrating}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
            isOrchestrating
              ? "bg-slate-800 text-slate-400 border border-slate-700 pointer-events-none cursor-not-allowed"
              : "bg-rose-600 hover:bg-rose-500 text-white font-mono hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/40"
          }`}
        >
          {isOrchestrating ? (
            <>
              <RefreshCw size={14} className="animate-spin text-cyan-400" aria-hidden="true" />
              Running Gen-AI C2 Decision Sequencing...
            </>
          ) : (
            <>
              <Send size={14} aria-hidden="true" />
              Engage Gen-AI Orchestration
            </>
          )}
        </button>
      </form>
    </section>
  );
});

export default TelemetryForm;
