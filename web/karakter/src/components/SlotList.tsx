import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import { validateKarakter } from '../engine/validate';
import { sanitizeUndo } from '../hooks/useUndo';

interface SlotEntry {
  uid: string;
  id_leíró: string;
  név: string;
  tsz: number;
  mentés_dátum: string;
}

function truncSlotName(név: string | undefined): string {
  const n = név || 'Névtelen';
  const vm = n.match(/ v(\d+)$/);
  const base = vm ? n.slice(0, -vm[0].length) : n;
  const truncated = base.length > 15 ? base.slice(0, 15) + '..' : base;
  return truncated + (vm ? ` v${vm[1]}` : '');
}

interface Props {
  activeUid: string | undefined;
  onLoad: (karakter: Karakter, undo: any[]) => void;
  onDelete: (uid: string, név: string) => void;
  onShare: (uid: string) => void;
  onSaveFile: (uid: string) => void;
  onShareFile: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onFileLoad: () => void;
  onNew: () => void;
  onSave: () => void;
  newDisabled: boolean;
  onTest: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function SlotList({ activeUid, onLoad, onDelete, onShare, onSaveFile, onShareFile, onDuplicate, onFileLoad, onNew, onSave, newDisabled, onTest, onFullscreenHint, onClose }: Props) {
  let slots: SlotEntry[] = [];
  try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
  slots.sort((a, b) => b.mentés_dátum.localeCompare(a.mentés_dátum));

  function loadSlot(uid: string) {
    const charData = localStorage.getItem(`szilank_char_${uid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData);
      if (validateKarakter(parsed)) {
        onLoad({ ...parsed, session: { ...DEFAULT_SESSION, ...parsed.session } }, sanitizeUndo((parsed as any)._undo));
      }
    } catch { /* */ }
  }

  return (
    <>
      <div className="slot-actions slot-actions-top">
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled} title="Új karakter" onClick={() => { if (!newDisabled) onNew(); }}>📄</button>
        <button className="menu-item slot-file-btn" title="Betöltés fájlból" onClick={onFileLoad}>📁</button>
        <button className={`menu-item slot-file-btn${newDisabled ? ' is-disabled' : ''}`} aria-disabled={newDisabled} title="Backup mentése" onClick={() => { if (!newDisabled) onSave(); }}>📦</button>
      </div>
      <div className="slot-list">
        {slots.map(s => (
          <div key={s.uid} className={`slot-row ${activeUid === s.uid ? 'slot-row-active' : ''}`}>
            <div className="slot-row-top">
              <span className={`slot-name ${activeUid === s.uid ? 'slot-name-active' : ''}`}
                onClick={() => loadSlot(s.uid)}>
                {activeUid === s.uid ? '●' : '○'} {truncSlotName(s.név)} ({s.tsz || '?'}sz)
              </span>
            </div>
            <div className="slot-chips">
              <button className="slot-chip" title="Link másolása" onClick={e => { e.stopPropagation(); onShare(s.uid); }}>🔗</button>
              <button className="slot-chip" title="Mentés fájlba" onClick={e => { e.stopPropagation(); onSaveFile(s.uid); }}>💾</button>
              {typeof navigator.share === 'function' && (
                <button className="slot-chip" title="Megosztás" onClick={e => { e.stopPropagation(); onShareFile(s.uid); }}>📤</button>
              )}
              <button className="slot-chip" title="Duplikál" onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}>⧉</button>
              <button className="slot-chip slot-chip-del" title="Törlés" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</button>
            </div>
          </div>
        ))}
        {slots.length === 0 && <span className="slot-empty">Nincs mentett karakter</span>}
      </div>
      <div className="menu-footer">
        <button className="menu-test-chip" onClick={onTest}>T</button>
        <span className="menu-build">{__APP_VERSION__}</span>
        {document.fullscreenEnabled ? (
          <button className="menu-fs-chip" title="Teljes képernyő" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
            onClose();
          }}>⛶</button>
        ) : (!window.matchMedia('(display-mode: standalone)').matches && (
          <button className="menu-fs-chip" title="Teljes képernyő" onClick={onFullscreenHint}>⛶</button>
        ))}
      </div>
    </>
  );
}
