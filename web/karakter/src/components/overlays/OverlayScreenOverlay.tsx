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

          {/* Jegyzetek — mindig látható */}
          <textarea
            className="app-jegyzetek-textarea"
            value={karakter.jegyzetek}
            onChange={e => setKarakter(prev => prev ? { ...prev, jegyzetek: e.target.value } : prev)}
            placeholder="Szabad jegyzetek..."
          />

          {/* Próba táblák — összecsukva, legalul */}
          <div className="app-proba-bar">
            <details>
              <summary className="app-proba-summary">Tulajdonságpróba (k6)</summary>
              <pre className="app-proba-pre">{`3: Könnyű\n4: Átlagos\n5: Nehéz\n6: Nagyon nehéz\n7: Rendkívül nehéz\n8: Emberfeletti`}</pre>
            </details>
            <details>
              <summary className="app-proba-summary">Képzettségpróba (k10)</summary>
              <pre className="app-proba-pre">{` 6: Könnyű\n 9: Átlagos\n12: Nehéz\n15: Nagyon nehéz\n18: Rendkívül nehéz\n21: Emberfeletti`}</pre>
            </details>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
