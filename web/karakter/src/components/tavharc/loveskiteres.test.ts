import { describe, it, expect } from 'vitest';
import type { Karakter } from '../../engine/types';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { getAlkalmatlanInfo } from './helpers';
import { calcAkrobatikaÉrték, lövéskitérésEsély } from './loveskiteres-calc';

const data = loadGameDataSync();
const alapK: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));

describe('lövéskitérésEsély', () => {
  it('k10 1..10: need = célszám - bázis', () => {
    expect(lövéskitérésEsély(6, 15)).toBeCloseTo(0.2); // need 9+ → 9, 10
    expect(lövéskitérésEsély(6, 7)).toBe(1);           // need 1+
    expect(lövéskitérésEsély(6, 16)).toBeCloseTo(0.1); // need 10
    expect(lövéskitérésEsély(6, 17)).toBe(0);          // impossible
    expect(lövéskitérésEsély(6, 3)).toBe(1);           // clamped
  });
});

describe('calcAkrobatikaÉrték', () => {
  // Valódi GameData + teszt karakter alap: a fortély-bónusz a fortély yaml `lövéskitérés` céljából jön (2026-10-18).
  const base = (fortélyok: { id: string; fok: number }[], képzettségek = [{ id: 'akrobatika', elem: '', szint: 4 }], gyorsaság = 3) =>
    ({ ...alapK, képzettségek, tulajdonságok: { ...alapK.tulajdonságok, gyorsaság }, fortélyok: fortélyok.map(f => ({ ...f, elem: '' })) }) as Karakter;

  it('sums Akrobatika + Gyorsaság', () => {
    expect(calcAkrobatikaÉrték(base([]), data)).toBe(7);
  });

  it('adds +2 with the Lövéskitérés fejlesztése fortély (data-driven)', () => {
    expect(calcAkrobatikaÉrték(base([{ id: 'lövéskitérés_fejlesztése', fok: 1 }]), data)).toBe(9);
  });

  it('treats missing Akrobatika as 0', () => {
    expect(calcAkrobatikaÉrték(base([], [], 2), data)).toBe(2);
  });
});

describe('getAlkalmatlanInfo - Alkalmi tárgy Osztó (fortély override)', () => {
  const osztó = (fok: number) => getAlkalmatlanInfo({ ...alapK, fortélyok: [{ id: 'alkalmatlan_tárgyak_hajítása', fok, elem: '' }] } as Karakter, data)
    .alkalmiTárgyDef?.Osztó;
  it('1. fokon 1, 2. fokon 2; fortély nélkül nincs alkalmi tárgy', () => {
    expect([osztó(1), osztó(2)]).toEqual([1, 2]);
    expect(getAlkalmatlanInfo({ ...alapK, fortélyok: [] } as Karakter, data).alkalmiTárgyDef).toBeUndefined();
  });
});
