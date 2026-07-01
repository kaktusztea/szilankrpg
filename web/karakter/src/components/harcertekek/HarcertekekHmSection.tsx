import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { UndoPatch } from '../../hooks/useUndo';
import { calcMaxHM, calcMaxAszimmetria } from './helpers';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  gameMode: boolean;
}

export function HmSection({ data, karakter: k, setKarakter, pushUndo, gameMode }: Props) {
  const maxHM = calcMaxHM(data, k);
  const maxAszimmetria = calcMaxAszimmetria(data, k.tsz);
  const hmTotal = k.HM_TÉ + k.HM_VÉ;
  const hmOverflow = hmTotal > maxHM;
  const aszimmetriaOverflow = Math.abs(k.HM_TÉ - k.HM_VÉ) > maxAszimmetria;
  const hasError = hmOverflow || aszimmetriaOverflow;

  function setHM_TÉ(v: number) {
    const clamped = Math.max(0, Math.min(v, maxHM - k.HM_VÉ));
    pushUndo(`HM TÉ: ${k.HM_TÉ} → ${clamped}`, [{ field: 'HM_TÉ', prev: k.HM_TÉ }], clamped);
    setKarakter(prev => prev ? { ...prev, HM_TÉ: clamped } : prev);
  }
  function setHM_VÉ(v: number) {
    const clamped = Math.max(0, Math.min(v, maxHM - k.HM_TÉ));
    pushUndo(`HM VÉ: ${k.HM_VÉ} → ${clamped}`, [{ field: 'HM_VÉ', prev: k.HM_VÉ }], clamped);
    setKarakter(prev => prev ? { ...prev, HM_VÉ: clamped } : prev);
  }

  const btnCls = gameMode ? 'he-btn-disabled' : '';

  return (
    <section className="he-section">
      <h3>HM</h3>
      <div className="he-hm-grid">
        <div className={`he-hm-row${hasError ? ' he-error' : ''}`}>
          <span>HM TÉ:</span>
          <button className={btnCls} disabled={gameMode} onClick={() => setHM_TÉ(k.HM_TÉ - 1)}>−</button>
          <strong>{k.HM_TÉ}</strong>
          <button className={btnCls} disabled={gameMode} onClick={() => setHM_TÉ(k.HM_TÉ + 1)}>+</button>
        </div>
        <div className={`he-hm-row${hasError ? ' he-error' : ''}`}>
          <span>HM VÉ:</span>
          <button className={btnCls} disabled={gameMode} onClick={() => setHM_VÉ(k.HM_VÉ - 1)}>−</button>
          <strong>{k.HM_VÉ}</strong>
          <button className={btnCls} disabled={gameMode} onClick={() => setHM_VÉ(k.HM_VÉ + 1)}>+</button>
        </div>
      </div>
      <div className="he-hm-info">
        <span className={hmOverflow ? 'he-overflow' : ''}>HM keret: {maxHM - hmTotal}</span>
      </div>
    </section>
  );
}
