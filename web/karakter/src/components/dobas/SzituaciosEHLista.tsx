import type { SzituációsEH } from '../../engine/statusz-proba';
import './dobas.css';

/**
 * Situational (KM-judged) státusz Előny/Hátrány rows under the E/H stepper: off by default, a tap toggles
 * the row into the level (engine_spec §22.4 `szituációs`). Renders nothing when the list is empty.
 */
export function SzituaciosEHLista({ lista, be, onVált }: {
  lista: SzituációsEH[];
  be: ReadonlySet<string>;
  onVált: (kulcs: string) => void;
}) {
  if (lista.length === 0) return null;
  return (
    <div className="forras-lista forras-szit">
      {lista.map(s => {
        const aktív = be.has(s.kulcs);
        return (
          <button key={s.kulcs} type="button" className={`forras-szit-sor${aktív ? ' aktiv' : ''}`} aria-pressed={aktív} onClick={() => onVált(s.kulcs)}>
            <b className={`forras-badge ${s.érték > 0 ? 'előny' : 'hátrány'}`}>{s.érték > 0 ? `Előny+${s.érték}` : `Hátrány${s.érték}`}</b>
            {' '}{s.címke}{s.megjegyzés ? ` - ${s.megjegyzés}` : ''}
          </button>
        );
      })}
    </div>
  );
}

/** Sum of the toggled-on situational rows (added to the E/H level before clamping). */
export function szituációsSzint(lista: SzituációsEH[], be: ReadonlySet<string>): number {
  return lista.reduce((s, x) => s + (be.has(x.kulcs) ? x.érték : 0), 0);
}
