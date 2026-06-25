import type { FegyverAlap, TavfegyverAlap, TavharcSzorzok, Karakter } from './types';
import type { Rule } from './reactive';

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
  követelmény: string[];
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
  fokok?: { fok: number; TÉ?: number; VÉ?: number; KÉ?: number; SP?: number; hatások?: { operátor: string; érték?: number; cél: string; megjegyzés?: string }[] }[];
  megjegyzés?: string;
  megkötések?: TaktikaMegkötés[];
  kombó_mód: string;
  kombó_lista: string[];
  fortély_bővítés?: { fortély: string; extra_fokok_per_fok: number };
}

export interface HarciHelyzetEntry {
  név: string;
  feltétel_kulcs: string;
  infó: string;
  hatások?: StatuszHatas[];
  fegyver_override?: {
    feltétel: { forrás: string; operátor: string; érték: unknown }[];
    módosítók: { cél: string; érték: number; mód: string }[];
  };
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
  operátor: string;
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

// --- Konstansok (belső, nem exportált a data-loader-ből) ---
export interface KonstansokRaw {
  harcérték_alap: { KÉ: number; TÉ: number; VÉ: number; CÉ: number };
  kp: { perszint: number; szekunder_perszint: number; fortályfok: number; hm: number; cm: number; max_cm_perszint: number };
  kp_bónusz: { analfabéta: number; apró_méretű_lény: number; süketség: number; vakság: number; tartós_sérülés_per_fok: number };
  arányok: { max_tsz: number; max_hm_diff_szintlépésenként: number; képzettség_nemprimer_max_szint_plusz: number; képzettség_max_szint: number; tulajdonság_pont_alap: number; tulajdonság_pont_tsz_bónusz: number; max_cm_perszint: number };
  tulajdonság_pontok: Record<string, number>;
  páncél_struktúrák: any[];
  páncél_fémalapanyagok: any[];
  páncél_csatolt_tag_mgt: { hajlékonyvért_nem_fém: Record<string, number>; hajlékonyvért_fém: Record<string, number>; merevvért_fém: Record<string, number> };
  mesterfegyver_bónuszok: { fok: number; TÉ: number; VÉ: number; CÉ: number; SP: number }[];
  merevvértviselet_bónuszok: { fok: number; TÉ_büntetés_csökkentés: number }[];
  pajzs_TÉ_büntetés: { méret: string; büntetés: number }[];
  harcmodorok: { közelharci: string[]; távolsági: string[] };
  fegyver_kategória_harcmodor: Record<string, string>;
  több_támadás_TÉ_levonás: number;
  kétkezes_harc_max_pengeméret: number;
  kétkezes_harc_bónuszok: any[];
  kétkezes_harc_pengelevonás_osztó: number;
  fegyverfogás_opciók: { id: string; név: string }[];
  locked_fortélyok: string[];
  egészség_kategória_levonás: any[];
  fájdalomtűrés_enyhítés: { szint: number; enyhítés: number }[];
  sebesülés_kategóriák_száma: number;
  hm_aszimmetria_osztó: number;
  vé_csökkentés_gombok: number[];
  taktika_vé_eltolás_limit: number;
  nyílpuska_alap_támadás: string;
  nyílpuska_gyors_újratöltés_fortély: string;
  nyílpuska_gyors_újratöltés_min_fok: number;
  [key: string]: any;
}

// --- Betöltött adat ---
export interface GameData {
  konstansok: KonstansokRaw;
  fegyverek: FegyverAlap[];
  tavfegyverek: TavfegyverAlap[];
  tavharcSzorzok: TavharcSzorzok;
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
  manoverek: ManoverEntry[];
  statuszok: StatuszEntry[];
  hatasOperatorok: HatasOperator[];
  esemenyek: EsemenyEntry[];
  hatterek: HatterekData;
  rules: Rule[];
  emptyKarakter: Karakter;
  testKarakter: Karakter;
}
