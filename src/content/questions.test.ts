import { describe, expect, it } from 'vitest';
import { BUILTIN_CHAPTERS } from './chapters';
import { mcQuestions } from './mcQuestions';
import { topicById, topics } from './topics';

describe('Wissensfragen', () => {
  it('IDs sind eindeutig', () => {
    expect(new Set(mcQuestions.map((q) => q.id)).size).toBe(mcQuestions.length);
  });
  it('correct ist gültig und nicht leer, multi genau bei mehreren richtigen', () => {
    for (const q of mcQuestions) {
      expect(q.correct.length, q.id).toBeGreaterThan(0);
      expect(new Set(q.correct).size, q.id).toBe(q.correct.length);
      for (const c of q.correct) expect(c >= 0 && c < q.options.length, q.id).toBe(true);
      expect(!!q.multi, q.id).toBe(q.correct.length > 1);
      expect(new Set(q.options).size, `${q.id}: doppelte Option`).toBe(q.options.length);
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
    }
  });
  it('jede topicId existiert und passt zum Kapitel', () => {
    for (const q of mcQuestions) {
      expect(topicById(q.topicId), q.id).toBeDefined();
      expect(topicById(q.topicId)!.chapter, q.id).toBe(q.chapter);
    }
  });
  it('jedes Thema hat mindestens 3 Fragen', () => {
    for (const t of topics) expect(mcQuestions.filter((q) => q.topicId === t.id).length, t.id).toBeGreaterThanOrEqual(3);
  });
  it('jedes Kapitel hat mindestens 20 Fragen', () => {
    for (const c of BUILTIN_CHAPTERS) expect(mcQuestions.filter((q) => q.chapter === c).length, c).toBeGreaterThanOrEqual(20);
  });
  it('Übung 8 (NoSQL-Quiz) ist vollständig enthalten', () => {
    const u8 = mcQuestions.filter((q) => q.source.startsWith('Übung 8'));
    expect(u8.map((q) => q.source).sort()).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => `Übung 8, Frage ${n}`).sort());
  });
});
