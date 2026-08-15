# LoopForge Pro v2 – Architektur

## 1. Zielbild

LoopForge soll sich wie ein Live-Instrument verhalten, nicht wie eine Aufnahme-App mit Loop-Button. Deshalb sind Transport, Session-State und Audio-Engine getrennte, aber synchronisierte Schichten.

## 2. Schichten

### UI / Performance Layer

- `app/(tabs)/index.tsx` – Live Studio / Recording / Szenen
- `app/(tabs)/mixer.tsx` – 8 Channel-Strips + Master
- `app/(tabs)/beat.tsx` – 16/32-Step Rhythm Lab
- `app/(tabs)/projects.tsx` – Session Library
- `app/(tabs)/setup.tsx` – Transport, Quantisierung, Audio-Diagnose

### Session Domain

`lib/pro-session.ts` definiert das Projektformat v2:

- Transport
- 8 Tracks
- Layer/Overdubs
- Track-FX
- Drum-Pattern
- Szenen
- Master

`lib/session-provider.tsx` ist die zentrale Runtime-Session. UI und Audio arbeiten auf demselben Projektzustand. Autosave wird nach Änderungen entprellt; beim Projektwechsel wird der aktive Zustand explizit gesetzt.

### Persistenz

`lib/session-store.ts` speichert Projekte über AsyncStorage und migriert das alte v1-Format. v2-Projekte werden beim Laden normalisiert, damit neu hinzugekommene Felder mit Defaults ergänzt werden.

### Musikalischer Transport

`lib/beat-provider.tsx` besitzt die Beat-Clock und den Look-ahead-Scheduler. Die Samples werden nicht erst beim UI-Tick abgespielt, sondern innerhalb eines Scheduling-Horizonts auf `AudioContext.currentTime` gelegt.

Funktionen:

- 40–240 BPM
- 16tel-Step-Clock
- Swing
- 4/4-Position
- Metronom mit Taktaccent
- 16/32-Step Pattern
- per-Step Velocity
- Quantisierungsgrenzen für Record-/Scene-Aktionen

### Native Audio Engine

`lib/audio/pro-audio-engine.ts` kapselt `react-native-audio-api`.

Signalweg pro Track:

```text
AudioBufferSource Layer 1 ─┐
AudioBufferSource Layer 2 ─┼→ Track Input Gain
AudioBufferSource Layer n ─┘
        ↓
Low Shelf EQ (140 Hz)
        ↓
Mid Bell EQ (1.1 kHz)
        ↓
High Shelf EQ (6.5 kHz)
        ↓
Low-pass Filter
        ↓
Stereo Panner
        ├────────────→ Dry Gain ───────────────────┐
        ├────────────→ Delay → Wet → Master        │
        │                   ↘ Feedback ↗           ├→ Master Gain → Output
        └────────────→ Convolver → Reverb Wet ─────┘
                                              ↓
                                  Master Gain → Analyser → Output
```

Der Reverb benutzt `assets/audio/reverb_ir.wav` als lokal erzeugten Impuls.

## 3. Loop-Aufnahme

Ablauf im Studio:

1. Track armen.
2. Falls Transport steht: Transport starten.
3. Optionaler Count-in.
4. Auf Quantisierungsgrenze warten.
5. Nativen Recorder starten.
6. Nach der konfigurierten Loop-Länge automatisch stoppen.
7. WAV als neues Layer in den Track eintragen.
8. Track mit allen Layern neu laden und loopen.

Overdubs bleiben als getrennte Layer erhalten. Dadurch kann Undo/Redo einzelne Takes entfernen bzw. wiederherstellen, ohne das Grundmaterial destruktiv zu überschreiben.

## 4. Szenen

Acht Default-Szenen A–H speichern pro Track `isPlaying`, `isMuted`, `isSolo`, Gain, Panorama und den Track-FX-Snapshot. Ein Scene-Launch wartet – sofern aktiviert – auf die nächste Quantisierungsgrenze. Anschließend werden Mixerzustand und alle gewünschten Tracks mit einer gemeinsamen AudioContext-Startzeit initialisiert. Alte v2-Szenen ohne die erweiterten Felder bleiben durch optionale Felder kompatibel.

## 5. Fehler- und Systemverhalten

- Audio-Engine wird global nur einmal pro Projekt initialisiert.
- Mehrere Tabs starten die laufenden Loops nicht erneut.
- iOS Audio Session wird auf `playAndRecord` vorbereitet.
- Audio-Unterbrechungen werden beobachtet; Resume wird nach geeigneten Systemereignissen versucht.
- Route Changes werden beobachtet. Passiert ein Route-Wechsel während Recording, wird der Take nach dem Stop nicht in die Session übernommen und die potenziell beschädigte Datei best-effort gelöscht.
- Android/iOS Background-Audio- und Mikrofon-Service-Berechtigungen sind im Expo Plugin konfiguriert.
- Studio hält das Display im Performance-Betrieb wach.
- Master-Audio läuft durch einen `AnalyserNode`; Mixer zeigt RMS und Peak in dBFS.

## 6. Offline Mixdown

`lib/audio/export-mixdown.ts` spiegelt den Track-Graphen in einem `OfflineAudioContext`. Zwei vollständige Loop-Zyklen werden gerendert; Zyklus 1 dient als Warm-up für Delay-/Reverb-Tails, Zyklus 2 wird als loop-sicherer Stereo-Mix ausgegeben. Das Rhythm-Lab wird mit Velocity und Swing mitgerendert. Anschließend kodiert `lib/audio/wave-encoder.ts` Stereo-PCM als 48 kHz / 24-Bit WAV. Nur wenn der Offline-Peak oberhalb von -0,5 dBFS liegt, wird beim Export ein Safety-Gain angewendet; die gespeicherten Mixerwerte bleiben unverändert.

## 7. Audio-Import

`lib/audio/import-loop.ts` öffnet den nativen System-Dateipicker für Audio-Dateien. Die ausgewählte Datei wird zuerst über den vom Picker bereitgestellten lokalen URI übernommen, danach in `Documents/LoopForge/Imports` kopiert. `ProAudioEngine.inspectAudio()` dekodiert die Datei vor der Session-Übernahme und liefert Länge, Sample-Rate und Kanalzahl. Nicht dekodierbare Dateien werden verworfen und die angelegte Kopie wird best-effort bereinigt.

Der Import ist absichtlich nicht destruktiv: stimmt die Dateilänge nicht exakt mit der aktuellen musikalischen Loop-Länge überein, bleibt das Original unverändert und die UI weist auf den fehlenden Time-Stretch hin.

## 8. Wo die harte Echtzeitgrenze liegt

Die aktuelle Architektur schedult Playback auf der nativen AudioContext-Zeit. Record-Start/-Stop wird jedoch noch über asynchrone Recorder-Aufrufe aus der React-Schicht ausgelöst. Für absolut samplegenaue Punch-Grenzen, automatische Hardware-Latenzkompensation und nahtlose Time-Stretch-Loops ist die nächste Ausbaustufe ein eigener Native/Worklet-Transportkern.

Diese Trennung ist bereits vorbereitet: UI und Session kennen keine konkrete Recorder-Implementierung; sie sprechen nur mit `ProAudioEngine`.
