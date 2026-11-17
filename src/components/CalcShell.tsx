import type { ReactNode } from 'react';

/** Rahmen der Rechentrainer: Ueberschrift, Rueckweg, Aufgabe links, Eingabe rechts */
export function CalcShell({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <>
      <a href="#/rechnen" className="inline-block py-2 text-sm underline">
        ← Rechentrainer
      </a>
      <h1 className="mt-2 text-2xl font-bold">{title}</h1>
      <div className="mt-2 max-w-3xl text-muted">{intro}</div>
      <div className="mt-6 space-y-4">{children}</div>
    </>
  );
}

export const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
export const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold disabled:opacity-50';
export const card = 'rounded-card border border-line bg-surface p-5';

export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div role="status" className={`rounded-card border p-4 ${ok ? 'border-ok bg-ok-bg' : 'border-bad bg-bad-bg'}`}>
      <p className={`font-bold ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'Richtig.' : 'Noch nicht richtig.'}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
