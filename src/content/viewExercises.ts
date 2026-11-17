// SQL-Aufgaben zu Kapitel 4: Views und Materialized Views. Sie laufen echt auf den Fall-Datenbanken.
// Materialized Views werden als Schnappschuss-Tabelle emuliert (REFRESH, ON COMMIT, INMEMORY bekannt).

import type { SqlExercise } from './sqlTypes';

const HONIG_VIEW = `CREATE OR REPLACE VIEW v_honig AS
SELECT b.bienenart, h.menge, h.erntedatum, t.bezeichnung AS honigtyp, t.geschmack,
       a.bezeichnung AS abpackung, a.art, a.preis
FROM bienenvolk b
JOIN gesammelt g ON g.volk_id = b.volk_id
JOIN honigernte h ON h.ernte_id = g.ernte_id
JOIN honigtyp t ON t.honigtyp_id = h.honigtyp_id
JOIN abpackung a ON a.abpackung_id = h.abpackung_id;`;

const HOTEL_MV = `CREATE MATERIALIZED VIEW mv_kunde_stadt
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT k.kunden_id, k.vorname, k.nachname, b.buchungs_id, h.hotel_id, h.hotelname,
       s.stadt_id, s.stadtname, s.einwohner
FROM kunde k
JOIN buchung b ON b.kunden_id = k.kunden_id
JOIN hotel h ON h.hotel_id = b.hotel_id
JOIN stadt s ON s.stadt_id = h.stadt_id;`;

export const viewExercises: SqlExercise[] = [
  {
    id: 'honig-view',
    topicId: '04-views',
    kind: 'view',
    scenario: 'honig',
    view: 'v_honig',
    title: 'View: Wie viel Honig?',
    topic: 'View über fünf Tabellen',
    level: 2,
    task: 'Erstelle die View v_honig mit diesen Spalten in dieser Reihenfolge: Bienenart des Bienenvolks, Menge und Erntedatum der Honigernte, Bezeichnung und Geschmack des Honigtyps sowie Bezeichnung, Art und Preis der Abpackung.',
    hints: [
      'Eine Ernte kann von mehreren Völkern stammen: Die Verbindung läuft über die Tabelle GESAMMELT.',
      'Joine alle Tabellen auf dem Weg: BIENENVOLK – GESAMMELT – HONIGERNTE – HONIGTYP und ABPACKUNG.',
      'Gleichnamige Spalten (BEZEICHNUNG) brauchen einen Alias, sonst lässt sich die View nicht anlegen.',
    ],
    solution: HONIG_VIEW,
    starter: 'CREATE OR REPLACE VIEW v_honig AS\nSELECT ',
    source: 'Übung Views, Aufgabe 1a',
  },
  {
    id: 'honig-je-art',
    topicId: '04-views',
    kind: 'dql',
    scenario: 'honig',
    setup: HONIG_VIEW,
    title: 'Abfrage an die View: Honig je Bienenart',
    topic: 'SELECT auf eine View mit GROUP BY',
    level: 1,
    task: 'Die View v_honig aus der vorigen Aufgabe ist angelegt. Ermittle mit einer Abfrage an die View, wie viel Honig insgesamt je Bienenart produziert wurde (Bienenart, Summe der Menge).',
    hints: ['Eine View fragst du ab wie eine Tabelle.', '„je“ heißt GROUP BY, „insgesamt“ heißt SUM.'],
    solution: 'SELECT bienenart, SUM(menge) AS menge_gesamt FROM v_honig GROUP BY bienenart;',
    starter: 'SELECT ',
    source: 'Übung Views, Aufgabe 1b',
  },
  {
    id: 'honig-mv',
    topicId: '04-mv',
    kind: 'view',
    scenario: 'honig',
    view: 'mv_honig',
    title: 'Materialized View: alle 30 Minuten aktualisieren',
    topic: 'BUILD IMMEDIATE, START WITH … NEXT',
    level: 2,
    task: 'Erstelle die Materialized View mv_honig mit denselben Spalten wie v_honig (Bienenart, Menge, Erntedatum, Honigtyp, Geschmack, Abpackung, Art, Preis). Sie soll direkt befüllt und alle 30 Minuten vollständig aktualisiert werden. Nutze für die Zeitangaben SYSDATE.',
    hints: [
      '„direkt befüllt“ heißt BUILD IMMEDIATE.',
      'Periodisch: START WITH SYSDATE NEXT SYSDATE + 30/1440 (ein Tag hat 1440 Minuten).',
      'Die Optionen stehen vor AS SELECT.',
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
JOIN abpackung a ON a.abpackung_id = h.abpackung_id;`,
    starter: 'CREATE MATERIALIZED VIEW mv_honig\n',
    source: 'Übung Views, Aufgabe 2a',
  },
  {
    id: 'honig-preis-je-art',
    topicId: '04-mv',
    kind: 'dql',
    scenario: 'honig',
    setup: HONIG_VIEW.replace('CREATE OR REPLACE VIEW v_honig AS', 'CREATE MATERIALIZED VIEW mv_honig BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS'),
    title: 'Durchschnittspreis je Bienenart über die MV',
    topic: 'Abfrage an eine Materialized View',
    level: 1,
    task: 'Die Materialized View mv_honig ist angelegt. Ermittle über die MV den Durchschnittspreis des Honigs je Bienenart (Bienenart, Durchschnittspreis).',
    hints: ['Eine MV fragst du ab wie eine Tabelle.', 'AVG(preis) mit GROUP BY bienenart.'],
    solution: 'SELECT bienenart, AVG(preis) AS preis_avg FROM mv_honig GROUP BY bienenart;',
    starter: 'SELECT ',
    source: 'Übung Views, Aufgabe 2c',
  },
  {
    id: 'project-lead-data',
    topicId: '04-views',
    kind: 'view',
    scenario: 'coworkers',
    view: 'project_lead_data',
    title: 'View: Projekte mit Projektleitung',
    topic: 'View als vereinfachte Sicht',
    level: 1,
    task: 'Erstelle die View project_lead_data mit Projektname, Thema (TOPIC), Name und Gehalt der Projektleitung (in dieser Reihenfolge).',
    hints: ['LEADER in PROJECTS verweist auf die ID in COWORKERS.', 'Beide Tabellen haben eine Spalte NAME: Alias vergeben.'],
    solution: `CREATE OR REPLACE VIEW project_lead_data AS
SELECT p.name AS project, p.topic, c.name AS leader, c.salary
FROM projects p
JOIN coworkers c ON c.id = p.leader;`,
    starter: 'CREATE OR REPLACE VIEW project_lead_data AS\nSELECT ',
    source: 'Folien Kap. 4 (Views), Coworkers/Projects',
  },
  {
    id: 'topic-age',
    topicId: '04-views',
    kind: 'view',
    scenario: 'coworkers',
    view: 'v_topic_age',
    title: 'View: Durchschnittsalter der Leitung je Thema',
    topic: 'View mit Aggregation',
    level: 2,
    task: 'Erstelle die View v_topic_age, die je Projektthema (TOPIC) das Durchschnittsalter der Projektleitungen enthält (Thema, Durchschnittsalter).',
    hints: ['Erst PROJECTS mit COWORKERS über LEADER verbinden.', 'Dann GROUP BY topic mit AVG(age).'],
    solution: `CREATE OR REPLACE VIEW v_topic_age AS
SELECT p.topic, AVG(c.age) AS avg_age
FROM projects p
JOIN coworkers c ON c.id = p.leader
GROUP BY p.topic;`,
    starter: 'CREATE OR REPLACE VIEW v_topic_age AS\nSELECT ',
    source: 'Folien Kap. 4 (Views), Coworkers/Projects',
  },
  {
    id: 'coworkers-public',
    topicId: '04-views',
    kind: 'view',
    scenario: 'coworkers',
    view: 'v_coworkers_public',
    title: 'View: Mitarbeitende ohne Gehalt',
    topic: 'Datensicherheit durch Views',
    level: 1,
    task: 'Alle sollen die Mitarbeitenden sehen dürfen, aber nicht ihr Gehalt. Erstelle die View v_coworkers_public mit ID, Name, Alter, Adresse und Einstellungsdatum.',
    hints: ['Eine View kann Spalten ausblenden: Wähle einfach alle außer SALARY.', 'Danach könnte man mit GRANT SELECT ON v_coworkers_public TO … nur die View freigeben.'],
    solution: `CREATE OR REPLACE VIEW v_coworkers_public AS
SELECT id, name, age, address, hiring_date FROM coworkers;`,
    starter: 'CREATE OR REPLACE VIEW v_coworkers_public AS\nSELECT ',
    source: 'Folien Kap. 4 (Views: Datensicherheit)',
  },
  {
    id: 'mv-kunde-stadt',
    topicId: '04-mv',
    kind: 'view',
    scenario: 'hotel',
    view: 'mv_kunde_stadt',
    title: 'Materialized View mv_kunde_stadt',
    topic: 'BUILD IMMEDIATE, REFRESH COMPLETE ON DEMAND',
    level: 3,
    task: 'Erstelle die Materialized View mv_kunde_stadt mit allen Kunden (KUNDEN_ID, VORNAME, NACHNAME), deren gebuchten Hotels (BUCHUNGS_ID, HOTEL_ID, HOTELNAME) und der Stadt der gebuchten Hotels (STADT_ID, STADTNAME, EINWOHNER). Sie soll sofort befüllt werden und sich nur auf expliziten Befehl komplett aktualisieren.',
    hints: [
      '„sofort befüllt“: BUILD IMMEDIATE.',
      '„nur auf expliziten Befehl komplett“: REFRESH COMPLETE ON DEMAND.',
      'Weg durch das Schema: KUNDE – BUCHUNG – HOTEL – STADT.',
    ],
    solution: HOTEL_MV,
    starter: 'CREATE MATERIALIZED VIEW mv_kunde_stadt\n',
    source: 'Altklausur, Aufgabe 2.1 (7 Punkte)',
  },
  {
    id: 'anna-staedte',
    topicId: '04-mv',
    kind: 'dql',
    scenario: 'hotel',
    setup: HOTEL_MV,
    title: 'Städte von Anna Schneider',
    topic: 'Abfrage an die MV mit DISTINCT',
    level: 1,
    task: 'Die Materialized View mv_kunde_stadt ist angelegt. Gib ohne Duplikate die Städte aus, die Anna Schneider bereits besucht hat. Ausgabe: Vorname, Nachname, Stadtname.',
    hints: ['„ohne Duplikate“ heißt SELECT DISTINCT.', 'Filtere auf Vorname und Nachname.'],
    solution: "SELECT DISTINCT vorname, nachname, stadtname FROM mv_kunde_stadt WHERE vorname = 'Anna' AND nachname = 'Schneider';",
    starter: 'SELECT ',
    source: 'Altklausur, Aufgabe 2.2 (2 Punkte)',
  },
  {
    id: 'analyst-view',
    topicId: '04-views',
    kind: 'view',
    scenario: 'hotel',
    view: 'v_buchungen_stadt',
    title: 'Aggregat-View für Datenanalysten',
    topic: 'Nur aggregierte Daten freigeben',
    level: 2,
    task: 'Datenanalysten sollen nur aggregierte Daten sehen. Erstelle die View v_buchungen_stadt mit Stadtname und Anzahl der Buchungen je Stadt (nur Städte mit Buchungen).',
    hints: ['Joine BUCHUNG über HOTEL zu STADT.', 'COUNT(*) mit GROUP BY stadtname.'],
    solution: `CREATE OR REPLACE VIEW v_buchungen_stadt AS
SELECT s.stadtname, COUNT(*) AS anzahl_buchungen
FROM buchung b
JOIN hotel h ON h.hotel_id = b.hotel_id
JOIN stadt s ON s.stadt_id = h.stadt_id
GROUP BY s.stadtname;`,
    starter: 'CREATE OR REPLACE VIEW v_buchungen_stadt AS\nSELECT ',
    source: 'Folien Kap. 4 (Views: Datensicherheit), Hotel-Schema',
  },
];
