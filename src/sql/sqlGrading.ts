import type { Database, SqlJsStatic } from 'sql.js';
import { scenarioById } from '../content/scenarios';
import type { SqlExercise } from '../content/sqlTypes';
import type { CheckResult } from './ddlGrading';
import { createDatabase, executeStatement, runScript, splitStatements, type StatementResult } from './oracle';
import { Session } from './session';

export interface ResultSet {
  columns: string[];
  rows: unknown[][];
}

export interface TableDiff {
  table: string;
  columns: string[];
  missing: unknown[][];
  extra: unknown[][];
}

export interface SqlRun {
  results: StatementResult[];
  checks: CheckResult[];
  passed: boolean;
  /** DQL: Vergleich auf Datenbestand A */
  actual?: ResultSet;
  expected?: ResultSet;
  /** DML: abweichende Tabellen auf Datenbestand A */
  diffs?: TableDiff[];
  /** DML: Tabellen, die die Musterloesung aendert */
  changed?: string[];
}

export type Dataset = 'A' | 'B';

/** Frische Datenbank eines Szenarios mit Datenbestand A (sichtbar) oder B (verdeckt) */
export function scenarioDb(SQL: SqlJsStatic, scenarioId: string | undefined, data: Dataset = 'A', setup = ''): Database {
  const sc = scenarioById(scenarioId);
  const db = createDatabase(SQL);
  const res = runScript(db, sc.schema + (data === 'A' ? sc.dataA : sc.dataB) + '\n' + setup);
  const bad = res.find((r) => !r.ok);
  if (bad) {
    db.close();
    throw new Error(`Fall-Datenbank ${sc.id}/${data} fehlerhaft: ${bad.sql} -> ${bad.message}`);
  }
  return db;
}

/* ---------------- Vergleich ---------------- */

const norm = (v: unknown) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v === undefined ? null : v);
const key = (row: unknown[]) => JSON.stringify(row.map(norm));

function multisetDiff(expected: unknown[][], actual: unknown[][]) {
  const count = new Map<string, number>();
  for (const r of actual) count.set(key(r), (count.get(key(r)) ?? 0) + 1);
  const missing: unknown[][] = [];
  for (const r of expected) {
    const k = key(r);
    const c = count.get(k) ?? 0;
    if (c > 0) count.set(k, c - 1);
    else missing.push(r);
  }
  const extra: unknown[][] = [];
  const left = new Map(count);
  for (const r of actual) {
    const k = key(r);
    const c = left.get(k) ?? 0;
    if (c > 0) {
      extra.push(r);
      left.set(k, c - 1);
    }
  }
  return { missing, extra };
}

function tableContent(db: Database, table: string): ResultSet {
  const q = db.prepare(`SELECT * FROM "${table}"`);
  const columns = q.getColumnNames();
  const rows: unknown[][] = [];
  while (q.step()) rows.push(q.get());
  q.free();
  return { columns, rows };
}

/* ---------------- DQL ---------------- */

function runSelect(SQL: SqlJsStatic, ex: SqlExercise, data: Dataset, sql: string): StatementResult {
  const db = scenarioDb(SQL, ex.scenario, data, ex.setup);
  try {
    return executeStatement(db, sql);
  } finally {
    db.close();
  }
}

function gradeDql(SQL: SqlJsStatic, ex: SqlExercise, script: string): SqlRun {
  const stmts = splitStatements(script);
  const checks: CheckResult[] = [];
  if (stmts.length !== 1 || !/^\s*(SELECT|WITH)\b/i.test(stmts[0])) {
    const results = stmts.length ? runSelectAll(SQL, ex, stmts) : [];
    return {
      results,
      checks: [{ label: 'Genau eine SELECT-Anweisung', ok: false, hint: `Gefunden: ${stmts.length} Anweisung(en). Die Lösung ist eine einzelne SELECT-Abfrage.` }],
      passed: false,
    };
  }
  const [stmt] = stmts;
  const userA = runSelect(SQL, ex, 'A', stmt);
  const refStmt = splitStatements(ex.solution)[0];
  const refA = runSelect(SQL, ex, 'A', refStmt);
  const expected = { columns: refA.columns ?? [], rows: refA.rows ?? [] };

  checks.push({ label: 'Abfrage läuft fehlerfrei', ok: userA.ok, hint: userA.ok ? undefined : `${userA.message}${userA.ora ? ` (${userA.ora})` : ''}` });
  if (!userA.ok) return { results: [userA], checks, passed: false, expected };

  const actual = { columns: userA.columns ?? [], rows: userA.rows ?? [] };
  const colOk = actual.columns.length === expected.columns.length;
  checks.push({
    label: 'Richtige Anzahl Spalten',
    ok: colOk,
    hint: colOk ? undefined : `Deine Abfrage liefert ${actual.columns.length} Spalte(n), erwartet sind ${expected.columns.length}.`,
  });
  const d = multisetDiff(expected.rows, actual.rows);
  const rowsOk = colOk && d.missing.length === 0 && d.extra.length === 0;
  checks.push({
    label: 'Richtige Zeilen',
    ok: rowsOk,
    hint: rowsOk
      ? undefined
      : !colOk
        ? 'Erst die Spalten richtig wählen.'
        : `${d.missing.length} erwartete Zeile(n) fehlen, ${d.extra.length} Zeile(n) sind zu viel.`,
  });
  if (ex.ordered) {
    const orderOk = rowsOk && actual.rows.every((r, i) => key(r) === key(expected.rows[i]));
    checks.push({ label: 'Richtige Reihenfolge', ok: orderOk, hint: orderOk ? undefined : 'Die Zeilen stimmen, aber die Sortierung nicht.' });
  }
  if (checks.every((c) => c.ok)) {
    const userB = runSelect(SQL, ex, 'B', stmt);
    const refB = runSelect(SQL, ex, 'B', refStmt);
    const dB = multisetDiff(refB.rows ?? [], userB.rows ?? []);
    const okB =
      userB.ok &&
      dB.missing.length === 0 &&
      dB.extra.length === 0 &&
      (!ex.ordered || (userB.rows ?? []).every((r, i) => key(r) === key((refB.rows ?? [])[i])));
    checks.push({
      label: 'Stimmt auch auf einem zweiten, verdeckten Datenbestand',
      ok: okB,
      hint: okB ? undefined : 'Auf anderen Daten weicht dein Ergebnis ab. Hast du Werte fest eingetragen, statt die Bedingung allgemein zu formulieren?',
    });
  }
  return { results: [userA], checks, passed: checks.every((c) => c.ok), actual, expected };
}

function runSelectAll(SQL: SqlJsStatic, ex: SqlExercise, stmts: string[]): StatementResult[] {
  const db = scenarioDb(SQL, ex.scenario, 'A', ex.setup);
  try {
    return stmts.map((s) => executeStatement(db, s));
  } finally {
    db.close();
  }
}

/* ---------------- DML ---------------- */

/** Skript wie in einer Oracle-Sitzung ausfuehren: COMMIT und ROLLBACK wirken wirklich. */
function finalState(SQL: SqlJsStatic, scenario: string | undefined, data: Dataset, script: string) {
  const sc = scenarioById(scenario);
  if (!/\b(COMMIT|ROLLBACK)\b/i.test(script)) {
    // schneller Weg: ohne Transaktionssteuerung genuegt eine einfache Ausfuehrung
    const db = scenarioDb(SQL, scenario, data);
    try {
      const results = runScript(db, script);
      const tables = Object.fromEntries(sc.tables.map((t) => [t, tableContent(db, t)]));
      const pending = results.filter((r) => r.ok && /^\s*(INSERT|UPDATE|DELETE|MERGE)\b/i.test(r.sql)).length;
      return { results, tables, pending };
    } finally {
      db.close();
    }
  }
  scenarioDb(SQL, scenario, data).close(); // prueft die Fall-Datenbank
  const session = new Session(SQL, sc.schema + (data === 'A' ? sc.dataA : sc.dataB));
  try {
    const results = session.run(script);
    const tables = Object.fromEntries(sc.tables.map((t) => [t, tableContent(session.db, t)]));
    return { results, tables, pending: session.pending };
  } finally {
    session.close();
  }
}

function compareStates(exp: Record<string, ResultSet>, act: Record<string, ResultSet>): TableDiff[] {
  return Object.keys(exp).map((t) => ({ table: t, columns: exp[t].columns, ...multisetDiff(exp[t].rows, act[t].rows) })).filter(
    (d) => d.missing.length || d.extra.length,
  );
}

function gradeDml(SQL: SqlJsStatic, ex: SqlExercise, script: string): SqlRun {
  const user = finalState(SQL, ex.scenario, 'A', script);
  const ref = finalState(SQL, ex.scenario, 'A', ex.solution);
  const original = finalState(SQL, ex.scenario, 'A', '');
  const diffs = compareStates(ref.tables, user.tables);
  const target = compareStates(original.tables, ref.tables).map((d) => d.table);

  const checks: CheckResult[] = [];
  if (!user.results.length) checks.push({ label: 'Mindestens eine Anweisung', ok: false, hint: 'Der Editor enthält keine Anweisung.' });
  for (const t of target) {
    const d = diffs.find((x) => x.table === t);
    checks.push({
      label: `Tabelle ${t} hat den erwarteten Inhalt`,
      ok: !d,
      hint: d ? `${d.missing.length} erwartete Zeile(n) fehlen, ${d.extra.length} Zeile(n) weichen ab oder sind zu viel.` : undefined,
    });
  }
  // Aufgaben mit COMMIT in der Musterloesung verlangen, die Transaktion zu beenden (wie in der Uebung)
  if (/\bCOMMIT\b/i.test(ex.solution) && user.results.length) {
    const ended = user.pending === 0;
    checks.push({
      label: 'Transaktion mit COMMIT beendet',
      ok: ended,
      hint: ended ? undefined : 'Es gibt noch nicht bestätigte Änderungen. Beende die Transaktion mit COMMIT;',
    });
  }
  const others = diffs.filter((d) => !target.includes(d.table));
  checks.push({
    label: 'Keine anderen Tabellen verändert',
    ok: others.length === 0,
    hint: others.length ? `Unerwartet verändert: ${others.map((d) => d.table).join(', ')}.` : undefined,
  });
  if (checks.every((c) => c.ok)) {
    const okB = compareStates(finalState(SQL, ex.scenario, 'B', ex.solution).tables, finalState(SQL, ex.scenario, 'B', script).tables).length === 0;
    checks.push({
      label: 'Stimmt auch auf einem zweiten, verdeckten Datenbestand',
      ok: okB,
      hint: okB ? undefined : 'Auf anderen Daten weicht das Ergebnis ab. Hast du Werte fest eingetragen, die man über eine Bedingung finden sollte?',
    });
  }
  return { results: user.results, checks, passed: checks.every((c) => c.ok), diffs, changed: target };
}

/* ---------------- Views und Materialized Views ---------------- */

interface ViewState {
  results: StatementResult[];
  /** 'view', 'mv' oder null, wenn das Objekt fehlt */
  type: 'view' | 'mv' | null;
  content: ResultSet;
}

function viewState(SQL: SqlJsStatic, ex: SqlExercise, data: Dataset, script: string): ViewState {
  const db = scenarioDb(SQL, ex.scenario, data, ex.setup);
  try {
    const results = runScript(db, script);
    const name = ex.view ?? '';
    const obj = db.exec('SELECT name, type FROM sqlite_master WHERE lower(name) = lower(?)', [name])[0]?.values[0];
    const isMv =
      !!obj &&
      (db.exec("SELECT 1 FROM sqlite_master WHERE name = '__mviews'")[0]?.values.length ?? 0) > 0 &&
      (db.exec('SELECT 1 FROM "__mviews" WHERE lower(name) = lower(?)', [name])[0]?.values.length ?? 0) > 0;
    const type = !obj ? null : isMv ? 'mv' : obj[1] === 'view' ? 'view' : null;
    const content = type ? tableContent(db, String(obj![0])) : { columns: [], rows: [] };
    return { results, type, content };
  } finally {
    db.close();
  }
}

/** Inhalt der View (kind 'view') bzw. Ergebnis der Abfrage (kind 'dql') fuer ein Skript */
export function viewResult(SQL: SqlJsStatic, ex: SqlExercise, data: Dataset, script: string): ResultSet {
  if (ex.kind === 'view') return viewState(SQL, ex, data, script).content;
  const r = runSelect(SQL, ex, data, splitStatements(script)[0] ?? '');
  return { columns: r.columns ?? [], rows: r.rows ?? [] };
}

function gradeView(SQL: SqlJsStatic, ex: SqlExercise, script: string): SqlRun {
  const name = ex.view ?? '';
  const wantMv = /\bCREATE\s+MATERIALIZED\s+VIEW\b/i.test(ex.solution);
  const user = viewState(SQL, ex, 'A', script);
  const ref = viewState(SQL, ex, 'A', ex.solution);
  const expected = ref.content;
  const checks: CheckResult[] = [];
  const failed = user.results.filter((r) => !r.ok);
  checks.push({
    label: 'Skript läuft fehlerfrei',
    ok: user.results.length > 0 && failed.length === 0,
    hint: !user.results.length ? 'Der Editor enthält keine Anweisung.' : failed.length ? `${failed[0].message}${failed[0].ora ? ` (${failed[0].ora})` : ''}` : undefined,
  });
  const kindOk = user.type === (wantMv ? 'mv' : 'view');
  checks.push({
    label: `${wantMv ? 'Materialized View' : 'View'} ${name} existiert`,
    ok: kindOk,
    hint: kindOk
      ? undefined
      : user.type
        ? `${name} ist eine ${user.type === 'mv' ? 'Materialized View' : 'View'}, verlangt ist eine ${wantMv ? 'Materialized View' : 'View'}.`
        : `Lege das Objekt mit dem Namen ${name} an.`,
  });
  if (!kindOk) return { results: user.results, checks, passed: false, expected };
  const actual = user.content;
  const colOk = actual.columns.length === expected.columns.length;
  checks.push({
    label: 'Richtige Anzahl Spalten',
    ok: colOk,
    hint: colOk ? undefined : `Deine View hat ${actual.columns.length} Spalte(n), erwartet sind ${expected.columns.length}.`,
  });
  const d = multisetDiff(expected.rows, actual.rows);
  const rowsOk = colOk && d.missing.length === 0 && d.extra.length === 0;
  checks.push({
    label: 'Richtiger Inhalt',
    ok: rowsOk,
    hint: rowsOk
      ? undefined
      : !colOk
        ? 'Erst die Spalten richtig wählen.'
        : `${d.missing.length} erwartete Zeile(n) fehlen, ${d.extra.length} Zeile(n) sind zu viel. Stimmen Joins, Spaltenreihenfolge und Bedingungen?`,
  });
  if (checks.every((c) => c.ok)) {
    const dB = multisetDiff(viewState(SQL, ex, 'B', ex.solution).content.rows, viewState(SQL, ex, 'B', script).content.rows);
    const okB = dB.missing.length === 0 && dB.extra.length === 0;
    checks.push({
      label: 'Stimmt auch auf einem zweiten, verdeckten Datenbestand',
      ok: okB,
      hint: okB ? undefined : 'Auf anderen Daten weicht der Inhalt ab. Hast du Werte fest eingetragen, statt die Bedingung allgemein zu formulieren?',
    });
  }
  return { results: user.results, checks, passed: checks.every((c) => c.ok), actual, expected };
}

export function runSqlExercise(SQL: SqlJsStatic, ex: SqlExercise, script: string): SqlRun {
  if (ex.kind === 'view') return gradeView(SQL, ex, script);
  return ex.kind === 'dql' ? gradeDql(SQL, ex, script) : gradeDml(SQL, ex, script);
}

/** Spielwiese: beliebiges Skript auf Datenbestand A eines Szenarios */
export function runPlayground(SQL: SqlJsStatic, script: string, scenario = 'coworkers'): StatementResult[] {
  const db = scenarioDb(SQL, scenario, 'A');
  try {
    return runScript(db, script);
  } finally {
    db.close();
  }
}

export function scenarioContent(SQL: SqlJsStatic, scenario = 'coworkers'): { table: string; data: ResultSet }[] {
  const db = scenarioDb(SQL, scenario, 'A');
  try {
    return scenarioById(scenario).tables.map((t) => ({ table: t, data: tableContent(db, t) }));
  } finally {
    db.close();
  }
}
