import { MAX_KARAKTER_DB } from '../ui-constants';

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

/** Returns true if the slot list has reached MAX_KARAKTER_DB. */
export function isSlotFull(): boolean {
  return readSlots().length >= MAX_KARAKTER_DB;
}
