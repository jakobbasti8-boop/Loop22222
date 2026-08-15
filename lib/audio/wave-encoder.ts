export type AudioBufferLike = {
  numberOfChannels: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

export function measurePeak(buffer: AudioBufferLike, startFrame: number, frameCount: number) {
  let peak = 0;
  const channels = Math.max(1, buffer.numberOfChannels ?? 1);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);
    const end = Math.min(data.length, startFrame + frameCount);
    for (let i = startFrame; i < end; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  }
  return peak;
}

export function encode24BitWave(buffer: AudioBufferLike, startFrame: number, frameCount: number, safetyGain = 1) {
  const inputChannels = Math.min(2, Math.max(1, buffer.numberOfChannels ?? 1));
  const outputChannels = 2;
  const bytesPerSample = 3;
  const blockAlign = outputChannels * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, outputChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 24, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  const left = buffer.getChannelData(0);
  const right = inputChannels > 1 ? buffer.getChannelData(1) : left;
  let offset = 44;
  const writeSample = (sample: number) => {
    const clipped = Math.max(-1, Math.min(1, sample * safetyGain));
    const value = clipped < 0 ? Math.round(clipped * 0x800000) : Math.round(clipped * 0x7fffff);
    view.setUint8(offset, value & 0xff);
    view.setUint8(offset + 1, (value >> 8) & 0xff);
    view.setUint8(offset + 2, (value >> 16) & 0xff);
    offset += 3;
  };

  for (let frame = 0; frame < frameCount; frame += 1) {
    const sourceFrame = startFrame + frame;
    writeSample(left[sourceFrame] ?? 0);
    writeSample(right[sourceFrame] ?? 0);
  }
  return bytes;
}
