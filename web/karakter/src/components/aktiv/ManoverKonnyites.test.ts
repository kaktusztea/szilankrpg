import { describe, it, expect } from 'vitest';
import {
  helyzetKönnyítés, könnyítettFázisok, követelményTeljesül, követelményÁllapot, követelményJelölés,
  követelményCimke, type AktívFegyverInfo,
} from '../../engine/harc/manover-dobas-calc';
import type { ManoverKövetelmény } from '../../engine/data-types';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

// Real skill / fortély names for the requirement labels
const NEVEK = loadGameDataSync();

const data = {
  konstansok: { fegyver_kategória_harcmodor: { kard: 'Kardvívás' } },
  harciHelyzetek: [
    { név: 'Orvtámadás' }, { név: 'Hátulról támadás' }, { név: 'Meglepetés' },
    { név: 'Belharci helyzet' }, { név: 'Fegyverelőny' }, { név: 'Fegyverhátrány' },
  ],
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
  it('Passzív + Harcképtelen → Megakasztás / Végrehajtás kiesik (a manőver felé dől), az Ellenpróba marad; aktívra nem hat', () => {
    expect(könnyítettFázisok(['M', 'V', 'E'], 'passzív', sessionWith([]), true)).toEqual(['E']);
    expect(könnyítettFázisok(['V'], 'passzív', sessionWith([]), true)).toEqual([]);
    expect(könnyítettFázisok(['M', 'V', 'E'], 'aktív', sessionWith([]), true)).toEqual(['M', 'V', 'E']);
  });
});

describe('követelményTeljesül - helyzet auto-kiértékelés', () => {
  const orvKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Orvtámadás harci helyzet' };
  const orvVagyKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Orvtámadás vagy Hátulról támadás harci helyzet' };
  const anatómiaKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Célpont elfszabású anatómiával' };
  const tagadóKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'egyéb', leírás: 'Egyik ellenfél sincs Fegyverelőnyben' };

  it('aktív Orvtámadás → true', () => {
    expect(követelményTeljesül(orvKöv, karakter, data, sessionWith(['Orvtámadás']))).toBe(true);
    expect(követelményTeljesül(orvVagyKöv, karakter, data, sessionWith(['Hátulról támadás']))).toBe(true);
  });
  it('NINCS a hivatkozott helyzet → false (auto-kudarc)', () => {
    expect(követelményTeljesül(orvKöv, karakter, data, sessionWith([]))).toBe(false);
    expect(követelményTeljesül(orvKöv, karakter, data, sessionWith(['Meglepetés']))).toBe(false);
    expect(követelményTeljesül(orvVagyKöv, karakter, data, sessionWith(['Fegyverelőny']))).toBe(false);
  });
  it('session nélkül továbbra is null (manuális döntés)', () => {
    expect(követelményTeljesül(orvKöv, karakter, data)).toBeNull();
  });
  it('nem helyzet-alapú szöveg (anatómia) → null marad', () => {
    expect(követelményTeljesül(anatómiaKöv, karakter, data, sessionWith(['Orvtámadás']))).toBeNull();
  });
  it('tagadó szöveg ("sincs Fegyverelőnyben") → null (manuális, nem "aktív helyzet kell")', () => {
    expect(követelményTeljesül(tagadóKöv, karakter, data, sessionWith(['Fegyverelőny']))).toBeNull();
  });
  it('követelményÁllapot: nincs Orvtámadás → erős hiány (auto-kudarc)', () => {
    expect(követelményÁllapot([orvKöv], karakter, data, sessionWith([])))
      .toMatchObject({ erősHiány: true, normálHiány: false });
    expect(követelményÁllapot([orvKöv], karakter, data, sessionWith(['Orvtámadás'])))
      .toMatchObject({ erősHiány: false, normálHiány: false });
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

describe('követelményTeljesül - fegyver-alapú gépi típusok', () => {
  const katKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'fegyver_kategória', érték: 'kardvívó' };
  const sebKöv: ManoverKövetelmény = { erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'V' };
  const kard: AktívFegyverInfo = { kategória: 'kardvívó', sebzésMódja: 'V/S' };
  const buzogány: AktívFegyverInfo = { kategória: 'romboló', sebzésMódja: 'Z' };

  it('fegyver_kategória: egyezés → true, eltérés → false', () => {
    expect(követelményTeljesül(katKöv, karakter, data, undefined, kard)).toBe(true);
    expect(követelményTeljesül(katKöv, karakter, data, undefined, buzogány)).toBe(false);
  });
  it('fegyver_sebzéstípus: a "Sebzés módja" komponensei közt van-e a betű', () => {
    expect(követelményTeljesül(sebKöv, karakter, data, undefined, kard)).toBe(true);      // V/S tartalmaz V
    expect(követelményTeljesül(sebKöv, karakter, data, undefined, buzogány)).toBe(false);  // Z nem
  });
  it('nincs aktív fegyver → null (manuális)', () => {
    expect(követelményTeljesül(katKöv, karakter, data, undefined, null)).toBeNull();
    expect(követelményTeljesül(sebKöv, karakter, data)).toBeNull();
  });
  it('követelményÁllapot: rossz fegyver → erős hiány', () => {
    expect(követelményÁllapot([katKöv, sebKöv], karakter, data, undefined, buzogány))
      .toMatchObject({ erősHiány: true, normálHiány: false });
    expect(követelményÁllapot([katKöv, sebKöv], karakter, data, undefined, kard))
      .toMatchObject({ erősHiány: false, normálHiány: false });
  });
});

describe('követelményCimke', () => {
  it('fegyver_kategória → "<kulcs> harcmodor"', () => {
    expect(követelményCimke({ erősség: 'erős', típus: 'fegyver_kategória', érték: 'kardvívó' }, NEVEK)).toBe('kardvívó harcmodor');
  });
  it('fegyver_sebzéstípus → "<Név>fegyver"', () => {
    expect(követelményCimke({ erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'V' }, NEVEK)).toBe('Vágófegyver');
    expect(követelményCimke({ erősség: 'erős', típus: 'fegyver_sebzéstípus', érték: 'Z' }, NEVEK)).toBe('Zúzófegyver');
  });
  it('képzettség / fortély → displayed name (not the id) + szint / fok', () => {
    expect(követelményCimke({ erősség: 'normál', típus: 'képzettség', név: 'harcmodor/kardvívás', érték: 6 }, NEVEK)).toBe('Kardvívás 6.szint');
    expect(követelményCimke({ erősség: 'normál', típus: 'képzettség', név: 'harcmodor', érték: 5 }, NEVEK)).toBe('Harcmodor 5.szint');
    expect(követelményCimke({ erősség: 'normál', típus: 'fortély', név: 'lovas_harc', érték: 2 }, NEVEK)).toBe('Lovas harc 2.fok');
  });
});
