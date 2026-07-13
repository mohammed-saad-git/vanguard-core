import React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { SCENARIO_PRESETS } from "../data";

interface PresetScenariosProps {
  stadiumName: string;
  currentCrowdDensity: string;
  onSelectPreset: (preset: typeof SCENARIO_PRESETS[0]) => void;
}

export default function PresetScenarios({
  stadiumName,
  currentCrowdDensity,
  onSelectPreset
}: PresetScenariosProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4" id="preset-scenarios">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-rose-500" />
          Scenario Presets Ingestion
        </h3>
        <span className="text-[10px] text-slate-500">Fast Telemetry Setup</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SCENARIO_PRESETS.map((preset, idx) => {
          const isMatch = stadiumName === preset.stadium_name && currentCrowdDensity === preset.current_crowd_density_level;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-3 text-left rounded-lg text-xs border transition-all flex flex-col justify-between hover:bg-slate-800/80 hover:border-slate-700 ${
                isMatch 
                  ? "bg-rose-950/20 border-rose-500/40 text-rose-200 shadow-inner" 
                  : "bg-slate-950/50 border-slate-800/80 text-slate-300"
              }`}
            >
              <div className="font-bold flex items-center gap-1 justify-between w-full">
                <span className="truncate">{preset.title}</span>
                <ChevronRight size={10} className="text-slate-500 shrink-0" />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {preset.stadium_name} • {preset.current_match_phase}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
