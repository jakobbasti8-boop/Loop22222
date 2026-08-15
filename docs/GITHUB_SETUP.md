# GitHub-Integration

## Zielrepository

Empfohlener Name: `LoopForge-Pro`

Empfohlene Sichtbarkeit: `private`, solange Audio-Engine, Produktstrategie und Signierung noch nicht für Open Source vorgesehen sind.

## Repository-Struktur

- `app/` – Expo Router Screens
- `components/` – UI-Komponenten
- `hooks/` – Recording-/Engine-Hooks
- `lib/` – Session, Audio-Engine und Persistenz
- `assets/audio/` – lokale Drum-/Metronom-/IR-Assets
- `tests/` – Unit Tests
- `scripts/` – Preflight und Source-Integrity
- `.github/workflows/ci.yml` – Typecheck, Tests, Lint und Preflight
- `.github/workflows/android-debug.yml` – manueller/tag-basierter Debug-APK-Build

## Branch Protection

Für `main` empfohlen:

1. Pull Request vor Merge verlangen.
2. Statuscheck `validate` aus Workflow `CI` verlangen.
3. Force Pushes auf `main` deaktivieren.
4. Branch-Löschung für `main` deaktivieren.

## Release-Flow

1. Änderungen über Feature-/Fix-Branch.
2. CI muss grün sein.
3. Merge nach `main`.
4. Tag `vX.Y.Z` erzeugen.
5. `Android Debug APK` erzeugt für Tags automatisch ein APK-Artefakt.

Für Store-/signierte Builds EAS oder einen dedizierten Signing-Workflow verwenden. Signing-Secrets gehören ausschließlich in GitHub Actions Secrets bzw. den Expo/EAS Secret Store.
