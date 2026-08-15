import { describe, expect, it } from "vitest";

import {
  armTrack,
  completeTrackRecording,
  recordedWaveform,
  togglePatternStep,
  toggleTrackMuted,
  toggleTrackPlayback,
} from "../lib/loop-state";

const tracks = [
  { id: 1, hasAudio: false, isArmed: true, isMuted: false, isPlaying: false, waveform: [] },
  { id: 2, hasAudio: false, isArmed: false, isMuted: false, isPlaying: false, waveform: [] },
];

describe("Loopstation-Zustand", () => {
  it("schaltet genau eine ausgewählte Spur aufnahmebereit", () => {
    const updated = armTrack(tracks, 2);

    expect(updated.map((track) => track.isArmed)).toEqual([false, true]);
  });

  it("markiert eine fertig aufgenommene Spur als abspielbaren Loop", () => {
    const updated = completeTrackRecording(tracks, 2);

    expect(updated[1]).toMatchObject({ hasAudio: true, isMuted: false, isPlaying: true });
    expect(updated[1]?.waveform).toEqual(recordedWaveform);
    expect(updated[0]).toEqual(tracks[0]);
  });

  it("kann Wiedergabe und Stummschaltung einer einzelnen Spur unabhängig umschalten", () => {
    const recorded = completeTrackRecording(tracks, 1);
    const playing = toggleTrackPlayback(recorded, 1);
    const muted = toggleTrackMuted(playing, 1);

    expect(muted[0]).toMatchObject({ isPlaying: false, isMuted: true });
    expect(muted[1]).toEqual(tracks[1]);
  });
});

describe("16-Step-Beat-Editor", () => {
  it("fügt Steps sortiert hinzu und entfernt sie beim erneuten Antippen", () => {
    const withStep = togglePatternStep([0, 8, 12], 4);
    const withoutStep = togglePatternStep(withStep, 8);

    expect(withStep).toEqual([0, 4, 8, 12]);
    expect(withoutStep).toEqual([0, 4, 12]);
  });
});
