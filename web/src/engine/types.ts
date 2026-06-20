// ============================================================
// Karakter (mentett példány — megfelel data/schemas/karakter.yaml v2)
// ============================================================

export interface Tulajdonsagok {
  erő: number;
  edzettség: number;
  ügyesség: number;
  gyorsaság: number;
  intelligencia: number;
  emlékezet: number;
  önuralom: number;
  érzékenység: number;
}

export interface Kepzettseg {
  név: string;
  szint: number;
}

export interface Fortely {
  név: string;
  fok: number;
  spec_típus: string;
  spec_elem: string;
  kiérdemelt?: boolean;
}

export interface FortelyokSpecialis {
  analfabéta: boolean;
  apró_méretű_lény: boolean;
  tartós_sérülés_fok: number;
  vakság: boolean;
  süketség: boolean;
}

export interface FegyverPeldany {
  alap: string;
  név: string;
  anyag: string;
  idea: number;
}

export interface TavfegyverPeldany {
  alap: string;
}

export interface PancelPeldany {
  alap: string;
  név: string;
  fémalapanyag: string;
  idea: number;
  kidolgozottság: string;
  sisak: boolean;
  végtagvédettség: number;
  méret_illeszkedés: string;
  rongálódás: number;
}

export interface PajzsPeldany {
  méret: string;  // 'kis' | 'közepes' | 'nagy' | ''
}

export interface NagyTargy {
  név: string;
  MGT: number;
}

export interface NaploBejegyzes {
  dátum: string;
  km: string;
  kaland: string;
  események: string;
}

export interface SebzésRubrika {
  típus: 'S' | 'V' | 'Z' | 'FP';
  sorszám: number;
}

export interface AktívTaktika {
  név: string;
  fok?: number;
}

export interface Session {
  szilánk: number;
  vé_csökkenés: number;
  vé_history: number[];
  manőver_pont_használt: number;
  sebzések: SebzésRubrika[];
  aktív_fegyver_index: number;
  aktív_fegyver_bal_index: number;
  kétkezes_harc: boolean;
  aktív_pajzs: boolean;
  aktív_páncél: boolean;
  aktív_taktikák: AktívTaktika[];
  aktív_helyzetek: string[];
  aktív_manőver: string;
  aktív_státuszok: string[];
  narratív_módosítók: NarratívMódosító[];
  harci_akrobatika: boolean;
  fegyverfogás: 'egyfegyveres' | 'fegyver_pajzs' | 'fegyver_hárító' | 'kétkezes';
  aktív_távfegyver_index: number;
}

export interface NarratívMódosító {
  szöveg: string;
  érték?: number;  // opcionális: Előny/Hátrány (-2..+2)
}

export interface Karakter {
  uid: string;
  id_leíró: string;
  schema_version: number;
  név: string;
  játékos: string;
  mentés_dátum: string;
  tsz: number;
  leírás: string;
  kor: number;
  anyanyelv: string;
  vallás: string;
  tulajdonságok: Tulajdonsagok;
  HM_TÉ: number;
  HM_VÉ: number;
  CM: number;
  képzettségek: Kepzettseg[];
  fortélyok: Fortely[];
  fortélyok_speciális: FortelyokSpecialis;
  hátterek: { faj: string; leíró: string[]; karma: string[] };
  fegyverek: FegyverPeldany[];
  távfegyverek: TavfegyverPeldany[];
  páncél: PancelPeldany;
  pajzs: PajzsPeldany;
  felszerelés: { nagy_tárgyak: NagyTargy[] };
  jegyzetek: string;
  napló: NaploBejegyzes[];
  session: Session;
}

// ============================================================
// Default session (betöltéskor hiányzó session pótlása)
// ============================================================

export const DEFAULT_SESSION: Session = {
  szilánk: 1,
  vé_csökkenés: 0,
  vé_history: [],
  manőver_pont_használt: 0,
  sebzések: [],
  aktív_fegyver_index: 0,
  aktív_fegyver_bal_index: -1,
  kétkezes_harc: false,
  aktív_pajzs: false,
  aktív_páncél: true,
  aktív_taktikák: [],
  aktív_helyzetek: [],
  aktív_manőver: '',
  aktív_státuszok: [],
  narratív_módosítók: [],
  harci_akrobatika: false,
  fegyverfogás: 'egyfegyveres',
  aktív_távfegyver_index: -1,
};

// ============================================================
// Fortély definíció (schema — yaml forrásból)
// ============================================================

export type ModMode = 'flat' | 'scaled' | 'override' | 'előny' | 'hátrány';

export interface Modosito {
  cél: string;
  érték: number;
  mód: ModMode;
  forrás: string;
  arány: number;
  feltétel: string;
}

export interface FortelyKovetelmeny {
  név: string | string[];
  érték: number;
  típus: string;
}

export interface FortelyFok {
  fok: number;
  követelménytext: string;
  követelmények: FortelyKovetelmeny[] | '';
  hatástext: { text: string }[];
  módosítók: Modosito[] | '';
}

export interface FortelyDef {
  schema_version: number;
  név: string;
  névkomment: string;
  maxfok: number;
  többszörösség: { spec_típus: string; spec_lista: string[] };
  csoport: string;
  leírások: { text: string }[];
  megjegyzések: { text: string }[];
  kiterjeszti: { normál: string[]; erős: string[] };
  fokok: FortelyFok[];
  todo: { text: string }[];
}

// ============================================================
// Fegyver (alaptípus, fegyverek.json)
// ============================================================

export interface FegyverAlap {
  Fegyver: string;
  TÉ: string;
  VÉ: string;
  SP: string;
  Sebesség: string;
  'Sebzés módja': string;
  Pengehossz: string;
  'Forgatás módja': string;
  'Erőbónusz limit': string;
  Átütés: string;
  Íves: string;
  MK: string;
  KF: string;
  Kategória: string;
  Speciális?: string;
  MK_pár: string;
  Alapnév: string;
  Hárító: string;
}

// ============================================================
// Távharc szorzók (tavharc_szorzok.json)
// ============================================================

export interface TavharcSzorzoEntry {
  id: number;
  leírás: string;
  szorzó: number;
}

export interface TavharcSzorzok {
  célpont_mozgás: TavharcSzorzoEntry[];
  lövész_mozgás: TavharcSzorzoEntry[];
  célpont_méret: TavharcSzorzoEntry[];
  észlelhetőség: TavharcSzorzoEntry[];
  szél: TavharcSzorzoEntry[];
}

// ============================================================
// Távfegyver (alaptípus, tavfegyverek.json)
// ============================================================

export interface TavfegyverAlap {
  Fegyver: string;
  CÉ: string;
  Osztó: string;
  SP: string;
  Sebesség: string;
  'Sebzés módja': string;
  'Forgatás módja': string;
  Erőbónusz: string;
  'Erőbónusz limit'?: string;
  Átütés: string;
  Hatótáv: string;
  Kategória?: string;
  Harcmodor?: string;
  'Speciális / Megjegyzés'?: string;
}

// ============================================================
// Konstansok
// ============================================================

export interface HarcertekAlap {
  KÉ: number;
  TÉ: number;
  VÉ: number;
  CÉ: number;
}

export interface MesterfegyverBonusz {
  fok: number;
  TÉ: number;
  VÉ: number;
  CÉ: number;
  SP: number;
}

export interface PancelStruktura {
  struktúra: string;
  leírás: string;
  fém: boolean;
  merev: boolean;
  mgt: number;
  sfé_fizikai: number;
  sfé_energia: number;
  ár_szorzó: number;
  idea_plusz_minusz: number;
}

export interface PancelFemalapanyag {
  anyag: string;
  sfé_bónusz: number;
  mgt: number;
  ár_szorzó: number;
}

export interface KpConfig {
  perszint: number;
  szekunder_perszint: number;
  fortélyfok: number;
  hm: number;
  cm: number;
  max_cm_perszint: number;
}

export interface Aranyok {
  max_tsz: number;
  max_hm_diff_szintlépésenként: number;
  képzettség_nemprimer_max_szint_plusz: number;
  képzettség_max_szint: number;
  tulajdonság_pont_alap: number;
  tulajdonság_pont_tsz_bónusz: number;
  max_cm_perszint: number;
}

// ============================================================
// Származtatott értékek (engine output — NEM mentjük)
// ============================================================

export interface FegyverHarcertekek {
  fegyver_név: string;
  TÉ: number;
  VÉ: number;
  CÉ: number;
  SP: number;
  támadások: number;
  pengehossz: number;
  sebzésmód: string;
}

export interface PancelErtekek {
  sfé_fizikai: number;
  sfé_energia: number;
  MGT: number;
  merevvért_TÉ_büntetés: number;
  lefedettség: number;
}

export interface SzarmaztatottErtekek {
  ÉP: number;
  S1_max: number;
  S2_max: number;
  S3_max: number;
  S4_max: number;
  KÉ: number;
  összes_kp: number;
  összes_szekunder_kp: number;
  spec_kp: number;
  elköltött_kp: number;
  maradék_kp: number;
  tulajdonság_pont_keret: number;
  tulajdonság_pont_maradék: number;
  manőver_pont: number;
  felszerelés_mgt: number;
  fegyverek: FegyverHarcertekek[];
  páncél: PancelErtekek;
  max_HM: number;
  max_CM: number;
}
