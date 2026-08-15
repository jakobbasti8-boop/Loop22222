import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { createProject, type LoopLayer, type ProLoopProject, type ProLoopTrack } from "@/lib/pro-session";
import { getActiveProjectId, loadProjects, saveProject, saveSnapshot, setActiveProjectId } from "@/lib/session-store";

type SessionContextValue = {
  project: ProLoopProject;
  isLoaded: boolean;
  isDirty: boolean;
  armedTrack: ProLoopTrack;
  updateProject: (updater: (project: ProLoopProject) => ProLoopProject) => void;
  armTrack: (trackId: number) => void;
  addLayer: (trackId: number, layer: LoopLayer) => void;
  undoLayer: (trackId: number) => LoopLayer | null;
  redoLayer: (trackId: number) => LoopLayer | null;
  clearTrack: (trackId: number) => void;
  captureScene: (sceneId: string) => void;
  launchScene: (sceneId: string) => ProLoopTrack[];
  saveNow: () => Promise<void>;
  newProject: () => Promise<void>;
  openProject: (project: ProLoopProject) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [project, setProject] = useState<ProLoopProject>(() => createProject("Neues Projekt"));
  const [isLoaded, setLoaded] = useState(false);
  const [isDirty, setDirty] = useState(false);
  const projectRef = useRef(project);
  const redoRef = useRef(new Map<number, LoopLayer[]>());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadProjects(), getActiveProjectId()]).then(([projects, activeId]) => {
      if (!mounted) return;
      const selected = (activeId ? projects.find((item) => item.id === activeId) : undefined) ?? projects[0] ?? createProject("Neues Projekt");
      projectRef.current = selected;
      setProject(selected);
      setLoaded(true);
      setDirty(false);
    });
    return () => { mounted = false; };
  }, []);

  const updateProject = useCallback((updater: (current: ProLoopProject) => ProLoopProject) => {
    const current = projectRef.current;
    const next = { ...updater(current), updatedAt: new Date().toISOString() };
    projectRef.current = next;
    setProject(next);
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveProject(project).then(() => setDirty(false)).catch(() => undefined);
    }, 1200);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, isLoaded, project]);

  const armTrack = useCallback((trackId: number) => {
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => ({ ...track, isArmed: track.id === trackId })),
    }));
  }, [updateProject]);

  const addLayer = useCallback((trackId: number, layer: LoopLayer) => {
    redoRef.current.delete(trackId);
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? {
        ...track,
        layers: [...track.layers, layer],
        isPlaying: true,
        isMuted: false,
      } : track),
    }));
  }, [updateProject]);

  const undoLayer = useCallback((trackId: number) => {
    let removed: LoopLayer | null = null;
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => {
        if (track.id !== trackId || track.layers.length === 0) return track;
        removed = track.layers[track.layers.length - 1];
        const layers = track.layers.slice(0, -1);
        return { ...track, layers, isPlaying: layers.length > 0 && track.isPlaying };
      }),
    }));
    if (removed) {
      const stack = redoRef.current.get(trackId) ?? [];
      redoRef.current.set(trackId, [...stack, removed]);
    }
    return removed;
  }, [updateProject]);

  const redoLayer = useCallback((trackId: number) => {
    const stack = redoRef.current.get(trackId) ?? [];
    const layer = stack[stack.length - 1] ?? null;
    if (!layer) return null;
    const remaining = stack.slice(0, -1);
    if (remaining.length) redoRef.current.set(trackId, remaining);
    else redoRef.current.delete(trackId);
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? { ...track, layers: [...track.layers, layer], isPlaying: true } : track),
    }));
    return layer;
  }, [updateProject]);

  const clearTrack = useCallback((trackId: number) => {
    redoRef.current.delete(trackId);
    updateProject((current) => ({
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? { ...track, layers: [], isPlaying: false, isMuted: false, isSolo: false } : track),
    }));
  }, [updateProject]);

  const captureScene = useCallback((sceneId: string) => {
    updateProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => scene.id === sceneId ? {
        ...scene,
        tracks: current.tracks.map((track) => ({
          trackId: track.id,
          isPlaying: track.isPlaying,
          isMuted: track.isMuted,
          isSolo: track.isSolo,
          volumeDb: track.volumeDb,
          pan: track.pan,
          fx: { ...track.fx },
        })),
      } : scene),
    }));
  }, [updateProject]);

  const launchScene = useCallback((sceneId: string) => {
    let launched: ProLoopTrack[] = [];
    updateProject((current) => {
      const scene = current.scenes.find((item) => item.id === sceneId);
      if (!scene || scene.tracks.length === 0) return current;
      const tracks = current.tracks.map((track) => {
        const state = scene.tracks.find((item) => item.trackId === track.id);
        return state ? {
          ...track,
          isPlaying: state.isPlaying && track.layers.length > 0,
          isMuted: state.isMuted,
          isSolo: state.isSolo ?? track.isSolo,
          volumeDb: state.volumeDb ?? track.volumeDb,
          pan: state.pan ?? track.pan,
          fx: state.fx ? { ...track.fx, ...state.fx } : track.fx,
        } : track;
      });
      launched = tracks;
      return { ...current, tracks };
    });
    return launched;
  }, [updateProject]);

  const saveNow = useCallback(async () => {
    const stamped = await saveProject(project);
    await setActiveProjectId(stamped.id);
    projectRef.current = stamped;
    setProject(stamped);
    setDirty(false);
  }, [project]);

  const newProject = useCallback(async () => {
    if (isDirty && project.tracks.some((track) => track.layers.length > 0)) {
      await saveSnapshot(project).catch(() => undefined);
    }
    const next = createProject();
    await saveProject(next);
    await setActiveProjectId(next.id);
    redoRef.current.clear();
    projectRef.current = next;
    setProject(next);
    setDirty(false);
  }, [isDirty, project]);

  const openProject = useCallback(async (next: ProLoopProject) => {
    if (isDirty) await saveProject(project).catch(() => undefined);
    await setActiveProjectId(next.id);
    redoRef.current.clear();
    projectRef.current = next;
    setProject(next);
    setDirty(false);
  }, [isDirty, project]);

  const armedTrack = useMemo(() => project.tracks.find((track) => track.isArmed) ?? project.tracks[0], [project.tracks]);

  return (
    <SessionContext.Provider value={{ project, isLoaded, isDirty, armedTrack, updateProject, armTrack, addLayer, undoLayer, redoLayer, clearTrack, captureScene, launchScene, saveNow, newProject, openProject }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionProject() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSessionProject muss innerhalb von SessionProvider verwendet werden.");
  return value;
}
