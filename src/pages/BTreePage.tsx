import { useState } from 'react';
import { btn, btnGhost, CalcShell, card, Verdict } from '../components/CalcShell';
import { build, format, formatLevels, insert, levels, parseLevels, type BNode } from '../logic/btree';
import { distinctInts, pick } from '../logic/random';
import { markDone, recordItem } from '../progress';

interface BTask {
  m: number;
  keys: number[];
  source: string;
}

/** Werte aus Uebung 1 (Speicherstrukturen) */
const SHEET: BTask[] = [
  { m: 1, keys: [4, 3, 18, 50, 48], source: 'Übung 1, Teil a (m = 1)' },
  { m: 2, keys: [10, 50, 34, 36, 30, 16, 20, 38], source: 'Übung 1, Teil b (m = 2)' },
];

const randomTask = (): BTask => {
  const m = pick([1, 2]);
  const count = 5 + Math.floor(Math.random() * 4);
  return { m, keys: distinctInts(count, 1, 99), source: 'Zufallsaufgabe' };
};

function TreeView({ root }: { root: BNode }) {
  return (
    <div className="space-y-2 overflow-x-auto">
      {levels(root).map((lv, i) => (
        <div key={i} className="flex justify-center gap-3">
          {lv.map((keys, j) => (
            <span key={j} className="rounded border border-line bg-bg px-2 py-1 font-mono text-sm">
              {keys.join(' ')}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function BTreePage() {
  const [mode, setMode] = useState<'sheet' | 'random'>('sheet');
  const [sheetIdx, setSheetIdx] = useState(0);
  const [rnd, setRnd] = useState<BTask>(randomTask);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ ok: boolean; diff: string[] } | null>(null);
  const [steps, setSteps] = useState(false);
  const task = mode === 'sheet' ? SHEET[sheetIdx] : rnd;
  const expected = build(task.keys, task.m);

  const reset = () => {
    setInput('');
    setResult(null);
    setSteps(false);
  };

  const check = () => {
    const got = parseLevels(input);
    const want = levels(expected);
    if (!got) {
      setResult({ ok: false, diff: ['Eingabe nicht lesbar. Schreibe je Ebene eine Zeile, Knoten in eckigen Klammern: [3 5] [9]'] });
      return;
    }
    const diff: string[] = [];
    for (let i = 0; i < Math.max(got.length, want.length); i++) {
      const g = got[i] ? formatLevels([got[i]]) : '(fehlt)';
      const w = want[i] ? formatLevels([want[i]]) : '(keine weitere Ebene)';
      if (g !== w) diff.push(`Ebene ${i + 1}: du hast ${g}, erwartet ist ${w}`);
    }
    const ok = diff.length === 0;
    recordItem('calc:btree', ok);
    if (ok) markDone('calc:btree');
    setResult({ ok, diff });
  };

  const trace: { key: number; tree: BNode; note: string }[] = [];
  let cur: BNode | null = null;
  for (const k of task.keys) {
    const r = insert(cur, k, task.m);
    trace.push({ key: k, tree: r.root, note: r.duplicate ? 'Duplikat: STOP, nichts eingefügt' : r.split ? 'Überlauf: Split' : 'eingefügt' });
    cur = r.root;
  }

  return (
    <CalcShell
      title="B-Baum: Einfügen"
      intro={
        <p>
          Grad m: Jeder Knoten außer der Wurzel hat mindestens m und höchstens 2m Records. Eingefügt wird immer in ein Blatt.
          Hat ein Knoten 2m + 1 Records, wandert der mittlere nach oben und links und rechts entstehen zwei neue Knoten.
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
            Neue Werte
          </button>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-2 font-bold">Aufgabe ({task.source})</h2>
        <p className="text-sm">
          Füge in einen leeren B-Baum vom Grad <strong>m = {task.m}</strong> nacheinander ein:{' '}
          <span className="font-mono">{task.keys.join(', ')}</span>
        </p>
        <p className="mt-2 text-sm text-muted">Gib den Baum nach der letzten Einfügung ein, je Ebene eine Zeile, z. B. „[13]“, dann „[7] [15]“.</p>
        <label className="mt-3 block text-sm font-semibold" htmlFor="btree-in">
          Dein Endbaum
        </label>
        <textarea
          id="btree-in"
          className="mt-1 h-32 w-full rounded-lg border border-line bg-bg p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'[13]\n[7] [15]\n[3 5] [9] [14] [25]'}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={btn} onClick={check}>
            Prüfen
          </button>
          <button className={btnGhost} onClick={() => setSteps((s) => !s)}>
            {steps ? 'Schritte ausblenden' : 'Schritt für Schritt zeigen'}
          </button>
        </div>
      </div>

      {result && (
        <Verdict ok={result.ok}>
          {result.ok ? (
            <p>Der Baum stimmt auf allen Ebenen.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {result.diff.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </Verdict>
      )}

      {steps && (
        <div className={card}>
          <h2 className="mb-3 font-bold">Lösung Schritt für Schritt</h2>
          <ol className="space-y-4">
            {trace.map((s, i) => (
              <li key={i}>
                <p className="mb-2 text-sm">
                  <strong>{s.key}</strong> einfügen: {s.note}
                </p>
                <TreeView root={s.tree} />
              </li>
            ))}
          </ol>
          <pre className="mt-4 rounded-lg bg-bg p-3 font-mono text-xs">{format(expected)}</pre>
        </div>
      )}
    </CalcShell>
  );
}
