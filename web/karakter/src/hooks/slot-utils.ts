import { MAX_KARAKTER_DB } from '../ui-constants';

/** Returns true if the slot list has reached MAX_KARAKTER_DB. */
export function isSlotFull(): boolean {
  try {
    const slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]');
    return Array.isArray(slots) && slots.length >= MAX_KARAKTER_DB;
  } catch {
    return false;
  }
}
