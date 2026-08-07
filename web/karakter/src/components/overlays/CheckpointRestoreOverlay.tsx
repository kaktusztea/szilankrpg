import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';

interface Props {
  onRestore: (mode: 'truncate' | 'append') => void;
  onClose: () => void;
}

export function CheckpointRestoreOverlay({ onRestore, onClose }: Props) {
  const [mode, setMode] = useState<'truncate' | 'append'>('append');

  return (
    <PopupOverlay onClose={onClose}>
      <label className="overlay-label">Visszaállás korábbi állapotra</label>
      <div className="checkpoint-restore-options">
        <label className="checkpoint-restore-option">
          <input type="radio" name="restore-mode" checked={mode === 'truncate'} onChange={() => setMode('truncate')} />
          <span>Töröljek minden ez utáni állapotot</span>
        </label>
        <label className="checkpoint-restore-option">
          <input type="radio" name="restore-mode" checked={mode === 'append'} onChange={() => setMode('append')} />
          <span>Új elemként fűzni a legutolsó után</span>
        </label>
      </div>
      <button className="btn-del-confirm overlay-ok-btn" onClick={() => onRestore(mode)}>Visszaállítás</button>
    </PopupOverlay>
  );
}
