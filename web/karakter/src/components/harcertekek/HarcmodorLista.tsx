import type { Dispatch, SetStateAction } from 'react';
import type { Kepzettseg } from '../../engine/types';
import { képzKulcs, bontKépzKulcs } from '../../engine/azonosito';
import { KÉPZETTSÉG_SZINT_MAGAS } from '../../ui-constants';
import { kattinthatóProps } from '../a11y';

export interface HarcmodorListaProps {
  /** A választható képzettség-kulcsok (pl. "harcmodor/kardvívás"). */
  kulcsok: string[];
  felirat: (kulcs: string) => string;
  /** A "+ … felvétel" select első opciója. */
  felvételFelirat: string;
  tsz: number;
  képzettségek: Kepzettseg[];
  setKépzettségek: Dispatch<SetStateAction<Kepzettseg[]>>;
  gameMode: boolean;
  onDeleteKepz: (kulcs: string) => void;
  onKepzSzint: (kulcs: string) => void;
}

/** Harcmodor-képzettségek listája (felvettek + felvétel select) - a Harcértékek és a Távharc fül közös része. */
export function HarcmodorLista({ kulcsok, felirat, felvételFelirat, tsz, képzettségek, setKépzettségek, gameMode, onDeleteKepz, onKepzSzint }: HarcmodorListaProps) {
  const felvett = képzettségek.filter(kp => kulcsok.includes(képzKulcs(kp)) && kp.szint > 0);
  const nemFelvett = kulcsok.filter(n => !felvett.some(kp => képzKulcs(kp) === n));

  return (
    <div className="he-harcmodor-list he-harcmodor-col">
      {felvett.map(h => {
        const kulcs = képzKulcs(h);
        return (
          <div key={kulcs} className="kep-row-wrapper">
            {/* div + role: a sorban egy törlés-gomb is van (gomb a gombban érvénytelen HTML) */}
            <div className="item-row" {...(!gameMode && kattinthatóProps(() => onKepzSzint(kulcs)))}>
              <span className="kep-név aktiv-flex-1">{felirat(kulcs)}</span>
              {!gameMode && (
                <button type="button" className="item-delete" aria-label={`${felirat(kulcs)} törlése`}
                  onClick={e => { e.stopPropagation(); onDeleteKepz(kulcs); }}>✕</button>
              )}
              <strong className={`kep-szint${h.szint > tsz ? ' kep-over' : h.szint >= KÉPZETTSÉG_SZINT_MAGAS ? ' kep-szint-high' : ''}`}>{h.szint}</strong>
            </div>
          </div>
        );
      })}
      {!gameMode && nemFelvett.length > 0 && (
        <select className="he-add-select" value="" aria-label={felvételFelirat}
          onChange={e => {
            const kulcs = e.target.value;
            if (!kulcs) return;
            setKépzettségek(prev => [...prev, { ...bontKépzKulcs(kulcs), szint: 0 }]);
            onKepzSzint(kulcs);
          }}>
          <option value="">{felvételFelirat}</option>
          {nemFelvett.map(n => <option key={n} value={n}>{felirat(n)}</option>)}
        </select>
      )}
    </div>
  );
}
