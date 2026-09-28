import { useState } from 'react';
import { PopupOverlay } from './PopupOverlay';
import { useLongPress } from '../hooks/useLongPress';
import { KM_JEL_BETŰK } from '../ui-constants';

interface Props {
  /** Jelenleg kijelölt betű (üres = nincs). Lehet kombinált, pl. "MA". */
  aktuális: string;
  név: string;
  /** Egy betűhöz megjelenítendő (felvételkor kapott) szín - a döntés a hívónál van. */
  színÉrte: (betű: string) => string;
  /** Korábban már létrehozott kombinált betűk (pl. ["MA"]), hogy újra választhatók legyenek. */
  kombináltBetűk: string[];
  /** Betű kiválasztva (kiválasztás = bezárás). Üres string = jelölés törlése. */
  onPick: (betű: string) => void;
  onClose: () => void;
}

/**
 * KM harci jelölés betű-picker: A–Z színes karika chipek + „nincs jelölés".
 * A kiválasztás azonnal zár (UI-konvenció: nincs OK gomb). A chip színe a hívó
 * `színÉrte` előnézete - a tényleges színt a felvétel (`onPick`) rögzíti.
 *
 * Long-press egy A-Z chipen → kiegészítő betű almenü (2. picker), hogy azonos
 * kezdőbetűjű NJK-k is megkülönböztethetők legyenek (pl. "M" + "A" → "MA").
 * A korábban létrehozott kombinált betűk (`kombináltBetűk`) az A-Z rács után,
 * külön csoportban is választhatók, hogy később ismét felvehetők legyenek.
 */
export function KmJelolesPicker({ aktuális, név, színÉrte, kombináltBetűk, onPick, onClose }: Props) {
  const [kiegészítőAlap, setKiegészítőAlap] = useState<string | null>(null);
  const { pressProps } = useLongPress<string>(setKiegészítőAlap, onPick);

  if (kiegészítőAlap) {
    return (
      <PopupOverlay onClose={() => setKiegészítőAlap(null)}>
        <div className="kep-prompt km-jel-picker" onClick={e => e.stopPropagation()}>
          <label className="kep-prompt-label-bold-mb">Kiegészítő betű - {kiegészítőAlap}+?</label>
          <div className="km-jel-grid">
            {KM_JEL_BETŰK.filter(b => b !== kiegészítőAlap).map(b => {
              const kombinált = kiegészítőAlap + b;
              return (
                <button
                  key={b}
                  className="km-jel-chip"
                  style={{ '--jel-szín': színÉrte(kombinált) } as React.CSSProperties}
                  onClick={() => onPick(kombinált)}
                >
                  {kombinált}
                </button>
              );
            })}
          </div>
          <button className="he-field-btn km-jel-clear" onClick={() => setKiegészítőAlap(null)}>
            Mégsem
          </button>
        </div>
      </PopupOverlay>
    );
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="kep-prompt km-jel-picker" onClick={e => e.stopPropagation()}>
        <label className="kep-prompt-label-bold-mb">Harci jelölés - {név}</label>
        <div className="km-jel-grid">
          {KM_JEL_BETŰK.map(b => (
            <button
              key={b}
              className={`km-jel-chip${b === aktuális ? ' km-jel-chip-active' : ''}`}
              style={{ '--jel-szín': színÉrte(b) } as React.CSSProperties}
              title="Tartsd lenyomva kiegészítő betűhöz"
              {...pressProps(b)}
            >
              {b}
            </button>
          ))}
        </div>
        {kombináltBetűk.length > 0 && (
          <>
            <label className="kep-prompt-label-bold-mb km-jel-kombinalt-label">Korábbi kombinált betűk</label>
            <div className="km-jel-grid">
              {kombináltBetűk.map(b => (
                <button
                  key={b}
                  className={`km-jel-chip km-jel-chip-kombinalt${b === aktuális ? ' km-jel-chip-active' : ''}`}
                  style={{ '--jel-szín': színÉrte(b) } as React.CSSProperties}
                  onClick={() => onPick(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="he-field-btn km-jel-clear" onClick={() => onPick('')}>
          Nincs jelölés ❌
        </button>
      </div>
    </PopupOverlay>
  );
}
