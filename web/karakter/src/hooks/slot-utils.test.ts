import { describe, it, expect, beforeEach } from 'vitest';
import { sémaVerzióHiba } from '../engine/validate';
import { upsertSlotEntry, readSlots, isUidTaken, loadSlotKarakter, removeSlotData } from './slot-utils';
import type { Karakter } from '../engine/types';
import { installLocalStorage } from '../__tests__/localstorage-stub';

const kar = (uid: string, név: string, jk = true) =>
  ({ uid, id_leíró: `${név}-3sz`, név, becenév: '', tsz: 3, jk }) as Karakter;

describe('upsertSlotEntry', () => {
  beforeEach(() => installLocalStorage());

  it('új karakter a lista élére kerül, meglévő helyben cserélődik', () => {
    upsertSlotEntry(kar('a', 'Agabor'));
    upsertSlotEntry(kar('b', 'Bandita'));
    expect(readSlots().map(s => s.uid)).toEqual(['b', 'a']);

    upsertSlotEntry(kar('a', 'Agabor átnevezve', false));
    const slots = readSlots();
    expect(slots.map(s => s.uid)).toEqual(['b', 'a']);       // sorrend marad
    expect(slots.find(s => s.uid === 'a')?.név).toBe('Agabor átnevezve');
    expect(slots.find(s => s.uid === 'a')?.jk).toBe(false);  // jk is frissül
  });
});

describe('isUidTaken', () => {
  beforeEach(() => installLocalStorage());

  it('csak a már tárolt uid-ra igaz', () => {
    upsertSlotEntry(kar('a', 'Agabor'));
    expect(isUidTaken('a')).toBe(true);
    expect(isUidTaken('b')).toBe(false);
  });
});

describe('loadSlotKarakter', () => {
  beforeEach(() => installLocalStorage());

  it('nincs adat vagy sérült JSON → null', () => {
    expect(loadSlotKarakter('nincs')).toBeNull();
    localStorage.setItem('szilank_char_rossz', '{ nem json');
    expect(loadSlotKarakter('rossz')).toBeNull();
  });

  it('érvénytelen sémájú karakter → null (nem tölt be szemetet)', () => {
    localStorage.setItem('szilank_char_x', JSON.stringify({ valami: 1 }));
    expect(loadSlotKarakter('x')).toBeNull();
    // Elavult sémaverzió: nem null, hanem a felhasználói hibaüzenet (konverzió nincs)
    localStorage.setItem('szilank_char_v2', JSON.stringify({ schema_version: 2 }));
    expect(loadSlotKarakter('v2')).toEqual({ error: sémaVerzióHiba(2) });
  });

  it('elavult sémaverziónál NEM töröl (tiszta olvasó - NjkSwitcher renderben hívja)', () => {
    upsertSlotEntry(kar('v2', 'Régi'));
    localStorage.setItem('szilank_char_v2', JSON.stringify({ schema_version: 2 }));
    loadSlotKarakter('v2');
    expect(localStorage.getItem('szilank_char_v2')).not.toBeNull();
    expect(readSlots().some(s => s.uid === 'v2')).toBe(true);
  });
});

describe('removeSlotData', () => {
  beforeEach(() => installLocalStorage());

  it('törli a karakter adatot + slot metaadatot + active flaget', () => {
    upsertSlotEntry(kar('a', 'Agabor'));
    upsertSlotEntry(kar('b', 'Bandita'));
    localStorage.setItem('szilank_char_a', JSON.stringify(kar('a', 'Agabor')));
    localStorage.setItem('szilank_active', 'a');

    removeSlotData('a');

    expect(localStorage.getItem('szilank_char_a')).toBeNull();
    expect(readSlots().map(s => s.uid)).toEqual(['b']);
    expect(localStorage.getItem('szilank_active')).toBeNull();  // az aktív flag törlődik
  });

  it('nem aktív slot törlése az active flaget békén hagyja', () => {
    upsertSlotEntry(kar('a', 'Agabor'));
    upsertSlotEntry(kar('b', 'Bandita'));
    localStorage.setItem('szilank_active', 'b');
    removeSlotData('a');
    expect(localStorage.getItem('szilank_active')).toBe('b');
  });
});
