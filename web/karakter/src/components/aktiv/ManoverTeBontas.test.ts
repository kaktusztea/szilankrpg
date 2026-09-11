import { describe, it, expect } from 'vitest';
import { téBontás, téBontásÖsszeg } from './ManoverDobasPopup';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

/**
 * A HarcScreen `baseTÉ`-ként a téBontásÖsszeg-et használja, a popup pedig a
 * téBontás sorait mutatja. Ez az önteszt rögzíti, hogy a bontás sorainak összege
 * MINDIG egyenlő az összeggel — így a megjelenített részletek és az érték nem driftel szét.
 */
describe('téBontás konzisztencia', () => {
  const karakter = {
    tulajdonságok: { erő: 3, ügyesség: 2, gyorsaság: 4 },
    HM_TÉ: 5,
  } as unknown as Karakter;
  const data = { konstansok: { harcérték_alap: { TÉ: 6 } } } as unknown as GameData;

  it('a sorok összege = téBontásÖsszeg', () => {
    const sum = téBontás(karakter, data).reduce((s, r) => s + r.érték, 0);
    expect(sum).toBe(téBontásÖsszeg(karakter, data));
  });

  it('a konkrét összeg helyes (6+3+2+4+5)', () => {
    expect(téBontásÖsszeg(karakter, data)).toBe(20);
  });
});
