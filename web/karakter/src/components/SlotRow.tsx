import type { SlotEntry } from '../hooks/slot-utils';

interface Props {
  slot: SlotEntry;
  active: boolean;
  /** uid currently being saved (shows spinner in place of 💾), or null. */
  savingId: string | null;
  /** Web Share API available (📤 megosztás gomb megjelenítése). */
  canShare: boolean;
  onLoad: (uid: string) => void;
  onShare: (uid: string) => void;
  onSaveSlot: (uid: string) => void;
  onShareFile: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onDelete: (uid: string, név: string) => void;
}

/** Egy karakter slot kártya: név + TSz + akció chipek (🔗 💾 📤 ⧉ ✕). */
export function SlotRow({ slot: s, active, savingId, canShare, onLoad, onShare, onSaveSlot, onShareFile, onDuplicate, onDelete }: Props) {
  const activeCls = active ? ' slot-name-active' : '';
  return (
    <div className={`slot-row ${active ? 'slot-row-active' : ''}`} onClick={() => onLoad(s.uid)}>
      <div className="slot-row-top">
        <span className={`slot-name${activeCls}`}>{s.név || s.becenév || 'Névtelen'}</span>
        <span className={`slot-tsz${activeCls}`}> ({s.tsz || '?'}sz)</span>
      </div>
      <div className="slot-chips">
        <button className="slot-chip" title="Link másolása" onClick={e => { e.stopPropagation(); onShare(s.uid); }}>🔗</button>
        <button className="slot-chip" title="Mentés fájlba" onClick={e => { e.stopPropagation(); onSaveSlot(s.uid); }}>
          {savingId === s.uid ? <span className="slot-btn-spinner" /> : '💾'}
        </button>
        {canShare && (
          <button className="slot-chip" title="Megosztás" onClick={e => { e.stopPropagation(); onShareFile(s.uid); }}>📤</button>
        )}
        <button className="slot-chip" title="Duplikál" onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}>⧉</button>
        <button className="slot-chip slot-chip-del" title="Törlés" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || s.becenév || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</button>
      </div>
    </div>
  );
}
