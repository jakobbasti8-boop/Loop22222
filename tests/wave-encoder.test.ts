import { describe, expect, it } from "vitest";

import { encode24BitWave, measurePeak } from "../lib/audio/wave-encoder";

const buffer = {
  numberOfChannels: 1,
  sampleRate: 48_000,
  getChannelData: () => new Float32Array([0, 0.5, -0.5, 1]),
};

describe("24-bit WAV encoder", () => {
  it("writes a valid stereo PCM WAV header", () => {
    const bytes = encode24BitWave(buffer, 0, 4);
    const text = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
    const view = new DataView(bytes.buffer);
    expect(text(0, 4)).toBe("RIFF");
    expect(text(8, 4)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(48_000);
    expect(view.getUint16(34, true)).toBe(24);
    expect(bytes.byteLength).toBe(44 + 4 * 2 * 3);
  });

  it("measures peak amplitude over the requested frame range", () => {
    expect(measurePeak(buffer, 0, 3)).toBeCloseTo(0.5);
    expect(measurePeak(buffer, 0, 4)).toBeCloseTo(1);
  });
});
