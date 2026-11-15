import './common.css';
/** Radios row - compact numbered buttons (MF fok, végtagvédettség, rongálódás, stb.) */
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

/** Column picker - vertical list of labeled options */
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

/** One preview cell under the Idea scale: label, resulting value, change vs. the base (gyári) Idea. */
export interface IdeaElőnézet { címke: string; érték: string; változás?: number }

/**
 * Idea picker: one-row scale (min … 0 … max; negative side reddish, positive greenish) + a preview of what
 * the selected Idea gives. A tap applies the value and the popup stays open (try values); a second tap on the
 * already selected value confirms + closes (`onKész`). Tap outside / Escape is handled by the popup itself.
 */
export function IdeaSkala({ minIdea, maxIdea, current, onSelect, onKész, előnézet }: {
  minIdea: number;
  maxIdea: number;
  current: number;
  onSelect: (v: number) => void;
  onKész: () => void;
  előnézet?: IdeaElőnézet[];
}) {
  const értékek = Array.from({ length: maxIdea - minIdea + 1 }, (_, i) => minIdea + i);
  return (
    <div className="idea-skala">
      <div className="idea-skala-sor">
        {értékek.map(n => (
          <button key={n} type="button" aria-pressed={current === n}
            className={`idea-skala-cella${n < 0 ? ' neg' : n > 0 ? ' poz' : ' nulla'}${current === n ? ' active' : ''}`}
            onClick={() => (n === current ? onKész() : onSelect(n))}>
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
      {előnézet && előnézet.length > 0 && (
        <div className="idea-elonezet">
          {előnézet.map(e => (
            <div key={e.címke} className="idea-elonezet-cella">
              <span className="idea-elonezet-cimke">{e.címke}</span>
              <span className="idea-elonezet-ertek">
                {e.érték}
                {e.változás ? <span className={e.változás > 0 ? 'idea-poz' : 'idea-neg'}> {e.változás > 0 ? '+' : ''}{e.változás}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="idea-skala-sugo">Újra a kiválasztottra koppintva bezárul</div>
    </div>
  );
}

/** Level grid - button grid for skill level selection */
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
