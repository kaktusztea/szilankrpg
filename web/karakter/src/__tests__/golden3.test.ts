/**
 * Golden test #3 — test_karakter3.json (pak-Teth, 11. TSz, Amund, misztikus mágus)
 * Cél: misztikus/mágus karakter lefedése, kevés harci, sok képzettség/fortély.
 * Bőr páncél mestermunka, Meneth (abbitacél, MF 1.fok), Támadó taktika fok 3,
 * Meglepetés helyzet, Csonkolás manőver, Zavar státusz.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluate, buildContext, type Rule } from '../engine/reactive';
import { buildPancelLookups, calcFtEnyhites } from '../components/harc/pancel-calc';
import { buildFegyverRows, calcFegyverResults } from '../components/harc/fegyver-calc';
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
  karakter = loadJson('karakter/test_karakter3.json');
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

describe('Golden #3 — rules.json alapszámítások (pak-Teth, 11. TSz, Amund)', () => {
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

  it('ÉP = 36', () => expect(results.get('ÉP')).toBe(36));
  it('KÉ = 16', () => expect(results.get('KÉ')).toBe(16));
  it('TÉ_alap = 19', () => expect(results.get('TÉ_alap')).toBe(19));
  it('VÉ_alap = 36', () => expect(results.get('VÉ_alap')).toBe(36));
  it('CÉ_alap = -11', () => expect(results.get('CÉ_alap')).toBe(-11));
  it('Aura = 20 (Amund)', () => expect(results.get('Aura')).toBe(20));

  // Bőr páncél, mestermunka, nincs fémalapanyag, idea=0, sisak=false, végtagvédettség=0, passzol, rongálódás=0
  it('páncél_MGT = 3', () => expect(results.get('páncél_MGT')).toBe(3));
  it('sfé_fizikai = 7', () => expect(results.get('sfé_fizikai')).toBe(7));
  it('sfé_energia = 10', () => expect(results.get('sfé_energia')).toBe(10));
  it('páncél_lefedettség = 50', () => expect(results.get('páncél_lefedettség')).toBe(50));
  it('merevvért_TÉ_büntetés = 0 (bőr nem merev)', () => expect(results.get('merevvért_TÉ_büntetés')).toBe(0));
});

describe('Golden #3 — fegyver kalkuláció', () => {
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

  it('Meneth (abbitacél, MF 1.fok): TÉ=26, VÉ=42, SP=7, harckeret=6, támadások=1', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const rows = buildFegyverRows(karakter, data, null);
    const row = rows.find(r => r.név === 'Meneth');
    expect(row).toBeDefined();
    const res = calcFegyverResults(
      [{ fDef: row!.fDef, mfFok: row!.mfFok }],
      karakter, data, fortelyMods, 3, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(res[0].TÉ).toBe(26);
    expect(res[0].VÉ).toBe(42);
    expect(res[0].SP).toBe(7);
    expect(res[0].harckeret).toBe(6);
    expect(res[0].támadások).toBe(1);
  });

  it('Puszta kéz: TÉ=7, VÉ=24, SP=-3, harckeret=0, támadások=1', () => {
    const fortelyMods = { TÉ: 0, VÉ: 0, SP: 0, harckeret: 0 };
    const rows = buildFegyverRows(karakter, data, null);
    const row = rows.find(r => r.név === 'Puszta kéz');
    expect(row).toBeDefined();
    const res = calcFegyverResults(
      [{ fDef: row!.fDef, mfFok: row!.mfFok }],
      karakter, data, fortelyMods, 3, harcmodorÖsszeg, lookupArrays, stringCtx,
    );
    expect(res[0].TÉ).toBe(7);
    expect(res[0].VÉ).toBe(24);
    expect(res[0].SP).toBe(-3);
    expect(res[0].harckeret).toBe(0);
    expect(res[0].támadások).toBe(1);
  });
});

describe('Golden #3 — Fájdalomtűrés enyhítés', () => {
  it('9. szint → enyhítés = 3', () => {
    const enyhítés = calcFtEnyhites(karakter.képzettségek, konstansok.fájdalomtűrés_enyhítés);
    expect(enyhítés).toBe(3);
  });
});
