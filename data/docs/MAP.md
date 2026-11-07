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
  rules.json                 Reactive engine: 57 deklaratív szabály
  generate_tables.py         YAML→JSON belépési pont (Vite buildStart + prebuild futtatja)
  gen/                       Generátor modulok: common, cache, schema, konstansok, kepzettsegek,
                             fortelyok, fajok, aktiv_ful, validators, naming_lint (YAML naming build-gate),
                             hivatkozas (fortély/képzettség id-hivatkozás formátum + feloldó),
                             kiterjesztes_check (képzettség md ↔ kiterjesztesek.json szinkron build-gate)
                             common.hibak_kilep (gate-kimenet + SystemExit), hivatkozas.id_hivatkozasi_hibak /
                             manover_ref_hibak; test_gates.py (gate-ek pozitív + negatív tesztje, `npm run test:gates`)
web/karakter/                React app gyökere
web/karakter/refactorlog/    Refaktor naplók (ÉÉÉÉ-HH-NN.md): elvégzett műveletek, okok, csapdák
code/                        Python scriptek (generate.markdown.py + lib/JinjaHandler.py - md fejezet-generálás)
  fegyvergenerator/          Fegyvergenerátor v2 (a json_export + validátorok a webapp build-gate része, a többi tervezői eszköz):
    modell.py                Determinisztikus harcérték-modell (paraméter → TÉ/VÉ/SP/Sebesség/Átütés) + regressziós/balansz önteszt
    json_export.py           yaml + fegyverek_fixed.json → fegyverek_v2.json (a data/gen/fegyverek_v2.py hívja; ár-modell is itt)
    extrak_validator.py      extrak.yaml séma-validátor (build-gate)
    fegyverek_validator.py   fegyverek.yaml séma-validátor (build-gate)
    md_fegyvertablak_sync.py A generátorból az éles md/068_0x fegyvertáblák tag-közi frissítése (CI: update_fegyvertablazat.yml)
    wiki_fegyverlista.py     Mainstream fegyverlista md-tábla a wiki STUDY.fegyvergenerator_v2_fegyverlista.md-be (stdout)
    ar_selftest.py           Fegyver ár-modell önteszt (json_export.ar_alap / fegyver_ar)
    data_adapter.py          Taktikák/Harci helyzetek/Manőverek/Státuszok generikus hatás-kiértékelője
                                       (data/tables/*.json direkt betöltés - nincs kézzel duplikált adat)
    harcszimulator.py        Kör-alapú harci motor (statblokk, VÉ könyvelés, sebzés - spec §2-§9)
                                       önteszt: `python3 code/fegyvergenerator/harcszimulator.py`
    taktikai_ai.py           Kör-elejei döntési réteg a motor fölött: minden harcos minden körben
                                       újraválaszt taktikát/manővert (ÖSSZES közelharci taktika + a helyzetre
                                       leképezhető manőverek - l. modul-fej a korlátokért). `kuzdelem_ai()`.
                                       önteszt: `python3 code/fegyvergenerator/taktikai_ai.py`
    balansz_elemzes.py       Nagyszabású, MINDEN fegyverre kiterjedő mátrix-elemzés (páncélosztály
                                       × AI be/ki × tükör-harc + 1:3 túlerő). Konklúziót ad: mely fegyverek
                                       (túl) erősek/gyengék minden körülményben, kategória-átlagok,
                                       páncélfüggő szélsőségek. Futtatás: `python3
                                       code/fegyvergenerator/balansz_elemzes.py [--n=250] [--gyors]`
                                       - a kimenet NEM kerül a repóba (work file), a konklúziót olvasható
                                       riportba kell átvezetni (l. wiki STUDY.* konvenció).
    v1_v2_osszehasonlitas.py A kivezetett v1 (`archive/data_fegyverek_v1/fegyverek.json`) és a v2 fegyvergenerátor
                                       (`data/tables/fegyverek_v2.json`) harcértékeinek
                                       1:1 delta-összehasonlítása, kézi alias-táblával a névformátum-eltérésekhez.
                                       Kimenet: konzol + markdown riport (wiki STUDY.* fájlba, NEM az éles repóba).
  balance/                   Általános balansz / tesztharc tervezői eszközök (NEM pipeline):
    harcszimulacio_selftest.py        harcszimulacio.spec.md §15 önteszt validálása (a data layerből olvas)
    elony_hatrany_eloszlasok.py       Előny/Hátrány kockaeloszlás analízis (matplotlib)
    sfe_hangolas.py                   Páncél SFÉ hangolási szimulátor (spec §3-§6 motor + MGT-ellensúly, jelleg-bónusz, harci helyzetek)
    harci_fortely_kovetelmenyek.py    Harci fortélyok követelmény-elemzése
    harci_laz_*.py                    Harci láz hangolási szimulációk
```

## Web App (`web/karakter/src/`)

### Engine (`engine/`)
| Fájl | Felelősség |
|------|-----------|
| `reactive.ts` | Rule engine: evaluate, buildContext, buildArrayContext, `evalRule` (egy szabály skalár inputokkal, a TS-képletmásolatok helyett; minden deklarált input kötelező) |
| `harc/aktiv-fegyver-ctx.ts` | Aktív fegyver kontextus feloldás (kétkezes > fogás > pajzs > jobb kéz) |
| `harc/combat-roll-info.ts` | Támadó/Sebzés/CÉ dobás-hatások + SP-bónuszok (a közös `engine/effekt.ts` gyűjtőből, dobás-célokra szűrve) |
| `harc/ep-logic.ts` | ÉP sebesülés/gyógyulás pure logika |
| `harc/fegyver-calc.ts` | Per-fegyver TÉ/VÉ/SP/harckeret (optimalizált: 5 rule/fegyver) |
| `harc/fegyver-helpers.ts` | Fegyver segéd (pajzs-fegyvernév, lookup wrapperek) |
| `harc/harc-computed.ts` | `calcHarcComputed`: context build + reactive evaluate + feltétel dispatch (a Harc fül teljes számítása) |
| `harc/types.ts` | Harc számoló eredmény-típusok (`FegyverResultMód`, `FegyverResult`, `HarcComputed`) |
| `harc/harc-fejlec-calc.ts` | A fejléc KÉ/TÉ/VÉ egyetlen számítása (harcFejlécÉrtékek) - HarcScreen + NJK switcher gyors-stat |
| `harc/harcertekek-helpers.ts` | Harcértékek segédek (közelharci/távharci név-listák, MF fok, display-nevek) |
| `harc/manover-dobas-calc.ts` | Manőver dobás pure logika (követelmény kiértékelés, fázisok, TÉ-bontás, fázis-feliratok, eredmény-hatás) - a popup számítási magja. `szitFeltételTeljesül`/`szitModKezdőÁllapot`: a helyzetfüggő módosító sorok `feltétel` ("fegyver_extra:<id>"/"taktika:<id>"/…) auto-matchje → az illő sor alapból bekapcsolva (kézi override marad). `szitTáblákMódszerint`: a mód szerinti tábla-szűrés (aktív = aktív-oldali + globális; passzív = `mód_oldal: passzív` táblák). `szitModÁllapot`: a kiválasztott módosítók aggregált állapota egy helyen (összeg + két sentinel-ág: `99` nem kísérelhető meg / `-99` immunis + az immunis extra leírása). A `manoverek.yaml` `extra_ref` pointer-sorai build-időben feloldódnak az extrák `manőver_ellenpróba` hatásából (érték+leírás+feltétel; `letilt` mód → `-99` sentinel; a tábla `mód_oldal` ↔ extra `manőver_állapot` egyezés build-gate), l. `data/gen/aktiv_ful.py` - EGY igazságforrás (A/1, §42) |
| `harc/pancel-calc.ts` | Páncél lookup + fogás VÉ |
| `harc/shared.ts` | Harc fül közös utils: resolveNagyobbKisebb, computeTÉ / computeVÉ, véVesztésSzorzó, coalesceVéHistory |
| `harc/taktika-calc.ts` | Taktika módosítók |
| `harc/ve-csokkentes-calc.ts` | Sikertelen támadás VÉ csökkentése (Fegyverviszony bázis + k20P; taktika override/flat; fortély flat) - §5.3/§13.1 |
| `proba/kepzettseg-proba-calc.ts` | Képzettségpróba tiszta kalkuláció (célszámok, kiterjesztés EH, szituációs módosítók, enyhítés) |
| `proba/proba-common.ts` | Próba közös logika (konstansok.próba-vezérelt: Előny/Hátrány szintek, lehetetlen/biztos siker, siker-felirat, helyettesítés, összetett próbaok) |
| `proba/proba-forrasok.ts` | A próbák fortély-forrásai karakterre bontva (Tulajdonságok fül + Próba-hub közös): próba-bónuszok tulajdonságonként / képzettségenként, próba-enyhítések |
| `taktika/helyzet-helpers.ts` | Helyzet elérhetőség, min fegyverhossz, infó szöveg |
| `taktika/taktika-helpers.ts` | Taktika módosító-formázás + fok-bővítés (getTaktikaMods, getExtraFokok, formatFokMods) |
| `taktika/taktika-megkotes.ts` | Taktika megkötés-kiértékelés (isTaktikaAllowed: session/fegyver/harcmodor/támadás/távfegyver + kombó) |
| `reactive-parse.ts` | Formula parser: evalFormula, aggregate resolverek (sum, lookup, stb.) |
| `types.ts` | Mentett karakter: Karakter, Session (+ `SessionBoolKulcs`), Fortely / Kepzettseg / példány-típusok, `DEFAULT_*`, `UndoPatch` / `UndoEntry` |
| `data-types.ts` | Játékadat (GameData és a táblák típusai): FortelySummary, TaktikaEntry, HarciHelyzetEntry, KonstansokRaw, `FegyverAlap` / `TavfegyverAlap` / `TavharcSzorzok`, `SP_NINCS` stb. |
| `data-loader.ts` | fetchJson runtime adatbetöltés |
| `fortely-mods.ts` | calcFortelyMods - burkoló az `effekt.ts` gyűjtő fölött (fortély + alapeset → célonkénti Record) |
| `effekt.ts` | Egységes effekt-modell (§42 3. fázis): `gyűjtFortélyEffektek`, `gyűjtTaktikaEffektek` (taktikánként + VÉ-plafon korrekciós sor), `gyűjtHelyzetEffektek`, `gyűjtStátuszEffektek`, `értékCélra`, `arányÖsszeg`, `kockaSzint` (E/H nettó szint); a harci dobás-hatások (`combat-roll-info.ts`) és a próba-státusz (`statusz-proba.ts`) is ebből; regressziós snapshot: `effekt.regresszio.test.ts`; a `calcFortelyMods` / `calcTaktikaMods` ennek burkolói |
| `azonosito.ts` | Fortély/képzettség azonosítás (séma v3): `képzKulcs` / `bontKépzKulcs` (`<id>/<elem>`), `fortélyNév` / `képzettségNév` / `harcmodorNév` (id → megjelenített név), `képzettségSzint`; konstansok `HARCMODOR_ID`, `TRADÍCIÓ_ID`, `EGYEDI_FORTÉLY_ID` |
| `mf-utils.ts` | `findMfFokByName` (egyetlen MF egyeztető) + `findMfFok` (fegyvertáblából) + `getMfBónusz` |
| `alapeset.ts` | Fortély 0.fok (Alapeset) kiértékelés |
| `ketkezes.ts` | Kétkezes harc összesítő kalkuláció |
| `feltetelek.ts` | buildAktívFeltételek helper |
| `feltetel-eval.ts` | FeltételEvaluator factory (context-alapú feltétel kiértékelés) |
| `url-share.ts` | Karakter URL export/import (deflate+base64url) + `extractHashFromText` |
| `version-check.ts` | Elavult HTML felismerés → egyszeri cache-kerülő újratöltés (§30b) |
| `checkpoint-utils.ts` | Karakter verziók (checkpoint): snapshot, create, restore (truncate/append), delete - §31b |
| `dice.ts` | Kockadobás: rollDie(sides), rollK20/K10, `rollElőnyHátrányDie(szint, sides)` + `rollElőnyHátrányK20`, `előnyHátrányLabel`, `clampEHSzint` (E/H szint [-2,+2]) |
| `file-ops.ts` | Save/Load/Duplicate |
| `validate.ts` | Karakter validáció |
| `statusz-proba.ts` | Státusz → Képzettségpróba Előny/Hátrány kalkuláció (a `gyűjtStátuszEffektek`-ből); `próbaÉrzékek`: alkategóriás státusz (Érzékvesztés) érzék-választó opciói |
| `felszereles.ts` | Felszerelés keret/terhelés/Hátrány (§15/§33.1): `felszerelésMax`, `felszerelésTerhelés`, `felszerelésSorok`, `felszerelésHátrány`, `fizikaiTulajdonság` - a fegyver pont VAGY-VAGY `max(hossz,súly)`; karakter-frissítők: `külsőJelző`, `páncélPajzsNincs` (Felszerelés + Akadály szekció közös) |
| `lookup.ts` | GameData entitás-keresők (tömbönként egyszer épített, `WeakMap`-ben tárolt index): `lookupFegyver`, `lookupTávfegyver`, `taktikaDef`, `helyzetDef`, `státuszDef` (név, kis/nagybetű-független), `fortélyDef`, `képzettségDef`, `eseményDef` (id, pontos); ismeretlen → `undefined`; adatteszt: kulcs-egyediség a táblákban |
| `utils.ts` | evaluateFeltétel, describeKepChange, `interpolateFokDef` (taktika fok-extrapoláció), `ideaDelta` (§16 Idea-delta), `buildPajzsFegyverNév` |
| `extrak-info-calc.ts` | Fegyver-extrák (fegyver_extrak.json) futásidejű állapot-kiértékelése (aktív/inaktív/KM) az "Extrák" gombhoz (§42 info-szelet, pure fn). Aktív-jelzés: harci_helyzet/taktika/fortély/státusz/aktor/forgatás/cél_páncél feltételek + aktív manőverhez kapcsolt hatás-al-feltétel ("manőver:<id>") |
| `extrak-effekt.ts` | Egységes effekt-precedencia (§42.3: override (bázis-csere)→additív→szorzó→max_limit, FLOOR) pure motor + aktívHatásokCélra (csak teljesült feltételű hatások) + hiányzóInfósExtrák (KM-warning, hiányos korreláció). Bekötve: Sebzés popup SP-delta, VÉ-csökkentés warning |

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
| `useHint` | Rövid hint-üzenet állapot (több fül közös) |
| `useEscapeClose` | Escape billentyű popup bezárás |
| `useLongPress` | Long-press vs short-tap megkülönböztető (NJK chip betű-picker) |
| `useTaktikaInvalidation` | Aktív taktikák érvénytelenítése fegyver/session változáskor (useEffect) |
| `useFegyverInvalidation` | Aktív fegyver Puszta kéz fallback, ha `felszerelésben=false` lesz (useEffect) |
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
a11y.ts                    `kattinthatóProps`: nem-<button> kattintható elem (gomb a sorban) billentyűzettel: role=button, Enter/Szóköz

aktiv/                     Aktív fül (taktika, helyzet, manőver, státusz, fegyverválasztás)
  AktivScreen.tsx          Fő layout
  AktivTaktikak.tsx        Taktika picker + chip-ek
  AktivHelyzetek.tsx       Harci helyzet picker (3 csoport)
  AktivStatuszok.tsx       Státusz picker
  StatuszPickerOverlay.tsx Státusz választó overlay (kategóriák + fok)
  AktivHatasPool.tsx       Hatás pool box
  KotottFortelySorok.tsx   Aktív helyzethez / taktikához kötött fortélyok sorai (AktivHelyzetek + AktivTaktikak közös)
  aktiv-calc.ts            Aktív fül kalkuláció logika (4 pure fn + orchestrator)
  NaploTab.tsx             Verziók + Napló accordionok kompozíciója (CheckpointSection + NaploSection)
  CheckpointSection.tsx    Karakter verziók accordion (lista, létrehozás, törlés, megtekintés)
  NaploSection.tsx         Napló accordion (bejegyzések, szerkesztő form, opcionális checkpoint)
  FelszerelesSection.tsx   Felszerelés accordion (keret Max/Aktuális, tárgy-táblázat; fegyver/pajzs/páncél auto + kézi tárgyak; §15/§33.1)
  AkadalySection.tsx       Akadály accordion (read-only származtatott: tartós viselet/cipelés Akadály-állapota; páncél/pajzs forrásonként viselve/külső/nincs; engine `felszereles.ts` `akadályÁllapot`)

harc/                      Harc fül (harcértékek, ÉP, fegyvertábla)
  HarcScreen.tsx           Fő screen
  useVeCsokkenes.ts        VÉ-csökkenés kezelés hook (szorzó, korlát, undo, history-összevonás, flash)
  useSerultStatusz.ts      „Sérült (N)" státusz automatikus karbantartása az ÉP-rubrikák szerint
  harc-reszletek-calc.ts   Részletes értékek bontás
  HarcReszletek.tsx        Részletes értékek box (aktív fegyver harcérték bontás megjelenítés)
  VeSzorzoInfoPopup.tsx    VÉ csökkentés szorzó/bázis infó popup
  EpTable.tsx              ÉP sebesülés tábla (S1-S4)
  EpDialogs.tsx            Seb/Gyógy dialógusok (explicit click handler)
  HarcFegyverTable.tsx     Fegyver harcértékek tábla (a fegyver-név oszlop kattintható → FegyverInfoPopup)
  FegyverInfoPopup.tsx     Fegyver infó overlay (harcértékek aktoronként elsődleges/másodlagos jelzéssel, extrák, anyag, Idea, harcmodor szint)
  fegyver-info-calc.ts     A FegyverInfoPopup pure adat-összeállítója (buildFegyverInfó)
  HarcHeader.tsx           KÉ, SFÉ, VÉ csökk, MP boxok
  TamadoDobasPopup.tsx     Támadó dobás popup (manuális/auto k20, bónuszok)
  PancelInfoPopup.tsx      SFÉ infó popup (páncél részletek)
  ManoverPicker.tsx        Manőver választó (mód + lista, 2 lépés)
  HarcFegyverSection.tsx   Fegyver/fogás szekció (Ügyesebb + Gyengébb kéz + Fogás + páncél/pajzs toggle) - Aktív ÉS Harc fül közös
  HarcFegyverfogas.tsx     Fegyverfogás picker (egyfegyveres/kétkezes/fegyver_pajzs/fegyver_hárító)
  UgyesebbKezSelect.tsx / GyengebbKezSelect.tsx / FegyverSelectField.tsx  Fegyver dropdown-ok + közös select-field
  SessionToggles.tsx       Session-toggle fortély gombok (Harci akrobatika: fok-függő fegyver v2 követelmény-tiltás + hint)
  HarcPopups.tsx           Harc fül popup-dispatcher (session-alapú popupok összefogása)
  TaktikaTiltvaInfoPopup.tsx  Taktika-tiltás indok infó popup
  DialogPortal.tsx         createPortal dialógus-wrapper (Seb/Gyógy dialógusokhoz)

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
  useProbaDobas.ts         Próba dobás-állapot hook (sima / összetett, automatikus / kézi) - mindkét próba popup
  ProbaReszek.tsx          Próba popupok közös UI-részei (fejléc, Extrák sor/gomb, Összetett / Ellenpróba választó, eredmény-blokk)
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
  popups/GridPickerPopup.tsx  Közös grid-input popup

fortelyok/                 Fortélyok fül
  FortelyokScreen.tsx      Fő screen (csoportok, felvétel, fok kezelés)
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
  HarcertekekFegyverChip.tsx  Egy fegyver chip/kártya (anyag, Idea, MF, Ár)
  fegyver-ar-calc.ts       Fegyver példány ár-szorzó (ár_alap × anyag × idea; §43.2 - a webapp csak a hangolható tengelyeket teszi az ár_alap-ra, fixed fegyver=null)
  HarcertekekPancelSection.tsx     Páncél mezők
  HarcertekekPancelPopup.tsx       Páncél szerkesztő popup (struktúra/alapanyag/kidolgozottság/tagok/idea)
  HarcertekekPajzsSection.tsx      Pajzs szekció (méret, pajzshasználat)
  HarcertekekPopups.tsx    Harcértékek fül popup-dispatcher
  hooks/                   Harcértékek fül-lokális hookok

common/                    Közös UI-elemek (több fül használja; fület nem importálhat - ESLint)
  common.css               A common/ elemek stílusai
  FortelyFelvetel.tsx      Felvétel wizard (többszörös, kiérdemelt)
  HarcmodorLista.tsx       Harcmodor-képzettség lista (felvettek + felvétel select) - Harcértékek + Távharc közös
  HarciKepzettsegSzintPopup.tsx  Harcmodor-képzettség szint popup (Harcértékek + Távharc; mégse → a 0 szintű felvétel visszavonása)
  OverlayPortal.tsx        createPortal overlay-wrapper
  PickerComponents.tsx     Közös picker elemek (FokRadios, ColumnPicker)
  TextInputPopup.tsx       Közös szöveg-input popup (becenév, név, prompt)

dobas/                     Dobás-popup készlet (Támadó / Sebzés / CÉ / Manőver popupok közös elemei; fület nem importálhat)
  dobas.css                A dobás-popupok stílusai (Támadó / Sebzés / Célzó / Manőver / VÉ csökkentés)
  ElonyPicker.tsx          Előny/Hátrány kocka picker
  ExtrakInfo.tsx           "Extrák" gomb (💡, pulzál ha van aktív) + popup: fegyver-extrák listája státusz-jelzéssel (Támadó + Sebzés popupban)
  HatasokInfo.tsx          Dobás-hatás badge feliratok (Előny/Hátrány/Enyhít formázás, pure fn)
  KeziBonuszBtn.tsx        Kézi „Statikus bónuszok" gomb + popup (Támadó / CÉ / Manőver dobás)
  ManoverDobasPopup.tsx    Manőver dobás popup (követelmény 0. lépés Normál/Erős, fázis lépegetés, Siker/Kudarc, helyzetfüggő módosítók, MP+TÉ popup)
  ManoverDobasReszek.tsx   A manőver popup al-komponensei (dobó-sor, követelmény-lépés, fázis-gombok, végeredmény, módosító / MP / TÉ popupok)
  ManualDicePicker.tsx     Manuális kockadobás érték választó
  SebzesPopup.tsx          Sebzésdobás popup (SP bontás, mód-választó, kötelező "Ellenfél páncél" választó → sebzésjelleg×páncél mátrix + cél_páncél SP-delta, másodlagos passzív info-label, újradobás)
  TaktikaHelyzetChipek.tsx Taktika / Harci helyzet gyors-chipek (Támadó + Célzó dobás popup)
  VeCsokkentesPopup.tsx    VÉ csökkentés popup (fegyverviszony választó + taktika/extra hatások, k20P; a Roham/Öngyilkos roham ×2 szorzó forrás-taktikája kiírva a gombon és a bontásban)

picker/                    Taktika- / helyzet-választók (Aktív fül + dobás-popupok; fület nem importálhat)
  picker.css               A pickerek stílusai
  HelyzetPickerPopup.tsx   Harci helyzet választó popup (Aktív fül + Támadó / CÉ dobás)
  PickerOverlay.tsx        Közös picker overlay-keret (fejléc, bezárás, lista)
  TaktikaFokPicker.tsx     Fokozatos taktika fok-választó
  TaktikaPickerList.tsx    Taktika választó lista (pinned + többi)
  TaktikaPickerPopup.tsx   Taktika választó popup (lista + fok-választó; Aktív fül + dobás-popupok)

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
  OverlayScreenOverlay.tsx Verziók/Napló/Jegyzetek összevont overlay (FelszerelesSection + NaploTab + jegyzetek + próba)
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
| `fortelyok/{harci,tavharc,altalanos,erzekek,szabad,kiemelt,misztikus}/*.yaml` | Fortély definíciók (184 db, stabil `id` + `név`) | `fortelyok.json` |
| `kepzettsegek/{primer,szekunder}/*.yaml` | Képzettség definíciók (81 db, stabil `id` + `név`) | `kepzettsegek.json` |
| `fajok/*.yaml` | Faj hátterek (27 db) | `fajok.json`, `faj_tulajdonsag_keretek.json`, `faj_fortelyok.json` (faj → {fortély: max_fok}, `faj` követelmény) |
| `taktikak.yaml` | Harci taktikák (19 db) | `taktikak.json` |
| `harci_helyzetek.yaml` | Harci helyzetek (39 db) | `harci_helyzetek.json` |
| `manoverek.yaml` | Manőverek (38 db) | `manoverek.json` |
| `statuszok.yaml` | Státuszok (19 db) | `statuszok.json` |
| `hatasok.yaml` | Hatás mechanikák | - (csak validáció, az app nem tölti be) |
| `esemenyek.yaml` | Célpontok/események (23 db) | `esemenyek.json` |
| `hatterek.yaml` | Leíró + Karma hátterek | `hatterek.json` |
| `szituacio_mapping.yaml` | Képzettség / fortély → Szituáció kapcsolatok (kulcs `képzettség:<id>[/<elem>]` / `fortély:<id>`) | → `kepzettsegek.json` (`kapcsolódó_szituációk`, `kapcsolódó_szituációk_elem`), `fortelyok.json` (`kapcsolódó_szituációk`) |
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
| `engine_spec.md` | Kalkulációs formulák (§1-§43) | Engine logika módosításkor |
| `gui_spec.md` | UI viselkedés, screen-ek, stílusok | UI módosításkor |
| `harcszimulacio.spec.md` | Önhordó harcrendszer spec tesztharc szimulációhoz (statblokk, körfeloldás, VÉ könyvelés, taktika/helyzet/státusz táblák, ambiguitás-regiszter, önteszt) | Szabály-hangolás, tesztharc, balance vizsgálat |

## Refaktor naplók (`web/karakter/refactorlog/`)

| Fájl | Tartalom | Mikor olvasd |
|------|----------|-------------|
| `ÉÉÉÉ-HH-NN.md` | Egy nagy refaktor: fázisok, döntések, csapdák, újrahasznosítható detektáló scriptek | Refaktor, halott kód keresés, data layer átalakítás ELŐTT |
| `2026-11-06.md` | A teljes webapp-refaktor (0-9. fázis, 2026-11-06 - 11-07): rétegek, lookup, effekt-gyűjtő, popup-állapot, CSS, Python gate-tesztek - döntések, kihagyások indokkal, csapdák, mérleg | Nagyobb szerkezeti módosítás ELŐTT |

## Engine Spec szekciók (gyorshivatkozás)

| § | Téma | Kulcs fájlok |
|---|------|-------------|
| 1-2 | KP, Tulajdonság pontok | `rules.json`, `App.tsx` |
| 3 | ÉP | `rules.json` |
| 4 | KÉ | `rules.json`, `harc-computed.ts` |
| 5-6 | TÉ, VÉ | `fegyver-calc.ts`, `rules.json` |
| 7 | CÉ | `tavharc/helpers.ts` |
| 8 | SP | `fegyver-calc.ts` |
| 9 | Harckeret/támadások | `fegyver-calc.ts`, `rules.json` |
| 10-11 | Páncél SFÉ/MGT | `pancel-calc.ts`, `rules.json` |
| 12 | Merevvért TÉ büntetés | `rules.json` |
| 13 | Pajzs | `pancel-calc.ts` |
| 14 | Manőver Pont | `rules.json` |
| 15 | Felszerelés (keret/terhelés → próba-Hátrány) | `felszereles.ts`, `konstansok.yaml` |
| 16 | Fortély módosítók | `fortely-mods.ts`, `alapeset.ts` |
| 17 | Távharc | `tavharc/helpers.ts` |
| 18 | HM/CM limitek | `rules.json` |
| 19 | Képzettség limitek | `rules.json` |
| 20 | Faj hátterek | `fajok/*.yaml` |
| 21 | Taktikák, Helyzetek, Manőverek | `aktiv/`, `taktika-calc.ts` |
| 22 | Státuszok, Hatások | `statuszok.yaml`, `AktivStatuszok.tsx` |
| 24 | Kalkulált feltételek | `harc-computed.ts` |
| 26 | Kétkezes harc | `ketkezes.ts` |
| 27 | Fegyverfogás | `HarcFegyverfogas.tsx`, `pancel-calc.ts` |
| 29 | Undo | `useKarakterState.ts`, `useUndo.ts` |
| 30-31 | Local Storage, Multi-karakter | `useKarakterState.ts`, `useAutoSave.ts` |
| 31b | Karakter verziók (checkpoint) | `checkpoint-utils.ts`, `CheckpointSection.tsx` |
| 34 | Aura | `MisztikusScreen.tsx` |
| 38 | Lovas harc | `harci_helyzetek.yaml`, `taktikak.yaml` |
| 40 | URL Export | `url-share.ts` |
| 41 | Reactive Engine | `reactive.ts`, `reactive-parse.ts`, `rules.json` |
| 42 | Egységes effekt-modell | `effekt.ts`, `extrak-effekt.ts`, `konstansok.yaml` → `effekt_módok` |
| 43 | Fegyver/páncél ár-modell | `fegyver-ar-calc.ts`, `rules.json` (páncél), `konstansok.yaml` → ár-szorzók |
