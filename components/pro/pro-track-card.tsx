import { Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ProLoopTrack } from "@/lib/pro-session";

export function ProTrackCard({ track, onArm, onPlay, onMute, onSolo, onEdit }: {
  track: ProLoopTrack;
  onArm: () => void;
  onPlay: () => void;
  onMute: () => void;
  onSolo: () => void;
  onEdit: () => void;
}) {
  const hasAudio = track.layers.length > 0;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${track.name} auswählen`}
      onPress={onArm}
      onLongPress={onEdit}
      activeOpacity={0.88}
      className="rounded-2xl bg-surface border overflow-hidden"
      style={{ borderColor: track.isArmed ? track.color : "#2D3442" }}
    >
      <View className="p-3 flex-row items-center">
        <View className="w-1.5 h-12 rounded-full mr-3" style={{ backgroundColor: track.color }} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-bold text-base">{track.name}</Text>
            {track.isArmed ? <Text className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ color: track.color, backgroundColor: `${track.color}1F` }}>ARM</Text> : null}
            {track.layers.length > 1 ? <Text className="text-muted text-[10px]">{track.layers.length} Layer</Text> : null}
          </View>
          <Text className="text-muted text-xs mt-1">
            {hasAudio ? `${track.volumeDb.toFixed(0)} dB · Pan ${track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`}` : "Leer · bereit für Aufnahme"}
          </Text>
        </View>
        <View className="flex-row gap-2 items-center">
          {hasAudio ? <>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Solo" onPress={onSolo} className="h-9 w-9 rounded-full items-center justify-center" style={{ backgroundColor: track.isSolo ? "#FFD166" : "#101218" }}>
              <Text className="text-xs font-bold" style={{ color: track.isSolo ? "#101218" : "#A8B0C2" }}>S</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mute" onPress={onMute} className="h-9 w-9 rounded-full items-center justify-center" style={{ backgroundColor: track.isMuted ? "#FF7B7B" : "#101218" }}>
              <Text className="text-xs font-bold" style={{ color: track.isMuted ? "#101218" : "#A8B0C2" }}>M</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={track.isPlaying ? "Stop" : "Play"} onPress={onPlay} className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: track.isPlaying ? track.color : "#2D3442" }}>
              <IconSymbol name={track.isPlaying ? "pause.fill" : "play.fill"} size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </> : <TouchableOpacity accessibilityRole="button" onPress={onEdit} className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: `${track.color}22` }}><IconSymbol name="plus" size={21} color={track.color} /></TouchableOpacity>}
        </View>
      </View>
      {hasAudio ? (
        <View className="h-10 px-3 flex-row items-center gap-1 bg-background/50">
          {Array.from({ length: 28 }, (_, index) => {
            const pseudo = 7 + ((index * 17 + track.id * 11 + track.layers.length * 5) % 23);
            return <View key={index} className="flex-1 items-center"><View className="w-[2px] rounded-full" style={{ height: pseudo, backgroundColor: track.isMuted ? "#687076" : track.color, opacity: 0.82 }} /></View>;
          })}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
