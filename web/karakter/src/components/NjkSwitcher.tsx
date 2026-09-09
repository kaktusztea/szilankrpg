import type { Karakter } from '../engine/types';
import { readSlots, loadSlotKarakter } from '../hooks/slot-utils';
import { njkSlots } from '../hooks/njk-slots';

interface Props {
  activeUid: string;
  onLoad: (karakter: Karakter, undo: any[]) => void;
}

/**
 * KM eszköz: fix sáv a Header alatt NJK karakter aktív állapotában.
 * Boxok (becenév vagy név) — katt = váltás arra az NJK-ra.
 * Ha nem férnek egy sorba, új sáv nyílik (nincs sáv-limit); a sávok számát
 * a tárolt NJK limit (MAX_NJK_DB) tartja kordában.
 */
export function NjkSwitcher({ activeUid, onLoad }: Props) {
  const njkok = njkSlots(readSlots());
  if (njkok.length === 0) return null;

  return (
    <div className="njk-bar">
      {njkok.map(s => (
        <button
          key={s.uid}
          className={`njk-box${s.uid === activeUid ? ' njk-box-active' : ''}`}
          onClick={() => {
            if (s.uid === activeUid) return;
            const loaded = loadSlotKarakter(s.uid);
            if (loaded) onLoad(loaded.karakter, loaded.undo);
          }}
        >
          {s.név}
        </button>
      ))}
    </div>
  );
}
