import './dobas.css';

/**
 * Segmented scale bar: one tap picks a value (negative = red, 0 = neutral, positive = green).
 * Used by the hand-bonus pickers (Sebzés SP bonus, Támadó / Célzó / Manőver TÉ bonus).
 * `előjeles`: show "+3" / "-3" instead of the bare number (only when the segments are wide enough).
 */
export function SkalaSav({ értékek, érték, onSelect, előjeles = false }: {
  értékek: number[];
  érték: number;
  onSelect: (v: number) => void;
  előjeles?: boolean;
}) {
  return (
    <div className="skala-sav" role="group">
      {értékek.map(v => (
        <button key={v} type="button" aria-pressed={érték === v} aria-label={v > 0 ? `+${v}` : String(v)}
          className={`${v > 0 ? 'skala-pos' : v < 0 ? 'skala-neg' : 'skala-nulla'}${érték === v ? ' active' : ''}`}
          onClick={() => onSelect(v)}>
          {előjeles && v !== 0 ? (v > 0 ? `+${v}` : v) : Math.abs(v)}
        </button>
      ))}
    </div>
  );
}

/** "levonás … bónusz" caption under a scale bar that runs from negative to positive. */
export function SkalaSavFelirat() {
  return <div className="skala-sav-felirat"><span>levonás</span><span>bónusz</span></div>;
}
