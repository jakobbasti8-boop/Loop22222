import * as Haptics from "expo-haptics";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type BeatPresetName, useBeatTransport } from "@/lib/beat-provider";
import { useSessionProject } from "@/lib/session-provider";

const PRESETS: BeatPresetName[] = ["Forge Groove", "Boom Bap", "Trap Grid", "House Drive", "Empty"];

export default function BeatScreen() {
  const { project } = useSessionProject();
  const {
    currentStep,
    bar,
    beat,
    isTransportPlaying,
    pattern,
    presetName,
    toggleTransport,
    setTempo,
    setSwing,
    toggleStep,
    cycleStepVelocity,
    toggleLaneMute,
    setLaneVolume,
    setPatternSteps,
    applyPreset,
  } = useBeatTransport();

  const tap = () => Haptics.selectionAsync().catch(() => undefined);

  return (
    <ScreenContainer className="px-4">
      <View className="pt-3 pb-3 flex-row items-end justify-between">
        <View><Text className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase">Rhythm Lab</Text><Text className="text-foreground text-2xl font-bold mt-1">Step Sequencer</Text><Text className="text-muted text-xs mt-1">{pattern.steps} Steps · Velocity · Swing · Native Scheduling</Text></View>
        <TouchableOpacity onPress={() => { tap(); toggleTransport(); }} className="h-12 w-12 rounded-full items-center justify-center" style={{ backgroundColor: isTransportPlaying ? "#63D8A6" : "#2D3442" }}><IconSymbol name={isTransportPlaying ? "pause.fill" : "play.fill"} size={21} color={isTransportPlaying ? "#101218" : "#FFFFFF"} /></TouchableOpacity>
      </View>

      <View className="rounded-2xl bg-surface border border-border p-3 mb-3">
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-xl bg-background p-3"><Text className="text-muted text-[9px] font-bold">TEMPO</Text><Text className="text-foreground font-bold mt-1">{project.transport.tempo} BPM</Text><View className="flex-row gap-2 mt-2"><TouchableOpacity onPress={() => setTempo(project.transport.tempo - 1)} className="flex-1 bg-surface rounded-lg py-2 items-center"><Text className="text-foreground">−</Text></TouchableOpacity><TouchableOpacity onPress={() => setTempo(project.transport.tempo + 1)} className="flex-1 bg-surface rounded-lg py-2 items-center"><Text className="text-foreground">+</Text></TouchableOpacity></View></View>
          <View className="flex-1 rounded-xl bg-background p-3"><Text className="text-muted text-[9px] font-bold">SWING</Text><Text className="text-foreground font-bold mt-1">{Math.round(project.transport.swing * 100)}%</Text><View className="flex-row gap-2 mt-2"><TouchableOpacity onPress={() => setSwing(project.transport.swing - .025)} className="flex-1 bg-surface rounded-lg py-2 items-center"><Text className="text-foreground">−</Text></TouchableOpacity><TouchableOpacity onPress={() => setSwing(project.transport.swing + .025)} className="flex-1 bg-surface rounded-lg py-2 items-center"><Text className="text-foreground">+</Text></TouchableOpacity></View></View>
          <View className="flex-1 rounded-xl bg-background p-3"><Text className="text-muted text-[9px] font-bold">POSITION</Text><Text className="text-foreground font-bold mt-1">{bar}.{beat}</Text><Text className="text-muted text-[10px] mt-3">Step {currentStep + 1}</Text></View>
        </View>
        <View className="flex-row gap-2 mt-2">
          {[16, 32].map((steps) => <TouchableOpacity key={steps} onPress={() => setPatternSteps(steps as 16 | 32)} className="flex-1 py-2.5 rounded-xl items-center" style={{ backgroundColor: pattern.steps === steps ? "#FF9B45" : "#101218" }}><Text className="font-bold text-xs" style={{ color: pattern.steps === steps ? "#101218" : "#A8B0C2" }}>{steps} STEPS</Text></TouchableOpacity>)}
        </View>
      </View>

      <Text className="text-muted text-[10px] mb-2">Tap = Step · Long-Press = Velocity 50 / 75 / 100 / 120%</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View>
          <View className="flex-row mb-1 ml-[110px]">
            {Array.from({ length: pattern.steps }, (_, step) => <View key={step} className="w-8 items-center"><Text className="text-muted text-[8px]">{step % 4 === 0 ? step / 4 + 1 : "·"}</Text></View>)}
          </View>
          {pattern.lanes.map((lane, laneIndex) => (
            <View key={lane.name} className="flex-row items-center mb-2">
              <View className="w-[110px] pr-2 flex-row items-center">
                <TouchableOpacity onPress={() => toggleLaneMute(laneIndex)} className="h-8 w-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: lane.muted ? "#FF7B7B" : "#1A1E27" }}><Text className="text-[9px] font-bold" style={{ color: lane.muted ? "#101218" : lane.color }}>{lane.muted ? "M" : "ON"}</Text></TouchableOpacity>
                <View className="flex-1"><Text className="text-foreground text-[11px] font-semibold" numberOfLines={1}>{lane.name}</Text><Text className="text-muted text-[9px]">{Math.round(lane.volume * 100)}%</Text></View>
              </View>
              {Array.from({ length: pattern.steps }, (_, step) => {
                const activeIndex = lane.active.indexOf(step);
                const active = activeIndex >= 0;
                const velocity = active ? (lane.velocity[activeIndex] ?? 1) : 0;
                return (
                  <TouchableOpacity
                    key={step}
                    onPress={() => { tap(); toggleStep(laneIndex, step); }}
                    onLongPress={() => { if (active) { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); cycleStepVelocity(laneIndex, step); } }}
                    className="w-8 h-9 px-[2px]"
                  >
                    <View className="flex-1 rounded-md border" style={{ backgroundColor: active ? lane.color : step === currentStep && isTransportPlaying ? "#303744" : "#151922", borderColor: step % 4 === 0 ? "#4A5364" : "#282E3A", opacity: active ? Math.max(.42, Math.min(1, velocity / 1.2)) : 1 }} />
                  </TouchableOpacity>
                );
              })}
              <View className="w-20 flex-row pl-2 gap-1"><TouchableOpacity onPress={() => setLaneVolume(laneIndex, lane.volume - .05)} className="h-8 w-8 rounded-lg bg-surface items-center justify-center"><Text className="text-foreground">−</Text></TouchableOpacity><TouchableOpacity onPress={() => setLaneVolume(laneIndex, lane.volume + .05)} className="h-8 w-8 rounded-lg bg-surface items-center justify-center"><Text className="text-foreground">+</Text></TouchableOpacity></View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className="text-foreground font-bold text-sm mb-2">Pattern Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
        {PRESETS.map((preset) => <TouchableOpacity key={preset} onPress={() => { tap(); applyPreset(preset); }} className="px-4 py-3 rounded-xl border" style={{ backgroundColor: presetName === preset ? "#FF9B45" : "#1A1E27", borderColor: presetName === preset ? "#FF9B45" : "#2D3442" }}><Text className="font-semibold text-xs" style={{ color: presetName === preset ? "#101218" : "#DCE2ED" }}>{preset}</Text></TouchableOpacity>)}
      </ScrollView>
    </ScreenContainer>
  );
}
