/**
 * Golden test — teljes kalkulációs pipeline a test_karakter.json alapján.
 * Ha bármely formula/adat módosul és eltér az elvárt végeredmény, ez a teszt azonnal jelez.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluate, buildContext, type Rule } from '../engine/reactive';
import { buildPancelLookups, calcFtEnyhites } from '../components/harc/pancel-calc';
import { buildFegyverRows, calcFegyverResults } from '../components/harc/fegyver-calc';
import { calcKétkezesHarc } from '../engine/ketkezes';
import type { Karakter, FegyverAlap } from '../engine/types';

const DATA_ROOT = resolve(__dirname, '../../../../data');

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(DATA_ROOT, path), 'utf-8'));
}

let karakter: Karakter;
let rules: Rule[];
let konstansok: any;
let fegyverek: FegyverAlap[];
let harcmodorBonusz: { szint: number; TÉ: number; VÉ: number; CÉ: number }[];

beforeAll(() => {
  karakter = loadJson('karakter/test_karakter.json');
  const rulesFile = loadJson<{ rules: Rule[] }>('rules.json');
  rules = rulesFile.rules;
  konstansok = loadJson('tables/konstansok.json');
  fegyverek = loadJson('tables/fegyverek.json');
  const harcmodorRaw = loadJson<{ 'Harcmodor Szint': string; TÉ: string; VÉ: string; CÉ: string }[]>('tables/harcmodor_kepzettsegek_bonuszok.json');
  harcmodorBonusz = harcmodorRaw.map(e => ({ szint: parseInt(e['Harcmodor Szint']), TÉ: parseInt(e['TÉ']), VÉ: parseInt(e['VÉ']), CÉ: parseInt(e['CÉ']) }));
});

describe('Golden test — rules.json alapszámítások (von Agabor, 8. TSz)', () => {
  let results: Map<string, number>;

  beforeAll(() => {
    const lookupArrays = buildPancelLookups(konstansok);
    const stringCtx = new Map<string, string>();
    stringCtx.set('páncél_alap', karakter.páncél.alap);
    stringCtx.set('páncél_fémalapanyag', karakter.páncél.fémalapanyag || '');
    stringCtx.set('páncél_kidolgozottság', karakter.páncél.kidolgozottság || '');
    stringCtx.set('páncél_méret_illeszkedés', karakter.páncél.méret_illeszkedés || '');

    const harcmodorÖsszeg = karakter.képzettségek
      .filter(k => (konstansok.harcmodorok.közelharci as string[]).includes(k.név.toLowerCase()))
      .reduce((s, k) => s + k.szint, 0);

    const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok, {
      HM_TÉ: karakter.HM_TÉ, HM_VÉ: karakter.HM_VÉ, CM: karakter.CM,
      harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: 0,
      felszerelés_terhelés: 0,
      merevvért_fok: karakter.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0,
      páncél_van: karakter.páncél.alap ? 1 : 0,
      páncél_végtagvédettség: karakter.páncél.végtagvédettség,
      páncél_sisak: karakter.páncél.sisak ? 1 : 0,
      páncél_idea: karakter.páncél.idea,
      páncél_rongálódás: karakter.páncél.rongálódás,
      spec_tartós_sérülés_fok: karakter.fortélyok_speciális.tartós_sérülés_fok,
    });

    results = evaluate(rules, ctx, lookupArrays, stringCtx);
  });

  it('ÉP = 40', () => expect(results.get('ÉP')).toBe(40));
  it('KÉ = 12', () => expect(results.get('KÉ')).toBe(12));
  it('TÉ_alap = 34', () => expect(results.get('TÉ_alap')).toBe(34));
  it('VÉ_alap = 51', () => expect(results.get('VÉ_alap')).toBe(51));
  it('CÉ_alap = -13', () => expect(results.get('CÉ_alap')).toBe(-13));
  it('Aura = 20', () => expect(results.get('Aura')).toBe(20));

  it('páncél_MGT = 2', () => expect(results.get('páncél_MGT')).toBe(2));
  it('sfé_fizikai = 7', () => expect(results.get('sfé_fizikai')).toBe(7));
  it('sfé_energia = 10', () => expect(results.get('sfé_energia')).toBe(10));
  it('páncél_lefedettség = 50', () => expect(results.get('páncél_lefedettség')).toBe(50));
  it('merevvért_TÉ_büntetés = 0 (bőr nem merev)', () => expect(results.get('merevvért_TÉ_büntetés')).toBe(0));
});

describe('Golden test — fegyver kalkuláció', () => {
  it('Kard, lovag: TÉ=47, VÉ=62, SP=11, támadások=2', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const merevvértFok = 3;
    const harcmodorÖsszeg = karakter.képzettségek
      .filter(k => (konstansok.harcmodorok.közelharci as string[]).includes(k.név.toLowerCase()))
      .reduce((s, k) => s + k.szint, 0);
    const lookupArrays = buildPancelLookups(konstansok);
    const stringCtx = new Map<string, string>();
    stringCtx.set('páncél_alap', karakter.páncél.alap);
    stringCtx.set('páncél_fémalapanyag', '');
    stringCtx.set('páncél_kidolgozottság', karakter.páncél.kidolgozottság);
    stringCtx.set('páncél_méret_illeszkedés', karakter.páncél.méret_illeszkedés);

    const data = { konstansok, fegyverek, harcmodorBonusz, rules, fortelySummaries: [] } as any;
    const rows = buildFegyverRows(karakter, data, null);
    const lovagRow = rows.find(r => r.név === 'Kard, lovag');
    expect(lovagRow).toBeDefined();

    const results = calcFegyverResults(
      [{ fDef: lovagRow!.fDef, mfFok: lovagRow!.mfFok }],
      karakter, data, fortelyMods, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(results[0].TÉ).toBe(47);
    expect(results[0].VÉ).toBe(62);
    expect(results[0].SP).toBe(11);
    expect(results[0].támadások).toBe(2);
    expect(results[0].harckeret).toBe(9);
  });

  it('Tőr: TÉ=41, VÉ=57, SP=6, támadások=2', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const merevvértFok = 3;
    const harcmodorÖsszeg = karakter.képzettségek
      .filter(k => (konstansok.harcmodorok.közelharci as string[]).includes(k.név.toLowerCase()))
      .reduce((s, k) => s + k.szint, 0);
    const lookupArrays = buildPancelLookups(konstansok);
    const stringCtx = new Map<string, string>();
    stringCtx.set('páncél_alap', karakter.páncél.alap);
    stringCtx.set('páncél_fémalapanyag', '');
    stringCtx.set('páncél_kidolgozottság', karakter.páncél.kidolgozottság);
    stringCtx.set('páncél_méret_illeszkedés', karakter.páncél.méret_illeszkedés);

    const data = { konstansok, fegyverek, harcmodorBonusz, rules, fortelySummaries: [] } as any;
    const rows = buildFegyverRows(karakter, data, null);
    const tőrRow = rows.find(r => r.név === 'Tőr');
    expect(tőrRow).toBeDefined();

    const results = calcFegyverResults(
      [{ fDef: tőrRow!.fDef, mfFok: tőrRow!.mfFok }],
      karakter, data, fortelyMods, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(results[0].TÉ).toBe(41);
    expect(results[0].VÉ).toBe(57);
    expect(results[0].SP).toBe(6);
    expect(results[0].támadások).toBe(2);
    expect(results[0].harckeret).toBe(7);
  });
});

describe('Golden test — kétkezes harc', () => {
  it('Kard, lovag + Tőr: TÉ=49, VÉ=63, SP=11, harckeret=9, támadások=2', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const result = calcKétkezesHarc({
      jobbFp: karakter.fegyverek[0],
      balFp: karakter.fegyverek[1],
      fegyverek, karakter, konstansok, harcmodorBonusz, fortelyMods,
    });
    expect(result).not.toBeNull();
    expect(result!.TÉ).toBe(49);
    expect(result!.VÉ).toBe(63);
    expect(result!.SP).toBe(11);
    expect(result!.harckeret).toBe(9);
    expect(result!.támadások).toBe(2);
    expect(result!.sumPengehossz).toBe(1);
  });
});

describe('Golden test — Fájdalomtűrés enyhítés', () => {
  it('7. szint → enyhítés = 2', () => {
    const enyhítés = calcFtEnyhites(karakter.képzettségek, konstansok.fájdalomtűrés_enyhítés);
    expect(enyhítés).toBe(2);
  });
});
