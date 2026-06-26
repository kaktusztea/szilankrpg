import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getAllHarciNames, harciKepzDisplayName } from './helpers';

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
  const allHarciNames = getAllHarciNames(data);
  const felvett = képzettségek.filter(kp => allHarciNames.includes(kp.név) && kp.szint > 0);
  const nemFelvett = allHarciNames.filter(n => !képzettségek.some(kp => kp.név === n && kp.szint > 0));

  return (
    <section className="he-section">
      <h3>Harci képzettségek</h3>
      <div className="he-harcmodor-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {felvett.map(h => (
          <div key={h.név} className="kep-row" onClick={() => !gameMode && onKepzSzint(h.név)}>
            <span className="kep-név" style={{ flex: 1 }}>{harciKepzDisplayName(data, h.név)}</span>
            {!gameMode && (
              <button className="fort-delete" onClick={e => { e.stopPropagation(); onDeleteKepz(h.név); }}>✕</button>
            )}
            <strong className={`kep-szint${h.szint > k.tsz ? ' kep-over' : h.szint >= 9 ? ' kep-szint-high' : ''}`}>{h.szint}</strong>
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
            <option value="">+ Harci képzettség...</option>
            {nemFelvett.map(n => <option key={n} value={n}>{harciKepzDisplayName(data, n)}</option>)}
          </select>
        )}
      </div>
    </section>
  );
}
