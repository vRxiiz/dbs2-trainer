// Pruefungsmodus: Zusammenstellung, Speicherung und Bewertung einer Probeklausur.
// MCT 1/2: 20 Wissensfragen gleichmaessig ueber die Kapitel des Modus, je 5 Punkte.
// E-Klausur: je eine Trigger-, MV- und Prozedur-Aufgabe (wie die Altklausur), Punkte aus der Aufgabe.

import type { CodeTask } from '../content/codeTypes';
import { codeTasks } from '../content/codeTasks';
import { EXAM_MODES, type Chapter, type ExamMode } from '../content/chapters';
import { mcQuestions, type McQuestion } from '../content/mcQuestions';
import { topicById } from '../content/topics';
import { gradeCode } from '../logic/codeGrading';

export type ExamItem =
  | { kind: 'mc'; id: string; chapter: Chapter; points: number; q: McQuestion }
  | { kind: 'code'; id: string; chapter: Chapter; points: number; t: CodeTask };

/** MC: gewaehlte Optionen, Code: geschriebener Code */
export type Answer = number[] | string;

export interface ExamState {
  mode: ExamMode;
  /** 0 = ohne Zeitlimit */
  minutes: number;
  seed: number;
  startedAt: number;
  answers: Record<string, Answer>;
  submittedAt?: number;
}

export const MC_COUNT = 20;
export const MC_POINTS = 5;

/* ---------------- Zufall mit Seed (gleiche Klausur nach Reload) ---------------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], r: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const chapterOf = (topicId: string) => (topicById(topicId)?.chapter ?? topicId.slice(0, 2)) as Chapter;

const mcItem = (q: McQuestion): ExamItem => ({ kind: 'mc', id: `mc:${q.id}`, chapter: q.chapter, points: MC_POINTS, q });
const codeItem = (t: CodeTask): ExamItem => ({ kind: 'code', id: `code:${t.id}`, chapter: chapterOf(t.topicId), points: t.points ?? 0, t });

/** Aufgabentypen der E-Klausur in der Reihenfolge der Altklausur */
export const KLAUSUR_TYPES: { name: string; chapters: Chapter[] }[] = [
  { name: 'Trigger', chapters: ['03'] },
  { name: 'Materialized View', chapters: ['04', '05'] },
  { name: 'Prozedur', chapters: ['02'] },
];

/* ---------------- Zusammenstellung ---------------- */

export function buildExam(mode: ExamMode, seed: number): ExamItem[] {
  const r = rng(seed);
  if (mode === 'klausur') {
    const pool = codeTasks.filter((t) => t.exam);
    return KLAUSUR_TYPES.flatMap(({ chapters }) => {
      const [t] = shuffle(pool.filter((x) => chapters.includes(chapterOf(x.topicId))), r);
      return t ? [codeItem(t)] : [];
    });
  }
  const chapters = EXAM_MODES[mode].chapters;
  // gleichmaessig verteilen, der Rest geht an zufaellige Kapitel
  const base = Math.floor(MC_COUNT / chapters.length);
  const extra = new Set(shuffle(chapters, r).slice(0, MC_COUNT - base * chapters.length));
  const picked = chapters.flatMap((c) => shuffle(mcQuestions.filter((q) => q.chapter === c), r).slice(0, base + (extra.has(c) ? 1 : 0)));
  return picked.map(mcItem);
}

/* ---------------- Bewertung ---------------- */

export interface ItemResult {
  points: number;
  right: boolean;
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

export function gradeItem(item: ExamItem, answer: Answer | undefined): ItemResult {
  if (item.kind === 'mc') {
    const right = Array.isArray(answer) && sameSet([...new Set(answer)], item.q.correct);
    return { points: right ? item.points : 0, right };
  }
  const code = typeof answer === 'string' ? answer : '';
  if (!code.trim()) return { points: 0, right: false };
  const g = gradeCode(item.t, code);
  const points = g.max ? Math.round((2 * item.points * g.score) / g.max) / 2 : 0;
  return { points, right: points === item.points };
}

export function gradeExam(items: ExamItem[], answers: Record<string, Answer>) {
  const perChapter: Record<string, [number, number]> = {};
  const results = items.map((item) => {
    const r = gradeItem(item, answers[item.id]);
    const [p, x] = perChapter[item.chapter] ?? [0, 0];
    perChapter[item.chapter] = [p + r.points, x + item.points];
    return { id: item.id, ...r };
  });
  return {
    points: results.reduce((s, r) => s + r.points, 0),
    max: items.reduce((s, i) => s + i.points, 0),
    perChapter,
    results,
  };
}

/** Grobe Notenorientierung (lineare Skala ab 50 %), keine offizielle Bewertung */
export function gradeEstimate(percent: number): string {
  const table: [number, string][] = [
    [95, '1,0'],
    [90, '1,3'],
    [85, '1,7'],
    [80, '2,0'],
    [75, '2,3'],
    [70, '2,7'],
    [65, '3,0'],
    [60, '3,3'],
    [55, '3,7'],
    [50, '4,0'],
  ];
  return table.find(([p]) => percent >= p)?.[1] ?? '5,0';
}

/* ---------------- Speicherung ---------------- */

const KEY = 'dbs2:exam';
export function loadExam(): ExamState | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as ExamState) : null;
    return s && s.mode in EXAM_MODES ? s : null;
  } catch {
    return null;
  }
}
export function saveExam(s: ExamState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
}
