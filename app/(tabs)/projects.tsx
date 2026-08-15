import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ProLoopProject } from "@/lib/pro-session";
import { useSessionProject } from "@/lib/session-provider";
import { deleteProject, duplicateProject, loadProjects } from "@/lib/session-store";

function projectStats(project: ProLoopProject) {
  const usedTracks = project.tracks.filter((track) => track.layers.length > 0).length;
  const layers = project.tracks.reduce((sum, track) => sum + track.layers.length, 0);
  return { usedTracks, layers };
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { project: activeProject, newProject, openProject } = useSessionProject();
  const [projects, setProjects] = useState<ProLoopProject[]>([]);

  const refresh = useCallback(() => { void loadProjects().then(setProjects); }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const createNew = async () => {
    await newProject();
    refresh();
    router.replace("/");
  };

  const open = async (item: ProLoopProject) => {
    await openProject(item);
    router.replace("/");
  };

  const duplicate = async (item: ProLoopProject) => {
    await duplicateProject(item);
    refresh();
  };

  const remove = (item: ProLoopProject) => {
    Alert.alert("Projekt löschen?", `„${item.title}“ wird aus der Projektliste entfernt. Audio-Dateien werden dabei nicht aktiv vom Dateisystem bereinigt.`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", style: "destructive", onPress: () => { void deleteProject(item.id).then(refresh); } },
    ]);
  };

  return (
    <ScreenContainer className="px-4">
      <View className="pt-3 pb-4 flex-row items-end justify-between">
        <View><Text className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase">Session Library</Text><Text className="text-foreground text-2xl font-bold mt-1">Projekte</Text><Text className="text-muted text-xs mt-1">Versionierte LoopForge-v2 Sessions</Text></View>
        <TouchableOpacity onPress={() => void createNew()} className="h-11 px-4 rounded-xl bg-[#FF9B45] flex-row items-center gap-2"><IconSymbol name="plus" size={18} color="#101218" /><Text className="text-[#101218] font-bold text-xs">NEU</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, gap: 10 }}>
        {projects.length === 0 ? (
          <View className="rounded-2xl border border-border bg-surface p-6 items-center"><IconSymbol name="folder.fill" size={30} color="#687076" /><Text className="text-foreground font-bold mt-3">Noch keine gespeicherten Sessions</Text><Text className="text-muted text-xs text-center mt-2">Die aktive Session wird automatisch gespeichert, sobald du Änderungen machst.</Text></View>
        ) : projects.map((item) => {
          const stats = projectStats(item);
          const active = item.id === activeProject.id;
          return (
            <View key={item.id} className="rounded-2xl bg-surface border p-4" style={{ borderColor: active ? "#FF9B45" : "#2D3442" }}>
              <TouchableOpacity onPress={() => void open(item)}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2"><Text className="text-foreground font-bold text-lg" numberOfLines={1}>{item.title}</Text>{active ? <Text className="text-[#FF9B45] text-[9px] font-bold">AKTIV</Text> : null}</View>
                    <Text className="text-muted text-[11px] mt-1">{new Date(item.updatedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                  <View className="rounded-xl bg-background px-3 py-2"><Text className="text-muted text-[9px]">TEMPO</Text><Text className="text-foreground font-bold text-sm">{item.transport.tempo}</Text></View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <View className="flex-1 rounded-xl bg-background p-2"><Text className="text-muted text-[9px]">TRACKS</Text><Text className="text-foreground font-semibold mt-1">{stats.usedTracks}/8</Text></View>
                  <View className="flex-1 rounded-xl bg-background p-2"><Text className="text-muted text-[9px]">LAYER</Text><Text className="text-foreground font-semibold mt-1">{stats.layers}</Text></View>
                  <View className="flex-1 rounded-xl bg-background p-2"><Text className="text-muted text-[9px]">LOOP</Text><Text className="text-foreground font-semibold mt-1">{item.transport.loopBars} T</Text></View>
                  <View className="flex-1 rounded-xl bg-background p-2"><Text className="text-muted text-[9px]">BEAT</Text><Text className="text-foreground font-semibold mt-1">{item.beat.steps} Step</Text></View>
                </View>
              </TouchableOpacity>
              <View className="flex-row gap-2 mt-3 pt-3 border-t border-border">
                <TouchableOpacity onPress={() => void open(item)} className="flex-1 py-2.5 rounded-xl bg-background items-center"><Text className="text-foreground text-xs font-semibold">ÖFFNEN</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => void duplicate(item)} className="flex-1 py-2.5 rounded-xl bg-background items-center"><Text className="text-foreground text-xs font-semibold">DUPLIZIEREN</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item)} className="px-4 py-2.5 rounded-xl bg-[#3A2024] items-center"><IconSymbol name="trash.fill" size={16} color="#FF8B96" /></TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}
