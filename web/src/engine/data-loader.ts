import type { FegyverAlap, PancelStruktura, PancelFemalapanyag, MesterfegyverBonusz, HarcertekAlap, KpConfig, Aranyok } from './types';

const BASE = import.meta.env.BASE_URL + 'data/';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
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
  pajzs_TÉ_büntetés: { méret: string; büntetés: number }[];
  harcmodorok: { közelharci: string[]; távolsági: string[] };
  fegyver_kategória_harcmodor: Record<string, string>;
  több_támadás_TÉ_levonás: number;
  kétkezes_harc_max_pengeméret: number;
  kétkezes_harc_bónuszok: { fok: number; harckeret: number; TÉ: number; VÉ: number; mindkét_fegyver_értékei: boolean; mf: string }[];
  kétkezes_harc_pengelevonás_osztó: number;
  fegyverfogás_opciók: { id: string; név: string }[];
  locked_fortélyok: string[];
  egészség_kategória_levonás: { szint: string; módosítók: { cél: string; érték: number }[] }[];
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
export interface FortelyModosito {
  cél: string;
  érték: number;
  mód: string;
  forrás: string;
  arány: number;
  feltétel: string;
}

export interface FortelyFokSummary {
  fok: number;
  hatás: string[];
  követelmény: string;
  követelmények: { név: string | string[]; érték: number; típus: string }[];
  módosítók: FortelyModosito[];
}

export interface FortelySummary {
  név: string;
  csoport: string;
  maxfok: number;
  session_toggle: boolean;
  emlékeztető: boolean;
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
import type { Karakter } from './types';

// --- Tradíció ---
export interface TradicioAltipus {
  név: string;
  pantheon?: string;
  leírás?: string;
}

export interface TradicioEntry {
  név: string;
  típus: string;
  altípusok: TradicioAltipus[];
}

// --- Nyelv ---
export interface NyelvEntry {
  név: string;
  csoport: string;
}

export interface TaktikaMegkötés {
  típus: string;
  mód: string;
  érték?: string | string[] | number;
}

export interface TaktikaEntry {
  név: string;
  feltétel_kulcs: string;
  fokozatos: boolean;
  módosítók?: Record<string, number>;
  fokok?: { fok: number; TÉ?: number; VÉ?: number; KÉ?: number; SP?: number; hatások?: { hatás: string; érték?: number; cél: string; megjegyzés?: string }[] }[];
  megjegyzés?: string;
  megkötések?: TaktikaMegkötés[];
  kombó_mód: string;
  kombó_lista: string[];
}

export interface HarciHelyzetEntry {
  név: string;
  feltétel_kulcs: string;
  infó: string;
  hatások?: StatuszHatas[];
}

export interface SzituacioEntry {
  név: string;
  feltétel_kulcs: string;
  infó: string;
}

export interface ManoverEntry {
  id: string;
  név: string;
  típus: string;
  nehézség: number;
  fázisok: string;
  hatás: string;
}

export interface StatuszHatas {
  hatás: string;
  érték?: number;
  cél: string;
  megjegyzés?: string;
}

export interface StatuszFok {
  fok: number;
  alcím: string;
  hatások: StatuszHatas[];
}

export interface StatuszEntry {
  név: string;
  kategória: string;
  többszörös?: boolean;
  alkategóriák?: string[];
  fokok: StatuszFok[];
}

export interface HatasOperator {
  id: string;
  név: string;
  mód: string;
}

export interface EsemenyEntry {
  id: string;
  név: string;
  csoport: string;
}

export interface LeíróHátterKategória {
  kategória: string;
  elemek: string[];
}

export interface HatterekData {
  leíró_hátterek: LeíróHátterKategória[];
  karma_hátterek: string[];
}

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
  tradiciok: TradicioEntry[];
  nyelvek: NyelvEntry[];
  taktikak: TaktikaEntry[];
  harciHelyzetek: HarciHelyzetEntry[];
  szituaciok: SzituacioEntry[];
  manoverek: ManoverEntry[];
  statuszok: StatuszEntry[];
  hatasOperatorok: HatasOperator[];
  esemenyek: EsemenyEntry[];
  hatterek: HatterekData;
  rules: Rule[];
  emptyKarakter: Karakter;
  testKarakter: Karakter;
}

export async function loadGameData(): Promise<GameData> {
  const [konstansok, fegyverek, tavfegyverek, pajzsok, kepzettsegKpRaw, harcmodorRaw, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, tradiciok, nyelvek, taktikak, harciHelyzetek, szituaciok, manoverek, statuszok, hatasOperatorok, esemenyek, hatterek, rulesFile, emptyKarakter, testKarakter] = await Promise.all([
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
    fetchJson<TradicioEntry[]>('tables/tradiciok.json'),
    fetchJson<NyelvEntry[]>('tables/nyelvek.json'),
    fetchJson<TaktikaEntry[]>('tables/taktikak.json'),
    fetchJson<HarciHelyzetEntry[]>('tables/harci_helyzetek.json'),
    fetchJson<SzituacioEntry[]>('tables/szituaciok.json'),
    fetchJson<ManoverEntry[]>('tables/manoverek.json'),
    fetchJson<StatuszEntry[]>('tables/statuszok.json'),
    fetchJson<HatasOperator[]>('tables/hatasok.json'),
    fetchJson<EsemenyEntry[]>('tables/esemenyek.json'),
    fetchJson<HatterekData>('tables/hatterek.json'),
    fetchJson<{ rules: Rule[] }>('rules.json'),
    fetchJson<Karakter>('karakter/empty_karakter.json'),
    fetchJson<Karakter>('karakter/test_karakter.json'),
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

  return { konstansok, fegyverek, tavfegyverek, pajzsok, kepzettsegKp, harcmodorBonusz, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, tradiciok, nyelvek, taktikak, harciHelyzetek, szituaciok, manoverek, statuszok, hatasOperatorok, esemenyek, hatterek, rules: rulesFile.rules, emptyKarakter, testKarakter };
}
