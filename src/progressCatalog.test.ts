import { describe, expect, it } from 'vitest';
import type { ExamAttempt, ProgressData } from './progress';
import { topics } from './content/topics';
import { catalog, practiceHref, readiness } from './progressCatalog';

const full = (mode: ExamAttempt['mode'], p: number, i: number): ExamAttempt => ({
  id: `${mode}-${i}`, t: i, m: 90, c: [], p, x: 100, k: {}, mode,
});
const data = (exams: ExamAttempt[]): ProgressData => ({ v: 1, done: [], items: {}, exams });

describe('Katalog', () => {
  it('jedes Thema der Folien hat mindestens eine Frage oder Übung', () => {
    const empty = topics.filter((t) => !catalog.some((c) => c.topicId === t.id)).map((t) => t.id);
    expect(empty).toEqual([]);
  });

  it('enthält die Rechentrainer mit ihren Themen', () => {
    const topic = (id: string) => catalog.find((c) => c.id === id)?.topicId;
    expect(topic('calc:btree')).toBe('01-bbaum');
    expect(topic('calc:bitmap')).toBe('01-bitmap');
    for (const v of ['lauflaenge', 'bitvektor', 'dictionary', 'for', 'differenz'])
      expect(topic(`calc:komp:${v}`)).toBe('05-kompression');
  });
  it('verlinkt jedes Kapitel auf eine Übungsseite', () => {
    expect(practiceHref['01']).toBe('#/rechnen');
    expect(practiceHref['02']).toBe('#/code/kapitel/02');
    expect(practiceHref['04']).toBe('#/views');
    expect(practiceHref['07']).toBe('#/lernen');
  });
});

describe('Prüfungsreife', () => {
  it('nicht bereit ohne Versuche', () => {
    expect(readiness(data([])).mct1.ready).toBe(false);
  });
  it('bereit je Modus nach zwei bestandenen vollständigen Versuchen', () => {
    const r = readiness(data([full('mct1', 70, 1), full('mct1', 65, 2), full('mct2', 40, 3)]));
    expect(r.mct1.streak).toBe(2);
    expect(r.mct2.ready).toBe(false);
  });
  it('E-Klausur: in der Übung gelöste Klausuraufgaben zählen als sicher, außer zuletzt falsch', () => {
    const ids = catalog.filter((c) => c.id.startsWith('code:')).map((c) => c.id);
    const exam = ['code:zimmer-verfuegbarkeit', 'code:buchungen-pro-stadt'];
    expect(exam.every((id) => ids.includes(id))).toBe(true);
    const d: ProgressData = { v: 1, done: exam, items: { 'code:buchungen-pro-stadt': [3, 1, 0, 5] }, exams: [] };
    const solved = readiness(d).klausur.sure;
    const none = readiness(data([])).klausur.sure;
    expect(solved).toBeGreaterThan(none);
    // eine geloeste, eine zuletzt falsch: genau eine zaehlt
    const one = readiness({ ...d, done: [exam[0]] }).klausur.sure;
    expect(solved).toBeCloseTo(one);
  });
});
