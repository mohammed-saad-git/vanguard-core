import { memo, useMemo, type KeyboardEvent } from "react";
import { Shield, AlertTriangle, Users } from "lucide-react";
import { getPolygonCentroid } from "../lib";
import type { StadiumSector } from "../types";

interface StadiumMapProps {
  sectors: StadiumSector[];
  activeSectorId?: string;
  rerouteToIds?: string[];
  onSelectSector?: (sector: StadiumSector) => void;
}

interface Point {
  x: number;
  y: number;
}

const FALLBACK_POINT: Point = { x: 150, y: 110 };

const DENSITY_STROKE: Record<StadiumSector["density"], string> = {
  Critical: "fill-red-500/85 stroke-red-600 group-hover:fill-red-600/90 transition-all",
  High: "fill-amber-500/85 stroke-amber-600 group-hover:fill-amber-600/90 transition-all",
  Medium: "fill-yellow-400/85 stroke-yellow-500 group-hover:fill-yellow-500/90 transition-all",
  Low: "fill-emerald-500/80 stroke-emerald-600 group-hover:fill-emerald-600/90 transition-all"
};

const DENSITY_BADGE: Record<StadiumSector["density"], string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/40",
  High: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Medium: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
  Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
};

const LEGEND: ReadonlyArray<{ label: string; color: string }> = [
  { label: "Low", color: "bg-emerald-500" },
  { label: "Med", color: "bg-yellow-400" },
  { label: "High", color: "bg-amber-500" },
  { label: "Critical", color: "bg-red-500" }
];

function getActiveStyle(isActive: boolean): string {
  return isActive ? "fill-rose-600/90 stroke-white stroke-2 animate-pulse" : "";
}

const StadiumMap = memo(function StadiumMap({
  sectors,
  activeSectorId,
  rerouteToIds = [],
  onSelectSector
}: StadiumMapProps) {
  const centroidBySectorId = useMemo(
    () => new Map(sectors.map((sector) => [sector.id, getPolygonCentroid(sector.coordinates)])),
    [sectors]
  );

  const sectorById = useMemo(() => new Map(sectors.map((sector) => [sector.id, sector])), [sectors]);

  const rerouteSet = useMemo(() => new Set(rerouteToIds), [rerouteToIds]);

  const handleSectorKeyDown = (event: KeyboardEvent<SVGGElement | HTMLButtonElement>, sector: StadiumSector) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSector?.(sector);
    }
  };

  const activeName = activeSectorId ? sectorById.get(activeSectorId)?.name ?? "the incident zone" : "the incident zone";

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="stadium-map-component" aria-labelledby="stadium-map-heading">
      <div className="flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 id="stadium-map-heading" className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" aria-hidden="true" />
            Telemetry Grid Map (Live Sector Densities)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Click any sector to ingest telemetry or view status.</p>
        </div>

        <div className="flex items-center gap-3 text-xs" aria-label="Crowd density legend">
          {LEGEND.map((entry) => (
            <div key={entry.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded ${entry.color}`} aria-hidden="true" />
              <span className="text-slate-400">{entry.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        <div className="lg:col-span-3 flex justify-center items-center bg-slate-950 p-4 rounded-xl border border-slate-800/60 relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono text-cyan-500/60 uppercase">
            STAD-C2 // COORD_MATCH: 2026.0
          </div>

          <svg
            viewBox="0 0 300 220"
            role="img"
            aria-labelledby="stadium-svg-title stadium-svg-desc"
            className="w-full max-w-[340px] h-auto drop-shadow-[0_0_15px_rgba(15,23,42,0.6)]"
          >
            <title id="stadium-svg-title">Interactive stadium sector density map</title>
            <desc id="stadium-svg-desc">Eight stadium sectors color coded by crowd density. Select a sector to ingest telemetry.</desc>
            <ellipse cx="150" cy="110" rx="135" ry="95" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
            <rect x="90" y="65" width="120" height="90" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <ellipse cx="150" cy="110" rx="20" ry="20" fill="none" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="150" y1="65" x2="150" y2="155" stroke="#1e293b" strokeWidth="1.5" />

            {sectors.map((sector) => {
              const isActive = activeSectorId === sector.id;
              const isTargetReroute = rerouteSet.has(sector.id);
              const centroid = centroidBySectorId.get(sector.id) ?? FALLBACK_POINT;
              const stroke = getActiveStyle(isActive) || DENSITY_STROKE[sector.density];

              return (
                <g
                  key={sector.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${sector.name}: ${sector.density} density, ${sector.currentCount} of ${sector.capacity} spectators`}
                  onClick={() => onSelectSector?.(sector)}
                  onKeyDown={(event) => handleSectorKeyDown(event, sector)}
                  className="cursor-pointer group focus:outline-none"
                >
                  <polygon
                    points={sector.coordinates}
                    className={`${stroke} stroke-[1.2] transition-colors group-focus-visible:stroke-cyan-200 group-focus-visible:stroke-[3]`}
                  />

                  {isTargetReroute && (
                    <polygon
                      points={sector.coordinates}
                      fill="none"
                      className="stroke-cyan-400 stroke-[2] animate-[dash_2s_linear_infinite]"
                      style={{ strokeDasharray: "4 2", animation: "dash 1.5s linear infinite" }}
                    />
                  )}

                  <text
                    x={centroid.x}
                    y={centroid.y}
                    className="text-[8px] font-bold font-mono text-slate-900 pointer-events-none text-center select-none"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    aria-hidden="true"
                  >
                    {sector.id.replace("sec-", "")}
                  </text>
                </g>
              );
            })}

            {activeSectorId && rerouteToIds.length > 0 && (
              <g className="pointer-events-none" aria-hidden="true">
                {rerouteToIds.map((targetId) => {
                  const activeSector = sectorById.get(activeSectorId);
                  const targetSector = sectorById.get(targetId);
                  if (!activeSector || !targetSector) return null;

                  const start = centroidBySectorId.get(activeSector.id) ?? FALLBACK_POINT;
                  const end = centroidBySectorId.get(targetSector.id) ?? FALLBACK_POINT;

                  return (
                    <g key={`arrow-${targetId}`}>
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        className="animate-[dash_1s_linear_infinite]"
                      />
                      <circle cx={end.x} cy={end.y} r="3" fill="#22d3ee" className="animate-ping" />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        <div className="lg:col-span-2 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Users size={12} className="text-cyan-400" aria-hidden="true" />
              Sector Grid Analysis
            </h3>

            <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 custom-scrollbar" aria-label="Sector status list">
              {sectors.map((sector) => (
                <SectorButton
                  key={sector.id}
                  sector={sector}
                  isActive={activeSectorId === sector.id}
                  onSelect={onSelectSector}
                  onKeyDown={handleSectorKeyDown}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
            {activeSectorId ? (
              <div className="space-y-1.5">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <Shield size={12} className="animate-spin text-cyan-400" aria-hidden="true" />
                  GEN-AI REROUTING ENGAGED
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Vanguard-Core is redirecting crowd movement away from <span className="font-bold text-red-400">{activeName}</span> toward
                  adjacent open paths highlighted on the map.
                </p>
              </div>
            ) : (
              <div className="text-slate-400 flex items-start gap-1.5 leading-relaxed text-[11px]">
                <AlertTriangle size={14} className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span>No active stadium incidents selected. Select a preset scenario below or click a sector to initiate.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

interface SectorButtonProps {
  sector: StadiumSector;
  isActive: boolean;
  onSelect?: (sector: StadiumSector) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, sector: StadiumSector) => void;
}

const SectorButton = memo(function SectorButton({ sector, isActive, onSelect, onKeyDown }: SectorButtonProps) {
  const percentFull = Math.min(100, Math.round((sector.currentCount / sector.capacity) * 100));

  return (
    <button
      type="button"
      onClick={() => onSelect?.(sector)}
      onKeyDown={(event) => onKeyDown(event, sector)}
      className={`w-full p-2 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
        isActive
          ? "bg-rose-500/10 border-rose-500/50 text-rose-100 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
          : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
      }`}
      aria-current={isActive ? "true" : undefined}
    >
      <span>
        <span className="font-semibold flex items-center gap-1">
          <span>{sector.name}</span>
          {isActive && (
            <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">
              Affected
            </span>
          )}
        </span>
        <span className="block text-[10px] text-slate-400 mt-0.5">
          {sector.currentCount.toLocaleString()} / {sector.capacity.toLocaleString()} spectators ({percentFull}% Cap)
        </span>
      </span>
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DENSITY_BADGE[sector.density]}`}>
        {sector.density}
      </span>
    </button>
  );
});

export default StadiumMap;
