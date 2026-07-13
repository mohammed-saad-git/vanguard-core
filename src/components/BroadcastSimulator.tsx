import React, { useState, useEffect } from "react";
import { AutomatedBroadcasts } from "../types";
import { Volume2, VolumeX, Radio, Monitor, CheckCircle } from "lucide-react";

interface BroadcastSimulatorProps {
  broadcasts: AutomatedBroadcasts;
  activeLanguage: "english" | "spanish" | "localized_team_language";
  onChangeLanguage: (lang: "english" | "spanish" | "localized_team_language") => void;
  stadiumName: string;
}

export default function BroadcastSimulator({
  broadcasts,
  activeLanguage,
  onChangeLanguage,
  stadiumName
}: BroadcastSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  // Stop synthesis when component unmounts or text changes
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth, broadcasts]);

  const handleSpeak = () => {
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = broadcasts[activeLanguage];
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Choose voice based on active language
    const voices = synth.getVoices();
    if (activeLanguage === "spanish") {
      const esVoice = voices.find(v => v.lang.startsWith("es"));
      if (esVoice) utterance.voice = esVoice;
    } else if (activeLanguage === "localized_team_language") {
      // Try to find matching translation voice if possible, or fallback
      const nonEnEsVoice = voices.find(v => !v.lang.startsWith("en") && !v.lang.startsWith("es"));
      if (nonEnEsVoice) utterance.voice = nonEnEsVoice;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;
    }

    // High tech radio synthetic audio filter feel
    utterance.pitch = 0.95; 
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    setCurrentUtterance(utterance);
    synth.speak(utterance);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4" id="broadcast-simulator-component">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Radio size={16} className="text-rose-500 animate-pulse" />
          PA Announcement & Visual Broadcast Simulator
        </h3>
        <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono px-2 py-0.5 rounded border border-rose-500/30">
          STADIUM PA OVERRIDE ACTIVE
        </span>
      </div>

      {/* Flashing Stadium Screen Simulation */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-center items-center text-center select-none shadow-inner min-h-[100px]">
        {/* Neon Flashing Borders */}
        <div className="absolute inset-0 border border-rose-500/20 animate-pulse"></div>
        <div className="absolute top-1 left-2 text-[8px] font-mono text-rose-500 flex items-center gap-1">
          <Monitor size={10} />
          GIANT SCREEN SIMULATION: {stadiumName.toUpperCase()}
        </div>

        {/* Big visual banner warning */}
        <div className="text-center space-y-1.5 z-10 max-w-md mt-1">
          <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded animate-bounce inline-block">
            STADIUM ALERT // INSTRUCTIONS
          </span>
          <p className="font-sans font-bold text-slate-200 tracking-tight text-sm sm:text-base leading-snug uppercase">
            {broadcasts[activeLanguage] ? broadcasts[activeLanguage].split(".")[0] + "." : "Awaiting Operational Plan Ingestion..."}
          </p>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (isPlaying && synth) synth.cancel();
              setIsPlaying(false);
              onChangeLanguage("english");
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium font-mono border transition-all ${
              activeLanguage === "english"
                ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            EN (English)
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPlaying && synth) synth.cancel();
              setIsPlaying(false);
              onChangeLanguage("spanish");
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium font-mono border transition-all ${
              activeLanguage === "spanish"
                ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            ES (Spanish)
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPlaying && synth) synth.cancel();
              setIsPlaying(false);
              onChangeLanguage("localized_team_language");
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium font-mono border transition-all truncate max-w-[120px] sm:max-w-none ${
              activeLanguage === "localized_team_language"
                ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            INTL (Team Native)
          </button>
        </div>

        {/* Listen Button */}
        <button
          type="button"
          onClick={handleSpeak}
          disabled={!broadcasts[activeLanguage]}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            isPlaying
              ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"
              : "bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX size={14} className="animate-spin" />
              Stop Broadcast Simulation
            </>
          ) : (
            <>
              <Volume2 size={14} />
              Trigger PA Voice Speech
            </>
          )}
        </button>
      </div>

      {/* Full Text View */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <CheckCircle size={10} className="text-emerald-500" />
          PA TEXT BROADCAST SCRIPT ({activeLanguage.toUpperCase()}):
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
          {broadcasts[activeLanguage] || "Select an incident or run orchestration to view broadcast scripts."}
        </p>
      </div>
    </div>
  );
}
