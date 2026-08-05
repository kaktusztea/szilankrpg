import { describe, it, expect, beforeEach } from 'vitest';
import type { Karakter } from '../engine/types';
import { MAX_KARAKTER_DB } from '../ui-constants';
import { restoreBackup, type BackupItem } from './backup-restore';
import { readSlots } from './slot-utils';

// Minimal in-memory localStorage stub (vitest runs in node, no DOM).
function installLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

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

  it('returns null when nothing can be restored (empty selection)', () => {
    expect(restoreBackup([])).toBeNull();
  });
});
