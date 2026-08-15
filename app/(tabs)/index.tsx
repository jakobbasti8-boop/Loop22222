import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ProTrackCard } from "@/components/pro/pro-track-card";
import { TrackDetailModal } from "@/components/pro/track-detail-modal";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProLoopEngine } from "@/hooks/use-pro-loop-engine";
import { useBeatTransport } from "@/lib/beat-provider";
import { barsToSeconds, type LoopLayer, type ProLoopTrack } from "@/lib/pro-session";
import { pickAndImportLoop } from "@/lib/audio/import-loop";
import { useSessionProject } from "@/lib/session-provider";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function StudioScreen() {
  useKeepAwake();
  const {
    project,
    isLoaded,
    isDirty,
    armedTrack,
    updateProject,
    armTrack,
    addLayer,
    undoLayer,
    redoLayer,
    clearTrack,
    captureScene,
    launchScene,
    saveNow,
  } = useSessionProject();
  const {
    audioError,
    beginRecording,
    finishRecording,
    isRecording,
    recordingSeconds,
    playTrack,
    stopTrack,
    reloadTrack,
    playTracksSynchronized,
    clearAudioTrack,
    engineStatus,
  } = useProLoopEngine(project);
  const {
    bar,
    beat,
    isTransportPlaying,
    toggleTransport,
    startTransport,
    stopTransport,
    setTempo,
    nextBoundaryDelayMs,
  } = useBeatTransport();

  const [detailTrackId, setDetailTrackId] = useState<number | null>(null);
  const [recordingPending, setRecordingPending] = useState<string | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordTrackIdRef = useRef<number | null>(null);
  const finishingRef = useRef(false);

  const detailTrack = detailTrackId ? project.tracks.find((item) => item.id === detailTrackId) ?? null : null;

  useEffect(() => {
    if (!audioError) return;
    Alert.alert("Audio Engine", audioError);
  }, [audioError]);

  useEffect(() => () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
  }, []);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

  const updateTrack = useCallback((trackId: number, updater: (track: ProLoopTrack) => ProLoopTrack) => {
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? updater(track) : track),
    }));
  }, [updateProject]);

  const togglePlay = useCallback(async (track: ProLoopTrack) => {
    haptic();
    if (!track.layers.length) return;
    if (track.isPlaying) await stopTrack(track.id);
    else await playTrack({ ...track, isPlaying: true });
    updateTrack(track.id, (current) => ({ ...current, isPlaying: !track.isPlaying }));
  }, [playTrack, stopTrack, updateTrack]);

  const toggleMute = useCallback((track: ProLoopTrack) => {
    haptic();
    updateTrack(track.id, (current) => ({ ...current, isMuted: !current.isMuted }));
  }, [updateTrack]);

  const toggleSolo = useCallback((track: ProLoopTrack) => {
    haptic();
    updateTrack(track.id, (current) => ({ ...current, isSolo: !current.isSolo }));
  }, [updateTrack]);

  const finishCurrentRecording = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
    try {
      const result = await finishRecording();
      const trackId = recordTrackIdRef.current;
      recordTrackIdRef.current = null;
      if (!result || !trackId) return;
      const layer: LoopLayer = {
        id: `layer-${Date.now()}`,
        uri: result.uri,
        durationSeconds: result.durationSeconds,
        createdAt: new Date().toISOString(),
      };
      const sourceTrack = project.tracks.find((item) => item.id === trackId);
      if (!sourceTrack) return;
      const nextTrack = { ...sourceTrack, layers: [...sourceTrack.layers, layer], isPlaying: true, isMuted: false };
      addLayer(trackId, layer);
      await reloadTrack(nextTrack);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } finally {
      setRecordingPending(null);
      finishingRef.current = false;
    }
  }, [addLayer, finishRecording, project.tracks, reloadTrack]);

  const startQuantizedRecording = useCallback(async () => {
    if (recordingPending || isRecording) return;
    haptic();
    const target = armedTrack;
    recordTrackIdRef.current = target.id;

    try {
      if (!isTransportPlaying) {
        startTransport();
        const countInBars = project.transport.countInBars;
        if (countInBars > 0) {
          setRecordingPending(`Count-in · ${countInBars} Takt${countInBars === 1 ? "" : "e"}`);
          await sleep(barsToSeconds(countInBars, project.transport.tempo) * 1000);
        }
      } else {
        const delay = nextBoundaryDelayMs();
        if (delay > 20) {
          setRecordingPending(`Warte auf ${project.transport.quantization}`);
          await sleep(delay);
        }
      }

      setRecordingPending("Aufnahme startet …");
      const started = await beginRecording(target.id);
      if (!started) {
        setRecordingPending(null);
        return;
      }
      setRecordingPending(null);
      const loopDurationMs = barsToSeconds(project.transport.loopBars, project.transport.tempo) * 1000;
      autoStopRef.current = setTimeout(() => { void finishCurrentRecording(); }, loopDurationMs);
    } catch (error) {
      recordTrackIdRef.current = null;
      setRecordingPending(null);
      Alert.alert("Aufnahme", error instanceof Error ? error.message : "Aufnahme konnte nicht gestartet werden.");
    }
  }, [armedTrack, beginRecording, finishCurrentRecording, isRecording, isTransportPlaying, nextBoundaryDelayMs, project.transport, recordingPending, startTransport]);

  const stopAll = useCallback(async () => {
    haptic();
    if (isRecording) await finishCurrentRecording();
    await Promise.all(project.tracks.map((track) => stopTrack(track.id)));
    updateProject((current) => ({ ...current, tracks: current.tracks.map((track) => ({ ...track, isPlaying: false })) }));
    stopTransport();
  }, [finishCurrentRecording, isRecording, project.tracks, stopTrack, stopTransport, updateProject]);

  const launchSceneQuantized = useCallback(async (sceneId: string) => {
    haptic();
    const delay = nextBoundaryDelayMs();
    if (delay > 20) await sleep(delay);
    const tracks = launchScene(sceneId);
    await playTracksSynchronized(tracks);
  }, [launchScene, nextBoundaryDelayMs, playTracksSynchronized]);

  const undo = useCallback(async (track: ProLoopTrack) => {
    const removed = undoLayer(track.id);
    if (!removed) return;
    await reloadTrack({ ...track, layers: track.layers.slice(0, -1), isPlaying: track.layers.length > 1 && track.isPlaying });
  }, [reloadTrack, undoLayer]);

  const redo = useCallback(async (track: ProLoopTrack) => {
    const restored = redoLayer(track.id);
    if (!restored) return;
    await reloadTrack({ ...track, layers: [...track.layers, restored], isPlaying: true });
  }, [redoLayer, reloadTrack]);

  const clear = useCallback(async (track: ProLoopTrack) => {
    clearTrack(track.id);
    await clearAudioTrack(track.id);
  }, [clearAudioTrack, clearTrack]);

  const importLoop = useCallback(async (track: ProLoopTrack) => {
    try {
      const imported = await pickAndImportLoop();
      if (!imported) return;
      const expectedSeconds = barsToSeconds(project.transport.loopBars, project.transport.tempo);
      const difference = Math.abs((imported.layer.durationSeconds ?? expectedSeconds) - expectedSeconds);
      const nextTrack = { ...track, layers: [...track.layers, imported.layer], isPlaying: true, isMuted: false };
      addLayer(track.id, imported.layer);
      await reloadTrack(nextTrack);
      if (difference > 0.035) {
        Alert.alert(
          "Loop importiert",
          `${imported.fileName} · ${(imported.layer.durationSeconds ?? 0).toFixed(2)} s · ${imported.sampleRate || "?"} Hz · ${imported.channels || "?"} Kanal/Kanäle.\n\nDie Datei weicht von der aktuellen musikalischen Loop-Länge (${expectedSeconds.toFixed(2)} s) ab. Sie bleibt unverändert; für tempoelastische Anpassung ist später der Time-Stretch-Kern vorgesehen.`,
        );
      }
    } catch (error) {
      Alert.alert("Audio-Import", error instanceof Error ? error.message : "Datei konnte nicht importiert werden.");
    }
  }, [addLayer, project.transport.loopBars, project.transport.tempo, reloadTrack]);

  if (!isLoaded) {
    return <ScreenContainer className="items-center justify-center"><Text className="text-muted">Session wird geladen …</Text></ScreenContainer>;
  }

  return (
    <ScreenContainer className="px-4" safeAreaClassName="bg-background">
      <View className="flex-row items-center justify-between pt-3 pb-3">
        <View className="flex-1 pr-3">
          <Text className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase">LoopForge Pro Studio</Text>
          <Text className="text-foreground text-2xl font-bold mt-1" numberOfLines={1}>{project.title}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: engineStatus.status === "ready" || engineStatus.status === "recording" ? "#63D8A6" : engineStatus.status === "error" ? "#FF6B6B" : "#FFD166" }} />
            <Text className="text-muted text-[11px]">{isDirty ? "Autosave ausstehend" : "Gespeichert"} · {engineStatus.sampleRate ? `${engineStatus.sampleRate / 1000} kHz` : "Engine lädt"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => void saveNow()} className="h-11 px-4 rounded-xl bg-surface border border-border items-center justify-center">
          <Text className="text-foreground font-semibold text-xs">SAVE</Text>
        </TouchableOpacity>
      </View>

      <View className="rounded-2xl bg-surface border border-border p-3 mb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setTempo(project.transport.tempo - 1)} className="h-10 w-10 rounded-xl bg-background items-center justify-center"><Text className="text-foreground text-xl">−</Text></TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-muted text-[9px] font-bold tracking-[1.2px]">TEMPO</Text>
            <Text className="text-foreground text-xl font-bold">{project.transport.tempo} <Text className="text-muted text-xs">BPM</Text></Text>
          </View>
          <TouchableOpacity onPress={() => setTempo(project.transport.tempo + 1)} className="h-10 w-10 rounded-xl bg-background items-center justify-center"><Text className="text-foreground text-xl">+</Text></TouchableOpacity>
          <View className="w-px h-9 bg-border mx-3" />
          <TouchableOpacity onPress={() => { haptic(); toggleTransport(); }} className="flex-row items-center gap-2">
            <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: isTransportPlaying ? "#63D8A6" : "#2D3442" }}>
              <IconSymbol name={isTransportPlaying ? "pause.fill" : "play.fill"} size={19} color={isTransportPlaying ? "#101218" : "#FFFFFF"} />
            </View>
            <View className="min-w-[58px]"><Text className="text-foreground font-bold">{bar}.{beat}</Text><Text className="text-muted text-[10px]">BAR.BEAT</Text></View>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-2 mt-3">
          <View className="flex-1 rounded-xl bg-background px-3 py-2"><Text className="text-muted text-[9px] font-bold">QUANTIZE</Text><Text className="text-foreground text-xs font-semibold mt-1">{project.transport.quantization}</Text></View>
          <View className="flex-1 rounded-xl bg-background px-3 py-2"><Text className="text-muted text-[9px] font-bold">LOOP</Text><Text className="text-foreground text-xs font-semibold mt-1">{project.transport.loopBars} Takte</Text></View>
          <View className="flex-1 rounded-xl bg-background px-3 py-2"><Text className="text-muted text-[9px] font-bold">COUNT-IN</Text><Text className="text-foreground text-xs font-semibold mt-1">{project.transport.countInBars} Takte</Text></View>
          <View className="flex-1 rounded-xl bg-background px-3 py-2"><Text className="text-muted text-[9px] font-bold">SWING</Text><Text className="text-foreground text-xs font-semibold mt-1">{Math.round(project.transport.swing * 100)}%</Text></View>
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2"><Text className="text-foreground font-bold text-sm">Szenen</Text><Text className="text-muted text-[10px]">Tippen = Launch · halten = Capture</Text></View>
        <View className="flex-row flex-wrap gap-2">
          {project.scenes.map((scene) => (
            <TouchableOpacity key={scene.id} style={{ width: "23%" }} onPress={() => void launchSceneQuantized(scene.id)} onLongPress={() => { captureScene(scene.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); }} className="flex-1 rounded-xl border border-border bg-surface py-3 items-center">
              <View className="h-2 w-8 rounded-full mb-2" style={{ backgroundColor: scene.color }} />
              <Text className="text-foreground font-bold">{scene.name}</Text>
              <Text className="text-muted text-[9px] mt-1">{scene.tracks.length ? "Mix+FX" : "leer"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, gap: 9 }}>
        <View className="flex-row items-center justify-between mb-1"><Text className="text-foreground font-bold">8-Spur Loop Rack</Text><Text className="text-muted text-[10px]">Long-Press = Channel Strip</Text></View>
        {project.tracks.map((track) => (
          <ProTrackCard
            key={track.id}
            track={track}
            onArm={() => { haptic(); if (!isRecording) armTrack(track.id); }}
            onPlay={() => void togglePlay(track)}
            onMute={() => toggleMute(track)}
            onSolo={() => toggleSolo(track)}
            onEdit={() => setDetailTrackId(track.id)}
          />
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-4 bg-background border-t border-border">
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-muted text-[11px]">ARM · {armedTrack.name}</Text>
          <Text className="text-muted text-[11px]">{recordingPending ?? (isRecording ? `${String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:${String(recordingSeconds % 60).padStart(2, "0")} · Auto ${project.transport.loopBars}T` : `${project.transport.quantization} · ${project.transport.loopBars} Takte`)}</Text>
        </View>
        <View className="flex-row items-center justify-center gap-7">
          <TouchableOpacity onPress={() => void stopAll()} className="h-12 w-12 rounded-full bg-surface border border-border items-center justify-center"><IconSymbol name="stop.fill" size={19} color="#A8B0C2" /></TouchableOpacity>
          <TouchableOpacity disabled={Boolean(recordingPending)} onPress={() => isRecording ? void finishCurrentRecording() : void startQuantizedRecording()} className="h-[72px] w-[72px] rounded-full items-center justify-center" style={{ backgroundColor: isRecording ? "#FF5D5D" : recordingPending ? "#5D6472" : "#FF9B45", borderWidth: isRecording ? 5 : 0, borderColor: "#FFD6D6" }}>
            <IconSymbol name={isRecording ? "stop.fill" : "mic.fill"} size={30} color="#101218" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptic(); toggleTransport(); }} className="h-12 w-12 rounded-full bg-surface border border-border items-center justify-center"><IconSymbol name={isTransportPlaying ? "pause.fill" : "play.fill"} size={19} color="#A8B0C2" /></TouchableOpacity>
        </View>
      </View>

      <TrackDetailModal
        visible={detailTrackId !== null}
        track={detailTrack}
        onClose={() => setDetailTrackId(null)}
        onUpdate={(track) => updateTrack(track.id, () => track)}
        onUndo={() => detailTrack && void undo(detailTrack)}
        onRedo={() => detailTrack && void redo(detailTrack)}
        onClear={() => detailTrack && void clear(detailTrack)}
        onImport={() => detailTrack && void importLoop(detailTrack)}
      />
    </ScreenContainer>
  );
}
