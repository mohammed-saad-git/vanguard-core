import React from "react";
import { History } from "lucide-react";
import { IncidentHistoryItem } from "../types";

interface IncidentAuditTrailProps {
  history: IncidentHistoryItem[];
  activeIncidentId?: string;
  onRestoreHistory: (item: IncidentHistoryItem) => void;
  getPriorityBadgeClass: (priority: number) => string;
}

export default function IncidentAuditTrail({
  history,
  activeIncidentId,
  onRestoreHistory,
  getPriorityBadgeClass
}: IncidentAuditTrailProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl" id="incident-audit-logs">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <History size={14} className="text-rose-500" />
          C2 Incident Audit Logs (Persistent History Trail)
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          {history.length} records processed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-400 font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] uppercase text-slate-500">
              <th className="py-2 px-3">Time UTC</th>
              <th className="py-2 px-3">Operational Stadium Name</th>
              <th className="py-2 px-3">Match Phase</th>
              <th className="py-2 px-3">Incident Level / Priority</th>
              <th className="py-2 px-3">Brief Report Context</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((item) => {
              const isCurrent = activeIncidentId === item.id;
              
              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isCurrent ? "bg-rose-500/[0.04] text-white" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-200">
                    {item.input.stadium_name}
                  </td>
                  <td className="py-2.5 px-3">
                    {item.input.current_match_phase}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getPriorityBadgeClass(item.result.severity_assessment.priority_level)}`}>
                      P: {item.result.severity_assessment.priority_level} ({item.result.severity_assessment.urgency})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate">
                    {item.input.incident_report}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRestoreHistory(item)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        isCurrent 
                          ? "bg-rose-600 text-white" 
                          : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      }`}
                    >
                      {isCurrent ? "Active View" : "Restore Data"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
