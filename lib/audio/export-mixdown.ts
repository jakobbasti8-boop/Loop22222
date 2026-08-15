import { Directory, File, Paths } from "expo-file-system";

import { barsToSeconds, dbToGain, type DrumLaneName, type ProLoopProject, type ProLoopTrack } from "@/lib/pro-session";
import { encode24BitWave, measurePeak } from "@/lib/audio/wave-encoder";

const REVERB_IR = require("../../assets/audio/reverb_ir.wav");
const DRUM_ASSETS: Record<DrumLaneName, number> = {
  Kick: require("../../assets/audio/kick.wav"),
  Snare: require("../../assets/audio/snare.wav"),
  "Closed Hat": require("../../assets/audio/hihat.wav"),
  "Open Hat": require("../../assets/audio/openhat.wav"),
  Clap: require("../../assets/audio/clap.wav"),
};

export type MixdownResult = {
  uri: string;
  durationSeconds: number;
  sizeBytes: number;
  peakDb: number;
  appliedSafetyGainDb: number;
  sampleRate: number;
  bitDepth: 24;
};

type OfflineGraph = {
  input: any;
};

function createOfflineTrackGraph(context: any, master: any, track: ProLoopTrack, irBuffer: any): OfflineGraph {
  const input = context.createGain();
  const lowEq = context.createBiquadFilter();
  const midEq = context.createBiquadFilter();
  const highEq = context.createBiquadFilter();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const dry = context.createGain();
  const delay = context.createDelay(2);
  const delayWet = context.createGain();
  const feedback = context.createGain();
  const convolver = context.createConvolver();
  const reverbWet = context.createGain();

  lowEq.type = "lowshelf";
  lowEq.frequency.setValueAtTime(140, 0);
  lowEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.lowDb ?? 0)), 0);
  midEq.type = "peaking";
  midEq.frequency.setValueAtTime(1100, 0);
  midEq.Q.setValueAtTime(0.85, 0);
  midEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.midDb ?? 0)), 0);
  highEq.type = "highshelf";
  highEq.frequency.setValueAtTime(6500, 0);
  highEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.highDb ?? 0)), 0);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.max(120, Math.min(20000, track.fx.filterHz)), 0);
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, track.pan)), 0);
  input.gain.setValueAtTime(dbToGain(track.volumeDb), 0);
  dry.gain.setValueAtTime(1, 0);
  delay.delayTime.setValueAtTime(Math.max(0, Math.min(1.5, track.fx.delayMs / 1000)), 0);
  delayWet.gain.setValueAtTime(Math.max(0, Math.min(1, track.fx.delayWet)), 0);
  feedback.gain.setValueAtTime(track.fx.delayWet > 0 ? 0.28 : 0, 0);
  convolver.buffer = irBuffer;
  reverbWet.gain.setValueAtTime(Math.max(0, Math.min(1, track.fx.reverbWet ?? 0)), 0);

  input.connect(lowEq);
  lowEq.connect(midEq);
  midEq.connect(highEq);
  highEq.connect(filter);
  filter.connect(panner);
  panner.connect(dry);
  dry.connect(master);
  panner.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(master);
  delay.connect(feedback);
  feedback.connect(delay);
  panner.connect(convolver);
  convolver.connect(reverbWet);
  reverbWet.connect(master);
  return { input };
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "LoopForge-Mix";
}

export async function exportProjectMixdown(project: ProLoopProject): Promise<MixdownResult> {
  const audibleTracks = project.tracks.filter((track) => track.layers.length > 0 && !track.isMuted);
  const anySolo = project.tracks.some((track) => track.isSolo);
  const renderedTracks = anySolo ? audibleTracks.filter((track) => track.isSolo) : audibleTracks;
  const activeDrumLanes = project.beat.lanes.filter((lane) => !lane.muted && lane.active.length > 0);
  if (renderedTracks.length === 0 && activeDrumLanes.length === 0) throw new Error("Für den Mixdown sind noch keine Loop-Layer oder aktiven Drum-Steps vorhanden.");

  // Loaded lazily: OfflineAudioContext is native and not available in a plain Expo Go runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const api = require("react-native-audio-api");
  if (!api.OfflineAudioContext) throw new Error("OfflineAudioContext ist in diesem Native Build nicht verfügbar.");

  const sampleRate = 48_000;
  const loopSeconds = barsToSeconds(project.transport.loopBars, project.transport.tempo, project.transport.numerator);
  const loopFrames = Math.max(1, Math.round(loopSeconds * sampleRate));
  // Render two complete cycles and export the second one. The first cycle acts as warm-up for delay/reverb tails.
  const context = new api.OfflineAudioContext({ numberOfChannels: 2, length: loopFrames * 2, sampleRate });
  const master = context.createGain();
  master.gain.setValueAtTime(dbToGain(project.master.volumeDb), 0);
  master.connect(context.destination);
  const irBuffer = await context.decodeAudioData(REVERB_IR);

  for (const track of renderedTracks) {
    const graph = createOfflineTrackGraph(context, master, track, irBuffer);
    for (const layer of track.layers) {
      const buffer = await context.decodeAudioData(layer.uri);
      const source = context.createBufferSource({ pitchCorrection: false });
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = Math.min(buffer.duration, loopSeconds) || buffer.duration;
      source.connect(graph.input);
      source.start(0);
    }
  }

  const drumGain = context.createGain();
  drumGain.gain.setValueAtTime(0.92, 0);
  drumGain.connect(master);
  const drumBuffers = new Map<DrumLaneName, any>();
  await Promise.all(activeDrumLanes.map(async (lane) => {
    drumBuffers.set(lane.name, await context.decodeAudioData(DRUM_ASSETS[lane.name]));
  }));
  const stepSeconds = 60 / project.transport.tempo / 4;
  const totalSeconds = loopSeconds * 2;
  const totalSteps = Math.ceil(totalSeconds / stepSeconds);
  for (let absoluteStep = 0; absoluteStep < totalSteps; absoluteStep += 1) {
    const step = absoluteStep % project.beat.steps;
    const baseWhen = absoluteStep * stepSeconds;
    const swingDelay = step % 2 === 1 ? stepSeconds * Math.min(0.45, project.transport.swing) * 0.55 : 0;
    const when = baseWhen + swingDelay;
    if (when >= totalSeconds) continue;
    for (const lane of activeDrumLanes) {
      if (!lane.active.includes(step)) continue;
      const velocityIndex = lane.active.indexOf(step);
      const velocity = lane.velocity[velocityIndex] ?? 1;
      const source = context.createBufferSource({ pitchCorrection: false });
      const gain = context.createGain();
      source.buffer = drumBuffers.get(lane.name);
      gain.gain.setValueAtTime(Math.max(0, lane.volume * velocity), when);
      source.connect(gain);
      gain.connect(drumGain);
      source.start(when);
    }
  }

  const rendered = await context.startRendering();
  const peak = measurePeak(rendered, loopFrames, loopFrames);
  // Export-only safety scaling prevents integer clipping without altering the saved session/mixer values.
  const targetPeak = Math.pow(10, -0.5 / 20);
  const safetyGain = peak > targetPeak ? targetPeak / peak : 1;
  const appliedSafetyGainDb = safetyGain < 1 ? 20 * Math.log10(safetyGain) : 0;
  const bytes = encode24BitWave(rendered, loopFrames, loopFrames, safetyGain);

  const exportsDirectory = new Directory(Paths.document, "LoopForge", "Exports");
  exportsDirectory.create({ idempotent: true, intermediates: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = new File(exportsDirectory, `${safeFileName(project.title)}-${stamp}.wav`);
  file.create({ intermediates: true });
  file.write(bytes);

  return {
    uri: file.uri,
    durationSeconds: loopSeconds,
    sizeBytes: bytes.byteLength,
    peakDb: peak > 0 ? 20 * Math.log10(peak) : -120,
    appliedSafetyGainDb,
    sampleRate,
    bitDepth: 24,
  };
}
