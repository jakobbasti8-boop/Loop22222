import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ValueControl } from "@/components/pro/value-control";
import { ScreenContainer } from "@/components/screen-container";
import { useProLoopEngine } from "@/hooks/use-pro-loop-engine";
import type { CountInBars, LoopBars, Quantization } from "@/lib/pro-session";
import { useSessionProject } from "@/lib/session-provider";
import { useBeatTransport } from "@/lib/beat-provider";
import { proAudioEngine } from "@/lib/audio/pro-audio-engine";
import { exportProjectMixdown, type MixdownResult } from "@/lib/audio/export-mixdown";
import * as Sharing from "expo-sharing";

const QUANTIZATION: Quantization[] = ["off", "1/4", "1/2", "1bar", "2bar"];
const LOOP_BARS: LoopBars[] = [1, 2, 4, 8];
const COUNT_IN: CountInBars[] = [0, 1, 2, 4];

export default function SetupScreen() {
  const { project, updateProject, saveNow } = useSessionProject();
  const { setTempo } = useBeatTransport();
  const { engineStatus } = useProLoopEngine(project);
  const tapTimes = useRef<number[]>([]);
  const [devices, setDevices] = useState<any>(null);
  const [isExporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<MixdownResult | null>(null);

  useEffect(() => {
    void proAudioEngine.ensureReady().then(() => proAudioEngine.getDevicesInfo()).then(setDevices).catch(() => undefined);
  }, []);

  const patchTransport = <K extends keyof typeof project.transport>(key: K, value: (typeof project.transport)[K]) => {
    updateProject((current) => ({ ...current, transport: { ...current.transport, [key]: value } }));
  };

  const tapTempo = () => {
    const now = Date.now();
    const recent = [...tapTimes.current.filter((time) => now - time < 3000), now].slice(-6);
    tapTimes.current = recent;
    if (recent.length < 2) return;
    const intervals = recent.slice(1).map((time, i) => time - recent[i]).filter((value) => value > 220 && value < 1500);
    if (!intervals.length) return;
    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    setTempo(60_000 / average);
  };

  const exportMixdown = async () => {
    if (isExporting) return;
    try {
      setExporting(true);
      const result = await exportProjectMixdown(project);
      setLastExport(result);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: "audio/wav", dialogTitle: "LoopForge 24-Bit Mixdown exportieren", UTI: "com.microsoft.waveform-audio" });
      } else {
        Alert.alert("Mixdown erstellt", result.uri);
      }
    } catch (error) {
      Alert.alert("Mixdown fehlgeschlagen", error instanceof Error ? error.message : "Der Offline-Mixdown konnte nicht erstellt werden.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer className="px-4">
      <View className="pt-3 pb-4"><Text className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase">Performance System</Text><Text className="text-foreground text-2xl font-bold mt-1">Transport & Engine</Text><Text className="text-muted text-xs mt-1">Musikalisches Timing, Session und Audio-Konfiguration</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, gap: 12 }}>
        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Session</Text>
          <TextInput value={project.title} onChangeText={(title) => updateProject((current) => ({ ...current, title }))} className="mt-3 rounded-xl bg-background border border-border px-4 py-3 text-foreground font-semibold" placeholderTextColor="#687076" />
          <View className="flex-row gap-2 mt-3"><TouchableOpacity onPress={() => void saveNow()} className="flex-1 py-3 rounded-xl bg-[#FF9B45] items-center"><Text className="text-[#101218] text-xs font-bold">SESSION SPEICHERN</Text></TouchableOpacity><View className="rounded-xl bg-background px-4 justify-center"><Text className="text-muted text-[9px]">FORMAT</Text><Text className="text-foreground text-xs font-bold">LF v{project.version}</Text></View></View>
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Tempo</Text>
          <View className="flex-row gap-2 mt-3"><View className="flex-1"><ValueControl label="BPM" value={`${project.transport.tempo}`} onDecrease={() => setTempo(project.transport.tempo - 1)} onIncrease={() => setTempo(project.transport.tempo + 1)} /></View><TouchableOpacity onPress={tapTempo} className="w-24 rounded-xl bg-background border border-border items-center justify-center"><Text className="text-[#FF9B45] font-bold text-xs">TAP</Text><Text className="text-muted text-[9px] mt-1">TEMPO</Text></TouchableOpacity></View>
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Launch / Record Quantization</Text><Text className="text-muted text-xs mt-1">Legt fest, an welcher musikalischen Grenze Aufnahme und Szenenwechsel einrasten.</Text>
          <View className="flex-row flex-wrap gap-2 mt-3">{QUANTIZATION.map((value) => <TouchableOpacity key={value} onPress={() => patchTransport("quantization", value)} className="px-4 py-3 rounded-xl" style={{ backgroundColor: project.transport.quantization === value ? "#FF9B45" : "#101218" }}><Text className="text-xs font-bold" style={{ color: project.transport.quantization === value ? "#101218" : "#A8B0C2" }}>{value}</Text></TouchableOpacity>)}</View>
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Feste Loop-Länge</Text><Text className="text-muted text-xs mt-1">Aufnahmen schließen automatisch nach der gewählten Anzahl Takte.</Text>
          <View className="flex-row gap-2 mt-3">{LOOP_BARS.map((value) => <TouchableOpacity key={value} onPress={() => patchTransport("loopBars", value)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: project.transport.loopBars === value ? "#63D8A6" : "#101218" }}><Text className="font-bold" style={{ color: project.transport.loopBars === value ? "#101218" : "#A8B0C2" }}>{value}T</Text></TouchableOpacity>)}</View>
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Count-in & Click</Text>
          <View className="flex-row gap-2 mt-3">{COUNT_IN.map((value) => <TouchableOpacity key={value} onPress={() => patchTransport("countInBars", value)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: project.transport.countInBars === value ? "#76A7FF" : "#101218" }}><Text className="font-bold" style={{ color: project.transport.countInBars === value ? "#101218" : "#A8B0C2" }}>{value === 0 ? "OFF" : `${value}T`}</Text></TouchableOpacity>)}</View>
          <TouchableOpacity onPress={() => patchTransport("metronome", !project.transport.metronome)} className="mt-3 rounded-xl bg-background border border-border p-4 flex-row items-center justify-between"><View><Text className="text-foreground font-semibold">Metronom</Text><Text className="text-muted text-xs mt-1">Accent auf Taktbeginn</Text></View><View className="px-3 py-2 rounded-lg" style={{ backgroundColor: project.transport.metronome ? "#63D8A6" : "#2D3442" }}><Text className="font-bold text-xs" style={{ color: project.transport.metronome ? "#101218" : "#A8B0C2" }}>{project.transport.metronome ? "ON" : "OFF"}</Text></View></TouchableOpacity>
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">24-Bit Offline Mixdown</Text>
          <Text className="text-muted text-xs mt-1 leading-5">Rendert eine komplette musikalische Loop-Runde inklusive Track-EQ, Filter, Delay, Reverb, Master-Gain und Rhythm-Lab als 48 kHz / 24-Bit WAV. Der erste Render-Zyklus dient als FX-Warm-up, exportiert wird der zweite Zyklus.</Text>
          <TouchableOpacity disabled={isExporting} onPress={() => void exportMixdown()} className="mt-3 py-4 rounded-xl bg-[#63D8A6] items-center" style={{ opacity: isExporting ? 0.6 : 1 }}>
            {isExporting ? <ActivityIndicator color="#101218" /> : <Text className="text-[#101218] text-xs font-bold">PRO MIXDOWN RENDERN & TEILEN</Text>}
          </TouchableOpacity>
          {lastExport ? <View className="mt-3 rounded-xl bg-background p-3"><Text className="text-muted text-[9px] font-bold">LETZTER EXPORT</Text><Text className="text-foreground text-xs mt-1">{lastExport.sampleRate / 1000} kHz · {lastExport.bitDepth}-Bit · {(lastExport.sizeBytes / 1024 / 1024).toFixed(1)} MB · Peak {lastExport.peakDb.toFixed(1)} dBFS</Text>{lastExport.appliedSafetyGainDb < 0 ? <Text className="text-[#FFD166] text-[10px] mt-1">Safety Gain: {lastExport.appliedSafetyGainDb.toFixed(1)} dB gegen Integer-Clipping</Text> : null}</View> : null}
        </View>

        <View className="rounded-2xl bg-surface border border-border p-4">
          <Text className="text-foreground font-bold">Native Audio Engine</Text>
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1 rounded-xl bg-background p-3"><Text className="text-muted text-[9px]">STATUS</Text><Text className="text-foreground font-bold mt-1">{engineStatus.status.toUpperCase()}</Text></View>
            <View className="flex-1 rounded-xl bg-background p-3"><Text className="text-muted text-[9px]">SAMPLE RATE</Text><Text className="text-foreground font-bold mt-1">{engineStatus.sampleRate ? `${engineStatus.sampleRate} Hz` : "—"}</Text></View>
          </View>
          <Text className="text-muted text-[11px] mt-3 leading-4">AudioContext-Graph: Gain → 3-Band-EQ → Low-pass → Stereo Pan → Dry + Delay/Feedback + Convolution-Reverb → Master-Analyser → Output. Aufnahme erfolgt über den nativen Recorder und wird als Layer in die Session übernommen.</Text>
          {devices ? <View className="mt-3 rounded-xl bg-background p-3"><Text className="text-muted text-[9px] font-bold">AUDIO ROUTE</Text><Text className="text-foreground text-xs mt-1">{[...(devices.currentInputs ?? []), ...(devices.currentOutputs ?? []), ...(devices.availableOutputs ?? [])].map((item: any) => item.name).filter((name: string, index: number, all: string[]) => name && all.indexOf(name) === index).join(" · ") || "Systemroute"}</Text></View> : null}
          {engineStatus.errorMessage ? <Text className="text-[#FF8B96] text-xs mt-3">{engineStatus.errorMessage}</Text> : null}
        </View>

        <View className="rounded-2xl bg-[#171B22] border border-border p-4">
          <Text className="text-foreground font-bold">Production Roadmap</Text>
          <Text className="text-muted text-xs mt-2 leading-5">Nächste native Ausbaustufe: samplegenaue Record-Grenzen, MIDI Learn / Foot Controller, Ableton Link, USB-Audio Routing, Stem-Export, Time-Stretch/Pitch, Dynamics/Sidechain, waveformgenaue Trim-Punkte und Stage-QA.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
