import React from "react";
import { StadiumSector } from "../types";
import { Shield, AlertTriangle, Users, Volume2 } from "lucide-react";

interface StadiumMapProps {
  sectors: StadiumSector[];
  activeSectorId?: string;
  rerouteToIds?: string[];
  onSelectSector?: (sector: StadiumSector) => void;
}

export default function StadiumMap({
  sectors,
  activeSectorId,
  rerouteToIds = [],
  onSelectSector
}: StadiumMapProps) {
  
  // Dynamic color map for crowd densities
  const getDensityColor = (density: string, isActive: boolean) => {
    if (isActive) {
      return "fill-rose-600/90 stroke-white stroke-2 animate-pulse";
    }
    switch (density) {
      case "Critical":
        return "fill-red-500/85 stroke-red-600 hover:fill-red-600/90 transition-all";
      case "High":
        return "fill-amber-500/85 stroke-amber-600 hover:fill-amber-600/90 transition-all";
      case "Medium":
        return "fill-yellow-400/85 stroke-yellow-500 hover:fill-yellow-500/90 transition-all";
      case "Low":
      default:
        return "fill-emerald-500/80 stroke-emerald-600 hover:fill-emerald-600/90 transition-all";
    }
  };

  const getDensityBadgeColor = (density: string) => {
    switch (density) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "High":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "Medium":
        return "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
      case "Low":
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="stadium-map-component">
      {/* Map Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            Telemetry Grid Map (Live Sector Densities)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Click any sector to ingest telemetry or view status.</p>
        </div>
        
        {/* Legends */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span className="text-slate-400">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-yellow-400"></span>
            <span className="text-slate-400">Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span className="text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
            <span className="text-slate-400">Critical</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        {/* Interactive SVG Map */}
        <div className="lg:col-span-3 flex justify-center items-center bg-slate-950 p-4 rounded-xl border border-slate-800/60 relative">
          
          {/* Compass/Grid lines HUD */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono text-cyan-500/60 uppercase">
            STAD-C2 // COORD_MATCH: 2026.0
          </div>
          
          <svg
            viewBox="0 0 300 220"
            className="w-full max-w-[340px] h-auto drop-shadow-[0_0_15px_rgba(15,23,42,0.6)]"
          >
            {/* Outer Pitch Oval ring */}
            <ellipse cx="150" cy="110" rx="135" ry="95" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
            
            {/* Inner Pitch (Playing Field) */}
            <rect x="90" y="65" width="120" height="90" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <ellipse cx="150" cy="110" rx="20" ry="20" fill="none" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="150" y1="65" x2="150" y2="155" stroke="#1e293b" strokeWidth="1.5" />

            {/* Stadium Sectors (Polygons) */}
            {sectors.map((sector) => {
              const isActive = activeSectorId === sector.id;
              const isTargetReroute = rerouteToIds.includes(sector.id);
              
              return (
                <g key={sector.id} className="cursor-pointer group">
                  {/* Sector Shape */}
                  <polygon
                    points={sector.coordinates}
                    className={`${getDensityColor(sector.density, isActive)} stroke-[1.2] transition-colors`}
                    onClick={() => onSelectSector && onSelectSector(sector)}
                  />
                  
                  {/* Highlight outline for targeted reroute adjacent sectors */}
                  {isTargetReroute && (
                    <polygon
                      points={sector.coordinates}
                      fill="none"
                      className="stroke-cyan-400 stroke-[2] stroke-dasharray-[4,4] animate-[dash_2s_linear_infinite]"
                      style={{
                        strokeDasharray: "4 2",
                        animation: "dash 1.5s linear infinite"
                      }}
                    />
                  )}

                  {/* Inner text for Sector Number */}
                  <text
                    x={getCentroidX(sector.coordinates)}
                    y={getCentroidY(sector.coordinates)}
                    className={`text-[8px] font-bold font-mono text-slate-900 pointer-events-none text-center select-none`}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {sector.id.replace("sec-", "")}
                  </text>
                </g>
              );
            })}

            {/* Visual Re-routing arrows pointing from active/incident sector to target reroutes */}
            {activeSectorId && rerouteToIds.length > 0 && (
              <g className="pointer-events-none">
                {rerouteToIds.map((targetId) => {
                  const activeSector = sectors.find(s => s.id === activeSectorId);
                  const targetSector = sectors.find(s => s.id === targetId);
                  if (!activeSector || !targetSector) return null;
                  
                  const startX = getCentroidX(activeSector.coordinates);
                  const startY = getCentroidY(activeSector.coordinates);
                  const endX = getCentroidX(targetSector.coordinates);
                  const endY = getCentroidY(targetSector.coordinates);
                  
                  return (
                    <g key={`arrow-${targetId}`}>
                      {/* Flowing animated dash line */}
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        className="animate-[dash_1s_linear_infinite]"
                        style={{
                          strokeDasharray: "4 4",
                        }}
                      />
                      {/* Arrow circle indicator */}
                      <circle cx={endX} cy={endY} r="3" fill="#22d3ee" className="animate-ping" />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Users size={12} className="text-cyan-400" />
              Sector Grid Analysis
            </h4>
            
            {/* List Sectors with Status and capacity metrics */}
            <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {sectors.map((sec) => {
                const isActive = activeSectorId === sec.id;
                const percentFull = Math.min(100, Math.round((sec.currentCount / sec.capacity) * 100));
                
                return (
                  <div
                    key={sec.id}
                    onClick={() => onSelectSector && onSelectSector(sec)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-center ${
                      isActive
                        ? "bg-rose-500/10 border-rose-500/50 text-rose-100 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        <span>{sec.name}</span>
                        {isActive && <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">Affected</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sec.currentCount.toLocaleString()} / {sec.capacity.toLocaleString()} spectators ({percentFull}% Cap)
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDensityBadgeColor(sec.density)}`}>
                      {sec.density}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Callout based on Map State */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
            {activeSectorId ? (
              <div className="space-y-1.5">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <Shield size={12} className="animate-spin text-cyan-400" />
                  GEN-AI REROUTING ENGAGED
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Vanguard-Core is re-directing crowd movement away from{" "}
                  <span className="font-bold text-red-400">
                    {sectors.find(s => s.id === activeSectorId)?.name || "the incident zone"}
                  </span>{" "}
                  towards adjacent open paths (highlighted on map).
                </p>
              </div>
            ) : (
              <div className="text-slate-400 flex items-start gap-1.5 leading-relaxed text-[11px]">
                <AlertTriangle size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <span>
                  No active stadium incidents selected. Select a preset scenario below or click a sector to initiate.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions to approximate centroids of SVG coordinate strings
function getCentroidX(coordinates: string): number {
  try {
    const coords = coordinates.split(" ").map(pt => pt.split(",").map(Number));
    const sumX = coords.reduce((sum, pt) => sum + pt[0], 0);
    return Math.round(sumX / coords.length);
  } catch (e) {
    return 150;
  }
}

function getCentroidY(coordinates: string): number {
  try {
    const coords = coordinates.split(" ").map(pt => pt.split(",").map(Number));
    const sumY = coords.reduce((sum, pt) => sum + pt[1], 0);
    return Math.round(sumY / coords.length);
  } catch (e) {
    return 110;
  }
}
