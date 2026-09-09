import { describe, it, expect, beforeEach } from 'vitest';
import type { Karakter } from '../engine/types';
import { MAX_KARAKTER_DB, MAX_NJK_DB } from '../ui-constants';
import { restoreBackup, type BackupItem } from './backup-restore';
import { readSlots } from './slot-utils';
import { installLocalStorage } from '../__tests__/localstorage-stub';

function makeItem(uid: string, név = uid): BackupItem {
  return {
    karakter: { uid, id_leíró: `${név}-1sz`, név, tsz: 1 } as Karakter,
    undo: [{ tag: uid }],
  };
}

describe('restoreBackup', () => {
  beforeEach(() => installLocalStorage());

  it('restores into empty slots and returns the last item', () => {
    const items = [makeItem('a'), makeItem('b')];
    const last = restoreBackup(items);

    expect(last?.karakter.uid).toBe('b');
    expect(readSlots().map(s => s.uid).sort()).toEqual(['a', 'b']);
    // Character payload persisted with its undo stack under the per-uid key.
    const stored = JSON.parse(localStorage.getItem('szilank_char_a')!);
    expect(stored._undo).toEqual([{ tag: 'a' }]);
    // Active pointer set to the last restored character.
    expect(localStorage.getItem('szilank_active')).toBe('b');
  });

  it('overwrites an existing slot with the same uid instead of duplicating', () => {
    restoreBackup([makeItem('a', 'Régi')]);
    restoreBackup([makeItem('a', 'Új')]);

    const slots = readSlots();
    expect(slots.filter(s => s.uid === 'a')).toHaveLength(1);
    expect(slots.find(s => s.uid === 'a')?.név).toBe('Új');
  });

  it('does not insert new characters beyond MAX_KARAKTER_DB', () => {
    const items = Array.from({ length: MAX_KARAKTER_DB + 3 }, (_, i) => makeItem(`u${i}`));
    restoreBackup(items);

    expect(readSlots()).toHaveLength(MAX_KARAKTER_DB);
  });

  it('does not insert new NJK characters beyond MAX_NJK_DB', () => {
    const njk = (uid: string) => {
      const item = makeItem(uid);
      (item.karakter as { jk?: boolean }).jk = false;
      return item;
    };
    restoreBackup(Array.from({ length: MAX_NJK_DB + 3 }, (_, i) => njk(`n${i}`)));

    const slots = readSlots();
    expect(slots.filter(s => s.jk === false)).toHaveLength(MAX_NJK_DB);
    // A JK karakterek visszaállítása nem sérül az NJK limit miatt
    restoreBackup([makeItem('jk1')]);
    expect(readSlots().find(s => s.uid === 'jk1')).toBeDefined();
  });

  it('returns null when nothing can be restored (empty selection)', () => {
    expect(restoreBackup([])).toBeNull();
  });
});
