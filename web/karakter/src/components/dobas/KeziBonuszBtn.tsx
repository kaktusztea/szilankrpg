import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { SkalaSav, SkalaSavFelirat } from './SkalaSav';
import './dobas.css';

/** Kompakt (ritka) skála értékei: hármas lépések, középen a 0. */
const KOMPAKT: number[] = [-9, -6, -3, 0, 3, 6, 9];
/** Van-e az érték a kompakt grid-ben (különben a picker rögtön a részletes nézetben nyílik). */
export function kompaktTartalmazza(v: number): boolean {
  return v === 0 || KOMPAKT.includes(v);
}
/** Részletes nézet: két sáv, bónusz +1…+10 és levonás -1…-10 (a 0 = Nullázás gomb). */
const RÉSZLETES_BÓNUSZ: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
const RÉSZLETES_LEVONÁS: number[] = Array.from({ length: 10 }, (_, i) => -(i + 1));

/**
 * Általános kézi (eseti) módosító chip - a Sebzés popup „Statikus bónuszok" kézi grid-jének
 * mintájára, de önálló, újrahasznosítható (Támadó / Célzó / Manőver Végrehajtás dobás).
 * Egy infóban olvasott szituációs bónuszt (pl. „+5 TÉ") lehet beütni, ami a dobás
 * végeredményéhez adódik. A `0` nullázza; a kompakt skála ▾ nyílra a teljes -10…+10 bomlik ki (két sáv).
 */
export function KeziBonuszBtn({ bónusz, onChange, label = 'Statikus bónuszok', kapszula = false }: {
  bónusz: number;
  onChange: (v: number) => void;
  label?: string;
  /** Pill variant for the Támadó / Célzó modifier row: "+ Bónusz" at 0, "Bónusz +3" otherwise. */
  kapszula?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Ha a jelenlegi érték nincs a kompakt grid-ben, a picker rögtön a részletes nézetben nyílik.
  const [részletes, setRészletes] = useState(false);
  const colorClass = bónusz > 0 ? 'sebzes-stat-pos' : bónusz < 0 ? 'sebzes-stat-neg' : '';

  function nyit() {
    setRészletes(!kompaktTartalmazza(bónusz));
    setOpen(true);
  }
  function választ(v: number) {
    onChange(v === bónusz ? 0 : v); // ugyanaz újraválasztva → 0 (a 0 cella is nulláz)
    setOpen(false);
  }

  return (
    <>
      {kapszula ? (
        <button type="button" className={`dobas-kapszula${bónusz === 0 ? ' dobas-kapszula-halvany' : ` ${colorClass}`}`} onClick={nyit}>
          {bónusz === 0 ? '+ Bónusz' : `Bónusz ${bónusz > 0 ? '+' : ''}${bónusz}`}
        </button>
      ) : (
        <button className={`sebzes-stat-btn kezi-bonusz-btn ${colorClass}${bónusz === 0 ? ' kezi-bonusz-btn-nulla' : ''}`} onClick={nyit}>
          {label}: {bónusz > 0 ? '+' : ''}{bónusz}
        </button>
      )}
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="sebzes-stat-popup">
            <label className="harc-popup-label kezi-bonusz-cim">{label}</label>
            {részletes ? (
              <>
                <div className="skala-sav-cim"><span className="sebzes-stat-manual-label">Bónusz</span></div>
                <SkalaSav értékek={RÉSZLETES_BÓNUSZ} érték={bónusz} onSelect={választ} />
                <div className="skala-sav-cim"><span className="sebzes-stat-manual-label">Levonás</span></div>
                <SkalaSav értékek={RÉSZLETES_LEVONÁS} érték={bónusz} onSelect={választ} />
                <button type="button" className="skala-sav-nullaz" disabled={bónusz === 0} onClick={() => választ(0)}>Nullázás</button>
              </>
            ) : (
              <>
                <SkalaSav értékek={KOMPAKT} érték={bónusz} onSelect={választ} előjeles />
                <SkalaSavFelirat />
              </>
            )}
            {!részletes && (
              <button type="button" className="kezi-bonusz-kibont" onClick={() => setRészletes(true)} aria-label="Részletes nézet">
                <Ikon név="lenyit" />
              </button>
            )}
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
