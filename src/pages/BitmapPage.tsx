import { useState } from 'react';
import { btn, btnGhost, CalcShell, card, Verdict } from '../components/CalcShell';
import { bitmapIndex, checkBitmapSql, gradeBitmap } from '../logic/bitmap';
import { pick } from '../logic/random';
import { markDone, recordItem } from '../progress';

interface BmTask {
  table: string;
  column: string;
  values: string[];
  source: string;
}

const SHEET: BmTask[] = [
  { table: 'chat', column: 'thema', values: ['Alles', 'Videospiele', 'Lernen', 'Videospiele'], source: 'Übung 1, Chat: Thema' },
  { table: 'chat', column: 'ersteller', values: ['Thomas', 'Kevin', 'Laura', 'Laura'], source: 'Übung 1, Chat: Ersteller' },
  { table: 'person', column: 'wohnort', values: ['Dortmund', 'Berlin', 'Köln', 'Berlin'], source: 'Folienbeispiel Wohnort' },
];

const POOLS: { table: string; column: string; values: string[] }[] = [
  { table: 'kunde', column: 'wohnort', values: ['Köln', 'Bonn', 'Berlin', 'Gummersbach'] },
  { table: 'auto', column: 'farbe', values: ['rot', 'blau', 'grün', 'schwarz'] },
  { table: 'mitarbeiter', column: 'abteilung', values: ['IT', 'HR', 'Vertrieb'] },
  { table: 'bestellung', column: 'status', values: ['offen', 'bezahlt', 'versendet'] },
  { table: 'student', column: 'studiengang', values: ['INF', 'WI', 'MI', 'ET'] },
];

function randomTask(): BmTask {
  const p = pick(POOLS);
  const k = 2 + Math.floor(Math.random() * Math.min(3, p.values.length - 1));
  const used = [...p.values].sort(() => Math.random() - 0.5).slice(0, k);
  const rows = 4 + Math.floor(Math.random() * 5);
  const values = Array.from({ length: rows }, (_, i) => (i < k ? used[i] : pick(used))).sort(() => Math.random() - 0.5);
  return { table: p.table, column: p.column, values, source: 'Zufallsaufgabe' };
}

export function BitmapPage() {
  const [mode, setMode] = useState<'sheet' | 'random'>('sheet');
  const [sheetIdx, setSheetIdx] = useState(0);
  const [rnd, setRnd] = useState<BmTask>(randomTask);
  const [bits, setBits] = useState<Record<string, string>>({});
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<{ ok: boolean; wrong: string[]; sqlOk: boolean } | null>(null);
  const [show, setShow] = useState(false);
  const task = mode === 'sheet' ? SHEET[sheetIdx] : rnd;
  const solution = bitmapIndex(task.values);

  const reset = () => {
    setBits({});
    setSql('');
    setResult(null);
    setShow(false);
  };
  const check = () => {
    const g = gradeBitmap(task.values, bits);
    const sqlOk = checkBitmapSql(sql, task.table, task.column);
    const ok = g.ok && sqlOk;
    recordItem('calc:bitmap', ok);
    if (ok) markDone('calc:bitmap');
    setResult({ ...g, ok, sqlOk });
  };

  return (
    <CalcShell
      title="Bitmap-Index"
      intro={
        <p>
          Ein Bitmap-Index legt für jeden unterschiedlichen Wert einer Spalte eine Bit-Liste an: Stelle i ist 1, wenn Zeile i diesen
          Wert hat. Lohnt sich bei Spalten mit wenigen unterschiedlichen Werten.
        </p>
      }
    >
      <div className={`${card} flex flex-wrap items-center gap-3`}>
        <button className={mode === 'sheet' ? btn : btnGhost} onClick={() => (setMode('sheet'), reset())}>
          Übungsblatt
        </button>
        <button className={mode === 'random' ? btn : btnGhost} onClick={() => (setMode('random'), reset())}>
          Zufall
        </button>
        {mode === 'sheet' &&
          SHEET.map((s, i) => (
            <button key={s.source} className={`text-sm underline ${i === sheetIdx ? 'font-bold' : ''}`} onClick={() => (setSheetIdx(i), reset())}>
              {s.source}
            </button>
          ))}
        {mode === 'random' && (
          <button className={btnGhost} onClick={() => (setRnd(randomTask()), reset())}>
            Neue Tabelle
          </button>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-2 font-bold">Aufgabe ({task.source})</h2>
        <p className="text-sm">
          Erstelle den Bitmap-Index für die Spalte <strong className="font-mono">{task.column.toUpperCase()}</strong> der Tabelle{' '}
          <strong className="font-mono">{task.table.toUpperCase()}</strong> und schreibe das SQL-Statement dazu.
        </p>
        <table className="mt-3 border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-line px-3 py-1 text-left">Zeile</th>
              <th className="border border-line px-3 py-1 text-left font-mono">{task.column.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {task.values.map((v, i) => (
              <tr key={i}>
                <td className="border border-line px-3 py-1">{i + 1}</td>
                <td className="border border-line px-3 py-1">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-2">
          {solution.map((b) => (
            <label key={b.value} className="flex items-center gap-3 text-sm">
              <span className="w-32 font-semibold">{b.value}</span>
              <input
                className="w-40 rounded-lg border border-line bg-bg px-2 py-1 font-mono"
                value={bits[b.value] ?? ''}
                onChange={(e) => setBits({ ...bits, [b.value]: e.target.value })}
                placeholder={'0'.repeat(task.values.length)}
                inputMode="numeric"
              />
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="bm-sql">
          SQL-Statement
        </label>
        <input
          id="bm-sql"
          className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="CREATE … INDEX …"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={btn} onClick={check}>
            Prüfen
          </button>
          <button className={btnGhost} onClick={() => setShow((s) => !s)}>
            {show ? 'Lösung ausblenden' : 'Lösung zeigen'}
          </button>
        </div>
      </div>

      {result && (
        <Verdict ok={result.ok}>
          <ul className="list-disc space-y-1 pl-5">
            {result.wrong.length === 0 ? <li>Alle Bit-Listen stimmen.</li> : result.wrong.map((w) => <li key={w}>Bit-Liste für „{w}“ stimmt nicht.</li>)}
            <li>{result.sqlOk ? 'SQL-Statement stimmt.' : `SQL: CREATE BITMAP INDEX <name> ON ${task.table}(${task.column});`}</li>
          </ul>
        </Verdict>
      )}

      {show && (
        <div className={card}>
          <h2 className="mb-2 font-bold">Lösung</h2>
          <ul className="font-mono text-sm">
            {solution.map((b) => (
              <li key={b.value}>
                {b.value}: {b.bits}
              </li>
            ))}
          </ul>
          <pre className="mt-3 rounded-lg bg-bg p-3 font-mono text-xs">{`CREATE BITMAP INDEX idx_${task.table}_${task.column} ON ${task.table}(${task.column});`}</pre>
        </div>
      )}
    </CalcShell>
  );
}
