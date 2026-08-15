import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ValueControl } from "@/components/pro/value-control";
import type { ProLoopTrack } from "@/lib/pro-session";

export function TrackDetailModal({ visible, track, onClose, onUpdate, onUndo, onRedo, onClear, onImport }: {
  visible: boolean;
  track: ProLoopTrack | null;
  onClose: () => void;
  onUpdate: (track: ProLoopTrack) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onImport?: () => void;
}) {
  if (!track) return null;
  const fx = track.fx;
  const changeFx = (patch: Partial<typeof fx>) => onUpdate({ ...track, fx: { ...fx, ...patch } });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-[28px] border-t border-border max-h-[90%]">
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <View><Text className="text-muted text-xs font-bold tracking-[1.2px] uppercase">Channel Strip · Spur {track.id}</Text><Text className="text-foreground text-xl font-bold mt-1">{track.name}</Text></View>
            <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-xl bg-background"><Text className="text-foreground font-semibold">Fertig</Text></TouchableOpacity>
          </View>
          <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 30, gap: 12 }}>
            <View className="rounded-2xl bg-background border border-border p-4">
              <Text className="text-muted text-[10px] font-bold tracking-[1px] uppercase mb-2">Channel Name</Text>
              <TextInput value={track.name} onChangeText={(name) => onUpdate({ ...track, name })} placeholder="Spurname" placeholderTextColor="#687076" className="text-foreground text-base font-semibold py-2" />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1"><ValueControl label="Gain" value={`${track.volumeDb.toFixed(0)} dB`} onDecrease={() => onUpdate({ ...track, volumeDb: Math.max(-60, track.volumeDb - 1) })} onIncrease={() => onUpdate({ ...track, volumeDb: Math.min(6, track.volumeDb + 1) })} /></View>
              <View className="flex-1"><ValueControl label="Pan" value={track.pan === 0 ? "Center" : track.pan < 0 ? `L ${Math.round(Math.abs(track.pan) * 100)}` : `R ${Math.round(track.pan * 100)}`} onDecrease={() => onUpdate({ ...track, pan: Math.max(-1, Math.round((track.pan - 0.1) * 10) / 10) })} onIncrease={() => onUpdate({ ...track, pan: Math.min(1, Math.round((track.pan + 0.1) * 10) / 10) })} /></View>
            </View>

            <View className="rounded-2xl bg-background border border-border p-4">
              <Text className="text-foreground font-bold">3-Band EQ</Text><Text className="text-muted text-xs mt-1 mb-3">Low shelf 140 Hz · Mid bell 1.1 kHz · High shelf 6.5 kHz</Text>
              <View className="flex-row gap-2">
                <View className="flex-1"><ValueControl compact label="Low" value={`${fx.lowDb >= 0 ? "+" : ""}${fx.lowDb} dB`} onDecrease={() => changeFx({ lowDb: Math.max(-12, fx.lowDb - 1) })} onIncrease={() => changeFx({ lowDb: Math.min(12, fx.lowDb + 1) })} /></View>
                <View className="flex-1"><ValueControl compact label="Mid" value={`${fx.midDb >= 0 ? "+" : ""}${fx.midDb} dB`} onDecrease={() => changeFx({ midDb: Math.max(-12, fx.midDb - 1) })} onIncrease={() => changeFx({ midDb: Math.min(12, fx.midDb + 1) })} /></View>
                <View className="flex-1"><ValueControl compact label="High" value={`${fx.highDb >= 0 ? "+" : ""}${fx.highDb} dB`} onDecrease={() => changeFx({ highDb: Math.max(-12, fx.highDb - 1) })} onIncrease={() => changeFx({ highDb: Math.min(12, fx.highDb + 1) })} /></View>
              </View>
              <View className="mt-3"><ValueControl compact label="Low-pass Filter" value={fx.filterHz >= 19900 ? "Open" : `${Math.round(fx.filterHz / 100) / 10} kHz`} onDecrease={() => changeFx({ filterHz: Math.max(500, fx.filterHz - 1000) })} onIncrease={() => changeFx({ filterHz: Math.min(20000, fx.filterHz + 1000) })} /></View>
            </View>

            <View className="rounded-2xl bg-background border border-border p-4">
              <Text className="text-foreground font-bold">Space FX</Text><Text className="text-muted text-xs mt-1 mb-3">Delay mit Feedback plus Convolution-Reverb über lokalen Impuls.</Text>
              <View className="flex-row gap-2">
                <View className="flex-1"><ValueControl compact label="Delay Time" value={`${fx.delayMs} ms`} onDecrease={() => changeFx({ delayMs: Math.max(0, fx.delayMs - 25) })} onIncrease={() => changeFx({ delayMs: Math.min(1500, fx.delayMs + 25) })} /></View>
                <View className="flex-1"><ValueControl compact label="Delay Wet" value={`${Math.round(fx.delayWet * 100)} %`} onDecrease={() => changeFx({ delayWet: Math.max(0, Math.round((fx.delayWet - 0.05) * 100) / 100) })} onIncrease={() => changeFx({ delayWet: Math.min(1, Math.round((fx.delayWet + 0.05) * 100) / 100) })} /></View>
              </View>
              <View className="mt-3"><ValueControl compact label="Reverb Wet" value={`${Math.round(fx.reverbWet * 100)} %`} onDecrease={() => changeFx({ reverbWet: Math.max(0, Math.round((fx.reverbWet - 0.05) * 100) / 100) })} onIncrease={() => changeFx({ reverbWet: Math.min(1, Math.round((fx.reverbWet + 0.05) * 100) / 100) })} /></View>
            </View>

            <View className="rounded-2xl bg-background border border-border p-4">
              <Text className="text-foreground font-bold">Layer / Overdub History</Text><Text className="text-muted text-xs mt-1">{track.layers.length} Aufnahme-Layer. Undo/Redo arbeitet pro Spur als Stack und verändert nur Overdub-Layer.</Text>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity onPress={onUndo} disabled={track.layers.length === 0} className="flex-1 py-3 rounded-xl bg-surface items-center" style={{ opacity: track.layers.length ? 1 : .35 }}><Text className="text-foreground font-semibold">Undo</Text></TouchableOpacity>
                <TouchableOpacity onPress={onRedo} className="flex-1 py-3 rounded-xl bg-surface items-center"><Text className="text-foreground font-semibold">Redo</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert("Spur löschen?", "Alle Layer dieser Spur werden aus der Session entfernt.", [{ text: "Abbrechen", style: "cancel" }, { text: "Löschen", style: "destructive", onPress: onClear }])} disabled={track.layers.length === 0} className="flex-1 py-3 rounded-xl bg-[#3A2024] items-center" style={{ opacity: track.layers.length ? 1 : .35 }}><Text className="text-[#FF8B96] font-semibold">Clear</Text></TouchableOpacity>
              </View>
              {onImport ? <TouchableOpacity onPress={onImport} className="mt-2 py-3 rounded-xl bg-[#1F3340] items-center"><Text className="text-[#70D6FF] font-semibold">AUDIO-DATEI ALS LAYER IMPORTIEREN</Text></TouchableOpacity> : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
