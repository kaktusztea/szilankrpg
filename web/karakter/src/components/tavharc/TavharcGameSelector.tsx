import { useState } from 'react';
import type { Session } from '../../engine/types';
import type { VirtuálisFegyver } from './types';
import { PopupOverlay } from '../PopupOverlay';
import { FokPottyok } from '../common/FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

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
  const aktívNév = aktív ? `${aktív.locked ? '🔆 ' : ''}${aktív.alap}` : '-';

  return (
    <div className="th-row th-controls">
      <button className="he-field-btn th-game-fegyver-btn" onClick={() => setShowPicker(true)}>
        <span className="th-game-fegyver-szoveg">
          <span className="th-game-fegyver-nev"><strong>{aktívNév}</strong><FokPottyok név="MF fok" fok={mfFok} max={MAX_FORTÉLY_FOK} /></span>
          {!isMágikus && <span className="he-fegyver-alcim">Idea {idea >= 0 ? '+' : ''}{idea}</span>}
        </span>
      </button>

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
