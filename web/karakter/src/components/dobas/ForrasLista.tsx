import { Ikon } from '../common/Ikon';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import { hatásBadgeLabel } from './HatasokInfo';
import './dobas.css';

/**
 * Plain list of the Előny/Hátrány sources under the ElonyLepteto (one line each), plus a
 * "kézzel: X · vissza a forrásokra" line when the level was changed by hand.
 */
export function ForrasLista({ hatások, szint, alapSzint, onVissza }: {
  hatások: DobásHatás[];
  /** Current (possibly hand-set) level. */
  szint: number;
  /** Level computed from the sources. */
  alapSzint: number;
  onVissza: () => void;
}) {
  const kézi = szint !== alapSzint;
  if (hatások.length === 0 && !kézi) return null;
  return (
    <div className="forras-lista">
      {hatások.map((h, i) => (
        <span key={i}><b className={`forras-badge ${h.operátor}`}>{hatásBadgeLabel(h)}</b> {h.forrás}</span>
      ))}
      {kézi && (
        <span className="forras-kezi">
          kézzel: {szint > 0 ? `E+${szint}` : szint < 0 ? `H-${-szint}` : 'Alap'}
          <button type="button" className="forras-vissza" onClick={onVissza}><Ikon név="reset" /> vissza a forrásokra</button>
        </span>
      )}
    </div>
  );
}
