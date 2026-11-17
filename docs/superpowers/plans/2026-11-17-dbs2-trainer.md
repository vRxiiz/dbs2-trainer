# DBS2-Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den db-trainer (React/Vite, sql.js) auf DBS2 umbauen: gleiche Oberfläche, neue Kapitel, Code-Aufgaben mit Strukturprüfung, Rechentrainer und drei Prüfungsmodi.

**Architecture:** Inhalte sind reine Daten in `src/content/`, Bewertungslogik in `src/logic/` (rein, ohne React, voll getestet), Seiten in `src/pages/` nutzen die vorhandenen Bausteine (`EditorExercise`, `SqlEditor`, `CheckList`, `ScenarioBrowser`). SQL läuft weiter über `src/sql/oracle.ts` auf SQLite.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind 4, sql.js, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-dbs2-trainer-design.md`

## Global Constraints

- Oberfläche und Inhalte nur Deutsch; Oracle-Syntax wie in der Vorlesung.
- Kein Server, kein Tracking, kein SCORM; Fortschritt nur im `localStorage` unter dem Schlüssel `dbs2:progress` (nicht `dbt:progress`, damit kein Konflikt mit dem Original im selben Browser).
- Kein TH-Köln-Logo im Repo. `LICENSE` behält den Copyright-Hinweis der DB-Trainer-Contributors; `LICENSE-CONTENT.md` nennt CC BY-SA 4.0 und die Vorlesungsquellen.
- Jede Aufgabe und Frage hat `topicId` aus `src/content/topics.ts` und ein Feld `source` (Folie/Übung/Altklausur).
- `npm test` und `npm run build` müssen am Ende jeder Aufgabe grün sein.

## Review Focus

- Code mit anderer Groß-/Kleinschreibung, Zeilenumbrüchen, Kommentaren oder `/` am Ende muss dieselbe Bewertung bekommen wie die Musterlösung (Task 4: Test „Schreibweise egal“).
- Schlüsselwörter in Zeichenketten (`'BEFORE INSERT'` in einer Fehlermeldung) dürfen keine Strukturprüfung erfüllen (Task 4: Test „Strings zählen nicht“).
- B-Baum: doppelte Schlüssel werden laut Folie ignoriert, nicht eingefügt (Task 6: Test „Duplikat stoppt“).
- Leere oder unvollständige Eingabe in Rechentrainern darf nicht als richtig zählen und nicht abstürzen (Tasks 6–8: Test „leere Eingabe“).
- Alter Fortschritt aus dem DBS1-Trainer (`dbt:progress`) darf den neuen nicht beschädigen (Task 3: Test „fremder Schlüssel wird ignoriert“).

---

### Task 1: Repo-Basis und Aufräumen

**Files:** Delete DBS1-Inhalte, -Seiten, `server/`, `scripts/`, `src/dashboard`, `src/logic` (alt), `src/exam` (alt), Analytics, Consent, SCORM, Branding/Logos, Pages- und Release-Workflow. Modify `package.json` (name `dbs2-trainer`, ohne Script `package`), `src/config.ts` (appName `DBS2-Trainer`, tagline, `languageSwitcher: false`, footerLinks nur Original-Quelle, ohne repo/analytics/feedback-Felder), `public/config.json` (nur `title`, `theme: "th-koeln"`), `README.md`, `LICENSE`, `LICENSE-CONTENT.md`. Create `.github/workflows/ci.yml` (`npm ci`, `npm test`, `npm run build`).

- [ ] Step 1: Löschen und Konfiguration anpassen.
- [ ] Step 2: `npx tsc --noEmit` zeigt nur noch Fehler in Dateien, die Tasks 3–13 neu schreiben.
- [ ] Step 3: Commit `chore: DBS1-Module und Plattformfunktionen entfernen`.

### Task 2: Oracle-Schicht für DBS2 (erledigt, nur verifizieren)

**Files:** Modify `src/sql/oracle.ts`; Test `src/sql/dbs2.test.ts`.

**Interfaces:** Produces `splitStatements(script): string[]` (PL/SQL-Blöcke bis `/` ganz), in `executeStatement`: `CREATE [OR REPLACE] VIEW`, `CREATE MATERIALIZED VIEW … BUILD/REFRESH/ON/START WITH … NEXT`, `EXEC DBMS_MVIEW.REFRESH('mv')` und `BEGIN DBMS_MVIEW.REFRESH('mv'); END;`, ON-COMMIT-Refresh, `ALTER TABLE|MATERIALIZED VIEW x INMEMORY …`, `CREATE [UNIQUE|BITMAP] INDEX`, `SET SERVEROUTPUT ON` (ok), sonst PL/SQL → `ok:false` mit Hinweis.

- [ ] Step 1: `npx vitest run src/sql` → 10 Tests PASS.
- [ ] Step 2: Commit `feat(sql): Views, Materialized Views, Indexe und PL/SQL-Bloecke`.

### Task 3: Kapitel, Themen, Fortschritt

**Files:** Create `src/content/chapters.ts` (vorhanden: `BUILTIN_CHAPTERS`, `CHAPTER_NAME`, `CHAPTER_SHORT`, `ExamMode`, `EXAM_MODES`), `src/content/topics.ts` (vorhanden, 29 Themen). Modify `src/progress.ts` (SCORM raus, Schlüssel `dbs2:progress`, `ExamAttempt` bekommt `mode: ExamMode`, `isFull(e) = e.m >= EXAM_MODES[e.mode].minutes`, `passed(e)` = 60 % bei `mct1|mct2`, 50 % bei `klausur`). Rewrite `src/progressCatalog.ts`. Test `src/progress.test.ts`.

**Interfaces:**
- Produces `catalog: {id: string; topicId: string; kind: 'uebung'|'frage'}[]` mit Präfixen `mc:`, `code:`, `sql:`, `calc:btree`, `calc:bitmap`, `calc:komp:<verfahren>`.
- Produces `practiceHref: Record<Chapter,string>` = `01 '#/rechnen'`, `02 '#/code?k=02'`, `03 '#/code?k=03'`, `04 '#/views'`, `05 '#/rechnen/kompression'`, `06 '#/lernen'`, `07 '#/lernen'`.
- Produces `passStreak(exams, mode)`, `readiness(d)` je Modus: bereit, wenn letzte 2 vollständigen Versuche jedes Modus bestanden und 80 % der Fragen sicher.

- [ ] Step 1: Tests: `passed` mit 59 %/60 % (MCT) und 49 %/50 % (Klausur); `loadLocal` ignoriert Daten unter `dbt:progress`; `catalog` enthält für jedes Thema mindestens einen Eintrag.
- [ ] Step 2: FAIL, dann implementieren, PASS.
- [ ] Step 3: Commit.

### Task 4: Code-Aufgaben-Bewertung

**Files:** Create `src/content/codeTypes.ts`, `src/logic/codeGrading.ts`; Test `src/logic/codeGrading.test.ts`.

**Interfaces:**
```ts
export interface CodeCheck { label: string; hint: string; all?: string[]; any?: string[]; none?: string[]; points?: number }
export interface CodeTask {
  id: string; topicId: string; title: string; level: 1|2|3;
  scenario: 'coworkers'|'lizenz'|'honig'|'hotel'|'imdb'|'members'|'chat'|'keins';
  task: string; hints: string[]; solution: string; checks: CodeCheck[];
  /** Beispiele falscher Lösungen; jede muss mindestens eine Prüfung verfehlen */
  wrong?: string[]; exam?: boolean; points?: number; source: string;
}
export function normalizeCode(code: string): string      // Kommentare raus, Strings durch '…' ersetzt, Whitespace zu ' ', Großbuchstaben
export function syntaxChecks(code: string): CheckResult[] // BEGIN/END-, IF/END IF-, LOOP/END LOOP-Bilanz, gerade Anzahl ', Abschluss mit END;
export function gradeCode(task: CodeTask, code: string): { checks: CheckResult[]; passed: boolean; score: number; max: number }
```
Regex-Quellen in `all/any/none` werden gegen `normalizeCode` mit Flags `su` geprüft (also in Großbuchstaben schreiben). `score` = Summe `points ?? 1` bestandener Fachprüfungen; Syntaxprüfungen zählen für `passed`, nicht für `score`. `CheckResult` kommt aus `src/sql/ddlGrading.ts`.

- [ ] Step 1: Tests: „Schreibweise egal“ (Kleinbuchstaben + Kommentare + `/` → gleiche Checks wie Original), „Strings zählen nicht“ (`RAISE_APPLICATION_ERROR(-20001,'BEFORE INSERT')` erfüllt kein `BEFORE INSERT`), „leerer Code besteht nicht“, Syntaxbilanz meldet fehlendes `END IF`, Compound-Trigger (`END AFTER EACH ROW;`) wird nicht als Fehler gemeldet.
- [ ] Step 2: FAIL → implementieren → PASS. Commit.

### Task 5: Code-Aufgaben-Seiten

**Files:** Create `src/pages/CodeList.tsx`, `src/pages/CodePage.tsx`, `src/content/schemas.ts` (Relationenschemata als Text je `scenario`, Kennzeichnung „rekonstruiert, Spalten mit DESC prüfen“). Modify `src/components/EditorExercise.tsx` (Tracking raus; optional `runLabel`, bei Code-Aufgaben nur Knopf „Prüfen“, keine Ausgabe-Box ohne Ergebnisse).

**Interfaces:** Route `#/code` (Liste, Filter Kapitel/Thema/Schwierigkeit), `#/code/<id>`. Fortschritt `code:<id>` über `markDone`.

- [ ] Step 1: Seiten bauen mit `EditorExercise`, `run = (code) => ({ results: [], ...gradeCode(task, code) })`.
- [ ] Step 2: `npm run build` grün; im Browser eine Aufgabe mit Musterlösung prüfen → alle Häkchen.
- [ ] Step 3: Commit.

### Task 6: Rechentrainer B-Baum

**Files:** Create `src/logic/btree.ts`, Test `src/logic/btree.test.ts`, Page `src/pages/BTreePage.tsx`.

**Interfaces:**
```ts
export type BNode = { keys: number[]; children: BNode[] };
export function insert(root: BNode | null, key: number, m: number): { root: BNode; split: boolean; duplicate: boolean };
export function build(keys: number[], m: number, start?: BNode | null): BNode;
export function levels(root: BNode): number[][][];          // Ebene → Knoten → Schlüssel
export function format(root: BNode): string;                // je Ebene eine Zeile, Knoten "[3 5] [9]"
export function parseLevels(text: string): number[][][] | null;
```
Regel laut Folie: höchstens 2m Records, bei 2m+1 wandert der mittlere Record nach oben, links/rechts werden neue Knoten, Split setzt sich nach oben fort, neue Wurzel bei Bedarf. Duplikat → kein Einfügen.

- [ ] Step 1: Tests: Folienbeispiel m=1 (Baum `[7 15] / [3 5] [9 13] [25]` + 14 → `[13] / [7] [15] / [3 5] [9] [14] [25]`); Übung 1 m=1 und m=2 jeweils aus leerem Baum stabil; Duplikat stoppt; `parseLevels('')` → null.
- [ ] Step 2: FAIL → implementieren → PASS.
- [ ] Step 3: Seite: Modus „Übungsblatt“ (Werte aus Übung 1) und „Zufall“ (m ∈ {1,2}, 5–8 Werte); Eingabe des Endbaums ebenenweise, Prüfen mit Diff je Ebene, „Schritt für Schritt zeigen“. Fortschritt `calc:btree` per `recordItem`. Commit.

### Task 7: Rechentrainer Bitmap-Index

**Files:** Create `src/logic/bitmap.ts` (`bitmapIndex(values: string[]): {value: string; bits: string}[]`, Reihenfolge wie erstes Vorkommen), Test, Page `src/pages/BitmapPage.tsx`.

- [ ] Step 1: Tests: Folienbeispiel Wohnort `Dortmund, Berlin, Köln, Berlin` → Berlin `0101`, Dortmund `1000`, Köln `0010`; Übung 1 Thema → Alles `1000`, Videospiele `0101`, Lernen `0010`; leere Eingabe bewertet falsch.
- [ ] Step 2: implementieren, Seite mit Zufallstabelle (4–8 Zeilen, 2–4 Werte) und Bit-Eingabefeldern; zusätzlich SQL-Feld „CREATE BITMAP INDEX“ geprüft per Regex. Fortschritt `calc:bitmap`. Commit.

### Task 8: Rechentrainer Komprimierung

**Files:** Create `src/logic/compression.ts`, Test, Page `src/pages/CompressionPage.tsx`.

**Interfaces:**
```ts
export type Verfahren = 'lauflaenge' | 'bitvektor' | 'dictionary' | 'for' | 'differenz';
export function runLength(v: string[]): [string, number, number][];             // (Wert, Start ab 1, Länge)
export function bitVector(v: string[]): { value: string; bits: string }[];
export function dictionary(v: string[]): { dict: [number, string][]; codes: number[] };  // Schlüssel ab 0, Reihenfolge erstes Vorkommen
export function frameOfReference(v: number[], ref: number): number[];          // Differenz zum Referenzwert
export function differential(v: number[]): { start: number; diffs: number[] }; // Differenz zum Vorgänger
export function recommend(v: string[]): Verfahren;                              // Entscheidungsbaum Folie 19, vereinfacht
```
- [ ] Step 1: Tests mit den fünf Datengruppen aus Übung „Column Stores“: Zeitstempel → `differenz`, Q1–Q3 → `lauflaenge` mit `[['Q1',1,5],['Q2',6,3],['Q3',9,6]]`, f/m/d → `bitvektor`, 117–128 → `for`, Jahre → `dictionary`.
- [ ] Step 2: implementieren; Seite: erst Verfahren wählen, dann Ergebnis eingeben (Format je Verfahren mit Platzhalter), Prüfen, Lösung zeigen; Modi Übungsblatt/Zufall. Fortschritt `calc:komp:<verfahren>`. Commit.

### Task 9: Szenarien und View-Aufgaben

**Files:** Create `src/content/scenarios/coworkers.ts`, `honig.ts`, `hotel.ts` (Schema, Datenbestand A und abweichender B, DATE-Literale `DATE 'JJJJ-MM-TT'`). Rewrite `src/content/scenarios.ts` (`scenarios`, `scenarioById`, `LEVEL_NAME`). Modify `src/content/sqlTypes.ts` (`kind: 'dql'|'view'`, `setup?: string`, `view?: string`), `src/sql/sqlGrading.ts` (`gradeView`: Skript ausführen, View `ex.view` muss existieren, `SELECT * FROM view` gegen Musterlösung auf A und B; `setup` vor jedem Lauf), `src/pages/SqlList.tsx` (Titel „Views“, Route `#/views`), `src/pages/SqlExercisePage.tsx`, `src/pages/Playground.tsx` (Szenario-Auswahl, Hinweis auf MV-Emulation). Create `src/content/viewExercises.ts` (≥ 8: Honig-View 4a/4b, project_lead_data, Durchschnittsalter je Topic, Hotel-Kunde-Stadt, DISTINCT-Abfrage Anna Schneider, Aggregat-View für Analysten, View auf Coworkers ohne Gehalt). Test `src/content/views.test.ts`.

- [ ] Step 1: Tests: jede Musterlösung besteht `runSqlExercise`, leere Abgabe nicht, jede `dql`-Musterlösung liefert auf A und B unterschiedliche Ergebnisse, Szenarien laden fehlerfrei.
- [ ] Step 2: FAIL → implementieren → PASS. Commit.

### Task 10: Wissensfragen

**Files:** Create `src/content/fragen/k01.ts` … `k07.ts`; Rewrite `src/content/mcQuestions.ts` (Typ `McQuestion` wie bisher plus `source`, Re-Export von `CHAPTER_NAME`, `BUILTIN_CHAPTERS`); Test `src/content/questions.test.ts`.

- [ ] Step 1: Tests: IDs eindeutig, `correct` gültig und nicht leer, `multi` genau dann wenn mehrere richtig, jede `topicId` existiert, jedes Thema ≥ 3 Fragen, jedes Kapitel ≥ 20 Fragen, Übung 8 (NoSQL-Quiz) vollständig enthalten.
- [ ] Step 2: Fragen schreiben (eigenständig, aus Folien und Spickzettel; Erklärung je Frage). Commit.

### Task 11: Code-Aufgaben-Inhalte

**Files:** Create `src/content/code/k01.ts` (Indexe), `k02.ts` (PL/SQL, Übung 2a/2b, Folienbeispiele), `k03.ts` (Trigger, Übung 3a/3b, Hörsaalübungen, Lizenz-Trigger 1–3), `k04.ts` (MV, INSTEAD OF, Übung 4, Altklausur 2), `k05.ts` (INMEMORY, Übung 5), `src/content/codeTasks.ts` (Sammlung). Test `src/content/codeTasks.test.ts`.

- [ ] Step 1: Tests: jede Musterlösung besteht `gradeCode`, leerer Code nicht, jede `wrong`-Variante verfehlt ≥ 1 Check, jedes Code-Thema ≥ 2 Aufgaben, ≥ 3 Aufgaben je Klausurtyp mit `exam: true` (Trigger, MV, Prozedur) inkl. Altklausur 1–3.
- [ ] Step 2: Aufgaben schreiben (≥ 30). Commit.

### Task 12: Prüfungsmodus

**Files:** Create `src/exam/exam.ts`, Test `src/exam/exam.test.ts`, Page `src/pages/ExamPage.tsx`.

**Interfaces:**
```ts
export interface ExamItem { kind: 'mc'; q: McQuestion; points: number } | { kind: 'code'; t: CodeTask; points: number };
export function buildExam(mode: ExamMode, seed: number): ExamItem[];  // mct*: 20 Fragen gleichmäßig über die Kapitel, 5 Punkte; klausur: je 1 Trigger, MV, Prozedur (exam: true), Punkte aus task.points
export function gradeExam(items: ExamItem[], answers: Record<number, number[] | string>): { points: number; max: number; perChapter: Record<string,[number,number]>; results: {id: string; right: boolean}[] };
```
MC: volle Punkte nur bei exakt richtiger Auswahl. Code: `points * score / max`, gerundet auf 0,5.

- [ ] Step 1: Tests: gleicher Seed → gleiche Klausur; Musterantworten → volle Punkte je Modus; leere Abgabe → 0; MCT 1 enthält nur Kapitel 01/02.
- [ ] Step 2: implementieren; Seite: Moduswahl, Timer (mit/ohne Limit), eine Aufgabe je Seite, Abgabe, Auswertung je Kapitel, Musterlösungen. `recordExam`. Commit.

### Task 13: Startseite, Navigation, Fortschritt, README

**Files:** Modify `src/App.tsx` (Routen `#/`, `#/lernen[/thema]`, `#/code[/id]`, `#/views[/id]`, `#/spielwiese`, `#/rechnen`, `#/rechnen/bbaum|bitmap|kompression`, `#/pruefung`, `#/fortschritt`), `src/pages/Home.tsx` (Kacheln je Kapitel + Prüfungen), `src/components/Layout.tsx` (Consent und Sprache raus), `src/pages/ProgressPage.tsx` (Bereitschaft je Modus, Consent raus), `src/pages/LearnPage.tsx` (Tracking raus), `src/main.tsx`, `README.md`.

- [ ] Step 1: `npm test` und `npm run build` grün.
- [ ] Step 2: Playwright-Rundgang (Startseite, je eine Seite pro Route) ohne Konsolenfehler, Screenshots für Joel.
- [ ] Step 3: Commit, Branch `dbs2-v1` pushen, PR nach `main`.
