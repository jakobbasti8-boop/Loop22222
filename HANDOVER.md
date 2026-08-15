# LoopForge Pro v2 – Übergabe

## Status

Diese Übergabe ist ein weitreichender Umbau des ursprünglichen LoopForge-MVP auf eine professionelle Session-/Audio-Architektur.

### Implementiert

- Projektformat v2 mit Migration v1 → v2
- 8 Loop-Tracks
- Overdub-Layer
- Undo/Redo-Stack
- Arm/Mute/Solo/Play
- Gain/Pan
- 3-Band EQ
- Low-pass
- Delay/Feedback
- Convolution-Reverb
- Master Gain
- Master RMS/Peak Metering
- 8 Performance-Szenen mit Mix-/FX-Snapshot
- quantisierter Scene Launch
- Count-in
- feste Aufnahme-Längen
- quantisierte Aufnahme
- WAV Recorder
- 16/32-Step Drum-Sequencer
- 5 Drum-Lanes
- Step Velocity
- Swing
- Metronom
- Beat Presets
- Project Library mit Öffnen/Duplizieren/Löschen/Neu
- Autosave + Snapshots
- Audio Engine Status / Sample Rate / Route
- iOS/Android Audio Background-/Foreground-Konfiguration
- Interruption-/Route Observer
- Route-Change Recording Guard mit Invalid-Take-Cleanup
- Wake-Lock im Studio
- 24-Bit/48-kHz Offline-Mixdown inkl. Drum-Sequencer und Track-FX
- Native Share-Funktion für WAV-Export
- Audio-Import über System-Dateipicker mit persistenter Kopie nach Documents/LoopForge/Imports
- native Decode-/Formatvalidierung importierter Loops vor Aufnahme in die Session
- 5 spezialisierte Tabs

## Build

Die App enthält `react-native-audio-api`, also nativen Code. Benötigt wird ein Development Build / nativer Build:

```bash
corepack enable
pnpm install
pnpm preflight
pnpm integrity
pnpm check
pnpm test
pnpm android
```

Expo Go reicht für die native Audio-Engine nicht aus.

## Lockfile

Der alte `pnpm-lock.yaml` wurde bewusst entfernt, weil er die neue native Dependency nicht enthielt. In der Übergabe-Sandbox konnte Corepack `pnpm@9.12.0` wegen `EAI_AGAIN registry.npmjs.org` nicht herunterladen. Ein alter Lockfile würde daher einen falschen reproduzierbaren Build vortäuschen. `pnpm install` muss im ersten Online-Build einen neuen Lockfile erzeugen; danach diesen committen.

## Verifiziert

- `node scripts/preflight.mjs`: PASS
- 8 WAV-Assets mit RIFF/WAVE Header geprüft: PASS
- Root Provider Integration: PASS
- `node scripts/source-integrity.mjs`: 78 TS/TSX-Dateien, 0 ungelöste lokale Imports
- Package/App Version 2.0.0: PASS
- Native Audio Plugin vorhanden: PASS
- 78 TS/TSX-Dateien über TypeScript `transpileModule`: 0 Syntaxfehler
- 24-Bit WAV Encoder Byte-/Header-Selbsttest: PASS

## Nicht in dieser Sandbox verifiziert

- Dependency Resolution
- vollständiger `tsc --noEmit`
- Vitest Suite
- Gradle Android Build
- Xcode/iOS Build
- Mikrofon auf realem Gerät
- tatsächliche Round-Trip-Latenz
- Background Recording unter OEM Power Management

Der Grund ist ausschließlich die fehlende npm-DNS/Registry-Erreichbarkeit des Containers, nicht ein bewusst übersprungener Buildschritt.

## Wichtige technische Grenze der v2

Playback wird auf nativer AudioContext-Zeit geschedult. Recorder Start/Stop läuft noch über asynchrone native Calls, die von der React-Schicht ausgelöst werden. Damit ist die Architektur wesentlich präziser als der frühere JS-Looper, aber noch nicht gleichzusetzen mit einem vollständig samplegenauen C++/Audio-Worklet-Recorder.

Vor einem Store-/Stage-Release sind daher die P0-Punkte in `RESEARCH_AND_ROADMAP.md` abzuarbeiten.

## Native Dependency-Hinweis

`react-native-audio-api` ist auf 0.13.2 gesetzt. LoopForge benutzt keine Audio-Worklet-Nodes, das bestehende Expo-Projekt bringt aber `react-native-worklets` mit. Da in der Sandbox weder CocoaPods noch Gradle samt npm-Dependency-Resolution vollständig ausgeführt werden konnten, muss diese konkrete native Kombination beim ersten Online-Build validiert werden. Ein möglicher Worklets/CMake-/Pods-Konflikt ist ein Build-Risiko, kein als gelöst behaupteter Zustand.
