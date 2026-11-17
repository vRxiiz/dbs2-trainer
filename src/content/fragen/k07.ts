// Kapitel 7: NoSQL-Datenbanken (inklusive Quiz aus Übung 8)
import { q } from './q';

const F = 'Folien NoSQL';
const U = (n: number) => `Übung 8, Frage ${n}`;

export const k07 = [
  // Übung 8 vollständig
  q('u8-bigdata', '07-bigdata', 'Welche der folgenden Eigenschaften sind typische Merkmale von Big Data?', ['Volume, Velocity, Variety', 'ACID-Eigenschaften', 'Relationale Strukturen', 'Feste Schemas'], 0,
    'Big Data: große Mengen (Volume), hohe Geschwindigkeit (Velocity), heterogene Daten (Variety).', U(1)),
  q('u8-nosql', '07-typen', 'Was bedeutet NoSQL heute primär?', ['Not SQL', 'Not only SQL', 'New SQL', 'Non-Standard Query Language'], 1,
    'Anfangs „Not SQL“, heute übersetzt die Community es meist mit „Not only SQL“.', U(2)),
  q('u8-skalierung', '07-bigdata', 'Welche Art der Skalierung ist für NoSQL-Datenbanken charakteristisch?', ['Vertikale Skalierung (Scale Up)', 'Horizontale Skalierung (Scale Out)', 'Diagonale Skalierung', 'Keine Skalierung möglich'], 1,
    'NoSQL-Systeme sind verteilt und horizontal skalierbar: mehr günstige Knoten statt eines größeren Servers.', U(3)),
  q('u8-cap', '07-konsistenz', 'Nach dem CAP-Theorem können maximal wie viele der drei Eigenschaften gleichzeitig garantiert werden?', ['Alle drei', 'Zwei von drei', 'Eine von drei', 'Keine'], 1,
    'Consistency, Availability, Partition Tolerance: höchstens zwei gleichzeitig.', U(4)),
  q('u8-base', '07-konsistenz', 'Welche Aussagen zu BASE sind richtig?', ['Basically Available bedeutet garantierte Erreichbarkeit', 'Soft State bedeutet, dass der Systemstatus unveränderlich ist', 'Eventually Consistency garantiert sofortige Datenkonsistenz', 'BASE steht im Gegensatz zu ACID-Eigenschaften'], [0, 3],
    'Basically Available: Das System garantiert seine Erreichbarkeit. Soft State: Der Status kann sich ändern. Eventual Consistency: irgendwann konsistent, nicht sofort. BASE ist das Gegenmodell zu ACID.', U(5)),
  q('u8-typen', '07-typen', 'Welche Aussagen zu NoSQL-Datenbanktypen sind richtig?', ['MongoDB ist eine dokumentenorientierte Datenbank', 'Graph-Datenbanken verwenden das Property Graph Model', 'ElasticSearch ist primär eine Suchmaschine', 'Key-Value Stores unterstützen keine unique Keys'], [0, 1, 2],
    'In Key-Value Stores sind die Keys gerade unique. Die anderen drei Aussagen stimmen.', U(6)),
  q('u8-skalierung-vn', '07-bigdata', 'Welche Aussagen zur Skalierung sind richtig?', ['Vertikale Skalierung ist transparent für das DBMS', 'Horizontale Skalierung erfordert Load Balancing', 'Vertikale Skalierung bietet endlose Skalierbarkeit', 'Horizontale Skalierung verwendet günstige Hardware'], [0, 1, 3],
    'Scale Up: transparent, aber teure Hardware und begrenzt. Scale Out: günstige Hardware und endlos skalierbar, braucht aber Load Balancing und Datenverteilung.', U(7)),

  // Big Data und Skalierung
  q('rdbms-probleme', '07-bigdata', 'Welche Probleme relationaler Datenbanken nennt die Vorlesung?', ['Sie lassen sich nicht beliebig skalieren', 'Sie zeigen Schwächen bei sehr großen Datenmengen', 'Unstrukturierte Daten wie Bilder und Dokumente lassen sich kaum speichern', 'Sie garantieren keine Konsistenz'], [0, 1, 2],
    'Konsistenz (ACID) ist gerade die Stärke relationaler Systeme.', F),
  q('festes-schema', '07-bigdata', 'Warum ist ein festes Schema bei Big Data ein Problem?', ['Die Daten müssen an das Schema angepasst werden, obwohl sich ihre Struktur schnell ändert', 'Feste Schemata erlauben keine Primärschlüssel', 'Feste Schemata sind langsamer beim Lesen', 'Feste Schemata verhindern Indexe'], 0,
    'Variety: Strukturen ändern sich, neue Daten kommen hinzu, alte fallen weg.', F),
  q('joins-fragment', '07-bigdata', 'Warum ist die getrennte Speicherung zusammengehöriger Daten in Relationen für große Datenmengen ungünstig?', ['Die Daten werden fragmentiert und teure Joins senken die Performance', 'Relationen können keine Fremdschlüssel haben', 'Zusammengehörige Daten dürfen nicht in einer Tabelle stehen', 'Joins sind in SQL verboten'], 0,
    'Dokumentenorientierte Systeme speichern Zusammengehöriges gemeinsam in einem Dokument.', F),
  q('scale-out-nachteile', '07-bigdata', 'Welche Nachteile hat horizontale Skalierung?', ['Load Balancing und Datenverteilung notwendig', 'Erhöhte Fehlerrate bei Knoten und höhere Managementkomplexität', 'Verteilte Locking- und Replikationsprotokolle notwendig', 'Sehr teure Hardware'], [0, 1, 2],
    'Teure Hardware ist ein Nachteil der vertikalen Skalierung.', F),

  // Typen
  q('kv-values', '07-typen', 'Warum gibt es bei Key-Value-Datenbanken keine Sekundärindexe auf den Values?', ['Die Datenbank weiß nicht, was in den Values enthalten ist', 'Values sind immer Zahlen', 'Values sind automatisch sortiert', 'Es gibt keine Keys'], 0,
    'Values sind für die Datenbank nicht einsehbare Objekte, z. B. serialisierte Byte-Arrays.', F),
  q('kv-index', '07-typen', 'Worüber findet man Daten in einem Key-Value Store?', ['Über einen Primärindex auf dem Key (Hash oder B-Baum)', 'Über SQL-Joins', 'Über Sekundärindexe auf den Values', 'Nur durch vollständiges Durchsuchen'], 0,
    '(key) → value, Keys sind unique, Speicherung z. B. als Hash-Map oder B-Baum.', F),
  q('doc-format', '07-typen', 'In welchem Format speichern dokumentenorientierte Datenbanken ihre Dokumente typischerweise?', ['JSON bzw. BSON (Binary JSON)', 'CSV', 'Relationale Tabellen', 'Bit-Vektoren'], 0,
    'Lose strukturierte, hierarchische Key-Value-Paare. Viele Web-APIs nutzen JSON, daher die Popularität.', F),
  q('doc-index', '07-typen', 'Welche Aussage zu dokumentenorientierten Datenbanken ist richtig?', ['Sekundärindexe auf Values sind möglich, weil die Struktur der Dokumente bekannt ist', 'Sie erlauben keine Indexe', 'Dokumente einer Collection müssen identisch aufgebaut sein', 'Sie können kein JSON speichern'], 0,
    'Anders als beim Key-Value Store sieht die Datenbank in die Dokumente. Dokumente einer Collection sollten ähnlich sein, um effektiv zu indexieren.', F),
  q('graph', '07-typen', 'Wofür werden Graph-Datenbanken vor allem verwendet?', ['Wissensgraphen und stark vernetzte Daten wie soziale Netzwerke', 'Zeitreihen von Sensoren', 'Reine Schlüssel-Wert-Caches', 'Spaltenweise Analysen'], 0,
    'Property Graph Model G = (V, E): Knoten, gerichtete Kanten und Attribute.', F),
  q('json-rdbms', '07-typen', 'Welche relationalen Datenbanksysteme unterstützen laut Vorlesung ebenfalls JSON?', ['PostgreSQL', 'Oracle', 'IBM Db2', 'Keines, JSON gibt es nur in NoSQL'], [0, 1, 2],
    'JSON-Unterstützung gibt es auch in relationalen DBMS.', F),

  // Konsistenz
  q('acid', '07-konsistenz', 'Wofür steht das I in ACID?', ['Isolation: Transaktionen dürfen sich nicht gegenseitig beeinflussen', 'Integrity: Nur gültige Werte', 'Index: Jede Tabelle hat einen Index', 'Immediate: Alles wird sofort geschrieben'], 0,
    'Atomicity, Consistency, Isolation, Durability.', F),
  q('acid-verteilt', '07-konsistenz', 'Warum können verteilte NoSQL-Systeme ACID nicht so einfach garantieren?', ['Dafür sind Protokolle wie Two-Phase Commit oder Paxos nötig, die die Performance stark beeinträchtigen', 'Sie haben keine Transaktionen', 'Sie speichern keine Daten dauerhaft', 'ACID ist nur für Views definiert'], 0,
    'Relationale DBMS mit vertikaler Skalierung sind genau dafür ausgelegt, horizontal verteilte Systeme nicht.', F),
  q('eventual', '07-konsistenz', 'Was bedeutet Eventual Consistency?', ['Daten sind irgendwann konsistent, aber nicht direkt nach einer Änderung', 'Daten sind nie konsistent', 'Daten sind immer sofort konsistent', 'Konsistenz wird nur bei Ausfall geprüft'], 0,
    'Der Abgleich geschieht im Hintergrund. Das erlaubt hohe Erreichbarkeit über mehrere Knoten.', F),
  q('cap-ca', '07-konsistenz', 'Welche CAP-Kombination passt zu einer Bestellabwicklung mit klassischer relationaler Datenbank in einem hochverfügbaren Netz?', ['Konsistenz und Erreichbarkeit (CA)', 'Erreichbarkeit und Ausfalltoleranz (AP)', 'Nur Ausfalltoleranz', 'Keine'], 0,
    'Relationale DBMS bieten Konsistenz in hochverfügbaren Netzen.', F),
  q('cap-ap', '07-konsistenz', 'Welche Systeme stehen in der Vorlesung für Erreichbarkeit und Ausfalltoleranz (AP), bei denen die Konsistenz nachgezogen wird?', ['YouTube und das Domain Name System (DNS)', 'Geldautomaten', 'Bestellabwicklung mit Zahlungsbuchung', 'Einzelplatz-Datenbanken'], 0,
    'Hochverfügbare Strukturen, die Ausfälle kompensieren. Geldautomaten und Banking stehen für CP.', F),
];
