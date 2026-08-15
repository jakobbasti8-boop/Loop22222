# Security

## Vertrauliche Daten

Dieses Repository darf keine produktiven Zugangsdaten enthalten. Dazu zählen insbesondere Datenbank-URLs mit Credentials, OAuth-/JWT-Secrets, API-Keys, GitHub-Tokens, Android-Keystores und Apple-Signing-Dateien.

Wird ein Secret versehentlich committed, gilt es als kompromittiert und muss beim jeweiligen Anbieter rotiert werden. Das Entfernen aus einem späteren Commit allein reicht nicht aus, weil Git-Historie alte Inhalte weiter enthalten kann.

## Meldung

Sicherheitsrelevante Probleme nicht mit produktiven Secrets in öffentlichen Issue-Texten dokumentieren. Reproduktionsdaten immer auf das technisch notwendige Minimum reduzieren.
