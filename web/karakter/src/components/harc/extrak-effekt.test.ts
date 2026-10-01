import { describe, it, expect } from 'vitest';
import { alkalmazEffektek, aktívHatásokCélra, hiányzóInfósExtrák } from './extrak-effekt';
import type { ExtraKontextus } from './extrak-info-calc';
import type { FegyverExtraDef, ExtraHatás } from '../../engine/data-types';

function ctx(over: Partial<ExtraKontextus> = {}): ExtraKontextus {
  return { aktívFeltételek: new Set(), fortélyFokok: new Map(), aktívStátuszok: new Set(), ...over };
}

describe('alkalmazEffektek - §42.3 precedencia', () => {
  it('additív előbb, szorzó utána, FLOOR', () => {
    // (10 + 3) * 0.5 = 6.5 → FLOOR → 6
    const h: ExtraHatás[] = [{ cél: 'SP', mód: 'flat', érték: 3 }, { cél: 'SP', mód: 'szorzó', érték: 0.5 }];
    expect(alkalmazEffektek(10, h)).toBe(6);
  });

  it('override felülír mindent (additív/szorzó eldobódik)', () => {
    const h: ExtraHatás[] = [{ cél: 'VÉ', mód: 'flat', érték: 5 }, { cél: 'VÉ', mód: 'override', érték: 0 }];
    expect(alkalmazEffektek(9, h)).toBe(0);
  });

  it('max_limit felső korlát az override után is', () => {
    const h: ExtraHatás[] = [{ cél: 'TÉ', mód: 'flat', érték: 100 }, { cél: 'TÉ', mód: 'max_limit', érték: 12 }];
    expect(alkalmazEffektek(3, h)).toBe(12);
  });

  it('több szorzó szekvenciális', () => {
    // (8) * 2 * 0.5 = 8
    const h: ExtraHatás[] = [{ cél: 'SFÉ', mód: 'szorzó', érték: 2 }, { cél: 'SFÉ', mód: 'szorzó', érték: 0.5 }];
    expect(alkalmazEffektek(8, h)).toBe(8);
  });

  it('nem-numerikus (letilt/szöveges) kihagyva', () => {
    const h: ExtraHatás[] = [{ cél: 'VÉ', mód: 'szöveges' }, { cél: 'VÉ', mód: 'flat', érték: 2 }];
    expect(alkalmazEffektek(5, h)).toBe(7);
  });
});

const defs: Record<string, FegyverExtraDef> = {
  panceltalant: {
    id: 'panceltalant', név: 'Páncéltalant jobban sebez',
    feltétel: [{ típus: 'cél_páncél', érték: 'vérttelen' }],
    hatás: [{ cél: 'SP', mód: 'flat', érték: 3 }],
  },
  kopjas_roham: {
    id: 'kopjas_roham', név: 'Kopja lovas rohamban',
    feltétel: [{ típus: 'taktika', id: 'lovas_roham' }],
    hatás: [{ cél: 'SP', mód: 'flat', érték: 10 }],
  },
  pocsek_vedekezo: {
    id: 'pocsek_vedekezo', név: 'Pocsék védekező',
    feltétel: [{ típus: 'cél_páncél', érték: 'páncélos' }],
    hatás: [{ cél: 'VÉ', mód: 'override', érték: 0 }],
  },
};

describe('aktívHatásokCélra - csak teljesült feltételű hatások', () => {
  const extrák = [{ id: 'panceltalant' }, { id: 'kopjas_roham' }, { id: 'pocsek_vedekezo' }];

  it('hiányos infó (nincs cél_páncél) → a cél_páncél-feltételes SP-hatás NEM alkalmazódik', () => {
    // Csak a taktika-feltételes kopjas_roham teljesül (lovas_roham aktív), a panceltalant KM.
    const h = aktívHatásokCélra(extrák, defs, ctx({ aktívFeltételek: new Set(['taktika:lovas_roham']) }), 'SP');
    expect(h).toEqual([{ cél: 'SP', mód: 'flat', érték: 10 }]);
  });

  it('teljes infó (vérttelen cél) → a panceltalant +3 SP bekerül', () => {
    const h = aktívHatásokCélra(extrák, defs, ctx({ célPáncélKategória: 'vérttelen' }), 'SP');
    expect(h).toEqual([{ cél: 'SP', mód: 'flat', érték: 3 }]);
  });

  it('cél-szűrés: VÉ célra a pocsek_vedekezo csak páncélos infónál', () => {
    expect(aktívHatásokCélra(extrák, defs, ctx(), 'VÉ')).toEqual([]); // nincs cél_páncél → KM, kihagyva
    expect(aktívHatásokCélra(extrák, defs, ctx({ célPáncélKategória: 'páncélos' }), 'VÉ'))
      .toEqual([{ cél: 'VÉ', mód: 'override', érték: 0 }]);
  });
});

describe('hiányzóInfósExtrák - VÉ warning (hiányos korreláció)', () => {
  const extrák = [{ id: 'pocsek_vedekezo' }, { id: 'kopjas_roham' }];

  it('nincs ellenfél-páncél infó → a VÉ-extra warning-ba kerül (nevesítve)', () => {
    expect(hiányzóInfósExtrák(extrák, defs, ctx(), 'VÉ')).toEqual(['Pocsék védekező']);
  });

  it('ismert cél-páncél → nincs warning (eldönthető, nem KM)', () => {
    expect(hiányzóInfósExtrák(extrák, defs, ctx({ célPáncélKategória: 'páncélos' }), 'VÉ')).toEqual([]);
    expect(hiányzóInfósExtrák(extrák, defs, ctx({ célPáncélKategória: 'vérttelen' }), 'VÉ')).toEqual([]);
  });

  it('nem-VÉ célú extra nem ad VÉ-warningot', () => {
    expect(hiányzóInfósExtrák([{ id: 'kopjas_roham' }], defs, ctx(), 'VÉ')).toEqual([]);
  });
});
