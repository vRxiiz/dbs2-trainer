// Wissensfragen je Kapitel. Die Fragen selbst stehen in content/fragen/k01.ts … k07.ts.
// correct: Indizes der richtigen Optionen. multi: Mehrfachauswahl (wird so angekuendigt).

import type { Chapter } from './chapters';

export { BUILTIN_CHAPTERS, CHAPTER_NAME, type Chapter } from './chapters';

export interface McQuestion {
  id: string;
  chapter: Chapter;
  /** Thema nach den Vorlesungsfolien, siehe content/topics.ts */
  topicId: string;
  question: string;
  options: string[];
  correct: number[];
  multi?: boolean;
  explanation: string;
  /** Herkunft, z. B. „Folien Kap. 3“ oder „Übung 8“ */
  source: string;
}

export const mcQuestions: McQuestion[] = [];
