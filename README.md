# DBS2-Trainer

Interaktiver Trainer für das Modul **Datenbanken und Datenmanagement (DBS2)** an der TH Köln. Er läuft komplett im
Browser, ohne Server, ohne Anmeldung und ohne Tracking. Oberfläche und SQL-Engine stammen aus
[markusschuetze/db-trainer](https://github.com/markusschuetze/db-trainer) (MIT), die Inhalte sind für DBS2 neu geschrieben.

## Was drin ist

| Bereich | Route | Inhalt |
|---|---|---|
| Wissensfragen | `#/lernen` | 194 Fragen zu allen 7 Kapiteln, Lernreihenfolge wie in Führerschein-Apps |
| Code-Aufgaben | `#/code` | 48 Aufgaben (Indexe, PL/SQL, Trigger, MVs, In-Memory) mit Strukturprüfung und Musterlösung, inkl. Altklausur 1–3 |
| Views und MVs | `#/views` | 10 Aufgaben, die in der Browser-Datenbank laufen und am Ergebnis geprüft werden |
| Rechentrainer | `#/rechnen` | B-Baum, Bitmap-Index, Kompression (Lauflänge, Bitvektor, Dictionary, FOR, Differenz) |
| Spielwiese | `#/spielwiese` | SQL auf Coworkers, Honigernten und Hotelbuchungen |
| Prüfungsmodus | `#/pruefung` | MCT 1 (Kap. 1–2), MCT 2 (Kap. 3–7), E-Klausur (Trigger, MV, Prozedur) |
| Fortschritt | `#/fortschritt` | Prüfungsreife je Modus, Verlauf, Themen zum Üben, Export/Import |

PL/SQL-Code wird nicht ausgeführt (sql.js ist SQLite), sondern auf die geforderten Bausteine geprüft. Views und
Materialized Views (inkl. `REFRESH`, `INMEMORY`-Klauseln) emuliert die Oracle-Schicht in `src/sql/`.
Die Schemata der Übungsdatenbanken sind aus Aufgabentexten rekonstruiert; im SQL Developer mit `DESC` prüfen.

## Entwickeln

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # statische Seite in dist/
```

Lizenz: Software MIT (`LICENSE`), Inhalte CC BY-SA 4.0 (`LICENSE-CONTENT.md`).
