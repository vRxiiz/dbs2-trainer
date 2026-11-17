import { describe, expect, it } from 'vitest';
import { bitVector, dictionary, differential, frameOfReference, gradeAnswer, recommend, runLength, toSeconds } from './compression';

// Übung „Column Stores“, Aufgabe Komprimierung: fünf Datengruppen (Spalten)
const zeit = ['10:00:23', '10:00:24', '10:00:24', '10:00:25', '10:00:26', '10:00:36', '10:00:37', '10:00:39', '10:00:39', '10:00:45', '10:00:46', '10:00:48', '10:00:50', '10:00:50'];
const jahr = ['2020', '2018', '2020', '2022', '2022', '2020', '2023', '2018', '2023', '2020', '2022', '2022', '2020', '2018'];
const zahl = ['121', '117', '119', '118', '111', '110', '114', '113', '125', '122', '128', '124', '126', '123'];
const quartal = ['Q1', 'Q1', 'Q1', 'Q1', 'Q1', 'Q2', 'Q2', 'Q2', 'Q3', 'Q3', 'Q3', 'Q3', 'Q3', 'Q3'];
const geschlecht = ['f', 'f', 'm', 'f', 'm', 'f', 'd', 'd', 'f', 'm', 'm', 'm', 'd', 'f'];

describe('Empfehlung nach dem Entscheidungsbaum', () => {
  it('ordnet die fünf Datengruppen der Übung zu', () => {
    expect(recommend(zeit)).toBe('differenz');
    expect(recommend(quartal)).toBe('lauflaenge');
    expect(recommend(geschlecht)).toBe('bitvektor');
    expect(recommend(zahl)).toBe('for');
    expect(recommend(jahr)).toBe('dictionary');
  });
});

describe('Verfahren', () => {
  it('Lauflänge: (Wert, Start ab 1, Länge)', () => {
    expect(runLength(quartal)).toEqual([['Q1', 1, 5], ['Q2', 6, 3], ['Q3', 9, 6]]);
  });
  it('Bit-Vektor: eine Bit-Spalte je Wert', () => {
    expect(bitVector(geschlecht)).toEqual([
      { value: 'f', bits: '11010100100001' },
      { value: 'm', bits: '00101000011100' },
      { value: 'd', bits: '00000011000010' },
    ]);
  });
  it('Dictionary: Schlüssel ab 0 in Reihenfolge des ersten Vorkommens', () => {
    const d = dictionary(jahr);
    expect(d.dict).toEqual([[0, '2020'], [1, '2018'], [2, '2022'], [3, '2023']]);
    expect(d.codes).toEqual([0, 1, 0, 2, 2, 0, 3, 1, 3, 0, 2, 2, 0, 1]);
  });
  it('Frame of Reference: Differenz zum Referenzwert', () => {
    expect(frameOfReference([121, 117, 119], 119)).toEqual([2, -2, 0]);
  });
  it('Differenz: zum Vorgänger, Zeitstempel in Sekunden', () => {
    expect(differential(zeit.slice(0, 6).map(toSeconds))).toEqual({ start: toSeconds('10:00:23'), diffs: [1, 0, 1, 1, 10] });
  });
});

describe('gradeAnswer', () => {
  it('Lauflänge mit Klammern und Leerzeichen', () => {
    expect(gradeAnswer('lauflaenge', quartal, '(Q1, 1, 5) (Q2,6,3)\n(Q3,9,6)')).toBe(true);
    expect(gradeAnswer('lauflaenge', quartal, '(Q1,0,5) (Q2,5,3) (Q3,8,6)')).toBe(false);
  });
  it('Bit-Vektor zeilenweise', () => {
    expect(gradeAnswer('bitvektor', geschlecht, 'f: 11010100100001\nm: 00101000011100\nd: 00000011000010')).toBe(true);
  });
  it('Dictionary mit Wörterbuch und Codes', () => {
    expect(gradeAnswer('dictionary', jahr, '0=2020, 1=2018, 2=2022, 3=2023', '0 1 0 2 2 0 3 1 3 0 2 2 0 1')).toBe(true);
    expect(gradeAnswer('dictionary', jahr, '1=2020, 2=2018, 3=2022, 4=2023', '1 2 1 3 3 1 4 2 4 1 3 3 1 2')).toBe(false);
  });
  it('FOR und Differenz als Zahlenliste', () => {
    expect(gradeAnswer('for', ['121', '117', '119'], '2, -2, 0', '119')).toBe(true);
    expect(gradeAnswer('differenz', ['10:00:23', '10:00:24', '10:00:26'], '1 2')).toBe(true);
  });
  it('leere Eingabe ist falsch', () => {
    expect(gradeAnswer('lauflaenge', quartal, '')).toBe(false);
    expect(gradeAnswer('for', zahl, '', '119')).toBe(false);
  });
});
