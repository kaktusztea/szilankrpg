import type { Session } from '../engine/types';
import type { OverlayState } from './AppOverlays';

interface Props {
  testMode: boolean;
  gameMode: boolean;
  setGameMode: (v: boolean) => void;
  viewingCheckpoint: boolean;
  session: Session;
  undoCount: number;
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
}

export function Header({ testMode, gameMode, setGameMode, viewingCheckpoint, session, undoCount, setOverlay }: Props) {
  return (
    <header className="header">
      <span className="header-szilank" onClick={() => setOverlay('showSzilánkPicker', true)}>
        <span className={`szilank-label${testMode ? ' title-test' : ''}`}>Szilánk</span> {session.szilánk}
      </span>
      <div className="header-btns">
        <button
          className="gear-btn"
          disabled={undoCount === 0}
          onClick={() => { setOverlay('showUndo', true); setOverlay('undoSelected', null); }}
        >
          ↩{undoCount > 0 ? ` ${undoCount}` : ''}
        </button>
        <button className="gear-btn" onClick={() => setOverlay('overlayScreen', true)}>✏️</button>
        <button className="gear-btn gear-btn-padded" onClick={() => setOverlay('showSlotList', true)}>🧑</button>
        <button
          className={`mode-toggle ${(gameMode || viewingCheckpoint) ? 'mode-toggle-game' : 'mode-toggle-szerk'}`}
          onClick={() => !viewingCheckpoint && setGameMode(!gameMode)}
          disabled={viewingCheckpoint}
        >
          {(gameMode || viewingCheckpoint) ? '🎮 Játék' : '🔧 Szerk'}
        </button>
      </div>
    </header>
  );
}
