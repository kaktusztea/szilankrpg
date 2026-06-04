import type { Karakter } from './engine/types';

/** 8. szintű teszt karakter az ODS karakteralkotó referencia alapján */
export const testKarakter8: Karakter = {
  schema_version: 1,
  név: "Dorek a Toroni",
  tsz: 8,
  leírás: "Toroni zsoldos lovag",
  kor: 32,
  vallás: "",
  tulajdonságok: {
    erő: 3,
    edzettség: 3,
    ügyesség: 3,
    gyorsaság: 3,
    intelligencia: 1,
    emlékezet: 0,
    önuralom: 2,
    érzékenység: 0,
  },
  HM_TÉ: 15,
  HM_VÉ: 17,
  CM: 0,
  képzettségek: [
    // Primer harci
    { név: "Közelharc", szint: 6, spec: "" },
    { név: "Kardvívás", szint: 8, spec: "" },
    { név: "Rombolás", szint: 4, spec: "" },
    // Primer általános
    { név: "Akrobatika", szint: 3, spec: "" },
    { név: "Fájdalomtűrés", szint: 5, spec: "" },
    { név: "Észlelés", szint: 6, spec: "" },
    // Szekunder
    { név: "Nyelvtanulás", szint: 6, spec: "" },
    { név: "Lovaglás", szint: 4, spec: "" },
    { név: "Mászás", szint: 5, spec: "" },
    { név: "Kvantikum", szint: 5, spec: "" },
    { név: "Előadóművészet", szint: 5, spec: "" },
    { név: "Etikett", szint: 5, spec: "" },
    { név: "Értékbecslés", szint: 3, spec: "" },
    { név: "Művészetismeret", szint: 5, spec: "" },
    { név: "Városi jártasság", szint: 6, spec: "" },
    { név: "Természetjárás", szint: 5, spec: "" },
  ],
  fortélyok_kiemelt: {
    kulturkörök: [{ név: "dwoon" }, { név: "erv" }, { név: "pyar" }, { név: "dzsad" }],
    helyismeret: [{ helynév: "Erion" }, { helynév: "Pyarron" }, { helynév: "Haonwell" }, { helynév: "Shulur" }],
    nyelvismeret: [
      { nyelv: "pyarroni / közös nyelv", fok: 2 },
      { nyelv: "erv", fok: 2 },
      { nyelv: "dwoon", fok: 2 },
      { nyelv: "dzsad/dzsenn", fok: 2 },
      { nyelv: "aszisz", fok: 1 },
      { nyelv: "köztoroni", fok: 1 },
      { nyelv: "niarei", fok: 1 },
    ],
  },
  fortélyok_speciális: {
    analfabéta: false,
    apró_méretű_lény: false,
    tartós_sérülés_fok: 0,
    vakság: false,
    süketség: false,
  },
  fortélyok_szabad: [
    { név: "Gazdálkodás" },
    { név: "Kézműves: Lakatos" },
    { név: "Kihallgatás" },
    { név: "Színjátszás" },
    { név: "Éneklés" },
    { név: "Bűvészet" },
    { név: "Alkudozás" },
    { név: "Térképészet" },
  ],
  fortélyok: [
    // Harci
    { név: "Merevvértviselet", fok: 3, spec: "" },
    { név: "Harcos elme", fok: 2, spec: "" },
    { név: "Gyors kezdeményezés", fok: 2, spec: "" },
    { név: "Pajzshasználat", fok: 2, spec: "" },
    { név: "Harckeret növelés", fok: 1, spec: "" },
    { név: "Elpusztíthatatlan", fok: 2, spec: "" },
    { név: "Kaszabolás", fok: 2, spec: "" },
    { név: "Támadás erőből", fok: 1, spec: "" },
    { név: "Fárasztás", fok: 1, spec: "" },
    { név: "Mesterfegyver", fok: 3, spec: "kard, lovag" },
    // Általános
    { név: "Építészet", fok: 1, spec: "" },
    { név: "Futás", fok: 1, spec: "" },
    { név: "Szájról olvasás", fok: 1, spec: "" },
    { név: "Éber alvó", fok: 1, spec: "" },
    { név: "Kocsihajtás", fok: 1, spec: "" },
    { név: "Keresés/rejtés", fok: 1, spec: "" },
  ],
  hátterek: {
    faj: "Ember (Északi)",
    leíró: [],
    karma: [],
  },
  származtatott: { ÉP: 0, szilánk: 1 },
  fegyverek: [
    { alap: "kard, lovag", név: "", anyag: "acél", idea: 0, mesterfegyver_fok: 3, módosítók: '' },
    { alap: "tőr", név: "", anyag: "acél", idea: 0, mesterfegyver_fok: 0, módosítók: '' },
  ],
  páncél: {
    alap: "bőr",
    név: "",
    fémalapanyag: "",
    idea: 0,
    kidolgozottság: "átlagos",
    sisak: false,
    végtagvédettség: 0,
    méret_illeszkedés: "passzoló",
    rongálódás: 0,
  },
  felszerelés: { nagy_tárgyak: [] },
};

/**
 * Elvárt értékek az ODS referencia alapján — engine validáláshoz
 */
export const expected8 = {
  ÉP: 40,
  KÉ: 17,
  összes_kp: 408,           // 8 × (50+1)
  összes_szekunder_kp: 160, // 8 × (20+0)
  összesen_kapott_kp: 568,  // 408 + 160
  maradt_kp: 2,
  tulajdonság_pont_keret: 68, // 64 + floor(8/2)
  tulajdonság_pont_maradék: 0,
  max_HM: 34,              // fortély fokok: 25 + harcmodor szintek: 6+8+4+0+0 = 18 + alakzatharc: 0... ellenőrizni!
  max_CM: 16,              // 8 × 2
  manőver_alap: 4,         // képernyőkép: Manőver Alap = 4
  max_manőver_pont: 5,
  // Kardvívás fegyver: Kard, lovag
  kard_lovag: {
    TÉ: 47,  // Harc lap: Teljes harcértékek
    VÉ: 77,
    SP: "11 V/S +1Á",
    támadások: 2,
  },
  páncél: {
    sfé_fizikai: 7,
    sfé_energia: 10,
    MGT: 2,
    lefedettség: 50,
  },
};
