import { describe, it, expect, beforeEach } from 'vitest';
import { upsertSlotEntry, readSlots, loadSlotKarakter } from './slot-utils';
import { njkSlots, njkLimitBlocked, életerőStat } from './njk-slots';
import { mergeAktív } from '../components/NjkSwitcher';
import { MAX_NJK_DB } from '../ui-constants';
import { installLocalStorage } from '../__tests__/localstorage-stub';
import { validKarakter } from '../__tests__/karakter-fixture';
import { loadGameDataSync } from '../__tests__/load-gamedata';

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

describe('mergeAktív — friss JK/NJK állapot a persistált slot előtt', () => {
  beforeEach(() => installLocalStorage());

  it('JK→NJK váltás azonnal megjelenik a sávban, még ha a slot-metaadat JK-t mutat is', () => {
    // Slot-metaadat: még JK (autosave nem futott a váltás után).
    const stale = mentés('u1', 'Aktív Alfonz', 'Alfi', true);
    expect(njkSlots(readSlots())).toEqual([]); // JK → nincs a sávban

    // Az aktív karakter React-state-ben már NJK.
    const merged = mergeAktív(readSlots(), { ...stale, jk: false });
    expect(njkSlots(merged)).toEqual([{ uid: 'u1', név: 'Alfi' }]);
  });

  it('a friss becenevet is átveszi (a persistált még a régit tárolja)', () => {
    const stale = mentés('u2', 'Zord Zoltán', 'Zordi', false);
    const merged = mergeAktív(readSlots(), { ...stale, becenév: 'Zozó' });
    expect(njkSlots(merged)[0].név).toBe('Zozó');
  });

  it('ha a slot még nem létezik, az aktív karakterből építi', () => {
    const k = validKarakter({ uid: 'u3', név: 'Új NJK', becenév: 'Ujji', jk: false });
    const merged = mergeAktív([], k);
    expect(njkSlots(merged)).toEqual([{ uid: 'u3', név: 'Ujji' }]);
  });
});

describe('életerőStat — ÉP csík + stat a switcher sávhoz', () => {
  const data = loadGameDataSync();
  // ÉP formula: 28 + edzettség*4. edzettség=3 → ÉP 40, kategóriák=4 → oszlopméret 10.
  const alap = () => validKarakter({ jk: false, tulajdonságok: { ...validKarakter().tulajdonságok, edzettség: 3 } });

  it('sértetlen: maradék=max, arány=1, S0', () => {
    const s = életerőStat(alap(), data);
    expect(s).toMatchObject({ maradék: 40, max: 40, arány: 1, sKategória: 0 });
  });

  it('néhány seb: maradék csökken, S-kategória a betöltött rubrikák alapján', () => {
    const k = alap();
    k.session.sebzések = Array.from({ length: 12 }, (_, i) => ({ típus: 'S' as const, sorszám: i + 1 }));
    const s = életerőStat(k, data);
    expect(s.maradék).toBe(28);          // 40 - 12
    expect(s.max).toBe(40);
    expect(s.sKategória).toBe(2);        // ceil(12/10) = 2 → S2
  });

  it('a Fájdalompont (FP) rubrika IS beleszámít (mint az EpTable-ben)', () => {
    const k = alap();
    k.session.sebzések = [{ típus: 'FP', sorszám: 1 }, { típus: 'FP', sorszám: 2 }];
    const s = életerőStat(k, data);
    expect(s.maradék).toBe(38);          // 40 - 2 (FP is számít)
    expect(s.sKategória).toBe(1);        // ceil(2/10) = 1 → S1
  });
});
