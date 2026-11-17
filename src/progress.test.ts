import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamAttempt } from './progress';

class MemoryStorage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

const attempt = (mode: ExamAttempt['mode'], p: number, x = 100, m = 90): ExamAttempt => ({
  id: `${mode}-${p}-${Math.random()}`, t: 1, m, c: [], p, x, k: {}, mode,
});

beforeEach(() => {
  vi.resetModules();
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

describe('Bestehensgrenzen', () => {
  it('MCT besteht ab 60 Prozent', async () => {
    const { passed } = await import('./progress');
    expect(passed(attempt('mct1', 59))).toBe(false);
    expect(passed(attempt('mct2', 60))).toBe(true);
  });
  it('E-Klausur besteht ab 50 Prozent', async () => {
    const { passed } = await import('./progress');
    expect(passed(attempt('klausur', 49))).toBe(false);
    expect(passed(attempt('klausur', 50))).toBe(true);
  });
  it('vollständig nur mit dem Zeitlimit des Modus', async () => {
    const { isFull } = await import('./progress');
    expect(isFull(attempt('mct1', 80, 100, 30))).toBe(true);
    expect(isFull(attempt('klausur', 80, 100, 30))).toBe(false);
  });
  it('Serie zählt je Modus', async () => {
    const { passStreak } = await import('./progress');
    const exams = [attempt('mct1', 90), attempt('klausur', 10), attempt('mct1', 70)];
    expect(passStreak(exams, 'mct1')).toBe(2);
    expect(passStreak(exams, 'klausur')).toBe(0);
  });
});

describe('Speicherort', () => {
  it('fremder Schlüssel wird ignoriert', async () => {
    localStorage.setItem('dbt:progress', JSON.stringify({ v: 1, done: ['sql:alt'], items: {}, exams: [] }));
    const { getProgress, markDone } = await import('./progress');
    expect(getProgress().done).toEqual([]);
    markDone('code:neu');
    expect(JSON.parse(localStorage.getItem('dbs2:progress')!).done).toEqual(['code:neu']);
    expect(JSON.parse(localStorage.getItem('dbt:progress')!).done).toEqual(['sql:alt']);
  });
});
