// Kapitel 6: Kopplungstechniken Datenbank und Applikation
import { q } from './q';

const F = 'Folien Kopplungstechniken';

export const k06 = [
  q('direkt-zugriff', '06-schnittstellen', 'Wer sollte laut Vorlesung direkten Zugriff auf alle Daten der Datenbank haben?', ['Nur Datenbankadministratoren', 'Alle Apps', 'Alle Benutzerinnen und Benutzer', 'Niemand, auch keine Admins'], 0,
    'Apps und Nutzer greifen indirekt über Host-Sprachen und Views zu, sonst drohen ungewollte Änderungen und unerlaubtes Auslesen.', F),
  q('cli', '06-schnittstellen', 'Was ist SQL/CLI?', ['Eine prozedurale Datenbankschnittstelle (Call Level Interface) nach X/Open- bzw. ISO-Standard', 'Ein grafisches Werkzeug wie SQL Developer', 'Ein NoSQL-System', 'Eine Kompressionstechnik'], 0,
    'Hersteller implementieren den Standard mit eigenen CLIs, z. B. Oracle CI.', F),
  q('odbc-eigenschaften', '06-schnittstellen', 'Welche Eigenschaften haben ODBC und JDBC?', ['Dynamischer Zugriff auf beliebige Datenquellen', 'Datenbanksystem-unabhängige Programmierung bei Einhaltung des SQL-Standards', 'Sehr weite Verbreitung', 'Sie funktionieren nur mit Oracle'], [0, 1, 2],
    'ODBC/JDBC sind DBMS-unabhängige APIs. Der jeweilige Treiber kommt vom Hersteller.', F),
  q('driver-manager', '06-schnittstellen', 'Welche Aufgabe hat der Driver Manager bei ODBC/JDBC?', ['Er nimmt die Anfragen der Anwendung an und leitet sie an den zuständigen Treiber weiter', 'Er speichert die Daten', 'Er komprimiert Spalten', 'Er ersetzt den Datenbankserver'], 0,
    'Der Treiber übernimmt dann die Kommunikation mit dem jeweiligen DBMS.', F),
  q('resultset', '06-schnittstellen', 'Welchem PL/SQL-Konzept entspricht das JDBC-ResultSet?', ['Dem Cursor', 'Dem Trigger', 'Der Materialized View', 'Dem Package'], 0,
    'Das ResultSet stellt die Ergebnisrelation dar und wird wie ein Cursor Zeile für Zeile durchlaufen (rs.next()).', F),
  q('jdbc-schritte', '06-schnittstellen', 'In welcher Reihenfolge läuft ein JDBC-Zugriff ab?', ['Treiber laden, Verbindung herstellen, Statement ausführen, ResultSet verarbeiten', 'ResultSet verarbeiten, Treiber laden, Verbindung herstellen', 'Statement ausführen, Treiber laden, Verbindung herstellen', 'Verbindung herstellen, ResultSet verarbeiten, Treiber laden'], 0,
    'Class.forName(…), DriverManager.getConnection(…), createStatement/executeQuery, while (rs.next()) …', F),
  q('pandas', '06-schnittstellen', 'Was ist der Vorteil von pandas.read_sql gegenüber einem eigenen Cursor in Python?', ['Das Ergebnis landet direkt in einem DataFrame, den Cursor verwaltet die Bibliothek', 'Es braucht keine Datenbankverbindung', 'Es verhindert jede SQL-Injection automatisch', 'Es ist nur mit MongoDB nutzbar'], 0,
    'Im Hintergrund arbeitet ein Cursor, den man nicht selbst erstellen, durchlaufen oder schließen muss.', F),

  q('injection-def', '06-injection', 'Was ist eine SQL-Injection?', ['Das Einschleusen von Datenbankbefehlen über Eingaben, die ungeprüft in eine SQL-Anweisung eingebaut werden', 'Ein Trigger, der SQL ausführt', 'Ein Index auf einer Textspalte', 'Eine Kompressionstechnik'], 0,
    'Ursache ist ein Programmierfehler: Zeichenfolgeninterpolation bzw. String-Konkatenation mit Benutzereingaben.', F),
  q('injection-beispiel', '06-injection', "Was bewirkt die Eingabe abc' OR '1' = '1 als Benutzername und Passwort bei String-Konkatenation?", ['Die WHERE-Bedingung wird immer wahr, man ist ohne gültiges Passwort angemeldet', 'Es gibt einen Syntaxfehler und nichts passiert', 'Der Benutzer abc wird angelegt', 'Die Tabelle account wird gelöscht'], 0,
    "Die Abfrage wird zu … WHERE username = 'abc' OR '1' = '1' AND password = 'abc' OR '1' = '1' und liefert alle Zeilen.", F),
  q('injection-folgen', '06-injection', 'Was können Angreifer mit einer SQL-Injection erreichen?', ['Unberechtigt Daten auslesen', 'Daten ändern oder löschen', 'Unter Umständen den Datenbankserver übernehmen', 'Den Index automatisch optimieren'], [0, 1, 2],
    'Voraussetzung ist ein Eingabefeld, dessen Inhalt ungeprüft in die Abfrage übernommen wird.', F),
  q('prepared', '06-injection', 'Wie verhindert man SQL-Injection in Java?', ['PreparedStatement mit Platzhaltern ? und setString(…)', 'Statement mit String-Konkatenation', 'Längere Passwörter', 'Eine Materialized View'], 0,
    'Statt Werten werden Platzhalter übergeben, das DBMS prüft die Parameter, bevor sie verarbeitet werden.', F),
  q('bind-python', '06-injection', 'Wie heißt das Gegenstück zu PreparedStatements in Python (python-oracledb)?', ['Bind Variables', 'f-Strings', 'DataFrames', 'Decorators'], 0,
    'Bind Variables funktionieren nach demselben Prinzip: Platzhalter statt Zeichenfolgeninterpolation.', F),
  q('prepared-performance', '06-injection', 'Warum verbessern Prepared Statements auch die Performance?', ['Die Anweisung liegt nach dem ersten Ausführen vorübersetzt vor und wird nur mit neuen Parametern ausgeführt', 'Sie umgehen den Optimierer', 'Sie speichern das Ergebnis dauerhaft', 'Sie legen automatisch Indexe an'], 0,
    'Bei wiederholter Ausführung (z. B. in einer Schleife) entfällt das erneute Übersetzen.', F),
  q('prepared-dml', '06-injection', 'Kann man Prepared Statements auch für INSERT, UPDATE und DELETE verwenden?', ['Ja, mit derselben Syntax, ausgeführt mit executeUpdate()', 'Nein, nur für SELECT', 'Nur für DELETE', 'Nur in PL/SQL'], 0,
    'Beispiel: insert into Produkt values (?, ?, ?) mit setString und executeUpdate.', F),

  q('host-views', '06-views-orm', 'Warum sollen Host-Sprachen laut Vorlesung auf Views statt direkt auf Tabellen zugreifen?', ['Der Code in der Host-Sprache wird schlanker', 'Die Logik bleibt zentral in der View', 'Schemaänderungen erfordern nur eine Anpassung der View', 'Views sind immer schneller als Tabellen'], [0, 1, 2],
    'Vereinfachung, Code-Zentralität und logische Datenunabhängigkeit. Schneller ist eine normale View nicht automatisch.', F),
  q('orm-def', '06-views-orm', 'Was macht ein Object-Relational Mapper (ORM)?', ['Er bildet Objekte der Programmiersprache auf Tabellen einer relationalen Datenbank ab', 'Er wandelt Tabellen in JSON-Dokumente einer NoSQL-Datenbank um', 'Er komprimiert Spalten', 'Er ersetzt den JDBC-Treiber durch ODBC'], 0,
    'Man arbeitet mit Objekten in Java, Kotlin oder Python, das ORM erzeugt im Hintergrund Tabellen und SQL.', F),
  q('orm-ziel', '06-views-orm', 'Welches Ziel verfolgt ein ORM?', ['Den Impedance Mismatch zwischen objektorientiertem Code und relationalem Modell verringern', 'Trigger überflüssig machen', 'Die Datenbank horizontal skalieren', 'SQL-Injection erzwingen'], 0,
    'Der gleiche Mismatch, den in PL/SQL der Cursor überbrückt.', F),
  q('orm-vorteile', '06-views-orm', 'Welche Vorteile von OR-Mappern nennt die Vorlesung?', ['Kein explizites Schreiben von SQL nötig', 'Automatische Umwandlung zwischen Objekten und Tabellen', 'Transaktionsmanagement, Validierung und Caching in der Host-Sprache', 'Garantiert optimale SQL-Abfragen'], [0, 1, 2],
    'Nachteil: Man verliert Kontrolle über das erzeugte SQL, und Performance-Probleme sind schwerer zu finden.', F),
  q('orm-nachteil', '06-views-orm', 'Was ist ein typischer Nachteil eines ORM?', ['Das automatisch erzeugte SQL ist schwer zu kontrollieren und kann ineffizient sein', 'Man muss jede Abfrage von Hand schreiben', 'Es funktioniert nur ohne Datenbank', 'Es verhindert Transaktionen'], 0,
    'Wer kein SQL schreibt, sieht nicht direkt, welche Abfragen tatsächlich laufen.', F),
  q('kopplung-cursor', '06-views-orm', 'Wo steht der Cursor eines JDBC-ResultSets direkt nach executeQuery()?', ['Vor der ersten Zeile, erst rs.next() springt auf die erste Zeile', 'Auf der ersten Zeile', 'Auf der letzten Zeile', 'Er ist noch nicht vorhanden'], 0,
    'Deshalb die typische Schleife while (rs.next()) { … }.', F),
];
