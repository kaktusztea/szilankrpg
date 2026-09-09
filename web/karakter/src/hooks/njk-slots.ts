import { MAX_NJK_DB } from '../ui-constants';
import { readSlots, type SlotEntry } from './slot-utils';

/**
 * NJK (Nem Játékos Karakter) slot szabályok: tárolási limit + a switcher sáv adatai.
 * Egy karakter akkor NJK, ha `jk === false` (a hiányzó `jk` JK-t jelent).
 */

/** Tárolt NJK slotok száma. */
export function njkCount(slots: SlotEntry[] = readSlots()): number {
  return slots.filter(s => s.jk === false).length;
}

/**
 * Túllépné-e a tárolt NJK limitet, ha ez a karakter a megadott slotba kerül?
 * Egyetlen hely, ahol az NJK limit szabálya el van döntve (import, duplikálás,
 * fájl betöltés, JK/NJK toggle).
 *
 * @param jk a karakter `jk` mezője (`false` = NJK)
 * @param overwriteUid ha meglévő slotba kerül, annak uid-ja (különben új slot)
 */
export function njkLimitBlocked(jk: boolean | undefined, overwriteUid?: string | null): boolean {
  if (jk !== false) return false;                     // JK karakter nem érinti az NJK limitet
  const slots = readSlots();
  const target = overwriteUid ? slots.find(s => s.uid === overwriteUid) : undefined;
  if (target?.jk === false) return false;             // már NJK slot → a szám nem nő
  return njkCount(slots) >= MAX_NJK_DB;
}

/** Egy NJK slot a switcher sávhoz: uid + megjelenítendő név. */
export interface NjkSlot {
  uid: string;
  név: string;
}

/**
 * NJK slotok a switcher sávhoz: becenév, ha van, különben név.
 * ABC sorrend, hogy a boxok pozíciója ne ugráljon autosave-kor.
 * A `MAX_NJK_DB` slice csak védőháló — a tárolási limit ezt már betartatja.
 */
export function njkSlots(slots: SlotEntry[]): NjkSlot[] {
  return slots
    .filter(s => s.jk === false)
    .map(s => ({ uid: s.uid, név: s.becenév || s.név || 'Névtelen' }))
    .sort((a, b) => a.név.localeCompare(b.név, 'hu'))
    .slice(0, MAX_NJK_DB);
}
