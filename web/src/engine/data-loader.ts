import type { FegyverAlap, PancelStruktura, PancelFemalapanyag, MesterfegyverBonusz, HarcertekAlap, KpConfig, Aranyok } from './types';

const BASE = import.meta.env.BASE_URL + 'data/';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  return res.json();
}

// --- Konstansok YAML struktúra ---
interface KonstansokRaw {
  harcérték_alap: HarcertekAlap;
  kp: KpConfig;
  kp_bónusz: { analfabéta: number; apró_méretű_lény: number; süketség: number; vakság: number; tartós_sérülés_per_fok: number };
  arányok: Aranyok;
  tulajdonság_pontok: Record<string, number>;
  páncél_struktúrák: PancelStruktura[];
  páncél_fémalapanyagok: PancelFemalapanyag[];
  páncél_csatolt_tag_mgt: { hajlékonyvért_nem_fém: Record<string, number>; hajlékonyvért_fém: Record<string, number>; merevvért_fém: Record<string, number> };
  mesterfegyver_bónuszok: MesterfegyverBonusz[];
  merevvértviselet_bónuszok: { fok: number; TÉ_büntetés_csökkentés: number }[];
  pajzshasználat_TÉ_büntetés: { pajzs: string; fokok: number[] }[];
  harcmodorok: { közelharci: string[]; távolsági: string[] };
  nyelvek: string[];
  fájdalomtűrés_enyhítés: { szint: number; enyhítés: number }[];
}

// --- KP tábla JSON struktúra ---
interface KepzettsegKpEntry {
  'Képzettség Szint': string;
  'KP igény': string;
}

// --- Harcmodor bónusz JSON ---
interface HarcmodorBonuszEntry {
  'Harcmodor Szint': string;
  'TÉ': string;
  'VÉ': string;
  'CÉ': string;
}

// --- Képzettség definíció ---
export interface KepzettsegDef {
  név: string;
  csoport: string;
  primer: boolean;
  többszörös: string[];
  próba: string;
  domináns_tulajdonságok: string[];
}

// --- Kiterjesztés entry ---
export interface KiterjesztesEntry {
  fortély: string;
  típus: 'normál' | 'erős';
}

// --- Fortély összefoglaló (UI-hoz) ---
export interface FortelyFokSummary {
  fok: number;
  hatás: string[];
  követelmény: string;
}

export interface FortelySummary {
  név: string;
  csoport: string;
  maxfok: number;
  kp_perfok: number;
  ingyenes_perszint: number;
  többszörös_típus: string;
  többszörös_lista: string[];
  leírás: string;
  kiterjeszti_normál: string[];
  kiterjeszti_erős: string[];
  fokok: FortelyFokSummary[];
}

import type { Rule } from './reactive';

// --- Betöltött adat ---
export interface GameData {
  konstansok: KonstansokRaw;
  fegyverek: FegyverAlap[];
  tavfegyverek: FegyverAlap[];
  pajzsok: { Pajzs: string; TÉ: string; VÉ: string; Sebesség: string }[];
  kepzettsegKp: { szint: number; kp: number }[];
  harcmodorBonusz: { szint: number; TÉ: number; VÉ: number; CÉ: number }[];
  kepzettsegDefs: KepzettsegDef[];
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  fajNevek: string[];
  fajKeretek: Record<string, Record<string, [number, number]>>;
  primerFortelyok: string[];
  fortelySummaries: FortelySummary[];
  rules: Rule[];
}

export async function loadGameData(): Promise<GameData> {
  const [konstansok, fegyverek, tavfegyverek, pajzsok, kepzettsegKpRaw, harcmodorRaw, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, rulesFile] = await Promise.all([
    fetchJson<KonstansokRaw>('tables/konstansok.json'),
    fetchJson<FegyverAlap[]>('tables/fegyverek.json'),
    fetchJson<FegyverAlap[]>('tables/tavfegyverek.json'),
    fetchJson<{ Pajzs: string; TÉ: string; VÉ: string; Sebesség: string }[]>('tables/pajzsok.json'),
    fetchJson<KepzettsegKpEntry[]>('tables/kepzettseg_kp.json'),
    fetchJson<HarcmodorBonuszEntry[]>('tables/harcmodor_kepzettsegek_bonuszok.json'),
    fetchJson<KepzettsegDef[]>('tables/kepzettsegek.json'),
    fetchJson<Record<string, KiterjesztesEntry[]>>('tables/kiterjesztesek.json'),
    fetchJson<string[]>('tables/fajok.json'),
    fetchJson<string[]>('tables/primer_fortelyok.json'),
    fetchJson<Record<string, Record<string, [number, number]>>>('tables/faj_tulajdonsag_keretek.json'),
    fetchJson<FortelySummary[]>('tables/fortelyok.json'),
    fetchJson<{ rules: Rule[] }>('rules.json'),
  ]);

  const kepzettsegKp = kepzettsegKpRaw.map(e => ({
    szint: parseInt(e['Képzettség Szint']),
    kp: parseInt(e['KP igény']),
  }));

  const harcmodorBonusz = harcmodorRaw.map(e => ({
    szint: parseInt(e['Harcmodor Szint']),
    TÉ: parseInt(e['TÉ']),
    VÉ: parseInt(e['VÉ']),
    CÉ: parseInt(e['CÉ']),
  }));

  return { konstansok, fegyverek, tavfegyverek, pajzsok, kepzettsegKp, harcmodorBonusz, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, rules: rulesFile.rules };
}
