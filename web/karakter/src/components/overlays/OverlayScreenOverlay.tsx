import { OverlayPortal } from './OverlayPortal';
import { NaploTab } from '../aktiv/NaploTab';
import type { Karakter } from '../../engine/types';

interface Props {
  screen: 'jegyzetek' | 'naplo';
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onClose: () => void;
}

export function OverlayScreenOverlay({ screen, karakter, setKarakter, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fullscreen-overlay">
        <div className="fullscreen-overlay-header">
          <button className="fullscreen-overlay-close" onClick={onClose}>✕</button>
          <span className="fullscreen-overlay-title">
            {screen === 'jegyzetek' ? '✏️ Jegyzetek' : '📅 Napló'}
          </span>
        </div>
        <div className="fullscreen-overlay-body">
          {screen === 'jegyzetek' && (
            <>
              <textarea
                className="app-jegyzetek-textarea"
                value={karakter.jegyzetek}
                onChange={e => setKarakter(prev => prev ? { ...prev, jegyzetek: e.target.value } : prev)}
                placeholder="Szabad jegyzetek..."
              />
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
            </>
          )}
          {screen === 'naplo' && <NaploTab karakter={karakter} setKarakter={setKarakter} />}
        </div>
      </div>
    </OverlayPortal>
  );
}
