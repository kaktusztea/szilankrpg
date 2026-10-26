import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';

/** Kompakt (ritka) grid értékei - 3 oszlop, a középső sorban csak a 0. */
const KOMPAKT: (number | null)[] = [
  -9, -6, -3,
  null, 0, null,
  3, 6, 9,
];
/** Van-e az érték a kompakt grid-ben (különben a picker rögtön a részletes nézetben nyílik). */
export function kompaktTartalmazza(v: number): boolean {
  return v === 0 || KOMPAKT.includes(v);
}
/** Részletes grid: -10…+10 folytonos (3 oszlop, 7 sor). */
const RÉSZLETES: number[] = Array.from({ length: 21 }, (_, i) => i - 10);

/**
 * Általános kézi (eseti) módosító chip - a Sebzés popup „Statikus bónuszok" kézi grid-jének
 * mintájára, de önálló, újrahasznosítható (Támadó / Célzó / Manőver Végrehajtás dobás).
 * Egy infóban olvasott szituációs bónuszt (pl. „+5 TÉ") lehet beütni, ami a dobás
 * végeredményéhez adódik. A `0` nullázza; a kompakt nézet ▾ nyílra a teljes -10…+10 bomlik ki.
 */
export function KeziBonuszBtn({ bónusz, onChange, label = 'Statikus bónuszok' }: {
  bónusz: number;
  onChange: (v: number) => void;
  label?: string;
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
      <button className={`sebzes-stat-btn kezi-bonusz-btn ${colorClass}${bónusz === 0 ? ' kezi-bonusz-btn-nulla' : ''}`} onClick={nyit}>
        {label}: {bónusz > 0 ? '+' : ''}{bónusz}
      </button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="sebzes-stat-popup">
            <label className="harc-popup-label kezi-bonusz-cim">{label}</label>
            <div className="kezi-bonusz-grid">
              {(részletes ? RÉSZLETES : KOMPAKT).map((v, i) => (
                v === null
                  ? <span key={`e${i}`} className="kezi-bonusz-ures" aria-hidden="true" />
                  : <button key={v}
                      className={`sebzes-stat-circle${bónusz === v ? ' active' : ''}${v > 0 ? ' sebzes-stat-pos' : v < 0 ? ' sebzes-stat-neg' : ' kezi-bonusz-nulla'}`}
                      onClick={() => választ(v)}>
                      {v > 0 ? `+${v}` : v}
                    </button>
              ))}
            </div>
            {!részletes && (
              <button type="button" className="kezi-bonusz-kibont" onClick={() => setRészletes(true)} aria-label="Részletes nézet">
                ▾
              </button>
            )}
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
