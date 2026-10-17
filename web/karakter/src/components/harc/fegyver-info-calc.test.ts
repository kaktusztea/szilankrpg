import { describe, it, expect } from 'vitest';
import { buildFegyverInfó } from './fegyver-info-calc';
import type { FegyverResult, FegyverResultMód } from './types';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

const mód = (p: Partial<FegyverResultMód>): FegyverResultMód => ({
  aktor: 'vágóél', jelleg: 'V', sebzéstípus: 'elsődleges',
  TÉ: 5, VÉ: 4, SP: 3, Átütés: 0, támadások: 1, harckeret: 6, sebesség: 6,
  alap_TÉ: 5, alap_VÉ: 4, hk_harcmodor: 0, hk_gyorsaság: 0, hk_mgt: 0, hk_fortély: 0,
  ...p,
});

const result: FegyverResult = {
  fegyver_név: 'Hosszúkard', fegyverhossz: 3,
  módok: [
    mód({ aktor: 'lapél', sebzéstípus: 'másodlagos', jelleg: 'Z', SP: 1 }),
    mód({ aktor: 'vágóél', sebzéstípus: 'elsődleges', jelleg: 'V', SP: 3 }),
  ],
  ...mód({}),
};

const data = {
  fegyverek: [{ név: 'Hosszúkard', kategória: 'kardvívó', idea_default: 2, extrák: [{ id: 'x', név: 'Pontos' }], módok: [] }],
  konstansok: { fegyver_kategória_harcmodor: { kardvívó: 'kardvívás' } },
  fegyverExtrák: { x: { id: 'x', név: 'Pontos', leírás: 'Precíziós szúróhegy.' } },
} as unknown as GameData;

const karakter = {
  képzettségek: [{ id: 'harcmodor', elem: 'kardvívás', szint: 6 }],
  fegyverek: [{ alap: 'Hosszúkard', név: 'Sajátom', anyag: 'acél', idea: 4, felszerelésben: true }],
} as unknown as Karakter;

describe('buildFegyverInfó', () => {
  it('harcmodor név + a karakter szintje', () => {
    const info = buildFegyverInfó(result, karakter, data);
    expect(info.harcmodorNév).toBe('Kardvívás');
    expect(info.harcmodorSzint).toBe(6);
  });

  it('példány anyag + Idea (a fegyver alap Ideájával)', () => {
    const info = buildFegyverInfó(result, karakter, data);
    expect(info.anyag).toBe('acél');
    expect(info.idea).toBe(4);
    expect(info.ideaDefault).toBe(2);
  });

  it('extrák név + leírás a v2 definícióból + katalógusból', () => {
    expect(buildFegyverInfó(result, karakter, data).extrák).toEqual([
      { név: 'Pontos', leírás: 'Precíziós szúróhegy.' },
    ]);
  });

  it('extra leírás üres, ha a katalógusban nincs meg az id', () => {
    const data2 = { ...data, fegyverExtrák: {} } as unknown as GameData;
    expect(buildFegyverInfó(result, karakter, data2).extrák).toEqual([
      { név: 'Pontos', leírás: '' },
    ]);
  });

  it('módok: elsődleges elöl, a harcértékek a FegyverResult-ból', () => {
    const info = buildFegyverInfó(result, karakter, data);
    expect(info.módok[0].sebzéstípus).toBe('elsődleges');
    expect(info.módok[0].aktor).toBe('vágóél');
    expect(info.módok[0].SP).toBe(3);
    expect(info.módok[1].sebzéstípus).toBe('másodlagos');
  });

  it('becenév: a result.becenév kerül át (a név marad a def-név, fő/alcímhez)', () => {
    const infoVan = buildFegyverInfó({ ...result, becenév: 'Villámcsapás' }, karakter, data);
    expect(infoVan.becenév).toBe('Villámcsapás');
    expect(infoVan.név).toBe('Hosszúkard');

    const infoNincs = buildFegyverInfó(result, karakter, data);
    expect(infoNincs.becenév).toBeUndefined();
    expect(infoNincs.név).toBe('Hosszúkard');
  });
});
