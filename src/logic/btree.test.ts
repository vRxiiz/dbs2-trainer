import { describe, expect, it } from 'vitest';
import { build, format, insert, levels, parseLevels, type BNode } from './btree';

const n = (keys: number[], children: BNode[] = []): BNode => ({ keys, children });

describe('B-Baum einfügen', () => {
  it('Folienbeispiel m=1: 14 einfügen spaltet bis zur Wurzel', () => {
    const start = n([7, 15], [n([3, 5]), n([9, 13]), n([25])]);
    const r = insert(start, 14, 1);
    expect(r.split).toBe(true);
    expect(format(r.root)).toBe('[13]\n[7] [15]\n[3 5] [9] [14] [25]');
  });
  it('Übung 1, m=1 aus leerem Baum', () => {
    expect(levels(build([4, 3, 18, 50, 48], 1))).toEqual([[[4, 48]], [[3], [18], [50]]]);
  });
  it('Übung 1, m=2 aus leerem Baum', () => {
    expect(format(build([10, 50, 34, 36, 30, 16, 20, 38], 2))).toBe('[34]\n[10 16 20 30] [36 38 50]');
  });
  it('Duplikat wird nicht eingefügt', () => {
    const t = build([10, 20], 1);
    const r = insert(t, 20, 1);
    expect(r.duplicate).toBe(true);
    expect(format(r.root)).toBe('[10 20]');
  });
  it('Original bleibt unverändert', () => {
    const start = n([7, 15], [n([3, 5]), n([9, 13]), n([25])]);
    insert(start, 14, 1);
    expect(format(start)).toBe('[7 15]\n[3 5] [9 13] [25]');
  });
});

describe('parseLevels', () => {
  it('liest Ebenen zeilenweise', () => {
    expect(parseLevels('[13]\n[7] [15]\n[3 5] [9] [14] [25]')).toEqual([[[13]], [[7], [15]], [[3, 5], [9], [14], [25]]]);
  });
  it('toleriert Kommas und Leerzeichen', () => {
    expect(parseLevels(' [ 4, 48 ] \n[3][18] [50]\n')).toEqual([[[4, 48]], [[3], [18], [50]]]);
  });
  it('leer oder ungültig → null', () => {
    expect(parseLevels('')).toBeNull();
    expect(parseLevels('[1 2')).toBeNull();
    expect(parseLevels('[a]')).toBeNull();
  });
});
