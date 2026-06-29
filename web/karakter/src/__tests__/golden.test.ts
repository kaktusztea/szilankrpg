/**
 * Golden test #2 — test_karakter2.json (von Agabor, 10. TSz, Dzsenn, komplex session)
 * Cél: minél több picker / non-default érték lefedése.
 * Bronz lánc/sodrony, sisak, végtagvédettség=3, nem passzol, rongálódás=3,
 * kétkezes harc, Támadó taktika fok 3, Hátulról támadás helyzet, Félelem státusz.
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
  karakter = loadJson('karakter/test_karakter2.json');
  rules = loadJson<{ rules: Rule[] }>('rules.json').rules;
  konstansok = loadJson('tables/konstansok.json');
  fegyverek = loadJson('tables/fegyverek.json');
  const raw = loadJson<any[]>('tables/harcmodor_kepzettsegek_bonuszok.json');
  harcmodorBonusz = raw.map(e => ({
    szint: parseInt(e['Harcmodor Szint']),
    TÉ: parseInt(e['TÉ']),
    VÉ: parseInt(e['VÉ']),
    CÉ: parseInt(e['CÉ']),
  }));
});

describe('Golden #2 — rules.json alapszámítások (von Agabor, 10. TSz, Dzsenn)', () => {
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
  it('KÉ = 14 (Gyors kezdeményezés 2.fok)', () => expect(results.get('KÉ')).toBe(14));
  it('TÉ_alap = 34', () => expect(results.get('TÉ_alap')).toBe(34));
  it('VÉ_alap = 50', () => expect(results.get('VÉ_alap')).toBe(50));
  it('CÉ_alap = -12', () => expect(results.get('CÉ_alap')).toBe(-12));
  it('Aura = 24 (Dzsenn)', () => expect(results.get('Aura')).toBe(24));

  // Bronz lánc/sodrony, idea=3, sisak, végtagvédettség=3, nem passzol, rongálódás=3
  it('páncél_MGT = 14', () => expect(results.get('páncél_MGT')).toBe(14));
  it('sfé_fizikai = 5', () => expect(results.get('sfé_fizikai')).toBe(5));
  it('sfé_energia = 5', () => expect(results.get('sfé_energia')).toBe(5));
  it('páncél_lefedettség = 90', () => expect(results.get('páncél_lefedettség')).toBe(90));
  it('merevvért_TÉ_büntetés = 0 (lánc/sodrony nem merev)', () => expect(results.get('merevvért_TÉ_büntetés')).toBe(0));
});

describe('Golden #2 — fegyver kalkuláció', () => {
  let harcmodorÖsszeg: number;
  let lookupArrays: any;
  let stringCtx: Map<string, string>;
  let data: any;

  beforeAll(() => {
    lookupArrays = buildPancelLookups(konstansok);
    stringCtx = new Map<string, string>();
    stringCtx.set('páncél_alap', karakter.páncél.alap);
    stringCtx.set('páncél_fémalapanyag', karakter.páncél.fémalapanyag || '');
    stringCtx.set('páncél_kidolgozottság', karakter.páncél.kidolgozottság || '');
    stringCtx.set('páncél_méret_illeszkedés', karakter.páncél.méret_illeszkedés || '');
    harcmodorÖsszeg = karakter.képzettségek
      .filter(k => (konstansok.harcmodorok.közelharci as string[]).includes(k.név.toLowerCase()))
      .reduce((s, k) => s + k.szint, 0);
    data = { konstansok, fegyverek, harcmodorBonusz, rules, fortelySummaries: [] };
  });

  it('Kard, lovag: TÉ=47, VÉ=61, SP=11, harckeret=0, támadások=1', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const rows = buildFegyverRows(karakter, data, null);
    const row = rows.find(r => r.név === 'Kard, lovag');
    expect(row).toBeDefined();
    const res = calcFegyverResults(
      [{ fDef: row!.fDef, mfFok: row!.mfFok }],
      karakter, data, fortelyMods, 3, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(res[0].TÉ).toBe(47);
    expect(res[0].VÉ).toBe(61);
    expect(res[0].SP).toBe(11);
    expect(res[0].harckeret).toBe(0);
    expect(res[0].támadások).toBe(1);
  });

  it('Tőr: TÉ=40, VÉ=55, SP=5, harckeret=0, támadások=1', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const rows = buildFegyverRows(karakter, data, null);
    const row = rows.find(r => r.név === 'Tőr');
    expect(row).toBeDefined();
    const res = calcFegyverResults(
      [{ fDef: row!.fDef, mfFok: row!.mfFok }],
      karakter, data, fortelyMods, 3, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(res[0].TÉ).toBe(40);
    expect(res[0].VÉ).toBe(55);
    expect(res[0].SP).toBe(5);
    expect(res[0].harckeret).toBe(0);
    expect(res[0].támadások).toBe(1);
  });
});

describe('Golden #2 — kétkezes harc', () => {
  it('Kard, lovag + Tőr: TÉ=49, VÉ=62, SP=11, harckeret=9, támadások=2', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const result = calcKétkezesHarc({
      jobbFp: karakter.fegyverek[0],
      balFp: karakter.fegyverek[1],
      fegyverek, karakter, konstansok, harcmodorBonusz, fortelyMods,
    });
    expect(result).not.toBeNull();
    expect(result!.TÉ).toBe(49);
    expect(result!.VÉ).toBe(62);
    expect(result!.SP).toBe(11);
    expect(result!.harckeret).toBe(9);
    expect(result!.támadások).toBe(2);
    expect(result!.sumPengehossz).toBe(1);
  });
});

describe('Golden #2 — Fájdalomtűrés enyhítés', () => {
  it('7. szint → enyhítés = 2', () => {
    const enyhítés = calcFtEnyhites(karakter.képzettségek, konstansok.fájdalomtűrés_enyhítés);
    expect(enyhítés).toBe(2);
  });
});
