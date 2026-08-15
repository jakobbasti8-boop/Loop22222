import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

type LoopPlayer = ReturnType<typeof createAudioPlayer>;

function persistRecording(uri: string, trackId: number) {
  if (Platform.OS === "web") return uri;
  const extension = uri.match(/\.[a-z0-9]+(?:$|\?)/i)?.[0] ?? ".m4a";
  const recordingDirectory = new Directory(Paths.document, "loopforge-recordings");
  recordingDirectory.create({ idempotent: true, intermediates: true });
  const storedFile = new File(recordingDirectory, `track-${trackId}-${Date.now()}${extension}`);
  new File(uri).copy(storedFile);
  return storedFile.uri;
}

export function useLoopRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const playersRef = useRef(new Map<number, LoopPlayer>());
  const [recordingTrackId, setRecordingTrackId] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => undefined);

    return () => {
      playersRef.current.forEach((player) => player.remove());
      playersRef.current.clear();
    };
  }, []);

  const beginRecording = useCallback(async (trackId: number) => {
    try {
      setAudioError(null);
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setAudioError("Für die Aufnahme wird der Zugriff auf das Mikrofon benötigt.");
        return false;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingTrackId(trackId);
      return true;
    } catch {
      setAudioError("Die Aufnahme konnte nicht gestartet werden. Bitte versuche es erneut.");
      return false;
    }
  }, [recorder]);

  const finishRecording = useCallback(async () => {
    const targetTrackId = recordingTrackId;
    if (targetTrackId === null) return null;

    try {
      await recorder.stop();
      const uri = recorder.uri;
      setRecordingTrackId(null);
      if (!uri) {
        setAudioError("Die Aufnahme enthält noch keine Audiodatei.");
        return null;
      }

      const persistentUri = persistRecording(uri, targetTrackId);
      const previousPlayer = playersRef.current.get(targetTrackId);
      previousPlayer?.remove();

      const player = createAudioPlayer(persistentUri, { updateInterval: 250 });
      player.loop = true;
      player.volume = 0.82;
      player.play();
      playersRef.current.set(targetTrackId, player);
      return { trackId: targetTrackId, uri: persistentUri };
    } catch {
      setRecordingTrackId(null);
      setAudioError("Die Aufnahme konnte nicht abgeschlossen werden.");
      return null;
    }
  }, [recorder, recordingTrackId]);

  const setTrackPlayback = useCallback((trackId: number, shouldPlay: boolean) => {
    const player = playersRef.current.get(trackId);
    if (!player) return false;
    if (shouldPlay) {
      void player.seekTo(0).catch(() => undefined);
      player.play();
    } else {
      player.pause();
    }
    return true;
  }, []);

  const restoreTrack = useCallback((trackId: number, uri: string, muted: boolean) => {
    try {
      const previousPlayer = playersRef.current.get(trackId);
      previousPlayer?.remove();
      const player = createAudioPlayer(uri, { updateInterval: 250 });
      player.loop = true;
      player.volume = 0.82;
      player.muted = muted;
      player.play();
      playersRef.current.set(trackId, player);
      return true;
    } catch {
      setAudioError("Eine gespeicherte Spur konnte nicht geladen werden.");
      return false;
    }
  }, []);

  const setTrackMuted = useCallback((trackId: number, muted: boolean) => {
    const player = playersRef.current.get(trackId);
    if (!player) return false;
    player.muted = muted;
    return true;
  }, []);

  const stopAllTracks = useCallback(() => {
    playersRef.current.forEach((player) => player.pause());
  }, []);

  return {
    audioError,
    beginRecording,
    finishRecording,
    isRecording: recorderState.isRecording,
    recordingDurationSeconds: Math.floor((recorderState.durationMillis ?? 0) / 1000),
    recordingTrackId,
    restoreTrack,
    setTrackMuted,
    setTrackPlayback,
    stopAllTracks,
  };
}
