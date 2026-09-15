import type { Karakter } from '../engine/types';
import type { SlotEntry } from '../hooks/slot-utils';
import { readSlots, loadSlotKarakter } from '../hooks/slot-utils';
import { njkSlots } from '../hooks/njk-slots';

interface Props {
  /** Az aktív karakter — a persistált slot-metaadat frissítése (autosave) előtt is
   *  ez az autoritatív állapota (jk, becenév, név), hogy a sáv azonnal helyes legyen. */
  aktív: Karakter;
  onLoad: (karakter: Karakter, undo: any[]) => void;
}

/**
 * KM eszköz: fix sáv a Header alatt NJK karakter aktív állapotában.
 * Boxok (becenév vagy név) — katt = váltás arra az NJK-ra.
 * Ha nem férnek egy sorba, új sáv nyílik (nincs sáv-limit); a sávok számát
 * a tárolt NJK limit (MAX_NJK_DB) tartja kordában.
 */
export function NjkSwitcher({ aktív, onLoad }: Props) {
  // Az aktív karakter friss állapotát ráolvassuk a persistált slotokra: a JK/NJK váltás
  // React-state-ben azonnal megvan, a slot-metaadatot viszont az autosave csak később írja.
  const slots = mergeAktív(readSlots(), aktív);
  const njkok = njkSlots(slots);
  if (njkok.length === 0) return null;

  return (
    <div className="njk-bar">
      {njkok.map(s => (
        <button
          key={s.uid}
          className={`njk-box${s.uid === aktív.uid ? ' njk-box-active' : ''}`}
          onClick={() => {
            if (s.uid === aktív.uid) return;
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

/** A persistált slotlistába beolvassa az aktív karakter friss jk/becenév/név állapotát. */
export function mergeAktív(slots: SlotEntry[], aktív: Karakter): SlotEntry[] {
  const idx = slots.findIndex(s => s.uid === aktív.uid);
  if (idx >= 0) {
    const copy = slots.slice();
    copy[idx] = { ...copy[idx], jk: aktív.jk, becenév: aktív.becenév, név: aktív.név };
    return copy;
  }
  // Ritka: a slot még nem létezik (autosave nem futott) — az aktív karakterből építjük.
  return [...slots, {
    uid: aktív.uid, id_leíró: aktív.id_leíró, név: aktív.név, becenév: aktív.becenév,
    tsz: aktív.tsz, mentés_dátum: aktív.mentés_dátum, jk: aktív.jk,
  }];
}
