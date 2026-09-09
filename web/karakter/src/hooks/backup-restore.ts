import type { Karakter } from '../engine/types';
import { MAX_KARAKTER_DB, MAX_NJK_DB } from '../ui-constants';
import { readSlots, writeSlots, type SlotEntry } from './slot-utils';
import { njkCount } from './njk-slots';

export interface BackupItem {
  karakter: Karakter;
  undo: unknown[];
}

/**
 * Restores selected characters from a backup into localStorage slots.
 *
 * Existing slots (matched by uid) are overwritten; new characters are inserted
 * up to MAX_KARAKTER_DB, and NJK characters up to MAX_NJK_DB. Items over a limit
 * are silently skipped. Returns the last successfully restored item so the
 * caller can activate it, or null if nothing was restored.
 */
export function restoreBackup(selected: BackupItem[]): BackupItem | null {
  const slots = readSlots();
  const maxNew = MAX_KARAKTER_DB - slots.length;
  let newInserted = 0;
  let njkStored = njkCount(slots);
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

    // Would this item raise the stored NJK count above the limit? → skip.
    // (Nem `njkLimitBlocked`: itt a cikluson belül inkrementálisan számolunk.)
    const wasNjk = existingIdx >= 0 && slots[existingIdx].jk === false;
    const isNjk = entry.jk === false;
    if (isNjk && !wasNjk && njkStored >= MAX_NJK_DB) continue;

    try {
      localStorage.setItem(`szilank_char_${k.uid}`, JSON.stringify({ ...k, _undo: undo }));
      if (existingIdx >= 0) { slots[existingIdx] = entry; }
      else { slots.push(entry); newInserted++; }
      njkStored += (isNjk ? 1 : 0) - (wasNjk ? 1 : 0);
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
