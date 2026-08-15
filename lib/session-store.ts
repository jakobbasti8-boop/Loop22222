import AsyncStorage from "@react-native-async-storage/async-storage";
import { createProject, type ProLoopProject } from "@/lib/pro-session";

export type SavedLoopProject = ProLoopProject;

type LegacyTrack = {
  audioUri?: string;
  color: string;
  hasAudio: boolean;
  id: number;
  isMuted: boolean;
  name: string;
};

type LegacyProject = {
  id: string;
  tempo: number;
  title: string;
  tracks: LegacyTrack[];
  updatedAt: string;
};

const STORAGE_KEY_V2 = "loopforge.projects.v2";
const STORAGE_KEY_V1 = "loopforge.projects.v1";
const ACTIVE_PROJECT_KEY = "loopforge.active-project.v2";
const LEGACY_ACTIVE_PROJECT_KEY = "loopforge.active-project.v1";
const SNAPSHOT_KEY = "loopforge.snapshots.v2";

function migrateLegacy(project: LegacyProject): ProLoopProject {
  const next = createProject(project.title);
  next.id = project.id;
  next.createdAt = project.updatedAt;
  next.updatedAt = project.updatedAt;
  next.transport.tempo = project.tempo;
  next.tracks = next.tracks.map((track) => {
    const old = project.tracks.find((item) => item.id === track.id);
    if (!old) return track;
    return {
      ...track,
      name: old.name,
      color: old.color || track.color,
      isMuted: old.isMuted,
      isPlaying: Boolean(old.audioUri),
      layers: old.audioUri ? [{ id: `migrated-${track.id}`, uri: old.audioUri, createdAt: project.updatedAt }] : [],
    };
  });
  return next;
}

function normalizeProject(project: ProLoopProject): ProLoopProject {
  const defaults = createProject(project.title);
  return {
    ...defaults,
    ...project,
    version: 2,
    transport: { ...defaults.transport, ...(project.transport ?? {}) },
    master: { ...defaults.master, ...(project.master ?? {}) },
    tracks: defaults.tracks.map((defaultTrack) => {
      const track = project.tracks?.find((item) => item.id === defaultTrack.id);
      if (!track) return defaultTrack;
      return { ...defaultTrack, ...track, fx: { ...defaultTrack.fx, ...(track.fx ?? {}) }, layers: track.layers ?? [] };
    }),
    beat: {
      ...defaults.beat,
      ...(project.beat ?? {}),
      lanes: defaults.beat.lanes.map((defaultLane) => {
        const lane = project.beat?.lanes?.find((item) => item.name === defaultLane.name);
        return lane ? { ...defaultLane, ...lane, active: lane.active ?? [], velocity: lane.velocity ?? [] } : defaultLane;
      }),
    },
    scenes: defaults.scenes.map((defaultScene) => {
      const scene = project.scenes?.find((item) => item.id === defaultScene.id);
      return scene ? { ...defaultScene, ...scene, tracks: (scene.tracks ?? []).map((state) => ({ ...state, fx: state.fx ? { ...state.fx } : undefined })) } : defaultScene;
    }),
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function loadProjects(): Promise<ProLoopProject[]> {
  const current = await readJson<ProLoopProject[]>(STORAGE_KEY_V2, []);
  if (Array.isArray(current) && current.length > 0) return current.map(normalizeProject);

  const legacy = await readJson<LegacyProject[]>(STORAGE_KEY_V1, []);
  if (!Array.isArray(legacy) || legacy.length === 0) return [];
  const migrated = legacy.map(migrateLegacy);
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
  return migrated;
}

export async function saveProject(project: ProLoopProject) {
  const existing = await loadProjects();
  const stamped = { ...project, updatedAt: new Date().toISOString() };
  const next = [stamped, ...existing.filter((item) => item.id !== project.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  return stamped;
}

export async function deleteProject(projectId: string) {
  const existing = await loadProjects();
  await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(existing.filter((item) => item.id !== projectId)));
  const activeId = await getActiveProjectId();
  if (activeId === projectId) await setActiveProjectId(null);
}

export async function duplicateProject(project: ProLoopProject) {
  const now = new Date().toISOString();
  const clone: ProLoopProject = {
    ...project,
    id: `project-${Date.now()}`,
    title: `${project.title} Kopie`,
    createdAt: now,
    updatedAt: now,
    tracks: project.tracks.map((track) => ({ ...track, layers: track.layers.map((layer) => ({ ...layer })) })),
    beat: { ...project.beat, lanes: project.beat.lanes.map((lane) => ({ ...lane, active: [...lane.active], velocity: [...lane.velocity] })) },
    scenes: project.scenes.map((scene) => ({ ...scene, tracks: scene.tracks.map((item) => ({ ...item, fx: item.fx ? { ...item.fx } : undefined })) })),
  };
  await saveProject(clone);
  return clone;
}

export async function getActiveProjectId() {
  return (await AsyncStorage.getItem(ACTIVE_PROJECT_KEY)) ?? (await AsyncStorage.getItem(LEGACY_ACTIVE_PROJECT_KEY));
}

export async function setActiveProjectId(projectId: string | null) {
  if (projectId) await AsyncStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  else await AsyncStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function createEmptyProject(): ProLoopProject {
  return createProject();
}

export async function saveSnapshot(project: ProLoopProject) {
  const snapshots = await readJson<ProLoopProject[]>(SNAPSHOT_KEY, []);
  const stamped = { ...project, id: `${project.id}-snapshot-${Date.now()}`, updatedAt: new Date().toISOString() };
  const next = [stamped, ...snapshots].slice(0, 12);
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
}
