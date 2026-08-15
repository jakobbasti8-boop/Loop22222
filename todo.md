# LoopForge Pro Engineering Backlog

## v2 – erledigt

- [x] Session Schema v2
- [x] Legacy v1 Migration
- [x] 8 Track Rack
- [x] zentrale Session Provider Architektur
- [x] Native AudioContext Engine
- [x] WAV Loop Recording
- [x] Overdub Layer
- [x] Undo/Redo Stack
- [x] Mute / Solo / Gain / Pan
- [x] synchroner Multi-Track-Start
- [x] feste Loop-Länge
- [x] Count-in
- [x] Quantisierung
- [x] 8 Scenes + Capture/Launch
- [x] Scene Recall von Solo/Gain/Pan/FX
- [x] 3-Band EQ
- [x] Low-pass Filter
- [x] Delay + Feedback
- [x] Convolution-Reverb
- [x] Master Gain
- [x] Master RMS/Peak Metering
- [x] 16/32 Step Sequencer
- [x] 5 Drum Lanes
- [x] Velocity
- [x] Swing
- [x] Metronom
- [x] Presets
- [x] Project Library
- [x] Autosave
- [x] Snapshots
- [x] Audio Route Diagnostics
- [x] Audio Interruptions
- [x] Route-Change Invalid-Take Guard
- [x] Foreground Service Config
- [x] Wake Lock
- [x] Preflight Script
- [x] dependency-freier Local-Import-Integrity-Check
- [x] Pure Session Tests

## P0 – vor Musiker-/Stage-Release

- [ ] samplegenauer Recorder Transport in Native/Worklet
- [ ] Record Start/Stop auf Audio Frames
- [ ] automatisch auf exakte Frame-Länge pad/trimmen
- [ ] Seam Microfade gegen Klicks
- [ ] Latenz-Kalibrierungsroutine
- [ ] per-device Input Compensation
- [ ] Safety Limiter / Soft Clip auf Master
- [ ] Dropout/XRun Diagnose
- [x] 48 kHz / 24-Bit Offline Mixdown
- [x] Mixdown inkl. Drum Pattern + Track FX
- [x] WAV Share Dialog
- [x] Audio-Loop-Import über System-Dateipicker
- [x] persistente Import-Kopie im App-Dokumentbereich
- [x] native Decode-/Formatvalidierung für Imports
- [ ] WAV/FLAC Stem Export
- [ ] tempoelastischer Import / Auto-Time-Stretch auf Projektlänge
- [ ] Projektpaket Export/Import
- [ ] orphan audio garbage collection
- [ ] real-device Android Build/Test
- [ ] real-device iOS Build/Test

## P1 – Stage Control

- [ ] MIDI Learn
- [ ] USB MIDI
- [ ] BLE MIDI
- [ ] MIDI Clock
- [ ] MIDI 2.0 / UMP
- [ ] Foot Controller Profiles
- [ ] Ableton Link
- [ ] Scene Fade
- [ ] Follow Actions
- [x] 8 Scenes
- [ ] optional 16 Scenes
- [ ] Input FX Rack
- [ ] Compressor
- [ ] Gate
- [ ] Saturation
- [ ] Tempo Delay
- [ ] Sidechain Ducking
- [ ] Reverse
- [ ] Half/Double Speed

## P1 – Elastic Audio

- [ ] Time Stretch
- [ ] Pitch Shift
- [ ] transient mode
- [ ] vocal/polyphonic mode
- [ ] tempo-change render cache

## P2 – Editor

- [ ] echte PCM Waveform Peaks
- [ ] Trim Start/End
- [ ] Fade handles
- [ ] Normalize
- [ ] Slice/Chop
- [ ] per-layer gain/mute
- [ ] Take Browser
- [ ] One Shots

## P2 – Release Engineering

- [ ] CI Android
- [ ] CI iOS
- [ ] Vitest komplett
- [ ] UI E2E
- [ ] native Audio Instrumentation Tests
- [ ] device latency matrix
- [ ] USB audio interface matrix
- [ ] crash recovery tests während recording
- [ ] storage pressure tests
- [ ] Play Store signing
- [ ] App Store signing
