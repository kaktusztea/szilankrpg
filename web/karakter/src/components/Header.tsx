import { Ikon } from './common/Ikon';
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
  /** Piros jelző pötty a ✏️ chipen: Felszerelés túllépés VAGY Akadály-állapot. */
  felszerelésJelző: boolean;
}

/** Max Szilánk value (the picker offers 0-3). */
const SZILÁNK_MAX = 3;

/** One crystal shard mark: filled (owned) or outline (empty). */
function SzilánkJel({ tele }: { tele: boolean }) {
  return (
    <svg className={`szilank-jel${tele ? ' tele' : ''}`} width="11" height="15" viewBox="0 0 12 16" aria-hidden="true">
      <path className="szilank-jel-test" d="M6 1 11 6 6 15 1 6z" />
      {tele && <path className="szilank-jel-fazetta" d="M6 1 8 6 6 15 4 6z" />}
    </svg>
  );
}

export function Header({ testMode, gameMode, setGameMode, viewingCheckpoint, session, undoCount, setOverlay, felszerelésJelző }: Props) {
  return (
    <header className="header">
      <span className="header-szilank" role="button" tabIndex={0} aria-label={`Szilánk: ${session.szilánk} / ${SZILÁNK_MAX}`}
        onClick={() => setOverlay('showSzilánkPicker', true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOverlay('showSzilánkPicker', true); } }}>
        <span className={`szilank-label${testMode ? ' title-test' : ''}`}>Szilánk</span>
        <span className="szilank-jelek">
          {Array.from({ length: SZILÁNK_MAX }, (_, i) => <SzilánkJel key={i} tele={i < session.szilánk} />)}
        </span>
      </span>
      <div className="header-btns">
        <button
          className="gear-btn"
          disabled={undoCount === 0}
          onClick={() => { setOverlay('showUndo', true); setOverlay('undoSelected', null); }}
        >
          <Ikon név="visszavon" />{undoCount > 0 ? ` ${undoCount}` : ''}
        </button>
        <button className="gear-btn gear-btn-badge" onClick={() => setOverlay('overlayScreen', true)}>
          <Ikon név="szerkeszt" />
          {felszerelésJelző && <span className="gear-badge-dot" title="Felszerelés / Akadály figyelmeztetés" />}
        </button>
        <button className="gear-btn gear-btn-padded" onClick={() => setOverlay('showSlotList', true)}><Ikon név="karakter" /></button>
        <button
          className={`mode-toggle ${(gameMode || viewingCheckpoint) ? 'mode-toggle-game' : 'mode-toggle-szerk'}`}
          onClick={() => !viewingCheckpoint && setGameMode(!gameMode)}
          disabled={viewingCheckpoint}
        >
          {(gameMode || viewingCheckpoint) ? <><Ikon név="játék" /> Játék</> : <><Ikon név="szerk" /> Szerk</>}
        </button>
      </div>
    </header>
  );
}
