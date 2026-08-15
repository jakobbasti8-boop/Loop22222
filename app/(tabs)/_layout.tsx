import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 9, fontWeight: "600" },
        tabBarStyle: {
          paddingTop: 7,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Studio", tabBarIcon: ({ color }) => <IconSymbol size={23} name="waveform" color={color} /> }} />
      <Tabs.Screen name="mixer" options={{ title: "Mixer", tabBarIcon: ({ color }) => <IconSymbol size={23} name="slider.horizontal.3" color={color} /> }} />
      <Tabs.Screen name="beat" options={{ title: "Rhythm", tabBarIcon: ({ color }) => <IconSymbol size={23} name="circle.grid.2x2.fill" color={color} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color }) => <IconSymbol size={23} name="folder.fill" color={color} /> }} />
      <Tabs.Screen name="setup" options={{ title: "System", tabBarIcon: ({ color }) => <IconSymbol size={23} name="gearshape.fill" color={color} /> }} />
    </Tabs>
  );
}
