import { describe, it, expect } from 'vitest';
import { buildFegyverRows, applyFegyverOverrides, calcKetkezes } from './fegyver-calc';
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

  it('applyFegyverOverrides: csak a túl hosszú fegyver sora nullázódik (az aktív fegyvertől függetlenül)', () => {
    const r = ['Tőr', 'Kard, hosszú', 'Tőr, páncélszúró'].map(sor);
    // a globális (aktív fegyveres) tiltás-kulcs a bemenetben NEM számít - soronként újraértékelődik
    applyFegyverOverrides(r, belharc, data, new Set([...af, 'tiltás:belharc_fegyverhossz']));
    expect(r.map(x => [x.TÉ, x.VÉ])).toEqual([[35, 60], [30, 53], [35, 60]]);
    expect(r[1].módok[0].TÉ).toBe(30);
    expect(r.map(x => x.tiltások)).toEqual([[], ['belharc_fegyverhossz', 'belharc_harcmodor'], []]);
  });

  it('Belharc nélkül nincs override és nincs tiltás', () => {
    const r = [sor('Kard, hosszú')];
    applyFegyverOverrides(r, nincs, data, new Set());
    expect([r[0].TÉ, r[0].VÉ, r[0].tiltások]).toEqual([35, 60, []]);
  });

  it('fegyverOverrideÉrtékek: kezenként - két Tőr (össz hossz 2) NEM nullázódik, Kard igen', () => {
    expect(fegyverOverrideÉrtékek(def('Tőr'), belharc, data, af).size).toBe(0);
    expect([...fegyverOverrideÉrtékek(def('Kard, hosszú'), belharc, data, af)]).toEqual([['TÉ', 0], ['VÉ', 0]]);
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
