# Szilánk RPG — Kódtérkép

## Repo gyökér (`/mnt/c/repo/szilank.code/`)

```
md/                          Éles szabályrendszer (markdown, ToC: szabalyrendszer.md)
data/
  docs/                      Spec fájlok (ez a fájl is itt van)
  sources/                   YAML forrásadatok (→ generate_tables.py → tables/)
  schemas/                   YAML sémák (karakter, fortely, kepzettseg, fegyver, stb.)
  tables/                    Generált JSON (runtime adat, NE kézzel szerkeszd)
  karakter/                  Template-ek (empty_karakter.json, test_karakter.json)
  rules.json                 Reactive engine: 54 deklaratív szabály
  generate_tables.py         YAML→JSON generáló (Vite buildStart + prebuild futtatja)
web/karakter/                React app gyökere
code/                        Python scriptek (process_fegyverek.py + lib/)
```

## Web App (`web/karakter/src/`)

### Engine (`engine/`)
| Fájl | Felelősség |
|------|-----------|
| `reactive.ts` | Rule engine: evaluate, buildContext, buildArrayContext |
| `types.ts` | Karakter v2, Session, Fortely interface-ek |
| `data-types.ts` | GameData, FortelySummary, TaktikaEntry, HarciHelyzetEntry stb. |
| `data-loader.ts` | fetchJson runtime adatbetöltés |
| `fortely-mods.ts` | calcFortelyMods — feltételes fortély módosítók |
| `alapeset.ts` | Fortély 0.fok (Alapeset) kiértékelés |
| `ketkezes.ts` | Kétkezes harc összesítő kalkuláció |
| `feltetelek.ts` | buildAktívFeltételek helper |
| `feltetel-eval.ts` | FeltételEvaluator factory (context-alapú feltétel kiértékelés) |
| `url-share.ts` | Karakter URL export/import (deflate+base64url) |
| `file-ops.ts` | Save/Load/Duplicate |
| `validate.ts` | Karakter validáció |
| `utils.ts` | lookupFegyver, evaluateFeltétel, describeKepChange |

### Hooks (`hooks/`)
| Hook | Felelősség |
|------|-----------|
| `useKarakterState` | localStorage multi-slot, karakter load/save, undo |
| `useKarakterActions` | mentés, betöltés, teszt, import, share |
| `useUndoWrappedSetters` | Undo-aware setter wrapperek |
| `useOverlays` | Overlay state kezelés (Escape, toast, gombok) |
| `useAutoSave` | localStorage auto-mentés |
| `useGameDataLoader` | GameData fetch + karakter init |
| `useSwipe` | Swipe gesture |
| `useUrlImport` | URL hash import (mount-kor) |
| `useHoldRepeat` | Hold-to-repeat gomb gyorsulás |
| `useEscapeClose` | Escape billentyű popup bezárás |
| `usePopupState` | Generikus popup/overlay state kezelő |

### Komponensek (`components/`)

```
App.tsx                    Shell: tab navigáció, mód toggle, KP számítás
Header.tsx                 Fejléc (cím, menü, mód toggle)
TabBar.tsx                 Alsó tab bar (tükrözött, ikon-only)
TabContent.tsx             Screen slider wrapper
KpBar.tsx                  KP sáv (szerkesztő módban)
PopupOverlay.tsx           Központi kis popup shell (portál + ESC + háttér katt)
SpecPicker.tsx             Többszörös fortély/spec picker (lista/csoportos/freetext)
AppOverlays.tsx            Globális overlay-ek összefogó
ScreenErrorBoundary.tsx    Per-tab error boundary

aktiv/                     Aktív fül (taktika, helyzet, manőver, státusz, fegyverválasztás)
  AktivScreen.tsx          Fő layout
  AktivTaktikak.tsx        Taktika picker + chip-ek
  AktivHelyzetek.tsx       Harci helyzet picker (3 csoport)
  AktivManover.tsx         Manőver picker
  AktivStatuszok.tsx       Státusz picker
  AktivFegyverSection.tsx  Fegyver/fogás/páncél toggle szekció
  AktivHatasPool.tsx       Hatás pool box
  HatasPoolCalc.ts         Pool kalkuláció logika (4 pure fn + orchestrator)
  AktivHelpers.ts          Barrel re-export (taktika + helyzet helpers)
  taktika-helpers.ts       Taktika validáció, kombó, getTaktikaMods, getExtraFokok, formatFokMods
  helyzet-helpers.ts       Helyzet elérhetőség, min penge, infó szöveg

harc/                      Harc fül (harcértékek, ÉP, fegyvertábla)
  HarcScreen.tsx           Fő screen
  useHarcComputed.ts       Context build + reactive evaluate + feltétel dispatch
  fegyver-calc.ts          Per-fegyver TÉ/VÉ/SP/harckeret (optimalizált: 5 rule/fegyver)
  taktika-calc.ts          Taktika módosítók
  pancel-calc.ts           Páncél lookup + fogás VÉ
  shared.ts                Közös utils: findMfFok, getMfBónusz, resolveNagyobbKisebb, buildPajzsFegyverNév
  ep-logic.ts              ÉP sebesülés/gyógyulás pure logika
  harc-reszletek-calc.ts   Részletes értékek bontás
  EpTable.tsx              ÉP sebesülés tábla (S1-S4)
  EpDialogs.tsx            Seb/Gyógy dialógusok (explicit click handler)
  HarcFegyverTable.tsx     Fegyver harcértékek tábla
  HarcHeader.tsx           KÉ, SFÉ, VÉ csökk, MP boxok

tavharc/                   Távharc fül (CÉ/VÉ kalkulátor)
  TavharcScreen.tsx        Fő screen (szerkesztő + game mód)
  helpers.ts               CÉ/harckeret/MF számítás

tulajdonsagok/             Tulajdonságok + Képzettségek fül
  TulajdonsagokScreen.tsx  Fő screen (név, faj, kor, tulajdonságok, képzettségek)
  KepzettsegCsoport.tsx    Képzettség csoport (csukható, game/edit mód)

fortelyok/                 Fortélyok fül
  FortelyokScreen.tsx      Fő screen (csoportok, felvétel, fok kezelés)
  FortelyFelvetel.tsx      Felvétel wizard (többszörös, kiérdemelt)
  FortelyRow.tsx           Fortély sor (pöttyök, követelmény jelzés)

harcertekek/               Harcértékek fül (HM, fegyver, páncél, pajzs)
  HarcertekekScreen.tsx    Fő screen
  HarcertekekFegyverekSection.tsx  Fegyver kártyák
  HarcertekekPancelSection.tsx     Páncél mezők

misztikus/                 Misztikus fül (Aura, Tradíció, Arkánumok)
  MisztikusScreen.tsx      Fő screen

hatterek/                  Hátterek fül (szövegfelhő)
  HatterekScreen.tsx       Fő screen (leíró + karma)

overlays/                  Globális overlay-ek (menü, mentés, slot, undo, stb.)
  AppOverlays.tsx-ben összefogva
```

## Data Sources (`data/sources/`)

| Fájl | Tartalom | Generált JSON |
|------|----------|--------------|
| `konstansok.yaml` | Központi konstansok (harcértékek, arányok, limitek) | `konstansok.json` |
| `fortelyok/{harci,tavharc,altalanos,erzekek,szabad,kiemelt,misztikus}/*.yaml` | Fortély definíciók (177 db) | `fortelyok.json` |
| `kepzettsegek/{primer,szekunder}/*.yaml` | Képzettség definíciók (81 db) | `kepzettsegek.json` |
| `fajok/*.yaml` | Faj hátterek (27 db) | `fajok.json`, `faj_tulajdonsag_keretek.json` |
| `taktikak.yaml` | Harci taktikák (14 db) | `taktikak.json` |
| `harci_helyzetek.yaml` | Harci helyzetek (32 db) | `harci_helyzetek.json` |
| `manoverek.yaml` | Manőverek (34 db) | `manoverek.json` |
| `statuszok.yaml` | Státuszok (19 db) | `statuszok.json` |
| `hatasok.yaml` | Hatás mechanikák | `hatasok.json` |
| `hatas_operatorok.yaml` | Hatás operátorok (8 db) | `hatas_operatorok.json` |
| `esemenyek.yaml` | Célpontok/események (23 db) | `esemenyek.json` |
| `hatterek.yaml` | Leíró + Karma hátterek | `hatterek.json` |

## Spec dokumentáció (`data/docs/`)

| Fájl | Tartalom | Mikor olvasd |
|------|----------|-------------|
| `AGENTS.md` | AI irányelvek, build, konvenciók | Mindig (rövid) |
| `MAP.md` | Kódtérkép (ez a fájl) | Navigációhoz |
| `DEVSTATE.md` | Backlog, TODO, állapot | Státusz áttekintéshez |
| `engine_spec.md` | Kalkulációs formulák (§1-§41) | Engine logika módosításkor |
| `gui_spec.md` | UI viselkedés, screen-ek, stílusok | UI módosításkor |

## Engine Spec szekciók (gyorshivatkozás)

| § | Téma | Kulcs fájlok |
|---|------|-------------|
| 1-2 | KP, Tulajdonság pontok | `rules.json`, `App.tsx` |
| 3 | ÉP | `rules.json` |
| 4 | KÉ | `rules.json`, `useHarcComputed.ts` |
| 5-6 | TÉ, VÉ | `fegyver-calc.ts`, `rules.json` |
| 7 | CÉ | `tavharc/helpers.ts` |
| 8 | SP | `fegyver-calc.ts` |
| 9 | Harckeret/támadások | `fegyver-calc.ts`, `rules.json` |
| 10-11 | Páncél SFÉ/MGT | `pancel-calc.ts`, `rules.json` |
| 12 | Merevvért TÉ büntetés | `rules.json` |
| 13 | Pajzs | `pancel-calc.ts` |
| 14 | Manőver Pont | `rules.json` |
| 15 | Felszerelés MGT | `rules.json` |
| 16 | Fortély módosítók | `fortely-mods.ts`, `alapeset.ts` |
| 17 | Távharc | `tavharc/helpers.ts` |
| 18 | HM/CM limitek | `rules.json` |
| 19 | Képzettség limitek | `rules.json` |
| 20 | Faj hátterek | `fajok/*.yaml` |
| 21 | Taktikák, Helyzetek, Manőverek | `aktiv/`, `taktika-calc.ts` |
| 22 | Státuszok, Hatások | `statuszok.yaml`, `AktivStatuszok.tsx` |
| 24 | Kalkulált feltételek | `useHarcComputed.ts` |
| 26 | Kétkezes harc | `ketkezes.ts` |
| 27 | Fegyverfogás | `AktivFegyverfogas.tsx`, `pancel-calc.ts` |
| 29 | Undo | `useKarakterState.ts` |
| 30-31 | Local Storage, Multi-karakter | `useKarakterState.ts`, `useAutoSave.ts` |
| 34 | Aura | `MisztikusScreen.tsx` |
| 38 | Lovas harc | `harci_helyzetek.yaml`, `taktikak.yaml` |
| 40 | URL Export | `url-share.ts` |
| 41 | Reactive Engine | `reactive.ts`, `rules.json` |
