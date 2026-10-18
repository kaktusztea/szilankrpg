import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { területIllik, aktívTerületen } from './taktika-helpers';

// Dobó popupok picker-szűrője (2026-10-19): Támadó = közelharc, Célzó = távharc, Aktív fül = mind.
describe('területIllik / aktívTerületen', () => {
  const data = loadGameDataSync();
  it('csoport szerinti szétválasztás; terület nélkül minden illik', () => {
    expect([területIllik('távharc', 'távharc'), területIllik('távharc', 'közelharc')]).toEqual([true, false]);
    expect([területIllik('negatív', 'közelharc'), területIllik(undefined, 'közelharc'), területIllik('negatív', 'távharc')]).toEqual([true, true, false]);
    expect(területIllik('távharc')).toBe(true);
  });
  it('a chip-szám csak a terület aktív tételeit számolja', () => {
    const táv = data.harciHelyzetek.find(h => h.csoport === 'távharc')!.név;
    const közel = data.harciHelyzetek.find(h => h.csoport !== 'távharc')!.név;
    const s = { aktív_taktikák: [{ név: 'Roham' }, { név: 'Kitartott célzás' }], aktív_helyzetek: [táv, közel] };
    expect(aktívTerületen(s, data, 'távharc')).toEqual({ taktika: 1, helyzet: 1 });
    expect(aktívTerületen(s, data, 'közelharc')).toEqual({ taktika: 1, helyzet: 1 });
    expect(aktívTerületen({ aktív_taktikák: [{ név: 'Roham' }], aktív_helyzetek: [] }, data, 'távharc')).toEqual({ taktika: 0, helyzet: 0 });
  });
});
