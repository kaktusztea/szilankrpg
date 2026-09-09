import { describe, it, expect } from 'vitest';
import { resolveAktívFegyverContext, aktívJobbFegyverNév } from './aktiv-fegyver-ctx';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

const data = {
  fegyverek: [
    { Fegyver: 'Hosszúkard (1K)', Alapnév: 'Hosszúkard' },
    { Fegyver: 'Tőr', Alapnév: '' },
  ],
} as unknown as GameData;

const karakter = { fegyverek: [{ alap: 'Hosszúkard (1K)' }, { alap: 'Tőr' }] } as unknown as Karakter;
const sess = (idx: number) => ({ aktív_fegyver_index: idx } as unknown as Session);

const kard = { fegyver_név: 'Hosszúkard (1K)', TÉ: 60, VÉ: 70, támadások: 2 };
const tőr = { fegyver_név: 'Tőr', TÉ: 40, VÉ: 50, támadások: 2 };
const pajzs = { fegyver_név: 'Közepes Pajzs', TÉ: 10, VÉ: 30, támadások: 1 };
const base = { fegyverResults: [kard, tőr, pajzs], kétkezesResult: null, fogásResult: null, pajzsVÉ: 5, pajzsFegyverNév: 'Közepes Pajzs' };

describe('aktívJobbFegyverNév', () => {
  it('a kiválasztott fegyver megjelenített neve', () => {
    expect(aktívJobbFegyverNév(karakter, sess(0), data)).toBe('Hosszúkard (1K)');
  });
  it('puszta kéz, ha nincs kiválasztva (negatív index)', () => {
    expect(aktívJobbFegyverNév(karakter, sess(-1), data)).toBe('Puszta kéz');
  });
});

describe('resolveAktívFegyverContext', () => {
  it('kétkezes harc mindent megelőz', () => {
    const kétkezes = { fegyver_név: 'Kétkezes', TÉ: 80, VÉ: 80, támadások: 3 };
    const r = resolveAktívFegyverContext({ ...base, kétkezesResult: kétkezes }, karakter, sess(0), data);
    expect(r).toEqual({ result: kétkezes, veBónusz: 5, téExtra: 0 });
  });

  it('fegyverfogás: a jobb kéz fegyvere + fogás bónuszok', () => {
    const r = resolveAktívFegyverContext(
      { ...base, fogásResult: { VÉ_bónusz: 8, TÉ_büntetés: -3 } }, karakter, sess(1), data);
    expect(r).toEqual({ result: tőr, veBónusz: 8, téExtra: -3 });
  });

  it('pajzs mint fegyver (index -2)', () => {
    const r = resolveAktívFegyverContext(base, karakter, sess(-2), data);
    expect(r).toEqual({ result: pajzs, veBónusz: 5, téExtra: 0 });
  });

  it('alap eset: a jobb kéz fegyvere, pajzs VÉ bónusszal', () => {
    expect(resolveAktívFegyverContext(base, karakter, sess(0), data)).toEqual({ result: kard, veBónusz: 5, téExtra: 0 });
  });

  it('null, ha az aktív fegyverhez nincs kiszámolt eredmény', () => {
    expect(resolveAktívFegyverContext({ ...base, fegyverResults: [pajzs] }, karakter, sess(0), data)).toBeNull();
  });
});
