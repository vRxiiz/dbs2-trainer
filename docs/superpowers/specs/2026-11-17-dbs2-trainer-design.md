# DBS2-Trainer – Design

Stand: 17.11.2026, Ergebnis der Fragerunde mit Joel.

## Ziel

Nachbau von [markusschuetze/db-trainer](https://github.com/markusschuetze/db-trainer) für das Modul
**DBS2 / Datenbanken und Datenmanagement** (TH Köln, Prof. Schaible, Prof. Bertelsmeier, SoSe 2026).
Frontend, Look und Bedienung wie im Original, Inhalte ausschließlich DBS2.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Prüfung von PL/SQL, Trigger, MV | Freies Code-Schreiben wie in der Klausur. Der Trainer prüft Pflichtbausteine (Strukturprüfung) und zeigt danach die Musterlösung. Kein PL/SQL-Emulator. |
| DBS1-Module | Werden ersetzt. Bleiben: SQL-Engine (sql.js mit Oracle-Schicht), Spielwiese, Fragen lernen, Prüfungsmodus, Fortschritt. Raus: ER, Normalisierung, DDL, DML-Trainer, Textaufgaben, Praktikum-Modul. |
| Repo | Eigenes neues Repo `vRxiiz/dbs2-trainer`, kein Fork. MIT-Hinweis des Originals bleibt erhalten. |
| Veröffentlichung | Privates Repo, lokale Nutzung (`npm run dev` bzw. `dist/`). Kein GitHub Pages. Inhalte dürfen eng an Folien, Übungsblättern und Altklausur bleiben. |
| Zusatzfunktionen | Nur Lernfunktionen. Raus: Dozentenmodus, Aufgaben-Editor, Lernstatistik-Server/Consent, SCORM, Englisch, Feedback, QR-Code. |
| Rechenaufgaben | Interaktive Rechentrainer mit Zufallsdaten: B-Baum (Einfügen mit Splits), Bitmap-Index, Komprimierung (Lauflänge, Bit-Vektor, Dictionary, Frame of Reference, Differenz). |
| Prüfungsmodus | Drei Modi wie im echten Ablauf: MCT 1 (Kap. 1–2), MCT 2 (Kap. 3–7) als Wissensfragen, E-Klausur mit drei Code-Aufgaben (Trigger, Materialized View, Prozedur) nach Muster der Altklausur, mit Zeitlimit. |
| Umfang v1 | Alle 7 Kapitel, je ca. 20–30 Wissensfragen und 4–8 Code-/Rechenaufgaben, 2–3 E-Klausur-Sets. |

Selbst entschieden (Joel möchte Details nicht abgefragt bekommen):
- Views laufen echt in SQLite (CREATE [OR REPLACE] VIEW, Abfragen auf Views) auf den Übungsschemata Coworkers/Projects, Honigernten und Hotel (Altklausur).
- Materialized Views werden in der Spielwiese als Schnappschuss-Tabelle emuliert (BUILD, REFRESH per `DBMS_MVIEW.REFRESH`, ON COMMIT), `INMEMORY` und `CREATE BITMAP INDEX` werden angenommen.
- Kopplungstechniken und NoSQL nur als Wissensfragen.
- Bestehen: MCT 60 % (Praktikum: 60/100 Punkte), E-Klausur 50 %.

## Kapitel

01 Speicherstrukturen und Indexierung · 02 PL/SQL · 03 Trigger · 04 Views und Materialized Views ·
05 Column Store und In-Memory · 06 Kopplungstechniken · 07 NoSQL

## Quellen

`/mnt/project-files/knowledge/` (Folien, Übungen 1–8, Altklausur), `/mnt/project-files/dbs2/` (Spickzettel Signalwörter, DBS2-Übersicht).
