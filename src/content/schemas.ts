// Relationenschemata der Uebungsdatenbanken, als Text zum Nachschlagen neben den Code-Aufgaben.
// Rekonstruiert aus Aufgabentexten und Vorlesungsbeispielen: Die Original-Skripte liegen in ILU
// (Vorlesungsunterlagen/00_SQL-Skripte). Vor dem Loesen im SQL Developer mit DESC pruefen.

import type { CodeTask } from './codeTypes';

export interface SchemaInfo {
  name: string;
  /** eine Zeile je Tabelle; unterstrichene Schluessel als PK, Pfeil als Fremdschluessel */
  tables: string[];
  note?: string;
}

export const RECONSTRUCTED_NOTE = 'Rekonstruiert, Spalten im SQL Developer mit DESC prüfen.';

export const schemas: Record<CodeTask['scenario'], SchemaInfo | null> = {
  coworkers: {
    name: 'Coworkers/Projects',
    tables: [
      'COWORKERS(ID PK, NAME, AGE, ADDRESS, SALARY, HIRING_DATE)',
      'PROJECTS(ID PK, NAME, DURATION, TOPIC, LEADER → COWORKERS.ID)',
    ],
  },
  lizenz: {
    name: 'LicManagement (Softwarelizenzen)',
    tables: [
      'LIZENZ(LIZENZ_ID PK, BEZEICHNUNG, GUELTIG_VON, GUELTIG_BIS, ERSETZT_DURCH → LIZENZ.LIZENZ_ID)',
      'BENUTZERLIZENZ(LIZENZ_ID PK → LIZENZ, ANZAHL_BENUTZER)',
      'COMPUTERLIZENZ(LIZENZ_ID PK → LIZENZ, ANZAHL_COMPUTER)',
      'LIZENZSERVER(LIZENZSERVER_ID PK, BEZEICHNUNG)',
      'INSTALLIERT_AUF(LIZENZ_ID → COMPUTERLIZENZ, LIZENZSERVER_ID → LIZENZSERVER; PK beide)',
    ],
  },
  honig: {
    name: 'Honigernten',
    tables: [
      'BIENENVOLK(VOLK_ID PK, BIENENART)',
      'HONIGTYP(HONIGTYP_ID PK, BEZEICHNUNG, GESCHMACK)',
      'ABPACKUNG(ABPACKUNG_ID PK, BEZEICHNUNG, ART, PREIS)',
      'HONIGERNTE(ERNTE_ID PK, MENGE, ERNTEDATUM, HONIGTYP_ID → HONIGTYP, ABPACKUNG_ID → ABPACKUNG)',
      'GESAMMELT(VOLK_ID → BIENENVOLK, ERNTE_ID → HONIGERNTE; PK beide)',
    ],
  },
  hotel: {
    name: 'Hotelbuchungen „Spring ins Land“ (Altklausur)',
    tables: [
      'STADT(STADT_ID PK, STADTNAME, EINWOHNER)',
      'HOTEL(HOTEL_ID PK, HOTELNAME, STADT_ID → STADT, ANZAHLEZ, ANZAHLDZ, PREISEZ, PREISDZ)',
      'KUNDE(KUNDEN_ID PK, VORNAME, NACHNAME)',
      'BUCHUNG(BUCHUNGS_ID PK, KUNDEN_ID → KUNDE, HOTEL_ID → HOTEL, ANREISE, ABREISE, GEBUCHTEEZ, GEBUCHTEDZ)',
      'TEMP_DATA(STADTNAME, ANZAHL_BUCHUNGEN)',
    ],
    note: 'Gegeben: fun_gebuchteEZ(hotel_id, von DATE, bis DATE) und fun_gebuchteDZ(…) liefern die Anzahl bereits gebuchter Zimmer im Zeitraum.',
  },
  imdb: {
    name: 'IMDB (StudiDB, Schema imdb)',
    tables: ['IMDB_MOVIE(ID PK, TITLE, YEAR, RANK, …)', 'weitere Tabellen imdb_*: mit SELECT table_name FROM all_tables WHERE owner = \'IMDB\' ansehen'],
  },
  members: {
    name: 'Mitglieder',
    tables: ['MEMBERS(MEMBER_ID PK, FIRST_NAME, LAST_NAME, GENDER, DOB, EMAIL UNIQUE)'],
  },
  chat: {
    name: 'Chats (Übung 1)',
    tables: ['CHAT(CHAT_ID PK, THEMA, ERSTELLER)'],
  },
  keins: null,
};
