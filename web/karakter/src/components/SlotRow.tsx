import { Ikon } from './common/Ikon';
import type { SlotEntry } from '../hooks/slot-utils';

interface Props {
  slot: SlotEntry;
  displayName: string;
  active: boolean;
  onLoad: (uid: string) => void;
  onSaveOptions: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onDelete: (uid: string, név: string) => void;
  /** Játék módban a Másolat / Törlés inaktív. */
  gameMode: boolean;
}

/** Egy karakter slot kártya: név + TSz + akció chipek (💾 ⧉ ✕). */
export function SlotRow({ slot: s, displayName, active, onLoad, onSaveOptions, onDuplicate, onDelete, gameMode }: Props) {
  const activeCls = active ? ' slot-name-active' : '';
  return (
    <div className={`slot-row ${active ? 'slot-row-active' : ''}`} onClick={() => onLoad(s.uid)}>
      <div className="slot-row-top">
        <span className={`slot-name${activeCls}`}>{displayName}</span>
        <span className={`slot-tsz${activeCls}`}> ({s.tsz || '?'}sz)</span>
      </div>
      <div className="slot-chips">
        <button className="slot-chip" title="Mentés / Exportálás" onClick={e => { e.stopPropagation(); onSaveOptions(s.uid); }}><Ikon név="mentés" /><span>Mentés</span></button>
        <button className="slot-chip" title="Duplikál" disabled={gameMode} onClick={e => { e.stopPropagation(); onDuplicate(s.uid); }}><Ikon név="másolat" /><span>Másolat</span></button>
        <button className="slot-chip slot-chip-del" title="Törlés" disabled={gameMode} onClick={e => { e.stopPropagation(); onDelete(s.uid, `${displayName} (${s.tsz || '?'}sz)`); }}><Ikon név="bezár" /><span>Törlés</span></button>
      </div>
    </div>
  );
}
