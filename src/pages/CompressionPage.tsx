import { useState } from 'react';
import { btn, btnGhost, CalcShell, card, Verdict } from '../components/CalcShell';
import {
  bitVector,
  dictionary,
  differential,
  frameOfReference,
  gradeAnswer,
  recommend,
  referenceValue,
  runLength,
  toSeconds,
  VERFAHREN_NAME,
  type Verfahren,
} from '../logic/compression';
import { pick } from '../logic/random';
import { markDone, recordItem } from '../progress';

interface Group {
  name: string;
  values: string[];
  source: string;
}

// Übung „Column Stores“, Aufgabe Komprimierung
const SHEET: Group[] = [
  { name: 'Datengruppe 1 (Uhrzeit)', source: 'Übung Column Stores', values: ['10:00:23', '10:00:24', '10:00:24', '10:00:25', '10:00:26', '10:00:36', '10:00:37', '10:00:39', '10:00:39', '10:00:45', '10:00:46', '10:00:48', '10:00:50', '10:00:50'] },
  { name: 'Datengruppe 2 (Jahr)', source: 'Übung Column Stores', values: ['2020', '2018', '2020', '2022', '2022', '2020', '2023', '2018', '2023', '2020', '2022', '2022', '2020', '2018'] },
  { name: 'Datengruppe 3 (Zahl)', source: 'Übung Column Stores', values: ['121', '117', '119', '118', '111', '110', '114', '113', '125', '122', '128', '124', '126', '123'] },
  { name: 'Datengruppe 4 (Quartal)', source: 'Übung Column Stores', values: ['Q1', 'Q1', 'Q1', 'Q1', 'Q1', 'Q2', 'Q2', 'Q2', 'Q3', 'Q3', 'Q3', 'Q3', 'Q3', 'Q3'] },
  { name: 'Datengruppe 5 (Geschlecht)', source: 'Übung Column Stores', values: ['f', 'f', 'm', 'f', 'm', 'f', 'd', 'd', 'f', 'm', 'm', 'm', 'd', 'f'] },
];

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pad = (n: number) => String(n).padStart(2, '0');

/** Zufallsspalte mit 8–12 Zeilen, passend zu einem zufaellig gewaehlten Verfahren */
function randomGroup(): Group {
  const n = rint(8, 12);
  const kind = pick<Verfahren>(['lauflaenge', 'bitvektor', 'dictionary', 'for', 'differenz']);
  let values: string[] = [];
  if (kind === 'lauflaenge') {
    const labels = pick([['A', 'B', 'C'], ['Q1', 'Q2', 'Q3', 'Q4'], ['Jan', 'Feb', 'Mär']]);
    for (const l of labels) values.push(...Array(rint(3, 4)).fill(l));
  } else if (kind === 'bitvektor') {
    const labels = pick([['f', 'm', 'd'], ['ja', 'nein'], ['S', 'M', 'L']]);
    values = Array.from({ length: n }, (_, i) => (i < labels.length ? labels[i] : pick(labels)));
    values.sort(() => Math.random() - 0.5);
  } else if (kind === 'dictionary') {
    const labels = pick([['Köln', 'Bonn', 'Aachen', 'Essen'], ['rot', 'gelb', 'grün', 'blau'], ['Java', 'Python', 'SQL', 'C', 'Go']]);
    values = Array.from({ length: n }, (_, i) => (i < labels.length ? labels[i] : pick(labels)));
    values.sort(() => Math.random() - 0.5);
  } else if (kind === 'for') {
    const base = rint(5, 50) * 10;
    const set = new Set<number>();
    while (set.size < n) set.add(base + rint(-8, 8));
    values = [...set].sort(() => Math.random() - 0.5).map(String);
  } else {
    let t = rint(8, 17) * 3600 + rint(0, 59) * 60;
    for (let i = 0; i < n; i++) {
      values.push(`${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`);
      t += rint(0, 6);
    }
  }
  return { name: 'Zufallsspalte', source: 'Zufallsaufgabe', values };
}

const FORMAT: Record<Verfahren, { label: string; placeholder: string; label2?: string; placeholder2?: string }> = {
  lauflaenge: { label: 'Tripel (Wert, Start ab 1, Länge)', placeholder: '(Q1,1,5) (Q2,6,3) …' },
  bitvektor: { label: 'Je Wert eine Zeile mit der Bit-Spalte', placeholder: 'f: 1101…\nm: 0010…' },
  dictionary: { label: 'Dictionary (Schlüssel ab 0)', placeholder: '0=2020, 1=2018, …', label2: 'Kodierte Spalte', placeholder2: '0 1 0 2 …' },
  for: { label: 'Offsets zum Referenzwert', placeholder: '2, -2, 0, …' },
  differenz: { label: 'Differenzen zum Vorgänger (ohne den Startwert)', placeholder: '1, 0, 1, …' },
};

function solutionText(v: Verfahren, values: string[]): string {
  const num = values.map((x) => (x.includes(':') ? toSeconds(x) : Number(x)));
  switch (v) {
    case 'lauflaenge':
      return runLength(values).map((t) => `(${t.join(',')})`).join(' ');
    case 'bitvektor':
      return bitVector(values).map((b) => `${b.value}: ${b.bits}`).join('\n');
    case 'dictionary': {
      const d = dictionary(values);
      return `Dictionary: ${d.dict.map(([k, x]) => `${k}=${x}`).join(', ')}\nSpalte: ${d.codes.join(' ')}`;
    }
    case 'for': {
      const ref = referenceValue(values);
      return `Referenzwert ${ref}\nOffsets: ${frameOfReference(num, ref).join(', ')}`;
    }
    case 'differenz': {
      const d = differential(num);
      return `Start ${values[0]}\nDifferenzen: ${d.diffs.join(', ')}`;
    }
  }
}

export function CompressionPage() {
  const [mode, setMode] = useState<'sheet' | 'random'>('sheet');
  const [idx, setIdx] = useState(0);
  const [rnd, setRnd] = useState<Group>(randomGroup);
  const [choice, setChoice] = useState<Verfahren | null>(null);
  const [input, setInput] = useState('');
  const [input2, setInput2] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [show, setShow] = useState(false);
  const group = mode === 'sheet' ? SHEET[idx] : rnd;
  const best = recommend(group.values);
  const ref = referenceValue(group.values);

  const reset = () => {
    setChoice(null);
    setInput('');
    setInput2('');
    setResult(null);
    setShow(false);
  };
  const check = () => {
    if (!choice) return;
    const ok = choice === best && gradeAnswer(choice, group.values, input, choice === 'for' ? String(ref) : input2);
    recordItem(`calc:komp:${best}`, ok);
    if (ok) markDone(`calc:komp:${best}`);
    setResult(ok);
  };

  return (
    <CalcShell
      title="Komprimierung im Column Store"
      intro={
        <p>
          Wähle zuerst das passende leichtgewichtige Verfahren (Entscheidungsbaum der Vorlesung), dann komprimiere die Spalte.
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
          SHEET.map((g, i) => (
            <button key={g.name} className={`text-sm underline ${i === idx ? 'font-bold' : ''}`} onClick={() => (setIdx(i), reset())}>
              {g.name}
            </button>
          ))}
        {mode === 'random' && (
          <button className={btnGhost} onClick={() => (setRnd(randomGroup()), reset())}>
            Neue Spalte
          </button>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-2 font-bold">
          {group.name} ({group.source})
        </h2>
        <p className="font-mono text-sm">{group.values.join(' · ')}</p>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">1. Welches Verfahren passt am besten?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(VERFAHREN_NAME) as Verfahren[]).map((v) => (
              <button
                key={v}
                aria-pressed={choice === v}
                className={`rounded-full border px-3 py-1 text-sm ${choice === v ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
                onClick={() => (setChoice(v), setResult(null))}
              >
                {VERFAHREN_NAME[v]}
              </button>
            ))}
          </div>
        </fieldset>
        {choice && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">2. Komprimiere die Spalte</p>
            {choice === 'for' && <p className="text-sm">Referenzwert: gerundeter Durchschnitt = {ref}</p>}
            {choice === 'differenz' && <p className="text-sm">Startwert: {group.values[0]} (Zeitangaben in Sekunden rechnen)</p>}
            <label className="block text-sm" htmlFor="komp-in">
              {FORMAT[choice].label}
            </label>
            <textarea id="komp-in" className="h-24 w-full rounded-lg border border-line bg-bg p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder={FORMAT[choice].placeholder} />
            {FORMAT[choice].label2 && (
              <>
                <label className="block text-sm" htmlFor="komp-in2">
                  {FORMAT[choice].label2}
                </label>
                <input id="komp-in2" className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm" value={input2} onChange={(e) => setInput2(e.target.value)} placeholder={FORMAT[choice].placeholder2} />
              </>
            )}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={btn} onClick={check} disabled={!choice}>
            Prüfen
          </button>
          <button className={btnGhost} onClick={() => setShow((s) => !s)}>
            {show ? 'Lösung ausblenden' : 'Lösung zeigen'}
          </button>
        </div>
      </div>

      {result !== null && choice && (
        <Verdict ok={result}>
          {choice !== best ? (
            <p>Für diese Spalte passt {VERFAHREN_NAME[best]} besser als {VERFAHREN_NAME[choice]}.</p>
          ) : result ? (
            <p>Verfahren und Ergebnis stimmen.</p>
          ) : (
            <p>Das Verfahren stimmt, das Ergebnis noch nicht. Achte auf das Eingabeformat.</p>
          )}
        </Verdict>
      )}

      {show && (
        <div className={card}>
          <h2 className="mb-2 font-bold">Lösung: {VERFAHREN_NAME[best]}</h2>
          <pre className="overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs">{solutionText(best, group.values)}</pre>
        </div>
      )}
    </CalcShell>
  );
}
