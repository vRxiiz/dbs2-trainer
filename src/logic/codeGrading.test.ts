import { describe, expect, it } from 'vitest';
import type { CodeTask } from '../content/codeTypes';
import { gradeCode, normalizeCode, syntaxChecks } from './codeGrading';

const task: CodeTask = {
  id: 't', topicId: '03-before-after', title: 'Test', level: 1, scenario: 'keins', task: '', hints: [], source: 'Test',
  solution: `CREATE OR REPLACE TRIGGER t_bi
BEFORE INSERT ON mitarbeiter
FOR EACH ROW
BEGIN
  IF :NEW.gehalt < 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Gehalt negativ');
  END IF;
END;
/`,
  checks: [
    { label: 'BEFORE INSERT', hint: 'Zeitpunkt', all: ['BEFORE\\s+INSERT\\s+ON\\s+MITARBEITER'] },
    { label: 'Zeilentrigger', hint: 'FOR EACH ROW', all: ['FOR EACH ROW'], points: 2 },
    { label: 'Fehler', hint: 'RAISE', any: ['RAISE_APPLICATION_ERROR', 'RAISE\\s+\\w+'] },
    { label: 'kein COMMIT', hint: 'kein COMMIT im Trigger', none: ['\\bCOMMIT\\b'] },
  ],
};

describe('normalizeCode', () => {
  it('entfernt Kommentare, maskiert Strings, Großbuchstaben', () => {
    expect(normalizeCode("select 'a''b' -- x\n/* y */ from  dual")).toBe("SELECT '…' FROM DUAL");
  });
});

describe('gradeCode', () => {
  it('Schreibweise egal', () => {
    const lower = `-- mein Trigger
create or replace trigger t_bi before insert on mitarbeiter for each row
begin if :new.gehalt < 0 then raise_application_error(-20001,'x'); end if; end;
/`;
    const a = gradeCode(task, task.solution);
    const b = gradeCode(task, lower);
    expect(a.passed).toBe(true);
    expect(b.checks.map((c) => c.ok)).toEqual(a.checks.map((c) => c.ok));
    expect(a.score).toBe(5);
    expect(a.max).toBe(5);
  });
  it('Strings zählen nicht', () => {
    const r = gradeCode(task, `CREATE TRIGGER t AFTER UPDATE ON mitarbeiter FOR EACH ROW
BEGIN RAISE_APPLICATION_ERROR(-20001,'BEFORE INSERT ON MITARBEITER'); END;`);
    expect(r.checks[0].ok).toBe(false);
    expect(r.passed).toBe(false);
  });
  it('leerer Code besteht nicht', () => {
    const r = gradeCode(task, '   ');
    expect(r.passed).toBe(false);
    expect(r.score).toBe(0);
  });
  it('verbotener Baustein wird erkannt', () => {
    const r = gradeCode(task, task.solution.replace('END IF;', 'END IF; COMMIT;'));
    expect(r.checks.find((c) => c.label === 'kein COMMIT')!.ok).toBe(false);
  });
});

describe('syntaxChecks', () => {
  it('meldet fehlendes END IF', () => {
    const r = syntaxChecks(`BEGIN IF x > 0 THEN NULL; END;`);
    expect(r.some((c) => !c.ok && /END IF/.test(c.label))).toBe(true);
  });
  it('meldet fehlendes END LOOP', () => {
    const r = syntaxChecks(`BEGIN FOR i IN 1..3 LOOP NULL; END;`);
    expect(r.some((c) => !c.ok && /LOOP/.test(c.label))).toBe(true);
  });
  it('Compound-Trigger ist kein Fehler', () => {
    const code = `CREATE OR REPLACE TRIGGER t FOR INSERT ON mitarbeiter COMPOUND TRIGGER
  n NUMBER := 0;
  BEFORE STATEMENT IS BEGIN n := 0; END BEFORE STATEMENT;
  AFTER EACH ROW IS BEGIN n := n + 1; END AFTER EACH ROW;
  AFTER STATEMENT IS BEGIN IF n > 5 THEN NULL; END IF; END AFTER STATEMENT;
END t;
/`;
    expect(syntaxChecks(code).filter((c) => !c.ok)).toEqual([]);
  });
  it('CASE-Ausdruck und Paket zählen richtig', () => {
    const code = `CREATE OR REPLACE PACKAGE BODY p AS
  FUNCTION f(x NUMBER) RETURN VARCHAR2 IS
  BEGIN
    RETURN CASE WHEN x > 0 THEN 'pos' ELSE 'neg' END;
  END f;
END p;
/`;
    expect(syntaxChecks(code).filter((c) => !c.ok)).toEqual([]);
  });
  it('offener String wird gemeldet', () => {
    expect(syntaxChecks(`BEGIN DBMS_OUTPUT.PUT_LINE('x); END;`).some((c) => !c.ok)).toBe(true);
  });
});
