// Leichtgewichtige Komprimierung im Column Store (Folien Kap. 5, Abadi/Boncz/Harizopoulos 2009).

export type Verfahren = 'lauflaenge' | 'bitvektor' | 'dictionary' | 'for' | 'differenz';

export const VERFAHREN_NAME: Record<Verfahren, string> = {
  lauflaenge: 'Lauflängenkodierung',
  bitvektor: 'Bit-Vektor-Kodierung',
  dictionary: 'Dictionary-Kodierung',
  for: 'Frame-of-Reference-Kodierung',
  differenz: 'Differenzkodierung',
};

/** (Wert, Startposition ab 1, Laenge) */
export function runLength(v: string[]): [string, number, number][] {
  const out: [string, number, number][] = [];
  v.forEach((x, i) => {
    const last = out[out.length - 1];
    if (last && last[0] === x) last[2]++;
    else out.push([x, i + 1, 1]);
  });
  return out;
}

/** Eine Bit-Spalte je Wert (Reihenfolge des ersten Vorkommens) */
export function bitVector(v: string[]): { value: string; bits: string }[] {
  return [...new Set(v)].map((d) => ({ value: d, bits: v.map((x) => (x === d ? '1' : '0')).join('') }));
}

/** Schluessel ab 0 in Reihenfolge des ersten Vorkommens */
export function dictionary(v: string[]): { dict: [number, string][]; codes: number[] } {
  const distinct = [...new Set(v)];
  return { dict: distinct.map((d, i) => [i, d]), codes: v.map((x) => distinct.indexOf(x)) };
}

/** Differenz jedes Werts zum Referenzwert */
export const frameOfReference = (v: number[], ref: number) => v.map((x) => x - ref);

/** Erster Wert unkomprimiert, danach Differenz zum Vorgaenger */
export function differential(v: number[]): { start: number; diffs: number[] } {
  return { start: v[0], diffs: v.slice(1).map((x, i) => x - v[i]) };
}

/** "hh:mm:ss" in Sekunden; Zahlen bleiben Zahlen */
export function toSeconds(s: string): number {
  const p = s.split(':').map(Number);
  return p.reduce((acc, x) => acc * 60 + x, 0);
}

const isNumeric = (v: string[]) => v.every((x) => /^-?\d+(\.\d+)?$/.test(x));
const isTime = (v: string[]) => v.every((x) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(x));
const numbers = (v: string[]) => (isTime(v) ? v.map(toSeconds) : v.map(Number));

/** Gerundeter Durchschnitt als Referenzwert (Folie: „z. B. Durchschnitt der Werte“) */
export const referenceValue = (v: string[]) => Math.round(numbers(v).reduce((a, b) => a + b, 0) / v.length);

/**
 * Entscheidungsbaum (Folie 19), vereinfacht fuer kleine Spalten:
 * sortiert → mittlere Lauflaenge > 2 ? Lauflaenge : Differenz;
 * unsortiert → hoechstens 3 Werte: Bit-Vektor (typische Selektionsspalte),
 * Zahlen mit ueberwiegend eindeutigen, eng beieinander liegenden Werten: Frame of Reference,
 * sonst Dictionary.
 */
export function recommend(v: string[]): Verfahren {
  const comparable = isNumeric(v) || isTime(v);
  const vals = comparable ? numbers(v) : v;
  const sorted = vals.every((x, i) => i === 0 || vals[i - 1] <= x);
  if (sorted) return v.length / runLength(v).length > 2 ? 'lauflaenge' : 'differenz';
  const distinct = new Set(v).size;
  if (distinct <= 3) return 'bitvektor';
  if (comparable && distinct > v.length / 2) return 'for';
  return 'dictionary';
}

const ints = (s: string) => (s.match(/-?\d+/g) ?? []).map(Number);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Prueft eine Eingabe je Verfahren.
 * lauflaenge: "(Q1,1,5) (Q2,6,3)"; bitvektor: je Zeile "wert: 0101";
 * dictionary: input "0=2020, 1=2018", input2 Codes "0 1 0";
 * for: input Offsets, input2 Referenzwert; differenz: input Differenzen ohne Startwert.
 */
export function gradeAnswer(verfahren: Verfahren, values: string[], input: string, input2 = ''): boolean {
  if (!input.trim()) return false;
  switch (verfahren) {
    case 'lauflaenge': {
      const got = [...input.matchAll(/\(\s*([^,()]+?)\s*[,;]\s*(\d+)\s*[,;]\s*(\d+)\s*\)/g)].map((m) => [m[1], Number(m[2]), Number(m[3])]);
      return same(got, runLength(values));
    }
    case 'bitvektor': {
      const got: Record<string, string> = {};
      for (const line of input.split('\n')) {
        const m = line.match(/^\s*(.+?)\s*[:=]\s*([01\s]+)$/);
        if (m) got[m[1]] = m[2].replace(/\s+/g, '');
      }
      return bitVector(values).every((b) => got[b.value] === b.bits) && Object.keys(got).length === new Set(values).size;
    }
    case 'dictionary': {
      const got = [...input.matchAll(/(\d+)\s*[=:→-]+\s*([^,;\n]+)/g)].map((m) => [Number(m[1]), m[2].trim()]);
      const d = dictionary(values);
      return same(got, d.dict) && same(ints(input2), d.codes);
    }
    case 'for': {
      const ref = Number(input2);
      return input2.trim() !== '' && same(ints(input), frameOfReference(numbers(values), ref));
    }
    case 'differenz':
      return same(ints(input), differential(numbers(values)).diffs);
  }
}
