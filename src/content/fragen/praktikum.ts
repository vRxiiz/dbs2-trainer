// Fragen aus den Praktikumsunterlagen (DBS2 Test 2, DDM P2). Aussagen mit bekannter Lösung,
// als Mehrfachauswahl: richtig sind die Aussagen, die im Praktikum als richtig bewertet wurden.
import { q } from './q';

const T2 = 'Praktikum, DBS2 Test 2';
const P2 = 'Praktikum, DDM P2';

export const praktikum = [
  q('prak-trigger-aussagen', '03-row-statement', 'Welche Aussagen zu Triggern sind richtig?',
    ['Ein AFTER STATEMENT-Trigger feuert nach den AFTER ROW-Triggern', 'In einem AFTER UPDATE ROW-Trigger stehen :OLD und :NEW zur Verfügung', 'Tritt im Trigger ein Fehler auf, laufen die anderen Änderungen der Anweisung weiter', 'Trigger dürfen keine Prozeduren aufrufen'], [0, 1],
    'Reihenfolge: BEFORE STATEMENT, BEFORE ROW, AFTER ROW, AFTER STATEMENT. Bei einem Fehler wird die ganze auslösende Anweisung zurückgerollt. Aus Triggern dürfen Prozeduren aufgerufen werden.', T2),
  q('prak-mv-aussagen-1', '04-mv', 'Welche Aussagen zu Materialized Views sind richtig?',
    ['Eine MV wird bei jedem SELECT neu generiert', 'REFRESH COMPLETE löscht den Inhalt und baut ihn neu auf', 'ON COMMIT ist nicht empfehlenswert, weil sehr oft aktualisiert wird', 'Auf einer MV können Indexe angelegt werden'], [1, 2, 3],
    'Eine MV speichert das Ergebnis physisch und wird nur beim Refresh neu berechnet. Weil sie eine Tabelle ist, sind Indexe möglich.', T2),
  q('prak-mv-aussagen-2', '04-mv', 'Welche Aussagen zu Materialized Views treffen zu?',
    ['REFRESH FAST überträgt nur die Änderungen (Deltas)', 'MVs haben dieselben Vor- und Nachteile wie Views', 'MVs sind ein Tuningmittel im Data Warehouse', 'BUILD DEFERRED heißt: Befüllung erst beim ersten Refresh'], [0, 2, 3],
    'Anders als eine View speichert die MV Daten: schneller zu lesen, aber nicht immer aktuell und mit Speicherbedarf.', P2),
  q('prak-mv-join', '04-mv', 'Eine MV enthält das vorberechnete Ergebnis eines Joins. Welche Aussagen stimmen?',
    ['Abfragen auf die MV sind meist schneller als der Join auf den Basistabellen', 'Auf der MV lassen sich Indexe anlegen', 'Die MV ist immer aktuell', 'Eine MV wird nie erneuert'], [0, 1],
    'Der Join ist schon berechnet. Aktuell ist die MV nur so weit, wie ihr letzter Refresh zurückliegt, erneuert wird sie je nach REFRESH-Klausel.', P2),
  q('prak-view-aussagen-1', '04-views', 'Welche Aussagen zu Views sind richtig?',
    ['Eine View verbessert immer die Performance', 'Eine Host-Sprache sieht nur die Basistabellen, nicht die View', 'Eine View passt sich bei Schemaänderungen der Basistabellen automatisch an', 'Mit INSTEAD OF-Triggern lassen sich Änderungen über die View durchführen'], [3],
    'Eine View speichert nichts und ist nur eine gespeicherte Abfrage, also keine Beschleunigung. Sie wird bei einer Schemaänderung ungültig und muss ggf. angepasst werden.', P2),
  q('prak-view-aussagen-2', '04-views', 'Welche Aussagen zu Views sind richtig?',
    ['INSTEAD OF-Trigger wandeln DML auf der View in Änderungen der Basistabellen um', 'Views vereinfachen das Retrieval', 'Views kombinieren Daten neu', 'Views bilden Tabellen auf eine andere Sicht ab'], [0, 1, 2, 3],
    'Alle vier Aussagen beschreiben typische Einsatzzwecke von Views und INSTEAD OF-Triggern.', T2),
  q('prak-insteadof-aussagen', '04-insteadof', 'Welche Aussagen zu INSTEAD OF-Triggern sind richtig?',
    ['Sie sind immer Row-Trigger', 'Sie werden für virtuelle Views eingesetzt', 'Sie können für CREATE, ALTER und DROP angelegt werden', 'Sie ermöglichen DML auf Views'], [0, 1, 3],
    'INSTEAD OF gilt für DML (INSERT, UPDATE, DELETE) auf Views, nicht für DDL.', P2),
  q('prak-plsql-funktion', '02-variablen', 'Welche Aussagen zu Prozeduren und Funktionen sind richtig?',
    ['SELECT prozedur() FROM DUAL ist möglich', 'In Funktionen dürfen keine Prozeduren aufgerufen werden', 'Konstanten dürfen als IN-Parameter übergeben werden', 'Ein OUT-Parameter ist beim Aufruf nicht initialisiert'], [2, 3],
    'Prozeduren ruft man mit EXEC oder in einem Block auf, nur Funktionen in SELECT. Aus Funktionen dürfen Prozeduren aufgerufen werden. OUT-Parameter starten mit NULL.', T2),
  q('prak-btree-max', '01-bbaum', 'Ein B-Baum hat den Grad m = 2 und die Höhe h = 1 (Wurzel plus eine Ebene). Wie viele Knoten hat er höchstens?',
    ['3', '5', '6', '7'], 2,
    'Die Wurzel hat höchstens 2m + 1 = 5 Kinder, zusammen 1 + 5 = 6 Knoten.', T2),
  q('prak-btree-min-kinder', '01-bbaum', 'Wie viele Kinder hat ein innerer Knoten (nicht Wurzel) bei m = 2 mindestens?',
    ['2', '3', '4', '5'], 1,
    'Mindestens ⌈(2m + 1) / 2⌉ = ⌈2,5⌉ = 3 Kinder, also mindestens m = 2 Records.', T2),
  q('prak-btree-records', '01-bbaum', 'Ein innerer Knoten eines B-Baums hat 4 Kinder. Wie viele Records enthält er?',
    ['3', '4', '5', 'Das hängt von m ab'], 0,
    'Ein innerer Knoten mit k Kindern hat k − 1 Records.', T2),
];
