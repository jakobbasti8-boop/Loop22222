import { useCallback, useEffect, useRef, useState } from "react";

import { proAudioEngine } from "@/lib/audio/pro-audio-engine";
import type { ProLoopProject, ProLoopTrack } from "@/lib/pro-session";

let globallyLoadedProjectId: string | null = null;

export function useProLoopEngine(project: ProLoopProject) {
  const [isRecording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void proAudioEngine.ensureReady().then(async () => {
      await proAudioEngine.setMasterVolume(project.master.volumeDb);
      await proAudioEngine.applyProjectMix(project.tracks);
      if (globallyLoadedProjectId !== project.id) {
        globallyLoadedProjectId = project.id;
        await proAudioEngine.playTracksSynchronized(project.tracks, project.transport.tempo, project.transport.loopBars);
      }
    }).catch((error) => setAudioError(error instanceof Error ? error.message : "Audio Engine konnte nicht initialisiert werden."));
  }, [project.id]);

  useEffect(() => {
    void proAudioEngine.setMasterVolume(project.master.volumeDb).catch(() => undefined);
    void proAudioEngine.applyProjectMix(project.tracks).catch(() => undefined);
  }, [project.master.volumeDb, project.tracks]);

  const beginRecording = useCallback(async (trackId: number) => {
    try {
      setAudioError(null);
      await proAudioEngine.beginRecording(trackId);
      setRecording(true);
      setRecordingSeconds(0);
      const started = Date.now();
      timerRef.current = setInterval(() => setRecordingSeconds(Math.floor((Date.now() - started) / 1000)), 200);
      return true;
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : "Aufnahme konnte nicht gestartet werden.");
      return false;
    }
  }, []);

  const finishRecording = useCallback(async () => {
    try {
      const result = await proAudioEngine.finishRecording();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return result;
    } catch (error) {
      setRecording(false);
      setAudioError(error instanceof Error ? error.message : "Aufnahme konnte nicht beendet werden.");
      return null;
    }
  }, []);

  const playTrack = useCallback((track: ProLoopTrack) => proAudioEngine.playTrack(track, project.transport.tempo, project.transport.loopBars), [project.transport.loopBars, project.transport.tempo]);
  const stopTrack = useCallback((trackId: number) => proAudioEngine.stopTrack(trackId), []);
  const reloadTrack = useCallback((track: ProLoopTrack) => proAudioEngine.loadTrack(track, project.transport.tempo, project.transport.loopBars, track.isPlaying), [project.transport.loopBars, project.transport.tempo]);
  const clearAudioTrack = useCallback((trackId: number) => proAudioEngine.clearTrack(trackId), []);
  const playTracksSynchronized = useCallback((tracks: ProLoopTrack[]) => proAudioEngine.playTracksSynchronized(tracks, project.transport.tempo, project.transport.loopBars), [project.transport.loopBars, project.transport.tempo]);
  const getMasterMeter = useCallback(() => proAudioEngine.getMasterMeter(), []);

  return {
    audioError,
    beginRecording,
    clearAudioTrack,
    finishRecording,
    getMasterMeter,
    isRecording,
    playTrack,
    recordingSeconds,
    reloadTrack,
    playTracksSynchronized,
    stopTrack,
    engineStatus: proAudioEngine.getStatus(),
  };
}
