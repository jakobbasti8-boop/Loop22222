# LoopForge Pro — Release Readiness

This document defines the release gates for a production-grade LoopForge build. A green source repository is necessary, but it is not sufficient for a commercial mobile-audio release.

## Gate 1 — Repository integrity

- [x] Production source is version-controlled on `main`.
- [x] Temporary bootstrap transport is excluded from the production tree.
- [x] Local credentials, `.env` files and machine-specific configuration are excluded.
- [x] Deterministic generated assets replace unnecessary committed binary build artifacts.
- [x] CI, Android debug build workflow, Dependabot and CODEOWNERS are present.
- [ ] Repository visibility is **Private**.
- [ ] Protected `main` ruleset is enabled with required CI checks.

## Gate 2 — Functional quality

Before release candidate promotion, verify on physical hardware:

- recording, overdub, undo/redo and loop-boundary behavior;
- quantized starts/stops at all supported BPM and bar lengths;
- mute/solo/gain/pan and every track effect;
- scene recall and quantized scene launch;
- 16/32-step drum sequencing, swing and per-step velocity;
- local audio import for WAV/FLAC/AIFF/MP3/M4A;
- offline 48 kHz / 24-bit WAV export and native share flow;
- autosave, project migration, duplicate/delete/open flows;
- recovery after microphone denial, phone call interruption and app backgrounding;
- route changes between speaker, wired headset, USB audio and supported Bluetooth paths.

## Gate 3 — Real-time audio performance

A release candidate must be profiled on representative Android/iOS devices. Record:

- input-to-output latency;
- scheduling jitter at loop boundaries;
- underruns/xruns/dropouts;
- CPU utilization for 1, 4 and 8 active tracks;
- memory growth during a 60-minute session;
- thermal throttling during long performance sessions;
- behavior at 44.1 kHz and 48 kHz device routes where applicable.

No UI-level timing assertion may substitute for measured audio-thread timing.

## Gate 4 — Native correctness

For commercial-grade live looping, validate or complete:

- sample/frame-accurate recording boundaries;
- device-latency compensation;
- seam/click prevention at loop wrap points;
- DC-offset handling;
- safe handling of recorder failure and route loss;
- deterministic recovery after audio-session interruption.

If measurements show React/native bridge timing is insufficient for record-boundary precision, move the critical recorder transport into the native/worklet audio path before release.

## Gate 5 — Security and privacy

- microphone permission is requested only when needed;
- no recording is uploaded implicitly;
- imported and recorded audio remains local unless the user explicitly shares/exports it;
- production builds contain no development credentials or debug endpoints;
- dependency and secret scanning are clean;
- privacy policy accurately describes microphone, local files and optional sharing behavior.

## Gate 6 — Android release

- unique production application ID is frozen;
- release keystore is generated and stored outside Git;
- signing credentials are stored in an approved secret store;
- release AAB is generated from CI/EAS or another reproducible pipeline;
- target/compile SDK and Play requirements are current at release time;
- foreground-service declarations are validated for audio recording/playback behavior;
- Play Console data-safety and microphone declarations are completed;
- internal testing track passes before staged production rollout.

## Gate 7 — iOS release

- bundle identifier and signing team are frozen;
- microphone/background-audio declarations are validated;
- archive passes Xcode/App Store validation;
- TestFlight hardware test matrix passes;
- App Privacy answers match actual application behavior.

## Gate 8 — Release operations

- version and build number are incremented reproducibly;
- changelog is complete;
- release candidate commit is immutable/tagged;
- CI is green on the exact release commit;
- rollback build is retained;
- release notes and known limitations are documented;
- crash/performance monitoring policy is defined before public rollout.

## Current classification

The repository is structured as a production-oriented engineering baseline. Public-store or live-stage release must not be declared complete until the physical-device, native-audio, signing and store gates above have passed.
