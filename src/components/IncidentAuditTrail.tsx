import { memo } from "react";
import { History } from "lucide-react";
import type { IncidentHistoryItem } from "../types";

interface IncidentAuditTrailProps {
  history: IncidentHistoryItem[];
  activeIncidentId?: string;
  onRestoreHistory: (item: IncidentHistoryItem) => void;
  getPriorityBadgeClass: (priority: number) => string;
}

const IncidentAuditTrail = memo(function IncidentAuditTrail({
  history,
  activeIncidentId,
  onRestoreHistory,
  getPriorityBadgeClass
}: IncidentAuditTrailProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl" id="incident-audit-logs" aria-labelledby="audit-heading">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
        <h2 id="audit-heading" className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <History size={14} className="text-rose-500" aria-hidden="true" />
          C2 Incident Audit Logs (Persistent History Trail)
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">{history.length} records processed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-400 font-mono border-collapse">
          <caption className="sr-only">Incident history with stadium, phase, priority, report summary, and restore action</caption>
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] uppercase text-slate-500">
              <th scope="col" className="py-2 px-3">Time UTC</th>
              <th scope="col" className="py-2 px-3">Operational Stadium Name</th>
              <th scope="col" className="py-2 px-3">Match Phase</th>
              <th scope="col" className="py-2 px-3">Incident Level / Priority</th>
              <th scope="col" className="py-2 px-3">Brief Report Context</th>
              <th scope="col" className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((item) => (
              <AuditRow
                key={item.id}
                item={item}
                isCurrent={activeIncidentId === item.id}
                onRestore={onRestoreHistory}
                getPriorityBadgeClass={getPriorityBadgeClass}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});

interface AuditRowProps {
  item: IncidentHistoryItem;
  isCurrent: boolean;
  onRestore: (item: IncidentHistoryItem) => void;
  getPriorityBadgeClass: (priority: number) => string;
}

const AuditRow = memo(function AuditRow({ item, isCurrent, onRestore, getPriorityBadgeClass }: AuditRowProps) {
  const priorityClass = getPriorityBadgeClass(item.result.severity_assessment.priority_level);
  return (
    <tr className={`hover:bg-slate-800/30 transition-colors ${isCurrent ? "bg-rose-500/[0.04] text-white" : ""}`}>
      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-400">
        <time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</time>
      </td>
      <th scope="row" className="py-2.5 px-3 font-bold text-slate-200">
        {item.input.stadium_name}
      </th>
      <td className="py-2.5 px-3">{item.input.current_match_phase}</td>
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${priorityClass}`}>
          P: {item.result.severity_assessment.priority_level} ({item.result.severity_assessment.urgency})
        </span>
      </td>
      <td className="py-2.5 px-3 max-w-[200px] truncate">{item.input.incident_report}</td>
      <td className="py-2.5 px-3 text-right">
        <button
          type="button"
          onClick={() => onRestore(item)}
          aria-label={
            isCurrent
              ? `Viewing active incident ${item.result.incident_id}`
              : `Restore incident ${item.result.incident_id}`
          }
          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
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
});

export default IncidentAuditTrail;
