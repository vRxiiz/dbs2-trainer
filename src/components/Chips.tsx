/** Filterleiste aus Auswahl-Chips */
export function Chips<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-28 text-sm font-semibold">{label}</span>
      {options.map(([v, l]) => (
        <button
          key={String(v)}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full border px-3 py-1 text-sm ${value === v ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
