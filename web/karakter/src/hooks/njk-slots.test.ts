import { describe, it, expect, beforeEach } from 'vitest';
import { njkSlots, njkLimitBlocked, njkCount } from './njk-slots';
import { writeSlots, type SlotEntry } from './slot-utils';
import { MAX_NJK_DB } from '../ui-constants';
import { installLocalStorage } from '../__tests__/localstorage-stub';

function slot(p: Partial<SlotEntry>): SlotEntry {
  return { uid: 'u', id_leíró: 'x', név: '', tsz: 3, mentés_dátum: '2026-01-01', ...p };
}

describe('njkCount', () => {
  it('csak a jk === false slotokat számolja (undefined = JK)', () => {
    expect(njkCount([
      slot({ uid: 'a', jk: true }),
      slot({ uid: 'b', jk: false }),
      slot({ uid: 'c' }),
      slot({ uid: 'd', jk: false }),
    ])).toBe(2);
  });
});

describe('njkSlots', () => {
  it('csak az NJK slotokat adja vissza', () => {
    const out = njkSlots([
      slot({ uid: 'a', név: 'Agabor', jk: true }),
      slot({ uid: 'b', név: 'Bandita', jk: false }),
      slot({ uid: 'c', név: 'Csuklyás' }),
    ]);
    expect(out.map(s => s.uid)).toEqual(['b']);
  });

  it('becenév elsőbbség, fallback név, majd Névtelen', () => {
    const out = njkSlots([
      slot({ uid: 'a', név: 'von Agabor', becenév: 'Agi', jk: false }),
      slot({ uid: 'b', név: 'Bandita', becenév: '', jk: false }),
      slot({ uid: 'c', név: '', jk: false }),
    ]);
    expect(out).toEqual([
      { uid: 'a', név: 'Agi' },
      { uid: 'b', név: 'Bandita' },
      { uid: 'c', név: 'Névtelen' },
    ]);
  });

  it('ABC sorrend a megjelenített név szerint (nem mentés_dátum)', () => {
    const out = njkSlots([
      slot({ uid: 'z', név: 'Zorka', mentés_dátum: '2026-05-05', jk: false }),
      slot({ uid: 'a', név: 'Álmos', mentés_dátum: '2026-01-01', jk: false }),
      slot({ uid: 'e', név: 'Elek', mentés_dátum: '2026-03-03', jk: false }),
    ]);
    expect(out.map(s => s.név)).toEqual(['Álmos', 'Elek', 'Zorka']);
  });

  it('legfeljebb MAX_NJK_DB elemet ad vissza (ABC szerint az elsőket)', () => {
    const many = Array.from({ length: MAX_NJK_DB + 5 }, (_, i) =>
      slot({ uid: `u${i}`, név: `NJK ${String(i).padStart(2, '0')}`, jk: false }));
    const out = njkSlots(many);
    expect(out).toHaveLength(MAX_NJK_DB);
    expect(out[0].név).toBe('NJK 00');
  });
});

describe('njkLimitBlocked', () => {
  beforeEach(() => installLocalStorage());

  const fillNjk = (n: number) => writeSlots([
    ...Array.from({ length: n }, (_, i) => slot({ uid: `n${i}`, név: `NJK${i}`, jk: false })),
    slot({ uid: 'jk1', név: 'Hős', jk: true }),
  ]);

  it('JK karakter soha nincs blokkolva', () => {
    fillNjk(MAX_NJK_DB);
    expect(njkLimitBlocked(true)).toBe(false);
    expect(njkLimitBlocked(undefined)).toBe(false);
  });

  it('limit alatt engedi az új NJK-t, limiten blokkol', () => {
    fillNjk(MAX_NJK_DB - 1);
    expect(njkLimitBlocked(false)).toBe(false);
    fillNjk(MAX_NJK_DB);
    expect(njkLimitBlocked(false)).toBe(true);
  });

  it('meglévő NJK slot felülírása nem blokkolt (a szám nem nő)', () => {
    fillNjk(MAX_NJK_DB);
    expect(njkLimitBlocked(false, 'n0')).toBe(false);   // NJK → NJK slot
    expect(njkLimitBlocked(false, 'jk1')).toBe(true);   // JK slot → NJK: nőne a szám
    expect(njkLimitBlocked(false, 'nincs-ilyen')).toBe(true);
  });
});
