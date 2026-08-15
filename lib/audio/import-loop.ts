import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";

import { proAudioEngine } from "@/lib/audio/pro-audio-engine";
import type { LoopLayer } from "@/lib/pro-session";

export type ImportedLoop = {
  layer: LoopLayer;
  fileName: string;
  sampleRate: number;
  channels: number;
  sizeBytes: number | null;
};

function safeName(name: string) {
  const extensionMatch = name.match(/\.[a-zA-Z0-9]{2,5}$/);
  const extension = extensionMatch?.[0]?.toLowerCase() ?? ".wav";
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 52) || "import";
  return `${base}-${Date.now()}${extension}`;
}

export async function pickAndImportLoop(): Promise<ImportedLoop | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "audio/*",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const importsDirectory = new Directory(Paths.document, "LoopForge", "Imports");
  importsDirectory.create({ idempotent: true, intermediates: true });
  const destination = new File(importsDirectory, safeName(asset.name));
  const source = new File(asset.uri);
  source.copy(destination);

  try {
    const info = await proAudioEngine.inspectAudio(destination.uri);
    if (!Number.isFinite(info.durationSeconds) || info.durationSeconds <= 0) throw new Error("Die Audiodatei enthält keine dekodierbare Länge.");
    return {
      layer: {
        id: `import-${Date.now()}`,
        uri: destination.uri,
        durationSeconds: info.durationSeconds,
        createdAt: new Date().toISOString(),
      },
      fileName: asset.name,
      sampleRate: info.sampleRate,
      channels: info.channels,
      sizeBytes: asset.size ?? null,
    };
  } catch (error) {
    try { if (destination.exists) destination.delete(); } catch { /* best-effort cleanup */ }
    throw new Error(error instanceof Error ? `Audio-Import nicht kompatibel: ${error.message}` : "Audio-Import konnte nicht dekodiert werden.");
  }
}
