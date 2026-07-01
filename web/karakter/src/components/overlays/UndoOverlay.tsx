import { OverlayPortal } from './OverlayPortal';

interface UndoEntry {
  timestamp: number;
  leírás: string;
}

interface Props {
  entries: UndoEntry[];
  selected: number | null;
  onSelect: (index: number) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function UndoOverlay({ entries, selected, onSelect, onApply, onReset, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-undo">
        <div className="undo-header">
          <label className="overlay-label-center">Visszavonás</label>
          <button className="undo-reset-btn" disabled={entries.length === 0}
            onClick={onReset} title="Előzmények törlése">⟲</button>
        </div>
        <div className="undo-list">
          {entries.map((entry, i) => (
            <div key={entry.timestamp} onClick={() => onSelect(i)}
              className={`undo-entry ${selected !== null && i <= selected ? 'undo-entry-selected' : ''} ${i === selected ? 'undo-entry-target' : ''}`}>
              {selected !== null && i <= selected ? '●' : '○'} {entry.leírás}
            </div>
          ))}
        </div>
        <button disabled={selected === null} className={`undo-apply-btn ${selected !== null ? 'undo-apply-active' : ''}`}
          onClick={onApply}>
          Visszaállítás{selected !== null ? ` (${selected + 1} művelet)` : ''}
        </button>
      </div>
    </OverlayPortal>
  );
}
