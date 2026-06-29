import type { Session } from '../engine/types';
import type { OverlayState } from './AppOverlays';

interface Props {
  testMode: boolean;
  gameMode: boolean;
  setGameMode: (v: boolean) => void;
  session: Session;
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
}

export function Header({ testMode, gameMode, setGameMode, session, setOverlay }: Props) {
  return (
    <header className="header">
      <span className={`title${testMode ? ' title-test' : ''}`} onClick={() => setOverlay('showSzilánkPicker', true)}>Szilánk</span>
      <span className="header-szilank" onClick={() => setOverlay('showSzilánkPicker', true)}>{session.szilánk}</span>
      <div className="header-btns">
        <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'naplo')}>📅</button>
        <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'jegyzetek')}>✏️</button>
        <button className="gear-btn gear-btn-padded" onClick={() => setOverlay('showMenu', true)}>⚙️</button>
        <button
          className={`mode-toggle ${gameMode ? 'mode-toggle-game' : 'mode-toggle-szerk'}`}
          onClick={() => setGameMode(!gameMode)}
        >
          {gameMode ? '🎮 Game' : '🔧 Szerk'}
        </button>
      </div>
    </header>
  );
}
