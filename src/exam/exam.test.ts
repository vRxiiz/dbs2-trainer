import { describe, expect, it } from 'vitest';
import { EXAM_MODES, type ExamMode } from '../content/chapters';
import { buildExam, gradeEstimate, gradeExam, type Answer, type ExamItem } from './exam';

const perfect = (items: ExamItem[]): Record<string, Answer> =>
  Object.fromEntries(items.map((i) => [i.id, i.kind === 'mc' ? i.q.correct : i.t.solution]));

describe('Prüfungsmodus', () => {
  it('gleicher Seed ergibt dieselbe Klausur, anderer Seed eine andere', () => {
    const ids = (s: number) => buildExam('mct2', s).map((i) => i.id);
    expect(ids(42)).toEqual(ids(42));
    expect(ids(42)).not.toEqual(ids(43));
  });

  it('MCT: 20 Fragen zu je 5 Punkten, nur aus den Kapiteln des Modus, gleichmäßig verteilt', () => {
    for (const mode of ['mct1', 'mct2'] as const) {
      const items = buildExam(mode, 7);
      expect(items).toHaveLength(20);
      expect(new Set(items.map((i) => i.id)).size).toBe(20);
      expect(items.every((i) => i.kind === 'mc' && i.points === 5)).toBe(true);
      expect(items.every((i) => EXAM_MODES[mode].chapters.includes(i.chapter))).toBe(true);
      const per = EXAM_MODES[mode].chapters.map((c) => items.filter((i) => i.chapter === c).length);
      expect(Math.max(...per) - Math.min(...per)).toBeLessThanOrEqual(1);
    }
  });

  it('E-Klausur: je eine Prozedur-, Trigger- und MV-Aufgabe mit ihren Punkten', () => {
    const items = buildExam('klausur', 3);
    expect(items.map((i) => i.kind)).toEqual(['code', 'code', 'code']);
    expect(items[0].chapter).toBe('03');
    expect(['04', '05']).toContain(items[1].chapter);
    expect(items[2].chapter).toBe('02');
    for (const i of items) {
      expect(i.kind === 'code' && i.t.exam).toBe(true);
      expect(i.points).toBe(i.kind === 'code' ? i.t.points : 0);
    }
  });

  it('Musterantworten geben volle Punkte, leere Abgabe 0', () => {
    for (const mode of Object.keys(EXAM_MODES) as ExamMode[]) {
      for (const seed of [1, 2, 3]) {
        const items = buildExam(mode, seed);
        const full = gradeExam(items, perfect(items));
        expect(full.points).toBe(full.max);
        expect(full.results.every((r) => r.right)).toBe(true);
        const empty = gradeExam(items, {});
        expect(empty.points).toBe(0);
        expect(empty.results.some((r) => r.right)).toBe(false);
      }
    }
  });

  it('MC nur bei exakt richtiger Auswahl, Code anteilig auf halbe Punkte gerundet', () => {
    const items = buildExam('mct1', 5);
    const q = items[0];
    if (q.kind !== 'mc') throw new Error('erwartet MC');
    const wrong = q.q.options.map((_, i) => i).filter((i) => !q.q.correct.includes(i)).slice(0, 1);
    expect(gradeExam([q], { [q.id]: [...q.q.correct, ...wrong] }).points).toBe(0);

    const k = buildExam('klausur', 5);
    const answers = perfect(k);
    const t = k[0];
    if (t.kind !== 'code') throw new Error('erwartet Code');
    answers[t.id] = t.t.wrong![0];
    const g = gradeExam(k, answers);
    expect(g.points).toBeLessThan(g.max);
    expect(g.points * 2).toBe(Math.round(g.points * 2));
    expect(g.perChapter[t.chapter][1]).toBe(t.points);
  });

  it('Notenorientierung ab 50 %', () => {
    expect(gradeEstimate(100)).toBe('1,0');
    expect(gradeEstimate(50)).toBe('4,0');
    expect(gradeEstimate(49.9)).toBe('5,0');
  });
});
