import type { Checkpoint } from '../engine/types';
import './CheckpointBanner.css';

interface Props {
  checkpoint: Checkpoint;
  onBack: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
}

export function CheckpointBanner({ checkpoint, onBack, onRestore, onDuplicate }: Props) {
  return (
    <div className="checkpoint-banner">
      <div className="checkpoint-banner-label">
        ⚠ Korábbi verzió: „{checkpoint.név}"
      </div>
      <div className="checkpoint-banner-actions">
        <button className="checkpoint-banner-btn" onClick={onBack}>Vissza eredetire</button>
        <button className="checkpoint-banner-btn checkpoint-banner-btn-restore" onClick={onRestore}>Visszaállítás</button>
        <button className="checkpoint-banner-btn" onClick={onDuplicate}>Duplikálás</button>
      </div>
    </div>
  );
}
