# Changelog

## 2.0.0 Pro – 2026-08-15

### Audio / Timing
- native `react-native-audio-api` AudioContext engine
- synchroner Multi-Track-Start
- WAV Loop Recording
- Count-in, Quantisierung und feste Loop-Länge
- Route-/Interruption-Handling
- Route-Change Recording Guard mit Invalid-Take-Cleanup
- Master RMS/Peak Metering

### Tracks / Mixer
- 8 Loop-Tracks
- Layer-Overdubs mit Undo/Redo
- Arm, Play, Stop, Mute, Solo
- Gain und Stereo-Pan
- 3-Band EQ, Low-pass, Delay/Feedback, Convolution-Reverb

### Performance
- 8 Szenen A–H
- quantisierter Scene Launch
- Scene Capture von Play/Mute/Solo/Gain/Pan/FX
- 16/32-Step Rhythm Lab mit 5 Lanes, Velocity und Swing

### Projects / Export
- Session-Schema v2 mit v1-Migration
- Autosave und Snapshots
- Project Library: Neu, Öffnen, Duplizieren, Löschen
- 48 kHz / 24-Bit Stereo Offline-Mixdown
- Mixdown rendert Tracks, Track-FX und Drum-Sequencer
- FX-Warm-up durch Zwei-Zyklus-Offline-Render
- Export-Safety-Gain bei digitalem Überpegel
- nativer WAV Share-Dialog
- Audio-Import über System-Dateipicker
- persistente Ablage importierter Loops unter `Documents/LoopForge/Imports`
- native Decode-/Formatvalidierung und Längenprüfung vor Session-Übernahme

### Reliability / Engineering
- synchron gehaltener Project-Ref beseitigt Race Conditions bei Undo/Redo und Scene Launch
- dependency-freier Preflight
- dependency-freier Source-Integrity-Check für lokale Imports
- 78 TS/TSX-Dateien syntaxgeprüft
- WAV-Encoder Byte-/Header-Selbsttest
