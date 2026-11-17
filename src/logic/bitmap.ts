// Bitmap-Index: je unterschiedlichem Wert eine Bit-Liste ueber alle Zeilen (1 = Zeile hat den Wert).

export function bitmapIndex(values: string[]): { value: string; bits: string }[] {
  const distinct = [...new Set(values)];
  return distinct.map((d) => ({ value: d, bits: values.map((v) => (v === d ? '1' : '0')).join('') }));
}

/** Vergleicht die eingegebenen Bit-Listen (Leerzeichen egal) */
export function gradeBitmap(values: string[], answer: Record<string, string>): { ok: boolean; wrong: string[] } {
  const wrong = bitmapIndex(values)
    .filter((b) => (answer[b.value] ?? '').replace(/\s+/g, '') !== b.bits)
    .map((b) => b.value);
  return { ok: wrong.length === 0, wrong };
}

/** CREATE BITMAP INDEX <name> ON <tabelle>(<spalte>) */
export function checkBitmapSql(sql: string, table: string, column: string): boolean {
  return new RegExp(`^\\s*CREATE\\s+BITMAP\\s+INDEX\\s+\\w+\\s+ON\\s+${table}\\s*\\(\\s*${column}\\s*\\)\\s*;?\\s*$`, 'i').test(sql);
}
