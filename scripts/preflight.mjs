import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const failures = [];
const required = [
  "app/(tabs)/index.tsx",
  "app/(tabs)/mixer.tsx",
  "app/(tabs)/beat.tsx",
  "app/(tabs)/projects.tsx",
  "app/(tabs)/setup.tsx",
  "lib/audio/pro-audio-engine.ts",
  "lib/audio/export-mixdown.ts",
  "lib/audio/import-loop.ts",
  "lib/audio/wave-encoder.ts",
  "lib/pro-session.ts",
  "lib/session-provider.tsx",
  "lib/beat-provider.tsx",
  "assets/audio/kick.wav",
  "assets/audio/snare.wav",
  "assets/audio/hihat.wav",
  "assets/audio/openhat.wav",
  "assets/audio/clap.wav",
  "assets/audio/click.wav",
  "assets/audio/click_accent.wav",
  "assets/audio/reverb_ir.wav",
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`Fehlt: ${relative}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.version !== "2.0.0") failures.push(`package.json Version ist ${pkg.version}, erwartet 2.0.0`);
if (!pkg.dependencies?.["react-native-audio-api"]) failures.push("react-native-audio-api fehlt in dependencies");
if (!pkg.dependencies?.["expo-sharing"]) failures.push("expo-sharing fehlt für WAV-Export in dependencies");
if (!pkg.dependencies?.["expo-document-picker"]) failures.push("expo-document-picker fehlt für Audio-Import in dependencies");

const appConfig = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
if (!appConfig.includes('"react-native-audio-api"')) failures.push("Expo Audio API Plugin fehlt in app.config.ts");
if (!appConfig.includes('androidFSTypes: ["mediaPlayback", "microphone"]')) failures.push("Foreground-Service-Typen fehlen");

const rootLayout = fs.readFileSync(path.join(root, "app/_layout.tsx"), "utf8");
if (!rootLayout.includes("<SessionProvider>") || !rootLayout.includes("<BeatProvider>")) failures.push("Session-/Beat-Provider sind nicht im Root eingebunden");

const sessionModel = fs.readFileSync(path.join(root, "lib/pro-session.ts"), "utf8");
if (!sessionModel.includes('version: 2')) failures.push("Session-Schema v2 fehlt");
if (!sessionModel.includes('"Spur 8"')) failures.push("8-Spur-Default fehlt");
if (!sessionModel.includes('scene-h')) failures.push("8 Performance-Szenen fehlen");

const engine = fs.readFileSync(path.join(root, "lib/audio/pro-audio-engine.ts"), "utf8");
if (!engine.includes("createAnalyser")) failures.push("Master-Analyser/Metering fehlt");
if (!engine.includes("routeChangedDuringRecording")) failures.push("Route-Change Recording Guard fehlt");

const exporter = fs.readFileSync(path.join(root, "lib/audio/export-mixdown.ts"), "utf8");
if (!exporter.includes("OfflineAudioContext") || !exporter.includes("encode24BitWave")) failures.push("24-Bit Offline-Mixdown fehlt");

for (const relative of required.filter((file) => file.endsWith(".wav"))) {
  const file = fs.readFileSync(path.join(root, relative));
  if (file.subarray(0, 4).toString("ascii") !== "RIFF" || file.subarray(8, 12).toString("ascii") !== "WAVE") {
    failures.push(`Ungültiges WAV: ${relative}`);
  }
}

if (failures.length) {
  console.error("LoopForge Preflight FEHLER");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("LoopForge Pro v2 Preflight OK");
console.log(`Audio assets: ${required.filter((file) => file.endsWith(".wav")).length}`);
console.log("Session v2, 8 Tracks, 8 Scenes, 5 Tabs, Import, Master Metering, 24-Bit Offline Export: OK");
