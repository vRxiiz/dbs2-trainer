import { useState } from 'react';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { SqlEditor } from '../components/SqlEditor';
import { StatementOutput } from '../components/SqlOutput';
import { scenarioById, scenarios } from '../content/scenarios';
import { loadDraft, saveDraft } from '../progress';
import type { StatementResult } from '../sql/oracle';
import { runPlayground } from '../sql/sqlGrading';
import { useSql } from '../useSql';

const HEAD = '-- Freie Spielwiese. Mehrere Anweisungen mit ; trennen, Strg/Cmd+Enter führt aus.\n';

const START: Record<string, string> = {
  coworkers: `${HEAD}CREATE OR REPLACE VIEW project_lead_data AS
SELECT p.name AS project, c.name AS leader, c.salary
FROM projects p JOIN coworkers c ON c.id = p.leader;

SELECT * FROM project_lead_data;`,
  honig: `${HEAD}CREATE MATERIALIZED VIEW mv_menge BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS
SELECT b.bienenart, SUM(h.menge) AS menge
FROM bienenvolk b JOIN gesammelt g ON g.volk_id = b.volk_id
JOIN honigernte h ON h.ernte_id = g.ernte_id
GROUP BY b.bienenart;

UPDATE honigernte SET menge = menge * 2;
SELECT * FROM mv_menge;           -- noch der alte Schnappschuss
EXEC DBMS_MVIEW.REFRESH('mv_menge');
SELECT * FROM mv_menge;           -- jetzt aktuell`,
  hotel: `${HEAD}SELECT s.stadtname, COUNT(*) AS anzahl_buchungen
FROM buchung b
JOIN hotel h ON h.hotel_id = b.hotel_id
JOIN stadt s ON s.stadt_id = h.stadt_id
WHERE EXTRACT(YEAR FROM b.anreise) = 2021
GROUP BY s.stadtname;`,
};

export function Playground() {
  const { SQL, error } = useSql();
  const [scenario, setScenario] = useState(() => loadDraft('spielwiese-szenario', 'coworkers'));
  const [code, setCode] = useState(() => loadDraft(`spielwiese:${scenario}`, START[scenario] ?? ''));
  const [results, setResults] = useState<StatementResult[] | null>(null);
  const run = () => SQL && setResults(runPlayground(SQL, code, scenario));

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold">Spielwiese</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Beliebige Abfragen, Views und Änderungen ausprobieren. Jeder Lauf startet mit dem ursprünglichen Datenbestand. Der
        Trainer läuft mit SQLite und ahmt Oracle nach: Views laufen echt, Materialized Views werden als Schnappschuss
        gespeichert und erst mit DBMS_MVIEW.REFRESH (oder bei ON COMMIT mit COMMIT) neu befüllt. INMEMORY-Optionen und
        BITMAP-Indexe werden geprüft, aber nicht wirklich umgesetzt. PL/SQL (Blöcke, Prozeduren, Trigger) läuft hier nicht,
        dafür gibt es die Code-Aufgaben.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Fall-Datenbank">
        {scenarios.map((s) => (
          <button
            key={s.id}
            aria-pressed={scenario === s.id}
            onClick={() => {
              setScenario(s.id);
              saveDraft('spielwiese-szenario', s.id);
              setCode(loadDraft(`spielwiese:${s.id}`, START[s.id] ?? ''));
              setResults(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${scenario === s.id ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="min-w-0">
          <ScenarioBrowser key={scenario} SQL={SQL} scenario={scenario} open />
        </section>
        <section className="min-w-0 space-y-4">
          <SqlEditor
            value={code}
            onChange={(v) => {
              setCode(v);
              saveDraft(`spielwiese:${scenario}`, v);
            }}
            onRun={run}
            label={`SQL-Editor (${scenarioById(scenario).name})`}
          />
          <button
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50"
            onClick={run}
            disabled={!SQL}
          >
            Ausführen
          </button>
          {error && <p className="text-sm text-bad">{error}</p>}
          {results && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Ausgabe</h2>
              <StatementOutput results={results} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
