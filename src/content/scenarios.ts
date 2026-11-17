// Fall-Datenbanken der DBS2-Uebungen. Jedes Szenario hat einen sichtbaren Datenbestand A
// und einen verdeckten Datenbestand B mit gleicher Struktur, aber anderen Werten:
// Wer Werte fest eintraegt statt Bedingungen zu formulieren, faellt auf.

import { COWORKERS_A, COWORKERS_B, COWORKERS_RELATIONS, COWORKERS_SCHEMA } from './scenarios/coworkers';
import { HONIG_A, HONIG_B, HONIG_RELATIONS, HONIG_SCHEMA } from './scenarios/honig';
import { HOTEL_A, HOTEL_B, HOTEL_RELATIONS, HOTEL_SCHEMA } from './scenarios/hotel';

export { LEVEL_NAME } from './chapters';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  /** Bezug auf die Vorlesung */
  origin: string;
  schema: string;
  dataA: string;
  dataB: string;
  /** Tabellen in sinnvoller Reihenfolge (Eltern vor Kindern) */
  tables: string[];
  /** Relationenschema in Vorlesungsnotation */
  relations: string[];
}

export const scenarios: Scenario[] = [
  {
    id: 'coworkers',
    name: 'Coworkers/Projects',
    description: 'Mitarbeitende mit Alter, Adresse, Gehalt und Einstellungsdatum, Projekte mit Projektleitung.',
    origin: 'Übungen PL/SQL, Trigger und Views (rekonstruiert, Original in ILU)',
    schema: COWORKERS_SCHEMA,
    dataA: COWORKERS_A,
    dataB: COWORKERS_B,
    tables: ['coworkers', 'projects'],
    relations: COWORKERS_RELATIONS,
  },
  {
    id: 'honig',
    name: 'Honigernten',
    description: 'Bienenvölker sammeln Honigernten, jede Ernte hat einen Honigtyp und eine Abpackung.',
    origin: 'Übung Views (rekonstruiert, Original in ILU)',
    schema: HONIG_SCHEMA,
    dataA: HONIG_A,
    dataB: HONIG_B,
    tables: ['bienenvolk', 'honigtyp', 'abpackung', 'honigernte', 'gesammelt'],
    relations: HONIG_RELATIONS,
  },
  {
    id: 'hotel',
    name: 'Hotelbuchungen',
    description: 'Reiseunternehmen „Spring ins Land“: Kunden buchen Einzel- und Doppelzimmer in Hotels verschiedener Städte.',
    origin: 'Altklausur DBS2 (rekonstruiert)',
    schema: HOTEL_SCHEMA,
    dataA: HOTEL_A,
    dataB: HOTEL_B,
    tables: ['stadt', 'hotel', 'kunde', 'buchung', 'temp_data'],
    relations: HOTEL_RELATIONS,
  },
];

export const scenarioById = (id = 'coworkers'): Scenario => scenarios.find((s) => s.id === id) ?? scenarios[0];
