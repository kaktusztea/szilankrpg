import { OverlayPortal } from './OverlayPortal';
import { NaploTab } from '../aktiv/NaploTab';
import type { Karakter } from '../../engine/types';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onClose: () => void;
  onViewCheckpoint?: (id: string) => void;
}

export function OverlayScreenOverlay({ karakter, setKarakter, onClose, onViewCheckpoint }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fullscreen-overlay">
        <div className="fullscreen-overlay-header">
          <button className="fullscreen-overlay-close" onClick={onClose}>✕</button>
          <span className="fullscreen-overlay-title">✏️ Verziók, Napló, Jegyzetek</span>
        </div>
        <div className="fullscreen-overlay-body">
          {/* Karakter verziók + Napló (accordionok) */}
          <NaploTab karakter={karakter} setKarakter={setKarakter} onViewCheckpoint={id => { onViewCheckpoint?.(id); onClose(); }} />

          {/* Jegyzetek — accordion, alapból nyitva */}
          <details className="naplo-cp-section naplo-notes-section" open>
            <summary className="naplo-cp-summary naplo-notes-summary">Jegyzetek</summary>
            <textarea
              className="app-jegyzetek-textarea"
              value={karakter.jegyzetek}
              onChange={e => setKarakter(prev => prev ? { ...prev, jegyzetek: e.target.value } : prev)}
              placeholder="Szabad jegyzetek..."
            />
          </details>
        </div>
      </div>
    </OverlayPortal>
  );
}
