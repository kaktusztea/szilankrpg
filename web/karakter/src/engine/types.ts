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
  kiterjeszti?: string[];
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

export interface Előtörténet {
  származás_helye: string;
  szociális_érzék: string;
  külső: string;
  előtörténet: string;
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
  ké_dobások: number[];
  té_dobások: number[];
}

export interface NarratívMódosító {
  szöveg: string;
  érték?: number;  // opcionális: Előny/Hátrány (-2..+2)
}

export interface Checkpoint {
  id: string;               // nanoid 8 char
  név: string;              // max 20 karakter
  dátum: string;            // ISO timestamp
  snapshot: Partial<Karakter>;  // full state snapshot (session, checkpoints, uid, id_leíró nélkül)
}

export interface Karakter {
  uid: string;
  id_leíró: string;
  schema_version: number;
  név: string;
  becenév: string;
  jk: boolean;
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
  előtörténet: Előtörténet;
  jegyzetek: string;
  napló: NaploBejegyzes[];
  checkpoints: Checkpoint[];
  session: Session;
}

/**
 * Tárolt/mentett karakter: a `Karakter` + az undo stack, ahogy a localStorage-ban
 * és a mentett fájlokban szerepel. Az `_undo` NEM része a séma-validációnak.
 */
export type StoredKarakter = Karakter & { _undo?: unknown };

// ============================================================
// Default előtörténet (betöltéskor hiányzó előtörténet pótlása)
// ============================================================

export const DEFAULT_ELOTORTENET: Előtörténet = {
  származás_helye: '',
  szociális_érzék: '',
  külső: '',
  előtörténet: '',
};

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
  ké_dobások: [],
  té_dobások: [],
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
  SP_override?: { fortély: string; SP: number } | null;
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
