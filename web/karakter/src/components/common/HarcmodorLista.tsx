import { Ikon } from './Ikon';
import type { Dispatch, SetStateAction } from 'react';
import type { Kepzettseg } from '../../engine/types';
import { képzKulcs, bontKépzKulcs } from '../../engine/azonosito';
import { KÉPZETTSÉG_SZINT_MAGAS } from '../../ui-constants';
import { kattinthatóProps } from '../a11y';
import { FelvevőGomb, PluszGomb } from '../picker/ListaPicker';
import './common.css';

export interface HarcmodorListaProps {
  /** A választható képzettség-kulcsok (pl. "harcmodor/kardvívás"). */
  kulcsok: string[];
  felirat: (kulcs: string) => string;
  /** A "+ … felvétel" select első opciója. */
  felvételFelirat: string;
  /** Ha megadott: címsor, a felvétel "+" chip a sor végén (különben a lista alján a "+ …" gomb). */
  fejléc?: string;
  tsz: number;
  képzettségek: Kepzettseg[];
  setKépzettségek: Dispatch<SetStateAction<Kepzettseg[]>>;
  gameMode: boolean;
  onDeleteKepz: (kulcs: string) => void;
  onKepzSzint: (kulcs: string) => void;
}

/** Harcmodor-képzettségek listája (felvettek + felvétel select) - a Harcértékek és a Távharc fül közös része. */
export function HarcmodorLista({ kulcsok, felirat, felvételFelirat, fejléc, tsz, képzettségek, setKépzettségek, gameMode, onDeleteKepz, onKepzSzint }: HarcmodorListaProps) {
  const felvett = képzettségek.filter(kp => kulcsok.includes(képzKulcs(kp)) && kp.szint > 0);
  const nemFelvett = kulcsok.filter(n => !felvett.some(kp => képzKulcs(kp) === n));

  const felvétel = (kulcs: string) => {
    setKépzettségek(prev => [...prev, { ...bontKépzKulcs(kulcs), szint: 0 }]);
    onKepzSzint(kulcs);
  };
  const cím = felvételFelirat.replace(/^\+\s*/, '').replace(/\.+$/, '');
  const opciók = nemFelvett.map(n => ({ érték: n, név: felirat(n) }));
  const lehetFelvenni = !gameMode && nemFelvett.length > 0;

  return (
    <div className="he-harcmodor-list he-harcmodor-col">
      {fejléc && (
        <h3 className="he-section-cim">
          {fejléc}
          {lehetFelvenni && <span className="csoport-uj"><PluszGomb cím={cím} opciók={opciók} onVálaszt={felvétel} /></span>}
        </h3>
      )}
      {felvett.map(h => {
        const kulcs = képzKulcs(h);
        return (
          <div key={kulcs} className="kep-row-wrapper">
            {/* div + role: a sorban egy törlés-gomb is van (gomb a gombban érvénytelen HTML) */}
            <div className="item-row" {...(!gameMode && kattinthatóProps(() => onKepzSzint(kulcs)))}>
              <span className="kep-név aktiv-flex-1">{felirat(kulcs)}</span>
              {!gameMode && (
                <button type="button" className="item-delete" aria-label={`${felirat(kulcs)} törlése`}
                  onClick={e => { e.stopPropagation(); onDeleteKepz(kulcs); }}><Ikon név="bezár" /></button>
              )}
              <strong className={`kep-szint${h.szint > tsz ? ' kep-over' : h.szint >= KÉPZETTSÉG_SZINT_MAGAS ? ' kep-szint-high' : ''}`}>{h.szint}</strong>
            </div>
          </div>
        );
      })}
      {!fejléc && lehetFelvenni && (
        <FelvevőGomb felirat={felvételFelirat} cím={cím} opciók={opciók} onVálaszt={felvétel} />
      )}
    </div>
  );
}
