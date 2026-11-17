// Strukturpruefung fuer frei geschriebenen PL/SQL-, Trigger- und View-Code.
// Der Code wird nicht ausgefuehrt: geprueft wird, ob die Pflichtbausteine einer Aufgabe
// vorkommen (und verbotene fehlen) und ob die Bloecke sauber geschlossen sind.

import type { CodeTask } from '../content/codeTypes';
import type { CheckResult } from '../sql/ddlGrading';

/** Platzhalter fuer String-Inhalte, damit Schluesselwoerter in Texten nicht zaehlen */
const MASK = "'…'";

/** Kommentare raus, Strings maskiert, Whitespace zusammengefasst, Grossbuchstaben */
export function normalizeCode(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === '-' && code[i + 1] === '-') {
      while (i < code.length && code[i] !== '\n') i++;
      out += ' ';
    } else if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      i = end < 0 ? code.length : end + 2;
      out += ' ';
    } else if (c === "'") {
      // String bis zum schliessenden Hochkomma ('' ist ein Hochkomma im String)
      let j = i + 1;
      for (;;) {
        if (j >= code.length) break;
        if (code[j] === "'" && code[j + 1] === "'") j += 2;
        else if (code[j] === "'") break;
        else j++;
      }
      if (j >= code.length) {
        out += "'"; // offener String: bleibt als einzelnes Hochkomma stehen
        i = code.length;
      } else {
        out += MASK;
        i = j + 1;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out.replace(/\s+/g, ' ').trim().toUpperCase().replace(/'…'/gi, MASK);
}

const PLSQL = /\b(BEGIN|DECLARE|TRIGGER|PROCEDURE|FUNCTION|PACKAGE)\b/;

/** Bilanz von BEGIN/END, IF/END IF, LOOP/END LOOP, CASE/END und geschlossenen Strings */
export function syntaxChecks(code: string): CheckResult[] {
  const n = normalizeCode(code);
  if (!n) return [{ label: 'Code vorhanden', ok: false, hint: 'Schreibe zuerst deine Lösung in den Editor.' }];
  const results: CheckResult[] = [];
  const openString = n.replaceAll(MASK, '').includes("'");
  results.push({
    label: 'Strings geschlossen',
    ok: !openString,
    hint: openString ? 'Ein Text in Hochkommas wird nicht geschlossen.' : undefined,
  });
  if (!PLSQL.test(n)) return results;

  const words = n.replaceAll(MASK, ' ').match(/[A-Z_][A-Z0-9_$#]*/g) ?? [];
  const stack: ('BLOCK' | 'BEGIN' | 'IF' | 'LOOP' | 'CASE')[] = [];
  const err = { block: '', if: '', loop: '' };
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    const prev = words[k - 1];
    const next = words[k + 1];
    if (w === 'BEGIN') stack.push('BEGIN');
    else if (w === 'COMPOUND' && next === 'TRIGGER') stack.push('BLOCK');
    else if (w === 'PACKAGE' && (prev === 'CREATE' || prev === 'REPLACE' || prev === 'EDITIONABLE')) stack.push('BLOCK');
    else if (w === 'IF' && prev !== 'END') stack.push('IF');
    else if (w === 'LOOP' && prev !== 'END') stack.push('LOOP');
    else if (w === 'CASE' && prev !== 'END') stack.push('CASE');
    else if (w === 'END') {
      const want = next === 'IF' || next === 'LOOP' || next === 'CASE' ? next : null;
      const top = stack.pop();
      if (want) {
        if (top === want) continue;
        if (want === 'IF') err.if ||= 'Ein END IF passt zu keinem offenen IF.';
        else if (want === 'LOOP') err.loop ||= 'Ein END LOOP passt zu keiner offenen Schleife.';
        else err.block ||= 'Ein END CASE passt zu keinem offenen CASE.';
        if (top) stack.push(top);
      } else if (top === 'IF') err.if ||= 'Vor einem END fehlt ein END IF;';
      else if (top === 'LOOP') err.loop ||= 'Vor einem END fehlt ein END LOOP;';
      else if (!top) err.block ||= 'Ein END hat kein passendes BEGIN.';
    }
  }
  for (const open of stack) {
    if (open === 'IF') err.if ||= 'Ein IF wird nicht mit END IF; geschlossen.';
    else if (open === 'LOOP') err.loop ||= 'Eine Schleife wird nicht mit END LOOP; geschlossen.';
    else err.block ||= 'Ein Block wird nicht mit END; geschlossen.';
  }
  const add = (label: string, e: string) => results.push({ label, ok: !e, hint: e || undefined });
  add('Blöcke: BEGIN … END;', err.block);
  add('IF … END IF;', err.if);
  add('LOOP … END LOOP;', err.loop);
  return results;
}

const matches = (src: string, n: string) => new RegExp(src, 'su').test(n);

/** Fachpruefungen (zaehlen fuer Punkte) plus Syntaxbilanz (zaehlt nur fuer bestanden) */
export function gradeCode(task: CodeTask, code: string) {
  const n = normalizeCode(code);
  const checks: CheckResult[] = [];
  let score = 0;
  let max = 0;
  for (const c of task.checks) {
    const pts = c.points ?? 1;
    max += pts;
    const ok =
      !!n &&
      (c.all ?? []).every((r) => matches(r, n)) &&
      (!c.any?.length || c.any.some((r) => matches(r, n))) &&
      !(c.none ?? []).some((r) => matches(r, n));
    if (ok) score += pts;
    checks.push({ label: c.label, ok, hint: ok ? undefined : c.hint });
  }
  const syntax = syntaxChecks(code);
  const all = [...checks, ...syntax];
  return { checks: all, passed: all.every((c) => c.ok), score, max };
}
