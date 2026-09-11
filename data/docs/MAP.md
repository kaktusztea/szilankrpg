# Szilánk RPG — Kódtérkép

## Repo gyökér (`/repo/github/szilank.code/`)

```
md/                          Éles szabályrendszer (markdown, ToC: szabalyrendszer.md)
data/
  docs/                      Spec fájlok (ez a fájl is itt van)
  sources/                   YAML forrásadatok (→ generate_tables.py → tables/)
  schemas/                   YAML sémák (karakter, fortely, kepzettseg, fegyver, stb.)
  tables/                    Generált JSON (runtime adat, NE kézzel szerkeszd)
  karakter/                  Template-ek (empty_karakter.json, test_karakter.json)
  rules.json                 Reactive engine: 53 deklaratív szabály
  generate_tables.py         YAML→JSON belépési pont (Vite buildStart + prebuild futtatja)
  gen/                       Generátor modulok: common, cache, schema, konstansok, kepzettsegek,
                             fortelyok, fajok, aktiv_ful, validators
  patterns/                  md→json kinyerés konfig (kézzel szerkesztett, code/process_fegyverek.py olvassa)
web/karakter/                React app gyökere
web/karakter/refactorlog/    Refaktor naplók (ÉÉÉÉ-HH-NN.md): elvégzett műveletek, okok, csapdák
code/                        Python scriptek (process_fegyverek.py + lib/)
  balance/                   Balansz / tesztharc tervezői eszközök (NEM pipeline):
    fegyvergenerator_balansz.py       Fegyvergenerátor modell + balansz teszt
    fegyvergenerator_fegyverlista.py  A generátorból md fegyvertábla emittálás (importálja a balanszt)
    harcszimulacio_selftest.py        harcszimulacio.spec.md §15 önteszt validálása (a data layerből olvas)
    elony_hatrany_eloszlasok.py       Előny/Hátrány kockaeloszlás analízis (matplotlib)
    sfe_hangolas.py                   Páncél SFÉ hangolási szimulátor (spec §3-§6 motor + MGT-ellensúly, jelleg-bónusz, harci helyzetek)
```

## Web App (`web/karakter/src/`)

### Engine (`engine/`)
| Fájl | Felelősség |
|------|-----------|
| `reactive.ts` | Rule engine: evaluate, buildContext, buildArrayContext |
| `reactive-parse.ts` | Formula parser: evalFormula, aggregate resolverek (sum, lookup, stb.) |
| `types.ts` | Karakter v2, Session, Fortely interface-ek |
| `data-types.ts` | GameData, FortelySummary, TaktikaEntry, HarciHelyzetEntry stb. |
| `data-loader.ts` | fetchJson runtime adatbetöltés |
| `fortely-mods.ts` | calcFortelyMods — feltételes fortély módosítók |
| `mf-utils.ts` | `findMfFokByName` (egyetlen MF egyeztető) + `findMfFok` (fegyvertáblából) + `getMfBónusz` |
| `alapeset.ts` | Fortély 0.fok (Alapeset) kiértékelés |
| `ketkezes.ts` | Kétkezes harc összesítő kalkuláció |
| `feltetelek.ts` | buildAktívFeltételek helper |
| `feltetel-eval.ts` | FeltételEvaluator factory (context-alapú feltétel kiértékelés) |
| `url-share.ts` | Karakter URL export/import (deflate+base64url) + `extractHashFromText` |
| `version-check.ts` | Elavult HTML felismerés → egyszeri cache-kerülő újratöltés (§30b) |
| `checkpoint-utils.ts` | Karakter verziók (checkpoint): snapshot, create, restore (truncate/append), delete — §31b |
| `dice.ts` | Kockadobás: rollDie(sides), rollK20/K10, `rollElőnyHátrányDie(szint, sides)` + k6/k10/k20 wrapperek, `előnyHátrányLabel`, `clampEHSzint` (E/H szint [-2,+2]) |
| `file-ops.ts` | Save/Load/Duplicate |
| `validate.ts` | Karakter validáció |
| `statusz-proba.ts` | Státusz → Képzettségpróba Előny/Hátrány kalkuláció |
| `utils.ts` | lookupFegyver, evaluateFeltétel, describeKepChange |

### Hooks (`hooks/`)
| Hook | Felelősség |
|------|-----------|
| `useKarakterState` | localStorage multi-slot, karakter load/save |
| `useUndo` | Undo stack kezelés (pushUndo, undoTo) |
| `useKarakterActions` | mentés, betöltés, teszt, import, share + `activateKarakter` (karakter aktívvá tétel) |
| `useUndoWrappedSetters` | Undo-aware setter wrapperek |
| `useOverlays` | Overlay state kezelés (Escape, toast, gombok) |
| `useAutoSave` | localStorage auto-mentés (kvótahiba számláló visszaadás) |
| `useGameDataLoader` | GameData fetch + karakter init |
| `useSwipe` | Swipe gesture |
| `useUrlImport` | URL hash import (mount-kor) |
| `useOverlayHandlers` | AppOverlays akció-logika (új/betöltés/import/QR/teszt karakter) |
| `useHoldRepeat` | Hold-to-repeat gomb gyorsulás |
| `useEscapeClose` | Escape billentyű popup bezárás |
| `usePopupState` | Generikus popup/overlay state kezelő |

### Slot (karaktertár) modulok (`hooks/`)
| Fájl | Felelősség |
|------|-----------|
| `slot-utils.ts` | Slot metaadat I/O: readSlots, writeSlots, `upsertSlotEntry`, `isUidTaken`, `isSlotFull`, `loadSlotKarakter` |
| `njk-slots.ts` | NJK szabályok: `njkCount`, `njkLimitBlocked` (tárolási limit egyetlen döntési helye), `njkSlots` (switcher sáv adatai) |
| `backup-restore.ts` | Backup visszaállítás (össz- + NJK limit betartatással) |

### Komponensek (`components/`)

```
App.tsx                    Shell: tab navigáció, mód toggle, KP számítás
Header.tsx                 Fejléc (cím, menü, mód toggle)
NjkSwitcher.tsx            NJK switcher fix sáv (KM eszköz, Header alatt — csak NJK karakternél)
TabBar.tsx                 Alsó tab bar (tükrözött, ikon-only)
TabContent.tsx             Screen slider wrapper
KpBar.tsx                  KP sáv (szerkesztő módban)
PopupOverlay.tsx           Központi kis popup shell (portál + ESC + háttér katt)
SpecPicker.tsx             Többszörös fortély/spec picker (lista/csoportos/freetext)
FortelyDetails.tsx         Közös fortély info panel (picker + game-mode accordion)
KepzettsegDetails.tsx      Közös képzettség info panel (picker + game-mode accordion)
AppOverlays.tsx            Globális overlay-ek összefogó
ScreenErrorBoundary.tsx    Per-tab error boundary

aktiv/                     Aktív fül (taktika, helyzet, manőver, státusz, fegyverválasztás)
  AktivScreen.tsx          Fő layout
  AktivTaktikak.tsx        Taktika picker + chip-ek
  AktivHelyzetek.tsx       Harci helyzet picker (3 csoport)
  AktivManover.tsx         Manőver picker
  ManoverDobasPopup.tsx    Manőver dobás popup (követelmény 0. lépés Normál/Erős, fázis lépegetés, Siker/Kudarc, helyzetfüggő módosítók, MP+TÉ popup)
  manover-dobas-calc.ts    Manőver dobás pure logika (követelmény kiértékelés, fázisok, TÉ-bontás, fázis-feliratok, eredmény-hatás) — a popup számítási magja
  AktivStatuszok.tsx       Státusz picker
  AktivFegyverSection.tsx  Fegyver/fogás/páncél toggle szekció
  AktivHatasPool.tsx       Hatás pool box
  aktiv-calc.ts            Aktív fül kalkuláció logika (4 pure fn + orchestrator)
  AktivHelpers.ts          Barrel re-export (taktika + helyzet helpers)
  taktika-helpers.ts       Taktika validáció, kombó, getTaktikaMods, getExtraFokok, formatFokMods
  helyzet-helpers.ts       Helyzet elérhetőség, min penge, infó szöveg
  NaploTab.tsx             Verziók + Napló accordionok kompozíciója (CheckpointSection + NaploSection)
  CheckpointSection.tsx    Karakter verziók accordion (lista, létrehozás, törlés, megtekintés)
  NaploSection.tsx         Napló accordion (bejegyzések, szerkesztő form, opcionális checkpoint)

harc/                      Harc fül (harcértékek, ÉP, fegyvertábla)
  HarcScreen.tsx           Fő screen
  useHarcComputed.ts       Context build + reactive evaluate + feltétel dispatch
  fegyver-calc.ts          Per-fegyver TÉ/VÉ/SP/harckeret (optimalizált: 5 rule/fegyver)
  taktika-calc.ts          Taktika módosítók
  pancel-calc.ts           Páncél lookup + fogás VÉ
  shared.ts                Közös utils: findMfFok, getMfBónusz, resolveNagyobbKisebb, buildPajzsFegyverNév
  ep-logic.ts              ÉP sebesülés/gyógyulás pure logika
  harc-reszletek-calc.ts   Részletes értékek bontás
  combat-roll-info.ts      Támadó/Sebzés dobás bónusz kalkuláció (pure fn)
  EpTable.tsx              ÉP sebesülés tábla (S1-S4)
  EpDialogs.tsx            Seb/Gyógy dialógusok (explicit click handler)
  HarcFegyverTable.tsx     Fegyver harcértékek tábla
  HarcHeader.tsx           KÉ, SFÉ, VÉ csökk, MP boxok
  TamadoDobasPopup.tsx     Támadó dobás popup (manuális/auto k20, bónuszok)
  SebzesPopup.tsx          Sebzésdobás popup (SP bontás, másodlagos sebzés, újradobás)
  PancelInfoPopup.tsx      SFÉ infó popup (páncél részletek)
  ElonyPicker.tsx          Előny/Hátrány kocka picker
  ManualDicePicker.tsx     Manuális kockadobás érték választó
  ManoverPicker.tsx        Manőver választó (mód + lista, 2 lépés)
  aktiv-fegyver-ctx.ts     Aktív fegyver kontextus feloldás (kétkezes > fogás > pajzs > jobb kéz)

tavharc/                   Távharc fül (CÉ/VÉ kalkulátor)
  TavharcScreen.tsx        Fő screen (szerkesztő + game mód)
  helpers.ts               CÉ/harckeret/MF számítás

tulajdonsagok/             Tulajdonságok + Képzettségek fül
  TulajdonsagokScreen.tsx  Fő screen (név, faj, kor, tulajdonságok, képzettségek)
  KepzettsegCsoport.tsx    Képzettség csoport (csukható, game/edit mód)
  KepzettsegPickerOverlay.tsx  Képzettség picker overlay popup (név + md link + ▾ accordion → KepzettsegDetails)
  TulajdonsagProbaPopup.tsx  Tulajdonságpróba dobás popup (Játék mód, k6)
  proba-common.ts          Próba közös logika (Előny/Hátrány szintek, lehetetlen/biztos siker, összetett próba típusok)
  kepzettseg-proba-calc.ts Képzettségpróba tiszta kalkuláció (célszámok, kiterjesztés EH, szituációs módosítók, enyhítés)
  KepzettsegProbaPickers.tsx Képzettségpróba alpickerei (kiterjesztés, helyzetfüggő módosítók, infó)
  kepzettseg-limit.ts      Képzettség max szint a rules.json-ból (§19)
  KepzettsegProbaPopup.tsx   Képzettségpróba dobás popup (Játék mód, k10)
  ElotortenetOverlay.tsx   Előtörténet overlay (becenév, név, kor, vallás, biográfiai mezők)
  KorPicker.tsx            Kor +/- picker overlay
  VallasPickerOverlay.tsx  Vallás választó overlay

fortelyok/                 Fortélyok fül
  FortelyokScreen.tsx      Fő screen (csoportok, felvétel, fok kezelés)
  FortelyFelvetel.tsx      Felvétel wizard (többszörös, kiérdemelt)
  FortelyPickerOverlay.tsx Fortély picker overlay popup (név + md link + ▾ accordion → FortelyDetails)
  NewFortelySelect.tsx     "+ Új fortély" gomb (picker overlay trigger)
  FortelyRow.tsx           Fortély sor (pöttyök, követelmény jelzés)

harcertekek/               Harcértékek fül (HM, fegyver, páncél, pajzs)
  HarcertekekScreen.tsx    Fő screen
  HarcertekekFegyverekSection.tsx  Fegyver kártyák
  HarcertekekPancelSection.tsx     Páncél mezők

misztikus/                 Misztikus fül (Aura, Tradíció, Arkánumok)
  MisztikusScreen.tsx      Fő screen
  AuraPanel.tsx            Aura értékek (Mágiaellenállás, Mágia akarata kattintható kártya)
  MisztikusPopups.tsx      Popup dispatcher (tradíció, szint, fok, felvétel, mágia akarata)
  useMisztikusPopups.ts    Popup state hook (tradíció/altípus picker állapotkezelés)
  popups/MagiaAkarataPopup.tsx  Mágia akarata 4-füles referencia popup
  popups/AltipusPickerPopup.tsx  Tradíció altípus/Pantheon picker popup
  popups/TradicioPickerPopup.tsx  Tradíció lista picker popup

hatterek/                  Hátterek fül (szövegfelhő)
  HatterekScreen.tsx       Fő screen (leíró + karma)

overlays/                  Globális overlay-ek (menü, mentés, slot, undo, stb.)
  AppOverlays.tsx-ben összefogva
  OverlayScreenOverlay.tsx Verziók/Napló/Jegyzetek összevont overlay (NaploTab + jegyzetek + próba)
  SzilankPickerOverlay.tsx Szilánk pont (0-3) + gyors-elérési hub (Szabályrendszer link, próba táblák)
  SlotListOverlay.tsx      Karakterek hub (slot lista → SlotList.tsx)
  SaveOptionsPopup.tsx     Mentés/Exportálás popup (link, fájl, share, QR)
  ImportOptionsPopup.tsx   Import popup (fájl, vágólap, QR képből)
  QrCodePopup.tsx          QR kód generálás + PNG mentés (uqr lib)
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
| `manoverek.yaml` | Manőverek (38 db) | `manoverek.json` |
| `statuszok.yaml` | Státuszok (19 db) | `statuszok.json` |
| `hatasok.yaml` | Hatás mechanikák | — (csak validáció, az app nem tölti be) |
| `hatas_operatorok.yaml` | Hatás operátorok (8 db) | `hatas_operatorok.json` |
| `esemenyek.yaml` | Célpontok/események (23 db) | `esemenyek.json` |
| `hatterek.yaml` | Leíró + Karma hátterek | `hatterek.json` |
| `szituacio_mapping.yaml` | Képzettség → Szituáció kapcsolatok | → `kepzettsegek.json` (`kapcsolódó_szituációk` mező) |

## Spec dokumentáció (`data/docs/`)

| Fájl | Tartalom | Mikor olvasd |
|------|----------|-------------|
| `AGENTS.md` | AI irányelvek, build, konvenciók | Mindig (rövid) |
| `MAP.md` | Kódtérkép (ez a fájl) | Navigációhoz |
| `DEVSTATE.md` | Backlog, TODO, állapot | Státusz áttekintéshez |
| `engine_spec.md` | Kalkulációs formulák (§1-§41) | Engine logika módosításkor |
| `gui_spec.md` | UI viselkedés, screen-ek, stílusok | UI módosításkor |
| `harcszimulacio.spec.md` | Önhordó harcrendszer spec tesztharc szimulációhoz (statblokk, körfeloldás, VÉ könyvelés, taktika/helyzet/státusz táblák, ambiguitás-regiszter, önteszt) | Szabály-hangolás, tesztharc, balance vizsgálat |

## Refaktor naplók (`web/karakter/refactorlog/`)

| Fájl | Tartalom | Mikor olvasd |
|------|----------|-------------|
| `ÉÉÉÉ-HH-NN.md` | Egy nagy refaktor: fázisok, döntések, csapdák, újrahasznosítható detektáló scriptek | Refaktor, halott kód keresés, data layer átalakítás ELŐTT |

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
| 29 | Undo | `useKarakterState.ts`, `useUndo.ts` |
| 30-31 | Local Storage, Multi-karakter | `useKarakterState.ts`, `useAutoSave.ts` |
| 31b | Karakter verziók (checkpoint) | `checkpoint-utils.ts`, `CheckpointSection.tsx` |
| 34 | Aura | `MisztikusScreen.tsx` |
| 38 | Lovas harc | `harci_helyzetek.yaml`, `taktikak.yaml` |
| 40 | URL Export | `url-share.ts` |
| 41 | Reactive Engine | `reactive.ts`, `reactive-parse.ts`, `rules.json` |
