import { memo, Suspense, lazy, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { BroadcastLanguage, IncidentHistoryItem } from "../types";
import { getPriorityBadgeClass, getPriorityLabel } from "../lib";

const BroadcastSimulator = lazy(() => import("./BroadcastSimulator"));

interface ActionResultsPanelProps {
  activeIncident: IncidentHistoryItem | null;
  broadcastLanguage: BroadcastLanguage;
  onChangeBroadcastLanguage: (language: BroadcastLanguage) => void;
}

function ActionResultsPanel({
  activeIncident,
  broadcastLanguage,
  onChangeBroadcastLanguage
}: ActionResultsPanelProps) {
  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden"
      id="orchestrated-results-panel"
      aria-labelledby="results-heading"
    >
      {activeIncident?.result.severity_assessment.priority_level === 1 && (
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <h2 id="results-heading" className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            Live Action Command Protocol
          </h2>
        </div>
        {activeIncident && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              ID: {activeIncident.result.incident_id}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                activeIncident.status === "simulation"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              }`}
            >
              {activeIncident.status === "simulation" ? "Offline Simulation" : "Live Gen-AI Producer"}
            </span>
          </div>
        )}
      </div>

      {activeIncident ? <ActiveIncidentDetails item={activeIncident} broadcastLanguage={broadcastLanguage} onChangeLanguage={onChangeBroadcastLanguage} /> : <EmptyState />}
    </section>
  );
}

interface ActiveIncidentDetailsProps {
  item: IncidentHistoryItem;
  broadcastLanguage: BroadcastLanguage;
  onChangeLanguage: (language: BroadcastLanguage) => void;
}

const ActiveIncidentDetails = memo(function ActiveIncidentDetails({
  item,
  broadcastLanguage,
  onChangeLanguage
}: ActiveIncidentDetailsProps) {
  const { result, input } = item;
  const priority = result.severity_assessment.priority_level;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <SeverityStat label="Severity Priority">
          <span className={`text-xs font-extrabold px-2 py-0.5 rounded border block text-center ${getPriorityBadgeClass(priority)}`}>
            {getPriorityLabel(priority)}
          </span>
        </SeverityStat>
        <SeverityStat label="Urgency State">
          <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block text-center">
            {result.severity_assessment.urgency}
          </span>
        </SeverityStat>
        <SeverityStat label="Impact Radius">
          <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block text-center">
            {result.severity_assessment.impact_radius}
          </span>
        </SeverityStat>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Tactical Dispatch Directives:
          </span>
          <ol className="space-y-1">
            {result.tactical_action_plan.immediate_directives.map((directive, index) => (
              <li
                key={`${directive.slice(0, 24)}-${index}`}
                className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-800 text-xs"
              >
                <span className="text-rose-500 font-mono font-bold mt-0.5 shrink-0">
                  {String(index + 1).padStart(2, "0")}.
                </span>
                <p className="text-slate-300 leading-relaxed font-mono">{directive}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StaffAssignment text={result.tactical_action_plan.staff_dispatch_assignment} />
          <CrowdFlowInstruction text={result.tactical_action_plan.crowd_flow_instruction} />
        </div>
      </div>

      <Suspense fallback={<div className="text-xs text-slate-500 font-mono">Loading broadcast simulator...</div>}>
        <BroadcastSimulator
          broadcasts={result.automated_broadcasts}
          activeLanguage={broadcastLanguage}
          onChangeLanguage={onChangeLanguage}
          stadiumName={input.stadium_name}
        />
      </Suspense>

      <div className="bg-rose-500/[0.03] border border-rose-500/10 p-3.5 rounded-lg text-xs leading-relaxed">
        <div className="font-mono text-rose-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1.5">
          <Info size={12} className="text-rose-400" aria-hidden="true" />
          Operational Security Justification (Stadium Physics Rule-base):
        </div>
        <p className="text-slate-300 font-mono text-[11px]">{result.operational_justification}</p>
      </div>
    </div>
  );
});

const StaffAssignment = memo(function StaffAssignment({ text }: { text: string }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
        Ground Volunteers Assignment:
      </span>
      <p className="text-xs text-slate-300 leading-relaxed font-mono">{text}</p>
    </div>
  );
});

const CrowdFlowInstruction = memo(function CrowdFlowInstruction({ text }: { text: string }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
        Crowd Flow Instruction:
      </span>
      <p className="text-xs text-slate-300 leading-relaxed font-mono">{text}</p>
    </div>
  );
});

function SeverityStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-mono text-slate-400 uppercase block">{label}</span>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
      <AlertTriangle size={32} className="text-slate-600 mb-2 animate-bounce" aria-hidden="true" />
      <h3 className="text-sm font-bold text-slate-300 font-mono uppercase">Vanguard Command System Offline</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
        Ingest stadium raw data on the left panel or click one of the presets to generate a GenAI response.
      </p>
    </div>
  );
}

export default memo(ActionResultsPanel);
