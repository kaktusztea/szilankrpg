import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { useHarcComputed } from '../components/harc/useHarcComputed';
import type { Karakter, Session } from './types';

/** Helyzet-hatások saját oldali alkalmazása (§42 4a) - valós adat, teszt-karakter. */
describe('helyzet-effektek: VÉ a harcértékbe, vé_csökkentés a popup-bővítésbe', () => {
  const data = loadGameDataSync();
  const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const hc = (helyzetek: string[]) => {
    const session = { ...k.session, aktív_helyzetek: helyzetek } as Session;
    return useHarcComputed(data, { ...k, session }, session);
  };

  it('Láthatatlan - teljesen: VÉ +10, VÉ-csökkentés +2; a max VÉ-csökkenés is 10-zel nő', () => {
    const ki = hc([]), be = hc(['Láthatatlan - teljesen']);
    expect(be.helyzetMods.VÉ).toBe(10);
    expect(be.helyzetVéCsökkentés).toEqual([{ forrás: 'Láthatatlan - teljesen', érték: 2 }]);
    expect(be.maxVéCsökk - ki.maxVéCsökk).toBe(10);
  });

  it('Takarásban: VÉ +5; Meglepetés: csak VÉ-csökkentés +2; helyzet nélkül semmi', () => {
    expect(hc(['Takarásban harcolás']).helyzetMods.VÉ).toBe(5);
    expect([hc(['Meglepetés']).helyzetMods.VÉ, hc(['Meglepetés']).helyzetVéCsökkentés]).toEqual([0, [{ forrás: 'Meglepetés', érték: 2 }]]);
    expect([hc([]).helyzetMods.VÉ, hc([]).helyzetVéCsökkentés]).toEqual([0, []]);
  });
});
