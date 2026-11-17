import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, runScript, splitStatements } from './oracle';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const base = `CREATE TABLE coworkers (id NUMBER PRIMARY KEY, name VARCHAR2(20), salary NUMBER);
INSERT INTO coworkers VALUES (1, 'Ramesh', 2000);
INSERT INTO coworkers VALUES (2, 'Khilan', 1500);`;

describe('DBS2-Erweiterungen der Oracle-Schicht', () => {
  it('PL/SQL-Bloecke bleiben bis zum Schraegstrich zusammen', () => {
    const s = splitStatements(`SELECT 1 FROM dual;
CREATE OR REPLACE TRIGGER t BEFORE UPDATE ON coworkers FOR EACH ROW
BEGIN
  IF :NEW.salary < :OLD.salary THEN RAISE_APPLICATION_ERROR(-20001, 'x;y'); END IF;
END;
/
SELECT 2 FROM dual;`);
    expect(s).toHaveLength(3);
    expect(s[1]).toMatch(/^CREATE OR REPLACE TRIGGER/);
    expect(s[1]).toMatch(/END;$/);
  });

  it('View: CREATE OR REPLACE, Abfrage, liest immer live', () => {
    const db = createDatabase(SQL);
    const r = runScript(db, `${base}
CREATE OR REPLACE VIEW v_reich AS SELECT name, salary FROM coworkers WHERE salary > 1000;
CREATE OR REPLACE VIEW v_reich AS SELECT name, salary FROM coworkers WHERE salary > 1800;
UPDATE coworkers SET salary = 3000 WHERE id = 2;
SELECT COUNT(*) FROM v_reich;`);
    expect(r.every((x) => x.ok)).toBe(true);
    expect(r.at(-1)!.rows![0][0]).toBe(2);
  });

  it('Materialized View ist ein Schnappschuss bis zum Refresh', () => {
    const db = createDatabase(SQL);
    const r = runScript(db, `${base}
CREATE MATERIALIZED VIEW mv_c BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS SELECT name, salary FROM coworkers;
UPDATE coworkers SET salary = 9 WHERE id = 1;
SELECT salary FROM mv_c WHERE name = 'Ramesh';
EXEC DBMS_MVIEW.REFRESH('mv_c');
SELECT salary FROM mv_c WHERE name = 'Ramesh';
ALTER MATERIALIZED VIEW mv_c INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;
CREATE BITMAP INDEX i_name ON coworkers(name);
CREATE MATERIALIZED VIEW mv_d BUILD DEFERRED REFRESH FORCE START WITH SYSDATE NEXT SYSDATE + 30/1440 AS SELECT * FROM coworkers;
SELECT COUNT(*) FROM mv_d;`);
    expect(r.map((x) => x.ok)).toEqual(r.map(() => true));
    expect(r[5].rows![0][0]).toBe(2000);
    expect(r[7].rows![0][0]).toBe(9);
    expect(r.at(-1)!.rows![0][0]).toBe(0);
  });

  it('PL/SQL wird mit Hinweis abgelehnt, ohne das Skript zu stoppen', () => {
    const db = createDatabase(SQL);
    const r = runScript(db, `${base}
BEGIN
  DBMS_OUTPUT.PUT_LINE('x');
END;
/
SELECT COUNT(*) FROM coworkers;`);
    expect(r.at(-2)!.ok).toBe(false);
    expect(r.at(-2)!.message).toMatch(/PL\/SQL/);
    expect(r.at(-1)!.ok).toBe(true);
  });

  it('EXTRACT(YEAR/MONTH FROM …) und ADD_MONTHS wie in Oracle', () => {
    const db = createDatabase(SQL);
    const r = runScript(db, `SELECT EXTRACT(YEAR FROM DATE '2021-03-15'), EXTRACT(MONTH FROM DATE '2021-03-15'), ADD_MONTHS(DATE '2021-01-31', 1), ADD_MONTHS(DATE '2021-03-15', -6) FROM dual;`);
    expect(r[0].ok).toBe(true);
    expect(r[0].rows![0]).toEqual([2021, 3, '2021-02-28', '2020-09-15']);
  });
});
