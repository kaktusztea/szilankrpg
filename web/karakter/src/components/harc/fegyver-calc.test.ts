import { describe, it, expect } from 'vitest';
import { buildFegyverRows, calcFegyverResults, jelölFegyverTiltások, calcKetkezes } from './fegyver-calc';
import { buildPancelLookups } from './pancel-calc';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { tiltásokFegyverre, fegyverOverrideÉrtékek } from '../../engine/effekt';
import { lookupFegyver } from '../../engine/utils';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';

/**
 * Regresszió: a Mesterfegyver-fok egyeztetés legyen kis/nagybetű-FÜGGETLEN.
 * Korábban a buildFegyverRows egy `f.spec_elem === fp.alap` (case-sensitive) lookupot használt,
 * ami csendben elvesztette a MF-bónuszt, ha a fegyver `alap` és a fortély `spec_elem` betűzése eltért.
 * A bug csak azért nem bukott a golden teszteken, mert ott mindkét oldal azonos (kisbetűs) volt.
 */
describe('buildFegyverRows - Mesterfegyver fok (case-insensitive)', () => {
  const data = {
    fegyverek: [{ név: 'Kard, lovag', idea_default: 0, módok: [] }],
    fegyverIdeaTabla: [],
  } as unknown as GameData;

  function karakterWith(fegyverAlap: string, specElem: string): Karakter {
    return {
      fegyverek: [{ alap: fegyverAlap, név: '', anyag: 'acél', idea: 0, felszerelésben: true }],
      fortélyok: [{ név: 'Mesterfegyver', fok: 2, spec_típus: 'fegyver', spec_elem: specElem }],
    } as unknown as Karakter;
  }

  it('matches MF fok when alap and spec_elem have the SAME casing', () => {
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'Kard, lovag'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(2);
  });

  it('matches MF fok when alap and spec_elem have DIFFERENT casing (regression)', () => {
    // fegyver nagybetűs, fortély kisbetűs - a régi === lookup itt 0-t adott.
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'kard, lovag'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(2);
  });

  it('no MF fok for an unrelated weapon spec', () => {
    const rows = buildFegyverRows(karakterWith('Kard, lovag', 'Tőr'), data, null);
    expect(rows.find(r => r.név === 'Kard, lovag')?.mfFok).toBe(0);
  });
});

describe('Belharc - soronkénti override + tiltás-keret (§42.3 / §42.4), valós adat', () => {
  const data = loadGameDataSync();
  const belharc = { aktív_helyzetek: ['Belharci helyzet'] } as unknown as Session;
  const nincs = { aktív_helyzetek: [] } as unknown as Session;
  const af = new Set(['harci_helyzet:belharci_helyzet']);
  const def = (n: string) => lookupFegyver(data.fegyverek, n)!;
  const sor = (név: string) => {
    const m = { TÉ: 35, VÉ: 60, alap_TÉ: 5, alap_VÉ: 7 };
    return { ...m, fegyver_név: név, módok: [{ ...m }] } as unknown as FegyverResult;
  };

  it('tiltásokFegyverre: hossz > 1 és nem-Közelharc tiltás; a páncélszúró extrája feloldja a hossz-tiltást', () => {
    const ids = (n: string) => tiltásokFegyverre(def(n), belharc, data, af).map(t => t.id).sort();
    expect(ids('Tőr')).toEqual([]);                                             // hossz 1, Közelharc
    expect(ids('Kard, hosszú')).toEqual(['belharc_fegyverhossz', 'belharc_harcmodor']);
    expect(ids('Hárító: Köpeny')).toEqual(['belharc_harcmodor']);                // hossz 0, Kardvívás
    expect(ids('Tőr, páncélszúró')).toEqual([]);                                 // hossz 2, de pancelszuras_belharcban
    expect(tiltásokFegyverre(def('Kard, hosszú'), nincs, data, new Set())).toEqual([]);
  });

  it('jelölFegyverTiltások: soronként a saját tiltások (a bemenet globális tiltás-kulcsa nem számít)', () => {
    const r = ['Tőr', 'Kard, hosszú', 'Tőr, páncélszúró'].map(sor);
    jelölFegyverTiltások(r, belharc, data, new Set([...af, 'tiltás:belharc_fegyverhossz']));
    expect(r.map(x => x.tiltások)).toEqual([[], ['belharc_fegyverhossz', 'belharc_harcmodor'], []]);
    jelölFegyverTiltások(r, nincs, data, new Set());
    expect(r.map(x => x.tiltások)).toEqual([[], [], []]);
  });

  it('fegyverOverrideÉrtékek: Tőr nincs, Kard TÉ/VÉ 0 (helyzet), Puszta kéz TÉ/VÉ/SP 0 (extra)', () => {
    expect(fegyverOverrideÉrtékek(def('Tőr'), belharc, data, af).size).toBe(0);
    expect([...fegyverOverrideÉrtékek(def('Kard, hosszú'), belharc, data, af)]).toEqual([['TÉ', 0], ['VÉ', 0]]);
    expect([...fegyverOverrideÉrtékek(def('Puszta kéz'), belharc, data, af)]).toEqual([['TÉ', 0], ['VÉ', 0], ['SP', 0]]);
    expect(fegyverOverrideÉrtékek(def('Puszta kéz'), nincs, data, new Set()).size).toBe(0);
  });
});

describe('calcKetkezes - Belharc kezenként (a hosszak NEM adódnak össze)', () => {
  const data = loadGameDataSync();
  const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const tév = (a: string, b: string, h: string[]) => {
    const kar = { ...alap, fegyverek: [a, b].map(alapNév => ({ alap: alapNév, név: '', anyag: 'acél', idea: 0, felszerelésben: true })) } as Karakter;
    const session = { ...alap.session, kétkezes_harc: true, aktív_fegyver_index: 0, aktív_fegyver_bal_index: 1, aktív_helyzetek: h } as Session;
    const r = calcKetkezes(kar, session, data, { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0, SP_erőbónusz_arány: 0 },
      new Set(h.length ? ['harci_helyzet:belharci_helyzet'] : []));
    expect(r && Number.isFinite(r.TÉ) && Number.isFinite(r.VÉ)).toBe(true);
    return [r!.TÉ, r!.VÉ];
  };

  it('Tőr + Tőr: belharcban is azonos (össz hossz 2, de kezenként 1-1)', () => {
    expect(tév('Tőr', 'Tőr', ['Belharci helyzet'])).toEqual(tév('Tőr', 'Tőr', []));
  });

  it('Kard + Tőr: belharcban csak a kard alapértéke esik ki', () => {
    const ki = tév('Kard, hosszú', 'Tőr', [])!, be = tév('Kard, hosszú', 'Tőr', ['Belharci helyzet'])!;
    const kard = lookupFegyver(data.fegyverek, 'Kard, hosszú')!.módok.find(m => m.sebzéstípus === 'elsődleges')!;
    expect([ki[0] - be[0], ki[1] - be[1]]).toEqual([kard.TÉ, kard.VÉ]);
  });
});

describe('calcFegyverResults - alapOverride (Belharc: helyzet + Puszta kéz extra), e2e valós adat', () => {
  const data = loadGameDataSync();
  const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const belharc = { ...alap.session, aktív_helyzetek: ['Belharci helyzet'] } as Session;
  const af = new Set(['harci_helyzet:belharci_helyzet']);
  const mods = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0, CÉ: 0, harckeret: 0, SFÉ: 0, fegyverhossz: 0, SP_erőbónusz_arány: 0 };
  const futtat = (k: Karakter, ovr: boolean) => {
    const rows = buildFegyverRows(k, data, null);
    const res = calcFegyverResults(rows, k, data, mods, 0, 0, buildPancelLookups(data.konstansok), new Map(), 0, 0,
      ovr ? fDef => fegyverOverrideÉrtékek(fDef, belharc, data, af) : undefined);
    return Object.fromEntries(res.map(r => [r.fegyver_név, [r.TÉ, r.VÉ, r.SP]]));
  };
  const kar = (fortélyok: Karakter['fortélyok']) => ({ ...alap, fortélyok,
    fegyverek: ['Tőr', 'Kard, hosszú'].map(a => ({ alap: a, név: '', anyag: 'acél', idea: 0, felszerelésben: true })) } as Karakter);
  const elsőd = (n: string) => lookupFegyver(data.fegyverek, n)!.módok.find(m => m.sebzéstípus === 'elsődleges')!;

  it('Puszta kéz: a fegyvertelen büntetés (-3/-3/-5) eltűnik; Tőr változatlan; Kard alapja kiesik', () => {
    const ki = futtat(kar([]), false), be = futtat(kar([]), true);
    const pk = elsőd('Puszta kéz'), kard = elsőd('Kard, hosszú');
    expect(be['Puszta kéz']).toEqual([ki['Puszta kéz'][0] - pk.TÉ, ki['Puszta kéz'][1] - pk.VÉ, ki['Puszta kéz'][2] - pk.SP]);
    expect(be['Tőr']).toEqual(ki['Tőr']);
    expect(be['Kard, hosszú']).toEqual([ki['Kard, hosszú'][0] - kard.TÉ, ki['Kard, hosszú'][1] - kard.VÉ, ki['Kard, hosszú'][2]]);
  });

  it('Természetes fegyver: belharcban is SP 1 alap marad (a fortély elsőbbsége), TÉ/VÉ büntetés eltűnik', () => {
    const tf = kar([{ név: 'Természetes fegyver', fok: 1, spec_típus: '', spec_elem: '' }]);
    const ki = futtat(tf, false), be = futtat(tf, true);
    expect(be['Puszta kéz'][2]).toBe(ki['Puszta kéz'][2]);
    expect(be['Puszta kéz'][0]).toBe(ki['Puszta kéz'][0] - elsőd('Puszta kéz').TÉ);
  });
});
