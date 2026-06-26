import type { GameData } from '../../engine/data-loader';
import type { Tulajdonsagok } from '../../engine/types';
import { TulajdonsagCell } from '../TulajdonsagCell';

interface Props {
  data: GameData;
  gameMode: boolean;
  tulajdonságok: Tulajdonsagok;
  setTul: (key: keyof Tulajdonsagok, val: number) => void;
  név: string;
  becenév: string;
  játékos: string;
  tsz: number;
  kor: number;
  faj: string;
  anyanyelv: string;
  onEditNév: () => void;
  onEditBecenév: () => void;
  onEditTsz: () => void;
  onEditKor: () => void;
  onEditJátékos: () => void;
  setFaj: (v: string) => void;
  setAnyanyelv: (v: string) => void;
}

export function TulajdonsagokHeader({
  data, gameMode, tulajdonságok, setTul,
  név, becenév, játékos, tsz, kor, faj, anyanyelv,
  onEditNév, onEditBecenév, onEditTsz, onEditKor, onEditJátékos,
  setFaj, setAnyanyelv
}: Props) {
  const TULAJDONSAG_NEVEK = data.konstansok.tulajdonság_sorrend as (keyof Tulajdonsagok)[];

  return (
    <>
      {/* Fejléc: Név + Becenév + Szint */}
      <div className="tul-header" style={{ flexDirection: 'column', gap: '4px' }}>
        <div className="tul-header-box" style={{ width: '100%' }}
          onClick={() => { if (!gameMode) onEditNév(); }}
        >
          <span className="tul-header-label">Név:</span> <strong>{gameMode ? `${név} (${faj}, ${kor})` : név}</strong>
        </div>
        {!gameMode && (
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            <div className="tul-header-box" style={{ flex: 1 }} onClick={onEditBecenév}>
              <span className="tul-header-label">Becenév:</span> <strong>{becenév || '—'}</strong>
            </div>
            <div className="tul-header-box" onClick={onEditTsz}>
              <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
            </div>
          </div>
        )}
        {gameMode && (
          <div className="tul-header-box">
            <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
          </div>
        )}
      </div>

      {/* Faj + Kor - csak szerkesztő módban */}
      {!gameMode && (<>
        <div className="tul-faj-kor-row">
          <div className="tul-faj-row">
            <span className="tul-header-label">Faj:</span>
            <select className="faj-select" value={faj} onChange={e => setFaj(e.target.value)}>
              {data.fajNevek.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="tul-faj-row" onClick={onEditKor}>
            <span className="tul-header-label">Kor:</span> <strong>{kor}</strong>
          </div>
        </div>
        <div className="tul-faj-row">
          <span className="tul-header-label">Anyanyelv:</span>
          <select className="faj-select" value={anyanyelv} onChange={e => setAnyanyelv(e.target.value)}>
            {[...data.nyelvek].sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(n => <option key={n.név} value={n.név}>{n.név}</option>)}
          </select>
        </div>
        <div className="tul-header-box" onClick={onEditJátékos}>
          <span className="tul-header-label">Játékos:</span> <strong>{játékos || '—'}</strong>
        </div>
      </>)}

      {/* Tulajdonság pont bar */}
      {!gameMode && (() => {
        const pontTábla = data.konstansok.tulajdonság_pontok as Record<string, number>;
        const keret = data.konstansok.arányok.tulajdonság_pont_alap + Math.floor(tsz / 2);
        const elköltött = TULAJDONSAG_NEVEK.reduce((s, key) => s + (pontTábla[String(tulajdonságok[key])] ?? 0), 0);
        const maradék = keret - elköltött;
        return (
          <div className="tul-pont-bar" style={{ padding: '4px 8px', fontSize: '13px', color: maradék < 0 ? 'var(--error)' : 'var(--text-dim)' }}>
            <span>Tulajdonság pontok: {elköltött}/{keret}</span>
          </div>
        );
      })()}

      {/* Tulajdonság grid */}
      <div className="tul-grid">
        {TULAJDONSAG_NEVEK.map(key => (
          <TulajdonsagCell
            key={key}
            név={key}
            érték={tulajdonságok[key]}
            gameMode={gameMode}
            onChange={v => setTul(key, v)}
            fajMax={data.fajKeretek[faj]?.[key]?.[1]}
            fajMin={data.fajKeretek[faj]?.[key]?.[0]}
          />
        ))}
      </div>
    </>
  );
}
