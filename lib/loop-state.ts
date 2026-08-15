export type LoopTrackState = {
  hasAudio: boolean;
  id: number;
  isArmed: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  waveform: number[];
};

export const recordedWaveform = [14, 24, 31, 17, 36, 22, 28, 18, 34, 21, 37, 16, 29, 23, 33, 18];

export function armTrack<T extends LoopTrackState>(tracks: T[], trackId: number): T[] {
  return tracks.map((track) => ({ ...track, isArmed: track.id === trackId }));
}

export function completeTrackRecording<T extends LoopTrackState>(tracks: T[], trackId: number): T[] {
  return tracks.map((track) => track.id === trackId ? {
    ...track,
    hasAudio: true,
    isMuted: false,
    isPlaying: true,
    waveform: recordedWaveform,
  } : track);
}

export function toggleTrackMuted<T extends LoopTrackState>(tracks: T[], trackId: number): T[] {
  return tracks.map((track) => track.id === trackId ? { ...track, isMuted: !track.isMuted } : track);
}

export function toggleTrackPlayback<T extends LoopTrackState>(tracks: T[], trackId: number): T[] {
  return tracks.map((track) => track.id === trackId ? { ...track, isPlaying: !track.isPlaying } : track);
}

export function togglePatternStep(steps: number[], step: number): number[] {
  return steps.includes(step) ? steps.filter((value) => value !== step) : [...steps, step].sort((a, b) => a - b);
}
