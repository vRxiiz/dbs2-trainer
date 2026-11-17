// Uebersicht der Rechentrainer (Kapitel 1 Speicherstrukturen, Kapitel 5 Kompression)
const trainers = [
  {
    href: '#/rechnen/bbaum',
    label: 'Kapitel 01',
    title: 'B-Baum',
    text: 'Schlüssel in einen B-Baum einfügen, Splits nachvollziehen und das Ergebnis ebenenweise angeben.',
  },
  {
    href: '#/rechnen/bitmap',
    label: 'Kapitel 01',
    title: 'Bitmap-Index',
    text: 'Bit-Listen je Wert aufstellen und den passenden CREATE BITMAP INDEX schreiben.',
  },
  {
    href: '#/rechnen/kompression',
    label: 'Kapitel 05',
    title: 'Kompression im Column Store',
    text: 'Lauflänge, Bitvektor, Dictionary, Frame of Reference und Differenz: das passende Verfahren wählen und rechnen.',
  },
];

export function CalcOverview() {
  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Rechentrainer</h1>
      <p className="mt-2 max-w-2xl text-muted">Mit den Daten der Übungsblätter oder mit Zufallsdaten. Jede Eingabe wird sofort geprüft.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {trainers.map((t) => (
          <li key={t.href} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</span>
            <h2 className="mt-1 text-lg font-bold">{t.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{t.text}</p>
            <a href={t.href} className="mt-4 inline-block self-start rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline">
              Starten
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
