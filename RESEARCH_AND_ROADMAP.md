# LoopForge Pro – Recherche & Ausbau-Roadmap

Stand: 15.08.2026

## Referenzsysteme

Die v2-Architektur wurde gegen typische Profi-Looper-/DAW-Funktionen abgeglichen.

### Ableton Live / Looper / Push

Relevante Konzepte:

- Global-/Record-Quantisierung
- Fixed-Length Recording
- laufendes Overdub
- Undo während Overdub
- frei bzw. fest definierbare Loop-Längen
- MIDI-Mapping für Live-Steuerung
- Render-as-Loop und Umgang mit Effekt-Tails

Quellen:

- https://www.ableton.com/en/manual/live-audio-effect-reference/
- https://www.ableton.com/en/manual/recording-new-clips/
- https://www.ableton.com/en/manual/using-push-2/
- https://www.ableton.com/en/manual/managing-files-and-sets/

### Loopy Pro

Relevante Konzepte:

- quantisierte Aktionen
- Count-in / Count-out
- Follow Actions
- flexible Live-Oberfläche
- MIDI-/Controller-gesteuerte Aktionen

Quelle:

- https://loopypro.com/manual/

### BOSS RC-600 / RC-505mkII

Relevante Konzepte:

- mehrere parallele Stereo-Loop-Tracks
- getrennte Input- und Track-FX
- flexible I/O-Routings
- unabhängige Track-Level
- externe Steuerung / Footswitch / MIDI
- rhythmus- und tempogebundene Effekte

Quellen:

- https://www.boss.info/global/products/rc-600/
- https://www.boss.info/us/products/rc-505mk2/

### Mobile Low-Latency Audio

Für Android ist niedrige Round-Trip-Latenz hardware- und routeabhängig. Google empfiehlt native Low-Latency-Pfade und Oboe/AAudio für anspruchsvolle Echtzeitanwendungen; eine professionelle App muss deshalb auf realen Geräten messen statt eine feste Latenzzahl anzunehmen.

Quellen:

- https://developer.android.com/games/sdk/oboe/low-latency-audio
- https://developer.android.com/games/sdk/oboe
- https://developer.android.com/ndk/guides/audio/aaudio/aaudio
- https://developer.android.com/ndk/guides/audio/audio-latency

Die aktuell verwendete native Audio-Schicht:

- https://docs.swmansion.com/react-native-audio-api/docs/fundamentals/getting-started/
- https://docs.swmansion.com/react-native-audio-api/docs/inputs/audio-recorder/
- https://docs.swmansion.com/react-native-audio-api/docs/system/audio-manager/
- https://docs.swmansion.com/react-native-audio-api/docs/other/audio-api-plugin/

## In v2 bereits umgesetzt

### P0 – Kerninstrument

- [x] 8 Loop-Tracks
- [x] Track Arm / Play / Stop / Mute / Solo
- [x] Layer-basierte Overdubs
- [x] Undo/Redo-Stack
- [x] feste Loop-Länge 1/2/4/8 Takte
- [x] Count-in
- [x] Record-/Scene-Quantisierung
- [x] BPM / Tap Tempo
- [x] Metronom
- [x] 8 Performance-Szenen
- [x] synchroner Multi-Track-Start
- [x] Auto-Stop nach Loop-Länge
- [x] Autosave / Projektmigration / Snapshots

### P1 – Rhythmus

- [x] 5 Drum-Lanes
- [x] 16/32 Steps
- [x] Swing
- [x] Step Velocity
- [x] Lane Level / Mute
- [x] lokale Drum-Samples
- [x] Presets
- [x] Look-ahead Scheduling

### P1 – Mixer / DSP

- [x] Track Gain
- [x] Stereo Pan
- [x] Solo Bus
- [x] 3-Band EQ
- [x] Low-pass Filter
- [x] Delay + Feedback
- [x] Convolution-Reverb
- [x] Master Gain
- [x] Master RMS/Peak Metering
- [x] lokaler Reverb-Impuls

### P1 – System

- [x] native AudioContext-Abstraktion
- [x] WAV-Recording
- [x] Audio Session Aktivierung
- [x] Interruption-/Route-Observer
- [x] Route-Change Guard: Take verwerfen statt potenziell beschädigte Loop übernehmen
- [x] Foreground-Service-Konfiguration
- [x] Audio-Route-/Sample-Rate-Diagnose
- [x] Performance Wake-Lock
- [x] dependency-freier Preflight

## Nächste Ausbaustufe für echtes Stage-/Release-Niveau

### P0 – Samplegenauer Record-Kern

1. Recorder direkt in einen Audio-Worklet-/Native-Transport integrieren.
2. Aufnahmebeginn und -ende auf Audio-Frames statt JS-Timer legen.
3. Automatisches Pad/Trim auf exakt `bars × beats × samplesPerBeat`.
4. 2–10 ms Seam-Crossfade zur Klickvermeidung.
5. DC-Offset-Entfernung.
6. per-Device Round-Trip-Latenz-Kalibrierung und gespeicherter Compensation Offset.
7. Safety Limiter am Master.

### P0 – Tempoänderung ohne zerstörte Loops

Aktuell verändert Tempo die musikalische Clock; bereits aufgenommenes Audiomaterial besitzt noch keinen Warp-/Time-Stretch-Layer. Für professionelle Tempoänderungen benötigt LoopForge:

- elastisches Time-Stretch ohne Pitch-Shift
- optional unabhängiges Pitch-Shifting
- transientenschonende Modi für Drums
- spektrale Modi für Vocals/Pads
- Offline-Render-Cache pro Tempo

### P0 – Export / Files

- [x] Stereo Mixdown über OfflineAudioContext
- [x] 48 kHz / 24-Bit WAV Export
- [x] Drum-Sequencer und Track-FX im Mixdown
- [x] nativer Share-Dialog
- [ ] Stem Export pro Track
- [ ] FLAC Export
- [ ] Loop-safe Render mit frei konfigurierbarem FX-Tail
- [x] Import eigener Audiodateien über System-Dateipicker
- [x] persistente Kopie importierter Loops in den App-Dokumentbereich
- [x] native Decode-/Längen-/Sample-Rate-/Kanal-Validierung vor Import
- [ ] tempoelastischer Import / automatisches Time-Stretch auf Projektlänge
- [ ] Projektpaket mit JSON + Audio-Assets
- [x] Share Sheet für WAV-Mixdown
- [ ] Garbage Collection verwaister Takes/Imports

### P1 – MIDI / Foot Controller

Android unterstützt MIDI über USB, Bluetooth LE und virtuelle Transports. Eine Stage-App sollte daher ein Mapping-System bekommen:

- MIDI Learn
- CC/Note Mapping
- Footswitch: Rec/Play/Stop/Undo/Redo/Scene
- Momentary vs Toggle
- MIDI Clock In/Out
- MIDI 2.0/UMP vorbereiten
- Controller Profiles

Android-Referenz:

- https://developer.android.com/reference/android/media/midi/package-summary

### P1 – Ableton Link

Ableton Link synchronisiert Beat, Tempo, Phase sowie Start/Stop zwischen Apps/Geräten im lokalen Netz. Das ist der passende Sync-Pfad für Jam-/DAW-Integration.

- https://ableton.github.io/link/

### P1 – Erweiterte FX

- Input-FX separat von Track-FX
- Compressor
- Gate/Expander
- De-Esser
- Saturation/Soft Clip
- Parametric EQ mit frei wählbaren Frequenzen/Q
- Tempo-synchrones Delay
- Reverb Presets / mehrere Impulsantworten
- Chorus/Flanger/Phaser
- Beat Repeat / Stutter
- Reverse
- Half Speed / Double Speed
- Filter Macros
- Sidechain Ducking zwischen Kick und Loop-Spuren

### P1 – Live Set / Scenes 2.0

- [x] 8 Szenen pro Set
- [ ] 16 Szenen optional
- [ ] Scene Fade Time
- [x] Capture von Gain/Pan/FX/Solo zusätzlich zu Play/Mute
- Follow Actions
- Verse / Chorus / Bridge Labels
- Scene Chains
- One-shot Clips
- Stop Buttons pro Scene/Track

### P2 – Editing

- echte Waveform aus PCM-Peaks
- Trim Start/End
- Normalize
- Fade In/Out
- Slice / Chop
- duplicate/halve/double loop
- reverse layer
- per-layer gain/mute
- take browser
- non-destructive clip editor

### P2 – Reliability / Release Engineering

- Android Device Matrix mit tatsächlicher Round-Trip-Latenz
- USB-C Audio Interface Tests
- kabelgebundene Headset Tests
- Bluetooth bewusst als High-Latency Route markieren
- App-State-/Crash-Recovery während Recording
- Speicherplatz-Warnung
- Recording-Journal vor Dateischreibvorgängen
- E2E Tests auf Android/iOS
- Detox/Maestro UI Tests
- native Instrumentation Tests für Audio
- CPU/XRun-Telemetrie lokal
- Release Signing / CI / Store Builds

## Priorisierung

Für einen echten Musiker-Release ist die Reihenfolge:

1. **samplegenaue Aufnahme + Latenzkompensation**
2. **nahtlose Loop-Seams + Safety Limiter**
3. **Mixdown/Stem Export + Dateiverwaltung**
4. **MIDI Learn/Foot Controller**
5. **Ableton Link**
6. **Time-Stretch/Pitch**
7. **erweiterte FX und Waveform Editor**
8. **Stage QA / Device Matrix / CI**

Damit wird zuerst die musikalische Zuverlässigkeit maximiert und erst danach Feature-Breite hinzugefügt.
