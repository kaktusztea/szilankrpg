import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getAllHarciNames, harciKepzDisplayName } from './helpers';
import { findDef as findKepzDef } from '../tulajdonsagok/helpers';
import { KepzettsegInfoPanel } from '../KepzettsegInfoPanel';

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
  onDeleteKepz: (név: string) => void;
  onKepzSzint: (név: string) => void;
}

export function HarciKepzettsegekSection({ data, karakter: k, képzettségek, setKépzettségek, gameMode, onDeleteKepz, onKepzSzint }: Props) {
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const allHarciNames = getAllHarciNames(data);
  const felvett = képzettségek.filter(kp => allHarciNames.includes(kp.név) && kp.szint > 0);
  const nemFelvett = allHarciNames.filter(n => !képzettségek.some(kp => kp.név === n && kp.szint > 0));

  const findDef = (név: string) => findKepzDef(név, data.kepzettsegDefs);
  const felvettFortelyok = k.fortélyok.map(f => f.név);

  return (
    <section className="he-section">
      <h3>Harci képzettségek</h3>
      <div className="he-harcmodor-list he-harcmodor-col">
        {felvett.map(h => {
          const def = findDef(h.név);
          const kit = data.kiterjesztesek[h.név] || [];
          const isOpen = infoOpen === h.név;
          return (
            <div key={h.név} className="kep-row-wrapper">
              <div className="kep-row" onClick={() => {
                if (gameMode) { setInfoOpen(isOpen ? null : h.név); }
                else onKepzSzint(h.név);
              }}>
                <span className="kep-név aktiv-flex-1">{harciKepzDisplayName(data, h.név)}</span>
                {!gameMode && (
                  <button className="fort-delete" onClick={e => { e.stopPropagation(); onDeleteKepz(h.név); }}>✕</button>
                )}
                <strong className={`kep-szint${h.szint > k.tsz ? ' kep-over' : h.szint >= 9 ? ' kep-szint-high' : ''}`}>{h.szint}</strong>
              </div>
              {gameMode && isOpen && def && (
                <KepzettsegInfoPanel def={def} kit={kit} felvettFortelyok={felvettFortelyok} />
              )}
            </div>
          );
        })}
        {!gameMode && nemFelvett.length > 0 && (
          <select
            className="he-add-select"
            value=""
            onChange={e => {
              if (!e.target.value) return;
              const név = e.target.value;
              setKépzettségek(prev => [...prev, { név, szint: 0 }]);
              onKepzSzint(név);
            }}
          >
            <option value="">+ Harci képzettség...</option>
            {nemFelvett.map(n => <option key={n} value={n}>{harciKepzDisplayName(data, n)}</option>)}
          </select>
        )}
      </div>
    </section>
  );
}
