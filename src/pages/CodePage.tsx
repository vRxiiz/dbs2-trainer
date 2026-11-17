import { EditorExercise } from '../components/EditorExercise';
import { CHAPTER_NAME } from '../content/chapters';
import { codeTasks } from '../content/codeTasks';
import type { CodeTask } from '../content/codeTypes';
import { RECONSTRUCTED_NOTE, schemas } from '../content/schemas';
import { topicById } from '../content/topics';
import { gradeCode } from '../logic/codeGrading';

export function SchemaBox({ scenario }: { scenario: CodeTask['scenario'] }) {
  const s = schemas[scenario];
  if (!s) return null;
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h2 className="mb-2 font-bold">Schema: {s.name}</h2>
      <ul className="space-y-1 font-mono text-xs leading-5">
        {s.tables.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {s.note && <p className="mt-2 text-sm">{s.note}</p>}
      <p className="mt-2 text-xs text-muted">{RECONSTRUCTED_NOTE}</p>
    </div>
  );
}

export function CodePage({ id }: { id: string }) {
  const task = codeTasks.find((t) => t.id === id);
  if (!task) {
    return (
      <>
        <h1 className="text-2xl font-bold">Aufgabe nicht gefunden</h1>
        <a href="#/code" className="underline">
          Zur Übersicht
        </a>
      </>
    );
  }
  const topic = topicById(task.topicId);
  const chapter = topic?.chapter ?? '';
  const same = codeTasks.filter((t) => topicById(t.topicId)?.chapter === chapter);
  const next = same[same.indexOf(task) + 1];
  return (
    <EditorExercise
      key={task.id}
      progressId={`code:${task.id}`}
      backHref={chapter ? `#/code/kapitel/${chapter}` : '#/code'}
      backLabel={chapter ? `Code-Aufgaben: ${CHAPTER_NAME[chapter]}` : 'Code-Aufgaben'}
      title={task.title}
      topic={`${topic?.title ?? ''} · Quelle: ${task.source}`}
      task={task.task}
      aside={<SchemaBox scenario={task.scenario} />}
      hints={task.hints}
      solution={task.solution}
      ready
      checkOnly
      editorLabel="PL/SQL-Editor"
      nextHref={next ? `#/code/${next.id}` : undefined}
      run={(code) => {
        const r = gradeCode(task, code);
        return {
          results: [],
          checks: r.checks,
          passed: r.passed,
          details: (
            <p className="text-sm">
              Punkte für die Fachprüfungen: <strong>{r.score}</strong> von {r.max}
            </p>
          ),
        };
      }}
    />
  );
}
