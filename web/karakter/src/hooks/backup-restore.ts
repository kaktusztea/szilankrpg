import type { Karakter } from '../engine/types';
import { MAX_KARAKTER_DB } from '../ui-constants';
import { readSlots, writeSlots, type SlotEntry } from './slot-utils';

export interface BackupItem {
  karakter: Karakter;
  undo: unknown[];
}

/**
 * Restores selected characters from a backup into localStorage slots.
 *
 * Existing slots (matched by uid) are overwritten; new characters are inserted
 * up to MAX_KARAKTER_DB. Returns the last successfully restored item so the
 * caller can activate it, or null if nothing was restored.
 */
export function restoreBackup(selected: BackupItem[]): BackupItem | null {
  const slots = readSlots();
  const maxNew = MAX_KARAKTER_DB - slots.length;
  let newInserted = 0;
  let last: BackupItem | null = null;

  for (const item of selected) {
    const { karakter: k, undo } = item;
    const existingIdx = slots.findIndex(sl => sl.uid === k.uid);
    // New character but the slot list is full → skip.
    if (existingIdx < 0 && newInserted >= maxNew) continue;

    const entry: SlotEntry = {
      uid: k.uid,
      id_leíró: k.id_leíró,
      név: k.név,
      becenév: (k as { becenév?: string }).becenév || '',
      tsz: k.tsz,
      mentés_dátum: (k as { mentés_dátum?: string }).mentés_dátum || new Date().toISOString(),
      jk: (k as { jk?: boolean }).jk ?? true,
    };

    try {
      localStorage.setItem(`szilank_char_${k.uid}`, JSON.stringify({ ...k, _undo: undo }));
      if (existingIdx >= 0) { slots[existingIdx] = entry; }
      else { slots.push(entry); newInserted++; }
      last = item;
    } catch {
      // quota exceeded → stop restoring further items
      break;
    }
  }

  writeSlots(slots);

  if (last) localStorage.setItem('szilank_active', last.karakter.uid);
  return last;
}
