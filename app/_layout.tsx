import "@/global.css";
import "@/lib/_core/nativewind-pressable";
import "react-native-reanimated";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { BeatProvider } from "@/lib/beat-provider";
import { SessionProvider } from "@/lib/session-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { createTRPCClient, trpc } from "@/lib/trpc";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const safeAreaMetrics = useMemo(() => {
    if (!initialWindowMetrics) return undefined;
    return {
      ...initialWindowMetrics,
      insets: {
        ...initialWindowMetrics.insets,
        top: Math.max(initialWindowMetrics.insets.top, 16),
        bottom: Math.max(initialWindowMetrics.insets.bottom, 12),
      },
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <SessionProvider>
                <BeatProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="oauth/callback" />
                  </Stack>
                  <StatusBar style="light" />
                </BeatProvider>
              </SessionProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
