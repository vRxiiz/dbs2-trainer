// Coworkers/Projects (Uebungen PL/SQL, Trigger, Views). Rekonstruiert nach den Aufgabentexten:
// Das Original-Skript liegt in ILU unter Vorlesungsunterlagen/00_SQL-Skripte.

export const COWORKERS_SCHEMA = `
CREATE TABLE coworkers (
  id NUMBER(4) PRIMARY KEY,
  name VARCHAR2(30) NOT NULL,
  age NUMBER(3),
  address VARCHAR2(40),
  salary NUMBER(8,2),
  hiring_date DATE
);
CREATE TABLE projects (
  id NUMBER(4) PRIMARY KEY,
  name VARCHAR2(40) NOT NULL,
  duration NUMBER(3),
  topic VARCHAR2(30),
  leader NUMBER(4) REFERENCES coworkers(id)
);
`;

export const COWORKERS_A = `
INSERT INTO coworkers VALUES (1, 'Ramesh', 32, 'Ahmedabad', 2000, DATE '2018-03-01');
INSERT INTO coworkers VALUES (2, 'Khilan', 25, 'Delhi', 1500, DATE '2021-07-15');
INSERT INTO coworkers VALUES (3, 'Kaushik', 23, 'Kota', 2000, DATE '2023-01-10');
INSERT INTO coworkers VALUES (4, 'Chaitali', 25, 'Mumbai', 6500, DATE '2019-11-01');
INSERT INTO coworkers VALUES (5, 'Hardik', 27, 'Bhopal', 8500, DATE '2017-05-20');
INSERT INTO coworkers VALUES (6, 'Komal', 22, 'MP', 4500, DATE '2024-02-01');
INSERT INTO coworkers VALUES (7, 'Muffy', 24, 'Indore', 10000, DATE '2020-09-30');
INSERT INTO projects VALUES (1, 'Webshop', 12, 'E-Commerce', 4);
INSERT INTO projects VALUES (2, 'Datenmigration', 6, 'Datenbanken', 5);
INSERT INTO projects VALUES (3, 'Data Warehouse', 18, 'Datenbanken', 1);
INSERT INTO projects VALUES (4, 'App-Relaunch', 9, 'Mobile', 7);
INSERT INTO projects VALUES (5, 'Shop-Analytics', 4, 'E-Commerce', 5);
`;

export const COWORKERS_B = `
INSERT INTO coworkers VALUES (1, 'Lena', 41, 'Köln', 5200, DATE '2012-04-01');
INSERT INTO coworkers VALUES (2, 'Jonas', 29, 'Bonn', 3100, DATE '2022-08-15');
INSERT INTO coworkers VALUES (3, 'Aylin', 35, 'Gummersbach', 4700, DATE '2016-02-01');
INSERT INTO coworkers VALUES (4, 'Marek', 23, 'Köln', 2400, DATE '2024-10-01');
INSERT INTO coworkers VALUES (5, 'Sofia', 52, 'Aachen', 7800, DATE '2005-06-01');
INSERT INTO coworkers VALUES (6, 'Tim', 31, 'Bonn', 3900, DATE '2019-03-15');
INSERT INTO projects VALUES (1, 'CRM-Einführung', 10, 'Vertrieb', 3);
INSERT INTO projects VALUES (2, 'Cloud-Umzug', 14, 'Infrastruktur', 5);
INSERT INTO projects VALUES (3, 'Reporting', 5, 'Datenbanken', 1);
INSERT INTO projects VALUES (4, 'Lead-Scoring', 7, 'Vertrieb', 6);
`;

export const COWORKERS_RELATIONS = [
  'COWORKERS (ID, NAME, AGE, ADDRESS, SALARY, HIRING_DATE)',
  'PROJECTS (ID, NAME, DURATION, TOPIC, LEADER <fk COWORKERS>)',
];
