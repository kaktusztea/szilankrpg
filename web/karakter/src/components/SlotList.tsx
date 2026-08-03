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
}

export function SlotList({ activeUid, onLoad, onDelete, onShare, onSaveFile, onShareFile, onDuplicate, onFileLoad }: Props) {
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
      <div className="slot-list">
        {slots.map(s => (
          <div key={s.uid} className={`slot-row ${activeUid === s.uid ? 'slot-row-active' : ''}`}>
            <div className="slot-row-top">
              <span className={`slot-name ${activeUid === s.uid ? 'slot-name-active' : ''}`}
                onClick={() => loadSlot(s.uid)}>
                {activeUid === s.uid ? '●' : '○'} {truncSlotName(s.név)} ({s.tsz || '?'}sz)
              </span>
              <span className="slot-delete-btn" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</span>
            </div>
            <div className="slot-chips">
              <button className="slot-chip" onClick={e => { e.stopPropagation(); onShare(s.uid); }}>🔗 Link másolása</button>
              <button className="slot-chip" onClick={e => { e.stopPropagation(); onSaveFile(s.uid); }}>💾 Mentés fájlba</button>
            </div>
            <div className="slot-chips">
              {typeof navigator.share === 'function' && (
                <button className="slot-chip" onClick={e => { e.stopPropagation(); onShareFile(s.uid); }}>📤 Megosztás</button>
              )}
              <button className="slot-chip" onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}>📋 Duplikál</button>
            </div>
          </div>
        ))}
        {slots.length === 0 && <span className="slot-empty">Nincs mentett karakter</span>}
      </div>
      <div className="slot-actions">
        <button className="menu-item slot-file-btn" onClick={onFileLoad}>📁 Fájlból...</button>
      </div>
    </>
  );
}
