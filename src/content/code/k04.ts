// Kapitel 4 – Views, Materialized Views, INSTEAD OF: Übung Views (Honig), Folienbeispiele,
// Altklausur Aufgabe 2
import type { CodeTask } from '../codeTypes';

const r = String.raw;
const MV = (name: string) => r`CREATE MATERIALIZED VIEW ${name}\b`;

export const k04: CodeTask[] = [
  // ---------------------------------------------------------------- Materialized Views
  {
    id: 'altklausur-mv-kunde-stadt',
    topicId: '04-mv',
    title: 'Altklausur: Materialized View mv_kunde_stadt',
    level: 3,
    scenario: 'hotel',
    task:
      '1. Erstelle die Materialized View mv_kunde_stadt mit allen Kunden (KUNDEN_ID, VORNAME, NACHNAME), deren gebuchten Hotels (BUCHUNGS_ID, HOTEL_ID, HOTELNAME) und der Stadt der gebuchten Hotels (STADT_ID, STADTNAME, EINWOHNER). Sie soll sofort befüllt werden und sich nur auf expliziten Befehl komplett aktualisieren. (7 P.)\n2. Frage die Materialized View ab: Städte ohne Duplikate, die Anna Schneider bereits besucht hat. Ausgabe: Vorname, Nachname, Stadtname. (2 P.)\n3. Ändere die Materialized View mit ALTER zu einer In-Memory-Materialized View, hochoptimiert für Abfragen und direkt beladen. (3 P.)',
    hints: [
      'BUILD IMMEDIATE = sofort befüllen, REFRESH COMPLETE ON DEMAND = nur auf Befehl komplett neu.',
      'Vier Tabellen: kunde – buchung – hotel – stadt.',
      'Ohne Duplikate: SELECT DISTINCT',
      'ALTER MATERIALIZED VIEW … INMEMORY MEMCOMPRESS FOR QUERY … PRIORITY CRITICAL;',
    ],
    solution: `CREATE MATERIALIZED VIEW mv_kunde_stadt
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT k.kunden_id, k.vorname, k.nachname,
       b.buchungs_id, h.hotel_id, h.hotelname,
       s.stadt_id, s.stadtname, s.einwohner
FROM kunde k
JOIN buchung b ON b.kunden_id = k.kunden_id
JOIN hotel h ON h.hotel_id = b.hotel_id
JOIN stadt s ON s.stadt_id = h.stadt_id;

SELECT DISTINCT vorname, nachname, stadtname
FROM mv_kunde_stadt
WHERE vorname = 'Anna' AND nachname = 'Schneider';

ALTER MATERIALIZED VIEW mv_kunde_stadt INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;`,
    checks: [
      { label: 'Materialized View mv_kunde_stadt angelegt', hint: 'CREATE MATERIALIZED VIEW mv_kunde_stadt … AS SELECT …', all: [r`${MV('MV_KUNDE_STADT')}.* AS SELECT`], points: 1 },
      { label: 'Sofort befüllt', hint: 'BUILD IMMEDIATE', all: [r`MV_KUNDE_STADT .*BUILD IMMEDIATE.* AS SELECT`], points: 2 },
      { label: 'Nur auf Befehl komplett aktualisiert', hint: 'REFRESH COMPLETE ON DEMAND', all: [r`MV_KUNDE_STADT .*REFRESH COMPLETE ON DEMAND.* AS SELECT`], points: 2 },
      {
        label: 'Alle neun Spalten aus vier Tabellen',
        hint: 'kunden_id, vorname, nachname, buchungs_id, hotel_id, hotelname, stadt_id, stadtname, einwohner aus kunde, buchung, hotel und stadt',
        all: [
          ...['KUNDEN_ID', 'VORNAME', 'NACHNAME', 'BUCHUNGS_ID', 'HOTEL_ID', 'HOTELNAME', 'STADT_ID', 'STADTNAME', 'EINWOHNER'].map((c) => r`AS SELECT [^;]*\b${c}\b[^;]* FROM`),
          ...['KUNDE', 'BUCHUNG', 'HOTEL', 'STADT'].map((t) => r`AS SELECT [^;]* FROM [^;]*\b${t}\b`),
        ],
        points: 2,
      },
      {
        label: 'Abfrage ohne Duplikate für Anna Schneider',
        hint: "SELECT DISTINCT vorname, nachname, stadtname FROM mv_kunde_stadt WHERE vorname = 'Anna' AND nachname = 'Schneider';",
        all: [r`SELECT DISTINCT [^;]*STADTNAME[^;]* FROM MV_KUNDE_STADT WHERE`, r`FROM MV_KUNDE_STADT WHERE [^;]*VORNAME ?= ?'…'`, r`FROM MV_KUNDE_STADT WHERE [^;]*NACHNAME ?= ?'…'`],
        points: 2,
      },
      {
        label: 'In-Memory für Abfragen, direkt beladen',
        hint: 'ALTER MATERIALIZED VIEW mv_kunde_stadt INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;',
        all: [r`ALTER MATERIALIZED VIEW MV_KUNDE_STADT INMEMORY MEMCOMPRESS FOR QUERY( LOW| HIGH)? PRIORITY CRITICAL`],
        points: 3,
      },
    ],
    wrong: [
      `CREATE MATERIALIZED VIEW mv_kunde_stadt
BUILD DEFERRED
REFRESH FAST ON COMMIT
AS
SELECT k.kunden_id, k.vorname, k.nachname, b.buchungs_id, h.hotel_id, h.hotelname, s.stadt_id, s.stadtname, s.einwohner
FROM kunde k JOIN buchung b ON b.kunden_id = k.kunden_id JOIN hotel h ON h.hotel_id = b.hotel_id JOIN stadt s ON s.stadt_id = h.stadt_id;
SELECT DISTINCT vorname, nachname, stadtname FROM mv_kunde_stadt WHERE vorname = 'Anna' AND nachname = 'Schneider';
ALTER MATERIALIZED VIEW mv_kunde_stadt INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;`,
      `CREATE MATERIALIZED VIEW mv_kunde_stadt
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT k.kunden_id, k.vorname, k.nachname, b.buchungs_id, h.hotel_id, h.hotelname, s.stadt_id, s.stadtname, s.einwohner
FROM kunde k JOIN buchung b ON b.kunden_id = k.kunden_id JOIN hotel h ON h.hotel_id = b.hotel_id JOIN stadt s ON s.stadt_id = h.stadt_id;
SELECT vorname, nachname, stadtname FROM mv_kunde_stadt WHERE vorname = 'Anna' AND nachname = 'Schneider';
ALTER MATERIALIZED VIEW mv_kunde_stadt INMEMORY MEMCOMPRESS FOR CAPACITY HIGH;`,
    ],
    exam: true,
    points: 12,
    source: 'Altklausur, Aufgabe 2 (Materialized View)',
  },
  {
    id: 'honig-mv-30',
    topicId: '04-mv',
    title: 'Honig-MV mit Refresh alle 30 Minuten',
    level: 3,
    scenario: 'honig',
    task:
      'Erstelle die Materialized View mv_honig mit der Bienenart des Volkes, Menge und Erntedatum der Ernte, Bezeichnung und Geschmack des Honigtyps sowie Bezeichnung, Art und Preis der Abpackung. Sie soll direkt befüllt und alle 30 Minuten aktualisiert werden (dynamisch mit SYSDATE). Ermittle danach mit der MV den Durchschnittspreis je Bienenart.',
    hints: [
      'BUILD IMMEDIATE, REFRESH COMPLETE START WITH SYSDATE NEXT SYSDATE + 30/1440 (ein Tag hat 1440 Minuten).',
      'Zwei Spalten heißen bezeichnung: In einer View brauchen sie verschiedene Aliasnamen.',
      'Volk und Ernte sind über GESAMMELT verbunden.',
    ],
    solution: `CREATE MATERIALIZED VIEW mv_honig
BUILD IMMEDIATE
REFRESH COMPLETE
START WITH SYSDATE NEXT SYSDATE + 30/1440
AS
SELECT b.bienenart, h.menge, h.erntedatum, t.bezeichnung AS honigtyp, t.geschmack,
       a.bezeichnung AS abpackung, a.art, a.preis
FROM bienenvolk b
JOIN gesammelt g ON g.volk_id = b.volk_id
JOIN honigernte h ON h.ernte_id = g.ernte_id
JOIN honigtyp t ON t.honigtyp_id = h.honigtyp_id
JOIN abpackung a ON a.abpackung_id = h.abpackung_id;

SELECT bienenart, AVG(preis) FROM mv_honig GROUP BY bienenart;`,
    checks: [
      { label: 'Materialized View mv_honig, sofort befüllt', hint: 'CREATE MATERIALIZED VIEW mv_honig BUILD IMMEDIATE …', all: [r`${MV('MV_HONIG')} BUILD IMMEDIATE`], points: 2 },
      {
        label: 'Refresh alle 30 Minuten mit SYSDATE',
        hint: 'START WITH SYSDATE NEXT SYSDATE + 30/1440',
        any: [r`START WITH SYSDATE NEXT SYSDATE ?\+ ?(30 ?/ ?1440|1 ?/ ?48|30 ?/ ?\( ?24 ?\* ?60 ?\)|0?\.5 ?/ ?24)`],
        points: 3,
      },
      { label: 'Fünf Tabellen verbunden, auch über GESAMMELT', hint: 'bienenvolk – gesammelt – honigernte – honigtyp, abpackung', all: ['BIENENVOLK', 'GESAMMELT', 'HONIGERNTE', 'HONIGTYP', 'ABPACKUNG'].map((t) => r`AS SELECT [^;]* FROM [^;]*\b${t}\b`), points: 2 },
      { label: 'Beide Bezeichnungen mit eigenem Alias', hint: 't.bezeichnung AS honigtyp, a.bezeichnung AS abpackung', all: [r`\w+\.BEZEICHNUNG (AS )?\w+ ?,.*\w+\.BEZEICHNUNG (AS )?\w+ ?,`], points: 1 },
      { label: 'Durchschnittspreis je Bienenart aus der MV', hint: 'SELECT bienenart, AVG(preis) FROM mv_honig GROUP BY bienenart;', all: [r`SELECT [^;]*AVG ?\( ?PREIS ?\)[^;]* FROM MV_HONIG GROUP BY BIENENART`], points: 2 },
    ],
    wrong: [
      `CREATE MATERIALIZED VIEW mv_honig
BUILD IMMEDIATE
REFRESH COMPLETE
START WITH SYSDATE NEXT SYSDATE + 30
AS
SELECT b.bienenart, h.menge, h.erntedatum, t.bezeichnung AS honigtyp, t.geschmack, a.bezeichnung AS abpackung, a.art, a.preis
FROM bienenvolk b JOIN gesammelt g ON g.volk_id = b.volk_id JOIN honigernte h ON h.ernte_id = g.ernte_id
JOIN honigtyp t ON t.honigtyp_id = h.honigtyp_id JOIN abpackung a ON a.abpackung_id = h.abpackung_id;
SELECT bienenart, AVG(preis) FROM mv_honig GROUP BY bienenart;`,
      `CREATE MATERIALIZED VIEW mv_honig
BUILD IMMEDIATE
REFRESH COMPLETE
START WITH SYSDATE NEXT SYSDATE + 30/1440
AS
SELECT b.bienenart, h.menge, h.erntedatum, t.bezeichnung, t.geschmack, a.bezeichnung, a.art, a.preis
FROM bienenvolk b JOIN gesammelt g ON g.volk_id = b.volk_id JOIN honigernte h ON h.ernte_id = g.ernte_id
JOIN honigtyp t ON t.honigtyp_id = h.honigtyp_id JOIN abpackung a ON a.abpackung_id = h.abpackung_id;
SELECT bienenart, AVG(preis) FROM mv_honig GROUP BY bienenart;`,
    ],
    exam: true,
    points: 10,
    source: 'Übung Views, Aufgabe 2 (Materialized View: Performance-Unterschied)',
  },
  {
    id: 'mv-refresh-on-demand',
    topicId: '04-mv',
    title: 'MV manuell aktualisieren',
    level: 2,
    scenario: 'coworkers',
    task:
      'Lege die Materialized View mv_all_data an (Projektname als project_name, duration, topic, Leader-ID als leader, Name der Leitung als l_name, age, salary, hiring_date). Sie wird sofort befüllt und nur auf Befehl komplett aktualisiert. Ändere danach das Gehalt von Coworker 1 und aktualisiere die MV in einem anonymen Block mit DBMS_MVIEW.',
    hints: ['BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND', 'Projects und Coworkers: INNER JOIN coworkers c ON c.id = p.leader', "BEGIN DBMS_MVIEW.REFRESH('mv_all_data'); END;"],
    solution: `CREATE MATERIALIZED VIEW mv_all_data
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT p.name AS project_name, p.duration, p.topic,
       c.id AS leader, c.name AS l_name, c.age, c.salary, c.hiring_date
FROM projects p
INNER JOIN coworkers c ON c.id = p.leader;

UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
COMMIT;
BEGIN
  DBMS_MVIEW.REFRESH('mv_all_data');
END;
/`,
    checks: [
      { label: 'BUILD IMMEDIATE und REFRESH COMPLETE ON DEMAND', hint: 'CREATE MATERIALIZED VIEW mv_all_data BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS …', all: [r`${MV('MV_ALL_DATA')} BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS SELECT`] },
      { label: 'Join von Projects und Coworkers über leader', hint: 'FROM projects p INNER JOIN coworkers c ON c.id = p.leader', all: [r`FROM PROJECTS \w+ (INNER )?JOIN COWORKERS \w+ ON (\w+\.ID ?= ?\w+\.LEADER|\w+\.LEADER ?= ?\w+\.ID)`] },
      { label: 'Spaltennamen mit Alias', hint: 'p.name AS project_name, c.id AS leader, c.name AS l_name', all: [r`\.NAME AS PROJECT_NAME`, r`\.ID AS LEADER`, r`\.NAME AS L_NAME`] },
      { label: 'Refresh mit DBMS_MVIEW im Block', hint: "BEGIN DBMS_MVIEW.REFRESH('mv_all_data'); END;", all: [r`BEGIN DBMS_MVIEW\.REFRESH ?\( ?'…' ?\) ?; END ?;`] },
    ],
    wrong: [
      `CREATE MATERIALIZED VIEW mv_all_data
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT p.name AS project_name, p.duration, p.topic, c.id AS leader, c.name AS l_name, c.age, c.salary, c.hiring_date
FROM projects p INNER JOIN coworkers c ON c.id = p.leader;
UPDATE coworkers SET salary = salary + 100 WHERE id = 1;
COMMIT;
REFRESH MATERIALIZED VIEW mv_all_data;`,
    ],
    source: 'Folien Views/MVs, BUILD, REFRESH, ON DEMAND (mv_all_data)',
  },
  {
    id: 'mv-index',
    topicId: '04-mv',
    title: 'Index auf einer Materialized View',
    level: 2,
    scenario: 'coworkers',
    task:
      'Lege eine Materialized View mv_reiche an, die Name und Gehalt aller Coworker mit mehr als 3000 enthält, erst beim ersten Refresh befüllt wird und sich bei jedem Commit aktualisiert. Lege danach einen Index mv_reiche_sal_i auf der Gehaltsspalte der MV an.',
    hints: ['Erst beim ersten Refresh befüllen: BUILD DEFERRED', 'Bei jedem Commit: REFRESH … ON COMMIT', 'Eine MV ist intern eine Tabelle: CREATE INDEX … ON mv_reiche (salary);'],
    solution: `CREATE MATERIALIZED VIEW mv_reiche
BUILD DEFERRED
REFRESH COMPLETE ON COMMIT
AS
SELECT name, salary FROM coworkers WHERE salary > 3000;

CREATE INDEX mv_reiche_sal_i ON mv_reiche (salary);`,
    checks: [
      { label: 'Erst beim ersten Refresh befüllt', hint: 'BUILD DEFERRED', all: [r`${MV('MV_REICHE')} BUILD DEFERRED`] },
      { label: 'Aktualisierung bei jedem Commit', hint: 'REFRESH (COMPLETE | FAST | FORCE) ON COMMIT', all: [r`REFRESH( COMPLETE| FAST| FORCE)? ON COMMIT AS SELECT`] },
      { label: 'Abfrage mit Gehaltsfilter', hint: 'SELECT name, salary FROM coworkers WHERE salary > 3000', all: [r`AS SELECT NAME ?, ?SALARY FROM COWORKERS WHERE SALARY ?> ?3000`] },
      { label: 'Index auf der MV', hint: 'CREATE INDEX mv_reiche_sal_i ON mv_reiche (salary);', all: [r`CREATE INDEX MV_REICHE_SAL_I ON MV_REICHE ?\( ?SALARY ?\)`] },
    ],
    wrong: [
      `CREATE MATERIALIZED VIEW mv_reiche
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT name, salary FROM coworkers WHERE salary > 3000;
CREATE INDEX mv_reiche_sal_i ON coworkers (salary);`,
    ],
    source: 'Folien Views/MVs, BUILD DEFERRED, ON COMMIT, Indexe auf MVs',
  },
  // ---------------------------------------------------------------- INSTEAD OF
  {
    id: 'insteadof-bienenart',
    topicId: '04-insteadof',
    title: 'INSTEAD OF: Bienenart in der View ändern',
    level: 2,
    scenario: 'honig',
    task:
      'Auf der View v_honig (Bienenart, Menge, Erntedatum, Honigtyp, Abpackung …) soll man den Namen einer Bienenart ändern können. Schreibe einen INSTEAD OF-Trigger, der die Änderung auf der darunterliegenden Tabelle BIENENVOLK vornimmt, und teste ihn mit einem UPDATE auf die View.',
    hints: ['INSTEAD OF UPDATE ON v_honig FOR EACH ROW', 'UPDATE bienenvolk SET bienenart = :NEW.bienenart WHERE bienenart = :OLD.bienenart;', 'Die Materialized View zeigt die Änderung erst nach einem Refresh.'],
    solution: `CREATE OR REPLACE TRIGGER t_bienenart_aendern
INSTEAD OF UPDATE ON v_honig
FOR EACH ROW
BEGIN
  UPDATE bienenvolk SET bienenart = :NEW.bienenart WHERE bienenart = :OLD.bienenart;
END;
/
UPDATE v_honig SET bienenart = 'Carnica' WHERE bienenart = 'Buckfast';
SELECT * FROM v_honig;`,
    checks: [
      { label: 'INSTEAD OF UPDATE auf der View', hint: 'CREATE OR REPLACE TRIGGER … INSTEAD OF UPDATE ON v_honig', all: [r`CREATE (OR REPLACE )?TRIGGER \w+ INSTEAD OF UPDATE( OF BIENENART)? ON V_HONIG`] },
      { label: 'Änderung auf BIENENVOLK', hint: 'UPDATE bienenvolk SET bienenart = :NEW.bienenart WHERE bienenart = :OLD.bienenart;', all: [r`UPDATE BIENENVOLK SET BIENENART ?= ?:NEW\.BIENENART WHERE BIENENART ?= ?:OLD\.BIENENART`] },
      { label: 'Test über die View', hint: "UPDATE v_honig SET bienenart = '…' WHERE bienenart = '…';", all: [r`UPDATE V_HONIG SET BIENENART ?= ?'…'`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER t_bienenart_aendern
BEFORE UPDATE ON v_honig
FOR EACH ROW
BEGIN
  UPDATE bienenvolk SET bienenart = :NEW.bienenart WHERE bienenart = :OLD.bienenart;
END;
/
UPDATE v_honig SET bienenart = 'Carnica' WHERE bienenart = 'Buckfast';`,
      `CREATE OR REPLACE TRIGGER t_bienenart_aendern
INSTEAD OF UPDATE ON v_honig
FOR EACH ROW
BEGIN
  UPDATE v_honig SET bienenart = :NEW.bienenart WHERE bienenart = :OLD.bienenart;
END;
/
UPDATE v_honig SET bienenart = 'Carnica' WHERE bienenart = 'Buckfast';`,
    ],
    source: 'Übung Views, Aufgabe 3 (INSTEAD-OF Trigger)',
  },
  {
    id: 'insteadof-leader-name',
    topicId: '04-insteadof',
    title: 'INSTEAD OF: Name der Projektleitung ändern',
    level: 2,
    scenario: 'coworkers',
    task:
      'Die View project_lead_data enthält alle Projekte mit ihrer Leitung (u. a. leader = c.id und l_name = c.name). Leader „Hardik“ (ID 5) heißt nach der Hochzeit „Meyer“. Die Anwendung hat nur Zugriff auf die View. Schreibe den Trigger change_leader_name, damit UPDATE project_lead_data SET l_name = \'Meyer\' WHERE leader = 5 funktioniert, und führe das UPDATE aus.',
    hints: ['Ohne Trigger lässt Oracle das UPDATE auf einer Join-View nicht zu.', 'UPDATE coworkers SET name = :NEW.l_name WHERE id = :NEW.leader;'],
    solution: `CREATE OR REPLACE TRIGGER change_leader_name
INSTEAD OF UPDATE ON project_lead_data
FOR EACH ROW
BEGIN
  UPDATE coworkers SET name = :NEW.l_name WHERE id = :NEW.leader;
END;
/
UPDATE project_lead_data SET l_name = 'Meyer' WHERE leader = 5;`,
    checks: [
      { label: 'INSTEAD OF UPDATE auf project_lead_data', hint: 'INSTEAD OF UPDATE ON project_lead_data', all: [r`CREATE (OR REPLACE )?TRIGGER \w+ INSTEAD OF UPDATE( OF L_NAME)? ON PROJECT_LEAD_DATA`] },
      { label: 'Name in COWORKERS geändert', hint: 'UPDATE coworkers SET name = :NEW.l_name WHERE id = :NEW.leader;', all: [r`UPDATE COWORKERS SET NAME ?= ?:NEW\.L_NAME WHERE ID ?= ?:(NEW|OLD)\.LEADER`] },
      { label: 'UPDATE auf die View ausgeführt', hint: "UPDATE project_lead_data SET l_name = 'Meyer' WHERE leader = 5;", all: [r`UPDATE PROJECT_LEAD_DATA SET L_NAME ?= ?'…' WHERE LEADER ?= ?5`] },
    ],
    wrong: [
      `CREATE OR REPLACE TRIGGER change_leader_name
INSTEAD OF UPDATE ON project_lead_data
FOR EACH ROW
BEGIN
  UPDATE coworkers SET name = :NEW.l_name WHERE id = 5;
END;
/
UPDATE project_lead_data SET l_name = 'Meyer' WHERE leader = 5;`,
    ],
    source: 'Folien Views/MVs, INSTEAD OF-Trigger Beispiel (change_leader_name)',
  },
];
