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
  konstansok: { fegyver_kategória_harcmodor: { kardvívó: 'Kardvívás' } },
} as unknown as GameData;

const karakter = {
  képzettségek: [{ név: 'Kardvívás', szint: 6 }],
  fegyverek: [{ alap: 'Hosszúkard', név: 'Sajátom', anyag: 'acél', idea: 4 }],
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

  it('extrák nevei a v2 definícióból', () => {
    expect(buildFegyverInfó(result, karakter, data).extrák).toEqual(['Pontos']);
  });

  it('módok: elsődleges elöl, a harcértékek a FegyverResult-ból', () => {
    const info = buildFegyverInfó(result, karakter, data);
    expect(info.módok[0].sebzéstípus).toBe('elsődleges');
    expect(info.módok[0].aktor).toBe('vágóél');
    expect(info.módok[0].SP).toBe(3);
    expect(info.módok[1].sebzéstípus).toBe('másodlagos');
  });

  it('nincs felvett példány (pl. puszta kéz) → anyag/idea null, a többi megvan', () => {
    const üresK = { képzettségek: [{ név: 'Kardvívás', szint: 6 }], fegyverek: [] } as unknown as Karakter;
    const info = buildFegyverInfó(result, üresK, data);
    expect(info.anyag).toBeNull();
    expect(info.idea).toBeNull();
    expect(info.harcmodorSzint).toBe(6);
    expect(info.módok.length).toBe(2);
  });
});
