import { Ikon } from '../common/Ikon';
import type { Mód } from '../../engine/harc/manover-dobas-calc';
import { FÁZIS_FELIRAT, fejlécChip } from '../../engine/harc/manover-dobas-calc';
import './dobas.css';

type Fázis = 'M' | 'V' | 'E';

/**
 * Popup header chip, phase-aware (the popup covers the HarcHeader VÉ box):
 * - passive mode: always VÉ (manual VÉ reduction booking);
 * - active mode, Megakasztás (M): VÉ (the opponent attacks your VÉ);
 * - active mode, V/E: TÉ (your own attack / roll value matters).
 * The TÉ is shown split (raw weapon TÉ + the Végrehajtás bonus), so it does not seem to contradict the V phase TÉ.
 */
export function ManoverFejlecChip({ mód, aktFázis, fázisok, aktívTÉ, aktívVÉ, téMódosító }: {
  mód: Mód; aktFázis: Fázis | null; fázisok: Fázis[];
  aktívTÉ: number | null; aktívVÉ: number | null; téMódosító: number;
}) {
  if (fejlécChip(mód, aktFázis, fázisok) === 'VÉ') {
    return aktívVÉ != null ? <span className="manover-dobas-ve-chip">VÉ: <strong>{aktívVÉ}</strong></span> : null;
  }
  return aktívTÉ != null ? (
    <span className="manover-dobas-ve-chip">
      TÉ: <strong>{aktívTÉ}</strong>{téMódosító !== 0 && <span className="manover-dobas-te-bonus"> ({téMódosító > 0 ? '+' : ''}{téMódosító})</span>}
    </span>
  ) : null;
}

/**
 * Phase header row: label, then on the right the rolled value + outcome mark of a closed phase
 * (same layout as the Követelmények accordion), or the clickable TÉ chip of the active V phase.
 * The active Ellenpróba title is centered.
 */
export function ManoverFazisFejlec({ fázis, aktív, kész, sikeres, lezártÉrték, téVégső, onTé }: {
  fázis: Fázis; aktív: boolean; kész: boolean;
  /** Success of the closed phase for the manőver (only read when `kész`). */
  sikeres: boolean;
  /** Rolled value of the closed phase (aktív V/E), e.g. "63" or "8 vs 12+MA". */
  lezártÉrték: string | null;
  /** Final Végrehajtás TÉ (aktív mode) - chip on the active V phase, opens the TÉ breakdown. */
  téVégső: number | null;
  onTé: () => void;
}) {
  return (
    <div className={`manover-fazis-label${aktív && fázis === 'E' ? ' manover-fazis-label-kozep' : ''}`}>
      <span>{FÁZIS_FELIRAT[fázis]}</span>
      {kész && lezártÉrték && <span className="manover-fazis-ertek-kesz">{lezártÉrték}</span>}
      {kész && (sikeres
        ? <span className="manover-fazis-ok"><Ikon név="pipa" /></span>
        : <span className="manover-fazis-fail"><Ikon név="kudarc" /></span>
      )}
      {aktív && fázis === 'V' && téVégső != null && (
        <button type="button" className="manover-te-chip" onClick={onTé}>
          TÉ: <strong>{téVégső}</strong> <span className="manover-te-info">ⓘ</span>
        </button>
      )}
    </div>
  );
}

/** Signed value of a modifier pill: dim 0, green +N, red -N. */
function KapszulaÉrték({ n }: { n: number }) {
  if (n === 0) return <span className="dobas-kapszula-db">0</span>;
  return <span className={n > 0 ? 'manover-szit-pos' : 'manover-szit-neg'}>{n > 0 ? '+' : ''}{n}</span>;
}

/**
 * Ellenpróba modifier pills (same look as the Támadó dobás pills): Helyzet (only if the manőver has
 * situational tables; flashes on mount) + MP (only if there is spendable MP). Nothing when neither applies.
 */
export function ManoverKapszulak({ vanSzit, vanMp, szitÖsszeg, szitLehetetlen, szitImmunis, költöttMP, onSzit, onMp }: {
  vanSzit: boolean; vanMp: boolean;
  szitÖsszeg: number; szitLehetetlen: boolean; szitImmunis: boolean; költöttMP: number;
  onSzit: () => void; onMp: () => void;
}) {
  if (!vanSzit && !vanMp) return null;
  return (
    <div className="dobas-kapszulak manover-kapszulak">
      {vanSzit && (
        <button type="button" className="dobas-kapszula manover-szit-btn-flash" onClick={onSzit}>
          Helyzet {szitLehetetlen
            ? <span className="manover-szit-neg">letilt</span>
            : szitImmunis ? <span className="manover-szit-pos">immunis</span>
            : <KapszulaÉrték n={szitÖsszeg} />}
        </button>
      )}
      {vanMp && (
        <button type="button" className="dobas-kapszula" onClick={onMp}>
          MP <KapszulaÉrték n={költöttMP} />
        </button>
      )}
    </div>
  );
}

/** Ellenpróba one-line duel: `<alap> + k10 [H-2] vs <Nehézség> + MA` (the pills below modify the left side). */
export function EllenprobaParbaj({ alap, kocka, hátrány, célszám }: {
  alap: number; kocka: number;
  /** Fixed Hátrány level from a Normál requirement miss (e.g. -2), or null. */
  hátrány: number | null;
  célszám: number;
}) {
  return (
    <div className="manover-ep-parbaj">
      <span>{alap} <span className="manover-ep-op">+</span> k{kocka}
        {hátrány != null && <span className="manover-hatrany2 manover-ep-hatrany">H{hátrány}</span>}
      </span>
      <span className="manover-ep-vs">vs</span>
      <span><span className="manover-celszam-ertek">{célszám}</span> <span className="manover-ep-op">+</span> <span className="manover-ep-ma">MA</span></span>
    </div>
  );
}
