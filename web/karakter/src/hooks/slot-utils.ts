import { MAX_KARAKTER_DB } from '../ui-constants';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { isValidKarakter } from '../engine/validate';
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
 * Betölt egy tárolt slotot localStorage-ből: parse + séma validáció + default merge.
 * null, ha nincs meg, sérült, vagy nem valid karakter.
 */
export function loadSlotKarakter(uid: string): { karakter: Karakter; undo: any[] } | null {
  const charData = localStorage.getItem(`szilank_char_${uid}`);
  if (!charData) return null;
  try {
    const parsed = JSON.parse(charData);
    if (!isValidKarakter(parsed)) return null;
    return {
      karakter: {
        ...parsed,
        jk: parsed.jk ?? true,
        előtörténet: { ...DEFAULT_ELOTORTENET, ...parsed.előtörténet },
        session: { ...DEFAULT_SESSION, ...parsed.session },
        checkpoints: parsed.checkpoints || [],
      },
      undo: sanitizeUndo((parsed as { _undo?: unknown })._undo),
    };
  } catch {
    return null;
  }
}
