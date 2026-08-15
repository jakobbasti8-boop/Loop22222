import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react";

import { proAudioEngine } from "@/lib/audio/pro-audio-engine";
import { type BeatPattern, type DrumLaneName } from "@/lib/pro-session";
import { useSessionProject } from "@/lib/session-provider";

export type BeatPresetName = "Forge Groove" | "Boom Bap" | "Trap Grid" | "House Drive" | "Empty";

const ASSETS: Record<DrumLaneName, number> = {
  Kick: require("../assets/audio/kick.wav"),
  Snare: require("../assets/audio/snare.wav"),
  "Closed Hat": require("../assets/audio/hihat.wav"),
  "Open Hat": require("../assets/audio/openhat.wav"),
  Clap: require("../assets/audio/clap.wav"),
};
const CLICK = require("../assets/audio/click.wav");
const CLICK_ACCENT = require("../assets/audio/click_accent.wav");

const PRESET_STEPS: Record<BeatPresetName, Partial<Record<DrumLaneName, number[]>>> = {
  "Forge Groove": {
    Kick: [0, 8, 16, 24], Snare: [8, 24], "Closed Hat": [0, 4, 8, 12, 16, 20, 24, 28], "Open Hat": [14, 30], Clap: [8, 24],
  },
  "Boom Bap": {
    Kick: [0, 6, 16, 22, 28], Snare: [8, 24], "Closed Hat": [0, 4, 8, 12, 16, 20, 24, 28], Clap: [24],
  },
  "Trap Grid": {
    Kick: [0, 5, 14, 19, 27], Snare: [8, 24], "Closed Hat": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 24, 26, 28, 30, 31], "Open Hat": [15, 29], Clap: [8, 24],
  },
  "House Drive": {
    Kick: [0, 4, 8, 12, 16, 20, 24, 28], Snare: [8, 24], "Closed Hat": [2, 6, 10, 14, 18, 22, 26, 30], "Open Hat": [6, 14, 22, 30], Clap: [8, 24],
  },
  Empty: {},
};

type BeatContextValue = {
  currentStep: number;
  bar: number;
  beat: number;
  isTransportPlaying: boolean;
  pattern: BeatPattern;
  presetName: BeatPresetName | "Custom";
  startTransport: () => void;
  stopTransport: () => void;
  toggleTransport: () => void;
  setTempo: (tempo: number) => void;
  setSwing: (swing: number) => void;
  toggleStep: (laneIndex: number, step: number) => void;
  cycleStepVelocity: (laneIndex: number, step: number) => void;
  toggleLaneMute: (laneIndex: number) => void;
  setLaneVolume: (laneIndex: number, volume: number) => void;
  setPatternSteps: (steps: 16 | 32) => void;
  applyPreset: (name: BeatPresetName) => void;
  nextBoundaryDelayMs: () => number;
};

const BeatContext = createContext<BeatContextValue | null>(null);

export function BeatProvider({ children }: PropsWithChildren) {
  const { project, updateProject } = useSessionProject();
  const [isTransportPlaying, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bar, setBar] = useState(1);
  const [beat, setBeat] = useState(1);
  const [presetName, setPresetName] = useState<BeatPresetName | "Custom">("Forge Groove");
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextStepTimeRef = useRef(0);
  const stepRef = useRef(0);
  const absoluteStepRef = useRef(0);
  const transportStartWallRef = useRef(0);

  const pattern = project.beat;
  const tempo = project.transport.tempo;
  const swing = project.transport.swing;

  const schedule = useCallback(async () => {
    if (!isTransportPlaying) return;
    const now = await proAudioEngine.currentTime().catch(() => 0);
    if (!now) return;
    const stepSeconds = 60 / tempo / 4;
    const horizon = now + 0.12;

    while (nextStepTimeRef.current < horizon) {
      const step = stepRef.current;
      const swingDelay = step % 2 === 1 ? stepSeconds * Math.min(0.45, swing) * 0.55 : 0;
      const when = nextStepTimeRef.current + swingDelay;

      for (const lane of pattern.lanes) {
        if (lane.muted || !lane.active.includes(step)) continue;
        const velocityIndex = lane.active.indexOf(step);
        const velocity = lane.velocity[velocityIndex] ?? 1;
        void proAudioEngine.scheduleOneShot(ASSETS[lane.name], when, lane.volume * velocity).catch(() => undefined);
      }
      if (project.transport.metronome && step % 4 === 0) {
        void proAudioEngine.scheduleOneShot(step % 16 === 0 ? CLICK_ACCENT : CLICK, when, step % 16 === 0 ? 0.42 : 0.24).catch(() => undefined);
      }

      const absolute = absoluteStepRef.current;
      setCurrentStep(step);
      setBeat((Math.floor((absolute % 16) / 4) + 1));
      setBar(Math.floor(absolute / 16) + 1);
      stepRef.current = (step + 1) % pattern.steps;
      absoluteStepRef.current += 1;
      nextStepTimeRef.current += stepSeconds;
    }
  }, [isTransportPlaying, pattern.lanes, pattern.steps, project.transport.metronome, swing, tempo]);

  useEffect(() => {
    if (!isTransportPlaying) return;
    void proAudioEngine.ensureReady().then(async () => {
      const now = await proAudioEngine.currentTime();
      nextStepTimeRef.current = now + 0.08;
      stepRef.current = 0;
      absoluteStepRef.current = 0;
      transportStartWallRef.current = Date.now() + 80;
      await schedule();
      schedulerRef.current = setInterval(() => { void schedule(); }, 25);
    }).catch(() => setPlaying(false));
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    };
  }, [isTransportPlaying, schedule]);

  const startTransport = useCallback(() => setPlaying(true), []);
  const stopTransport = useCallback(() => {
    setPlaying(false);
    setCurrentStep(0);
    setBar(1);
    setBeat(1);
    stepRef.current = 0;
    absoluteStepRef.current = 0;
  }, []);
  const toggleTransport = useCallback(() => setPlaying((value) => !value), []);

  const setTempo = useCallback((value: number) => {
    updateProject((current) => ({ ...current, transport: { ...current.transport, tempo: Math.max(40, Math.min(240, Math.round(value))) } }));
  }, [updateProject]);

  const setSwing = useCallback((value: number) => {
    updateProject((current) => ({ ...current, transport: { ...current.transport, swing: Math.max(0, Math.min(0.45, value)) } }));
  }, [updateProject]);

  const toggleStep = useCallback((laneIndex: number, step: number) => {
    updateProject((current) => ({
      ...current,
      beat: {
        ...current.beat,
        lanes: current.beat.lanes.map((lane, index) => {
          if (index !== laneIndex) return lane;
          const previousVelocity = new Map(lane.active.map((activeStep, velocityIndex) => [activeStep, lane.velocity[velocityIndex] ?? 1]));
          const active = lane.active.includes(step) ? lane.active.filter((value) => value !== step) : [...lane.active, step].sort((a, b) => a - b);
          const velocity = active.map((activeStep) => previousVelocity.get(activeStep) ?? 1);
          return { ...lane, active, velocity };
        }),
      },
    }));
    setPresetName("Custom");
  }, [updateProject]);

  const cycleStepVelocity = useCallback((laneIndex: number, step: number) => {
    updateProject((current) => ({
      ...current,
      beat: {
        ...current.beat,
        lanes: current.beat.lanes.map((lane, index) => {
          if (index !== laneIndex || !lane.active.includes(step)) return lane;
          const velocityIndex = lane.active.indexOf(step);
          const currentVelocity = lane.velocity[velocityIndex] ?? 1;
          const nextVelocity = currentVelocity < 0.6 ? 0.75 : currentVelocity < 0.9 ? 1 : currentVelocity < 1.1 ? 1.2 : 0.5;
          const velocity = lane.active.map((_, i) => i === velocityIndex ? nextVelocity : (lane.velocity[i] ?? 1));
          return { ...lane, velocity };
        }),
      },
    }));
  }, [updateProject]);

  const toggleLaneMute = useCallback((laneIndex: number) => {
    updateProject((current) => ({ ...current, beat: { ...current.beat, lanes: current.beat.lanes.map((lane, index) => index === laneIndex ? { ...lane, muted: !lane.muted } : lane) } }));
  }, [updateProject]);

  const setLaneVolume = useCallback((laneIndex: number, volume: number) => {
    updateProject((current) => ({ ...current, beat: { ...current.beat, lanes: current.beat.lanes.map((lane, index) => index === laneIndex ? { ...lane, volume: Math.max(0, Math.min(1, volume)) } : lane) } }));
  }, [updateProject]);

  const setPatternSteps = useCallback((steps: 16 | 32) => {
    updateProject((current) => ({ ...current, beat: { ...current.beat, steps, lanes: current.beat.lanes.map((lane) => ({ ...lane, active: lane.active.filter((step) => step < steps) })) } }));
  }, [updateProject]);

  const applyPreset = useCallback((name: BeatPresetName) => {
    setPresetName(name);
    updateProject((current) => ({
      ...current,
      beat: {
        ...current.beat,
        name,
        lanes: current.beat.lanes.map((lane) => { const active = [...(PRESET_STEPS[name][lane.name] ?? [])]; return { ...lane, active, velocity: active.map(() => 1) }; }),
      },
    }));
  }, [updateProject]);

  const nextBoundaryDelayMs = useCallback(() => {
    if (!isTransportPlaying || project.transport.quantization === "off") return 0;
    const beats = project.transport.quantization === "1/4" ? 1 : project.transport.quantization === "1/2" ? 2 : project.transport.quantization === "1bar" ? 4 : 8;
    const quantumMs = beats * (60_000 / tempo);
    const elapsed = Math.max(0, Date.now() - transportStartWallRef.current);
    const remainder = elapsed % quantumMs;
    return remainder < 8 ? 0 : quantumMs - remainder;
  }, [isTransportPlaying, project.transport.quantization, tempo]);

  return (
    <BeatContext.Provider value={{ currentStep, bar, beat, isTransportPlaying, pattern, presetName, startTransport, stopTransport, toggleTransport, setTempo, setSwing, toggleStep, cycleStepVelocity, toggleLaneMute, setLaneVolume, setPatternSteps, applyPreset, nextBoundaryDelayMs }}>
      {children}
    </BeatContext.Provider>
  );
}

export function useBeatTransport() {
  const value = useContext(BeatContext);
  if (!value) throw new Error("useBeatTransport muss innerhalb von BeatProvider verwendet werden.");
  return value;
}
