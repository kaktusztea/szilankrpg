import type { SlotEntry } from '../hooks/slot-utils';

interface Props {
  slot: SlotEntry;
  active: boolean;
  onLoad: (uid: string) => void;
  onSaveOptions: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onDelete: (uid: string, név: string) => void;
}

/** Egy karakter slot kártya: név + TSz + akció chipek (💾 ⧉ ✕). */
export function SlotRow({ slot: s, active, onLoad, onSaveOptions, onDuplicate, onDelete }: Props) {
  const activeCls = active ? ' slot-name-active' : '';
  return (
    <div className={`slot-row ${active ? 'slot-row-active' : ''}`} onClick={() => onLoad(s.uid)}>
      <div className="slot-row-top">
        <span className={`slot-name${activeCls}`}>{s.név || s.becenév || 'Névtelen'}</span>
        <span className={`slot-tsz${activeCls}`}> ({s.tsz || '?'}sz)</span>
      </div>
      <div className="slot-chips">
        <button className="slot-chip" title="Mentés / Exportálás" onClick={e => { e.stopPropagation(); onSaveOptions(s.uid); }}>💾</button>
        <button className="slot-chip" title="Duplikál" onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}>⧉</button>
        <button className="slot-chip slot-chip-del" title="Törlés" onClick={e => { e.stopPropagation(); onDelete(s.uid, `${s.név || s.becenév || 'Névtelen'} (${s.tsz || '?'}sz)`); }}>✕</button>
      </div>
    </div>
  );
}
