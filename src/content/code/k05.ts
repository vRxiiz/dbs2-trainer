// Kapitel 5 – Oracle In-Memory: Übung Column Stores (IMDB), Folienbeispiele movies_inmem
import type { CodeTask } from '../codeTypes';

const r = String.raw;
const MOVIES = 'SELECT title, year, rank FROM imdb.imdb_movie';

export const k05: CodeTask[] = [
  {
    id: 'mv-movies-inmem',
    topicId: '05-oracle-inmemory',
    title: 'In-Memory Materialized View mv_movies_inmem',
    level: 3,
    scenario: 'imdb',
    task:
      `Grundlage ist die Abfrage ${MOVIES}. (1) Erstelle die Materialized View mv_movies mit diesen Daten, sofort beladen und manuell erneuert. (2) Erstelle eine zweite MV mv_movies_inmem mit denselben Daten und ändere sie per ALTER so, dass sie In-Memory nutzt: leichte, für Queries optimierte Kompression und höchste Priorität für die Befüllung. (3) Berechne auf mv_movies_inmem das Durchschnittsrating pro Jahr für die Jahre 1970 bis 1980.`,
    hints: [
      'Sofort beladen, manuell erneuert: BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND',
      'ALTER MATERIALIZED VIEW mv_movies_inmem INMEMORY MEMCOMPRESS FOR QUERY LOW PRIORITY CRITICAL;',
      'SELECT year, AVG(rank) … WHERE year BETWEEN 1970 AND 1980 GROUP BY year',
    ],
    solution: `CREATE MATERIALIZED VIEW mv_movies
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS ${MOVIES};

CREATE MATERIALIZED VIEW mv_movies_inmem
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS ${MOVIES};

ALTER MATERIALIZED VIEW mv_movies_inmem INMEMORY MEMCOMPRESS FOR QUERY LOW PRIORITY CRITICAL;

SELECT year, AVG(rank) FROM mv_movies_inmem
WHERE year BETWEEN 1970 AND 1980
GROUP BY year
ORDER BY year;`,
    checks: [
      { label: 'mv_movies: sofort beladen, manuell erneuert', hint: 'CREATE MATERIALIZED VIEW mv_movies BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS SELECT …', all: [r`CREATE MATERIALIZED VIEW MV_MOVIES BUILD IMMEDIATE REFRESH (COMPLETE |FORCE )?ON DEMAND AS SELECT [^;]*FROM IMDB\.IMDB_MOVIE`], points: 3 },
      { label: 'Zweite MV mv_movies_inmem mit denselben Daten', hint: 'CREATE MATERIALIZED VIEW mv_movies_inmem … AS SELECT … FROM imdb.imdb_movie;', all: [r`CREATE MATERIALIZED VIEW MV_MOVIES_INMEM .*AS SELECT [^;]*FROM IMDB\.IMDB_MOVIE`], points: 2 },
      {
        label: 'Per ALTER In-Memory, leicht für Queries komprimiert, höchste Priorität',
        hint: 'ALTER MATERIALIZED VIEW mv_movies_inmem INMEMORY MEMCOMPRESS FOR QUERY LOW PRIORITY CRITICAL;',
        all: [r`ALTER MATERIALIZED VIEW MV_MOVIES_INMEM INMEMORY MEMCOMPRESS FOR QUERY( LOW)? PRIORITY CRITICAL`],
        points: 3,
      },
      {
        label: 'Durchschnittsrating pro Jahr 1970–1980',
        hint: 'SELECT year, AVG(rank) FROM mv_movies_inmem WHERE year BETWEEN 1970 AND 1980 GROUP BY year;',
        all: [r`SELECT [^;]*AVG ?\( ?RANK ?\)[^;]* FROM MV_MOVIES_INMEM WHERE [^;]*GROUP BY YEAR`],
        any: [r`YEAR BETWEEN 1970 AND 1980`, r`YEAR ?>= ?1970 AND YEAR ?<= ?1980`],
        points: 2,
      },
    ],
    wrong: [
      `CREATE MATERIALIZED VIEW mv_movies BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS ${MOVIES};
CREATE MATERIALIZED VIEW mv_movies_inmem BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS ${MOVIES};
ALTER MATERIALIZED VIEW mv_movies_inmem INMEMORY MEMCOMPRESS FOR CAPACITY HIGH PRIORITY LOW;
SELECT year, AVG(rank) FROM mv_movies_inmem WHERE year BETWEEN 1970 AND 1980 GROUP BY year;`,
      `CREATE MATERIALIZED VIEW mv_movies BUILD DEFERRED REFRESH COMPLETE ON COMMIT AS ${MOVIES};
CREATE MATERIALIZED VIEW mv_movies_inmem BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS ${MOVIES};
ALTER MATERIALIZED VIEW mv_movies_inmem INMEMORY MEMCOMPRESS FOR QUERY LOW PRIORITY CRITICAL;
SELECT year, AVG(rank) FROM mv_movies_inmem WHERE year BETWEEN 1970 AND 1980 GROUP BY year;`,
    ],
    exam: true,
    points: 10,
    source: 'Übung Column Stores, Aufgabe 1.2–1.5 (In Memory Materialized View)',
  },
  {
    id: 'inmemory-tabelle',
    topicId: '05-oracle-inmemory',
    title: 'Tabelle in den In-Memory-Store laden',
    level: 2,
    scenario: 'imdb',
    task:
      'Lege die Tabellen movies_standard und movies_inmem jeweils mit SELECT title, year FROM imdb.imdb_movie WHERE year > 1960 an. Deklariere movies_inmem per ALTER für den In-Memory-Store: für Abfragen optimiert (QUERY HIGH) und als Erstes geladen. Prüfe dann im Data Dictionary Name, In-Memory-Status, Priorität und Kompression deiner Tabellen.',
    hints: ['CREATE TABLE … AS SELECT …', 'ALTER TABLE movies_inmem INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;', 'SELECT table_name, inmemory, inmemory_priority, inmemory_compression FROM user_tables;'],
    solution: `CREATE TABLE movies_standard AS SELECT title, year FROM imdb.imdb_movie WHERE year > 1960;
CREATE TABLE movies_inmem AS SELECT title, year FROM imdb.imdb_movie WHERE year > 1960;
ALTER TABLE movies_inmem INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;
SELECT table_name, inmemory, inmemory_priority, inmemory_compression FROM user_tables;`,
    checks: [
      { label: 'Beide Tabellen per CREATE TABLE … AS SELECT', hint: 'CREATE TABLE movies_standard AS SELECT … ; CREATE TABLE movies_inmem AS SELECT …;', all: [r`CREATE TABLE MOVIES_STANDARD AS SELECT TITLE ?, ?YEAR FROM IMDB\.IMDB_MOVIE WHERE YEAR ?> ?1960`, r`CREATE TABLE MOVIES_INMEM AS SELECT TITLE ?, ?YEAR FROM IMDB\.IMDB_MOVIE WHERE YEAR ?> ?1960`] },
      { label: 'movies_inmem: QUERY HIGH, PRIORITY CRITICAL', hint: 'ALTER TABLE movies_inmem INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL;', all: [r`ALTER TABLE MOVIES_INMEM INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY CRITICAL`] },
      { label: 'Nur movies_inmem ist In-Memory', hint: 'movies_standard bleibt ein normaler Row Store als Vergleich.', all: [r`TABLE`], none: [r`ALTER TABLE MOVIES_STANDARD INMEMORY`] },
      { label: 'Status aus USER_TABLES', hint: 'SELECT table_name, inmemory, inmemory_priority, inmemory_compression FROM user_tables;', all: [r`SELECT [^;]*INMEMORY_PRIORITY[^;]*FROM USER_TABLES`, r`SELECT [^;]*INMEMORY_COMPRESSION[^;]*FROM USER_TABLES`] },
    ],
    wrong: [
      `CREATE TABLE movies_standard AS SELECT title, year FROM imdb.imdb_movie WHERE year > 1960;
CREATE TABLE movies_inmem AS SELECT title, year FROM imdb.imdb_movie WHERE year > 1960;
ALTER TABLE movies_inmem INMEMORY MEMCOMPRESS FOR QUERY HIGH PRIORITY NONE;
SELECT table_name, inmemory, inmemory_priority, inmemory_compression FROM user_tables;`,
    ],
    source: 'Folien Column Store/In-Memory, manuelle In-Memory-Population (movies_inmem)',
  },
  {
    id: 'inmemory-vergleich',
    topicId: '05-oracle-inmemory',
    title: 'Abfrage vergleichen und In-Memory wieder abschalten',
    level: 2,
    scenario: 'imdb',
    task:
      'Lass dir mit EXPLAIN PLAN die Kosten von SELECT AVG(year) für movies_standard und movies_inmem erklären und zeige den Plan mit DBMS_XPLAN an. Nimm danach movies_inmem wieder aus dem In-Memory-Store.',
    hints: ['EXPLAIN PLAN FOR SELECT …;', 'SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);', 'Abschalten: ALTER TABLE movies_inmem NO INMEMORY;'],
    solution: `EXPLAIN PLAN FOR SELECT AVG(year) FROM movies_standard;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
EXPLAIN PLAN FOR SELECT AVG(year) FROM movies_inmem;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
ALTER TABLE movies_inmem NO INMEMORY;`,
    checks: [
      { label: 'EXPLAIN PLAN für beide Tabellen', hint: 'EXPLAIN PLAN FOR SELECT AVG(year) FROM movies_standard; … FROM movies_inmem;', all: [r`EXPLAIN PLAN FOR SELECT AVG ?\( ?YEAR ?\) FROM MOVIES_STANDARD`, r`EXPLAIN PLAN FOR SELECT AVG ?\( ?YEAR ?\) FROM MOVIES_INMEM`] },
      { label: 'Plan angezeigt', hint: 'SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);', all: [r`(TABLE ?\( ?DBMS_XPLAN\.DISPLAY.*){2}`] },
      { label: 'In-Memory abgeschaltet', hint: 'ALTER TABLE movies_inmem NO INMEMORY;', all: [r`ALTER TABLE MOVIES_INMEM NO INMEMORY`] },
    ],
    wrong: [
      `EXPLAIN PLAN FOR SELECT AVG(year) FROM movies_standard;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
EXPLAIN PLAN FOR SELECT AVG(year) FROM movies_inmem;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
ALTER TABLE movies_inmem INMEMORY PRIORITY NONE;`,
    ],
    source: 'Folien Column Store/In-Memory, Performance-Steigerung; Übung Column Stores 1.6–1.8',
  },
];
