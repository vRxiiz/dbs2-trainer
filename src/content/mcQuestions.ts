// Wissensfragen je Kapitel. Die Fragen selbst stehen in content/fragen/k01.ts … k07.ts,
// eigenständig formuliert nach den Vorlesungsfolien, Übungen und der Altklausur.
// correct: Indizes der richtigen Optionen. multi: Mehrfachauswahl (wird so angekuendigt).

import type { Chapter } from './chapters';
import { k01 } from './fragen/k01';
import { k02 } from './fragen/k02';
import { k03 } from './fragen/k03';
import { k04 } from './fragen/k04';
import { k05 } from './fragen/k05';
import { k06 } from './fragen/k06';
import { k07 } from './fragen/k07';

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
  /** Herkunft, z. B. „Folien Trigger“ oder „Übung 8, Frage 3“ */
  source: string;
}

export const mcQuestions: McQuestion[] = [...k01, ...k02, ...k03, ...k04, ...k05, ...k06, ...k07];
