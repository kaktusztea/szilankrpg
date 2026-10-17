import type { Kepzettseg } from '../../engine/types';
import { képzKulcs, bontKépzKulcs } from '../../engine/azonosito';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getAllKözelharciNames, harciKepzDisplayName } from './helpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: Kepzettseg[];
  setKépzettségek: React.Dispatch<React.SetStateAction<Kepzettseg[]>>;
  gameMode: boolean;
  onDeleteKepz: (név: string) => void;
  onKepzSzint: (név: string) => void;
}

export function HarciKepzettsegekSection({ data, karakter: k, képzettségek, setKépzettségek, gameMode, onDeleteKepz, onKepzSzint }: Props) {
  const allHarciNames = getAllKözelharciNames(data);
  const felvett = képzettségek.filter(kp => allHarciNames.includes(képzKulcs(kp)) && kp.szint > 0);
  const nemFelvett = allHarciNames.filter(n => !képzettségek.some(kp => képzKulcs(kp) === n && kp.szint > 0));

  return (
    <section className="he-section">
      <h3>Harci képzettségek</h3>
      <div className="he-harcmodor-list he-harcmodor-col">
        {felvett.map(h => (
            <div key={képzKulcs(h)} className="kep-row-wrapper">
              <div className="item-row" onClick={() => {
                if (!gameMode) onKepzSzint(képzKulcs(h));
              }}>
                <span className="kep-név aktiv-flex-1">{harciKepzDisplayName(data, képzKulcs(h))}</span>
                {!gameMode && (
                  <button className="item-delete" onClick={e => { e.stopPropagation(); onDeleteKepz(képzKulcs(h)); }}>✕</button>
                )}
                <strong className={`kep-szint${h.szint > k.tsz ? ' kep-over' : h.szint >= 9 ? ' kep-szint-high' : ''}`}>{h.szint}</strong>
              </div>
            </div>
        ))}
        {!gameMode && nemFelvett.length > 0 && (
          <select
            className="he-add-select"
            value=""
            onChange={e => {
              if (!e.target.value) return;
              const név = e.target.value;
              setKépzettségek(prev => [...prev, { ...bontKépzKulcs(név), szint: 0 }]);
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
