import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { runSqlExercise, scenarioDb, viewResult } from '../sql/sqlGrading';
import { scenarios } from './scenarios';
import { topicById } from './topics';
import { viewExercises } from './viewExercises';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Szenarien', () => {
  it('laden fehlerfrei mit beiden Datenbeständen', () => {
    for (const s of scenarios) for (const d of ['A', 'B'] as const) scenarioDb(SQL, s.id, d).close();
  });
});

describe('View-Aufgaben', () => {
  it('mindestens 8, IDs eindeutig, Themen gültig', () => {
    expect(viewExercises.length).toBeGreaterThanOrEqual(8);
    expect(new Set(viewExercises.map((e) => e.id)).size).toBe(viewExercises.length);
    for (const e of viewExercises) expect(topicById(e.topicId), e.id).toBeDefined();
  });
  it('jede Musterlösung besteht', () => {
    for (const e of viewExercises) {
      const r = runSqlExercise(SQL, e, e.solution);
      expect(r.checks.filter((c) => !c.ok), e.id).toEqual([]);
    }
  });
  it('leere Abgabe besteht nicht', () => {
    for (const e of viewExercises) expect(runSqlExercise(SQL, e, '').passed, e.id).toBe(false);
  });
  it('Musterlösung liefert auf A und B unterschiedliche Ergebnisse', () => {
    for (const e of viewExercises) {
      const a = viewResult(SQL, e, 'A', e.solution);
      const b = viewResult(SQL, e, 'B', e.solution);
      expect(JSON.stringify(a.rows), e.id).not.toBe(JSON.stringify(b.rows));
      expect(a.rows.length, e.id).toBeGreaterThan(0);
    }
  });
  it('normale View statt Materialized View wird erkannt', () => {
    const e = viewExercises.find((x) => /MATERIALIZED/i.test(x.solution) && x.kind === 'view')!;
    const plain = e.solution.replace(/CREATE\s+MATERIALIZED\s+VIEW\s+(\w+)[\s\S]*?\bAS\s+SELECT/i, 'CREATE VIEW $1 AS SELECT');
    expect(runSqlExercise(SQL, e, plain).passed).toBe(false);
  });
});
