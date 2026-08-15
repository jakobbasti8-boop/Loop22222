# Contributing to LoopForge

## Qualitäts-Gate

Vor jedem Pull Request müssen mindestens folgende Prüfungen laufen:

```bash
pnpm preflight
pnpm integrity
pnpm check
pnpm test
pnpm lint
```

Änderungen an Audio-Engine, Recording, Routing oder Scheduling benötigen zusätzlich einen Test auf realer Hardware. Simulatoren und Web-Builds sind kein belastbarer Nachweis für Echtzeit-Audio.

## Branching

- `main`: stabiler Integrationsstand
- `feature/<name>`: neue Funktionen
- `fix/<name>`: Fehlerbehebungen
- `chore/<name>`: Tooling, CI, Dokumentation

## Commit-Stil

Kurze imperative Commit-Nachrichten, z. B. `fix recorder route interruption` oder `add quantized scene launch`.

## Secrets

Keine `.env`, Tokens, Datenbank-URLs, OAuth-Secrets, Signierkeys oder Expo-Tokens committen. Für lokale Werte ausschließlich `.env` verwenden; die Datei ist ignoriert.
