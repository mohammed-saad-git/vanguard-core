import { memo, useEffect, useState } from "react";
import { Volume2, VolumeX, Radio, Monitor, CheckCircle } from "lucide-react";
import type { AutomatedBroadcasts, BroadcastLanguage } from "../types";

interface BroadcastSimulatorProps {
  broadcasts: AutomatedBroadcasts;
  activeLanguage: BroadcastLanguage;
  onChangeLanguage: (lang: BroadcastLanguage) => void;
  stadiumName: string;
}

const LANGUAGE_OPTIONS: ReadonlyArray<{ id: BroadcastLanguage; label: string }> = [
  { id: "english", label: "EN (English)" },
  { id: "spanish", label: "ES (Spanish)" },
  { id: "localized_team_language", label: "INTL (Team Native)" }
];

function pickVoice(voices: SpeechSynthesisVoice[] | undefined, language: BroadcastLanguage): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  switch (language) {
    case "spanish":
      return voices.find((voice) => voice.lang.startsWith("es")) ?? null;
    case "localized_team_language":
      return voices.find((voice) => !voice.lang.startsWith("en") && !voice.lang.startsWith("es")) ?? null;
    case "english":
    default:
      return voices.find((voice) => voice.lang.startsWith("en")) ?? null;
  }
}

function BroadcastSimulator({ broadcasts, activeLanguage, onChangeLanguage, stadiumName }: BroadcastSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    return () => {
      synth?.cancel();
    };
  }, [synth]);

  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
        setIsPlaying(false);
      }
    };
  }, [broadcasts, synth]);

  const stopPlayback = () => {
    synth?.cancel();
    setIsPlaying(false);
  };

  const selectLanguage = (language: BroadcastLanguage) => {
    stopPlayback();
    onChangeLanguage(language);
  };

  const handleSpeak = () => {
    if (!synth) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    const textToSpeak = broadcasts[activeLanguage];
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = pickVoice(synth.getVoices(), activeLanguage);
    utterance.pitch = 0.95;
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    synth.speak(utterance);
  };

  const headline = broadcasts[activeLanguage] ? `${broadcasts[activeLanguage].split(".")[0]}.` : "Awaiting Operational Plan Ingestion...";
  const languageLabel = activeLanguage.toUpperCase();
  const languageScript = broadcasts[activeLanguage] || "Select an incident or run orchestration to view broadcast scripts.";

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4" id="broadcast-simulator-component" aria-labelledby="broadcast-heading">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 id="broadcast-heading" className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Radio size={16} className="text-rose-500 animate-pulse" aria-hidden="true" />
          PA Announcement and Visual Broadcast Simulator
        </h3>
        <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono px-2 py-0.5 rounded border border-rose-500/30">
          STADIUM PA OVERRIDE ACTIVE
        </span>
      </div>

      <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-center items-center text-center select-none shadow-inner min-h-[100px]" aria-live="polite">
        <div className="absolute inset-0 border border-rose-500/20 animate-pulse" aria-hidden="true" />
        <div className="absolute top-1 left-2 text-[8px] font-mono text-rose-500 flex items-center gap-1">
          <Monitor size={10} aria-hidden="true" />
          GIANT SCREEN SIMULATION: {stadiumName.toUpperCase()}
        </div>

        <div className="text-center space-y-1.5 z-10 max-w-md mt-1">
          <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded animate-bounce inline-block">
            STADIUM ALERT // INSTRUCTIONS
          </span>
          <p className="font-sans font-bold text-slate-200 tracking-tight text-sm sm:text-base leading-snug uppercase">
            {headline}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex gap-1.5" role="tablist" aria-label="Broadcast language">
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = activeLanguage === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectLanguage(option.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium font-mono border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  isActive
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                } ${option.id === "localized_team_language" ? "truncate max-w-[120px] sm:max-w-none" : ""}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSpeak}
          disabled={!broadcasts[activeLanguage]}
          aria-pressed={isPlaying}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
            isPlaying
              ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"
              : "bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX size={14} className="animate-spin" aria-hidden="true" />
              Stop Broadcast Simulation
            </>
          ) : (
            <>
              <Volume2 size={14} aria-hidden="true" />
              Trigger PA Voice Speech
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80" role="tabpanel">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <CheckCircle size={10} className="text-emerald-500" aria-hidden="true" />
          PA TEXT BROADCAST SCRIPT ({languageLabel}):
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{languageScript}</p>
      </div>
    </section>
  );
}

export default memo(BroadcastSimulator);
