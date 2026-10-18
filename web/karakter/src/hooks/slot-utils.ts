import { MAX_KARAKTER_DB } from '../ui-constants';
import type { Karakter, StoredKarakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { isValidKarakter, sémaVerzióHiba } from '../engine/validate';
import { removeKmJelölés } from './km-jelolesek';
import { sanitizeUndo } from './useUndo';

const SLOTS_KEY = 'szilank_slots';

/** Egy mentett karakter slot metaadata a `szilank_slots` listában. */
export interface SlotEntry {
  uid: string;
  id_leíró: string;
  név: string;
  becenév?: string;
  tsz: number;
  mentés_dátum: string;
  jk?: boolean;
}

/** Beolvassa a slot listát localStorage-ből. Hibás/hiányzó adatnál üres tömb. */
export function readSlots(): SlotEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLOTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Kiírja a slot listát localStorage-be. */
export function writeSlots(slots: SlotEntry[]): void {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

/**
 * Slot metaadat beírása a karakterből: meglévő uid helyben cserélve,
 * új karakter a lista élére. Az autosave és a betöltési/import utak közös írója.
 */
export function upsertSlotEntry(k: Karakter): void {
  const slots = readSlots();
  const entry: SlotEntry = {
    uid: k.uid,
    id_leíró: k.id_leíró,
    név: k.név,
    becenév: k.becenév,
    tsz: k.tsz,
    mentés_dátum: new Date().toISOString(),
    jk: k.jk ?? true,
  };
  const idx = slots.findIndex(s => s.uid === k.uid);
  if (idx >= 0) slots[idx] = entry; else slots.unshift(entry);
  writeSlots(slots);
}

/** Returns true if the slot list has reached MAX_KARAKTER_DB. */
export function isSlotFull(): boolean {
  return readSlots().length >= MAX_KARAKTER_DB;
}

/** Van már ilyen uid-ú slot? */
export function isUidTaken(uid: string): boolean {
  return readSlots().some(s => s.uid === uid);
}

/**
 * Egy slot teljes eltávolítása a karaktertárból: karakter adat + slot metaadat + KM jelölés.
 * Ha ez volt az aktív karakter, az `szilank_active` flaget is törli.
 * NEM nyúl React state-hez (l. useKarakterActions.deleteSlot a state-kezelő változatért).
 */
export function removeSlotData(uid: string): void {
  localStorage.removeItem(`szilank_char_${uid}`);
  removeKmJelölés(uid);
  writeSlots(readSlots().filter(s => s.uid !== uid));
  if (localStorage.getItem('szilank_active') === uid) localStorage.removeItem('szilank_active');
}

/**
 * Betölt egy tárolt slotot localStorage-ből: parse + séma validáció + default merge.
 * null, ha nincs meg, sérült, vagy nem valid karakter; `{ error }`, ha elavult sémaverziójú (konverzió nincs).
 * Tiszta olvasó (NINCS mellékhatás - a NjkSwitcher renderelés közben is hívja). Az elavult példány
 * eltávolítása a hívó felelőssége az `error` ág kezelésekor (`removeSlotData`).
 */
export function loadSlotKarakter(uid: string): { karakter: Karakter; undo: any[] } | { error: string } | null {
  const charData = localStorage.getItem(`szilank_char_${uid}`);
  if (!charData) return null;
  try {
    const parsed = JSON.parse(charData);
    const vHiba = sémaVerzióHiba(parsed?.schema_version);
    if (vHiba) return { error: vHiba };
    if (!isValidKarakter(parsed)) return null;
    return {
      karakter: {
        ...parsed,
        jk: parsed.jk ?? true,
        előtörténet: { ...DEFAULT_ELOTORTENET, ...parsed.előtörténet },
        session: { ...DEFAULT_SESSION, ...parsed.session },
        checkpoints: parsed.checkpoints || [],
      },
      undo: sanitizeUndo((parsed as StoredKarakter)._undo),
    };
  } catch {
    return null;
  }
}
