import { describe, expect, it } from 'vitest';
import { bitmapIndex, checkBitmapSql, gradeBitmap } from './bitmap';

describe('bitmapIndex', () => {
  it('Folienbeispiel Wohnort', () => {
    const r = Object.fromEntries(bitmapIndex(['Dortmund', 'Berlin', 'Köln', 'Berlin']).map((b) => [b.value, b.bits]));
    expect(r).toEqual({ Dortmund: '1000', Berlin: '0101', Köln: '0010' });
  });
  it('Übung 1, Spalte Thema, in Reihenfolge des ersten Vorkommens', () => {
    expect(bitmapIndex(['Alles', 'Videospiele', 'Lernen', 'Videospiele'])).toEqual([
      { value: 'Alles', bits: '1000' },
      { value: 'Videospiele', bits: '0101' },
      { value: 'Lernen', bits: '0010' },
    ]);
  });
});

describe('gradeBitmap', () => {
  const v = ['Dortmund', 'Berlin', 'Köln', 'Berlin'];
  it('leere Eingabe ist falsch', () => {
    expect(gradeBitmap(v, {}).ok).toBe(false);
  });
  it('Leerzeichen in den Bits sind egal', () => {
    expect(gradeBitmap(v, { Dortmund: '1 0 0 0', Berlin: '0101', Köln: '0010 ' }).ok).toBe(true);
  });
  it('meldet falsche Zeile', () => {
    const r = gradeBitmap(v, { Dortmund: '1000', Berlin: '0110', Köln: '0010' });
    expect(r.ok).toBe(false);
    expect(r.wrong).toEqual(['Berlin']);
  });
});

describe('checkBitmapSql', () => {
  it('erkennt CREATE BITMAP INDEX auf Tabelle und Spalte', () => {
    expect(checkBitmapSql('create bitmap index idx_thema on chat(thema);', 'chat', 'thema')).toBe(true);
    expect(checkBitmapSql('CREATE INDEX idx ON chat(thema);', 'chat', 'thema')).toBe(false);
    expect(checkBitmapSql('CREATE BITMAP INDEX i ON chat (ersteller);', 'chat', 'thema')).toBe(false);
  });
});
