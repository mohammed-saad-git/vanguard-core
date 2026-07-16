import React, { useEffect, useState } from "react";
import { Shield, Activity, Clock, Layers } from "lucide-react";

export default function Header() {
  const [liveUtcTime, setLiveUtcTime] = useState(() => new Date().toUTCString().replace("GMT", "UTC"));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveUtcTime(new Date().toUTCString().replace("GMT", "UTC"));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3" id="vanguard-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 p-2 rounded-lg border border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)] shrink-0">
            <Shield className="text-white w-6 h-6 animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider text-white uppercase font-mono">
                Vanguard-Core
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-widest">
                FIFA C2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight uppercase">
              GenAI Stadium Command and Control Orchestrator - World Cup 2026
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs text-slate-400" aria-label="System telemetry metadata">
          <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 flex items-center gap-1.5">
            <Clock className="text-cyan-400 w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={new Date(liveUtcTime).toISOString()}>{liveUtcTime}</time>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 flex items-center gap-1.5">
            <Activity className="text-emerald-400 w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
            <span className="text-emerald-400 font-bold">STATUS: LIVE</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 flex items-center gap-1.5">
            <Layers className="text-rose-400 w-3.5 h-3.5" aria-hidden="true" />
            <span>ORCHESTRATOR ENGINES ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
