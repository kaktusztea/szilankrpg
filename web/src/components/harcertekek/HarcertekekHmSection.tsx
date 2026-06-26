import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { calcMaxHM, calcMaxAszimmetria } from './helpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  gameMode: boolean;
}

export function HmSection({ data, karakter: k, setKarakter, gameMode }: Props) {
  const maxHM = calcMaxHM(data, k);
  const maxAszimmetria = calcMaxAszimmetria(data, k.tsz);
  const hmTotal = k.HM_TÉ + k.HM_VÉ;
  const hmOverflow = hmTotal > maxHM;
  const aszimmetriaOverflow = Math.abs(k.HM_TÉ - k.HM_VÉ) > maxAszimmetria;
  const hasError = hmOverflow || aszimmetriaOverflow;

  function setHM_TÉ(v: number) {
    setKarakter(prev => prev ? { ...prev, HM_TÉ: Math.max(0, Math.min(v, maxHM - prev.HM_VÉ)) } : prev);
  }
  function setHM_VÉ(v: number) {
    setKarakter(prev => prev ? { ...prev, HM_VÉ: Math.max(0, Math.min(v, maxHM - prev.HM_TÉ)) } : prev);
  }

  const disabledStyle = gameMode ? { opacity: 0.3 } : undefined;

  return (
    <section className="he-section">
      <h3>HM</h3>
      <div className="he-hm-grid">
        <div className={`he-hm-row ${hasError ? 'he-error' : ''}`}>
          <span>HM TÉ:</span>
          <button disabled={gameMode} style={disabledStyle} onClick={() => setHM_TÉ(k.HM_TÉ - 1)}>−</button>
          <strong>{k.HM_TÉ}</strong>
          <button disabled={gameMode} style={disabledStyle} onClick={() => setHM_TÉ(k.HM_TÉ + 1)}>+</button>
        </div>
        <div className={`he-hm-row ${hasError ? 'he-error' : ''}`}>
          <span>HM VÉ:</span>
          <button disabled={gameMode} style={disabledStyle} onClick={() => setHM_VÉ(k.HM_VÉ - 1)}>−</button>
          <strong>{k.HM_VÉ}</strong>
          <button disabled={gameMode} style={disabledStyle} onClick={() => setHM_VÉ(k.HM_VÉ + 1)}>+</button>
        </div>
      </div>
      <div className="he-hm-info">
        <span className={hmOverflow ? 'he-overflow' : ''}>HM keret: {maxHM - hmTotal}</span>
      </div>
    </section>
  );
}
