// Kapitel 3 – Trigger: Übung Trigger (a), Übung 3b (Coworkers, Softwarelizenzen), Hörsaalübungen,
// Folienbeispiele und Altklausur Aufgabe 1
import type { CodeTask } from '../codeTypes';

const r = String.raw;
const TRG = r`CREATE (OR REPLACE )?TRIGGER \w+`;
const ROW = r`FOR EACH ROW`;
const RAISE = r`RAISE_APPLICATION_ERROR ?\( ?- ?20\d{3} ?,`;
const OUT = r`DBMS_OUTPUT\.PUT_LINE ?\(`;

export const k03: CodeTask[] = [
  // ---------------------------------------------------------------- BEFORE / AFTER
  {
    id: 'keine-gehaltsminderung',
    topicId: '03-before-after',
    title: 'Keine Gehaltsminderung',
    level: 2,
    scenario: 'coworkers',
    task:
      'Bei einer Änderung darf das Gehalt nur erhöht, aber niemals gesenkt werden. Schreibe einen Trigger, der eine Gehaltsänderung nur zulässt, wenn das neue Gehalt größer ist als das bisherige. Sonst bricht er mit dem Fehler „Neues Gehalt muss größer als das alte Gehalt sein“ ab. Teste beide Fälle und setze die Daten jeweils mit ROLLBACK zurück.',
    hints: ['Der Trigger muss vor der Änderung prüfen: BEFORE UPDATE OF salary ON coworkers', 'Alter und neuer Wert stehen in :OLD.salary und :NEW.salary.', '„nur, wenn größer“ heißt: bei gleichem Gehalt ebenfalls abbrechen.'],
    solution: `CREATE OR REPLACE TRIGGER t_keine_gehaltsminderung
BEFORE UPDATE OF salary ON coworkers
FOR EACH ROW
BEGIN
  IF :NEW.salary <= :OLD.salary THEN
    RAISE_APPLICATION_ERROR(-20001, 'Neues Gehalt muss größer als das alte Gehalt sein');
  END IF;
END;
/
UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
ROLLBACK;
UPDATE coworkers SET salary = salary - 100 WHERE id = 1;
ROLLBACK;`,
    checks: [
      { label: 'BEFORE UPDATE auf coworkers', hint: 'BEFORE UPDATE (OF salary) ON coworkers – der Trigger muss vor der Änderung feuern.', all: [r`${TRG} BEFORE UPDATE( OF SALARY)? ON COWORKERS`] },
      { label: 'Zeilentrigger', hint: ':NEW und :OLD gibt es nur mit FOR EACH ROW.', all: [ROW] },
      { label: 'Neues mit altem Gehalt verglichen (auch Gleichheit)', hint: 'IF :NEW.salary <= :OLD.salary THEN', any: [r`IF :NEW\.SALARY ?<= ?:OLD\.SALARY THEN`, r`IF :OLD\.SALARY ?>= ?:NEW\.SALARY THEN`, r`IF NOT ?\( ?:NEW\.SALARY ?> ?:OLD\.SALARY ?\) THEN`] },
      { label: 'Abbruch mit Fehlermeldung', hint: 'RAISE_APPLICATION_ERROR(-20001, \'Neues Gehalt muss größer als das alte Gehalt sein\');', all: [RAISE] },
      { label: 'Tests mit ROLLBACK', hint: 'Nach jedem Test-UPDATE: ROLLBACK;', all: [r`(UPDATE COWORKERS SET SALARY[^;]*; ROLLBACK ?;.*){2}`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_keine_gehaltsminderung
BEFORE UPDATE OF salary ON coworkers
FOR EACH ROW
BEGIN
  IF :NEW.salary < :OLD.salary THEN
    RAISE_APPLICATION_ERROR(-20001, 'Neues Gehalt muss größer als das alte Gehalt sein');
  END IF;
END;
/
UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
ROLLBACK;
UPDATE coworkers SET salary = salary - 100 WHERE id = 1;
ROLLBACK;`,
      `CREATE OR REPLACE TRIGGER t_keine_gehaltsminderung
AFTER UPDATE OF salary ON coworkers
BEGIN
  IF :NEW.salary <= :OLD.salary THEN
    RAISE_APPLICATION_ERROR(-20001, 'Neues Gehalt muss größer als das alte Gehalt sein');
  END IF;
END;
/`,
    ],
    source: 'Übung Trigger (a), Keine Gehaltsminderung',
  },
  {
    id: 'min-salary',
    topicId: '03-before-after',
    title: 'Hörsaalübung: Mindestens das Höchstgehalt',
    level: 2,
    scenario: 'coworkers',
    task:
      'Eine neue Mitarbeitende soll immer zumindest das Gehalt des Meistverdienenden erhalten. Schreibe einen Trigger min_salary, der das sicherstellt: Ist das Gehalt beim Einfügen kleiner, wird es auf das Höchstgehalt angehoben.',
    hints: ['Werte ändern kann nur ein BEFORE-Trigger: :NEW.salary := …', 'SELECT MAX(salary) INTO max_sal FROM coworkers;'],
    solution: `CREATE OR REPLACE TRIGGER min_salary
BEFORE INSERT ON coworkers
FOR EACH ROW
DECLARE
  max_sal NUMBER;
BEGIN
  SELECT MAX(salary) INTO max_sal FROM coworkers;
  IF :NEW.salary < max_sal THEN
    DBMS_OUTPUT.PUT_LINE('Salary to low and will be raised');
    :NEW.salary := max_sal;
  END IF;
END;
/
INSERT INTO coworkers (id, name, age, address, salary) VALUES (7, 'Johann', 39, 'Cologne', 100);
ROLLBACK;`,
    checks: [
      { label: 'BEFORE INSERT auf coworkers als Zeilentrigger', hint: 'BEFORE INSERT ON coworkers FOR EACH ROW', all: [r`${TRG} BEFORE INSERT ON COWORKERS ${ROW}`] },
      { label: 'Höchstgehalt ermittelt', hint: 'SELECT MAX(salary) INTO max_sal FROM coworkers;', all: [r`SELECT MAX ?\( ?SALARY ?\) INTO \w+ FROM COWORKERS`] },
      { label: 'Gehalt in :NEW angehoben', hint: 'IF :NEW.salary < max_sal THEN :NEW.salary := max_sal; END IF;', all: [r`IF :NEW\.SALARY ?< ?\w+ THEN .*:NEW\.SALARY ?:= ?\w+`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER min_salary
AFTER INSERT ON coworkers
FOR EACH ROW
DECLARE max_sal NUMBER;
BEGIN
  SELECT MAX(salary) INTO max_sal FROM coworkers;
  IF :NEW.salary < max_sal THEN :NEW.salary := max_sal; END IF;
END;
/`,
    ],
    source: 'Folien Trigger, Hörsaalübung (min_salary)',
  },
  {
    id: 'check-age',
    topicId: '03-before-after',
    title: 'Unter 18: genau 500 €',
    level: 1,
    scenario: 'coworkers',
    task: 'Neue Mitarbeitende unter 18 müssen genau 500 € verdienen. Schreibe den Trigger check_age, der das Gehalt beim Einfügen entsprechend setzt.',
    hints: ['BEFORE INSERT ON coworkers FOR EACH ROW', 'IF :NEW.age < 18 THEN :NEW.salary := 500; END IF;'],
    solution: `CREATE OR REPLACE TRIGGER check_age
BEFORE INSERT ON coworkers
FOR EACH ROW
DECLARE
  under_18_sal NUMBER := 500;
BEGIN
  IF :NEW.age < 18 THEN
    :NEW.salary := under_18_sal;
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE INSERT als Zeilentrigger', hint: 'BEFORE INSERT ON coworkers FOR EACH ROW', all: [r`${TRG} BEFORE INSERT ON COWORKERS ${ROW}`] },
      { label: 'Bedingung auf das Alter', hint: 'IF :NEW.age < 18 THEN', all: [r`IF :NEW\.AGE ?< ?18 THEN`] },
      { label: 'Gehalt auf 500 gesetzt', hint: ':NEW.salary := 500;', all: [r`:NEW\.SALARY ?:= ?(500|\w+)`, r`500`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER check_age
BEFORE INSERT ON coworkers
FOR EACH ROW
BEGIN
  IF :NEW.age < 18 THEN
    UPDATE coworkers SET salary = 500 WHERE id = :NEW.id;
  END IF;
END;
/`,
    ],
    source: 'Folien Trigger, INSERT-Trigger (check_age)',
  },
  // ---------------------------------------------------------------- Row / Statement
  {
    id: 'statement-protokoll',
    topicId: '03-row-statement',
    title: 'Statement-Trigger: Änderungen protokollieren',
    level: 2,
    scenario: 'coworkers',
    task:
      'Die Tabelle protokoll(zeitpunkt DATE, benutzer VARCHAR2(30), aktion VARCHAR2(10)) existiert bereits. Schreibe einen Trigger t_protokoll, der nach jedem UPDATE-Befehl auf coworkers genau einen Eintrag (SYSDATE, USER, \'UPDATE\') schreibt, egal wie viele Zeilen der Befehl ändert.',
    hints: ['Einmal pro Befehl heißt: Statement-Trigger, also ohne FOR EACH ROW.', 'In Statement-Triggern gibt es kein :NEW und :OLD.'],
    solution: `CREATE OR REPLACE TRIGGER t_protokoll
AFTER UPDATE ON coworkers
BEGIN
  INSERT INTO protokoll (zeitpunkt, benutzer, aktion) VALUES (SYSDATE, USER, 'UPDATE');
END;
/`,
    checks: [
      { label: 'AFTER UPDATE auf coworkers', hint: 'AFTER UPDATE ON coworkers', all: [r`${TRG} AFTER UPDATE ON COWORKERS`] },
      { label: 'Statement-Trigger ohne FOR EACH ROW', hint: 'FOR EACH ROW würde pro geänderter Zeile feuern.', none: [ROW], all: [r`TRIGGER`] },
      { label: 'Eintrag mit SYSDATE und USER', hint: 'INSERT INTO protokoll (…) VALUES (SYSDATE, USER, \'UPDATE\');', all: [r`INSERT INTO PROTOKOLL( ?\([^)]*\))? VALUES ?\( ?SYSDATE ?, ?USER ?, ?'…' ?\)`] },
      { label: 'Keine Transitionsvariablen', hint: ':NEW und :OLD sind im Statement-Trigger nicht verfügbar.', none: [r`:(NEW|OLD)\.`], all: [r`TRIGGER`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_protokoll
AFTER UPDATE ON coworkers
FOR EACH ROW
BEGIN
  INSERT INTO protokoll (zeitpunkt, benutzer, aktion) VALUES (SYSDATE, USER, 'UPDATE');
END;
/`,
    ],
    source: 'Folien Trigger, ROW- und STATEMENT-Trigger',
  },
  {
    id: 'age-change',
    topicId: '03-row-statement',
    title: 'Altersänderung anzeigen mit WHEN',
    level: 2,
    scenario: 'coworkers',
    task:
      'Zeige bei einer Änderung des Alters das alte und das neue Alter an, aber nur, wenn das neue Alter größer ist als das alte. Die Bedingung soll in der WHEN-Klausel des Triggers stehen.',
    hints: ['Nur bei Änderung einer Spalte: AFTER UPDATE OF age ON coworkers', 'In WHEN stehen NEW und OLD ohne Doppelpunkt: WHEN (NEW.age > OLD.age)', 'WHEN gibt es nur bei Zeilentriggern.'],
    solution: `CREATE OR REPLACE TRIGGER t_age_change
AFTER UPDATE OF age ON coworkers
FOR EACH ROW
WHEN (NEW.age > OLD.age)
BEGIN
  DBMS_OUTPUT.PUT_LINE('Old age: ' || :OLD.age);
  DBMS_OUTPUT.PUT_LINE('New age: ' || :NEW.age);
END;
/`,
    checks: [
      { label: 'Nur bei Änderung von age', hint: 'AFTER UPDATE OF age ON coworkers', all: [r`${TRG} (AFTER|BEFORE) UPDATE OF AGE ON COWORKERS`] },
      { label: 'Zeilentrigger mit WHEN ohne Doppelpunkt', hint: 'FOR EACH ROW WHEN (NEW.age > OLD.age)', all: [r`${ROW} WHEN ?\( ?NEW\.AGE ?> ?OLD\.AGE ?\)`] },
      { label: 'Altes und neues Alter ausgegeben', hint: 'DBMS_OUTPUT.PUT_LINE(… :OLD.age); DBMS_OUTPUT.PUT_LINE(… :NEW.age);', all: [r`${OUT}[^;]*:OLD\.AGE`, r`${OUT}[^;]*:NEW\.AGE`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_age_change
AFTER UPDATE OF age ON coworkers
FOR EACH ROW
WHEN (:NEW.age > :OLD.age)
BEGIN
  DBMS_OUTPUT.PUT_LINE('Old age: ' || :OLD.age);
  DBMS_OUTPUT.PUT_LINE('New age: ' || :NEW.age);
END;
/`,
    ],
    source: 'Folien Trigger, OF Spalte und WHEN (Bedingung)',
  },
  // ---------------------------------------------------------------- Events, mehrere Tabellen
  {
    id: 'probezeit',
    topicId: '03-events',
    title: 'Nicht in der Probezeit feuern',
    level: 2,
    scenario: 'coworkers',
    task:
      'Niemand darf entlassen (aus COWORKERS gelöscht) werden, der vor weniger als 6 Monaten eingestellt wurde. Schreibe einen Trigger, der das Löschen sonst mit einem Fehler abbricht. Nutze ADD_MONTHS.',
    hints: ['BEFORE DELETE ON coworkers FOR EACH ROW', 'Beim Löschen steht der alte Datensatz in :OLD.', 'Eingestellt vor weniger als 6 Monaten: :OLD.hiring_date > ADD_MONTHS(SYSDATE, -6)'],
    solution: `CREATE OR REPLACE TRIGGER t_probezeit
BEFORE DELETE ON coworkers
FOR EACH ROW
BEGIN
  IF :OLD.hiring_date > ADD_MONTHS(SYSDATE, -6) THEN
    RAISE_APPLICATION_ERROR(-20002, 'Mitarbeitende in der Probezeit dürfen nicht entlassen werden.');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE DELETE als Zeilentrigger', hint: 'BEFORE DELETE ON coworkers FOR EACH ROW', all: [r`${TRG} BEFORE DELETE ON COWORKERS ${ROW}`] },
      {
        label: 'Einstellungsdatum mit ADD_MONTHS geprüft',
        hint: 'IF :OLD.hiring_date > ADD_MONTHS(SYSDATE, -6) THEN (oder ADD_MONTHS(:OLD.hiring_date, 6) > SYSDATE)',
        any: [
          r`:OLD\.HIRING_DATE ?> ?ADD_MONTHS ?\( ?SYSDATE ?, ?- ?6 ?\)`,
          r`ADD_MONTHS ?\( ?SYSDATE ?, ?- ?6 ?\) ?< ?:OLD\.HIRING_DATE`,
          r`ADD_MONTHS ?\( ?:OLD\.HIRING_DATE ?, ?6 ?\) ?> ?SYSDATE`,
          r`SYSDATE ?< ?ADD_MONTHS ?\( ?:OLD\.HIRING_DATE ?, ?6 ?\)`,
        ],
      },
      { label: 'Abbruch mit Fehlermeldung', hint: 'RAISE_APPLICATION_ERROR(-20002, …);', all: [RAISE] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_probezeit
BEFORE DELETE ON coworkers
FOR EACH ROW
BEGIN
  IF :NEW.hiring_date > ADD_MONTHS(SYSDATE, -6) THEN
    RAISE_APPLICATION_ERROR(-20002, 'Probezeit');
  END IF;
END;
/`,
      `CREATE OR REPLACE TRIGGER t_probezeit
BEFORE DELETE ON coworkers
FOR EACH ROW
BEGIN
  IF :OLD.hiring_date < ADD_MONTHS(SYSDATE, -6) THEN
    RAISE_APPLICATION_ERROR(-20002, 'Probezeit');
  END IF;
END;
/`,
    ],
    source: 'Übung Trigger (a), Nicht in der Probezeit feuern',
  },
  {
    id: 'pay-bonus',
    topicId: '03-events',
    title: 'Boni je nach Operation',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe einen Trigger pay_bonus, der bei jeder Änderung an COWORKERS einen Bonus ausgibt: neue Mitarbeitende 10 €, geänderte 20 €, entlassene 50 €. Nutze einen Trigger für alle drei Operationen und unterscheide im Rumpf.',
    hints: ['BEFORE DELETE OR INSERT OR UPDATE ON coworkers', 'IF INSERTING THEN … ELSIF UPDATING THEN … ELSIF DELETING THEN … END IF;'],
    solution: `CREATE OR REPLACE TRIGGER pay_bonus
BEFORE DELETE OR INSERT OR UPDATE ON coworkers
FOR EACH ROW
DECLARE
  bonus NUMBER := 0;
BEGIN
  IF INSERTING THEN
    bonus := 10;
  ELSIF UPDATING THEN
    bonus := 20;
  ELSIF DELETING THEN
    bonus := 50;
  END IF;
  DBMS_OUTPUT.PUT_LINE('Pay a bonus of: ' || bonus);
END;
/`,
    checks: [
      { label: 'Ein Trigger für INSERT, UPDATE und DELETE', hint: 'BEFORE DELETE OR INSERT OR UPDATE ON coworkers', all: [r`${TRG} (BEFORE|AFTER) (INSERT|UPDATE|DELETE) OR (INSERT|UPDATE|DELETE) OR (INSERT|UPDATE|DELETE) ON COWORKERS`] },
      { label: 'Unterscheidung mit INSERTING, UPDATING, DELETING', hint: 'IF INSERTING THEN … ELSIF UPDATING THEN … ELSIF DELETING THEN …', all: [r`IF INSERTING THEN`, r`ELSIF UPDATING THEN`, r`ELSIF DELETING THEN`] },
      { label: 'Richtige Beträge', hint: 'INSERTING → 10, UPDATING → 20, DELETING → 50', all: [r`INSERTING THEN \w+ ?:= ?10\b`, r`UPDATING THEN \w+ ?:= ?20\b`, r`DELETING THEN \w+ ?:= ?50\b`] },
      { label: 'Bonus ausgegeben', hint: 'DBMS_OUTPUT.PUT_LINE(\'Pay a bonus of: \' || bonus);', all: [OUT] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER pay_bonus
BEFORE DELETE OR INSERT OR UPDATE ON coworkers
FOR EACH ROW
DECLARE bonus NUMBER := 0;
BEGIN
  IF INSERT THEN bonus := 10;
  ELSIF UPDATE THEN bonus := 20;
  ELSIF DELETE THEN bonus := 50;
  END IF;
  DBMS_OUTPUT.PUT_LINE('Pay a bonus of: ' || bonus);
END;
/`,
    ],
    source: 'Folien Trigger, Fallunterscheidung (pay_bonus)',
  },
  {
    id: 'lead-alter-25',
    topicId: '03-events',
    title: 'Projektleitung erst ab 25',
    level: 2,
    scenario: 'coworkers',
    task:
      'Ein Coworker kann mehrere Projekte leiten, muss aber mindestens 25 Jahre alt sein. Schreibe den Trigger check_proj_lead_age, der beim Einfügen und Ändern von Projekten das Alter der Leitung prüft und sonst mit „Leader too young“ abbricht.',
    hints: ['Der Trigger liegt auf PROJECTS, das Alter steht in COWORKERS.', 'SELECT age INTO age_coworker FROM coworkers WHERE id = :NEW.leader;'],
    solution: `CREATE OR REPLACE TRIGGER check_proj_lead_age
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
DECLARE
  age_coworker NUMBER;
BEGIN
  SELECT age INTO age_coworker FROM coworkers WHERE id = :NEW.leader;
  IF age_coworker < 25 THEN
    RAISE_APPLICATION_ERROR(-20111, 'Leader too young');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE INSERT OR UPDATE auf projects', hint: 'BEFORE INSERT OR UPDATE ON projects FOR EACH ROW', all: [r`${TRG} BEFORE (INSERT OR UPDATE|UPDATE OR INSERT)( OF LEADER)? ON PROJECTS ${ROW}`] },
      { label: 'Alter der Leitung aus COWORKERS gelesen', hint: 'SELECT age INTO … FROM coworkers WHERE id = :NEW.leader;', all: [r`SELECT AGE INTO \w+ FROM COWORKERS WHERE ID ?= ?:NEW\.LEADER`] },
      { label: 'Abbruch unter 25', hint: 'IF age_coworker < 25 THEN RAISE_APPLICATION_ERROR(-20111, \'Leader too young\');', all: [r`IF \w+ ?< ?25 THEN ${RAISE}`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER check_proj_lead_age
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
DECLARE age_coworker NUMBER;
BEGIN
  SELECT age INTO age_coworker FROM coworkers WHERE id = :OLD.leader;
  IF age_coworker < 25 THEN RAISE_APPLICATION_ERROR(-20111, 'Leader too young'); END IF;
END;
/`,
    ],
    source: 'Folien Trigger, Arbeiten mit mehreren Tabellen (check_proj_lead_age)',
  },
  {
    id: 'increase-sal-proj-lead',
    topicId: '03-events',
    title: 'Hörsaalübung: Gehalt bei Projektleitung',
    level: 3,
    scenario: 'coworkers',
    task:
      'Bei Ernennung eines Coworkers zur Projektleitung steigt das Gehalt um 10 %, wenn die Person jünger als 30 ist, und um 20 %, wenn sie 30 oder älter ist. Mitarbeitende unter 25 dürfen keine Projekte leiten. Schreibe den Trigger increase_sal_proj_lead.',
    hints: ['AFTER INSERT OR UPDATE ON projects FOR EACH ROW', 'Das Gehalt änderst du mit einem UPDATE auf COWORKERS … WHERE id = :NEW.leader.', 'Reihenfolge der Fälle: unter 25 abbrechen, unter 30 +10 %, sonst +20 %.'],
    solution: `CREATE OR REPLACE TRIGGER increase_sal_proj_lead
AFTER INSERT OR UPDATE ON projects
FOR EACH ROW
DECLARE
  age_coworker NUMBER;
BEGIN
  SELECT age INTO age_coworker FROM coworkers WHERE id = :NEW.leader;
  IF age_coworker < 25 THEN
    RAISE_APPLICATION_ERROR(-20111, 'Keine Projektleitung unter 25!!!');
  ELSIF age_coworker < 30 THEN
    UPDATE coworkers SET salary = salary * 1.1 WHERE id = :NEW.leader;
  ELSE
    UPDATE coworkers SET salary = salary * 1.2 WHERE id = :NEW.leader;
  END IF;
END;
/`,
    checks: [
      { label: 'Zeilentrigger auf projects für INSERT und UPDATE', hint: 'AFTER INSERT OR UPDATE ON projects FOR EACH ROW', all: [r`${TRG} (AFTER|BEFORE) (INSERT OR UPDATE|UPDATE OR INSERT)( OF LEADER)? ON PROJECTS ${ROW}`] },
      { label: 'Alter der Leitung gelesen', hint: 'SELECT age INTO age_coworker FROM coworkers WHERE id = :NEW.leader;', all: [r`SELECT AGE INTO \w+ FROM COWORKERS WHERE ID ?= ?:NEW\.LEADER`] },
      { label: 'Abbruch unter 25', hint: 'IF age_coworker < 25 THEN RAISE_APPLICATION_ERROR(…);', all: [r`\w+ ?< ?25 THEN ${RAISE}`] },
      { label: '10 % und 20 % für die Leitung', hint: 'UPDATE coworkers SET salary = salary * 1.1 / 1.2 WHERE id = :NEW.leader;', all: [r`SALARY ?= ?SALARY ?\* ?1\.10? WHERE ID ?= ?:NEW\.LEADER`, r`SALARY ?= ?SALARY ?\* ?1\.20? WHERE ID ?= ?:NEW\.LEADER`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER increase_sal_proj_lead
AFTER INSERT OR UPDATE ON projects
FOR EACH ROW
DECLARE age_coworker NUMBER;
BEGIN
  SELECT age INTO age_coworker FROM coworkers WHERE id = :NEW.leader;
  IF age_coworker < 30 THEN
    UPDATE coworkers SET salary = salary * 1.1 WHERE id = :NEW.leader;
  ELSE
    UPDATE coworkers SET salary = salary * 1.2 WHERE id = :NEW.leader;
  END IF;
END;
/`,
    ],
    source: 'Folien Trigger, Hörsaalübung (increase_sal_proj_lead)',
  },
  {
    id: 'leader-2-jahre',
    topicId: '03-events',
    title: 'Neues Projekt nur mit erfahrener Leitung',
    level: 3,
    scenario: 'coworkers',
    task:
      'Beim Hinzufügen eines neuen Projekts muss eine Projektleitung (LEADER) angegeben werden. Eine Person darf ein Projekt nur leiten, wenn sie bereits seit 2 Jahren im Unternehmen arbeitet. Schreibe einen Trigger, der das Einfügen sonst abbricht.',
    hints: ['Der Trigger liegt auf PROJECTS, das Einstellungsdatum steht in COWORKERS.', 'SELECT hiring_date INTO v_datum FROM coworkers WHERE id = :NEW.leader;', 'Seit 2 Jahren: v_datum <= ADD_MONTHS(SYSDATE, -24)'],
    solution: `CREATE OR REPLACE TRIGGER t_leader_erfahren
BEFORE INSERT ON projects
FOR EACH ROW
DECLARE
  v_datum coworkers.hiring_date%TYPE;
BEGIN
  SELECT hiring_date INTO v_datum FROM coworkers WHERE id = :NEW.leader;
  IF v_datum > ADD_MONTHS(SYSDATE, -24) THEN
    RAISE_APPLICATION_ERROR(-20003, 'Projektleitung erst nach 2 Jahren im Unternehmen.');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE INSERT auf projects', hint: 'BEFORE INSERT ON projects – abbrechen geht nur vor dem Einfügen sauber.', all: [r`${TRG} BEFORE INSERT ON PROJECTS`], points: 2 },
      { label: 'Zeilentrigger', hint: 'FOR EACH ROW, damit :NEW.leader verfügbar ist', all: [ROW], points: 1 },
      { label: 'Einstellungsdatum der Leitung gelesen', hint: 'SELECT hiring_date INTO v_datum FROM coworkers WHERE id = :NEW.leader;', all: [r`SELECT HIRING_DATE INTO \w+ FROM COWORKERS WHERE ID ?= ?:NEW\.LEADER`], points: 3 },
      {
        label: 'Zwei Jahre geprüft',
        hint: 'IF v_datum > ADD_MONTHS(SYSDATE, -24) THEN (oder MONTHS_BETWEEN(SYSDATE, v_datum) < 24)',
        any: [
          r`\w+ ?> ?ADD_MONTHS ?\( ?SYSDATE ?, ?- ?24 ?\)`,
          r`ADD_MONTHS ?\( ?\w+ ?, ?24 ?\) ?> ?SYSDATE`,
          r`MONTHS_BETWEEN ?\( ?SYSDATE ?, ?\w+ ?\) ?< ?24`,
          r`SYSDATE ?- ?\w+ ?< ?(730|365 ?\* ?2)`,
        ],
        points: 3,
      },
      { label: 'Abbruch mit Fehlermeldung', hint: 'RAISE_APPLICATION_ERROR(-20003, …);', all: [RAISE], points: 3 },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_leader_erfahren
BEFORE INSERT ON projects
FOR EACH ROW
DECLARE v_datum DATE;
BEGIN
  SELECT hiring_date INTO v_datum FROM coworkers WHERE id = :NEW.leader;
  IF v_datum > ADD_MONTHS(SYSDATE, -24) THEN
    DBMS_OUTPUT.PUT_LINE('Zu kurz im Unternehmen');
  END IF;
END;
/`,
    ],
    exam: true,
    points: 12,
    source: 'Übung 3b, Neues Projekt mit erfahrenen Mitarbeitern',
  },
  {
    id: 't-install-comp',
    topicId: '03-events',
    title: 'Lizenz (1): Computerlizenz installieren',
    level: 3,
    scenario: 'lizenz',
    task:
      'Wird eine neue Computerlizenz erstellt, soll der Trigger t_install_comp sie auf einem Lizenzserver installieren. Die Lizenzserver_ID ergibt sich per Modulo: Lizenzserver_ID = Lizenz_ID mod (Anzahl der Lizenzserver).',
    hints: [
      'In INSTALLIERT_AUF darf die Lizenz erst stehen, wenn die Computerlizenz existiert: AFTER INSERT ON computerlizenz.',
      'SELECT COUNT(*) INTO v_anzahl FROM lizenzserver;',
      'MOD(:NEW.lizenz_id, v_anzahl)',
      'Zum Testen zuerst die Lizenz (z. B. ID 82) in LIZENZ anlegen, dann die Computerlizenz.',
    ],
    solution: `CREATE OR REPLACE TRIGGER t_install_comp
AFTER INSERT ON computerlizenz
FOR EACH ROW
DECLARE
  v_anzahl NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_anzahl FROM lizenzserver;
  INSERT INTO installiert_auf (lizenz_id, lizenzserver_id)
  VALUES (:NEW.lizenz_id, MOD(:NEW.lizenz_id, v_anzahl));
END;
/`,
    checks: [
      { label: 'AFTER INSERT auf computerlizenz', hint: 'AFTER INSERT ON computerlizenz – erst danach ist die Lizenz für den Fremdschlüssel da.', all: [r`${TRG} AFTER INSERT ON COMPUTERLIZENZ`], points: 3 },
      { label: 'Zeilentrigger', hint: 'FOR EACH ROW, damit :NEW.lizenz_id verfügbar ist', all: [ROW], points: 2 },
      { label: 'Anzahl der Lizenzserver ermittelt', hint: 'SELECT COUNT(*) INTO v_anzahl FROM lizenzserver;', all: [r`SELECT COUNT ?\( ?(\*|\w+) ?\) INTO \w+ FROM LIZENZSERVER`], points: 3 },
      { label: 'Server per MOD berechnet', hint: 'MOD(:NEW.lizenz_id, v_anzahl)', all: [r`MOD ?\( ?:NEW\.LIZENZ_ID ?, ?\w+ ?\)`], points: 4 },
      { label: 'In INSTALLIERT_AUF eingefügt', hint: 'INSERT INTO installiert_auf (lizenz_id, lizenzserver_id) VALUES (:NEW.lizenz_id, …);', all: [r`INSERT INTO INSTALLIERT_AUF( ?\([^)]*\))? VALUES ?\( ?:NEW\.LIZENZ_ID ?,`], points: 3 },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_install_comp
BEFORE INSERT ON computerlizenz
FOR EACH ROW
DECLARE v_anzahl NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_anzahl FROM lizenzserver;
  INSERT INTO installiert_auf (lizenz_id, lizenzserver_id) VALUES (:NEW.lizenz_id, MOD(:NEW.lizenz_id, v_anzahl));
END;
/`,
      `CREATE OR REPLACE TRIGGER t_install_comp
AFTER INSERT ON computerlizenz
FOR EACH ROW
BEGIN
  INSERT INTO installiert_auf (lizenz_id, lizenzserver_id) VALUES (:NEW.lizenz_id, MOD(:NEW.lizenz_id, 3));
END;
/`,
    ],
    exam: true,
    points: 15,
    source: 'Übung 3b, Softwarelizenzen (1), mögliche Klausuraufgabe',
  },
  {
    id: 't-del-lic-server',
    topicId: '03-events',
    title: 'Lizenz (2): Lizenzserver löschen',
    level: 3,
    scenario: 'lizenz',
    task:
      'Ein Lizenzserver darf nur gelöscht werden, wenn auf ihm keine Lizenzen mehr installiert sind oder jede auf ihm installierte Lizenz zusätzlich auf einem weiteren Lizenzserver installiert ist. Sonst bricht der Trigger t_del_lic_server das Löschen ab. Für die Lizenzen des zu löschenden Servers musst du einen Cursor verwenden.',
    hints: [
      'BEFORE DELETE ON lizenzserver FOR EACH ROW – der Server steht in :OLD.lizenzserver_id.',
      'CURSOR c IS SELECT lizenz_id FROM installiert_auf WHERE lizenzserver_id = :OLD.lizenzserver_id;',
      'Pro Lizenz zählen, auf wie vielen anderen Servern sie liegt: … AND lizenzserver_id <> :OLD.lizenzserver_id',
    ],
    solution: `CREATE OR REPLACE TRIGGER t_del_lic_server
BEFORE DELETE ON lizenzserver
FOR EACH ROW
DECLARE
  CURSOR c_lizenzen IS
    SELECT lizenz_id FROM installiert_auf WHERE lizenzserver_id = :OLD.lizenzserver_id;
  v_andere NUMBER;
BEGIN
  FOR r IN c_lizenzen LOOP
    SELECT COUNT(*) INTO v_andere FROM installiert_auf
    WHERE lizenz_id = r.lizenz_id AND lizenzserver_id <> :OLD.lizenzserver_id;
    IF v_andere = 0 THEN
      RAISE_APPLICATION_ERROR(-20002, 'Lizenz ' || r.lizenz_id || ' ist nur auf diesem Server installiert.');
    END IF;
  END LOOP;
END;
/`,
    checks: [
      { label: 'BEFORE DELETE auf lizenzserver', hint: 'BEFORE DELETE ON lizenzserver', all: [r`${TRG} BEFORE DELETE ON LIZENZSERVER`], points: 3 },
      { label: 'Zeilentrigger', hint: 'FOR EACH ROW, damit :OLD.lizenzserver_id verfügbar ist', all: [ROW], points: 2 },
      {
        label: 'Cursor über die Lizenzen des Servers',
        hint: 'CURSOR c IS SELECT lizenz_id FROM installiert_auf WHERE lizenzserver_id = :OLD.lizenzserver_id;',
        any: [
          r`CURSOR \w+ IS SELECT [^;]*FROM INSTALLIERT_AUF WHERE [^;]*LIZENZSERVER_ID ?= ?:OLD\.LIZENZSERVER_ID`,
          r`FOR \w+ IN \( ?SELECT [^)]*FROM INSTALLIERT_AUF WHERE [^)]*LIZENZSERVER_ID ?= ?:OLD\.LIZENZSERVER_ID`,
        ],
        points: 5,
      },
      { label: 'Schleife über den Cursor', hint: 'FOR r IN c_lizenzen LOOP … END LOOP; (oder OPEN/FETCH/CLOSE)', any: [r`FOR \w+ IN (\w+|\( ?SELECT .*?\)) LOOP .*END LOOP`, r`FETCH \w+ INTO .*END LOOP`], points: 4 },
      { label: 'Andere Server je Lizenz gezählt', hint: 'SELECT COUNT(*) INTO … FROM installiert_auf WHERE lizenz_id = r.lizenz_id AND lizenzserver_id <> :OLD.lizenzserver_id;', all: [r`COUNT ?\( ?(\*|\w+) ?\) INTO \w+ FROM INSTALLIERT_AUF WHERE`, r`LIZENZSERVER_ID ?(<>|!=) ?:OLD\.LIZENZSERVER_ID`], points: 4 },
      { label: 'Abbruch, wenn eine Lizenz nur hier liegt', hint: 'IF v_andere = 0 THEN RAISE_APPLICATION_ERROR(-20002, …);', all: [RAISE], points: 3 },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_del_lic_server
BEFORE DELETE ON lizenzserver
FOR EACH ROW
DECLARE v_anzahl NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_anzahl FROM installiert_auf WHERE lizenzserver_id = :OLD.lizenzserver_id;
  IF v_anzahl > 0 THEN
    RAISE_APPLICATION_ERROR(-20002, 'Auf dem Server sind noch Lizenzen installiert.');
  END IF;
END;
/`,
    ],
    exam: true,
    points: 21,
    source: 'Übung 3b, Softwarelizenzen (2), ehemalige Klausuraufgabe',
  },
  {
    id: 'zimmer-verfuegbarkeit',
    topicId: '03-events',
    title: 'Altklausur: Trigger für Zimmerverfügbarkeit',
    level: 3,
    scenario: 'hotel',
    task:
      'Erstelle einen Trigger, der vor jeder Buchung sicherstellt, dass im Buchungszeitraum (Anreise bis Abreise) die Anzahl der verfügbaren Einzel- und Doppelzimmer des Hotels nicht überschritten wird. Bei Überschreitung bricht er die Buchung mit einer Oracle-Fehlermeldung ab. Die Funktionen fun_gebuchteEZ und fun_gebuchteDZ (Parameter: Hotel_ID, Anfangszeitraum DATE, Endzeitraum DATE) liefern die Anzahl bereits gebuchter Zimmer im Zeitraum.',
    hints: [
      'BEFORE INSERT ON buchung FOR EACH ROW',
      'Die Zimmeranzahl des Hotels: SELECT anzahlez, anzahldz INTO … FROM hotel WHERE hotel_id = :NEW.hotel_id;',
      'Bereits gebucht plus neu gebucht darf nicht größer sein als vorhanden: fun_gebuchteEZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) + :NEW.gebuchteez > v_ez',
      'Kein COMMIT im Trigger.',
    ],
    solution: `CREATE OR REPLACE TRIGGER t_zimmer_verfuegbar
BEFORE INSERT ON buchung
FOR EACH ROW
DECLARE
  v_ez hotel.anzahlez%TYPE;
  v_dz hotel.anzahldz%TYPE;
BEGIN
  SELECT anzahlez, anzahldz INTO v_ez, v_dz FROM hotel WHERE hotel_id = :NEW.hotel_id;
  IF fun_gebuchteEZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) + :NEW.gebuchteez > v_ez
     OR fun_gebuchteDZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) + :NEW.gebuchtedz > v_dz THEN
    RAISE_APPLICATION_ERROR(-20010, 'Nicht genügend freie Zimmer im Buchungszeitraum.');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE INSERT auf buchung', hint: 'BEFORE INSERT ON buchung – „vor jeder Buchung“', all: [r`${TRG} BEFORE INSERT( OR UPDATE)? ON BUCHUNG`], points: 2 },
      { label: 'Zeilentrigger', hint: 'FOR EACH ROW, damit die neue Buchung in :NEW steht', all: [ROW], points: 2 },
      { label: 'Zimmeranzahl des Hotels gelesen', hint: 'SELECT anzahlez, anzahldz INTO … FROM hotel WHERE hotel_id = :NEW.hotel_id;', all: [r`SELECT [^;]*ANZAHLEZ[^;]* INTO [^;]*FROM HOTEL WHERE (\w+\.)?HOTEL_ID ?= ?:NEW\.HOTEL_ID`, r`SELECT [^;]*ANZAHLDZ[^;]* INTO [^;]*FROM HOTEL WHERE`], points: 3 },
      {
        label: 'Gebuchte Zimmer im Zeitraum abgefragt',
        hint: 'fun_gebuchteEZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) und fun_gebuchteDZ(…)',
        all: [r`FUN_GEBUCHTEEZ ?\( ?:NEW\.HOTEL_ID ?, ?:NEW\.ANREISE ?, ?:NEW\.ABREISE ?\)`, r`FUN_GEBUCHTEDZ ?\( ?:NEW\.HOTEL_ID ?, ?:NEW\.ANREISE ?, ?:NEW\.ABREISE ?\)`],
        points: 3,
      },
      { label: 'Neue Zimmer mitgezählt und verglichen', hint: '… + :NEW.gebuchteez > v_ez OR … + :NEW.gebuchtedz > v_dz', all: [r`:NEW\.GEBUCHTEEZ`, r`:NEW\.GEBUCHTEDZ`, r`\bOR\b`], points: 3 },
      { label: 'Abbruch mit Oracle-Fehlermeldung, ohne COMMIT', hint: 'RAISE_APPLICATION_ERROR(-20010, …); – COMMIT ist im Trigger nicht erlaubt.', all: [RAISE], none: [r`\bCOMMIT\b`], points: 3 },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_zimmer_verfuegbar
BEFORE INSERT ON buchung
FOR EACH ROW
DECLARE v_ez NUMBER; v_dz NUMBER;
BEGIN
  SELECT anzahlez, anzahldz INTO v_ez, v_dz FROM hotel WHERE hotel_id = :NEW.hotel_id;
  IF fun_gebuchteEZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) > v_ez
     OR fun_gebuchteDZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) > v_dz THEN
    RAISE_APPLICATION_ERROR(-20010, 'Nicht genügend Zimmer');
  END IF;
END;
/`,
      `CREATE OR REPLACE TRIGGER t_zimmer_verfuegbar
AFTER INSERT ON buchung
FOR EACH ROW
DECLARE v_ez NUMBER; v_dz NUMBER;
BEGIN
  SELECT anzahlez, anzahldz INTO v_ez, v_dz FROM hotel WHERE hotel_id = :NEW.hotel_id;
  IF fun_gebuchteEZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) + :NEW.gebuchteez > v_ez
     OR fun_gebuchteDZ(:NEW.hotel_id, :NEW.anreise, :NEW.abreise) + :NEW.gebuchtedz > v_dz THEN
    RAISE_APPLICATION_ERROR(-20010, 'Nicht genügend Zimmer');
  END IF;
  COMMIT;
END;
/`,
    ],
    exam: true,
    points: 16,
    source: 'Altklausur, Aufgabe 1 (Trigger für Zimmerverfügbarkeit)',
  },
  // ---------------------------------------------------------------- Mutating Table, Compound
  {
    id: 't-follower',
    topicId: '03-mutating',
    title: 'Lizenz (3): Compound-Trigger für Folgelizenzen',
    level: 3,
    scenario: 'lizenz',
    task:
      'Beim Hinzufügen einer neuen Lizenz prüft der Trigger t_follower, ob es eine Folgelizenz ist: (i) die Bezeichnung stimmt mit einer bestehenden Lizenz überein, (ii) deren ersetzt_durch ist NULL und (iii) gueltig_von der neuen Lizenz liegt nach gueltig_bis der bestehenden. Dann trägt er bei der bestehenden Lizenz in ersetzt_durch die ID der neuen ein. Weil dieselbe Tabelle gelesen und geändert wird, brauchst du einen Compound-Trigger.',
    hints: [
      'CREATE OR REPLACE TRIGGER t_follower FOR INSERT ON lizenz COMPOUND TRIGGER',
      'Im AFTER EACH ROW-Teil die Werte aus :NEW in Variablen merken.',
      'Im AFTER STATEMENT-Teil das UPDATE mit diesen Variablen – dort gibt es kein :NEW.',
    ],
    solution: `CREATE OR REPLACE TRIGGER t_follower
FOR INSERT ON lizenz
COMPOUND TRIGGER
  v_id  lizenz.lizenz_id%TYPE;
  v_bez lizenz.bezeichnung%TYPE;
  v_von lizenz.gueltig_von%TYPE;

  AFTER EACH ROW IS
  BEGIN
    v_id  := :NEW.lizenz_id;
    v_bez := :NEW.bezeichnung;
    v_von := :NEW.gueltig_von;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    UPDATE lizenz
       SET ersetzt_durch = v_id
     WHERE bezeichnung = v_bez
       AND ersetzt_durch IS NULL
       AND gueltig_bis < v_von
       AND lizenz_id <> v_id;
  END AFTER STATEMENT;
END t_follower;
/`,
    checks: [
      { label: 'Compound-Trigger für INSERT auf lizenz', hint: 'CREATE OR REPLACE TRIGGER t_follower FOR INSERT ON lizenz COMPOUND TRIGGER', all: [r`${TRG} FOR INSERT ON LIZENZ COMPOUND TRIGGER`], points: 4 },
      {
        label: 'Neue Werte im Zeilenteil gemerkt',
        hint: 'AFTER EACH ROW IS BEGIN v_id := :NEW.lizenz_id; v_bez := :NEW.bezeichnung; v_von := :NEW.gueltig_von; END AFTER EACH ROW;',
        all: [r`(BEFORE|AFTER) EACH ROW IS BEGIN .*:NEW\.LIZENZ_ID.*END (BEFORE|AFTER) EACH ROW`, r`EACH ROW IS BEGIN .*:NEW\.BEZEICHNUNG.*END (BEFORE|AFTER) EACH ROW`, r`EACH ROW IS BEGIN .*:NEW\.GUELTIG_VON.*END (BEFORE|AFTER) EACH ROW`],
        points: 5,
      },
      { label: 'UPDATE von ersetzt_durch im Statement-Teil', hint: 'AFTER STATEMENT IS BEGIN UPDATE lizenz SET ersetzt_durch = v_id …', all: [r`AFTER STATEMENT IS BEGIN .*UPDATE LIZENZ SET ERSETZT_DURCH ?= ?\w+`], points: 5 },
      { label: '(i) gleiche Bezeichnung', hint: 'WHERE bezeichnung = v_bez', all: [r`AFTER STATEMENT IS .*WHERE .*BEZEICHNUNG ?= ?\w+`], points: 3 },
      { label: '(ii) ersetzt_durch ist NULL', hint: 'AND ersetzt_durch IS NULL', all: [r`AFTER STATEMENT IS .*ERSETZT_DURCH IS NULL`], points: 3 },
      { label: '(iii) neue Lizenz beginnt nach dem Ende der alten', hint: 'AND gueltig_bis < v_von', any: [r`AFTER STATEMENT IS .*GUELTIG_BIS ?< ?\w+`, r`AFTER STATEMENT IS .*\w+ ?> ?GUELTIG_BIS`], points: 3 },
      { label: 'Kein :NEW im Statement-Teil', hint: 'Im AFTER STATEMENT-Teil gibt es keine Transitionsvariablen.', all: [r`AFTER STATEMENT IS`], none: [r`AFTER STATEMENT IS .*:NEW\.`], points: 2 },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_follower
AFTER INSERT ON lizenz
FOR EACH ROW
BEGIN
  UPDATE lizenz SET ersetzt_durch = :NEW.lizenz_id
  WHERE bezeichnung = :NEW.bezeichnung AND ersetzt_durch IS NULL AND gueltig_bis < :NEW.gueltig_von;
END;
/`,
      `CREATE OR REPLACE TRIGGER t_follower
FOR INSERT ON lizenz
COMPOUND TRIGGER
  AFTER STATEMENT IS
  BEGIN
    UPDATE lizenz SET ersetzt_durch = :NEW.lizenz_id
    WHERE bezeichnung = :NEW.bezeichnung AND ersetzt_durch IS NULL AND gueltig_bis < :NEW.gueltig_von;
  END AFTER STATEMENT;
END t_follower;
/`,
    ],
    exam: true,
    points: 25,
    source: 'Übung 3b, Softwarelizenzen (3), Compound Trigger',
  },
  {
    id: 'spieler-teams',
    topicId: '03-mutating',
    title: 'Compound-Trigger: Spieler abwechselnd auf Teams verteilen',
    level: 3,
    scenario: 'keins',
    task:
      'Gegeben ist die Tabelle SPIELER(NAME, TEAM). Neue Spieler sollen automatisch abwechselnd den Teams 1 und 2 zugeteilt werden: Neu kommt immer in das Team mit weniger Spielern, bei Gleichstand in Team 1. Weil dafür die Tabelle SPIELER gelesen wird, während darauf eingefügt wird, schreibe einen Compound-Trigger.',
    hints: [
      'CREATE OR REPLACE TRIGGER … FOR INSERT ON spieler COMPOUND TRIGGER',
      'Im BEFORE STATEMENT-Teil die Teamgrößen zählen: SELECT COUNT(*) INTO v_team1 FROM spieler WHERE team = 1;',
      'Im BEFORE EACH ROW-Teil :NEW.team setzen und den Zähler der gewählten Gruppe erhöhen, damit mehrere Zeilen in einer Anweisung abwechseln.',
    ],
    solution: `CREATE OR REPLACE TRIGGER t_team_zuteilen
FOR INSERT ON spieler
COMPOUND TRIGGER
  v_team1 NUMBER;
  v_team2 NUMBER;

  BEFORE STATEMENT IS
  BEGIN
    SELECT COUNT(*) INTO v_team1 FROM spieler WHERE team = 1;
    SELECT COUNT(*) INTO v_team2 FROM spieler WHERE team = 2;
  END BEFORE STATEMENT;

  BEFORE EACH ROW IS
  BEGIN
    IF v_team1 <= v_team2 THEN
      :NEW.team := 1;
      v_team1 := v_team1 + 1;
    ELSE
      :NEW.team := 2;
      v_team2 := v_team2 + 1;
    END IF;
  END BEFORE EACH ROW;
END t_team_zuteilen;
/`,
    checks: [
      { label: 'Compound-Trigger FOR INSERT ON spieler', hint: 'CREATE OR REPLACE TRIGGER … FOR INSERT ON spieler COMPOUND TRIGGER', all: [r`${TRG} FOR INSERT ON SPIELER COMPOUND TRIGGER`] },
      { label: 'Teamgrößen im BEFORE STATEMENT-Teil gezählt', hint: 'BEFORE STATEMENT IS BEGIN SELECT COUNT(*) INTO … FROM spieler WHERE team = 1; … team = 2; END BEFORE STATEMENT;', all: [r`BEFORE STATEMENT IS BEGIN .*COUNT ?\( ?\* ?\) INTO \w+ FROM SPIELER WHERE TEAM ?= ?1.*COUNT ?\( ?\* ?\) INTO \w+ FROM SPIELER WHERE TEAM ?= ?2.*END BEFORE STATEMENT`] },
      { label: ':NEW.team im BEFORE EACH ROW-Teil gesetzt', hint: 'BEFORE EACH ROW IS BEGIN … :NEW.team := 1; … :NEW.team := 2; … END BEFORE EACH ROW;', all: [r`BEFORE EACH ROW IS BEGIN .*:NEW\.TEAM ?:= ?1.*:NEW\.TEAM ?:= ?2.*END BEFORE EACH ROW`] },
      { label: 'Zähler im Row-Teil fortgeschrieben', hint: 'Mehrere Zeilen in einer Anweisung wechseln nur, wenn v_team1 := v_team1 + 1 im Row-Teil steht.', all: [r`BEFORE EACH ROW IS .*(\w+) ?:= ?\1 ?\+ ?1.*(\w+) ?:= ?\2 ?\+ ?1`] },
      { label: 'Kein SELECT auf spieler im Row-Teil', hint: 'Das Lesen der eigenen Tabelle im Row-Teil löst das Mutating-Table-Problem aus.', all: [r`TRIGGER`], none: [r`BEFORE EACH ROW IS .*FROM SPIELER .*END BEFORE EACH ROW`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_team_zuteilen
BEFORE INSERT ON spieler
FOR EACH ROW
DECLARE v_team1 NUMBER; v_team2 NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_team1 FROM spieler WHERE team = 1;
  SELECT COUNT(*) INTO v_team2 FROM spieler WHERE team = 2;
  IF v_team1 <= v_team2 THEN :NEW.team := 1; ELSE :NEW.team := 2; END IF;
END;
/`,
    ],
    source: 'Praktikum, DBS2 Test 2 (Compound Trigger SPIELER)',
  },
  {
    id: 'gilde-pro-monat',
    topicId: '03-before-after',
    title: 'Eine Gilde pro Monat',
    level: 2,
    scenario: 'keins',
    task:
      'Gegeben ist die Tabelle GILDEN(GILDEN_ID, NAME, GRUNDUNGSDATUM, CHARAKTER_ID). Ein Videospiel-Charakter gründet eine Gilde, CHARAKTER_ID ist der Gründer. Jeder Charakter darf pro Monat nur eine Gilde gründen. Versucht er eine weitere im selben Monat zu gründen, soll das Einfügen mit dem Fehler „Ein Charakter darf pro Monat nur eine Gilde gründen.“ verhindert werden.',
    hints: [
      'Etwas verhindern heißt: vor dem Einfügen prüfen, also BEFORE INSERT ON gilden FOR EACH ROW.',
      'Die Werte der neuen Zeile stehen in :NEW (mit Doppelpunkt).',
      'Gleicher Monat im gleichen Jahr: TO_CHAR(grundungsdatum, \'MM.YYYY\') = TO_CHAR(:NEW.grundungsdatum, \'MM.YYYY\')',
    ],
    solution: `CREATE OR REPLACE TRIGGER eine_gilde_pro_monat
BEFORE INSERT ON gilden
FOR EACH ROW
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM gilden
  WHERE charakter_id = :NEW.charakter_id
  AND TO_CHAR(grundungsdatum, 'MM.YYYY') = TO_CHAR(:NEW.grundungsdatum, 'MM.YYYY');

  IF v_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Ein Charakter darf pro Monat nur eine Gilde gründen.');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE INSERT als Zeilentrigger', hint: 'BEFORE INSERT ON gilden FOR EACH ROW', all: [r`${TRG} BEFORE INSERT ON GILDEN ${ROW}`] },
      { label: 'Gilden desselben Charakters gezählt', hint: 'SELECT COUNT(*) INTO v_count FROM gilden WHERE charakter_id = :NEW.charakter_id', all: [r`SELECT COUNT ?\( ?\* ?\) INTO \w+ FROM GILDEN WHERE`, r`CHARAKTER_ID ?= ?:NEW\.CHARAKTER_ID`] },
      {
        label: 'Auf denselben Monat im selben Jahr eingeschränkt',
        hint: "TO_CHAR(grundungsdatum, 'MM.YYYY') = TO_CHAR(:NEW.grundungsdatum, 'MM.YYYY'), alternativ TRUNC(…, 'MM') oder EXTRACT(MONTH …) und EXTRACT(YEAR …)",
        all: [r`:NEW\.GRUNDUNGSDATUM`],
        any: [r`TO_CHAR ?\( ?GRUNDUNGSDATUM ?,`, r`TRUNC ?\( ?GRUNDUNGSDATUM ?,`, r`EXTRACT ?\( ?MONTH FROM GRUNDUNGSDATUM ?\)`],
      },
      { label: 'Abbruch bei bereits gegründeter Gilde', hint: "IF v_count > 0 THEN RAISE_APPLICATION_ERROR(-20001, '…'); END IF;", all: [r`IF \w+ ?(> ?0|>= ?1) THEN ${RAISE}`] },
      { label: 'Transitionsvariablen mit Doppelpunkt', hint: 'Im Trigger-Rumpf heißt es :NEW.charakter_id, nicht NEW.charakter_id.', all: [r`:NEW\.`], none: [r`(^|[^:\w])NEW\.`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER eine_gilde_pro_monat
BEFORE INSERT ON gilden
FOR EACH ROW
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM gilden
  WHERE charakter_id = NEW.charakter_id
  AND TO_CHAR(grundungsdatum, 'MM.YYYY') = TO_CHAR(NEW.grundungsdatum, 'MM.YYYY');
  IF v_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Ein Charakter darf pro Monat nur eine Gilde gründen.');
  END IF;
END;
/`,
      `CREATE OR REPLACE TRIGGER eine_gilde_pro_monat
AFTER INSERT ON gilden
FOR EACH ROW
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM gilden WHERE charakter_id = :NEW.charakter_id;
  IF v_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Ein Charakter darf pro Monat nur eine Gilde gründen.');
  END IF;
END;
/`,
    ],
    source: 'Praktikum, DDM P2 (Relationenmodell 1, Gilde pro Monat)',
  },
  {
    id: 'abteilungsleitung-spezialisierung',
    topicId: '03-events',
    title: 'Abteilungsleitung: gleiche Spezialisierung',
    level: 2,
    scenario: 'keins',
    task:
      'Gegeben sind ABTEILUNG(ABTEILUNGS_ID, NAME, STANDORT, ABTEILUNGS_LEITER_ID → ARZT) und ARZT(ARZT_ID, VORNAME, NACHNAME, EMAIL, LEVEL, SPEZIALISIERUNG VARCHAR2(20) NOT NULL, ABTEILUNGS_ID → ABTEILUNG). Ein Trigger soll sicherstellen, dass sich beim Wechsel der Abteilungsleitung die Spezialisierung der Leitung nicht ändert. Sonst bricht er mit „Die neue Abteilungsleitung hat die falsche Spezialisierung“ ab.',
    hints: [
      'Gefeuert wird nur, wenn sich die Leitung ändert: BEFORE UPDATE OF abteilungs_leiter_id ON abteilung FOR EACH ROW',
      'Die Spezialisierungen stehen in ARZT: einmal für :NEW.abteilungs_leiter_id, einmal für :OLD.abteilungs_leiter_id.',
      'Variablen passend typisieren: arzt.spezialisierung%TYPE oder VARCHAR2(20).',
    ],
    solution: `CREATE OR REPLACE TRIGGER trg_leiter_wechsel
BEFORE UPDATE OF abteilungs_leiter_id ON abteilung
FOR EACH ROW
DECLARE
  v_alt arzt.spezialisierung%TYPE;
  v_neu arzt.spezialisierung%TYPE;
BEGIN
  SELECT spezialisierung INTO v_neu FROM arzt WHERE arzt_id = :NEW.abteilungs_leiter_id;
  SELECT spezialisierung INTO v_alt FROM arzt WHERE arzt_id = :OLD.abteilungs_leiter_id;

  IF v_neu != v_alt THEN
    RAISE_APPLICATION_ERROR(-20001, 'Die neue Abteilungsleitung hat die falsche Spezialisierung');
  END IF;
END;
/`,
    checks: [
      { label: 'BEFORE UPDATE OF abteilungs_leiter_id als Zeilentrigger', hint: 'BEFORE UPDATE OF abteilungs_leiter_id ON abteilung FOR EACH ROW', all: [r`${TRG} BEFORE UPDATE OF ABTEILUNGS_LEITER_ID ON ABTEILUNG ${ROW}`] },
      { label: 'Spezialisierung der neuen Leitung gelesen', hint: 'SELECT spezialisierung INTO v_neu FROM arzt WHERE arzt_id = :NEW.abteilungs_leiter_id;', all: [r`SELECT SPEZIALISIERUNG INTO \w+ FROM ARZT WHERE ARZT_ID ?= ?:NEW\.ABTEILUNGS_LEITER_ID`] },
      { label: 'Spezialisierung der alten Leitung gelesen', hint: 'SELECT spezialisierung INTO v_alt FROM arzt WHERE arzt_id = :OLD.abteilungs_leiter_id;', all: [r`SELECT SPEZIALISIERUNG INTO \w+ FROM ARZT WHERE ARZT_ID ?= ?:OLD\.ABTEILUNGS_LEITER_ID`] },
      { label: 'Abbruch bei unterschiedlicher Spezialisierung', hint: "IF v_neu != v_alt THEN RAISE_APPLICATION_ERROR(-20001, '…'); END IF;", all: [r`IF \w+ ?(!=|<>|\^=) ?\w+ THEN ${RAISE}`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER trg_leiter_wechsel
AFTER UPDATE OF abteilungs_leiter_id ON abteilung
FOR EACH ROW
DECLARE
  v_alt VARCHAR2(20);
  v_neu VARCHAR2(20);
BEGIN
  SELECT spezialisierung INTO v_neu FROM arzt WHERE arzt_id = :NEW.abteilungs_leiter_id;
  SELECT spezialisierung INTO v_alt FROM arzt WHERE arzt_id = :OLD.abteilungs_leiter_id;
  IF v_neu != v_alt THEN
    RAISE_APPLICATION_ERROR(-20001, 'Die neue Abteilungsleitung hat die falsche Spezialisierung');
  END IF;
END;
/`,
      `CREATE OR REPLACE TRIGGER trg_leiter_wechsel
BEFORE UPDATE OF abteilungs_leiter_id ON abteilung
FOR EACH ROW
BEGIN
  IF :NEW.abteilungs_leiter_id != :OLD.abteilungs_leiter_id THEN
    RAISE_APPLICATION_ERROR(-20001, 'Die neue Abteilungsleitung hat die falsche Spezialisierung');
  END IF;
END;
/`,
    ],
    source: 'Praktikum, DDM P2 (Relationenmodell 2, Abteilungsleitung)',
  },
  {
    id: 'comp-increase-sal',
    topicId: '03-mutating',
    title: 'Compound-Trigger: Gehalt nach Anzahl Projekte',
    level: 3,
    scenario: 'coworkers',
    task:
      'Bei Ernennung zur Projektleitung steigt das Gehalt um 10 %, wenn es das erste Projekt der Person ist, und um 20 % beim zweiten. Mehr als 2 Projekte darf niemand leiten. Weil dafür PROJECTS gezählt werden muss, während PROJECTS geändert wird, schreibe einen Compound-Trigger comp_increase_sal_after.',
    hints: ['FOR INSERT OR UPDATE ON projects COMPOUND TRIGGER', 'AFTER EACH ROW: leader_id := :NEW.leader;', 'AFTER STATEMENT: SELECT COUNT(*) INTO num_projects FROM projects WHERE leader = leader_id; dann IF … ELSIF …'],
    solution: `CREATE OR REPLACE TRIGGER comp_increase_sal_after
FOR INSERT OR UPDATE ON projects
COMPOUND TRIGGER
  leader_id    projects.leader%TYPE;
  num_projects NUMBER;

  AFTER EACH ROW IS
  BEGIN
    leader_id := :NEW.leader;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    SELECT COUNT(*) INTO num_projects FROM projects WHERE leader = leader_id;
    IF num_projects = 1 THEN
      UPDATE coworkers SET salary = salary * 1.1 WHERE id = leader_id;
    ELSIF num_projects = 2 THEN
      UPDATE coworkers SET salary = salary * 1.2 WHERE id = leader_id;
    ELSIF num_projects > 2 THEN
      RAISE_APPLICATION_ERROR(-20111, 'Too many projects!!!');
    END IF;
  END AFTER STATEMENT;
END comp_increase_sal_after;
/`,
    checks: [
      { label: 'Compound-Trigger auf projects', hint: 'FOR INSERT OR UPDATE ON projects COMPOUND TRIGGER', all: [r`${TRG} FOR (INSERT OR UPDATE|UPDATE OR INSERT)( OF LEADER)? ON PROJECTS COMPOUND TRIGGER`] },
      { label: 'Leitung im Zeilenteil gemerkt', hint: 'AFTER EACH ROW IS BEGIN leader_id := :NEW.leader; END AFTER EACH ROW;', all: [r`EACH ROW IS BEGIN \w+ ?:= ?:NEW\.LEADER ?; END (BEFORE|AFTER) EACH ROW`] },
      { label: 'Projekte im Statement-Teil gezählt', hint: 'AFTER STATEMENT IS BEGIN SELECT COUNT(*) INTO num_projects FROM projects WHERE leader = leader_id;', all: [r`AFTER STATEMENT IS BEGIN SELECT COUNT ?\( ?(\*|\w+) ?\) INTO \w+ FROM PROJECTS WHERE LEADER ?= ?\w+`] },
      { label: 'Drei Fälle: 10 %, 20 %, Abbruch', hint: '= 1 → * 1.1, = 2 → * 1.2, > 2 → RAISE_APPLICATION_ERROR', all: [r`SALARY ?\* ?1\.10?\b`, r`SALARY ?\* ?1\.20?\b`, r`> ?2 THEN ${RAISE}`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER comp_increase_sal_after
AFTER INSERT OR UPDATE ON projects
FOR EACH ROW
DECLARE num_projects NUMBER;
BEGIN
  SELECT COUNT(*) INTO num_projects FROM projects WHERE leader = :NEW.leader;
  IF num_projects = 1 THEN UPDATE coworkers SET salary = salary * 1.1 WHERE id = :NEW.leader;
  ELSIF num_projects = 2 THEN UPDATE coworkers SET salary = salary * 1.2 WHERE id = :NEW.leader;
  ELSIF num_projects > 2 THEN RAISE_APPLICATION_ERROR(-20111, 'Too many projects!!!');
  END IF;
END;
/`,
    ],
    source: 'Folien Trigger, Compound Trigger Beispiel (comp_increase_sal_after)',
  },
  // ---------------------------------------------------------------- Testen und Verwalten
  {
    id: 'trigger-testen',
    topicId: '03-testen',
    title: 'Trigger systematisch testen',
    level: 1,
    scenario: 'coworkers',
    task:
      'Der Trigger t_keine_gehaltsminderung existiert. Schreibe ein Testskript für alle drei Fälle (Gehalt höher, gleich, niedriger). Prüfe nach dem erlaubten Fall mit SELECT, ob das Gehalt geändert wurde, und setze nach jedem Fall mit ROLLBACK zurück.',
    hints: ['Höher: SET salary = salary + 100, gleich: SET salary = salary, niedriger: SET salary = salary - 100', 'Nach jedem Test: ROLLBACK;'],
    solution: `UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
SELECT salary FROM coworkers WHERE id = 1;
ROLLBACK;
UPDATE coworkers SET salary = salary WHERE id = 1;
ROLLBACK;
UPDATE coworkers SET salary = salary - 100 WHERE id = 1;
ROLLBACK;`,
    checks: [
      { label: 'Fall „höher“ getestet und geprüft', hint: 'UPDATE … SET salary = salary + 100 …; SELECT salary FROM coworkers …;', all: [r`SET SALARY ?= ?SALARY ?\+ ?\d+[^;]*; SELECT [^;]*SALARY[^;]* FROM COWORKERS`] },
      { label: 'Fall „gleich“ getestet', hint: 'UPDATE coworkers SET salary = salary WHERE id = 1;', all: [r`SET SALARY ?= ?SALARY( WHERE[^;]*)? ?;`] },
      { label: 'Fall „niedriger“ getestet', hint: 'UPDATE coworkers SET salary = salary - 100 WHERE id = 1;', all: [r`SET SALARY ?= ?SALARY ?- ?\d+`] },
      { label: 'Nach jedem Fall ROLLBACK', hint: 'Drei Tests, drei ROLLBACKs', all: [r`(ROLLBACK ?;.*){3}`] },
    ],
    wrong: [
      `UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
UPDATE coworkers SET salary = salary WHERE id = 1;
UPDATE coworkers SET salary = salary - 100 WHERE id = 1;
COMMIT;`,
    ],
    source: 'Folien Trigger, Testen von Triggern; Übung Trigger (a)',
  },
  {
    id: 'trigger-verwalten',
    topicId: '03-testen',
    title: 'Trigger ab- und einschalten, löschen',
    level: 1,
    scenario: 'coworkers',
    task:
      'Schalte den Trigger pay_bonus ab und wieder ein. Schalte danach alle Trigger der Tabelle COWORKERS auf einmal ab und wieder ein. Zeige Name und Status aller deiner Trigger an und lösche zum Schluss pay_bonus.',
    hints: ['ALTER TRIGGER name DISABLE; / ENABLE;', 'ALTER TABLE coworkers DISABLE ALL TRIGGERS;', 'Status steht in USER_TRIGGERS: SELECT trigger_name, status FROM user_triggers;'],
    solution: `ALTER TRIGGER pay_bonus DISABLE;
ALTER TRIGGER pay_bonus ENABLE;
ALTER TABLE coworkers DISABLE ALL TRIGGERS;
ALTER TABLE coworkers ENABLE ALL TRIGGERS;
SELECT trigger_name, status FROM user_triggers;
DROP TRIGGER pay_bonus;`,
    checks: [
      { label: 'Einzelnen Trigger ab- und eingeschaltet', hint: 'ALTER TRIGGER pay_bonus DISABLE; ALTER TRIGGER pay_bonus ENABLE;', all: [r`ALTER TRIGGER PAY_BONUS DISABLE`, r`ALTER TRIGGER PAY_BONUS ENABLE`] },
      { label: 'Alle Trigger der Tabelle geschaltet', hint: 'ALTER TABLE coworkers DISABLE ALL TRIGGERS; … ENABLE ALL TRIGGERS;', all: [r`ALTER TABLE COWORKERS DISABLE ALL TRIGGERS`, r`ALTER TABLE COWORKERS ENABLE ALL TRIGGERS`] },
      { label: 'Status aus USER_TRIGGERS', hint: 'SELECT trigger_name, status FROM user_triggers;', all: [r`SELECT [^;]*STATUS[^;]* FROM USER_TRIGGERS`] },
      { label: 'Trigger gelöscht', hint: 'DROP TRIGGER pay_bonus;', all: [r`DROP TRIGGER PAY_BONUS`] },
    ],
    wrong: [
      `ALTER TRIGGER pay_bonus DISABLE;
ALTER TRIGGER pay_bonus ENABLE;
ALTER TRIGGER coworkers DISABLE ALL;
ALTER TRIGGER coworkers ENABLE ALL;
SELECT trigger_name, status FROM user_triggers;
DROP TRIGGER pay_bonus;`,
    ],
    source: 'Folien Trigger, Trigger verwalten',
  },
];
