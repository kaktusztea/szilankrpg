import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getAllTávharciNames } from '../harcertekek/helpers';

function távharciDisplayName(név: string): string {
  return `Távolsági harcmodor: ${név}`;
}

interface Props {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
  onDeleteKepz: (név: string) => void;
  onKepzSzint: (név: string) => void;
}

export function TavharcKepzettsegekSection({ data, karakter: k, képzettségek, setKépzettségek, gameMode, onDeleteKepz, onKepzSzint }: Props) {
  const allTávharciNames = getAllTávharciNames(data);
  const felvett = képzettségek.filter(kp => allTávharciNames.includes(kp.név) && kp.szint > 0);
  const nemFelvett = allTávharciNames.filter(n => !képzettségek.some(kp => kp.név === n && kp.szint > 0));

  if (gameMode && felvett.length === 0) return null;

  return (
    <section className="he-section th-kepz-section">
      <div className="he-harcmodor-list he-harcmodor-col">
        {felvett.map(h => (
            <div key={h.név} className="kep-row-wrapper">
              <div className="item-row" onClick={() => {
                if (!gameMode) onKepzSzint(h.név);
              }}>
                <span className="kep-név aktiv-flex-1">{távharciDisplayName(h.név)}</span>
                {!gameMode && (
                  <button className="item-delete" onClick={e => { e.stopPropagation(); onDeleteKepz(h.név); }}>✕</button>
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
              setKépzettségek(prev => [...prev, { név, szint: 0 }]);
              onKepzSzint(név);
            }}
          >
            <option value="">+ Távolsági harcmodor...</option>
            {nemFelvett.map(n => <option key={n} value={n}>{távharciDisplayName(n)}</option>)}
          </select>
        )}
      </div>
    </section>
  );
}
