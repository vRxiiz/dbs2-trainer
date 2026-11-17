// Hotelbuchungen „Spring ins Land“ (Altklausur). Rekonstruiert nach dem Aufgabentext.

export const HOTEL_SCHEMA = `
CREATE TABLE stadt (
  stadt_id NUMBER(4) PRIMARY KEY,
  stadtname VARCHAR2(40) NOT NULL,
  einwohner NUMBER(9)
);
CREATE TABLE hotel (
  hotel_id NUMBER(4) PRIMARY KEY,
  hotelname VARCHAR2(40) NOT NULL,
  stadt_id NUMBER(4) REFERENCES stadt(stadt_id),
  anzahlez NUMBER(4),
  anzahldz NUMBER(4),
  preisez NUMBER(6,2),
  preisdz NUMBER(6,2)
);
CREATE TABLE kunde (
  kunden_id NUMBER(5) PRIMARY KEY,
  vorname VARCHAR2(30),
  nachname VARCHAR2(30)
);
CREATE TABLE buchung (
  buchungs_id NUMBER(6) PRIMARY KEY,
  kunden_id NUMBER(5) REFERENCES kunde(kunden_id),
  hotel_id NUMBER(4) REFERENCES hotel(hotel_id),
  anreise DATE,
  abreise DATE,
  gebuchteez NUMBER(3),
  gebuchtedz NUMBER(3)
);
CREATE TABLE temp_data (
  stadtname VARCHAR2(40),
  anzahl_buchungen NUMBER(6)
);
`;

export const HOTEL_A = `
INSERT INTO stadt VALUES (1, 'Berlin', 3755000);
INSERT INTO stadt VALUES (2, 'Hamburg', 1892000);
INSERT INTO stadt VALUES (3, 'München', 1512000);
INSERT INTO stadt VALUES (4, 'Köln', 1084000);
INSERT INTO hotel VALUES (1, 'Spreeblick', 1, 10, 20, 79, 119);
INSERT INTO hotel VALUES (2, 'Alsterhof', 2, 5, 15, 89, 139);
INSERT INTO hotel VALUES (3, 'Isartor', 3, 8, 12, 99, 149);
INSERT INTO hotel VALUES (4, 'Domblick', 4, 6, 10, 69, 109);
INSERT INTO hotel VALUES (5, 'Kudamm Inn', 1, 4, 8, 59, 89);
INSERT INTO kunde VALUES (1, 'Anna', 'Schneider');
INSERT INTO kunde VALUES (2, 'Ben', 'Müller');
INSERT INTO kunde VALUES (3, 'Clara', 'Fischer');
INSERT INTO kunde VALUES (4, 'David', 'Weber');
INSERT INTO buchung VALUES (1, 1, 1, DATE '2021-03-01', DATE '2021-03-05', 1, 0);
INSERT INTO buchung VALUES (2, 1, 3, DATE '2021-07-10', DATE '2021-07-14', 0, 1);
INSERT INTO buchung VALUES (3, 1, 5, DATE '2022-01-02', DATE '2022-01-04', 1, 0);
INSERT INTO buchung VALUES (4, 2, 2, DATE '2021-05-20', DATE '2021-05-22', 2, 1);
INSERT INTO buchung VALUES (5, 3, 4, DATE '2021-09-01', DATE '2021-09-03', 0, 2);
INSERT INTO buchung VALUES (6, 4, 1, DATE '2022-04-11', DATE '2022-04-13', 1, 1);
INSERT INTO buchung VALUES (7, 2, 3, DATE '2021-12-27', DATE '2022-01-02', 0, 1);
INSERT INTO buchung VALUES (8, 3, 1, DATE '2021-10-15', DATE '2021-10-17', 1, 0);
`;

export const HOTEL_B = `
INSERT INTO stadt VALUES (1, 'Dresden', 556000);
INSERT INTO stadt VALUES (2, 'Leipzig', 616000);
INSERT INTO stadt VALUES (3, 'Bonn', 336000);
INSERT INTO hotel VALUES (1, 'Elbufer', 1, 6, 9, 75, 115);
INSERT INTO hotel VALUES (2, 'Messehotel', 2, 12, 18, 85, 125);
INSERT INTO hotel VALUES (3, 'Rheinaue', 3, 4, 6, 70, 100);
INSERT INTO kunde VALUES (1, 'Erik', 'Hahn');
INSERT INTO kunde VALUES (2, 'Anna', 'Schneider');
INSERT INTO kunde VALUES (3, 'Fatma', 'Yilmaz');
INSERT INTO buchung VALUES (1, 2, 2, DATE '2021-02-14', DATE '2021-02-16', 1, 0);
INSERT INTO buchung VALUES (2, 2, 2, DATE '2022-06-01', DATE '2022-06-03', 0, 1);
INSERT INTO buchung VALUES (3, 1, 1, DATE '2021-08-08', DATE '2021-08-12', 0, 1);
INSERT INTO buchung VALUES (4, 3, 3, DATE '2021-11-11', DATE '2021-11-12', 2, 0);
INSERT INTO buchung VALUES (5, 2, 3, DATE '2023-03-03', DATE '2023-03-06', 1, 0);
`;

export const HOTEL_RELATIONS = [
  'STADT (STADT_ID, STADTNAME, EINWOHNER)',
  'HOTEL (HOTEL_ID, HOTELNAME, STADT_ID <fk>, ANZAHLEZ, ANZAHLDZ, PREISEZ, PREISDZ)',
  'KUNDE (KUNDEN_ID, VORNAME, NACHNAME)',
  'BUCHUNG (BUCHUNGS_ID, KUNDEN_ID <fk>, HOTEL_ID <fk>, ANREISE, ABREISE, GEBUCHTEEZ, GEBUCHTEDZ)',
  'TEMP_DATA (STADTNAME, ANZAHL_BUCHUNGEN)',
];
