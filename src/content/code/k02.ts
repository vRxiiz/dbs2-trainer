// Kapitel 2 – PL/SQL: Übung 2a/2b, Folienbeispiele (COWORKERS), Altklausur Aufgabe 3
import type { CodeTask } from '../codeTypes';

const r = String.raw;
/** Kopf einer Prozedur mit beliebigem Namen */
const PROC = r`CREATE (OR REPLACE )?PROCEDURE \w+`;
const FUNC = r`CREATE (OR REPLACE )?FUNCTION \w+`;
const OUT = r`DBMS_OUTPUT\.PUT_LINE ?\(`;

export const k02: CodeTask[] = [
  // ---------------------------------------------------------------- Blöcke
  {
    id: 'hallo-welt',
    topicId: '02-bloecke',
    title: 'Anonymer Block: Hello World',
    level: 1,
    scenario: 'keins',
    task: 'Schreibe einen anonymen Block, der „Hello World“ auf die Konsole ausgibt. Stelle vorher den Serveroutput auf ON.',
    hints: ['SET SERVEROUTPUT ON schaltet die Ausgabe im SQL Developer ein.', 'Ausgabe mit DBMS_OUTPUT.PUT_LINE(\'…\');', 'Der Block endet mit END; und einem / in der nächsten Zeile.'],
    solution: `SET SERVEROUTPUT ON
BEGIN
  DBMS_OUTPUT.PUT_LINE('Hello World');
END;
/`,
    checks: [
      { label: 'Serveroutput eingeschaltet', hint: 'Vor dem Block: SET SERVEROUTPUT ON', all: [r`SET SERVEROUTPUT ON`] },
      { label: 'Anonymer Block BEGIN … END;', hint: 'Ein anonymer Block hat keinen Namen: BEGIN … END;', all: [r`BEGIN .*END ?;`], none: [r`CREATE `] },
      { label: 'Ausgabe mit DBMS_OUTPUT.PUT_LINE', hint: 'DBMS_OUTPUT.PUT_LINE(\'Hello World\');', all: [r`${OUT} ?'…' ?\)`] },
    ],
    wrong: [
      `BEGIN
  DBMS_OUTPUT.PUT_LINE('Hello World');
END;
/`,
      `SET SERVEROUTPUT ON
BEGIN
  PRINT('Hello World');
END;
/`,
    ],
    source: 'Übung 2a, Anonymer Block',
  },
  {
    id: 'greetings',
    topicId: '02-bloecke',
    title: 'Erste Prozedur: greetings',
    level: 1,
    scenario: 'keins',
    task: 'Lege eine Prozedur greetings an, die „Hello World!“ ausgibt, und rufe sie danach einmal mit EXECUTE und einmal aus einem anonymen Block auf.',
    hints: ['CREATE OR REPLACE PROCEDURE name AS BEGIN … END;', 'Aufruf: EXECUTE greetings; oder BEGIN greetings; END;'],
    solution: `CREATE OR REPLACE PROCEDURE greetings AS
BEGIN
  DBMS_OUTPUT.PUT_LINE('Hello World!');
END;
/
EXECUTE greetings;
BEGIN
  greetings;
END;
/`,
    checks: [
      { label: 'Prozedur greetings angelegt', hint: 'CREATE OR REPLACE PROCEDURE greetings AS …', all: [r`CREATE (OR REPLACE )?PROCEDURE GREETINGS (AS|IS) BEGIN`] },
      { label: 'Ausgabe im Rumpf', hint: 'DBMS_OUTPUT.PUT_LINE(\'Hello World!\');', all: [OUT] },
      { label: 'Aufruf mit EXECUTE', hint: 'EXECUTE greetings; (kurz: EXEC greetings;)', all: [r`EXEC(UTE)? GREETINGS`] },
      { label: 'Aufruf aus einem anonymen Block', hint: 'BEGIN greetings; END;', all: [r`BEGIN GREETINGS ?; END ?;`] },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE greetings AS
BEGIN
  DBMS_OUTPUT.PUT_LINE('Hello World!');
END;
/`,
    ],
    source: 'Folien PL/SQL, Prozeduren (greetings)',
  },
  // ---------------------------------------------------------------- Variablen
  {
    id: 'variablen-select-into',
    topicId: '02-variablen',
    title: 'Variablen mit %TYPE und SELECT INTO',
    level: 1,
    scenario: 'coworkers',
    task: 'Schreibe einen anonymen Block, der Name und Gehalt des Mitarbeitenden mit der ID 1 in zwei Variablen liest und als „<Name>: <Gehalt>“ ausgibt. Die Variablen sollen den Datentyp der Tabellenspalten übernehmen.',
    hints: ['Deklaration: v_name coworkers.name%TYPE;', 'SELECT name, salary INTO v_name, v_salary FROM … WHERE id = 1;', 'Texte verkettest du mit ||.'],
    solution: `DECLARE
  v_name   coworkers.name%TYPE;
  v_salary coworkers.salary%TYPE;
BEGIN
  SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = 1;
  DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_salary);
END;
/`,
    checks: [
      { label: 'Variablen mit %TYPE deklariert', hint: 'v_name coworkers.name%TYPE; v_salary coworkers.salary%TYPE;', all: [r`DECLARE .*COWORKERS\.NAME%TYPE`, r`COWORKERS\.SALARY%TYPE`] },
      { label: 'SELECT … INTO für ID 1', hint: 'SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = 1;', all: [r`SELECT NAME ?, ?SALARY INTO \w+ ?, ?\w+ FROM COWORKERS WHERE ID ?= ?1\b`] },
      { label: 'Ausgabe mit Verkettung', hint: 'DBMS_OUTPUT.PUT_LINE(v_name || \': \' || v_salary);', all: [r`${OUT}[^;]*\|\|`] },
    ],
    wrong: [
      `DECLARE
  v_name   VARCHAR2(20);
  v_salary NUMBER;
BEGIN
  SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = 1;
  DBMS_OUTPUT.PUT_LINE(v_name || ': ' || v_salary);
END;
/`,
    ],
    source: 'Folien PL/SQL, Variablen und %TYPE',
  },
  {
    id: 'square-num',
    topicId: '02-variablen',
    title: 'IN-OUT-Parameter: Zahl quadrieren',
    level: 2,
    scenario: 'keins',
    task: 'Schreibe eine Prozedur square_num mit einem IN-OUT-Parameter x vom Typ NUMBER, die x durch x * x ersetzt. Rufe sie in einem anonymen Block für die Zahl 23 auf und gib das Ergebnis aus.',
    hints: ['Parametermodus: x IN OUT NUMBER', 'Zuweisung in PL/SQL mit :=', 'Beim Aufruf brauchst du eine Variable, keine Konstante.'],
    solution: `CREATE OR REPLACE PROCEDURE square_num (x IN OUT NUMBER) IS
BEGIN
  x := x * x;
END;
/
DECLARE
  a NUMBER := 23;
BEGIN
  square_num(a);
  DBMS_OUTPUT.PUT_LINE('Quadrat von 23: ' || a);
END;
/`,
    checks: [
      { label: 'Parameter x IN OUT NUMBER', hint: 'CREATE OR REPLACE PROCEDURE square_num (x IN OUT NUMBER) IS', all: [r`PROCEDURE SQUARE_NUM ?\( ?X IN OUT NUMBER ?\)`] },
      { label: 'x := x * x', hint: 'Zuweisung mit := im Rumpf', all: [r`X ?:= ?X ?\* ?X`] },
      { label: 'Aufruf mit Variable', hint: 'DECLARE a NUMBER := 23; BEGIN square_num(a); …', all: [r`DECLARE \w+ NUMBER ?:= ?23`, r`SQUARE_NUM ?\( ?\w+ ?\) ?;`], none: [r`SQUARE_NUM ?\( ?23 ?\)`] },
      { label: 'Ergebnis ausgegeben', hint: 'DBMS_OUTPUT.PUT_LINE(…)', all: [OUT] },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE square_num (x IN NUMBER) IS
BEGIN
  x := x * x;
END;
/
DECLARE
  a NUMBER := 23;
BEGIN
  square_num(a);
  DBMS_OUTPUT.PUT_LINE(a);
END;
/`,
    ],
    source: 'Folien PL/SQL, Parametermodi IN/OUT/IN OUT (squareNum)',
  },
  {
    id: 'neuer-mitarbeitende',
    topicId: '02-variablen',
    title: 'Prozedur neuer_mitarbeitende',
    level: 2,
    scenario: 'coworkers',
    task:
      'Erstelle eine Prozedur neuer_mitarbeitende, die einen neuen Mitarbeitenden in COWORKERS einfügt. Parameter: ID, Name, Alter, Adresse, Gehalt. Die Parameter sollen den Datentyp der Tabelle übernehmen (dynamische Datentypzuweisung). Rufe die Prozedur zum Testen einmal auf.',
    hints: ['Dynamische Datentypen: p_id coworkers.id%TYPE', 'INSERT INTO coworkers (id, name, age, address, salary) VALUES (p_id, …);', 'Aufruf z. B. mit EXEC neuer_mitarbeitende(8, \'Lisa\', 30, \'Köln\', 4000);'],
    solution: `CREATE OR REPLACE PROCEDURE neuer_mitarbeitende (
  p_id      coworkers.id%TYPE,
  p_name    coworkers.name%TYPE,
  p_age     coworkers.age%TYPE,
  p_address coworkers.address%TYPE,
  p_salary  coworkers.salary%TYPE
) IS
BEGIN
  INSERT INTO coworkers (id, name, age, address, salary)
  VALUES (p_id, p_name, p_age, p_address, p_salary);
END;
/
EXEC neuer_mitarbeitende(8, 'Lisa', 30, 'Köln', 4000);`,
    checks: [
      { label: 'Prozedur neuer_mitarbeitende mit Parametern', hint: 'CREATE OR REPLACE PROCEDURE neuer_mitarbeitende ( … ) IS', all: [r`CREATE (OR REPLACE )?PROCEDURE NEUER_MITARBEITENDE ?\(`], points: 2 },
      {
        label: 'Alle fünf Parameter mit %TYPE',
        hint: 'Jeder Parameter übernimmt den Typ der Spalte: coworkers.id%TYPE, coworkers.name%TYPE, coworkers.age%TYPE, coworkers.address%TYPE, coworkers.salary%TYPE.',
        all: ['ID', 'NAME', 'AGE', 'ADDRESS', 'SALARY'].map((c) => r`PROCEDURE NEUER_MITARBEITENDE ?\([^)]*COWORKERS\.${c}%TYPE`),
        points: 4,
      },
      { label: 'INSERT mit den Parametern', hint: 'INSERT INTO coworkers (…) VALUES (p_id, p_name, p_age, p_address, p_salary);', all: [r`INSERT INTO COWORKERS( ?\([^)]*\))? VALUES ?\( ?\w+ ?, ?\w+ ?, ?\w+ ?, ?\w+ ?, ?\w+ ?\)`], points: 3 },
      { label: 'Testaufruf', hint: 'EXEC neuer_mitarbeitende(…); oder BEGIN neuer_mitarbeitende(…); END;', all: [r`(EXEC(UTE)? |BEGIN )NEUER_MITARBEITENDE ?\(`], points: 1 },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE neuer_mitarbeitende (
  p_id NUMBER, p_name VARCHAR2, p_age NUMBER, p_address VARCHAR2, p_salary NUMBER
) IS
BEGIN
  INSERT INTO coworkers (id, name, age, address, salary) VALUES (p_id, p_name, p_age, p_address, p_salary);
END;
/
EXEC neuer_mitarbeitende(8, 'Lisa', 30, 'Köln', 4000);`,
    ],
    exam: true,
    points: 10,
    source: 'Übung 2b, Prozedur – Neue Mitarbeitende',
  },
  // ---------------------------------------------------------------- Kontrollstrukturen
  {
    id: 'vorzeichen',
    topicId: '02-kontroll',
    title: 'Funktion: positiv, negativ oder 0',
    level: 1,
    scenario: 'keins',
    task:
      'Schreibe eine Funktion vorzeichen, die eine Zahl bekommt und als Text zurückgibt, ob die Zahl positiv, negativ oder 0 ist. Teste sie mit je einem Aufruf für eine positive Zahl, eine negative Zahl und die 0.',
    hints: ['Kopf: CREATE OR REPLACE FUNCTION vorzeichen (p_zahl NUMBER) RETURN VARCHAR2 IS', 'Im Kopf steht der Rückgabetyp ohne Länge: RETURN VARCHAR2, nicht VARCHAR2(20).', 'IF … THEN … ELSIF … THEN … ELSE … END IF;', 'Test: SELECT vorzeichen(5) FROM dual;'],
    solution: `CREATE OR REPLACE FUNCTION vorzeichen (p_zahl NUMBER) RETURN VARCHAR2 IS
BEGIN
  IF p_zahl > 0 THEN
    RETURN 'positiv';
  ELSIF p_zahl < 0 THEN
    RETURN 'negativ';
  ELSE
    RETURN 'null';
  END IF;
END;
/
SELECT vorzeichen(5), vorzeichen(-3), vorzeichen(0) FROM dual;`,
    checks: [
      { label: 'Funktion mit Rückgabetyp VARCHAR2', hint: 'RETURN VARCHAR2 IS – ohne Längenangabe', all: [r`${FUNC} ?\( ?\w+ (IN )?NUMBER ?\) RETURN VARCHAR2 (IS|AS)`] },
      { label: 'Fallunterscheidung mit IF/ELSIF/ELSE', hint: 'Drei Fälle: IF … ELSIF … ELSE … END IF;', all: [r`IF \w+ ?[<>]=? ?0 THEN .*ELSIF \w+ ?[<>]=? ?0 THEN .*ELSE .*END IF`] },
      { label: 'Jeder Fall gibt einen Text zurück', hint: 'RETURN \'positiv\'; … RETURN \'negativ\'; … RETURN \'null\';', all: [r`(RETURN '…' ?;.*){3}`] },
      { label: 'Drei Testaufrufe', hint: 'z. B. SELECT vorzeichen(5), vorzeichen(-3), vorzeichen(0) FROM dual;', all: [r`VORZEICHEN ?\( ?[1-9]\d* ?\)`, r`VORZEICHEN ?\( ?- ?\d+ ?\)`, r`VORZEICHEN ?\( ?0 ?\)`] },
    ],
    wrong: [
      `CREATE OR REPLACE FUNCTION vorzeichen (p_zahl NUMBER) RETURN VARCHAR2(20) IS
BEGIN
  IF p_zahl > 0 THEN RETURN 'positiv';
  ELSIF p_zahl < 0 THEN RETURN 'negativ';
  ELSE RETURN 'null';
  END IF;
END;
/
SELECT vorzeichen(5), vorzeichen(-3), vorzeichen(0) FROM dual;`,
      `CREATE OR REPLACE FUNCTION vorzeichen (p_zahl NUMBER) RETURN VARCHAR2 IS
BEGIN
  IF p_zahl > 0 THEN RETURN 'positiv';
  ELSE IF p_zahl < 0 THEN RETURN 'negativ';
  ELSE RETURN 'null';
  END IF;
END;
/
SELECT vorzeichen(5), vorzeichen(-3), vorzeichen(0) FROM dual;`,
    ],
    source: 'Übung 2a, Funktion – Zahlen',
  },
  {
    id: 'gehalt-staffel',
    topicId: '02-kontroll',
    title: 'Gestaffelte Gehaltserhöhung',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe eine Prozedur gehalt_staffel, die in einer Cursor-FOR-Schleife alle Mitarbeitenden durchläuft: Wer mindestens 10000 verdient, bekommt 3 % mehr, alle anderen 2 %.',
    hints: ['FOR r IN (SELECT id, salary FROM coworkers) LOOP … END LOOP;', 'Im Rumpf: IF r.salary >= 10000 THEN UPDATE … ELSE UPDATE … END IF;', 'Den richtigen Datensatz triffst du mit WHERE id = r.id.'],
    solution: `CREATE OR REPLACE PROCEDURE gehalt_staffel IS
BEGIN
  FOR r IN (SELECT id, salary FROM coworkers) LOOP
    IF r.salary >= 10000 THEN
      UPDATE coworkers SET salary = salary * 1.03 WHERE id = r.id;
    ELSE
      UPDATE coworkers SET salary = salary * 1.02 WHERE id = r.id;
    END IF;
  END LOOP;
END;
/`,
    checks: [
      { label: 'Cursor-FOR-Schleife über COWORKERS', hint: 'FOR r IN (SELECT … FROM coworkers) LOOP', all: [r`FOR \w+ IN (\( ?SELECT [^)]*FROM COWORKERS[^)]*\)|\w+) LOOP`] },
      { label: 'Grenze 10000 im IF', hint: 'IF r.salary >= 10000 THEN … ELSE … END IF;', all: [r`IF \w+\.SALARY ?>= ?10000 THEN .*ELSE`] },
      { label: 'Erhöhung um 3 % und 2 %', hint: 'salary * 1.03 bzw. salary * 1.02', all: [r`SALARY ?\* ?1\.03`, r`SALARY ?\* ?1\.02`] },
      { label: 'UPDATE trifft den aktuellen Datensatz', hint: 'UPDATE coworkers SET … WHERE id = r.id;', all: [r`UPDATE COWORKERS SET SALARY ?= .*WHERE ID ?= ?\w+\.ID`] },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE gehalt_staffel IS
BEGIN
  FOR r IN (SELECT id, salary FROM coworkers) LOOP
    IF r.salary >= 10000 THEN
      UPDATE coworkers SET salary = salary * 1.03;
    ELSE
      UPDATE coworkers SET salary = salary * 1.02;
    END IF;
  END LOOP;
END;
/`,
    ],
    source: 'Folien PL/SQL, IF und Cursor-FOR-Schleife (Übertrag)',
  },
  {
    id: 'zahlen-schleife',
    topicId: '02-kontroll',
    title: 'Zahlen 1 bis 10 mit FOR-Schleife',
    level: 1,
    scenario: 'keins',
    task: 'Schreibe einen anonymen Block, der mit einer FOR-Schleife die Zahlen 1 bis 10 ausgibt und für jede gerade Zahl zusätzlich „(gerade)“ anhängt.',
    hints: ['FOR i IN 1..10 LOOP … END LOOP;', 'Gerade: MOD(i, 2) = 0'],
    solution: `BEGIN
  FOR i IN 1..10 LOOP
    IF MOD(i, 2) = 0 THEN
      DBMS_OUTPUT.PUT_LINE(i || ' (gerade)');
    ELSE
      DBMS_OUTPUT.PUT_LINE(i);
    END IF;
  END LOOP;
END;
/`,
    checks: [
      { label: 'FOR-Schleife von 1 bis 10', hint: 'FOR i IN 1..10 LOOP', all: [r`FOR \w+ IN 1 ?\.\. ?10 LOOP`] },
      { label: 'Gerade Zahlen mit MOD erkannt', hint: 'IF MOD(i, 2) = 0 THEN', all: [r`MOD ?\( ?\w+ ?, ?2 ?\) ?= ?0`] },
      { label: 'Ausgabe in der Schleife', hint: 'DBMS_OUTPUT.PUT_LINE(…)', all: [r`LOOP .*${OUT}.*END LOOP`] },
    ],
    wrong: [
      `BEGIN
  FOR i IN 1..10 LOOP
    DBMS_OUTPUT.PUT_LINE(i);
  END LOOP;
END;
/`,
    ],
    source: 'Folien PL/SQL, Schleifen',
  },
  // ---------------------------------------------------------------- Cursor
  {
    id: 'total-coworkers',
    topicId: '02-cursor',
    title: 'Funktion total_coworkers',
    level: 1,
    scenario: 'coworkers',
    task: 'Schreibe eine Funktion total_coworkers ohne Parameter, die die Anzahl der Mitarbeitenden zurückgibt, und gib das Ergebnis in einem anonymen Block aus.',
    hints: ['RETURN NUMBER IS total NUMBER := 0;', 'SELECT COUNT(*) INTO total FROM coworkers;', 'Aufruf: c := total_coworkers();'],
    solution: `CREATE OR REPLACE FUNCTION total_coworkers RETURN NUMBER IS
  total NUMBER(3) := 0;
BEGIN
  SELECT COUNT(*) INTO total FROM coworkers;
  RETURN total;
END;
/
DECLARE
  c NUMBER(3);
BEGIN
  c := total_coworkers();
  DBMS_OUTPUT.PUT_LINE('Anzahl Mitarbeitende: ' || c);
END;
/`,
    checks: [
      { label: 'Funktion ohne Parameter mit RETURN NUMBER', hint: 'CREATE OR REPLACE FUNCTION total_coworkers RETURN NUMBER IS', all: [r`CREATE (OR REPLACE )?FUNCTION TOTAL_COWORKERS RETURN NUMBER (IS|AS)`] },
      { label: 'COUNT(*) INTO Variable', hint: 'SELECT COUNT(*) INTO total FROM coworkers;', all: [r`SELECT COUNT ?\( ?\* ?\) INTO \w+ FROM COWORKERS`] },
      { label: 'Wert zurückgegeben', hint: 'RETURN total;', all: [r`RETURN \w+ ?;`] },
      { label: 'Aufruf und Ausgabe', hint: 'c := total_coworkers(); DBMS_OUTPUT.PUT_LINE(c);', all: [r`\w+ ?:= ?TOTAL_COWORKERS`, OUT] },
    ],
    wrong: [
      `CREATE OR REPLACE FUNCTION total_coworkers RETURN NUMBER IS
  total NUMBER(3) := 0;
BEGIN
  SELECT COUNT(*) FROM coworkers;
  RETURN total;
END;
/
DECLARE c NUMBER(3);
BEGIN
  c := total_coworkers();
  DBMS_OUTPUT.PUT_LINE(c);
END;
/`,
    ],
    source: 'Folien PL/SQL, Funktionen (totalCustomers)',
  },
  {
    id: 'ueber-durchschnitt',
    topicId: '02-cursor',
    title: 'Überdurchschnittliche Verdiener',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe eine Prozedur ueber_durchschnitt, die zu einer gegebenen ID den Namen und das Gehalt des Mitarbeitenden ausgibt, falls das Gehalt größer ist als das Durchschnittsgehalt aller Mitarbeitenden. Ansonsten gib „<Name> gets less than the average“ aus.',
    hints: ['Zuerst den Durchschnitt: SELECT AVG(salary) INTO v_avg FROM coworkers;', 'Dann den Datensatz: SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = p_id;', 'IF v_salary > v_avg THEN … ELSE … END IF;'],
    solution: `CREATE OR REPLACE PROCEDURE ueber_durchschnitt (p_id coworkers.id%TYPE) IS
  v_avg    coworkers.salary%TYPE;
  v_name   coworkers.name%TYPE;
  v_salary coworkers.salary%TYPE;
BEGIN
  SELECT AVG(salary) INTO v_avg FROM coworkers;
  SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = p_id;
  IF v_salary > v_avg THEN
    DBMS_OUTPUT.PUT_LINE(v_name || ' verdient ' || v_salary);
  ELSE
    DBMS_OUTPUT.PUT_LINE(v_name || ' gets less than the average');
  END IF;
END;
/`,
    checks: [
      { label: 'Prozedur mit ID-Parameter', hint: 'CREATE OR REPLACE PROCEDURE ueber_durchschnitt (p_id coworkers.id%TYPE) IS', all: [r`${PROC} ?\( ?\w+ (IN )?(NUMBER|COWORKERS\.ID%TYPE) ?\) (IS|AS)`], points: 2 },
      { label: 'Durchschnitt mit AVG berechnet', hint: 'SELECT AVG(salary) INTO v_avg FROM coworkers;', all: [r`SELECT AVG ?\( ?SALARY ?\) INTO \w+ FROM COWORKERS`], points: 3 },
      { label: 'Name und Gehalt zur ID gelesen', hint: 'SELECT name, salary INTO … FROM coworkers WHERE id = p_id;', all: [r`SELECT NAME ?, ?SALARY INTO \w+ ?, ?\w+ FROM COWORKERS WHERE ID ?= ?\w+`], points: 3 },
      { label: 'Vergleich mit dem Durchschnitt', hint: 'IF v_salary > v_avg THEN … ELSE … END IF;', all: [r`IF \w+ ?> ?\w+ THEN .*ELSE .*END IF`], points: 2 },
      { label: 'Ausgabe in beiden Fällen', hint: 'Im THEN- und im ELSE-Zweig je ein DBMS_OUTPUT.PUT_LINE', all: [r`THEN [^;]*${OUT}.*ELSE [^;]*${OUT}`], points: 2 },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE ueber_durchschnitt (p_id coworkers.id%TYPE) IS
  v_name   coworkers.name%TYPE;
  v_salary coworkers.salary%TYPE;
BEGIN
  SELECT name, salary INTO v_name, v_salary FROM coworkers WHERE id = p_id;
  IF v_salary > 5000 THEN
    DBMS_OUTPUT.PUT_LINE(v_name || ' verdient ' || v_salary);
  ELSE
    DBMS_OUTPUT.PUT_LINE(v_name || ' gets less than the average');
  END IF;
END;
/`,
    ],
    exam: true,
    points: 12,
    source: 'Übung 2a, Prozedur – Überdurchschnittliche Verdiener',
  },
  {
    id: 'verdiener',
    topicId: '02-cursor',
    title: 'Verdiener mit expliziten Cursor',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe eine Prozedur verdiener mit einem Parameter p_summe. Sie gibt für alle Mitarbeitenden aus, ob sie mindestens diese Summe verdienen, oder welcher Betrag ihnen noch fehlt. Verwende einen expliziten Cursor mit OPEN, FETCH und CLOSE.',
    hints: ['CURSOR c_cow IS SELECT name, salary FROM coworkers;', 'LOOP FETCH c_cow INTO v_name, v_salary; EXIT WHEN c_cow%NOTFOUND; … END LOOP;', 'Fehlbetrag: p_summe - v_salary'],
    solution: `CREATE OR REPLACE PROCEDURE verdiener (p_summe NUMBER) IS
  CURSOR c_cow IS SELECT name, salary FROM coworkers;
  v_name   coworkers.name%TYPE;
  v_salary coworkers.salary%TYPE;
BEGIN
  OPEN c_cow;
  LOOP
    FETCH c_cow INTO v_name, v_salary;
    EXIT WHEN c_cow%NOTFOUND;
    IF v_salary >= p_summe THEN
      DBMS_OUTPUT.PUT_LINE(v_name || ' verdient mindestens ' || p_summe);
    ELSE
      DBMS_OUTPUT.PUT_LINE(v_name || ' fehlen noch ' || (p_summe - v_salary));
    END IF;
  END LOOP;
  CLOSE c_cow;
END;
/`,
    checks: [
      { label: 'Cursor deklariert', hint: 'CURSOR c_cow IS SELECT name, salary FROM coworkers;', all: [r`CURSOR \w+ IS SELECT [^;]*FROM COWORKERS`] },
      { label: 'OPEN, FETCH … INTO und CLOSE', hint: 'OPEN c; LOOP FETCH c INTO …; … END LOOP; CLOSE c;', all: [r`OPEN \w+ ?;`, r`FETCH \w+ INTO`, r`CLOSE \w+ ?;`] },
      { label: 'Abbruch mit %NOTFOUND', hint: 'EXIT WHEN c_cow%NOTFOUND;', all: [r`EXIT WHEN \w+%NOTFOUND`] },
      { label: 'Vergleich mit der Summe und Fehlbetrag', hint: 'IF v_salary >= p_summe … ELSE … p_summe - v_salary', all: [r`IF \w+ ?>= ?\w+ THEN`, r`\w+ ?- ?\w+`] },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE verdiener (p_summe NUMBER) IS
  CURSOR c_cow IS SELECT name, salary FROM coworkers;
  v_name coworkers.name%TYPE; v_salary coworkers.salary%TYPE;
BEGIN
  OPEN c_cow;
  LOOP
    FETCH c_cow INTO v_name, v_salary;
    IF v_salary >= p_summe THEN DBMS_OUTPUT.PUT_LINE(v_name);
    ELSE DBMS_OUTPUT.PUT_LINE(v_name || ' ' || (p_summe - v_salary));
    END IF;
  END LOOP;
  CLOSE c_cow;
END;
/`,
    ],
    source: 'Übung 2a, Prozedur – Verdiener',
  },
  {
    id: 'buchungen-pro-stadt',
    topicId: '02-cursor',
    title: 'Altklausur: Buchungen pro Stadt',
    level: 3,
    scenario: 'hotel',
    task:
      'Erstelle eine Prozedur mit dem Parameter Jahreszahl. Sie berechnet für das übergebene Jahr die Anzahl aller Buchungen pro Stadt und speichert das Ergebnis (Stadtname, Anzahl_Buchungen) in der Tabelle TEMP_DATA. Die Tabelle wird zu Beginn komplett geleert, damit die Prozedur mehrfach für verschiedene Jahre aufgerufen werden kann. Maßgeblich ist das Anreisedatum.',
    hints: ['Jahreszahl aus einem Datum: EXTRACT(YEAR FROM anreise)', 'Zuerst DELETE FROM temp_data;', 'INSERT INTO temp_data SELECT s.stadtname, COUNT(*) FROM buchung b JOIN hotel h … JOIN stadt s … WHERE … GROUP BY s.stadtname;'],
    solution: `CREATE OR REPLACE PROCEDURE buchungen_pro_stadt (p_jahr NUMBER) IS
BEGIN
  DELETE FROM temp_data;
  INSERT INTO temp_data (stadtname, anzahl_buchungen)
    SELECT s.stadtname, COUNT(*)
    FROM buchung b
    JOIN hotel h ON b.hotel_id = h.hotel_id
    JOIN stadt s ON h.stadt_id = s.stadt_id
    WHERE EXTRACT(YEAR FROM b.anreise) = p_jahr
    GROUP BY s.stadtname;
END;
/
EXEC buchungen_pro_stadt(2021);`,
    checks: [
      { label: 'Prozedur mit Jahresparameter', hint: 'CREATE OR REPLACE PROCEDURE … (p_jahr NUMBER) IS', all: [r`${PROC} ?\( ?\w+ (IN )?(NUMBER|INTEGER|PLS_INTEGER) ?\) (IS|AS)`], points: 2 },
      { label: 'TEMP_DATA zu Beginn geleert', hint: 'Vor dem INSERT: DELETE FROM temp_data; (oder EXECUTE IMMEDIATE \'TRUNCATE TABLE temp_data\')', any: [r`BEGIN DELETE FROM TEMP_DATA ?;`, r`BEGIN EXECUTE IMMEDIATE '…'`], points: 2 },
      { label: 'Buchung, Hotel und Stadt verbunden', hint: 'JOIN hotel ON …hotel_id = …hotel_id JOIN stadt ON …stadt_id = …stadt_id', all: [r`BUCHUNG`, r`HOTEL_ID ?= ?\w+\.HOTEL_ID`, r`STADT_ID ?= ?\w+\.STADT_ID`], points: 3 },
      { label: 'Filter auf das übergebene Jahr', hint: 'WHERE EXTRACT(YEAR FROM b.anreise) = p_jahr', all: [r`EXTRACT ?\( ?YEAR FROM (\w+\.)?ANREISE ?\) ?= ?[A-Z_]\w*`], none: [r`EXTRACT ?\( ?YEAR FROM (\w+\.)?ANREISE ?\) ?= ?\d`], points: 3 },
      { label: 'Anzahl je Stadt mit GROUP BY', hint: 'SELECT s.stadtname, COUNT(*) … GROUP BY s.stadtname', all: [r`COUNT ?\(`, r`GROUP BY (\w+\.)?STADTNAME`], points: 2 },
      { label: 'Ergebnis in TEMP_DATA eingefügt', hint: 'INSERT INTO temp_data (stadtname, anzahl_buchungen) SELECT …', all: [r`INSERT INTO TEMP_DATA( ?\([^)]*\))? SELECT`], points: 2 },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE buchungen_pro_stadt (p_jahr NUMBER) IS
BEGIN
  INSERT INTO temp_data (stadtname, anzahl_buchungen)
    SELECT s.stadtname, COUNT(*) FROM buchung b
    JOIN hotel h ON b.hotel_id = h.hotel_id JOIN stadt s ON h.stadt_id = s.stadt_id
    WHERE EXTRACT(YEAR FROM b.anreise) = p_jahr GROUP BY s.stadtname;
END;
/`,
      `CREATE OR REPLACE PROCEDURE buchungen_pro_stadt (p_jahr NUMBER) IS
BEGIN
  DELETE FROM temp_data;
  INSERT INTO temp_data (stadtname, anzahl_buchungen)
    SELECT s.stadtname, COUNT(*) FROM buchung b
    JOIN hotel h ON b.hotel_id = h.hotel_id JOIN stadt s ON h.stadt_id = s.stadt_id
    WHERE EXTRACT(YEAR FROM b.anreise) = 2021 GROUP BY s.stadtname;
END;
/`,
    ],
    exam: true,
    points: 14,
    source: 'Altklausur, Aufgabe 3 (Prozedur für Buchungen pro Stadt)',
  },
  // ---------------------------------------------------------------- DML und Exceptions
  {
    id: 'aelteste-belohnen',
    topicId: '02-dml-exc',
    title: 'Die Ältesten belohnen',
    level: 3,
    scenario: 'coworkers',
    task:
      'Schreibe eine Prozedur aelteste_belohnen, die das Gehalt des ältesten Mitarbeitenden um 3 % erhöht. Fange mögliche Exceptions ab, etwa wenn es mehrere Älteste gibt. Die verwendeten Variablen sollen die Datentypen der Tabelle übernehmen.',
    hints: ['SELECT id INTO v_id FROM coworkers WHERE age = (SELECT MAX(age) FROM coworkers);', 'Gibt es mehrere Älteste, wirft SELECT INTO die Exception TOO_MANY_ROWS.', 'EXCEPTION WHEN TOO_MANY_ROWS THEN … WHEN NO_DATA_FOUND THEN … END;'],
    solution: `CREATE OR REPLACE PROCEDURE aelteste_belohnen IS
  v_id coworkers.id%TYPE;
BEGIN
  SELECT id INTO v_id FROM coworkers WHERE age = (SELECT MAX(age) FROM coworkers);
  UPDATE coworkers SET salary = salary * 1.03 WHERE id = v_id;
EXCEPTION
  WHEN TOO_MANY_ROWS THEN
    DBMS_OUTPUT.PUT_LINE('Es gibt mehrere Älteste.');
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Keine Mitarbeitenden vorhanden.');
END;
/`,
    checks: [
      { label: 'Variable mit %TYPE', hint: 'v_id coworkers.id%TYPE;', all: [r`\w+ COWORKERS\.\w+%TYPE`], points: 2 },
      { label: 'Ältester über MAX(age) gesucht', hint: 'WHERE age = (SELECT MAX(age) FROM coworkers)', all: [r`MAX ?\( ?AGE ?\)`, r`INTO \w+`], points: 3 },
      { label: 'Gehalt um 3 % erhöht', hint: 'UPDATE coworkers SET salary = salary * 1.03 WHERE …', all: [r`UPDATE COWORKERS SET SALARY ?= ?SALARY ?\* ?1\.03 WHERE`], points: 3 },
      { label: 'TOO_MANY_ROWS abgefangen', hint: 'EXCEPTION WHEN TOO_MANY_ROWS THEN …', all: [r`EXCEPTION .*WHEN TOO_MANY_ROWS THEN`], points: 3 },
      { label: 'Weitere Exception abgefangen', hint: 'Zum Beispiel WHEN NO_DATA_FOUND oder WHEN OTHERS', all: [r`EXCEPTION .*WHEN (NO_DATA_FOUND|OTHERS) THEN`], points: 1 },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE aelteste_belohnen IS
  v_id coworkers.id%TYPE;
BEGIN
  SELECT id INTO v_id FROM coworkers WHERE age = (SELECT MAX(age) FROM coworkers);
  UPDATE coworkers SET salary = salary * 1.03 WHERE id = v_id;
END;
/`,
      `CREATE OR REPLACE PROCEDURE aelteste_belohnen IS
BEGIN
  UPDATE coworkers SET salary = salary * 1.3 WHERE age = (SELECT MAX(age) FROM coworkers);
EXCEPTION
  WHEN TOO_MANY_ROWS THEN NULL;
END;
/`,
    ],
    exam: true,
    points: 12,
    source: 'Übung 2b, Prozedur – Die Ältesten belohnen',
  },
  {
    id: 'set-salary',
    topicId: '02-dml-exc',
    title: 'Gehalt setzen mit eigener Fehlermeldung',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe eine Prozedur set_salary(p_id, p_salary), die das Gehalt eines Mitarbeitenden setzt. Gibt es die ID nicht (SQL%ROWCOUNT = 0), soll die Prozedur mit RAISE_APPLICATION_ERROR und der Nummer -20001 abbrechen.',
    hints: ['Nach einem UPDATE steht in SQL%ROWCOUNT, wie viele Zeilen betroffen waren.', 'RAISE_APPLICATION_ERROR(-20001, \'Text\');', 'Eigene Fehlernummern liegen zwischen -20000 und -20999.'],
    solution: `CREATE OR REPLACE PROCEDURE set_salary (
  p_id     coworkers.id%TYPE,
  p_salary coworkers.salary%TYPE
) IS
BEGIN
  UPDATE coworkers SET salary = p_salary WHERE id = p_id;
  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Mitarbeitende ' || p_id || ' gibt es nicht.');
  END IF;
END;
/`,
    checks: [
      { label: 'Prozedur mit zwei Parametern', hint: 'CREATE OR REPLACE PROCEDURE set_salary (p_id …, p_salary …) IS', all: [r`CREATE (OR REPLACE )?PROCEDURE SET_SALARY ?\( ?\w+ [^,]+, ?\w+ [^)]+\) (IS|AS)`] },
      { label: 'UPDATE für die übergebene ID', hint: 'UPDATE coworkers SET salary = p_salary WHERE id = p_id;', all: [r`UPDATE COWORKERS SET SALARY ?= ?\w+ WHERE ID ?= ?\w+`] },
      { label: 'Prüfung mit SQL%ROWCOUNT', hint: 'IF SQL%ROWCOUNT = 0 THEN', all: [r`IF SQL%ROWCOUNT ?= ?0 THEN`] },
      { label: 'Abbruch mit -20001', hint: 'RAISE_APPLICATION_ERROR(-20001, …);', all: [r`RAISE_APPLICATION_ERROR ?\( ?- ?20001 ?,`] },
    ],
    wrong: [
      `CREATE OR REPLACE PROCEDURE set_salary (p_id NUMBER, p_salary NUMBER) IS
BEGIN
  UPDATE coworkers SET salary = p_salary WHERE id = p_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20001, 'nicht gefunden');
END;
/`,
    ],
    source: 'Folien PL/SQL, DML in PL/SQL und Exceptions',
  },
  {
    id: 'kunde-suchen',
    topicId: '02-dml-exc',
    title: 'NO_DATA_FOUND abfangen',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe einen anonymen Block, der den Namen des Mitarbeitenden mit der ID 99 liest und ausgibt. Gibt es diese ID nicht, soll statt eines Fehlers „Kein Mitarbeitender mit ID 99“ ausgegeben werden. Alle anderen Fehler gibst du mit SQLERRM aus.',
    hints: ['SELECT name INTO v_name … wirft NO_DATA_FOUND, wenn keine Zeile kommt.', 'EXCEPTION WHEN NO_DATA_FOUND THEN … WHEN OTHERS THEN DBMS_OUTPUT.PUT_LINE(SQLERRM);'],
    solution: `DECLARE
  v_name coworkers.name%TYPE;
BEGIN
  SELECT name INTO v_name FROM coworkers WHERE id = 99;
  DBMS_OUTPUT.PUT_LINE(v_name);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Kein Mitarbeitender mit ID 99');
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE(SQLERRM);
END;
/`,
    checks: [
      { label: 'SELECT INTO für ID 99', hint: 'SELECT name INTO v_name FROM coworkers WHERE id = 99;', all: [r`SELECT NAME INTO \w+ FROM COWORKERS WHERE ID ?= ?99`] },
      { label: 'NO_DATA_FOUND abgefangen', hint: 'EXCEPTION WHEN NO_DATA_FOUND THEN …', all: [r`EXCEPTION WHEN NO_DATA_FOUND THEN ${OUT}`] },
      { label: 'WHEN OTHERS mit SQLERRM', hint: 'WHEN OTHERS THEN DBMS_OUTPUT.PUT_LINE(SQLERRM);', all: [r`WHEN OTHERS THEN ${OUT} ?SQLERRM`] },
    ],
    wrong: [
      `DECLARE
  v_name coworkers.name%TYPE;
BEGIN
  SELECT name INTO v_name FROM coworkers WHERE id = 99;
  IF v_name IS NULL THEN DBMS_OUTPUT.PUT_LINE('Kein Mitarbeitender mit ID 99'); END IF;
END;
/`,
    ],
    source: 'Folien PL/SQL, vordefinierte Exceptions',
  },
  // ---------------------------------------------------------------- Packages
  {
    id: 'package-personal',
    topicId: '02-packages',
    title: 'Package mit Spezifikation und Body',
    level: 3,
    scenario: 'coworkers',
    task:
      'Lege ein Package personal an. Die Spezifikation deklariert die Funktion anzahl RETURN NUMBER und die Prozedur erhoehen(p_prozent NUMBER). Im Body zählt anzahl die Mitarbeitenden, erhoehen hebt alle Gehälter um p_prozent Prozent an. Rufe danach personal.erhoehen(5) auf.',
    hints: ['Zwei Befehle: CREATE OR REPLACE PACKAGE personal IS … END personal; und CREATE OR REPLACE PACKAGE BODY personal IS … END personal;', 'Prozent: salary * (1 + p_prozent / 100)', 'Aufruf mit Paketname: EXEC personal.erhoehen(5);'],
    solution: `CREATE OR REPLACE PACKAGE personal IS
  FUNCTION anzahl RETURN NUMBER;
  PROCEDURE erhoehen (p_prozent NUMBER);
END personal;
/
CREATE OR REPLACE PACKAGE BODY personal IS
  FUNCTION anzahl RETURN NUMBER IS
    v NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v FROM coworkers;
    RETURN v;
  END;
  PROCEDURE erhoehen (p_prozent NUMBER) IS
  BEGIN
    UPDATE coworkers SET salary = salary * (1 + p_prozent / 100);
  END;
END personal;
/
EXEC personal.erhoehen(5);`,
    checks: [
      { label: 'Spezifikation mit beiden Deklarationen', hint: 'CREATE OR REPLACE PACKAGE personal IS FUNCTION anzahl RETURN NUMBER; PROCEDURE erhoehen (p_prozent NUMBER); END personal;', all: [r`CREATE (OR REPLACE )?PACKAGE PERSONAL (IS|AS) .*FUNCTION ANZAHL RETURN NUMBER ?;.*PROCEDURE ERHOEHEN ?\([^)]*\) ?;.*END( PERSONAL)? ?;`] },
      { label: 'Package Body angelegt', hint: 'CREATE OR REPLACE PACKAGE BODY personal IS … END personal;', all: [r`CREATE (OR REPLACE )?PACKAGE BODY PERSONAL (IS|AS)`] },
      { label: 'anzahl zählt die Mitarbeitenden', hint: 'SELECT COUNT(*) INTO v FROM coworkers; RETURN v;', all: [r`PACKAGE BODY .*FUNCTION ANZAHL RETURN NUMBER (IS|AS) .*COUNT ?\( ?\* ?\) INTO \w+ FROM COWORKERS`] },
      { label: 'erhoehen rechnet mit dem Prozentsatz', hint: 'UPDATE coworkers SET salary = salary * (1 + p_prozent / 100);', all: [r`PACKAGE BODY .*UPDATE COWORKERS SET SALARY ?= ?SALARY ?\* ?\( ?1 ?\+ ?\w+ ?/ ?100 ?\)`] },
      { label: 'Aufruf mit Paketname', hint: 'EXEC personal.erhoehen(5);', all: [r`PERSONAL\.ERHOEHEN ?\( ?5 ?\)`] },
    ],
    wrong: [
      `CREATE OR REPLACE PACKAGE BODY personal IS
  FUNCTION anzahl RETURN NUMBER IS v NUMBER;
  BEGIN SELECT COUNT(*) INTO v FROM coworkers; RETURN v; END;
  PROCEDURE erhoehen (p_prozent NUMBER) IS
  BEGIN UPDATE coworkers SET salary = salary * (1 + p_prozent / 100); END;
END personal;
/
EXEC personal.erhoehen(5);`,
      `CREATE OR REPLACE PACKAGE personal IS
  FUNCTION anzahl RETURN NUMBER;
  PROCEDURE erhoehen (p_prozent NUMBER);
END personal;
/
CREATE OR REPLACE PACKAGE BODY personal IS
  FUNCTION anzahl RETURN NUMBER IS v NUMBER;
  BEGIN SELECT COUNT(*) INTO v FROM coworkers; RETURN v; END;
  PROCEDURE erhoehen (p_prozent NUMBER) IS
  BEGIN UPDATE coworkers SET salary = salary * (1 + p_prozent / 100); END;
/
EXEC erhoehen(5);`,
    ],
    source: 'Folien PL/SQL, Packages',
  },
  {
    id: 'alter-aus-jahr',
    topicId: '02-packages',
    title: 'Funktion mit SYSDATE und Paketfunktion',
    level: 2,
    scenario: 'coworkers',
    task:
      'Schreibe eine Funktion dienstjahre(p_id), die zurückgibt, seit wie vielen vollen Jahren ein Mitarbeitender beschäftigt ist (Grundlage: hiring_date und SYSDATE). Nutze MONTHS_BETWEEN und TRUNC. Gib danach für alle Mitarbeitenden Name und Dienstjahre per SELECT aus.',
    hints: ['Volle Jahre: TRUNC(MONTHS_BETWEEN(SYSDATE, hiring_date) / 12)', 'Funktionen kannst du direkt in SELECT aufrufen: SELECT name, dienstjahre(id) FROM coworkers;'],
    solution: `CREATE OR REPLACE FUNCTION dienstjahre (p_id coworkers.id%TYPE) RETURN NUMBER IS
  v_datum coworkers.hiring_date%TYPE;
BEGIN
  SELECT hiring_date INTO v_datum FROM coworkers WHERE id = p_id;
  RETURN TRUNC(MONTHS_BETWEEN(SYSDATE, v_datum) / 12);
END;
/
SELECT name, dienstjahre(id) FROM coworkers;`,
    checks: [
      { label: 'Funktion mit Parameter und RETURN NUMBER', hint: 'CREATE OR REPLACE FUNCTION dienstjahre (p_id coworkers.id%TYPE) RETURN NUMBER IS', all: [r`CREATE (OR REPLACE )?FUNCTION DIENSTJAHRE ?\( ?\w+ [^)]+\) RETURN NUMBER (IS|AS)`] },
      { label: 'Einstellungsdatum gelesen', hint: 'SELECT hiring_date INTO … WHERE id = p_id;', all: [r`SELECT HIRING_DATE INTO \w+ FROM COWORKERS WHERE ID ?= ?\w+`] },
      { label: 'Volle Jahre mit MONTHS_BETWEEN und TRUNC', hint: 'TRUNC(MONTHS_BETWEEN(SYSDATE, v_datum) / 12)', all: [r`TRUNC ?\( ?MONTHS_BETWEEN ?\( ?SYSDATE ?, ?\w+ ?\) ?/ ?12 ?\)`] },
      { label: 'Aufruf in einer Abfrage', hint: 'SELECT name, dienstjahre(id) FROM coworkers;', all: [r`SELECT NAME ?, ?DIENSTJAHRE ?\( ?ID ?\) FROM COWORKERS`] },
    ],
    wrong: [
      `CREATE OR REPLACE FUNCTION dienstjahre (p_id coworkers.id%TYPE) RETURN NUMBER IS
  v_datum coworkers.hiring_date%TYPE;
BEGIN
  SELECT hiring_date INTO v_datum FROM coworkers WHERE id = p_id;
  RETURN MONTHS_BETWEEN(SYSDATE, v_datum);
END;
/
SELECT name, dienstjahre(id) FROM coworkers;`,
    ],
    source: 'Folien PL/SQL, eingebaute Funktionen und Packages (SYSDATE, MONTHS_BETWEEN)',
  },
];
