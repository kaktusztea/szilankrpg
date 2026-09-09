import { describe, it, expect, beforeEach } from 'vitest';
import { upsertSlotEntry, readSlots, loadSlotKarakter } from './slot-utils';
import { njkSlots, njkLimitBlocked } from './njk-slots';
import { MAX_NJK_DB } from '../ui-constants';
import { installLocalStorage } from '../__tests__/localstorage-stub';
import { validKarakter } from '../__tests__/karakter-fixture';

/**
 * Az NJK switcher sáv teljes adatútja React nélkül:
 * autosave írás (char + slot entry) → sáv lista → visszatöltés.
 */
function mentés(uid: string, név: string, becenév: string, jk: boolean) {
  const k = validKarakter({ uid, id_leíró: `${név}-4sz`, név, becenév, jk });
  localStorage.setItem(`szilank_char_${uid}`, JSON.stringify({ ...k, _undo: [] }));
  upsertSlotEntry(k);
  return k;
}

describe('NJK switcher adatút', () => {
  beforeEach(() => installLocalStorage());

  it('csak NJK-kat sorol fel, becenévvel, ABC-ben — és a boxra kattintva visszatölthető', () => {
    mentés('u1', 'von Agabor', 'Agi', true);      // JK → nem kerül a sávba
    mentés('u2', 'Zord Zoltán', 'Zordi', false);
    mentés('u3', 'Bandita Béla', '', false);      // becenév üres → név

    const sáv = njkSlots(readSlots());
    expect(sáv).toEqual([
      { uid: 'u3', név: 'Bandita Béla' },
      { uid: 'u2', név: 'Zordi' },
    ]);

    // Box katt: a slot betölthető, a session default-ok bekerülnek
    const betöltött = loadSlotKarakter('u2');
    expect(betöltött?.karakter.név).toBe('Zord Zoltán');
    expect(betöltött?.karakter.jk).toBe(false);
    expect(betöltött?.karakter.session.fegyverfogás).toBe('egyfegyveres');
    expect(betöltött?.undo).toEqual([]);
  });

  it('a becenév átírása után a sáv az új nevet mutatja (autosave frissíti a slot entryt)', () => {
    mentés('u2', 'Zord Zoltán', 'Zordi', false);
    expect(njkSlots(readSlots())[0].név).toBe('Zordi');

    mentés('u2', 'Zord Zoltán', 'Zozó', false);   // ugyanaz az uid → helyben csere
    expect(readSlots()).toHaveLength(1);
    expect(njkSlots(readSlots())[0].név).toBe('Zozó');
  });

  it('a tárolt NJK limit elérésekor új NJK blokkolt, JK viszont nem', () => {
    for (let i = 0; i < MAX_NJK_DB; i++) mentés(`n${i}`, `NJK ${i}`, '', false);
    expect(njkSlots(readSlots())).toHaveLength(MAX_NJK_DB);
    expect(njkLimitBlocked(false)).toBe(true);
    expect(njkLimitBlocked(true)).toBe(false);
  });
});
