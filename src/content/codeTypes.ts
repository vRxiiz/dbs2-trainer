// Code-Aufgaben (PL/SQL, Trigger, Materialized Views): freies Schreiben, Strukturpruefung
// gegen Pflichtbausteine, danach Musterloesung.

export interface CodeCheck {
  label: string;
  hint: string;
  /** Regex-Quellen (Grossbuchstaben), die alle vorkommen muessen */
  all?: string[];
  /** Regex-Quellen, von denen mindestens eine vorkommen muss */
  any?: string[];
  /** Regex-Quellen, die nicht vorkommen duerfen */
  none?: string[];
  points?: number;
}

export interface CodeTask {
  id: string;
  topicId: string;
  title: string;
  level: 1 | 2 | 3;
  scenario: 'coworkers' | 'lizenz' | 'honig' | 'hotel' | 'imdb' | 'members' | 'chat' | 'keins';
  task: string;
  hints: string[];
  solution: string;
  checks: CodeCheck[];
  /** Beispiele falscher Loesungen; jede muss mindestens eine Pruefung verfehlen */
  wrong?: string[];
  exam?: boolean;
  points?: number;
  source: string;
}
