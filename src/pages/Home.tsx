import { config } from '../config';
import { CHAPTER_NAME, EXAM_MODES, type Chapter, type ExamMode } from '../content/chapters';
import { codeTasks } from '../content/codeTasks';
import { mcQuestions } from '../content/mcQuestions';
import { viewExercises } from '../content/viewExercises';
import { useProgress } from '../progress';
import { readiness } from '../progressCatalog';

interface Module {
  chapter?: Chapter;
  label: string;
  title: string;
  text: string;
  links: { label: string; href: string }[];
}

const nCode = (c: Chapter) => codeTasks.filter((t) => t.topicId.startsWith(c)).length;
const nMc = (c: Chapter) => mcQuestions.filter((q) => q.chapter === c).length;
const learn = (c: Chapter) => ({ label: `${nMc(c)} Wissensfragen`, href: `#/lernen/kapitel-${c}` });

const modules: Module[] = [
  {
    chapter: '01',
    label: 'Kapitel 01',
    title: CHAPTER_NAME['01'],
    text: 'B-Baum einfügen, Bitmap-Index aufstellen und Indexe in SQL anlegen. Rechentrainer mit Übungsblatt- und Zufallsdaten.',
    links: [{ label: 'Rechentrainer', href: '#/rechnen' }, { label: 'Code-Aufgaben', href: '#/code/kapitel/01' }, learn('01')],
  },
  {
    chapter: '02',
    label: 'Kapitel 02',
    title: CHAPTER_NAME['02'],
    text: `Anonyme Blöcke, Prozeduren, Funktionen, Cursor, Exceptions und Packages: ${nCode('02')} Code-Aufgaben aus Übung 2a/2b, Folien und Altklausur.`,
    links: [{ label: 'Code-Aufgaben', href: '#/code/kapitel/02' }, learn('02')],
  },
  {
    chapter: '03',
    label: 'Kapitel 03',
    title: CHAPTER_NAME['03'],
    text: `BEFORE/AFTER, Zeilen- und Statement-Trigger, Mutating Table und Compound-Trigger: ${nCode('03')} Aufgaben, darunter die Softwarelizenzen.`,
    links: [{ label: 'Code-Aufgaben', href: '#/code/kapitel/03' }, learn('03')],
  },
  {
    chapter: '04',
    label: 'Kapitel 04',
    title: CHAPTER_NAME['04'],
    text: `${viewExercises.length} View- und MV-Aufgaben, die echt ausgeführt und am Ergebnis geprüft werden, dazu INSTEAD OF-Trigger.`,
    links: [{ label: 'Views und MVs', href: '#/views' }, { label: 'Code-Aufgaben', href: '#/code/kapitel/04' }, learn('04')],
  },
  {
    chapter: '05',
    label: 'Kapitel 05',
    title: CHAPTER_NAME['05'],
    text: 'Lauflänge, Bitvektor, Dictionary, Frame of Reference und Differenz rechnen, dazu Oracle In-Memory.',
    links: [{ label: 'Kompression', href: '#/rechnen/kompression' }, { label: 'Code-Aufgaben', href: '#/code/kapitel/05' }, learn('05')],
  },
  {
    chapter: '06',
    label: 'Kapitel 06',
    title: CHAPTER_NAME['06'],
    text: 'Schnittstellen wie JDBC und ODBC, SQL-Injection, Views und ORM.',
    links: [learn('06')],
  },
  {
    chapter: '07',
    label: 'Kapitel 07',
    title: CHAPTER_NAME['07'],
    text: 'Big Data, NoSQL-Typen, CAP und BASE, inklusive Übung 8.',
    links: [learn('07')],
  },
  {
    label: 'alle Kapitel',
    title: 'SQL-Spielwiese',
    text: 'Coworkers, Honigernten und Hotelbuchungen im Browser: SQL, Views und Materialized Views ausprobieren.',
    links: [{ label: 'Starten', href: '#/spielwiese' }],
  },
  {
    label: 'Klausurvorbereitung',
    title: 'Prüfungsmodus',
    text: 'MCT 1, MCT 2 und die E-Klausur mit Trigger, Materialized View und Prozedur, mit Zeitlimit und Auswertung nach Kapiteln.',
    links: [{ label: 'Starten', href: '#/pruefung' }],
  },
];

export function Home() {
  const d = useProgress();
  const r = readiness(d);
  const modes = Object.keys(EXAM_MODES) as ExamMode[];
  return (
    <>
      <h1 className="text-3xl font-bold">{config.appName}</h1>
      <p className="mt-2 max-w-2xl text-muted">{config.tagline}. Die Module folgen den Vorlesungsfolien. Keine Anmeldung, kein Tracking.</p>
      <a href="#/fortschritt" className="mt-6 block rounded-card border-2 border-brand bg-surface p-5 no-underline">
        <span className="block text-sm font-semibold uppercase tracking-wide text-muted">Dein Stand</span>
        <span className="mt-2 grid gap-3 sm:grid-cols-3">
          {modes.map((m) => (
            <span key={m} className={`block rounded-lg border p-3 ${r[m].ready ? 'border-ok bg-ok-bg' : 'border-line'}`}>
              <span className="block font-bold">
                {EXAM_MODES[m].name}: {r[m].ready ? 'bereit' : 'noch nicht bereit'}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {Math.min(r[m].streak, config.readyStreak)} von {config.readyStreak} in Folge bestanden · {Math.round(r[m].sure * 100)} % sicher
              </span>
            </span>
          ))}
        </span>
        <span className="mt-3 block font-semibold underline">Zum Fortschritt →</span>
      </a>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.title} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{m.label}</span>
            <h2 className="mt-1 text-lg font-bold">{m.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{m.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {m.links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={
                    i === 0
                      ? 'inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline'
                      : 'inline-block rounded-lg border border-line px-4 py-2 font-semibold no-underline'
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
