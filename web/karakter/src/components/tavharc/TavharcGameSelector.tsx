import { useState } from 'react';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { távfegyverStatok } from './TavharcFegyverCard';
import { calcÚjratöltésEnyhítés } from './helpers';
import type { VirtuálisFegyver } from './types';
import { PopupOverlay } from '../PopupOverlay';
import { Ikon } from '../common/Ikon';
import { FokPottyok } from '../common/FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

interface Props {
  összesFegyver: VirtuálisFegyver[];
  tfIdx: number;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  mfFok: number;
  idea: number;
  isMágikus?: boolean;
  karakter: Karakter;
  data: GameData;
  session: Session;
}

export function TavharcGameSelector({ összesFegyver, tfIdx, setSession, mfFok, idea, isMágikus, karakter, data, session }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (összesFegyver.length === 0) return null;

  const aktív = összesFegyver[tfIdx];
  const aktívNév = aktív ? `${aktív.locked ? '🔆 ' : ''}${aktív.alap}` : '-';

  return (
    <div className="th-row th-controls">
      <button className="he-field-btn th-game-fegyver-btn" aria-haspopup="dialog" onClick={() => setShowPicker(true)}>
        <span className="th-game-fegyver-szoveg">
          <span className="th-game-fegyver-nev"><strong>{aktívNév}</strong><FokPottyok név="MF fok" fok={mfFok} max={MAX_FORTÉLY_FOK} /></span>
          {!isMágikus && <span className="he-fegyver-alcim">Idea {idea >= 0 ? '+' : ''}{idea}</span>}
        </span>
        <span className="th-game-fegyver-nyil" aria-hidden="true"><Ikon név="lenyit" méret={22} /></span>
      </button>

      {showPicker && (
        <PopupOverlay onClose={() => setShowPicker(false)}>
          <div className="th-fegyver-picker">
            {összesFegyver.map((tf, i) => {
              // Taken weapons (the first karakter.távfegyverek.length entries): stats with MF bonuses + MF dots, like the card
              const st = i < karakter.távfegyverek.length
                ? távfegyverStatok(karakter, data, session, i, karakter.tulajdonságok.gyorsaság ?? 0, calcÚjratöltésEnyhítés(session, karakter))
                : null;
              return (
                <button
                  key={i}
                  className={`th-fegyver-picker-item${i === tfIdx ? ' th-fegyver-picker-active' : ''}`}
                  onClick={() => { setSession(s => ({ ...s, aktív_távfegyver_index: i })); setShowPicker(false); }}
                >
                  <span className="th-fegyver-picker-nev">
                    {tf.locked ? '🔆 ' : ''}{tf.alap}
                    {st && <FokPottyok név="MF fok" fok={st.mf} max={MAX_FORTÉLY_FOK} hiba={st.hasError} />}
                  </span>
                  {st && (
                    <span className="th-fegyver-picker-stat">
                      CÉ <b>{st.bontás.cé}</b> · Támadás <b>{st.tám}</b> · SP <b>{st.spÉrték}</b>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
