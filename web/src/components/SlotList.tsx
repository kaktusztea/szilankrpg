import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import { validateKarakter } from '../engine/validate';

interface SlotEntry {
  uid: string;
  id_leíró: string;
  név: string;
  tsz: number;
  mentés_dátum: string;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'most';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} perce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} órája`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} napja`;
  return `${Math.floor(diff / 604800000)} hete`;
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
  onTest: () => void;
  onFileLoad: () => void;
}

export function SlotList({ activeUid, onLoad, onDelete, onShare, onTest, onFileLoad }: Props) {
  let slots: SlotEntry[] = [];
  try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
  slots.sort((a, b) => b.mentés_dátum.localeCompare(a.mentés_dátum));

  function loadSlot(uid: string) {
    const charData = localStorage.getItem(`szilank_char_${uid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData);
      if (validateKarakter(parsed)) {
        onLoad({ ...parsed, session: { ...DEFAULT_SESSION, ...parsed.session } }, (parsed as any)._undo || []);
      }
    } catch { /* */ }
  }

  return (
    <>
      <div className="slot-list">
        {slots.map(s => (
          <div key={s.uid} className={`slot-row ${activeUid === s.uid ? 'slot-row-active' : ''}`}>
            <span className={`slot-name ${activeUid === s.uid ? 'slot-name-active' : ''}`}
              onClick={() => loadSlot(s.uid)}>
              {activeUid === s.uid ? '●' : '○'} {truncSlotName(s.név)} ({s.tsz || '?'}sz)
            </span>
            <span className="slot-time">{relTime(s.mentés_dátum)}</span>
            <span className="slot-share-btn" onClick={e => { e.stopPropagation(); onShare(s.uid); }}>🔗</span>
            <span className="slot-delete-btn" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</span>
          </div>
        ))}
        {slots.length === 0 && <span className="slot-empty">Nincs mentett karakter</span>}
      </div>
      <div className="slot-actions">
        <button className="menu-item slot-test-btn" onClick={onTest}>🧪 Teszt</button>
        <button className="menu-item slot-file-btn" onClick={onFileLoad}>📁 Fájlból...</button>
      </div>
      {slots.length >= 10 && <span className="slot-max-warning">Max 10 slot — töröld egy régit fájlba mentés után</span>}
    </>
  );
}
