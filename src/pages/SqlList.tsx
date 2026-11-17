import { useMemo, useState } from 'react';
import { Chips } from '../components/Chips';
import { LEVEL_NAME, scenarios } from '../content/scenarios';
import { topicById, topicsOf } from '../content/topics';
import { viewExercises } from '../content/viewExercises';
import { useProgress } from '../progress';

type Filter = { scenario: string; level: 0 | 1 | 2 | 3; topic: string };
const ALL = viewExercises;
const KEY = 'dbs2:views-filter';

function loadFilter(): Filter {
  try {
    const f = JSON.parse(localStorage.getItem(KEY) ?? '') as Filter;
    if (f && typeof f.scenario === 'string') return f;
  } catch {
    /* ignorieren */
  }
  return { scenario: '', level: 0, topic: '' };
}

export function SqlList() {
  const d = useProgress();
  const [f, setF] = useState<Filter>(loadFilter);
  const update = (patch: Partial<Filter>) => {
    const next = { ...f, ...patch };
    setF(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignorieren */
    }
  };

  const list = useMemo(
    () =>
      ALL.filter(
        (e) =>
          (!f.scenario || (e.scenario ?? 'coworkers') === f.scenario) &&
          (!f.level || e.level === f.level) &&
          (!f.topic || e.topicId === f.topic),
      ),
    [f],
  );
  const open = list.filter((e) => !d.done.includes(`sql:${e.id}`));
  const random = () => {
    const pool = open.length ? open : list;
    if (pool.length) location.hash = `#/views/${pool[Math.floor(Math.random() * pool.length)].id}`;
  };
  const groups = scenarios
    .map((s) => ({ s, items: list.filter((e) => (e.scenario ?? 'coworkers') === s.id) }))
    .filter((g) => g.items.length);

  return (
    <>
      <h1 className="mt-2 text-3xl font-bold">Views und Materialized Views</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Views anlegen und abfragen auf den Übungsdatenbanken. Bewertet wird der Inhalt der View bzw. das Ergebnis der Abfrage,
        nicht die Schreibweise, auf den sichtbaren und auf verdeckten Daten.
      </p>

      <section className="mt-6 space-y-3 rounded-card border border-line bg-surface p-5">
        <Chips
          label="Datenbank"
          value={f.scenario}
          options={[['', 'Alle'], ...scenarios.filter((s) => ALL.some((e) => (e.scenario ?? 'coworkers') === s.id)).map((s) => [s.id, s.name] as [string, string])]}
          onChange={(v) => update({ scenario: v })}
        />
        <Chips
          label="Schwierigkeit"
          value={f.level}
          options={[
            [0, 'Alle'],
            [1, LEVEL_NAME[1]],
            [2, LEVEL_NAME[2]],
            [3, LEVEL_NAME[3]],
          ]}
          onChange={(v) => update({ level: v })}
        />
        <Chips
          label="Thema"
          value={f.topic}
          options={[['', 'Alle'], ...topicsOf('04').filter((t) => ALL.some((e) => e.topicId === t.id)).map((t) => [t.id, t.title] as [string, string])]}
          onChange={(v) => update({ topic: v })}
        />
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <button
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50"
            onClick={random}
            disabled={!list.length}
          >
            Zufällige Aufgabe
          </button>
          <span className="text-sm text-muted">
            {list.length} Aufgaben, davon {list.length - open.length} gelöst
          </span>
          <a href="#/spielwiese" className="ml-auto text-sm underline">
            Spielwiese: freie Abfragen und Views →
          </a>
        </div>
      </section>

      {groups.length === 0 && <p className="mt-6 text-muted">Keine Aufgaben für diese Auswahl.</p>}
      {groups.map(({ s, items }) => (
        <section key={s.id} className="mt-8">
          <h2 className="text-xl font-bold">{s.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {s.description} <span className="italic">({s.origin})</span>
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((ex) => (
              <li key={ex.id}>
                <a
                  href={`#/views/${ex.id}`}
                  className="flex h-full flex-col rounded-card border border-line bg-surface p-4 no-underline hover:border-brand"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {LEVEL_NAME[ex.level]} · {ex.kind === 'view' ? 'View anlegen' : 'Abfrage'}
                    {d.done.includes(`sql:${ex.id}`) && <span className="ml-2 text-ok">✓ gelöst</span>}
                  </span>
                  <span className="mt-1 font-bold">{ex.title}</span>
                  <span className="mt-1 text-sm text-muted">{topicById(ex.topicId)?.title ?? ex.topic}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
