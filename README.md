# LoopForge Pro v2

LoopForge Pro ist eine mobile Multitrack-Loopstation auf Expo/React Native mit nativer Audio-Graph-Schicht. v2 ersetzt den ursprünglichen MVP-Datenfluss durch eine versionierte Performance-Session mit acht Loop-Spuren, Overdub-Layern, Szenen, Mixer, Echtzeit-FX, Drum-Sequencer und quantisiertem Transport.

## Kernfunktionen

- 8 Loop-Tracks mit Arm, Play/Stop, Mute, Solo, Gain und Panorama
- Layer-basierte Overdubs mit Undo/Redo-Stack pro Track
- musikalischer Transport: BPM, 4/4, Quantisierung, 1/2/4/8-Takt-Loops, Count-in, Metronom, Swing
- 8 Performance-Szenen mit Capture und quantisiertem Launch; Recall von Play/Mute/Solo, Gain, Pan und Track-FX
- 5-Lane Drum-Sequencer mit 16/32 Steps, Velocity, Presets, Lane-Mute/Level
- nativer AudioContext-Graph über `react-native-audio-api`
- Track-DSP: 3-Band-EQ, Low-pass, Delay/Feedback, Convolution-Reverb, Gain/Pan
- echtes Master-RMS/Peak-Metering über nativen `AnalyserNode`
- verlustfreie WAV-Aufnahme für Loop-Layer
- synchroner Multi-Track-Start mit gemeinsamer AudioContext-Zeit
- Projektformat v2 mit Migration alter v1-Projekte, Autosave und Snapshots
- Audio-Import über System-Dateipicker; importierte Dateien werden dauerhaft im LoopForge-Dokumentbereich abgelegt und nativ validiert
- Audio-Route-/Sample-Rate-Diagnose mit Schutz gegen Route-Wechsel während Recording
- 48-kHz/24-Bit Offline-Mixdown inklusive Track-FX und Drum-Sequencer mit nativer Teilen-Funktion
- Background-/Foreground-Audio-Konfiguration und Mikrofon-Foreground-Service
- Performance-Wake-Lock im Studio

## Entwicklung

`react-native-audio-api` enthält nativen Code. LoopForge Pro muss daher als Expo Development Build bzw. nativer Build gestartet werden und läuft nicht vollständig in Expo Go.

```bash
corepack enable
pnpm install
pnpm preflight
pnpm integrity
pnpm android
```

Für iOS:

```bash
pnpm install
pnpm preflight
pnpm ios
```

`pnpm metro` startet Metro mit geleertem Cache.

## Validierung in dieser Übergabe

Der dependency-freie `pnpm preflight`-Kern wurde als `node scripts/preflight.mjs` ausgeführt und ist erfolgreich. Zusätzlich prüft `pnpm integrity` alle lokalen TS/TSX-Importpfade ohne installierte Dependencies. Zusätzlich wurden alle 82 TS/TSX-Quelldateien mit dem TypeScript-Parser transpiliert; dabei traten keine Syntaxdiagnosen auf.

Ein vollständiges `pnpm install`, `tsc`, Vitest und der native Android-/iOS-Build konnten in der Übergabe-Sandbox nicht abgeschlossen werden, weil deren Container keinen DNS-Zugriff auf `registry.npmjs.org` hatte. Deshalb ist absichtlich kein veraltetes `pnpm-lock.yaml` beigelegt; `pnpm install` erzeugt nach Auflösung der neuen nativen Abhängigkeit einen frischen Lockfile.

## Dokumentation

- `PRO_ARCHITECTURE.md` – Architektur, Signalfluss und technische Entscheidungen
- `RESEARCH_AND_ROADMAP.md` – Vergleich mit Profi-Loopern und priorisierter Ausbauplan
- `HANDOVER.md` – Übergabe, Buildhinweise, Teststatus und bekannte Grenzen
- `todo.md` – konkreter Engineering-Backlog

### Native-Kompatibilitätshinweis

LoopForge v2 verwendet `react-native-audio-api` 0.13.2 ohne dessen Worklet-Nodes. Das Projekt enthält zugleich Expo/React-Native-Worklets aus dem bestehenden Stack. Die exakte native Kombination muss beim ersten Online-Android-/iOS-Build verifiziert werden; diese Sandbox konnte die native Dependency-Auflösung nicht durchführen. Bei einem nativen Buildfehler an Worklets/CMake/Pods zuerst die tatsächlich aufgelösten Versionen prüfen und nicht blind Dependencies downgraden.

## GitHub / CI

Das Repository enthält einen CI-Workflow für Preflight, Source-Integrity, TypeScript, Tests und Lint sowie einen separaten Android-Debug-APK-Workflow. Der APK-Workflow kann manuell über GitHub Actions gestartet werden und läuft zusätzlich auf Tags im Format `v*`.

Repository- und Branch-Protection-Empfehlungen stehen in [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md). Lokale Zugangsdaten gehören ausschließlich in `.env`; als Vorlage dient `.env.example`.
