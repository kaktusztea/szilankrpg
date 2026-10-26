/**
 * Akadály pure logika önteszt (engine/felszereles.ts, md/010_03_07_akadaly.md).
 * Fedi: a szabály példáit - fém páncél merev/hajlékony, pajzs méret, nem-fém kizárás,
 * nem-additív MAX, és a "viselve" háromállapot (külső/nincs → nem számít).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { akadályÁllapot, felszerelésVagyAkadályJelző } from '../engine/felszereles';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';

let data: GameData;
let base: Karakter;

beforeAll(() => {
  data = loadGameDataSync();
  base = data.emptyKarakter;
});

/** Alap felszerelés „úton: true"-val (az Akadály-hatás csak ekkor él, md/010_03_07). */
function útonFelsz(extra?: Partial<Karakter['felszerelés']>): Karakter['felszerelés'] {
  return { tárgyak: [], kizárt_auto: [], külső: [], úton: true, ...extra };
}

describe('akadályÁllapot', () => {
  it('csupasz (se páncél, se pajzs) → 0', () => {
    expect(akadályÁllapot(base, data).állapot).toBe(0);
  });

  it('merev fém páncél viselve (>=50% fedés) → 2. állapot', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lemez' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(2);
  });

  it('hajlékony fém páncél (lánc/sodrony) viselve → 1. állapot', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lánc/sodrony' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(1);
  });

  it('nem-fém páncél (bőr) viselve → 0 (nem vált ki Akadályt)', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'bőr' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(0);
  });

  it('közepes pajzs → 1, nagy pajzs → 2, kis pajzs → 0', () => {
    const közepes: Karakter = { ...base, pajzs: { méret: 'közepes' }, felszerelés: útonFelsz() };
    const nagy: Karakter = { ...base, pajzs: { méret: 'nagy' }, felszerelés: útonFelsz() };
    const kis: Karakter = { ...base, pajzs: { méret: 'kis' }, felszerelés: útonFelsz() };
    expect(akadályÁllapot(közepes, data).állapot).toBe(1);
    expect(akadályÁllapot(nagy, data).állapot).toBe(2);
    expect(akadályÁllapot(kis, data).állapot).toBe(0);
  });

  it('nem additív: láncing (1) + közepes pajzs (1) → MAX = 1', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lánc/sodrony' },
      pajzs: { méret: 'közepes' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(1);
  });

  it('nem additív: merev páncél (2) + közepes pajzs (1) → MAX = 2', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lemez' },
      pajzs: { méret: 'közepes' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(2);
  });

  it('a nem viselt páncél NEM számít (aktív_páncél=false), de a forrás látszik', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lemez' },
      session: { ...base.session, aktív_páncél: false },
      felszerelés: útonFelsz(),
    };
    const r = akadályÁllapot(k, data);
    expect(r.állapot).toBe(0);
    expect(r.források.find(f => f.név.includes('lemez'))).toMatchObject({ állapot: 2, viselve: false });
  });

  it('a "külső tárolóban" pajzs NEM számít', () => {
    const k: Karakter = {
      ...base,
      pajzs: { méret: 'nagy' },
      felszerelés: útonFelsz({ külső: ['pajzs'] }),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(0);
  });
});

describe('akadályÁllapot - "úton" gate (md/010_03_07: csak 1 nap után hat)', () => {
  it('úton=false (default): viselt merev páncél → állapot 0, de a forrás látszik', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lemez' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: { tárgyak: [], kizárt_auto: [], külső: [], úton: false },
    };
    const r = akadályÁllapot(k, data);
    expect(r.állapot).toBe(0);
    expect(r.források.find(f => f.név.includes('lemez'))).toMatchObject({ állapot: 2, viselve: true });
  });

  it('úton hiányzik (régi localStorage): viselt nagy pajzs → állapot 0', () => {
    const k: Karakter = {
      ...base,
      pajzs: { méret: 'nagy' },
      felszerelés: { tárgyak: [], kizárt_auto: [], külső: [] },
    };
    expect(akadályÁllapot(k, data).állapot).toBe(0);
  });

  it('úton=true: ugyanaz a nagy pajzs → állapot 2', () => {
    const k: Karakter = {
      ...base,
      pajzs: { méret: 'nagy' },
      felszerelés: útonFelsz(),
    };
    expect(akadályÁllapot(k, data).állapot).toBe(2);
  });
});

describe('felszerelésVagyAkadályJelző (✏️ chip piros pötty)', () => {
  it('se túlterhelés, se akadály → false', () => {
    expect(felszerelésVagyAkadályJelző(base, data)).toBe(false);
  });

  it('csak akadály (viselt merev páncél, úton) → true', () => {
    const k: Karakter = {
      ...base,
      páncél: { ...base.páncél, alap: 'lemez' },
      session: { ...base.session, aktív_páncél: true },
      felszerelés: útonFelsz(),
    };
    expect(felszerelésVagyAkadályJelző(k, data)).toBe(true);
  });

  it('csak túlterhelés (keret 2 fölött kézi tárgyakkal) → true', () => {
    const k: Karakter = {
      ...base,
      felszerelés: {
        tárgyak: [{ név: 'A', méret: 'nagy' }, { név: 'B', méret: 'nagy' }],
        kizárt_auto: [], külső: [],
      },
    };
    // keret = 2 + Erő(0) = 2; terhelés = 2+2 = 4 > 2
    expect(felszerelésVagyAkadályJelző(k, data)).toBe(true);
  });
});
