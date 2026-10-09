# Szilánk RPG - Kódtérkép

## Repo gyökér (`/repo/github/szilank.code/`)

```
md/                          Éles szabályrendszer (markdown, ToC: szabalyrendszer.md)
data/
  docs/                      Spec fájlok (ez a fájl is itt van)
  sources/                   YAML forrásadatok (→ generate_tables.py → tables/)
  schemas/                   YAML sémák (karakter, fortely, kepzettseg, fegyver, stb.)
  tables/                    Generált JSON (runtime adat, NE kézzel szerkeszd)
  karakter/                  Template-ek (empty_karakter.json, test_karakter2.json, test_karakter3.json)
  rules.json                 Reactive engine: 53 deklaratív szabály
  generate_tables.py         YAML→JSON belépési pont (Vite buildStart + prebuild futtatja)
  gen/                       Generátor modulok: common, cache, schema, konstansok, kepzettsegek,
                             fortelyok, fajok, aktiv_ful, validators, naming_lint (YAML naming build-gate)
web/karakter/                React app gyökere
web/karakter/refactorlog/    Refaktor naplók (ÉÉÉÉ-HH-NN.md): elvégzett műveletek, okok, csapdák
code/                        Python scriptek (generate.markdown.py + lib/JinjaHandler.py - md fejezet-generálás)
  balance/                   Balansz / tesztharc tervezői eszközök (NEM pipeline):
    fegyvergenerator_balansz.py       Fegyvergenerátor modell + balansz teszt (tempó/sebzés, statikus)
    fegyvergenerator_fegyverlista.py  A generátorból md fegyvertábla emittálás (importálja a balanszt)
    fegyvergenerator_data_adapter.py  Taktikák/Harci helyzetek/Manőverek/Státuszok generikus hatás-kiértékelője
                                       (data/tables/*.json direkt betöltés - nincs kézzel duplikált adat)
    fegyvergenerator_harcszimulator.py  Kör-alapú harci motor (statblokk, VÉ könyvelés, sebzés - spec §2-§9)
                                       önteszt: `python3 code/balance/fegyvergenerator_harcszimulator.py`
    fegyvergenerator_taktikai_ai.py   Kör-elejei döntési réteg a motor fölött: minden harcos minden körben
                                       újraválaszt taktikát/manővert (ÖSSZES közelharci taktika + a helyzetre
                                       leképezhető manőverek - l. modul-fej a korlátokért). `kuzdelem_ai()`.
                                       önteszt: `python3 code/balance/fegyvergenerator_taktikai_ai.py`
    fegyvergenerator_balansz_elemzes.py  Nagyszabású, MINDEN fegyverre kiterjedő mátrix-elemzés (páncélosztály
                                       × AI be/ki × tükör-harc + 1:3 túlerő). Konklúziót ad: mely fegyverek
                                       (túl) erősek/gyengék minden körülményben, kategória-átlagok,
                                       páncélfüggő szélsőségek. Futtatás: `python3
                                       code/balance/fegyvergenerator_balansz_elemzes.py [--n=250] [--gyors]`
                                       - a kimenet NEM kerül a repóba (work file), a konklúziót olvasható
                                       riportba kell átvezetni (l. wiki STUDY.* konvenció).
    fegyverek_regi_uj_osszehasonlitas.py  A kivezetett v1 (`archive/data_fegyverek_v1/fegyverek.json`) és a v2 fegyvergenerátor
                                       (`data/tables/fegyverek_v2.json`) harcértékeinek
                                       1:1 delta-összehasonlítása, kézi alias-táblával a névformátum-eltérésekhez.
                                       Kimenet: konzol + markdown riport (wiki STUDY.* fájlba, NEM az éles repóba).
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
| `fortely-mods.ts` | calcFortelyMods - feltételes fortély módosítók |
| `mf-utils.ts` | `findMfFokByName` (egyetlen MF egyeztető) + `findMfFok` (fegyvertáblából) + `getMfBónusz` |
| `alapeset.ts` | Fortély 0.fok (Alapeset) kiértékelés |
| `ketkezes.ts` | Kétkezes harc összesítő kalkuláció |
| `feltetelek.ts` | buildAktívFeltételek helper |
| `feltetel-eval.ts` | FeltételEvaluator factory (context-alapú feltétel kiértékelés) |
| `url-share.ts` | Karakter URL export/import (deflate+base64url) + `extractHashFromText` |
| `version-check.ts` | Elavult HTML felismerés → egyszeri cache-kerülő újratöltés (§30b) |
| `checkpoint-utils.ts` | Karakter verziók (checkpoint): snapshot, create, restore (truncate/append), delete - §31b |
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
| `useLongPress` | Long-press vs short-tap megkülönböztető (NJK chip betű-picker) |
| `useTaktikaInvalidation` | Aktív taktikák érvénytelenítése fegyver/session változáskor (useEffect) |
| `useGameModeTabSync` | Mód-váltáskor az aktív tab megtartása (editOnly tabok ki/be) |

### Slot (karaktertár) modulok (`hooks/`)
| Fájl | Felelősség |
|------|-----------|
| `slot-utils.ts` | Slot metaadat I/O: readSlots, writeSlots, `upsertSlotEntry`, `isUidTaken`, `isSlotFull`, `loadSlotKarakter` |
| `njk-slots.ts` | NJK szabályok: `njkCount`, `njkLimitBlocked` (tárolási limit egyetlen döntési helye), `njkSlots` (switcher sáv adatai), `életerőStat` (ÉP csík), `njkHarcértékStat` (KÉ/TÉ/VÉ gyors stat - a HarcScreen pure building blockjaiból) |
| `backup-restore.ts` | Backup visszaállítás (össz- + NJK limit betartatással) |
| `km-jelolesek.ts` | KM harci jelölés I/O: NJK chip betű + szín + jegyzet (localStorage `szilank_km_jelolesek`, `választSzínt` felvételkori színválasztás) |

### Komponensek (`components/`)

```
App.tsx                    Shell: tab navigáció, mód toggle, KP számítás
Header.tsx                 Fejléc (cím, menü, mód toggle)
NjkSwitcher.tsx            NJK switcher fix sáv (KM eszköz, Header alatt - csak NJK karakternél). Chipenként KM harci jelölés: long-press → betű-picker, betű-karika tap → jegyzet
KmJelolesPicker.tsx        KM harci jelölés betű-picker overlay (A–Z színes karika chipek)
KmJegyzetPopup.tsx         KM harci jegyzet popup (textarea egy NJK jelöléséhez)
TabBar.tsx                 Alsó tab bar (tükrözött, ikon-only)
TabContent.tsx             Screen slider wrapper
KpBar.tsx                  KP sáv (szerkesztő módban)
PopupOverlay.tsx           Központi kis popup shell (portál + ESC + háttér katt)
SpecPicker.tsx             Többszörös fortély/spec picker (lista/csoportos/freetext)
FortelyDetails.tsx         Közös fortély info panel (picker + game-mode accordion)
KepzettsegDetails.tsx      Közös képzettség info panel (picker + game-mode accordion)
AppOverlays.tsx            Globális overlay-ek összefogó
ScreenErrorBoundary.tsx    Per-tab error boundary
KpBar.tsx / KpInfoPopup.tsx  KP sáv + KP bontás infó popup
SlotList.tsx / SlotRow.tsx   Karaktertár lista + egy slot sor
CheckpointBanner.tsx       Aktív checkpoint (verzió-nézet) jelző sáv
DeleteConfirmPopup.tsx     Általános törlés-megerősítő popup
MdLink.tsx                 🔗 GitHub szabályrendszer link (REPO_BASE + md anchor)
kp-calc.ts                 KP bontás kalkuláció (calcKpDetails - reactive engine wrapper, §1)
karakter-setters.ts        Karakter mező-setter factory-k (undo-wrapped)
fegyver-groups.ts          Fegyver kategória-csoportosítás (dropdown rendezés)
formatters.tsx             Szöveg-formázók (fmtCode, md-inline → ReactNode)

aktiv/                     Aktív fül (taktika, helyzet, manőver, státusz, fegyverválasztás)
  AktivScreen.tsx          Fő layout
  AktivTaktikak.tsx        Taktika picker + chip-ek
  TaktikaPickerList.tsx    Taktika választó lista (pinned + többi)
  TaktikaFokPicker.tsx     Fokozatos taktika fok-választó
  AktivHelyzetek.tsx       Harci helyzet picker (3 csoport)
  ManoverDobasPopup.tsx    Manőver dobás popup (követelmény 0. lépés Normál/Erős, fázis lépegetés, Siker/Kudarc, helyzetfüggő módosítók, MP+TÉ popup)
  manover-dobas-calc.ts    Manőver dobás pure logika (követelmény kiértékelés, fázisok, TÉ-bontás, fázis-feliratok, eredmény-hatás) - a popup számítási magja. `szitFeltételTeljesül`/`szitModKezdőÁllapot`: a helyzetfüggő módosító sorok `feltétel` ("fegyver_extra:<id>"/"taktika:<id>"/…) auto-matchje → az illő sor alapból bekapcsolva (kézi override marad). A `manoverek.yaml` `extra_ref` pointer-sorai build-időben feloldódnak az extrák `manőver_ellenpróba` hatásából (érték+leírás+feltétel), l. `data/gen/aktiv_ful.py` - EGY igazságforrás (A/1, §42)
  AktivStatuszok.tsx       Státusz picker
  StatuszPickerOverlay.tsx Státusz választó overlay (kategóriák + fok)
  AktivHatasPool.tsx       Hatás pool box
  aktiv-calc.ts            Aktív fül kalkuláció logika (4 pure fn + orchestrator)
  AktivHelpers.ts          Barrel re-export (taktika + helyzet helpers)
  taktika-megkotes.ts      Taktika megkötés-kiértékelés (isTaktikaAllowed: session/fegyver/harcmodor/támadás/távfegyver + kombó)
  taktika-helpers.ts       Taktika módosító-formázás + fok-interpoláció (getTaktikaMods, getExtraFokok, formatFokMods, interpolateFokDef)
  helyzet-helpers.ts       Helyzet elérhetőség, min fegyverhossz, infó szöveg
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
  HarcReszletek.tsx        Részletes értékek box (aktív fegyver harcérték bontás megjelenítés)
  ve-csokkentes-calc.ts    Sikertelen támadás VÉ csökkentése (Fegyverviszony bázis + k20P; taktika override/flat; fortély flat) - §5.3/§13.1
  VeCsokkentesPopup.tsx    VÉ csökkentés popup (fegyverviszony választó + taktika/extra hatások, k20P)
  VeSzorzoInfoPopup.tsx    VÉ csökkentés szorzó/bázis infó popup
  combat-roll-info.ts      Támadó/Sebzés dobás bónusz kalkuláció (pure fn)
  HatasokInfo.tsx          Dobás-hatás badge feliratok (Előny/Hátrány/Enyhít formázás, pure fn)
  extrak-info-calc.ts      Fegyver-extrák (fegyver_extrak.json) futásidejű állapot-kiértékelése (aktív/inaktív/KM) az "Extrák" gombhoz (§42 info-szelet, pure fn). Aktív-jelzés: harci_helyzet/taktika/fortély/státusz/aktor/forgatás/cél_páncél feltételek + aktív manőverhez kapcsolt hatás-al-feltétel ("manőver:<id>")
  extrak-effekt.ts         Egységes effekt-precedencia (§42.3: additív→szorzó→override→max_limit, FLOOR) pure motor + aktívHatásokCélra (csak teljesült feltételű hatások) + hiányzóInfósExtrák (KM-warning, hiányos korreláció). Bekötve: Sebzés popup SP-delta, VÉ-csökkentés warning
  ExtrakInfo.tsx           "Extrák" gomb (💡, pulzál ha van aktív) + popup: fegyver-extrák listája státusz-jelzéssel (Támadó + Sebzés popupban)
  EpTable.tsx              ÉP sebesülés tábla (S1-S4)
  EpDialogs.tsx            Seb/Gyógy dialógusok (explicit click handler)
  HarcFegyverTable.tsx     Fegyver harcértékek tábla (a fegyver-név oszlop kattintható → FegyverInfoPopup)
  FegyverInfoPopup.tsx     Fegyver infó overlay (harcértékek aktoronként elsődleges/másodlagos jelzéssel, extrák, anyag, Idea, harcmodor szint)
  fegyver-info-calc.ts     A FegyverInfoPopup pure adat-összeállítója (buildFegyverInfó)
  HarcHeader.tsx           KÉ, SFÉ, VÉ csökk, MP boxok
  TamadoDobasPopup.tsx     Támadó dobás popup (manuális/auto k20, bónuszok)
  SebzesPopup.tsx          Sebzésdobás popup (SP bontás, mód-választó, kötelező "Ellenfél páncél" választó → sebzésjelleg×páncél mátrix + cél_páncél SP-delta, másodlagos passzív info-label, újradobás)
  PancelInfoPopup.tsx      SFÉ infó popup (páncél részletek)
  ElonyPicker.tsx          Előny/Hátrány kocka picker
  ManualDicePicker.tsx     Manuális kockadobás érték választó
  ManoverPicker.tsx        Manőver választó (mód + lista, 2 lépés)
  aktiv-fegyver-ctx.ts     Aktív fegyver kontextus feloldás (kétkezes > fogás > pajzs > jobb kéz)
  HarcFegyverSection.tsx   Fegyver/fogás szekció (Ügyesebb + Gyengébb kéz + Fogás + páncél/pajzs toggle) - Aktív ÉS Harc fül közös
  HarcFegyverfogas.tsx     Fegyverfogás picker (egyfegyveres/kétkezes/fegyver_pajzs/fegyver_hárító)
  UgyesebbKezSelect.tsx / GyengebbKezSelect.tsx / FegyverSelectField.tsx  Fegyver dropdown-ok + közös select-field
  SessionToggles.tsx       Session-toggle fortély gombok (Harci akrobatika: fok-függő fegyver v2 követelmény-tiltás + hint)
  HarcPopups.tsx           Harc fül popup-dispatcher (session-alapú popupok összefogása)
  TaktikaTiltvaInfoPopup.tsx  Taktika-tiltás indok infó popup
  DialogPortal.tsx         createPortal dialógus-wrapper (Seb/Gyógy dialógusokhoz)
  fegyver-helpers.ts       Fegyver segéd (pajzs-fegyvernév, lookup wrapperek)

tavharc/                   Távharc fül (CÉ/VÉ kalkulátor)
  TavharcScreen.tsx        Fő screen (szerkesztő + game mód)
  TavharcKalkulator.tsx    CÉ/VÉ kalkulátor fő panel (távolság/szorzó/fegyver → találati esély)
  TavharcFegyverLista.tsx  Távfegyver lista (kártyák összefogása)
  TavharcFegyverCard.tsx   Egy távfegyver kártya (CÉ bontás, támadás-label, Idea)
  TavharcKepzettsegekSection.tsx  Távolsági harcmodor képzettségek szekció
  TavharcReszletek.tsx     Részletes értékek (CM +/- , bontás)
  TavharcLoveskiteres.tsx  Lövéskitérés panel (opció-picker)
  TavharcGameSelector.tsx  Játék módú fegyver/virtuális fegyver választó
  CelzoDobasPopup.tsx      Célzó dobás popup (CÉ + k20, Előny/Hátrány)
  SzorzoPicker.tsx         Szorzó-összetevő picker (mozgás/méret/észlelhetőség/szél)
  TavolsagPicker.tsx       Távolság (méter) picker (hold-repeat)
  TavharcPopups.tsx        Távharc fül popup-dispatcher
  helpers.ts               CÉ/harckeret/szorzó/VÉ/újratöltés számítás (a CÉ-mag)
  mesterfegyver-calc.ts    Távharc Mesterfegyver fok + követelmény-ellenőrzés/-szöveg (getMfFok, mfKövetelményHiba/Text)
  loveskiteres-calc.ts     Lövéskitérés pure logika (Osztó→kategória, hatótáv-gát, célszám, Akrobatika-érték, buildOpciók picker-lista)
  types.ts                 Távharc fül prop/state típusok

tulajdonsagok/             Tulajdonságok + Képzettségek fül
  TulajdonsagokScreen.tsx  Fő screen (név, faj, kor, tulajdonságok, képzettségek)
  TulajdonsagokHeader.tsx  Fejléc (név, faj, kor, előtörténet trigger)
  TulajdonsagCell.tsx      Egy tulajdonság cella (érték +/- , próba trigger Játék módban)
  TulajdonsagokPopups.tsx  Tulajdonságok fül popup-dispatcher (TSz/próba/grid pickerek)
  KepzettsegCsoport.tsx    Képzettség csoport (csukható, game/edit mód)
  KepzettsegRow.tsx        Képzettség sor (szint +/- , limit jelzés, ▾ accordion → KepzettsegDetails)
  KepzettsegPickerOverlay.tsx  Képzettség picker overlay popup (név + md link + ▾ accordion → KepzettsegDetails)
  TulajdonsagProbaPopup.tsx  Tulajdonságpróba dobás popup (Játék mód, k6)
  proba-common.ts          Próba közös logika (Előny/Hátrány szintek, lehetetlen/biztos siker, összetett próba típusok)
  kepzettseg-proba-calc.ts Képzettségpróba tiszta kalkuláció (célszámok, kiterjesztés EH, szituációs módosítók, enyhítés)
  KepzettsegProbaPickers.tsx Képzettségpróba alpickerei (kiterjesztés, helyzetfüggő módosítók, infó)
  kepzettseg-limit.ts      Képzettség max szint a rules.json-ból (§19)
  KepzettsegProbaPopup.tsx   Képzettségpróba dobás popup (Játék mód, k10)
  PrimerKpBox.tsx          Primer KP bontás doboz (fül alja)
  primerKpCalc.ts          Primer KP bontás kalkuláció (calcPrimerKp, KpDetail)
  ElotortenetOverlay.tsx   Előtörténet overlay (becenév, név, kor, vallás, biográfiai mezők)
  KorPicker.tsx            Kor +/- picker overlay
  VallasPickerOverlay.tsx  Vallás választó overlay
  helpers.ts               Tul/Képz fül segédek
  types.ts                 Tul/Képz fül prop/slot típusok
  useEscapeClose.ts        Re-export (hooks/useEscapeClose)
  popups/GridPickerPopup.tsx / popups/TextInputPopup.tsx  Közös grid-/szöveg-input popupok

fortelyok/                 Fortélyok fül
  FortelyokScreen.tsx      Fő screen (csoportok, felvétel, fok kezelés)
  FortelyFelvetel.tsx      Felvétel wizard (többszörös, kiérdemelt)
  FortelyPickerOverlay.tsx Fortély picker overlay popup (név + md link + ▾ accordion → FortelyDetails)
  NewFortelySelect.tsx     "+ Új fortély" gomb (picker overlay trigger)
  FortelyRow.tsx           Fortély sor (pöttyök, követelmény jelzés)
  FortelyCsoport.tsx       Fortély csoport (csukható, ingyenes-keret jelzés)
  FortelyPopups.tsx        Fortélyok fül popup-dispatcher (felvétel wizard, fok, törlés)
  useFortelyActions.ts     Fortély felvétel/törlés/fok akció-logika (picker, kiérdemelt, Mesterfegyver→fegyver auto)
  helpers.ts               Fortély segédek (nyelv-pont keret/túllépés, ingyenes-slot)
  types.ts                 Fortélyok fül prop/slot típusok

harcertekek/               Harcértékek fül (HM, fegyver, páncél, pajzs)
  HarcertekekScreen.tsx    Fő screen
  HarcertekekHmSection.tsx HM (TÉ/VÉ) szekció - felvett HM elosztása, aszimmetria-limit
  HarcertekekHarciKepzettsegekSection.tsx  Harci képzettségek (szerkeszthető harcmodor szintek)
  HarcertekekFegyverekSection.tsx  Fegyver kártyák
  HarcertekekFegyverChip.tsx  Egy fegyver chip/kártya (anyag, Idea, MF)
  HarcertekekPancelSection.tsx     Páncél mezők
  HarcertekekPancelPopup.tsx       Páncél szerkesztő popup (struktúra/alapanyag/kidolgozottság/tagok/idea)
  HarcertekekPajzsSection.tsx      Pajzs szekció (méret, pajzshasználat)
  HarcertekekPopups.tsx    Harcértékek fül popup-dispatcher
  PickerComponents.tsx     Közös picker elemek (FokRadios, ColumnPicker)
  PopupOverlay.tsx         Harcértékek fül-lokális popup shell
  helpers.ts               Harcértékek segédek (közelharci/távharci név-listák, MF fok, display-nevek)
  hooks/                   Harcértékek fül-lokális hookok

misztikus/                 Misztikus fül (Aura, Tradíció, Arkánumok)
  MisztikusScreen.tsx      Fő screen
  AuraPanel.tsx            Aura értékek (Mágiaellenállás, Mágia akarata kattintható kártya)
  TradicioSection.tsx      Tradíció szekció (SectionRow alapú)
  ArkanumokSection.tsx     Arkánumok szekció
  FajMiszteriumSection.tsx Faj misztérium képzettség szekció
  OsiNyelvSection.tsx      Ősi nyelv szekció
  MisztikusFortelyokSection.tsx  Misztikus fortélyok szekció (legalul)
  SectionRow.tsx           Közös misztikus sor-renderelő (szint +/- , accordion)
  MisztikusRow.tsx         Misztikus képzettség sor
  MisztikusPopups.tsx      Popup dispatcher (tradíció, szint, fok, felvétel, mágia akarata)
  useMisztikusPopups.ts    Popup state hook (tradíció/altípus picker állapotkezelés)
  types.ts                 Misztikus fül prop/section típusok
  popups/MagiaAkarataPopup.tsx  Mágia akarata 4-füles referencia popup
  popups/AltipusPickerPopup.tsx  Tradíció altípus/Pantheon picker popup
  popups/TradicioPickerPopup.tsx  Tradíció lista picker popup
  popups/SzintPickerPopup.tsx    Szint választó popup
  popups/FokPickerPopup.tsx      Fok választó popup
  popups/TextPromptPopup.tsx     Szöveg-input popup

hatterek/                  Hátterek fül (szövegfelhő)
  HatterekScreen.tsx       Fő screen (leíró + karma)
  TagCloud.tsx             Leíró háttér tag-felhő (hozzáad/töröl)
  KarmaCloud.tsx           Karma háttér tag-felhő
  FreeTextPopup.tsx        Szabad szöveges háttér-bevitel popup (SpecPicker alapú)
  types.ts                 Hátterek fül mező-típusok

overlays/                  Globális overlay-ek (menü, mentés, slot, undo, stb.)
  AppOverlays.tsx-ben összefogva (components/AppOverlays.tsx)
  OverlayPortal.tsx        createPortal overlay-wrapper
  OverlayScreenOverlay.tsx Verziók/Napló/Jegyzetek összevont overlay (NaploTab + jegyzetek + próba)
  SzilankPickerOverlay.tsx Szilánk pont (0-3) + gyors-elérési hub (Szabályrendszer link, próba táblák)
  SlotListOverlay.tsx      Karakterek hub (slot lista → SlotList.tsx)
  SlotDeleteOverlay.tsx    Slot törlés megerősítő
  SlotLimitOverlay.tsx     Slot/NJK limit elérve figyelmeztetés
  SaveOptionsPopup.tsx     Mentés/Exportálás popup (link, fájl, share, QR)
  SaveFileOverlay.tsx      Fájl kész (📤 Megosztás / 💾 Letöltés)
  SharePopupOverlay.tsx    Megosztás link popup
  ImportOptionsPopup.tsx   Import popup (fájl, vágólap, QR képből)
  ImportConfirmOverlay.tsx Import ütközés megerősítő (felülírás/új példány)
  QrCodePopup.tsx          QR kód generálás + PNG mentés (uqr lib)
  BackupRestoreOverlay.tsx Backup visszaállítás overlay (össz- + NJK limit)
  CheckpointRestoreOverlay.tsx  Karakter verzió visszaállítás megerősítő
  NewCharConfirmOverlay.tsx  Új karakter megerősítő
  TestConfirmOverlay.tsx   Teszt karakter betöltés megerősítő
  LoadErrorOverlay.tsx     Betöltési hiba overlay
  UndoOverlay.tsx          Undo lépés-lista overlay
  ToastOverlay.tsx         Toast üzenet (success/error, auto-dismiss)
  FullscreenHintOverlay.tsx  iOS főképernyőhöz-adás hint
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
| `hatasok.yaml` | Hatás mechanikák | - (csak validáció, az app nem tölti be) |
| `hatas_operatorok.yaml` | Hatás operátorok (8 db) | `hatas_operatorok.json` |
| `esemenyek.yaml` | Célpontok/események (23 db) | `esemenyek.json` |
| `hatterek.yaml` | Leíró + Karma hátterek | `hatterek.json` |
| `szituacio_mapping.yaml` | Képzettség → Szituáció kapcsolatok | → `kepzettsegek.json` (`kapcsolódó_szituációk` mező) |
| `fegyverek/fegyverek.yaml` (+ `fegyverek_fixed.json`) | Fegyver v2 definíciók (módok[], fegyverhossz, sebzésjelleg) | `fegyverek_v2.json` |
| `fegyverek/sebzesjelleg_pancel_matrix.yaml` | Sebzésjelleg × páncélosztály SP-delta mátrix | `sebzesjelleg_pancel_matrix.json` |
| `fegyverek/extrak.yaml` | Fegyver-extrák (pl. `cél_páncél` SP-hatások) | `fegyver_extrak.json` |

**`fegyverek/` almappa** (`extrak.yaml`, `fegyverek.yaml`, `konstansok.yaml`, `sebzesjelleg_pancel_matrix.yaml` + séma/`fegyverek_fixed.json`) - a Fegyvergenerátor v2 forrásai. A `fegyverek_v2.json` + `sebzesjelleg_pancel_matrix.json` + `fegyver_extrak.json` a `generate_tables.py` build-gate-be van kötve (`data/gen/fegyverek_v2.py`), a webapp runtime ezeket olvassa. A séma-validáció a `fegyverek.schema.yaml` / `extrak.schema.yaml`-hoz mér, a naming-lint hatóköre kiterjed az almappára. (A migrációs napló: `STUDY.fegyvergenerator_v2` a wikiben.)

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
| 27 | Fegyverfogás | `HarcFegyverfogas.tsx`, `pancel-calc.ts` |
| 29 | Undo | `useKarakterState.ts`, `useUndo.ts` |
| 30-31 | Local Storage, Multi-karakter | `useKarakterState.ts`, `useAutoSave.ts` |
| 31b | Karakter verziók (checkpoint) | `checkpoint-utils.ts`, `CheckpointSection.tsx` |
| 34 | Aura | `MisztikusScreen.tsx` |
| 38 | Lovas harc | `harci_helyzetek.yaml`, `taktikak.yaml` |
| 40 | URL Export | `url-share.ts` |
| 41 | Reactive Engine | `reactive.ts`, `reactive-parse.ts`, `rules.json` |
