import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { TrackDetailModal } from "@/components/pro/track-detail-modal";
import { ValueControl } from "@/components/pro/value-control";
import { ScreenContainer } from "@/components/screen-container";
import { useProLoopEngine } from "@/hooks/use-pro-loop-engine";
import type { ProLoopTrack } from "@/lib/pro-session";
import { useSessionProject } from "@/lib/session-provider";
import { useEffect, useState } from "react";

export default function MixerScreen() {
  const { project, updateProject, undoLayer, redoLayer, clearTrack } = useSessionProject();
  const { reloadTrack, clearAudioTrack, engineStatus, getMasterMeter } = useProLoopEngine(project);
  const [detailTrackId, setDetailTrackId] = useState<number | null>(null);
  const [meter, setMeter] = useState({ rmsDb: -120, peakDb: -120 });
  const detailTrack = detailTrackId ? project.tracks.find((track) => track.id === detailTrackId) ?? null : null;

  useEffect(() => {
    let active = true;
    const timer = setInterval(() => {
      void getMasterMeter().then((value) => { if (active) setMeter(value); }).catch(() => undefined);
    }, 90);
    return () => { active = false; clearInterval(timer); };
  }, [getMasterMeter]);

  const meterWidth = `${Math.max(0, Math.min(100, ((meter.peakDb + 60) / 60) * 100))}%` as `${number}%`;

  const updateTrack = (trackId: number, updater: (track: ProLoopTrack) => ProLoopTrack) => {
    updateProject((current) => ({ ...current, tracks: current.tracks.map((track) => track.id === trackId ? updater(track) : track) }));
  };

  return (
    <ScreenContainer className="px-4">
      <View className="pt-3 pb-4">
        <Text className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase">Console</Text>
        <View className="flex-row items-end justify-between mt-1">
          <View><Text className="text-foreground text-2xl font-bold">Mixer & FX</Text><Text className="text-muted text-xs mt-1">8 Channels · Master · Filter · Delay · Solo Bus</Text></View>
          <View className="rounded-xl bg-surface border border-border px-3 py-2"><Text className="text-muted text-[9px]">ENGINE</Text><Text className="text-foreground text-xs font-bold mt-1">{engineStatus.status.toUpperCase()}</Text></View>
        </View>
      </View>

      <View className="rounded-2xl bg-surface border border-border p-4 mb-4">
        <View className="flex-row justify-between items-center mb-3"><View><Text className="text-foreground font-bold text-base">MASTER</Text><Text className="text-muted text-xs">Stereo Output</Text></View><Text className="text-foreground font-bold">{project.master.volumeDb.toFixed(0)} dB</Text></View>
        <View className="mb-3">
          <View className="h-3 rounded-full bg-background overflow-hidden border border-border">
            <View className="h-full rounded-full bg-primary" style={{ width: meterWidth }} />
          </View>
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-muted text-[10px]">RMS {meter.rmsDb.toFixed(1)} dBFS</Text>
            <Text className="text-muted text-[10px]">PEAK {meter.peakDb.toFixed(1)} dBFS</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => updateProject((current) => ({ ...current, master: { volumeDb: Math.max(-60, current.master.volumeDb - 1) } }))} className="flex-1 py-3 rounded-xl bg-background items-center"><Text className="text-foreground font-bold">− 1 dB</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => updateProject((current) => ({ ...current, master: { volumeDb: Math.min(6, current.master.volumeDb + 1) } }))} className="flex-1 py-3 rounded-xl bg-background items-center"><Text className="text-foreground font-bold">+ 1 dB</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36, gap: 10 }}>
        {project.tracks.map((track) => (
          <View key={track.id} className="rounded-2xl bg-surface border border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => setDetailTrackId(track.id)} className="flex-row items-center flex-1">
                <View className="w-1.5 h-10 rounded-full mr-3" style={{ backgroundColor: track.color }} />
                <View><Text className="text-foreground font-bold">{track.id}. {track.name}</Text><Text className="text-muted text-[11px] mt-1">{track.layers.length} Layer · {track.fx.reverbWet > 0 ? `Verb ${Math.round(track.fx.reverbWet * 100)}%` : track.fx.delayWet > 0 ? `Delay ${Math.round(track.fx.delayWet * 100)}%` : "Dry"}</Text></View>
              </TouchableOpacity>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => updateTrack(track.id, (current) => ({ ...current, isSolo: !current.isSolo }))} className="h-9 w-9 rounded-lg items-center justify-center" style={{ backgroundColor: track.isSolo ? "#FFD166" : "#101218" }}><Text className="font-bold text-xs" style={{ color: track.isSolo ? "#101218" : "#A8B0C2" }}>S</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => updateTrack(track.id, (current) => ({ ...current, isMuted: !current.isMuted }))} className="h-9 w-9 rounded-lg items-center justify-center" style={{ backgroundColor: track.isMuted ? "#FF7B7B" : "#101218" }}><Text className="font-bold text-xs" style={{ color: track.isMuted ? "#101218" : "#A8B0C2" }}>M</Text></TouchableOpacity>
              </View>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1"><ValueControl compact label="Gain" value={`${track.volumeDb.toFixed(0)} dB`} onDecrease={() => updateTrack(track.id, (current) => ({ ...current, volumeDb: Math.max(-60, current.volumeDb - 1) }))} onIncrease={() => updateTrack(track.id, (current) => ({ ...current, volumeDb: Math.min(6, current.volumeDb + 1) }))} /></View>
              <View className="flex-1"><ValueControl compact label="Pan" value={track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`} onDecrease={() => updateTrack(track.id, (current) => ({ ...current, pan: Math.max(-1, Math.round((current.pan - .1) * 10) / 10) }))} onIncrease={() => updateTrack(track.id, (current) => ({ ...current, pan: Math.min(1, Math.round((current.pan + .1) * 10) / 10) }))} /></View>
            </View>
            <TouchableOpacity onPress={() => setDetailTrackId(track.id)} className="mt-3 py-2.5 rounded-xl bg-background items-center"><Text className="text-muted text-xs font-semibold">CHANNEL STRIP / FX ÖFFNEN</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TrackDetailModal
        visible={detailTrackId !== null}
        track={detailTrack}
        onClose={() => setDetailTrackId(null)}
        onUpdate={(track) => updateTrack(track.id, () => track)}
        onUndo={() => {
          if (!detailTrack) return;
          const removed = undoLayer(detailTrack.id);
          if (removed) void reloadTrack({ ...detailTrack, layers: detailTrack.layers.slice(0, -1) });
        }}
        onRedo={() => {
          if (!detailTrack) return;
          const layer = redoLayer(detailTrack.id);
          if (layer) void reloadTrack({ ...detailTrack, layers: [...detailTrack.layers, layer], isPlaying: true });
        }}
        onClear={() => {
          if (!detailTrack) return;
          clearTrack(detailTrack.id);
          void clearAudioTrack(detailTrack.id);
        }}
      />
    </ScreenContainer>
  );
}
