import { describe, expect, it } from "vitest";

import { barsToSeconds, createProject, dbToGain, quantizationToBeats } from "../lib/pro-session";

describe("LoopForge Pro session model", () => {
  it("creates a complete eight-track v2 performance session", () => {
    const project = createProject("Test Set");
    expect(project.version).toBe(2);
    expect(project.title).toBe("Test Set");
    expect(project.tracks).toHaveLength(8);
    expect(new Set(project.tracks.map((track) => track.id)).size).toBe(8);
    expect(project.tracks.filter((track) => track.isArmed)).toHaveLength(1);
    expect(project.beat.steps).toBe(32);
    expect(project.beat.lanes).toHaveLength(5);
    expect(project.scenes).toHaveLength(8);
  });

  it("uses musical bar duration derived from tempo", () => {
    expect(barsToSeconds(4, 120)).toBe(8);
    expect(barsToSeconds(1, 60)).toBe(4);
  });

  it("converts dB to linear gain", () => {
    expect(dbToGain(0)).toBeCloseTo(1, 8);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 2);
    expect(dbToGain(-60)).toBe(0);
  });

  it("maps launch quantization to beats", () => {
    expect(quantizationToBeats("off")).toBe(0);
    expect(quantizationToBeats("1bar")).toBe(4);
    expect(quantizationToBeats("2bar")).toBe(8);
  });
});
