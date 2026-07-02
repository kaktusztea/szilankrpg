/** Radios row — compact numbered buttons (MF fok, végtagvédettség, rongálódás, stb.) */
export function FokRadios({ values, current, onSelect }: {
  values: number[];
  current: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="fort-fok-radios">
      {values.map(n => (
        <button key={n} className={`fort-fok-btn${current === n ? ' active' : ''}`} onClick={() => onSelect(n)}>{n}</button>
      ))}
    </div>
  );
}

/** Column picker — vertical list of labeled options */
export function ColumnPicker<T extends string>({ options, current, onSelect, wide }: {
  options: { value: T; label: string }[];
  current: T;
  onSelect: (v: T) => void;
  wide?: boolean;
}) {
  const cls = wide ? 'fort-fok-btn he-picker-btn-wide' : 'fort-fok-btn he-picker-btn';
  return (
    <div className="he-column-layout">
      {options.map(o => (
        <button key={o.value} className={`${cls}${current === o.value ? ' active' : ''}`} onClick={() => onSelect(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Idea grid — 3-row grid (negatives / zero / positives) */
export function IdeaGrid({ minIdea, maxIdea, current, onSelect }: {
  minIdea: number;
  maxIdea: number;
  current: number;
  onSelect: (v: number) => void;
}) {
  const negatives = Array.from({ length: -minIdea }, (_, i) => minIdea + i);
  const positives = Array.from({ length: maxIdea }, (_, i) => i + 1);
  const btn = (n: number) => (
    <button key={n} className={`fort-fok-btn he-idea-cell${current === n ? ' active' : ''}`} onClick={() => onSelect(n)}>
      {n > 0 ? `+${n}` : n}
    </button>
  );
  const singleRow = maxIdea <= 1;
  return (
    <div className="he-idea-grid">
      {singleRow ? (
        <div className="he-idea-row">{[...negatives, 0, ...positives].map(btn)}</div>
      ) : (
        <>
          <div className="he-idea-row">{negatives.map(btn)}</div>
          <div className="he-idea-row">{btn(0)}</div>
          <div className="he-idea-row">{positives.map(btn)}</div>
        </>
      )}
    </div>
  );
}

/** Level grid — button grid for skill level selection */
export function SzintGrid({ current, maxSzint, onSelect, label }: {
  current: number;
  maxSzint: number;
  onSelect: (v: number) => void;
  label: string;
}) {
  return (
    <>
      <label>{label}</label>
      <div className="kep-szint-grid">
        {Array.from({ length: maxSzint }, (_, i) => i + 1).map(n => (
          <button key={n} className={`fort-fok-btn${current === n ? ' active' : ''}`} onClick={() => onSelect(n)}>{n}</button>
        ))}
      </div>
    </>
  );
}
