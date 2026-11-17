// Themen je Kapitel, gegliedert nach den Inhaltsfolien der DBS2-Vorlesung.
// Jede Aufgabe und jede Wissensfrage gehoert zu genau einem Thema.

import type { Chapter } from './chapters';

export interface Topic {
  id: string;
  chapter: Chapter;
  title: string;
  /** Bezug auf die Folien */
  slides: string;
}

export const topics: Topic[] = [
  // 01 Speicherstrukturen
  { id: '01-organisation', chapter: '01', title: 'Heap, sequenzielle und indexbasierte Organisation', slides: 'Lineare vs. binäre Suche, Landau-Notation, Index als sortierte Reihe' },
  { id: '01-bbaum', chapter: '01', title: 'B-Baum: Eigenschaften, Suchen, Einfügen', slides: 'Grad m, höchstens 2m Records, Ausbalancieren, B+-Baum' },
  { id: '01-bitmap', chapter: '01', title: 'Bitmap-Index', slides: 'Bit-Liste je Wert, wenige unterschiedliche Werte' },
  { id: '01-sql-index', chapter: '01', title: 'Indexe in SQL', slides: 'CREATE [BITMAP | UNIQUE] INDEX, Composite Index, wann (k)ein Index' },

  // 02 PL/SQL
  { id: '02-bloecke', chapter: '02', title: 'Anonymer Block, Prozedur, Funktion', slides: 'Blockaufbau DECLARE/BEGIN/EXCEPTION/END, RETURN, Aufruf' },
  { id: '02-variablen', chapter: '02', title: 'Variablen, Konstanten, Parameter', slides: 'CONSTANT, :=, IN / OUT / IN OUT' },
  { id: '02-kontroll', chapter: '02', title: 'Kontrollstrukturen', slides: 'IF/ELSIF/ELSE, WHILE LOOP, FOR LOOP' },
  { id: '02-cursor', chapter: '02', title: 'SELECT INTO, Cursor und %TYPE', slides: 'Impedance Mismatch, Cursor-FOR-Schleife, dynamische Datentypen' },
  { id: '02-dml-exc', chapter: '02', title: 'DML in PL/SQL und Exceptions', slides: 'UPDATE/INSERT mit COMMIT, NO_DATA_FOUND, TOO_MANY_ROWS, OTHERS' },
  { id: '02-packages', chapter: '02', title: 'Packages und Oracle-Funktionen', slides: 'DBMS_OUTPUT, SYSDATE, TO_CHAR, TO_NUMBER' },

  // 03 Trigger
  { id: '03-grundlagen', chapter: '03', title: 'Aktive Datenbanken und ECA', slides: 'Dynamische Integritätsbedingung, Event-Condition-Mode-Action, Syntax' },
  { id: '03-before-after', chapter: '03', title: 'BEFORE, AFTER und RAISE_APPLICATION_ERROR', slides: 'Integritätsprüfung vs. Folgeoperation, Abbruch, :NEW setzen' },
  { id: '03-row-statement', chapter: '03', title: 'Row- vs. Statement-Trigger, :OLD/:NEW, WHEN, OF', slides: 'FOR EACH ROW, Transitionsvariablen, WHEN ohne Doppelpunkt' },
  { id: '03-events', chapter: '03', title: 'Ereignisse und mehrere Tabellen', slides: 'INSERT/UPDATE/DELETE, IF INSERTING, tabellenübergreifend' },
  { id: '03-mutating', chapter: '03', title: 'Mutating Table und Compound Trigger', slides: 'Ausführungsmodell, Statement-Workaround, COMPOUND TRIGGER' },
  { id: '03-testen', chapter: '03', title: 'Trigger testen, deaktivieren, löschen', slides: 'Testfälle mit ROLLBACK, ALTER TABLE ENABLE/DISABLE, DROP TRIGGER' },

  // 04 Views
  { id: '04-views', chapter: '04', title: 'Views', slides: 'Virtuelle Relation, Vereinfachung, logische Datenunabhängigkeit, Datensicherheit' },
  { id: '04-mv', chapter: '04', title: 'Materialized Views', slides: 'BUILD, REFRESH, ON, START WITH … NEXT, Index auf MV, Explain Plan' },
  { id: '04-insteadof', chapter: '04', title: 'INSTEAD-OF-Trigger', slides: 'Schreiboperationen auf Views' },

  // 05 Column Store
  { id: '05-row-column', chapter: '05', title: 'Row-Store vs. Column-Store', slides: 'Pages und Sektoren, I/O, Lese- vs. Schreiboperationen' },
  { id: '05-kompression', chapter: '05', title: 'Leichtgewichtige Komprimierung', slides: 'Lauflänge, Bit-Vektor, Dictionary, Frame of Reference, Differenz, Entscheidungsbaum' },
  { id: '05-materialization', chapter: '05', title: 'Early vs. Late Materialization', slides: 'Operationen auf komprimierten Daten' },
  { id: '05-htap', chapter: '05', title: 'OLTP, OLAP, HTAP und In-Memory-DBMS', slides: 'ETL, Speicherhierarchie, Main Store und Differential Store' },
  { id: '05-oracle-inmemory', chapter: '05', title: 'In-Memory in Oracle', slides: 'INMEMORY, MEMCOMPRESS, PRIORITY' },

  // 06 Kopplung
  { id: '06-schnittstellen', chapter: '06', title: 'CLI, ODBC und JDBC', slides: 'Driver Manager, Connection, Statement, ResultSet, python-oracledb, pandas' },
  { id: '06-injection', chapter: '06', title: 'SQL-Injection und Prepared Statements', slides: 'Zeichenfolgeninterpolation, Bind Variables' },
  { id: '06-views-orm', chapter: '06', title: 'Views aus Host-Sprachen und ORM', slides: 'Logische Datenunabhängigkeit, Object Relational Mapping' },

  // 07 NoSQL
  { id: '07-bigdata', chapter: '07', title: 'Big Data und Grenzen von RDBMS', slides: 'Volume, Velocity, Variety, festes Schema, vertikale vs. horizontale Skalierung' },
  { id: '07-typen', chapter: '07', title: 'Key-Value, Dokument, Graph', slides: 'Datenmodelle, Storage Layout, Indexe' },
  { id: '07-konsistenz', chapter: '07', title: 'ACID, BASE und CAP', slides: 'Eventual Consistency, wähle 2 von 3' },
];

export const topicById = (id: string) => topics.find((t) => t.id === id);
export const topicsOf = (chapter: Chapter) => topics.filter((t) => t.chapter === chapter);
