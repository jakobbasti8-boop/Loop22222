import { dbToGain, barsToSeconds, type ProLoopTrack } from "@/lib/pro-session";

const REVERB_IR = require("../../assets/audio/reverb_ir.wav");

type TrackGraph = {
  input: any;
  lowEq: any;
  midEq: any;
  highEq: any;
  filter: any;
  panner: any;
  dry: any;
  delay: any;
  delayWet: any;
  feedback: any;
  convolver: any;
  reverbWet: any;
  sources: any[];
  layerUris: string[];
};

type EngineStatus = "cold" | "ready" | "recording" | "error";

class ProAudioEngine {
  private api: any | null = null;
  private context: any | null = null;
  private masterGain: any | null = null;
  private masterAnalyser: any | null = null;
  private recorder: any | null = null;
  private tracks = new Map<number, TrackGraph>();
  private buffers = new Map<string | number, any>();
  private bufferPromises = new Map<string | number, Promise<any>>();
  private status: EngineStatus = "cold";
  private errorMessage: string | null = null;
  private systemSubscriptions: any[] = [];
  private observersInstalled = false;
  private routeChangedDuringRecording = false;

  getStatus() {
    return { status: this.status, errorMessage: this.errorMessage, sampleRate: this.context?.sampleRate ?? null };
  }

  private loadApi() {
    if (this.api) return this.api;
    // Static dependency, loaded lazily so non-audio screens can render before the native engine is initialized.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.api = require("react-native-audio-api");
    return this.api;
  }

  async ensureReady() {
    if (this.context && this.masterGain) return this.context;
    try {
      const api = this.loadApi();
      api.AudioManager?.setAudioSessionOptions?.({
        iosCategory: "playAndRecord",
        iosMode: "default",
        iosOptions: ["defaultToSpeaker"],
      });
      this.context = new api.AudioContext();
      this.masterGain = this.context.createGain();
      this.masterAnalyser = this.context.createAnalyser();
      this.masterAnalyser.fftSize = 512;
      this.masterAnalyser.smoothingTimeConstant = 0.65;
      this.masterGain.gain.setValueAtTime(1, this.context.currentTime);
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.context.destination);
      if (!this.observersInstalled && api.AudioManager) {
        this.observersInstalled = true;
        api.AudioManager.observeAudioInterruptions?.("gain");
        const interruption = api.AudioManager.addSystemEventListener?.("interruption", (event: any) => {
          if (event?.type === "began") void this.context?.suspend?.().catch?.(() => undefined);
          if (event?.type === "ended" && event?.shouldResume !== false) void this.context?.resume?.().catch?.(() => undefined);
        });
        const route = api.AudioManager.addSystemEventListener?.("routeChange", () => {
          if (this.status === "recording") {
            this.routeChangedDuringRecording = true;
            this.errorMessage = "Audio-Route hat sich während der Aufnahme geändert. Der Take wird aus Sicherheitsgründen verworfen.";
          }
          if (this.context?.state === "suspended") void this.context.resume().catch?.(() => undefined);
        });
        if (interruption) this.systemSubscriptions.push(interruption);
        if (route) this.systemSubscriptions.push(route);
      }
      if (this.context.state === "suspended") await this.context.resume();
      this.status = "ready";
      this.errorMessage = null;
      return this.context;
    } catch (error) {
      this.status = "error";
      this.errorMessage = error instanceof Error ? error.message : "Native Audio Engine konnte nicht initialisiert werden.";
      throw error;
    }
  }

  async activateAudioSession() {
    const api = this.loadApi();
    if (api.AudioManager?.setAudioSessionActivity) {
      await api.AudioManager.setAudioSessionActivity(true);
    }
  }

  async setMasterVolume(db: number) {
    const context = await this.ensureReady();
    const gain = dbToGain(db);
    this.masterGain.gain.setValueAtTime(gain, context.currentTime);
  }

  private async getTrackGraph(track: ProLoopTrack) {
    const context = await this.ensureReady();
    let graph = this.tracks.get(track.id);
    if (graph) return graph;

    const input = context.createGain();
    const lowEq = context.createBiquadFilter();
    lowEq.type = "lowshelf";
    lowEq.frequency.setValueAtTime(140, context.currentTime);
    const midEq = context.createBiquadFilter();
    midEq.type = "peaking";
    midEq.frequency.setValueAtTime(1100, context.currentTime);
    midEq.Q.setValueAtTime(0.85, context.currentTime);
    const highEq = context.createBiquadFilter();
    highEq.type = "highshelf";
    highEq.frequency.setValueAtTime(6500, context.currentTime);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    const panner = context.createStereoPanner();
    const dry = context.createGain();
    const delay = context.createDelay(2);
    const delayWet = context.createGain();
    const feedback = context.createGain();
    const convolver = context.createConvolver();
    const reverbWet = context.createGain();
    convolver.buffer = await this.decode(REVERB_IR);

    input.connect(lowEq);
    lowEq.connect(midEq);
    midEq.connect(highEq);
    highEq.connect(filter);
    filter.connect(panner);
    panner.connect(dry);
    dry.connect(this.masterGain);
    panner.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(this.masterGain);
    delay.connect(feedback);
    feedback.connect(delay);
    panner.connect(convolver);
    convolver.connect(reverbWet);
    reverbWet.connect(this.masterGain);

    graph = { input, lowEq, midEq, highEq, filter, panner, dry, delay, delayWet, feedback, convolver, reverbWet, sources: [], layerUris: [] };
    this.tracks.set(track.id, graph);
    await this.applyTrackMix(track);
    return graph;
  }

  async applyTrackMix(track: ProLoopTrack, anySolo = false) {
    const context = await this.ensureReady();
    const graph = await this.getTrackGraph(track);
    const audible = !track.isMuted && (!anySolo || track.isSolo);
    const gain = audible ? dbToGain(track.volumeDb) : 0;
    graph.input.gain.setValueAtTime(gain, context.currentTime);
    graph.panner.pan.setValueAtTime(Math.max(-1, Math.min(1, track.pan)), context.currentTime);
    graph.lowEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.lowDb ?? 0)), context.currentTime);
    graph.midEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.midDb ?? 0)), context.currentTime);
    graph.highEq.gain.setValueAtTime(Math.max(-12, Math.min(12, track.fx.highDb ?? 0)), context.currentTime);
    graph.filter.frequency.setValueAtTime(Math.max(120, Math.min(20000, track.fx.filterHz)), context.currentTime);
    graph.delay.delayTime.setValueAtTime(Math.max(0, Math.min(1.5, track.fx.delayMs / 1000)), context.currentTime);
    graph.delayWet.gain.setValueAtTime(Math.max(0, Math.min(1, track.fx.delayWet)), context.currentTime);
    graph.reverbWet.gain.setValueAtTime(Math.max(0, Math.min(1, track.fx.reverbWet ?? 0)), context.currentTime);
    graph.dry.gain.setValueAtTime(1, context.currentTime);
    graph.feedback.gain.setValueAtTime(track.fx.delayWet > 0 ? 0.28 : 0, context.currentTime);
  }

  async applyProjectMix(tracks: ProLoopTrack[]) {
    const anySolo = tracks.some((track) => track.isSolo);
    await Promise.all(tracks.map((track) => this.applyTrackMix(track, anySolo)));
  }

  private async decode(source: string | number) {
    const existing = this.buffers.get(source);
    if (existing) return existing;
    const pending = this.bufferPromises.get(source);
    if (pending) return pending;
    const context = await this.ensureReady();
    const promise = context.decodeAudioData(source).then((buffer: any) => {
      this.buffers.set(source, buffer);
      this.bufferPromises.delete(source);
      return buffer;
    }).catch((error: unknown) => {
      this.bufferPromises.delete(source);
      throw error;
    });
    this.bufferPromises.set(source, promise);
    return promise;
  }

  private stopGraphSources(graph: TrackGraph) {
    for (const source of graph.sources) {
      try { source.stop(this.context?.currentTime ?? 0); } catch { /* source may already be stopped */ }
      try { source.disconnect(); } catch { /* no-op */ }
    }
    graph.sources = [];
  }

  async loadTrack(track: ProLoopTrack, tempo: number, loopBars: number, startPlaying = track.isPlaying) {
    const context = await this.ensureReady();
    const graph = await this.getTrackGraph(track);
    this.stopGraphSources(graph);
    graph.layerUris = track.layers.map((layer) => layer.uri);
    await this.applyTrackMix(track);
    if (!startPlaying || track.layers.length === 0) return;

    const when = context.currentTime + 0.06;
    const musicalLoopSeconds = barsToSeconds(loopBars, tempo);
    for (const layer of track.layers) {
      const buffer = await this.decode(layer.uri);
      const source = context.createBufferSource({ pitchCorrection: false });
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = Math.min(buffer.duration, musicalLoopSeconds) || buffer.duration;
      source.connect(graph.input);
      source.start(when);
      graph.sources.push(source);
    }
  }

  async playTracksSynchronized(tracks: ProLoopTrack[], tempo: number, loopBars: number) {
    const context = await this.ensureReady();
    const playable = tracks.filter((track) => track.isPlaying && track.layers.length > 0);
    await Promise.all(playable.flatMap((track) => track.layers.map((layer) => this.decode(layer.uri))));
    const when = context.currentTime + 0.08;
    const musicalLoopSeconds = barsToSeconds(loopBars, tempo);

    for (const track of tracks) {
      const graph = await this.getTrackGraph(track);
      this.stopGraphSources(graph);
      graph.layerUris = track.layers.map((layer) => layer.uri);
      await this.applyTrackMix(track);
      if (!track.isPlaying || track.layers.length === 0) continue;
      for (const layer of track.layers) {
        const buffer = this.buffers.get(layer.uri) ?? await this.decode(layer.uri);
        const source = context.createBufferSource({ pitchCorrection: false });
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = 0;
        source.loopEnd = Math.min(buffer.duration, musicalLoopSeconds) || buffer.duration;
        source.connect(graph.input);
        source.start(when);
        graph.sources.push(source);
      }
    }
  }

  async getMasterMeter() {
    await this.ensureReady();
    if (!this.masterAnalyser) return { rmsDb: -120, peakDb: -120 };
    const samples = new Float32Array(this.masterAnalyser.fftSize || 512);
    this.masterAnalyser.getFloatTimeDomainData(samples);
    let sumSquares = 0;
    let peak = 0;
    for (const sample of samples) {
      const absolute = Math.abs(sample);
      if (absolute > peak) peak = absolute;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));
    const toDb = (value: number) => Math.max(-120, 20 * Math.log10(Math.max(1e-6, value)));
    return { rmsDb: toDb(rms), peakDb: toDb(peak) };
  }

  async inspectAudio(uri: string) {
    const buffer = await this.decode(uri);
    return {
      durationSeconds: Number(buffer.duration ?? 0),
      sampleRate: Number(buffer.sampleRate ?? 0),
      channels: Number(buffer.numberOfChannels ?? 0),
    };
  }

  async getDevicesInfo() {
    const api = this.loadApi();
    return api.AudioManager?.getDevicesInfo?.() ?? null;
  }

  async playTrack(track: ProLoopTrack, tempo: number, loopBars: number) {
    await this.loadTrack({ ...track, isPlaying: true }, tempo, loopBars, true);
  }

  async stopTrack(trackId: number) {
    const graph = this.tracks.get(trackId);
    if (!graph) return;
    this.stopGraphSources(graph);
  }

  async clearTrack(trackId: number) {
    await this.stopTrack(trackId);
    const graph = this.tracks.get(trackId);
    if (graph) graph.layerUris = [];
  }

  async scheduleOneShot(asset: number, when: number, volume = 1) {
    const context = await this.ensureReady();
    const buffer = await this.decode(asset);
    const source = context.createBufferSource({ pitchCorrection: false });
    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(0, volume), Math.max(context.currentTime, when));
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(Math.max(context.currentTime, when));
  }

  async currentTime() {
    const context = await this.ensureReady();
    return context.currentTime as number;
  }

  async beginRecording(trackId: number) {
    try {
      const api = this.loadApi();
      await this.ensureReady();
      const permission = await api.AudioManager.requestRecordingPermissions();
      if (permission !== "Granted") throw new Error("Mikrofon-Berechtigung wurde nicht erteilt.");
      await this.activateAudioSession();
      if (!this.recorder) {
        this.recorder = new api.AudioRecorder();
        const fileOptions = api.FileFormat?.Wav !== undefined && api.FilePreset?.Lossless !== undefined
          ? {
              format: api.FileFormat.Wav,
              preset: api.FilePreset.Lossless,
              ...(api.FileDirectory?.Document !== undefined ? { directory: api.FileDirectory.Document } : {}),
              subDirectory: "LoopForge",
            }
          : undefined;
        this.recorder.enableFileOutput(fileOptions);
      }
      this.routeChangedDuringRecording = false;
      this.errorMessage = null;
      const result = await this.recorder.start({ fileNameOverride: `loopforge-track-${trackId}-${Date.now()}` });
      if (result?.status === "error") throw new Error(result.message ?? "Aufnahme konnte nicht gestartet werden.");
      this.status = "recording";
      return true;
    } catch (error) {
      this.status = "error";
      this.errorMessage = error instanceof Error ? error.message : "Aufnahme konnte nicht gestartet werden.";
      throw error;
    }
  }

  async finishRecording() {
    if (!this.recorder) return null;
    try {
      const result = await this.recorder.stop();
      this.status = "ready";
      if (!result || result.status !== "success" || !result.paths?.[0]) {
        throw new Error(result?.message ?? "Aufnahme konnte nicht gespeichert werden.");
      }
      if (this.routeChangedDuringRecording) {
        this.routeChangedDuringRecording = false;
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { File } = require("expo-file-system");
          for (const path of result.paths) {
            const file = new File(path);
            if (file.exists) file.delete();
          }
        } catch { /* best-effort cleanup of an invalid take */ }
        throw new Error("Audio-Route wurde während der Aufnahme gewechselt. Dieser Take wurde verworfen, damit keine zeitlich beschädigte Loop gespeichert wird.");
      }
      this.routeChangedDuringRecording = false;
      return { uri: result.paths[0] as string, durationSeconds: Number(result.duration ?? 0) };
    } catch (error) {
      this.status = "error";
      this.errorMessage = error instanceof Error ? error.message : "Aufnahme konnte nicht beendet werden.";
      throw error;
    }
  }

  async close() {
    for (const graph of this.tracks.values()) this.stopGraphSources(graph);
    this.tracks.clear();
    try { await this.context?.close?.(); } catch { /* no-op */ }
    for (const subscription of this.systemSubscriptions) { try { subscription?.remove?.(); } catch { /* no-op */ } }
    this.systemSubscriptions = [];
    this.observersInstalled = false;
    this.context = null;
    this.masterGain = null;
    this.masterAnalyser = null;
    this.status = "cold";
    this.routeChangedDuringRecording = false;
  }
}

export const proAudioEngine = new ProAudioEngine();
