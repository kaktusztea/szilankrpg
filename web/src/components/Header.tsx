import type { Session } from '../engine/types';
import type { OverlayState } from './AppOverlays';

interface Props {
  testMode: boolean;
  gameMode: boolean;
  setGameMode: (v: boolean) => void;
  session: Session;
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
  onTitleTap: () => void;
}

export function Header({ testMode, gameMode, setGameMode, session, setOverlay, onTitleTap }: Props) {
  return (
    <header className="header">
      <span className="title" style={testMode ? { color: '#ff9800' } : undefined} onClick={onTitleTap}>Szilánk</span>
      <span className="header-szilank" onClick={() => setOverlay('showSzilánkPicker', true)}>{session.szilánk}</span>
      <div className="header-btns">
        <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'naplo')}>📅</button>
        <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'jegyzetek')}>✏️</button>
        <button className="gear-btn" style={{ padding: '4px 12px' }} onClick={() => setOverlay('showMenu', true)}>⚙️</button>
        <button
          className="mode-toggle"
          style={{ background: gameMode ? '#4caf50' : '#ff9800', color: '#000' }}
          onClick={() => setGameMode(!gameMode)}
        >
          {gameMode ? '🎮 Game' : '🔧 Szerk'}
        </button>
      </div>
    </header>
  );
}
