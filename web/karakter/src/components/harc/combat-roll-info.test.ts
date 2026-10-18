import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { useHarcComputed } from './useHarcComputed';
import { elsődlegesMód } from './fegyver-calc';
import { collectDobásInfo, collectCéDobásInfo, fegyverSpBónuszok, netElőnySzint, sebzésPáncélDelta, távjellegMátrixKulcs, type DobásHatás } from './combat-roll-info';
import type { Session, Karakter, FegyverAlap } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { SebzésjellegPáncélMátrix } from '../../engine/data-types';

// Minimal fixtures - only the fields collectDobásInfo touches for the taktika path.
function makeData(): GameData {
  return {
    harciHelyzetek: [],
    fegyverek: [],
    statuszok: [],
    fortelySummaries: [],
    konstansok: { fegyver_erő_követelmény_hátrány: -1 },
    taktikak: [
      {
        // Non-fokozatos taktika with structured Hátrány-2 on sebzésdobás (Visszafogott shape).
        // Note: generated JSON uses the 'hatás' key (not 'operátor') for taktika hatások.
        név: 'Visszafogott',
        feltétel_kulcs: 'taktika:visszafogott',
        fokozatos: false,
        módosítók: { TÉ: -10 },
        hatások: [{ mód: 'hátrány', érték: -2, cél: 'sebzésdobás', megjegyzés: 'Sebzésdobás: Hátrány-2' }],
        kombó_mód: 'whitelist',
        kombó_lista: [],
      },
    ],
  } as unknown as GameData;
}

const session = {
  aktív_helyzetek: [],
  aktív_taktikák: [{ név: 'Visszafogott' }],
  aktív_státuszok: [],
  fegyverfogás: 'egykezes',
} as unknown as Session;

const karakter = { fortélyok: [] } as unknown as Karakter;

describe('collectDobásInfo - nem-fokozatos taktika strukturált hatás', () => {
  it('a Visszafogott Hátrány-2 eljut a sebzésHatások közé (hatás kulcs feldolgozás)', () => {
    const info = collectDobásInfo(session, karakter, makeData());
    const h = info.sebzésHatások.find(x => x.forrás === 'Visszafogott');
    expect(h).toBeDefined();
    expect(h!.operátor).toBe('hátrány');
    expect(h!.érték).toBe(-2);
    expect(h!.cél).toBe('sebzésdobás');
  });

  it('a nettó előny/hátrány szint -2 (Hátrány-2)', () => {
    const info = collectDobásInfo(session, karakter, makeData());
    expect(netElőnySzint(info.sebzésHatások)).toBe(-2);
  });
});

describe('collectDobásInfo - Erő-követelmény (md/064_02_06)', () => {
  const karakterGyenge = { fortélyok: [], tulajdonságok: { erő: 1 } } as unknown as Karakter;
  const karakterErős = { fortélyok: [], tulajdonságok: { erő: 3 } } as unknown as Karakter;
  const nehézFegyver = { név: 'Alabárd', kategória: 'szálfegyver', erő_követelmény: 2 } as unknown as FegyverAlap;
  const sessionNincsTaktika = { aktív_helyzetek: [], aktív_taktikák: [], aktív_státuszok: [], fegyverfogás: 'egykezes' } as unknown as Session;

  it('Hátrány-1 a Támadó dobásra, ha a karakter Ereje a követelmény alatt van', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterGyenge, makeData(), nehézFegyver);
    const h = info.téHatások.find(x => x.forrás.includes('Erő hiány'));
    expect(h).toBeDefined();
    expect(h!.forrás).toBe('Alabárd\n(Erő hiány)');
    expect(h!.operátor).toBe('hátrány');
    expect(h!.érték).toBe(-1);
  });

  it('nincs büntetés, ha a karakter Ereje eléri a követelményt', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterErős, makeData(), nehézFegyver);
    expect(info.téHatások.find(x => x.forrás.includes('Erő hiány'))).toBeUndefined();
  });

  it('nincs büntetés, ha nincs átadva aktív fegyver', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterGyenge, makeData());
    expect(info.téHatások.find(x => x.forrás.includes('Erő hiány'))).toBeUndefined();
  });
});

describe('netElőnySzint - előjeles összegzés (Math.abs nélkül)', () => {
  it('előny (+), hátrány (−), enyhít (+) előjeles értékei nettósítva', () => {
    const hatások: DobásHatás[] = [
      { forrás: 'a', cél: 'té_dobás', operátor: 'előny', érték: 2 },
      { forrás: 'b', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'c', cél: 'té_dobás', operátor: 'enyhít', érték: 1 },
    ];
    expect(netElőnySzint(hatások)).toBe(2); // 2 + (−1) + 1 = 2
  });

  it('clamp [-2,+2]: három Hátrány−1 → −2', () => {
    const hatások: DobásHatás[] = [
      { forrás: 'a', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'b', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'c', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
    ];
    expect(netElőnySzint(hatások)).toBe(-2);
  });
});

describe('sebzésPáncélDelta', () => {
  const mátrix: SebzésjellegPáncélMátrix = {
    matrix: {
      'vágó-íves': { csupasz: 3, puha: 2, bor: 0, lanc: -2, merev: -4 },
    },
    struktúra_osztály: { lemez: 'merev' },
  };

  it('lookup: jelleg × osztály → SP delta', () => {
    expect(sebzésPáncélDelta(mátrix, 'vágó-íves', 'merev')).toBe(-4);
    expect(sebzésPáncélDelta(mátrix, 'vágó-íves', 'csupasz')).toBe(3);
  });

  it('ismeretlen jelleg vagy hiányzó jelleg → 0', () => {
    expect(sebzésPáncélDelta(mátrix, 'zúzó', 'merev')).toBe(0);
    expect(sebzésPáncélDelta(mátrix, undefined, 'merev')).toBe(0);
  });
});

describe('távjellegMátrixKulcs', () => {
  const m: SebzésjellegPáncélMátrix = {
    matrix: {
      'szúró': { csupasz: 2, puha: 3, bor: 1, lanc: 0, merev: -3 },
      'vágó-egyenes': { csupasz: 1, puha: 1, bor: 0, lanc: -2, merev: -4 },
      'zúzó': { csupasz: 0, puha: 0, bor: 1, lanc: 3, merev: 3 },
    },
    struktúra_osztály: { lemez: 'merev' },
  };

  it('kanonikus betűk (extrak.schema.yaml S/V/Z) → mátrix teljes-szavas kulcs', () => {
    expect(távjellegMátrixKulcs('S')).toBe('szúró');
    expect(távjellegMátrixKulcs('V')).toBe('vágó-egyenes');
    expect(távjellegMátrixKulcs('Z')).toBe('zúzó');
  });

  it('a kulcsok ténylegesen léteznek a mátrixban (lookup nem 0-ra esik vissza)', () => {
    // szúró a merev páncélon −3 (a mátrix szúró sora) - bizonyítja, hogy a kulcs stimmel
    expect(sebzésPáncélDelta(m, távjellegMátrixKulcs('S'), 'merev')).toBe(-3);
    expect(sebzésPáncélDelta(m, távjellegMátrixKulcs('Z'), 'lanc')).toBe(3);
  });

  it('spec vagy ismeretlen → undefined (nincs páncélmátrix-interakció → nincs választó)', () => {
    expect(távjellegMátrixKulcs('spec')).toBeUndefined();
    expect(távjellegMátrixKulcs('')).toBeUndefined();
  });
});
// Fegyverfüggő SP-bónuszok a bontásban (2026-10-18): a kézben lévő fegyver kulcsaival, valódi adaton.
describe('collectDobásInfo - Pajzshasználat / Mesterfegyver SP a bontásban', () => {
  const data = loadGameDataSync();
  const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const session = { ...alap.session, aktív_taktikák: [], aktív_helyzetek: [], aktív_státuszok: [] } as Session;
  const sp = (fortély: { id: string; fok: number; elem: string }, fegyverNév: string) => {
    const k = { ...alap, fortélyok: [fortély], session } as Karakter;
    return collectDobásInfo(session, k, data, data.fegyverek.find(f => f.név === fegyverNév)).spBónuszok;
  };
  const pajzs = data.fegyverek.find(f => f.kategória === 'pajzs')!;
  const kard = data.fegyverek.find(f => f.kategória !== 'pajzs')!;

  it('Pajzshasználat (2): +2 csak pajzzsal', () => {
    expect(sp({ id: 'pajzshasználat', fok: 2, elem: '' }, pajzs.név)).toEqual([{ forrás: 'Pajzshasználat', érték: 2 }]);
    expect(sp({ id: 'pajzshasználat', fok: 2, elem: '' }, kard.név)).toEqual([]);
  });

  it('Mesterfegyver + Erőbónusz: a fegyver-mód saját SP-tagjaiból (fegyverSpBónuszok), csak a megjelölt fegyverre', () => {
    const mf = data.konstansok.mesterfegyver_bónuszok.find(b => b.fok === 2)!.SP;
    const k = { ...alap, fortélyok: [{ id: 'mesterfegyver', fok: 2, elem: kard.név }], fegyverek: [{ ...alap.fegyverek[0], alap: kard.név }], session } as Karakter;
    const r = useHarcComputed(data, k, session).fegyverResults.find(x => x.fegyver_név === kard.név)!;
    const erő = Math.min(k.tulajdonságok.erő, elsődlegesMód(kard).Erőlimit);
    expect(fegyverSpBónuszok(r, kard.név)).toEqual([
      ...(erő ? [{ forrás: 'Erőbónusz', érték: erő }] : []),
      { forrás: `Mesterfegyver - ${kard.név}`, érték: mf },
    ]);
    // Minden mód SP-je tartalmazza a tagokat: SP − erő − mf = a mód nélkülük számolt SP-je
    const k0 = { ...k, fortélyok: [], tulajdonságok: { ...k.tulajdonságok, erő: 0 } } as Karakter;
    const r0 = useHarcComputed(data, k0, session).fegyverResults.find(x => x.fegyver_név === kard.név)!;
    r.módok.forEach((m, i) => expect(m.SP - m.sp_erőbónusz - m.sp_mf).toBe(r0.módok[i].SP));
  });
});

// A korábbi 3 rejtett eltérés (DEVSTATE, 2026-10-18) - ma egyik sem fordul elő az adatban, ezért szintetikus
// adat-kiegészítéssel (a valódi GameData klónján) rögzítve, hogy a közös gyűjtőn mindhárom helyesen működik.
describe('collectDobásInfo - a korábbi rejtett eltérések', () => {
  const alapData = loadGameDataSync();
  const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  const üres = { ...alap.session, aktív_taktikák: [], aktív_helyzetek: [], aktív_státuszok: [], kétkezes_harc: false } as Session;
  const klón = () => structuredClone(alapData);
  const té = (data: GameData, s: Partial<Session>, k: Karakter = alap, f?: (x: unknown) => boolean) => {
    const session = { ...üres, ...s } as Session;
    return collectDobásInfo(session, { ...k, session }, data, undefined, f).téHatások;
  };

  it('1. strukturált feltételű fortély kocka-hatás: session-forrás magától, computed-forrás a harc-kiértékelővel', () => {
    const data = klón();
    const def = data.fortelySummaries.find(d => d.id === 'kétkezesség')!;
    const fok = def.fokok.find(f => f.fok === 1)!;
    fok.módosítók = [
      { cél: 'té_dobás', mód: 'előny', érték: 1, feltétel: [{ forrás: 'kétkezes_harc', operátor: '==', érték: true }] },
      { cél: 'té_dobás', mód: 'hátrány', érték: -1, feltétel: [{ forrás: 'páncél_merev', operátor: '==', érték: true }] },
    ] as typeof fok.módosítók;
    const k = { ...alap, fortélyok: [{ id: 'kétkezesség', fok: 1, elem: '' }] } as Karakter;
    expect(té(data, {}, k)).toEqual([]);
    expect(té(data, { kétkezes_harc: true }, k).map(h => h.érték)).toEqual([1]);
    // computed-forrás (páncél_merev): a hívó harc-kiértékelője dönti el
    const páncélMerev = (f: unknown) => Array.isArray(f) && f.every(p => p.forrás === 'páncél_merev');
    expect(té(data, {}, k, páncélMerev).map(h => h.érték)).toEqual([-1]);
  });

  it('2. taktika hatás feltétele: csak teljesült feltétellel', () => {
    const data = klón();
    const t = data.taktikak.find(x => x.név === 'Roham')!;
    t.hatások = [...(t.hatások ?? []), { cél: 'té_dobás', mód: 'előny', érték: 1, feltétel: 'harci_helyzet:fegyverelőny' }] as typeof t.hatások;
    const fegyverelőny = data.harciHelyzetek.find(h => h.feltétel_kulcs === 'harci_helyzet:fegyverelőny')!.név;
    expect(té(data, { aktív_taktikák: [{ név: 'Roham' }] })).toEqual([]);
    expect(té(data, { aktív_taktikák: [{ név: 'Roham' }], aktív_helyzetek: [fegyverelőny] }).map(h => [h.forrás, h.érték])).toEqual([['Roham', 1]]);
  });

  it('3. fokozatos taktika fok-szintű hatása: csak a választott fokon, „Név (fok)" forrással', () => {
    const data = klón();
    const t = data.taktikak.find(x => x.név === 'Támadó')!;
    t.fokok!.find(f => f.fok === 2)!.hatások = [{ cél: 'té_dobás', mód: 'előny', érték: 1 }] as never;
    expect(té(data, { aktív_taktikák: [{ név: 'Támadó', fok: 1 }] })).toEqual([]);
    expect(té(data, { aktív_taktikák: [{ név: 'Támadó', fok: 2 }] }).map(h => [h.forrás, h.érték])).toEqual([['Támadó (2)', 1]]);
  });
});

// Páros, kétkezes hajítás (md/073): a taktika Hátrány-1-e gépi a Célzó dobáson (2026-10-19); a Kétkezesség-kivétel
// (a 2. dobást nem sújtja) két dobás miatt szöveges marad a megjegyzésben.
describe('collectCéDobásInfo - Páros, kétkezes hajítás', () => {
  const data = loadGameDataSync();
  const alap: Karakter = JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));
  it('Hátrány-1 a CÉ dobásra, a Kétkezesség-megjegyzés látszik', () => {
    const session = { ...alap.session, aktív_taktikák: [{ név: 'Páros kétkezes hajítás' }], aktív_helyzetek: [], aktív_státuszok: [] } as Session;
    const info = collectCéDobásInfo(session, { ...alap, session }, data);
    expect(info.céHatások.map(h => [h.forrás, h.operátor, h.érték])).toEqual([['Páros kétkezes hajítás', 'hátrány', -1]]);
    expect(netElőnySzint(info.céHatások)).toBe(-1);
    expect(info.céMegjegyzések.some(m => /Kétkezesség/.test(m.szöveg))).toBe(true);
  });
});
