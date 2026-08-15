# LoopForge – Interface-Konzept

## Gestaltungsziel

LoopForge ist eine mobile Loopstation für schnelle musikalische Ideen mit Stimme, Beat und vier synchronisierten Spuren. Die Anwendung ist für die einhändige Nutzung im Hochformat **9:16** gedacht. Das zentrale Aufnahmepad liegt im unteren Daumenbereich; sekundäre Einstellungen werden in klaren, kurzen Bereichen oberhalb davon dargestellt. Die Oberfläche orientiert sich an iOS-Konventionen: große, gut erreichbare Zielbereiche, deutliche Zustände, zurückhaltende Haptik und eine verständliche visuelle Hierarchie.

## Bildschirmübersicht

| Bildschirm | Primäre Inhalte | Funktionalität |
|---|---|---|
| Studio | Tempo, Takt, Beat-Steuerung, vier Spur-Pads, zentrale Aufnahme | Aufnahme starten/stoppen, Spuren abspielen und stummschalten, Beat starten und Tempo anpassen |
| Spurdetails | Pegel, Panorama, Effektkette und Spurlänge | Lautstärke, Panorama, Hall, Delay und Filter einer Spur verändern |
| Beat-Editor | 16-Step-Raster für Kick, Snare und Hi-Hat | Beat-Schritte setzen oder löschen und ein Preset wählen |
| Projektübersicht | Lokale Sessions mit Metadaten | Projekt anlegen, umbenennen, öffnen oder löschen |

## Zentraler Studio-Bildschirm

Der Studio-Bildschirm nutzt einen tiefen Anthrazit-Hintergrund, damit farbige Statussignale in dunkler Umgebung schnell erkennbar bleiben. Oben stehen eine kompakte Kopfzeile mit Projektname sowie ein Tempo- und Taktbereich. Darunter befindet sich eine kurze Beat-Leiste mit Start/Stopp und Preset-Auswahl. Die vier Spuren sind als große, vertikal gestapelte Karten konzipiert. Jede Karte zeigt Namen, Wellenform-Platzhalter, Pegel, Effektstatus und eine große Play-/Mute-Fläche.

Im unteren Drittel befindet sich ein runder, orangefarbener Aufnahme-Button mit eindeutiger Beschriftung. Während einer Aufnahme wechselt er zu einem warmen Korallrot, erhält einen sichtbaren Aufnahmering und zeigt den aktuellen Spurstatus. Ein kleines Quantisierungsfeld direkt oberhalb des Buttons macht deutlich, dass Aufnahme und Wiedergabe zum Takt ausgerichtet werden.

## Wichtige Nutzungsabläufe

| Ziel | Ablauf |
|---|---|
| Erste Voice-Loop erstellen | Studio öffnen → Beat starten oder Tempo festlegen → Aufnahme-Pad antippen → ins Mikrofon sprechen/singen → Pad erneut antippen → erste Spur läuft als Loop |
| Zweite Spur ergänzen | Freie Spur antippen → Aufnahme-Pad aktivieren → Aufnahme beenden → neue Spur läuft synchron zur ersten |
| Effekt hinzufügen | Spurkarte lange antippen oder Effekt-Symbol wählen → Spurdetails öffnen → Effektregler anpassen → Studio zeigt Effekt-Badge |
| Beat programmieren | Beat-Leiste öffnen → Beat-Editor wählen → Steps in Kick/Snare/Hi-Hat setzen → Studio zurückkehren und Beat abspielen |
| Session verwalten | Projektname in Kopfzeile wählen → Projektübersicht öffnen → Session speichern oder eine andere Session laden |

## Farb- und Zustandskonzept

| Rolle | Farbe | Einsatz |
|---|---|---|
| Hintergrund | `#101218` | Ruhiger, studioähnlicher Arbeitsraum |
| Kartenfläche | `#1B1F2A` | Spur- und Einstellungsflächen |
| Primäraktion | `#FF9B45` | Aufnahme, aktuell gewählte Instrumente und aktive Steuerung |
| Aufnahme aktiv | `#FF5D5D` | Aufnahme- und Warnzustand |
| Wiedergabe aktiv | `#63D8A6` | Laufende Loops und Beat-Transport |
| Spur 1–4 | `#76A7FF`, `#B68CFF`, `#FF8FA3`, `#5FD6C6` | Wiedererkennbare Spurfarben |
| Sekundärtext | `#A8B0C2` | Beschriftungen und technische Werte |

Die Farben werden nie als einziges Statusmerkmal eingesetzt: aktive Zustände erhalten zusätzlich einen Text, ein Icon oder eine Formveränderung. Die Mindesthöhe der wichtigsten Touch-Ziele beträgt 44 pt. Kritische Handlungen, etwa das Löschen einer Spur, werden ausdrücklich bestätigt.
