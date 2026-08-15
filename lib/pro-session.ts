export type Quantization = "off" | "1/4" | "1/2" | "1bar" | "2bar";
export type LoopBars = 1 | 2 | 4 | 8;
export type CountInBars = 0 | 1 | 2 | 4;

export type LoopLayer = {
  id: string;
  uri: string;
  durationSeconds?: number;
  createdAt: string;
};

export type TrackFx = {
  filterHz: number;
  lowDb: number;
  midDb: number;
  highDb: number;
  delayMs: number;
  delayWet: number;
  reverbWet: number;
};

export type ProLoopTrack = {
  id: number;
  name: string;
  color: string;
  layers: LoopLayer[];
  isArmed: boolean;
  isMuted: boolean;
  isSolo: boolean;
  isPlaying: boolean;
  volumeDb: number;
  pan: number;
  fx: TrackFx;
};

export type DrumLaneName = "Kick" | "Snare" | "Closed Hat" | "Open Hat" | "Clap";
export type DrumLane = {
  name: DrumLaneName;
  color: string;
  active: number[];
  velocity: number[];
  volume: number;
  muted: boolean;
};

export type BeatPattern = {
  name: string;
  steps: 16 | 32;
  lanes: DrumLane[];
};

export type TransportSettings = {
  tempo: number;
  numerator: 4;
  denominator: 4;
  quantization: Quantization;
  loopBars: LoopBars;
  countInBars: CountInBars;
  metronome: boolean;
  swing: number;
};

export type SceneTrackState = {
  trackId: number;
  isPlaying: boolean;
  isMuted: boolean;
  isSolo?: boolean;
  volumeDb?: number;
  pan?: number;
  fx?: TrackFx;
};

export type LoopScene = {
  id: string;
  name: string;
  color: string;
  tracks: SceneTrackState[];
};

export type MasterSettings = {
  volumeDb: number;
};

export type ProLoopProject = {
  version: 2;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  transport: TransportSettings;
  tracks: ProLoopTrack[];
  beat: BeatPattern;
  scenes: LoopScene[];
  master: MasterSettings;
};

export const TRACK_COLORS = [
  "#76A7FF",
  "#B68CFF",
  "#FF8FA3",
  "#5FD6C6",
  "#FFD166",
  "#70D6FF",
  "#FF70A6",
  "#A1E887",
];

export function createDefaultTracks(): ProLoopTrack[] {
  const names = ["Voice", "Harmony", "Percussion", "Bass", "Texture", "Hook", "FX", "Spur 8"];
  return names.map((name, index) => ({
    id: index + 1,
    name,
    color: TRACK_COLORS[index],
    layers: [],
    isArmed: index === 0,
    isMuted: false,
    isSolo: false,
    isPlaying: false,
    volumeDb: index === 0 ? -2 : -4,
    pan: 0,
    fx: { filterHz: 20000, lowDb: 0, midDb: 0, highDb: 0, delayMs: 0, delayWet: 0, reverbWet: 0 },
  }));
}

export function createDefaultBeat(): BeatPattern {
  return {
    name: "Forge Groove",
    steps: 32,
    lanes: [
      { name: "Kick", color: "#FF9B45", active: [0, 8, 16, 24], velocity: [], volume: 0.9, muted: false },
      { name: "Snare", color: "#76A7FF", active: [8, 24], velocity: [], volume: 0.72, muted: false },
      { name: "Closed Hat", color: "#63D8A6", active: [0, 4, 8, 12, 16, 20, 24, 28], velocity: [], volume: 0.42, muted: false },
      { name: "Open Hat", color: "#FFD166", active: [14, 30], velocity: [], volume: 0.34, muted: false },
      { name: "Clap", color: "#FF8FA3", active: [8, 24], velocity: [], volume: 0.48, muted: false },
    ],
  };
}

export function createProject(title?: string): ProLoopProject {
  const now = new Date();
  const iso = now.toISOString();
  return {
    version: 2,
    id: `project-${now.getTime()}`,
    title: title ?? `Loop ${now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`,
    createdAt: iso,
    updatedAt: iso,
    transport: {
      tempo: 96,
      numerator: 4,
      denominator: 4,
      quantization: "1bar",
      loopBars: 4,
      countInBars: 1,
      metronome: true,
      swing: 0,
    },
    tracks: createDefaultTracks(),
    beat: createDefaultBeat(),
    scenes: [
      { id: "scene-a", name: "A", color: "#FF9B45", tracks: [] },
      { id: "scene-b", name: "B", color: "#76A7FF", tracks: [] },
      { id: "scene-c", name: "C", color: "#B68CFF", tracks: [] },
      { id: "scene-d", name: "D", color: "#63D8A6", tracks: [] },
      { id: "scene-e", name: "E", color: "#FFD166", tracks: [] },
      { id: "scene-f", name: "F", color: "#70D6FF", tracks: [] },
      { id: "scene-g", name: "G", color: "#FF70A6", tracks: [] },
      { id: "scene-h", name: "H", color: "#A1E887", tracks: [] },
    ],
    master: { volumeDb: -1 },
  };
}

export function dbToGain(db: number) {
  if (db <= -60) return 0;
  return Math.pow(10, db / 20);
}

export function barsToSeconds(bars: number, tempo: number, beatsPerBar = 4) {
  return bars * beatsPerBar * (60 / tempo);
}

export function quantizationToBeats(value: Quantization): number {
  switch (value) {
    case "1/4": return 1;
    case "1/2": return 2;
    case "1bar": return 4;
    case "2bar": return 8;
    default: return 0;
  }
}
