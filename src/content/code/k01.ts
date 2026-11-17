// Kapitel 1 – Indexe in SQL (Folien „Speicherstrukturen“, Beispiel MEMBERS)
import type { CodeTask } from '../codeTypes';

const r = String.raw;

export const k01: CodeTask[] = [
  {
    id: 'members-indexe',
    topicId: '01-sql-index',
    title: 'Indexe für die Mitgliedertabelle',
    level: 1,
    scenario: 'members',
    task:
      'Lege drei Indexe auf MEMBERS an: einen zusammengesetzten Index members_name_i auf (last_name, first_name), einen eindeutigen Index members_email_i auf email und einen Bitmap-Index members_gender_i auf gender.',
    hints: [
      'Syntax: CREATE [UNIQUE | BITMAP] INDEX name ON tabelle (spalte, …);',
      'Ein Bitmap-Index lohnt sich bei Spalten mit wenigen verschiedenen Werten wie gender.',
    ],
    solution: `CREATE INDEX members_name_i ON members (last_name, first_name);
CREATE UNIQUE INDEX members_email_i ON members (email);
CREATE BITMAP INDEX members_gender_i ON members (gender);`,
    checks: [
      {
        label: 'Zusammengesetzter Index auf (last_name, first_name)',
        hint: 'Ein Index kann mehrere Spalten haben: ON members (last_name, first_name).',
        all: [r`CREATE INDEX MEMBERS_NAME_I ON MEMBERS ?\( ?LAST_NAME ?, ?FIRST_NAME ?\)`],
      },
      {
        label: 'Eindeutiger Index auf email',
        hint: 'Eindeutigkeit erzwingt CREATE UNIQUE INDEX.',
        all: [r`CREATE UNIQUE INDEX MEMBERS_EMAIL_I ON MEMBERS ?\( ?EMAIL ?\)`],
      },
      {
        label: 'Bitmap-Index auf gender',
        hint: 'Für wenige verschiedene Werte: CREATE BITMAP INDEX.',
        all: [r`CREATE BITMAP INDEX MEMBERS_GENDER_I ON MEMBERS ?\( ?GENDER ?\)`],
      },
    ],
    wrong: [
      `CREATE INDEX members_name_i ON members (last_name);
CREATE UNIQUE INDEX members_email_i ON members (email);
CREATE BITMAP INDEX members_gender_i ON members (gender);`,
      `CREATE INDEX members_name_i ON members (last_name, first_name);
CREATE INDEX members_email_i ON members (email);
CREATE INDEX members_gender_i ON members (gender);`,
    ],
    source: 'Folien Kapitel 1, SQL-Befehle für Indexe (MEMBERS)',
  },
  {
    id: 'index-verwalten',
    topicId: '01-sql-index',
    title: 'Index umbenennen und löschen',
    level: 1,
    scenario: 'members',
    task:
      'Lege einen Index members_dob_i auf die Spalte dob an, benenne ihn danach in members_geburt_i um und lösche ihn zum Schluss wieder.',
    hints: ['Umbenennen: ALTER INDEX alt RENAME TO neu;', 'Löschen: DROP INDEX name;'],
    solution: `CREATE INDEX members_dob_i ON members (dob);
ALTER INDEX members_dob_i RENAME TO members_geburt_i;
DROP INDEX members_geburt_i;`,
    checks: [
      { label: 'Index auf dob angelegt', hint: 'CREATE INDEX members_dob_i ON members (dob);', all: [r`CREATE INDEX MEMBERS_DOB_I ON MEMBERS ?\( ?DOB ?\)`] },
      { label: 'Umbenannt mit ALTER INDEX … RENAME TO', hint: 'ALTER INDEX members_dob_i RENAME TO members_geburt_i;', all: [r`ALTER INDEX MEMBERS_DOB_I RENAME TO MEMBERS_GEBURT_I`] },
      { label: 'Gelöscht unter dem neuen Namen', hint: 'Nach dem Umbenennen gilt nur noch der neue Name.', all: [r`DROP INDEX MEMBERS_GEBURT_I`] },
    ],
    wrong: [
      `CREATE INDEX members_dob_i ON members (dob);
ALTER INDEX members_dob_i RENAME TO members_geburt_i;
DROP INDEX members_dob_i;`,
    ],
    source: 'Folien Kapitel 1, SQL-Befehle für Indexe',
  },
  {
    id: 'index-funktion',
    topicId: '01-sql-index',
    title: 'Index für die Suche nach Nachnamen',
    level: 2,
    scenario: 'members',
    task:
      'Die Anwendung sucht Mitglieder mit WHERE UPPER(last_name) = :name. Lege einen Index members_upper_i an, den Oracle für diese Bedingung nutzen kann, und schreibe die Abfrage, die alle Spalten der Mitglieder mit dem Nachnamen \'MEYER\' liefert.',
    hints: [
      'Ein normaler Index auf last_name hilft nicht, wenn in der Bedingung eine Funktion auf der Spalte steht.',
      'Funktionsbasierter Index: CREATE INDEX … ON members (UPPER(last_name));',
    ],
    solution: `CREATE INDEX members_upper_i ON members (UPPER(last_name));
SELECT * FROM members WHERE UPPER(last_name) = 'MEYER';`,
    checks: [
      { label: 'Funktionsbasierter Index auf UPPER(last_name)', hint: 'Der Index muss denselben Ausdruck enthalten wie die Bedingung.', all: [r`CREATE INDEX MEMBERS_UPPER_I ON MEMBERS ?\( ?UPPER ?\( ?LAST_NAME ?\) ?\)`] },
      { label: 'Abfrage mit derselben Bedingung', hint: "WHERE UPPER(last_name) = 'MEYER'", all: [r`SELECT .+ FROM MEMBERS WHERE UPPER ?\( ?LAST_NAME ?\) ?= ?'…'`] },
    ],
    wrong: [
      `CREATE INDEX members_upper_i ON members (last_name);
SELECT * FROM members WHERE UPPER(last_name) = 'MEYER';`,
    ],
    source: 'Folien Kapitel 1, Indexe in Oracle (Ergänzung)',
  },
];
