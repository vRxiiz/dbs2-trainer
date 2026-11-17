// Aufgabenformat fuer SQL-Aufgaben auf den Fall-Datenbanken. Bewertet wird das Ergebnis:
//   view: die angelegte View bzw. Materialized View (SELECT * darauf) im Vergleich zur Musterloesung
//   dql:  Ergebnismenge der Abfrage (z. B. auf eine View aus setup)
//   dml:  Tabelleninhalte nach dem Skript
// jeweils auf dem sichtbaren und einem verdeckten Datenbestand.

export interface SqlExercise {
  id: string;
  /** Thema nach den Vorlesungsfolien, siehe content/topics.ts */
  topicId: string;
  kind: 'dql' | 'dml' | 'view';
  /** Fall-Datenbank (content/scenarios.ts), Standard: coworkers */
  scenario?: string;
  title: string;
  topic: string;
  level: 1 | 2 | 3;
  task: string;
  hints: string[];
  solution: string;
  /** DQL: Reihenfolge der Zeilen ist Teil der Aufgabe (ORDER BY) */
  ordered?: boolean;
  starter?: string;
  /** Datensaetze, die in der Aufgabe vorgegeben werden (z. B. zum Einfuegen), als Tabellen */
  given?: { name: string; columns: string[]; rows: string[][] }[];
  /** Skript, das vor jedem Lauf ausgefuehrt wird (z. B. die View, auf die abgefragt wird) */
  setup?: string;
  /** view: Name der View/Materialized View, die angelegt werden soll */
  view?: string;
  source: string;
}
