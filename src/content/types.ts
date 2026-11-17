// Gemeinsame Typen fuer Tabellenansichten.

export interface Table {
  columns: string[];
  rows: string[][];
  /** Primaerschluessel-Spalten (werden unterstrichen dargestellt) */
  pk: string[];
}
