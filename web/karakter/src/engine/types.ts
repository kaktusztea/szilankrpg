// ============================================================
// Karakter (mentett példány - megfelel data/schemas/karakter.yaml v2)
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
  /** Képzettség-id (kepzettsegek.json). */
  id: string;
  /** Többszörösnél a választott elem (harcmodor-elem / szabad szöveg), egyébként ''. Kulcs: engine/azonosito.ts képzKulcs. */
  elem: string;
  szint: number;
}

export interface Fortely {
  /** Fortély-id (fortelyok.json); egyedi fortélynál 'egyedi'. */
  id: string;
  /** Többszörösnél a választott elem; egyedi fortélynál a neve; egyébként ''. */
  elem: string;
  fok: number;
  kiérdemelt?: boolean;
  kiterjeszti?: string[];
}

export interface FegyverPeldany {
  alap: string;
  név: string;
  anyag: string;
  idea: number;
  /** A karakternél van-e (Felszerelés keret: számít). false → kikerül + Harc fülön nem választható. Default true. */
  felszerelésben: boolean;
}

export interface TavfegyverPeldany {
  alap: string;
  idea: number;
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

export interface FelszerelésTárgy {
  név: string;
  méret: 'kicsi' | 'közepes' | 'nagy';
  /** Hol van a tárgy: default (hiányzó) = nálad; 'nincs' = nincs nálad; 'külső' = külső tárolóban
   * (lovon/szekéren). A 'nincs' és 'külső' egyaránt kiveszi a terhelésből (0 pont, kiszürkítve). */
  hely?: 'nincs' | 'külső';
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
  té_dobások: TéDobás[];
}

/** Egy Támadó dobás naplóbejegyzés: TÉ eredmény + opcionális Sebzés (SP) és/vagy VÉ csökkentés eredmény. */
export interface TéDobás {
  té: number;
  sp?: number;
  veCsökkentés?: number;
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
  hátterek: { faj: string; leíró: string[]; karma: string[] };
  fegyverek: FegyverPeldany[];
  távfegyverek: TavfegyverPeldany[];
  páncél: PancelPeldany;
  pajzs: PajzsPeldany;
  felszerelés: { tárgyak: FelszerelésTárgy[]; kizárt_auto: ('pajzs' | 'páncél')[]; külső: string[]; úton?: boolean };
  előtörténet: Előtörténet;
  jegyzetek: string;
  napló: NaploBejegyzes[];
  checkpoints: Checkpoint[];
  session: Session;
  /**
   * Kiterjesztő fortélyok manuális teljesül/nem-teljesül felülbírálása képzettségenként.
   * Kulcs: `"${képzettségNév}|${fortélyNév}"`. A kulcs JELENLÉTE = az automatikus
   * kiértékelés (legalább 1× felvéve?) NEGÁLVA. Csak többszörösen felvehető fortélyokra
   * (a KM dönti el, a *kapcsolódó* spec_elem van-e felvéve - gépileg nem tudható). Opcionális.
   */
  kiterjesztés_negálva?: string[];
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
// Fegyver (alaptípus, fegyverek_v2.json - Fegyvergenerátor v2)
// ============================================================

export interface FegyverMod {
  aktor: string;
  jelleg: string;
  sebzéstípus: 'elsődleges' | 'másodlagos';
  TÉ: number;
  VÉ: number;
  SP: number;
  Átütés: number;
  Sebesség: number | null;
  Forgatás: 'egykezes' | 'másfélkezes' | 'kétkezes';
  Erőlimit: number;
  FP: boolean;
}

export interface FegyverExtra {
  id: string;
  név: string;
}

export interface FegyverAlap {
  név: string;
  kategória: string;
  megjegyzés: string;
  fegyverhossz: number;
  akadály: number;
  súly: string;                 // könnyű/átlagos/nehéz/súlyos - Felszerelés-pont (súly-ág)
  övön_hordható: boolean;
  ár: number | null;
  ár_alap: number | null;       // a fix felépítés alapára (osztály × fejdarab × hossz); a chip ebből × anyag × idea
  alapanyag: string;            // gyári anyag (fém-rész); felvételi anyag-default + fém-e levezetés (fa/kő → nem hangolható)
  idea_default: number;
  erő_követelmény: number;
  extrák: FegyverExtra[];
  módok: FegyverMod[];
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
// Távfegyver (alaptípus, tavfegyverek_v2.json)
// ============================================================

/** SP sentinel: a fegyver nem sebez (nincs / speciális sebzés). L. TavfegyverAlap.SP. */
export const SP_NINCS = -99;

export interface TavfegyverAlap {
  név: string;
  kategória: string;
  harcmodor: string;
  CÉ: number;
  Osztó: number;
  SP: number;                 // -99 sentinel = nincs / spec sebzés
  Sebesség: number;           // -1 = nincs sebesség (nyílpuskák)
  sebzésjelleg: 'S' | 'V' | 'Z' | 'spec';
  Átütés: number;
  forgatás: string;
  erőbónusz_limit: number;
  hatótáv_bázis: number;      // méter, fix rész
  hatótáv_erő_szorzó: number; // tényleges hatótáv = bázis + Erő × szorzó
  idea_default: number;
  extrák: string[];
  megjegyzés: string;
}

/** Egy fegyver-mód (Aktor) kiszámított harcértékei. */
export interface FegyverResultMód {
  aktor: string;
  jelleg: string;
  sebzéstípus: 'elsődleges' | 'másodlagos';
  Forgatás: string;
  TÉ: number;
  VÉ: number;
  SP: number;
  Átütés: number;
  támadások: number;
  harckeret: number;
  sebesség: number;
  alap_TÉ: number;
  alap_VÉ: number;
  /** A Mesterfegyver-bónusz TÉ/VÉ része - a fegyver-járulék post-szorzóhoz (Beszorítva). */
  mf_TÉ: number;
  mf_VÉ: number;
  /** Az SP-ben lévő Erőbónusz (min(Erő, mód Erőlimit) × (1 + fortély-arány), FLOOR) - a Sebzés popup bontásához. */
  sp_erőbónusz: number;
  /** Az SP-ben lévő Mesterfegyver-bónusz (konstansok.mesterfegyver_bónuszok) - a Sebzés popup bontásához. */
  sp_mf: number;
  // Harckeret részletezés
  hk_harcmodor: number;
  hk_gyorsaság: number;
  hk_mgt: number;
  hk_fortély: number;
}

// ============================================================
// Undo (a mentett fájlba és a slotba is bekerül)
// ============================================================

/**
 * Undo patch: a minimal inverse operation.
 * - For scalar fields: { field, prev } - restore field to prev value
 * - For array fields: { field, op, index?, item?, prev? }
 */
export type UndoPatch =
  | { field: string; prev: unknown; ckey?: string }                          // scalar overwrite (ckey: optional coalesce discriminator)
  | { field: string; op: 'add'; item: unknown }                               // was added → undo = remove
  | { field: string; op: 'remove'; index: number; item: unknown }             // was removed → undo = re-insert
  | { field: string; op: 'update'; index: number; prev: unknown }             // was updated → undo = restore prev

export interface UndoEntry {
  timestamp: number;
  leírás: string;
  patches: UndoPatch[];
}
