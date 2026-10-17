import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { useHarcComputed } from '../components/harc/useHarcComputed';
import type { Karakter, Session } from './types';
import { gyűjtStátuszEffektek } from './effekt';

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

describe('státusz-effektek (§42 4b-2)', () => {
  const data = loadGameDataSync();
  // teszt3: a Meneth 2 támadás/kör (a korlát-teszt így nem teljesülhet üresen)
  const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter/test_karakter3.json'), 'utf-8'));
  const hc = (státuszok: string[]) => {
    const session = { ...k.session, aktív_státuszok: státuszok, aktív_helyzetek: [] } as Session;
    return useHarcComputed(data, { ...k, session }, session);
  };

  it('gyűjtStátuszEffektek: fok-hatások, alkategóriás cél-kiegészítéssel; ismeretlen bejegyzés kimarad', () => {
    const eff = gyűjtStátuszEffektek({ aktív_státuszok: ['Fizikai (2)', 'nincs ilyen'] } as Session, data);
    expect(eff.some(e => e.cél === 'vé_veszteség' && e.mód === 'szorzó' && e.érték === 2 && e.forrás.név === 'Fizikai (2)')).toBe(true);
  });

  it('Félelem (2): max 1 támadás minden fegyversoron; a VÉ-veszteség szorzó a Fizikai (2)-ből jön', () => {
    const ki = hc([]), be = hc(['Félelem (2)']);
    const meneth = (h: ReturnType<typeof hc>) => h.fegyverResults.find(r => r.fegyver_név === 'Meneth')!.támadások;
    expect([meneth(ki), meneth(be)]).toEqual([2, 1]);
    expect(be.fegyverResults.every(r => r.támadások <= 1 && r.módok.every(m => m.támadások <= 1))).toBe(true);
    expect([hc(['Fizikai (2)']).véVeszSzorzó, hc(['Fizikai (2)']).véVeszSzorzóForrás]).toEqual([2, 'Fizikai (2)']);
  });
});

describe('fortély-módosítók soronként (§42 4b-3)', () => {
  const data = loadGameDataSync();
  const k: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  // fegyverek: 0 = Kard, lovag (hossz 3, Kardvívás), 1 = Tőr (hossz 1, Közelharc); pajzs: közepes
  const sorok = (fortély: string, fok: number, session: Partial<Session>) => {
    const s = { ...k.session, kétkezes_harc: false, aktív_fegyver_bal_index: -1, aktív_taktikák: [], aktív_státuszok: [], aktív_helyzetek: [], ...session } as Session;
    const kar = { ...k, session: s, fortélyok: [...k.fortélyok.filter(f => f.id !== fortély), { id: fortély, fok, elem: '' }] } as Karakter;
    return Object.fromEntries(useHarcComputed(data, kar, s).fegyverResults.map(r => [r.fegyver_név, r.fortély]));
  };

  it('Belharcos 1: a bónusz csak a nem tiltott sorokon - a kézben lévő fegyvertől függetlenül', () => {
    for (const aktív of [0, 1]) {
      const r = sorok('belharcos', 1, { aktív_helyzetek: ['Belharci helyzet'], aktív_fegyver_index: aktív });
      expect([r['Tőr']?.TÉ, r['Tőr']?.VÉ, r['Puszta kéz']?.TÉ]).toEqual([2, 2, 2]);
      expect([r['Kard, lovag']?.TÉ, r['Kard, lovag']?.VÉ]).toEqual([0, 0]);
    }
  });

  it('Pajzshasználat 2: a +2 TÉ/VÉ/SP csak a pajzs saját során (a kézben lévő fegyvertől függetlenül)', () => {
    for (const aktív of [-2, 0]) {
      const r = sorok('pajzshasználat', 2, { aktív_fegyver_index: aktív });
      const pajzs = Object.keys(r).find(n => n.includes('Pajzs'))!;
      expect([r[pajzs]?.TÉ, r[pajzs]?.VÉ, r[pajzs]?.SP]).toEqual([2, 2, 2]);
      expect([r['Kard, lovag']?.TÉ, r['Tőr']?.SP]).toEqual([0, 0]);
    }
  });
});
