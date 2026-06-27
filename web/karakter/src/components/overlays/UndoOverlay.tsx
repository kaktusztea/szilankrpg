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
  onClose: () => void;
}

export function UndoOverlay({ entries, selected, onSelect, onApply, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-undo">
        <label className="overlay-label-center">Visszavonás</label>
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
