import './dobas.css';

/** Display label of an Előny/Hátrány level: "Előny +1" / "Alap" / "Hátrány -2". */
function szintFelirat(szint: number): string {
  if (szint > 0) return `Előny +${szint}`;
  if (szint < 0) return `Hátrány -${-szint}`;
  return 'Alap';
}

/**
 * Előny/Hátrány stepper (− value +) - the compact alternative of ElonyPicker's 5 chips (Támadó / Célzó dobás).
 * Same range as ElonyPicker (-2 … +2).
 */
export function ElonyLepteto({ szint, onChange, min = -2, max = 2 }: {
  szint: number;
  onChange: (szint: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="elony-lepteto">
      <button type="button" className="elony-lepteto-pm" disabled={szint <= min} aria-label="Hátrány felé"
        onClick={() => onChange(Math.max(min, szint - 1))}>−</button>
      <span className={`elony-lepteto-ertek${szint > 0 ? ' elony' : szint < 0 ? ' hatrany' : ''}`}>{szintFelirat(szint)}</span>
      <button type="button" className="elony-lepteto-pm" disabled={szint >= max} aria-label="Előny felé"
        onClick={() => onChange(Math.min(max, szint + 1))}>+</button>
    </div>
  );
}
