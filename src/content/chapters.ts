// Kapitel des Moduls DBS2 (Datenbanken und Datenmanagement, TH Koeln) in Vorlesungsreihenfolge
// und die Zuordnung zu den Pruefungen (laut Formalitaeten-Folien, SoSe 2026).

export type Chapter = string;

export const BUILTIN_CHAPTERS: Chapter[] = ['01', '02', '03', '04', '05', '06', '07'];

export const CHAPTER_NAME: Record<string, string> = {
  '01': 'Speicherstrukturen und Indexierung',
  '02': 'PL/SQL',
  '03': 'Trigger',
  '04': 'Views und Materialized Views',
  '05': 'Column Store und In-Memory',
  '06': 'Kopplungstechniken',
  '07': 'NoSQL',
};

export const CHAPTER_SHORT: Record<string, string> = {
  '01': 'Speicher',
  '02': 'PL/SQL',
  '03': 'Trigger',
  '04': 'Views',
  '05': 'Column Store',
  '06': 'Kopplung',
  '07': 'NoSQL',
};

export type ExamMode = 'mct1' | 'mct2' | 'klausur';

export const EXAM_MODES: Record<ExamMode, { name: string; chapters: Chapter[]; minutes: number; text: string }> = {
  mct1: {
    name: 'MCT 1',
    chapters: ['01', '02'],
    minutes: 30,
    text: 'Multiple-Choice-Test 1 im Praktikum: Speicherstrukturen und PL/SQL.',
  },
  mct2: {
    name: 'MCT 2',
    chapters: ['03', '04', '05', '06', '07'],
    minutes: 30,
    text: 'Multiple-Choice-Test 2 im Praktikum: von Trigger bis einschließlich NoSQL.',
  },
  klausur: {
    name: 'E-Klausur',
    chapters: ['02', '03', '04'],
    minutes: 90,
    text: 'E-Klausur im SQL Developer: drei Code-Aufgaben wie in der Altklausur (Trigger, Materialized View, Prozedur).',
  },
};

export const LEVEL_NAME = { 1: 'Leicht', 2: 'Mittel', 3: 'Klausurniveau' } as const;
