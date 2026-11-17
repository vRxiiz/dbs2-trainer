import { useMemo, useState } from 'react';
import { Chips } from '../components/Chips';
import { CHAPTER_NAME, LEVEL_NAME, type Chapter } from '../content/chapters';
import { codeTasks } from '../content/codeTasks';
import { topicById, topicsOf } from '../content/topics';
import { useProgress } from '../progress';

type Filter = { level: 0 | 1 | 2 | 3; topic: string };
const KEY = 'dbs2:code-filter';

function loadFilter(): Filter {
  try {
    const f = JSON.parse(localStorage.getItem(KEY) ?? '') as Filter;
    if (f && typeof f.topic === 'string') return f;
  } catch {
    /* ignorieren */
  }
  return { level: 0, topic: '' };
}

const chapterOfTask = (topicId: string) => topicById(topicId)?.chapter ?? '';
const CODE_CHAPTERS = [...new Set(codeTasks.map((t) => chapterOfTask(t.topicId)))].sort();

/** Code-Aufgaben (PL/SQL, Trigger, Materialized Views); optional auf ein Kapitel beschraenkt */
export function CodeList({ chapter }: { chapter?: Chapter }) {
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
  const inChapter = codeTasks.filter((t) => !chapter || chapterOfTask(t.topicId) === chapter);
  const topicOk = f.topic && inChapter.some((t) => t.topicId === f.topic) ? f.topic : '';
  const list = useMemo(
    () => inChapter.filter((t) => (!f.level || t.level === f.level) && (!topicOk || t.topicId === topicOk)),
    [inChapter, f.level, topicOk],
  );
  const open = list.filter((t) => !d.done.includes(`code:${t.id}`));
  const random = () => {
    const pool = open.length ? open : list;
    if (pool.length) location.hash = `#/code/${pool[Math.floor(Math.random() * pool.length)].id}`;
  };
  const chapters = chapter ? [chapter] : CODE_CHAPTERS;
  const topicOptions = chapters.flatMap((c) => topicsOf(c)).filter((t) => inChapter.some((x) => x.topicId === t.id));

  return (
    <>
      <h1 className="mt-2 text-3xl font-bold">Code-Aufgaben{chapter ? `: ${CHAPTER_NAME[chapter]}` : ''}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Schreibe PL/SQL, Trigger und Materialized Views wie in der E-Klausur. Geprüft wird die Struktur deiner Lösung: ob die
        Pflichtbausteine vorkommen und die Blöcke sauber geschlossen sind. Danach siehst du die Musterlösung. Ob der Code in
        Oracle wirklich läuft, testest du am besten zusätzlich im SQL Developer.
      </p>

      <section className="mt-6 space-y-3 rounded-card border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kapitel">
          <span className="w-28 text-sm font-semibold">Kapitel</span>
          <a href="#/code" aria-current={!chapter ? 'page' : undefined} className={`rounded-full border px-3 py-1 text-sm no-underline ${!chapter ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}>
            Alle
          </a>
          {CODE_CHAPTERS.map((c) => (
            <a
              key={c}
              href={`#/code/kapitel/${c}`}
              aria-current={chapter === c ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-sm no-underline ${chapter === c ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
            >
              {CHAPTER_NAME[c]}
            </a>
          ))}
        </div>
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
          value={topicOk}
          options={[['', 'Alle'], ...topicOptions.map((t) => [t.id, t.title] as [string, string])]}
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
        </div>
      </section>

      {list.length === 0 && <p className="mt-6 text-muted">Keine Aufgaben für diese Auswahl.</p>}
      {chapters.map((c) => {
        const items = list.filter((t) => chapterOfTask(t.topicId) === c);
        if (!items.length) return null;
        return (
          <section key={c} className="mt-8">
            <h2 className="text-xl font-bold">{CHAPTER_NAME[c]}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#/code/${t.id}`}
                    className="flex h-full flex-col rounded-card border border-line bg-surface p-4 no-underline hover:border-brand"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {LEVEL_NAME[t.level]}
                      {t.exam && ' · Klausuraufgabe'}
                      {d.done.includes(`code:${t.id}`) && <span className="ml-2 text-ok">✓ gelöst</span>}
                    </span>
                    <span className="mt-1 font-bold">{t.title}</span>
                    <span className="mt-1 text-sm text-muted">{topicById(t.topicId)?.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
