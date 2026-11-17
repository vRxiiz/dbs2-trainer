import { useEffect, useMemo, useState } from 'react';
import { SqlEditor } from '../components/SqlEditor';
import { CHAPTER_NAME, EXAM_MODES, type ExamMode } from '../content/chapters';
import { topicById } from '../content/topics';
import { buildExam, gradeEstimate, gradeExam, KLAUSUR_TYPES, loadExam, saveExam, type Answer, type ExamItem, type ExamState } from '../exam/exam';
import { passPercent, recordExam, type ExamAttempt } from '../progress';
import { topicHref } from '../progressCatalog';
import { SchemaBox } from './CodePage';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
const MODES = Object.keys(EXAM_MODES) as ExamMode[];

/* ======================= Start ======================= */

function Setup({ onStart }: { onStart: (s: ExamState) => void }) {
  const [mode, setMode] = useState<ExamMode>('mct1');
  const [timed, setTimed] = useState(true);
  const m = EXAM_MODES[mode];
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Probeklausur wählen</h2>
      <fieldset className="mt-4">
        <legend className="font-semibold">Modus</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MODES.map((k) => (
            <label key={k} className={`flex cursor-pointer gap-2 rounded-lg border p-3 ${mode === k ? 'border-brand bg-bg' : 'border-line'}`}>
              <input type="radio" name="mode" className="mt-1" checked={mode === k} onChange={() => setMode(k)} />
              <span>
                <span className="font-semibold">{EXAM_MODES[k].name}</span>
                <span className="block text-sm text-muted">{EXAM_MODES[k].text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-4 text-sm">
        {mode === 'klausur'
          ? `${KLAUSUR_TYPES.length} Code-Aufgaben (${KLAUSUR_TYPES.map((t) => t.name).join(', ')}), bewertet nach Pflichtbausteinen wie in der Altklausur. Bestanden ab ${passPercent(mode)} %.`
          : `20 Wissensfragen zu je 5 Punkten aus ${m.chapters.map((c) => `Kapitel ${c}`).join(', ')}. Punkte nur bei exakt richtiger Auswahl. Bestanden ab ${passPercent(mode)} %.`}
      </p>
      <label className="mt-4 flex items-start gap-2">
        <input type="checkbox" className="mt-1" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
        <span>
          Mit Zeitlimit ({m.minutes} Minuten)
          <span className="block text-sm text-muted">Ohne Zeitlimit zählt der Versuch nicht für die Prüfungsreife.</span>
        </span>
      </label>
      <p className="mt-4 text-sm text-muted">
        Während der Klausur gibt es keine Rückmeldung. Die Antworten werden lokal in deinem Browser zwischengespeichert, ein Neuladen der Seite ist
        also unkritisch. Die Notenangabe am Ende ist nur eine Orientierung.
      </p>
      <button
        className={`${btn} mt-4`}
        onClick={() =>
          onStart({ mode, minutes: timed ? m.minutes : 0, seed: Math.floor(Math.random() * 2 ** 31), startedAt: Date.now(), answers: {} })
        }
      >
        {m.name} starten
      </button>
    </section>
  );
}

/* ======================= Aufgaben-Eingabe ======================= */

function McInput({ item, value, onChange }: { item: Extract<ExamItem, { kind: 'mc' }>; value?: number[]; onChange: (v: number[]) => void }) {
  const v = value ?? [];
  return (
    <fieldset>
      <legend className="mb-2">
        {item.q.question}
        {item.q.multi && <span className="ml-2 text-sm text-muted">(Mehrfachauswahl)</span>}
      </legend>
      <div className="space-y-1">
        {item.q.options.map((o, i) => (
          <label key={i} className="flex items-start gap-2">
            <input
              className="mt-1"
              type={item.q.multi ? 'checkbox' : 'radio'}
              name={item.id}
              checked={v.includes(i)}
              onChange={(e) => onChange(item.q.multi ? (e.target.checked ? [...v, i] : v.filter((x) => x !== i)) : [i])}
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ItemInput({ item, answer, set }: { item: ExamItem; answer?: Answer; set: (a: Answer) => void }) {
  if (item.kind === 'mc') return <McInput item={item} value={Array.isArray(answer) ? answer : undefined} onChange={set} />;
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line">{item.t.task}</p>
      <SchemaBox scenario={item.t.scenario} />
      <SqlEditor value={typeof answer === 'string' ? answer : ''} onChange={set} onRun={() => {}} label={`Code für Aufgabe ${item.t.title}`} />
    </div>
  );
}

const itemTitle = (item: ExamItem) => (item.kind === 'mc' ? 'Wissensfrage' : item.t.title);

/* ======================= Loesung ======================= */

function Solution({ item, answer }: { item: ExamItem; answer?: Answer }) {
  if (item.kind === 'mc')
    return (
      <p>
        Richtig: {item.q.correct.map((i) => item.q.options[i]).join('; ')}. <span className="text-muted">{item.q.explanation}</span>
      </p>
    );
  return (
    <>
      {typeof answer === 'string' && answer.trim() && (
        <details>
          <summary className="cursor-pointer font-semibold">Deine Abgabe</summary>
          <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-bg p-2 font-mono text-xs">{answer}</pre>
        </details>
      )}
      <p className="font-semibold">Musterlösung</p>
      <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-bg p-2 font-mono text-xs">{item.t.solution}</pre>
    </>
  );
}

/* ======================= Seite ======================= */

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function ExamPage() {
  const [state, setState] = useState<ExamState | null>(() => loadExam());
  const [confirm, setConfirm] = useState(false);
  const items = useMemo(() => (state ? buildExam(state.mode, state.seed) : []), [state?.mode, state?.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const running = !!state && !state.submittedAt;
  const now = useNow(running);
  const timed = !!state && state.minutes > 0;
  // now kann beim Start noch vom letzten Tick stammen: nie mehr als die volle Zeit anzeigen
  const left = timed ? Math.min(state!.minutes * 60_000, state!.startedAt + state!.minutes * 60_000 - now) : Infinity;

  const update = (s: ExamState | null) => {
    setState(s);
    saveExam(s);
  };
  const submit = () => state && update({ ...state, submittedAt: Date.now() });

  useEffect(() => {
    if (running && timed && left <= 0) submit();
  }, [running, left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const graded = useMemo(() => (state?.submittedAt ? gradeExam(items, state.answers) : null), [state?.submittedAt, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ins Fortschrittsverzeichnis eintragen (einmalig je Klausur)
  useEffect(() => {
    if (!state?.submittedAt || !graded) return;
    recordExam(
      {
        id: `${state.seed}-${state.startedAt}`,
        t: Math.floor(state.submittedAt / 1000),
        m: state.minutes,
        c: [...new Set(items.map((i) => i.chapter))],
        p: graded.points,
        x: graded.max,
        k: graded.perChapter as ExamAttempt['k'],
        mode: state.mode,
      },
      graded.results.map(({ id, right }) => ({ id, right })),
    );
  }, [state?.submittedAt, graded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state)
    return (
      <>
        <a href="#/" className="inline-block py-2 text-sm underline">
          ← Übersicht
        </a>
        <h1 className="mt-2 text-3xl font-bold">Prüfungsmodus</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Probeklausuren wie im Semester: die Multiple-Choice-Tests MCT 1 und MCT 2 und die E-Klausur mit drei Code-Aufgaben. Mit Zeitlimit,
          ohne Hilfen, mit Auswertung nach Kapiteln.
        </p>
        <div className="mt-6 max-w-3xl">
          <Setup onStart={update} />
        </div>
      </>
    );

  const mode = EXAM_MODES[state.mode];
  const total = items.reduce((s, i) => s + i.points, 0);

  if (state.submittedAt && graded) {
    const percent = total ? (100 * graded.points) / total : 0;
    const ok = percent >= passPercent(state.mode);
    const counts = state.minutes >= mode.minutes;
    return (
      <>
        <h1 className="text-3xl font-bold">Auswertung {mode.name}</h1>
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Punkte</p>
            <p className="text-3xl font-bold">
              {graded.points.toLocaleString('de-DE')} / {total}
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Anteil</p>
            <p className="text-3xl font-bold">{percent.toFixed(0)} %</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">{state.mode === 'klausur' ? 'Notenorientierung*' : 'Bestehensgrenze'}</p>
            <p className="text-3xl font-bold">{state.mode === 'klausur' ? gradeEstimate(percent) : `${passPercent(state.mode)} %`}</p>
          </div>
        </section>
        {state.mode === 'klausur' && <p className="mt-2 text-xs text-muted">* Lineare Skala ab 50 %. Keine offizielle Bewertung.</p>}
        <a href="#/fortschritt" className={`mt-4 block rounded-card border-2 p-4 no-underline ${ok ? 'border-ok bg-ok-bg' : 'border-line bg-surface'}`}>
          <strong>{ok ? '✓ Bestanden.' : '✗ Diesmal nicht bestanden.'}</strong>{' '}
          {counts ? 'Dieser Versuch mit Zeitlimit zählt für deine Prüfungsreife.' : 'Versuche ohne Zeitlimit zählen nicht für die Prüfungsreife, aber für deine Fragenstatistik.'}{' '}
          <span className="underline">Fortschritt ansehen →</span>
        </a>

        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">Nach Kapiteln</h2>
          <ul className="space-y-2">
            {Object.entries(graded.perChapter).map(([c, [pts, max]]) => {
              const p = max ? (100 * pts) / max : 0;
              return (
                <li key={c}>
                  <div className="flex justify-between text-sm">
                    <span>
                      {c} {CHAPTER_NAME[c as keyof typeof CHAPTER_NAME]}
                    </span>
                    <span className="tabular-nums">
                      {pts.toLocaleString('de-DE')} / {max} ({p.toFixed(0)} %)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-bg" aria-hidden>
                    <div className={`h-2 rounded-full ${p >= passPercent(state.mode) ? 'bg-ok' : 'bg-bad'}`} style={{ width: `${p}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          {items.map((item, k) => {
            const r = graded.results[k];
            const topicId = item.kind === 'mc' ? item.q.topicId : item.t.topicId;
            return (
              <article key={item.id} className="rounded-card border border-line bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold">
                    {k + 1}. {itemTitle(item)}
                  </h3>
                  <span className={`font-semibold tabular-nums ${r.right ? 'text-ok' : 'text-bad'}`}>
                    {r.points.toLocaleString('de-DE')} / {item.points} P.
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {CHAPTER_NAME[item.chapter]} · Thema: {topicById(topicId)?.title ?? '–'}
                </p>
                {item.kind === 'mc' && <p className="mt-1 text-sm">{item.q.question}</p>}
                <div className="mt-2 space-y-2 text-sm">
                  <Solution item={item} answer={state.answers[item.id]} />
                </div>
                <a href={item.kind === 'code' ? `#/code/${item.t.id}` : topicHref(topicId)} className="mt-1 inline-block py-2 text-sm underline">
                  Dazu üben →
                </a>
              </article>
            );
          })}
        </section>
        <button className={`${btn} mt-6`} onClick={() => update(null)}>
          Neue Probeklausur
        </button>
      </>
    );
  }

  const mm = timed ? Math.max(0, Math.floor(left / 60000)) : 0;
  const ss = timed ? Math.max(0, Math.floor((left % 60000) / 1000)) : 0;
  const answered = items.filter((i) => {
    const a = state.answers[i.id];
    return Array.isArray(a) ? a.length > 0 : !!a?.trim();
  }).length;

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <span className="font-bold">{mode.name}</span>
        <span className="text-sm text-muted">
          {answered} von {items.length} bearbeitet · {total} Punkte
        </span>
        <span className={`font-mono text-lg font-bold tabular-nums ${timed && left < 5 * 60000 ? 'text-bad' : ''}`} aria-live="off">
          {timed ? `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : 'ohne Zeitlimit'}
        </span>
      </div>
      {state.mode === 'klausur' && (
        <p className="mb-4 text-sm text-muted">
          Bewertet wird nur der Code im Textfeld. Gib nur den für die Aufgabe relevanten Code ab. Der Code wird nicht ausgeführt, sondern auf die
          geforderten Bausteine geprüft.
        </p>
      )}
      <div className="space-y-4">
        {items.map((item, k) => (
          <article key={item.id} className="rounded-card border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-bold">
                Aufgabe {k + 1}: {itemTitle(item)}
              </h2>
              <span className="text-sm text-muted">
                {item.points} {item.points === 1 ? 'Punkt' : 'Punkte'} · {CHAPTER_NAME[item.chapter]}
              </span>
            </div>
            <ItemInput item={item} answer={state.answers[item.id]} set={(a) => update({ ...state, answers: { ...state.answers, [item.id]: a } })} />
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!confirm ? (
          <button className={btn} onClick={() => setConfirm(true)}>
            Abgeben
          </button>
        ) : (
          <>
            <span className="text-sm">Wirklich abgeben? Danach sind keine Änderungen mehr möglich.</span>
            <button className={btn} onClick={submit}>
              Ja, abgeben
            </button>
            <button className={btnGhost} onClick={() => setConfirm(false)}>
              Weiter bearbeiten
            </button>
          </>
        )}
        <button
          className="ml-auto text-sm text-muted underline"
          onClick={() => {
            if (window.confirm('Probeklausur abbrechen? Alle Antworten gehen verloren.')) update(null);
          }}
        >
          Abbrechen
        </button>
      </div>
    </>
  );
}
