import { describe, it, expect } from 'vitest';
import {
  helyzetKönnyítés, könnyítettFázisok, követelményTeljesül, gépiKövetelményStátusz, követelményJelölés,
} from './manover-dobas-calc';
import type { ManoverKövetelmény } from '../../engine/data-types';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

const data = {
  konstansok: { fegyver_kategória_harcmodor: { kard: 'Kardvívás' } },
} as unknown as GameData;

const karakter = { képzettségek: [], fortélyok: [] } as unknown as Karakter;

const sessionWith = (helyzetek: string[]) =>
  ({ aktív_helyzetek: helyzetek } as unknown as Session);

describe('helyzetKönnyítés', () => {
  it('felismeri a Meglepetés és Orvtámadás aktív helyzetet', () => {
    expect(helyzetKönnyítés(sessionWith(['Meglepetés']))).toEqual({ meglepetés: true, orvtámadás: false });
    expect(helyzetKönnyítés(sessionWith(['Orvtámadás']))).toEqual({ meglepetés: false, orvtámadás: true });
    expect(helyzetKönnyítés(sessionWith([]))).toEqual({ meglepetés: false, orvtámadás: false });
  });
});

describe('könnyítettFázisok', () => {
  it('Aktív + Meglepetés → M és V kiesik, csak E marad', () => {
    expect(könnyítettFázisok(['M', 'V', 'E'], 'aktív', sessionWith(['Meglepetés']))).toEqual(['E']);
    expect(könnyítettFázisok(['V', 'E'], 'aktív', sessionWith(['Orvtámadás']))).toEqual(['E']);
  });
  it('Aktív + Meglepetés, csak M,V manőver → üres fázissor (azonnal sikeres)', () => {
    expect(könnyítettFázisok(['M', 'V'], 'aktív', sessionWith(['Meglepetés']))).toEqual([]);
  });
  it('nincs ilyen helyzet → változatlan', () => {
    expect(könnyítettFázisok(['M', 'V', 'E'], 'aktív', sessionWith([]))).toEqual(['M', 'V', 'E']);
  });
  it('Passzív módban NEM könnyít', () => {
    expect(könnyítettFázisok(['M', 'V', 'E'], 'passzív', sessionWith(['Meglepetés']))).toEqual(['M', 'V', 'E']);
  });
});

describe('követelményTeljesül — helyzet auto-teljesítés', () => {
  const orvKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Orvtámadás harci helyzet' };
  const orvVagyKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Orvtámadás vagy Hátulról támadás harci helyzet' };

  it('aktív Orvtámadás → a rá hivatkozó egyéb követelmény true', () => {
    expect(követelményTeljesül(orvKöv, karakter, data, sessionWith(['Orvtámadás']))).toBe(true);
    expect(követelményTeljesül(orvVagyKöv, karakter, data, sessionWith(['Orvtámadás']))).toBe(true);
  });
  it('session nélkül továbbra is null (manuális döntés)', () => {
    expect(követelményTeljesül(orvKöv, karakter, data)).toBeNull();
  });
  it('nem hivatkozott helyzet → null marad', () => {
    expect(követelményTeljesül(orvKöv, karakter, data, sessionWith(['Meglepetés']))).toBeNull();
  });
  it('gépiKövetelményStátusz: aktív Orvtámadás feloldja az erős hiányt', () => {
    expect(gépiKövetelményStátusz([orvKöv], karakter, data, sessionWith(['Orvtámadás'])))
      .toEqual({ erősHiány: false, normálHiány: false });
    // helyzet nélkül: egyéb köv. null → nem számít gépi hiánynak (marad false/false)
    expect(gépiKövetelményStátusz([orvKöv], karakter, data))
      .toEqual({ erősHiány: false, normálHiány: false });
  });
});

describe('követelményJelölés', () => {
  it('gépi eredmény mindig nyer (döntéstől függetlenül)', () => {
    expect(követelményJelölés(true, 'erős', 'pending')).toBe('✓');
    expect(követelményJelölés(false, 'normál', 'mind')).toBe('✗');
  });
  it('null + pending → ?', () => {
    expect(követelményJelölés(null, 'erős', 'pending')).toBe('?');
  });
  it('null + "mind" döntés → ✓', () => {
    expect(követelményJelölés(null, 'erős', 'mind')).toBe('✓');
    expect(követelményJelölés(null, 'normál', 'mind')).toBe('✓');
  });
  it('null + "erős" hiány → az Erős sor ✗, a Normál sor ✓', () => {
    expect(követelményJelölés(null, 'erős', 'erős')).toBe('✗');
    expect(követelményJelölés(null, 'normál', 'erős')).toBe('✓');
  });
  it('null + "normál" hiány → a Normál sor ✗, az Erős sor ✓', () => {
    expect(követelményJelölés(null, 'normál', 'normál')).toBe('✗');
    expect(követelményJelölés(null, 'erős', 'normál')).toBe('✓');
  });
});
