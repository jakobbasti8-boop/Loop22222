import { TouchableOpacity, View, Text } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export type StudioTrack = {
  audioUri?: string;
  id: number;
  name: string;
  color: string;
  waveform: number[];
  isArmed: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  hasAudio: boolean;
};

type TrackCardProps = {
  track: StudioTrack;
  onSelect: () => void;
  onPlay: () => void;
  onMute: () => void;
};

export function TrackCard({ track, onSelect, onPlay, onMute }: TrackCardProps) {
  const label = track.hasAudio ? track.name : "Leere Spur";
  const status = track.isArmed ? "Bereit zur Aufnahme" : track.hasAudio ? "Loop aufgenommen" : "Antippen zum Auswählen";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${status}`}
      activeOpacity={0.82}
      onPress={onSelect}
      className="rounded-2xl bg-surface border border-border overflow-hidden"
      style={track.isArmed ? { borderColor: track.color, borderWidth: 1.5 } : undefined}
    >
      <View className="flex-row items-center px-4 py-3">
        <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${track.color}26` }}>
          <Text className="font-bold text-sm" style={{ color: track.color }}>{track.id}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-semibold text-[15px]">{label}</Text>
            {track.hasAudio ? <View className="w-1.5 h-1.5 rounded-full bg-success" /> : null}
          </View>
          <Text className="text-muted text-xs mt-0.5">{status}</Text>
        </View>
        {track.hasAudio ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={track.isMuted ? "Spur hörbar schalten" : "Spur stummschalten"}
              onPress={onMute}
              className="h-9 w-9 rounded-full bg-background items-center justify-center"
            >
              <Text className="text-muted text-xs font-bold">{track.isMuted ? "M" : "S"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={track.isPlaying ? "Wiedergabe pausieren" : "Spur wiedergeben"}
              onPress={onPlay}
              className="h-9 w-9 rounded-full items-center justify-center"
              style={{ backgroundColor: track.isPlaying ? track.color : "#2D3442" }}
            >
              <IconSymbol name={track.isPlaying ? "pause.fill" : "play.fill"} size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="h-9 w-9 rounded-full items-center justify-center" style={{ backgroundColor: `${track.color}26` }}>
            <IconSymbol name="plus" size={20} color={track.color} />
          </View>
        )}
      </View>

      {track.hasAudio ? (
        <View className="h-11 flex-row items-center px-4 gap-1.5 bg-background/50">
          {track.waveform.map((height, index) => (
            <View key={`${track.id}-${index}`} className="flex-1 items-center justify-center h-full">
              <View className="w-1 rounded-full" style={{ height, backgroundColor: track.isMuted ? "#687076" : track.color, opacity: 0.9 }} />
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
