import { useState } from 'react';
import { OverlayPortal } from './OverlayPortal';
import type { Karakter } from '../../engine/types';

interface BackupEntry {
  karakter: Karakter;
  undo: any[];
}

interface Props {
  karakterek: BackupEntry[];
  dátum: string;
  onRestore: (selected: BackupEntry[]) => void;
  onClose: () => void;
}

/** Returns a Set of uid-s that already exist in the slot list. */
function getExistingUids(): Set<string> {
  try {
    const slots: { uid: string }[] = JSON.parse(localStorage.getItem('szilank_slots') || '[]');
    return new Set(slots.map(s => s.uid));
  } catch { return new Set(); }
}

function formatDátum(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return iso; }
}

export function BackupRestoreOverlay({ karakterek, dátum, onRestore, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(karakterek.map((_, i) => i)));
  const [showConfirm, setShowConfirm] = useState(false);

  const existingUids = getExistingUids();

  const toggle = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const selectedEntries = karakterek.filter((_, i) => selected.has(i));
  const newCount = selectedEntries.filter(e => !existingUids.has(e.karakter.uid)).length;
  const overwriteCount = selectedEntries.filter(e => existingUids.has(e.karakter.uid)).length;

  if (showConfirm) {
    return (
      <OverlayPortal dismissible onClose={() => setShowConfirm(false)}>
        <div className="kep-prompt overlay-confirm">
          <label className="overlay-label overlay-label-center">Backup visszaállítás</label>
          <div className="backup-confirm-summary">
            {newCount > 0 && <div>{newCount} új karakter betöltése</div>}
            {overwriteCount > 0 && <div>{overwriteCount} meglévő karakter felülírása</div>}
          </div>
          <div className="kep-prompt-btns">
            <button className="menu-item btn-del-confirm" onClick={() => onRestore(selectedEntries)}>Megerősít</button>
          </div>
        </div>
      </OverlayPortal>
    );
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-backup-restore">
        <label className="overlay-label overlay-label-center">Backup visszaállítás</label>
        <div className="backup-restore-list">
          {karakterek.map((entry, i) => {
            const isExisting = existingUids.has(entry.karakter.uid);
            const isSelected = selected.has(i);
            return (
              <div
                key={entry.karakter.uid + '-' + i}
                className={`backup-restore-item${isSelected ? ' selected' : ''}`}
                onClick={() => toggle(i)}
              >
                <span className="backup-restore-check">{isSelected ? '●' : '○'}</span>
                <span className="backup-restore-name">
                  {entry.karakter.név || 'Névtelen'} ({entry.karakter.tsz}sz)
                </span>
                {isExisting && <span className="backup-restore-warn" title="Már létezik a Karaktertárban">⚠️</span>}
              </div>
            );
          })}
        </div>
        {dátum && <div className="backup-restore-date">Backup dátuma: {formatDátum(dátum)}</div>}
        <div className="kep-prompt-btns" style={{ justifyContent: 'center' }}>
          <button
            className="menu-item"
            disabled={selected.size === 0}
            onClick={() => setShowConfirm(true)}
          >
            Betöltés ({selected.size})
          </button>
        </div>
      </div>
    </OverlayPortal>
  );
}
