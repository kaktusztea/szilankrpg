import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import { createCheckpoint, deleteCheckpoint, autoCheckpointName } from '../../engine/checkpoint-utils';
import { MAX_CHECKPOINTS, MAX_CHECKPOINT_NÉV } from '../../ui-constants';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onViewCheckpoint?: (id: string) => void;
}

/** Karakter verziók (checkpoint) accordion — lista, létrehozás, törlés, megtekintés. */
export function CheckpointSection({ karakter, setKarakter, onViewCheckpoint }: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [név, setNév] = useState('');

  // Sort checkpoints by date (newest first)
  const sorted = [...karakter.checkpoints].sort((a, b) => b.dátum.localeCompare(a.dátum));

  function handleCreate() {
    const cpNév = név.trim() || autoCheckpointName();
    const newCheckpoints = createCheckpoint(karakter, cpNév);
    setKarakter(prev => prev ? { ...prev, checkpoints: newCheckpoints } : prev);
    setAdding(false);
    setNév('');
  }

  function handleDelete(id: string) {
    setKarakter(prev => prev ? { ...prev, checkpoints: deleteCheckpoint(prev.checkpoints, id) } : prev);
  }

  return (
    <details className="naplo-cp-section" open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="naplo-cp-summary">
        Karakter verziók ({sorted.length})
      </summary>
      <div className="naplo-cp-list">
        {sorted.map(cp => (
          <div key={cp.id} className="naplo-cp-entry" onClick={() => onViewCheckpoint?.(cp.id)}>
            <span className="naplo-cp-dot">●</span>
            <span className="naplo-cp-entry-name">{cp.név}</span>
            <span className="naplo-cp-entry-date">{cp.dátum.slice(0, 10)}</span>
            <button className="item-delete" onClick={e => { e.stopPropagation(); handleDelete(cp.id); }}>✕</button>
          </div>
        ))}
        {sorted.length === 0 && <div className="naplo-cp-empty">Nincs kiemelt verzió.</div>}
      </div>
      {!adding && karakter.checkpoints.length < MAX_CHECKPOINTS && (
        <button className="naplo-btn-new naplo-cp-new-btn" onClick={() => setAdding(true)}>+ Új checkpoint</button>
      )}
      {adding && (
        <div className="naplo-cp-new-form">
          <input
            className="field-input"
            placeholder="Verzió neve (max 20)"
            value={név}
            onChange={e => setNév(e.target.value.slice(0, MAX_CHECKPOINT_NÉV))}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            maxLength={MAX_CHECKPOINT_NÉV}
            autoFocus
          />
          <div className="naplo-form-btns">
            <button className="naplo-btn-save" onClick={handleCreate}>Létrehozás</button>
            <button className="naplo-btn-cancel" onClick={() => setAdding(false)}>Mégse</button>
          </div>
        </div>
      )}
    </details>
  );
}
