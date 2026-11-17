import { useEffect, useState, type ReactNode } from 'react';
import { config } from './config';
import { Layout } from './components/Layout';
import { BUILTIN_CHAPTERS, type Chapter } from './content/chapters';
import { BitmapPage } from './pages/BitmapPage';
import { BTreePage } from './pages/BTreePage';
import { CalcOverview } from './pages/CalcOverview';
import { CodeList } from './pages/CodeList';
import { CodePage } from './pages/CodePage';
import { CompressionPage } from './pages/CompressionPage';
import { ExamPage } from './pages/ExamPage';
import { Home } from './pages/Home';
import { LearnPage } from './pages/LearnPage';
import { Playground } from './pages/Playground';
import { ProgressPage } from './pages/ProgressPage';
import { SqlExercisePage } from './pages/SqlExercisePage';
import { SqlList } from './pages/SqlList';

// Hash-Routing: funktioniert statisch ueberall, auch direkt aus dem Dateisystem.
function useRoute() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => {
    const on = () => {
      setHash(location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#/, '').split('/').filter(Boolean);
}

const asChapter = (c?: string) => (BUILTIN_CHAPTERS as string[]).includes(c ?? '') ? (c as Chapter) : undefined;

function route(page?: string, id?: string, id2?: string): ReactNode {
  switch (page) {
    case 'lernen': {
      const ch = id?.startsWith('kapitel-') ? asChapter(id.slice(8)) : undefined;
      return ch ? <LearnPage key={id} chapter={ch} /> : <LearnPage key={id ?? 'alle'} topicId={id} />;
    }
    case 'code':
      if (id === 'kapitel') return <CodeList key={id2 ?? 'alle'} chapter={asChapter(id2)} />;
      return id ? <CodePage key={id} id={id} /> : <CodeList />;
    case 'views':
      return id ? <SqlExercisePage key={id} id={id} /> : <SqlList />;
    case 'spielwiese':
      return <Playground />;
    case 'rechnen':
      if (id === 'bbaum' || id === 'btree') return <BTreePage />;
      if (id === 'bitmap') return <BitmapPage />;
      if (id === 'kompression') return <CompressionPage />;
      return <CalcOverview />;
    case 'pruefung':
      return <ExamPage />;
    case 'fortschritt':
      return <ProgressPage />;
    default:
      return <Home />;
  }
}

const PAGE_TITLE: Record<string, string> = {
  lernen: 'Wissensfragen lernen',
  code: 'Code-Aufgaben',
  views: 'Views und Materialized Views',
  spielwiese: 'SQL-Spielwiese',
  rechnen: 'Rechentrainer',
  pruefung: 'Prüfungsmodus',
  fortschritt: 'Fortschritt',
};

export function App() {
  const [page, id, id2] = useRoute();
  // Barrierefreiheit: Seitentitel je Seite (WCAG 2.4.2) und Fokus auf den Inhalt nach Seitenwechsel (2.4.3)
  useEffect(() => {
    const base = config.title || config.appName;
    document.title = page && PAGE_TITLE[page] ? `${PAGE_TITLE[page]} · ${base}` : base;
    const main = document.getElementById('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      if (id !== undefined || page) main.focus({ preventScroll: true });
    }
  }, [page, id]);
  return <Layout>{route(page, id, id2)}</Layout>;
}
