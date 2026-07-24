import { useState } from 'react';
import type { Session } from '../../engine/types';
import type { VirtuálisFegyver } from './types';
import { PopupOverlay } from '../PopupOverlay';

interface Props {
  összesFegyver: VirtuálisFegyver[];
  tfIdx: number;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  mfFok: number;
  idea: number;
  isMágikus?: boolean;
}

export function TavharcGameSelector({ összesFegyver, tfIdx, setSession, mfFok, idea, isMágikus }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (összesFegyver.length === 0) return null;

  const aktív = összesFegyver[tfIdx];
  const aktívNév = aktív ? `${aktív.locked ? '🔆 ' : ''}${aktív.alap}` : '—';

  return (
    <div className="th-row th-controls">
      <button className="he-field-btn th-game-fegyver-btn" onClick={() => setShowPicker(true)}>
        🏹 <strong>{aktívNév}</strong>
      </button>
      <span className="th-badge">MF: {mfFok}</span>
      {!isMágikus && <span className="th-badge">Idea: {idea >= 0 ? '+' : ''}{idea}</span>}

      {showPicker && (
        <PopupOverlay onClose={() => setShowPicker(false)}>
          <div className="th-fegyver-picker">
            {összesFegyver.map((tf, i) => (
              <button
                key={i}
                className={`th-fegyver-picker-item${i === tfIdx ? ' th-fegyver-picker-active' : ''}`}
                onClick={() => { setSession(s => ({ ...s, aktív_távfegyver_index: i })); setShowPicker(false); }}
              >
                {tf.locked ? '🔆 ' : ''}{tf.alap}
              </button>
            ))}
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
