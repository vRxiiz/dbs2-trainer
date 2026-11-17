// Welche Uebungen und Wissensfragen gehoeren zu welchem Kapitel und Thema?
import { config } from './config';
import { BUILTIN_CHAPTERS, EXAM_MODES, type Chapter, type ExamMode } from './content/chapters';
import { codeTasks } from './content/codeTasks';
import { mcQuestions } from './content/mcQuestions';
import { topicById, topics } from './content/topics';
import { viewExercises } from './content/viewExercises';
import { mastery, passStreak, type ProgressData } from './progress';

export const CHAPTERS: Chapter[] = [...BUILTIN_CHAPTERS];

/** Verfahren des Kompressions-Trainers */
export const KOMP_VERFAHREN = ['lauflaenge', 'bitvektor', 'dictionary', 'for', 'differenz'] as const;

export type CatalogItem = { id: string; topicId: string; kind: 'uebung' | 'frage' };

/** Weitere Uebungen (z. B. SQL-Aufgaben zu Views), von den Inhaltsdateien registriert */
const extra: CatalogItem[] = [];

/** Alle Fortschritts-IDs mit Thema (Uebungen und Wissensfragen) */
export const catalog: CatalogItem[] = [];

const buildCatalog = (): CatalogItem[] => [
  ...mcQuestions.map((q) => ({ id: `mc:${q.id}`, topicId: q.topicId, kind: 'frage' as const })),
  ...codeTasks.map((t) => ({ id: `code:${t.id}`, topicId: t.topicId, kind: 'uebung' as const })),
  ...viewExercises.map((e) => ({ id: `sql:${e.id}`, topicId: e.topicId, kind: 'uebung' as const })),
  { id: 'calc:btree', topicId: '01-bbaum', kind: 'uebung' },
  { id: 'calc:bitmap', topicId: '01-bitmap', kind: 'uebung' },
  ...KOMP_VERFAHREN.map((v) => ({ id: `calc:komp:${v}`, topicId: '05-kompression', kind: 'uebung' as const })),
  ...extra,
];

export const topicOfItem = (id: string) => catalog.find((c) => c.id === id)?.topicId;

const chapterOf = (topicId: string) => topicById(topicId)?.chapter;

export const practiceIds: Record<string, string[]> = {};
export const questionIds: Record<string, string[]> = {};

export const itemsOfTopic = (topicId: string) => catalog.filter((i) => i.topicId === topicId);

export const practiceHref: Record<Chapter, string> = {
  '01': '#/rechnen',
  '02': '#/code/kapitel/02',
  '03': '#/code/kapitel/03',
  '04': '#/views',
  '05': '#/rechnen/kompression',
  '06': '#/lernen',
  '07': '#/lernen',
};

/** Wo uebt man ein Thema? Bei reinen Wissensthemen: Fragen lernen zu diesem Thema */
export function topicHref(topicId: string): string {
  const t = topicById(topicId);
  if (!t) return '#/';
  const hasPractice = itemsOfTopic(topicId).some((i) => i.kind === 'uebung');
  return hasPractice ? practiceHref[t.chapter] : `#/lernen/${topicId}`;
}

export { topics };

/** Katalog, Kapitel-Zuordnung und Links neu aufbauen */
export function rebuildCatalog() {
  catalog.length = 0;
  catalog.push(...buildCatalog());
  for (const c of CHAPTERS) {
    practiceIds[c] = catalog.filter((i) => i.kind === 'uebung' && chapterOf(i.topicId) === c).map((i) => i.id);
    questionIds[c] = catalog.filter((i) => i.kind === 'frage' && chapterOf(i.topicId) === c).map((i) => i.id);
    practiceHref[c] ??= '#/lernen';
  }
}

/** Weitere Uebungen eintragen (z. B. SQL-Aufgaben) und den Katalog neu aufbauen */
export function registerPractice(items: CatalogItem[]) {
  extra.push(...items.filter((i) => !extra.some((e) => e.id === i.id)));
  rebuildCatalog();
}

rebuildCatalog();

/* ---------------- Pruefungsreife je Modus ---------------- */

export interface Readiness {
  /** bestandene vollstaendige Versuche in Folge */
  streak: number;
  /** Anteil sicher beantworteter Aufgaben des Modus (0..1) */
  sure: number;
  ready: boolean;
}

/** Aufgaben, die in einem Pruefungsmodus vorkommen koennen */
export function examItemIds(mode: ExamMode): string[] {
  if (mode === 'klausur') return codeTasks.filter((t) => t.exam).map((t) => `code:${t.id}`);
  return EXAM_MODES[mode].chapters.flatMap((c) => questionIds[c] ?? []);
}

/** Bereit, wenn die letzten readyStreak vollstaendigen Versuche bestanden und readySureShare der Aufgaben sicher sind */
export function readiness(d: ProgressData): Record<ExamMode, Readiness> {
  const out = {} as Record<ExamMode, Readiness>;
  for (const mode of Object.keys(EXAM_MODES) as ExamMode[]) {
    const ids = examItemIds(mode);
    const sure = ids.length ? ids.filter((id) => mastery(d.items[id]) === 'sicher').length / ids.length : 1;
    const streak = passStreak(d.exams, mode);
    out[mode] = { streak, sure, ready: streak >= config.readyStreak && sure >= config.readySureShare };
  }
  return out;
}
