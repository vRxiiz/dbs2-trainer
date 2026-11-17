import type { McQuestion } from '../mcQuestions';

/** Kurzform: Kapitel ergibt sich aus der Themen-ID, multi aus der Zahl richtiger Antworten */
export function q(
  id: string,
  topicId: string,
  question: string,
  options: string[],
  correct: number | number[],
  explanation: string,
  source: string,
): McQuestion {
  const c = Array.isArray(correct) ? correct : [correct];
  return { id, chapter: topicId.slice(0, 2), topicId, question, options, correct: c, ...(c.length > 1 ? { multi: true } : {}), explanation, source };
}
