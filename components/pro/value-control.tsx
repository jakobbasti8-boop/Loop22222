import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  compact?: boolean;
};

export function ValueControl({ label, value, onDecrease, onIncrease, compact = false }: Props) {
  return (
    <View className={`rounded-xl bg-background border border-border ${compact ? "p-2" : "p-3"}`}>
      <Text className="text-muted text-[10px] font-bold tracking-[1px] uppercase">{label}</Text>
      <View className="flex-row items-center justify-between mt-2">
        <TouchableOpacity accessibilityRole="button" onPress={onDecrease} className="h-8 w-8 rounded-lg bg-surface items-center justify-center">
          <Text className="text-foreground text-lg">−</Text>
        </TouchableOpacity>
        <Text className="text-foreground font-bold text-sm mx-2">{value}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onIncrease} className="h-8 w-8 rounded-lg bg-surface items-center justify-center">
          <Text className="text-foreground text-lg">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
