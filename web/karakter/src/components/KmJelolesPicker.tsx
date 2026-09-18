import { PopupOverlay } from './PopupOverlay';
import { KM_JEL_BETŰK } from '../ui-constants';

interface Props {
  /** Jelenleg kijelölt betű (üres = nincs). */
  aktuális: string;
  név: string;
  /** Egy betűhöz megjelenítendő (felvételkor kapott) szín — a döntés a hívónál van. */
  színÉrte: (betű: string) => string;
  /** Betű kiválasztva (kiválasztás = bezárás). Üres string = jelölés törlése. */
  onPick: (betű: string) => void;
  onClose: () => void;
}

/**
 * KM harci jelölés betű-picker: A–Z színes karika chipek + „nincs jelölés".
 * A kiválasztás azonnal zár (UI-konvenció: nincs OK gomb). A chip színe a hívó
 * `színÉrte` előnézete — a tényleges színt a felvétel (`onPick`) rögzíti.
 */
export function KmJelolesPicker({ aktuális, név, színÉrte, onPick, onClose }: Props) {
  return (
    <PopupOverlay onClose={onClose}>
      <div className="kep-prompt km-jel-picker" onClick={e => e.stopPropagation()}>
        <label className="kep-prompt-label-bold-mb">Harci jelölés — {név}</label>
        <div className="km-jel-grid">
          {KM_JEL_BETŰK.map(b => (
            <button
              key={b}
              className={`km-jel-chip${b === aktuális ? ' km-jel-chip-active' : ''}`}
              style={{ '--jel-szín': színÉrte(b) } as React.CSSProperties}
              onClick={() => onPick(b)}
            >
              {b}
            </button>
          ))}
        </div>
        <button className="he-field-btn km-jel-clear" onClick={() => onPick('')}>
          Nincs jelölés ❌
        </button>
      </div>
    </PopupOverlay>
  );
}
