import { describe, expect, it } from 'vitest';
import { gradeCode } from '../logic/codeGrading';
import { codeTasks } from './codeTasks';
import { topicById } from './topics';

const chapter = (topicId: string) => topicById(topicId)?.chapter;

describe('Code-Aufgaben', () => {
  it('mindestens 30, IDs eindeutig, Themen gültig', () => {
    expect(codeTasks.length).toBeGreaterThanOrEqual(30);
    expect(new Set(codeTasks.map((t) => t.id)).size).toBe(codeTasks.length);
    for (const t of codeTasks) expect(topicById(t.topicId), t.id).toBeDefined();
  });
  it('jede Musterlösung besteht alle Prüfungen', () => {
    for (const t of codeTasks) {
      const r = gradeCode(t, t.solution);
      expect(r.checks.filter((c) => !c.ok).map((c) => c.label), t.id).toEqual([]);
      expect(r.score, t.id).toBe(r.max);
    }
  });
  it('leerer Code besteht nicht', () => {
    for (const t of codeTasks) expect(gradeCode(t, '').passed, t.id).toBe(false);
  });
  it('jede falsche Variante verfehlt mindestens eine Prüfung', () => {
    for (const t of codeTasks) for (const w of t.wrong ?? []) expect(gradeCode(t, w).passed, `${t.id}: ${w.slice(0, 60)}`).toBe(false);
  });
  it('jedes verwendete Thema hat mindestens 2 Aufgaben', () => {
    const used = [...new Set(codeTasks.map((t) => t.topicId))];
    for (const id of used) expect(codeTasks.filter((t) => t.topicId === id).length, id).toBeGreaterThanOrEqual(2);
  });
  it('je Klausurtyp mindestens 3 Aufgaben, Altklausur 1–3 enthalten', () => {
    const exam = codeTasks.filter((t) => t.exam);
    expect(exam.filter((t) => chapter(t.topicId) === '02').length).toBeGreaterThanOrEqual(3);
    expect(exam.filter((t) => chapter(t.topicId) === '03').length).toBeGreaterThanOrEqual(3);
    expect(exam.filter((t) => ['04', '05'].includes(chapter(t.topicId) ?? '')).length).toBeGreaterThanOrEqual(3);
    for (const n of [1, 2, 3]) expect(exam.some((t) => t.source.startsWith(`Altklausur, Aufgabe ${n}`)), `Altklausur ${n}`).toBe(true);
  });
  it('Klausuraufgaben: Punkte der Prüfungen ergeben die Aufgabenpunkte', () => {
    for (const t of codeTasks.filter((x) => x.exam)) {
      expect(t.points, t.id).toBeGreaterThan(0);
      expect(t.checks.reduce((s, c) => s + (c.points ?? 1), 0), t.id).toBe(t.points);
    }
  });
});
