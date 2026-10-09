# Szilánk RPG - Fejlesztési állapot

> Konvenciók, build, irányelvek → **AGENTS.md**
> Kódtérkép, fájl-felelősségek → **MAP.md**
> Engine formulák → **engine_spec.md** (§1-§42)
> UI viselkedés → **gui_spec.md**

---

## TODO Backlog

| Téma | Leírás | Spec |
|------|--------|------|
| Harc alakzatban | NJK kalkulátor, Alakzat ellen helyzet, taktika tiltások | §28 |
| Méreggenerátor | KM eszköz: méreg paraméterek → komplexitás/Mk szint | §39 |
| Belharc rendszer | Fegyver/harcmodor korlátozás jelzés + puszta kéz override | §21.4 |
| **Fegyver Idea implementáció** ✅ | `idea_default` modell (Modell 2): a fegyver-definíció `idea_default` a standard példány kezdő-Ideája; a v2 harcértékek EZT MÁR tartalmazzák. A felvett példány `idea_default`-ról indul, hangolható (sérülés le / áldás fel). A kalkuláció a `IDEA[példány] − IDEA[idea_default]` DELTÁT alkalmazza (TÉ/VÉ/SP) - `ideaDelta()` pure fn (`harc/shared.ts`), a `fegyver_idea_tabla.json` adja a szint-táblát. Bekötve: Harcértékek fül chip + Harc fül (`buildFegyverRows`/`calcFegyverResults`) + kétkezes harc (`ketkezes.ts`) + **távharc CÉ** (per-fegyver `karakter.távfegyverek[].idea`, a CÉ-be 1:1 delta a `idea_default`-hoz képest, spec §17). Teljes (közelharc + kétkezes + távharc). | harcszimulacio.spec §16/8 |
| Felszerelés → próba-Hátrány | ✅ KÉSZ (2026-10) - l. „Felszerelés funkció" szekció lentebb + engine_spec §15/§33.1. | engine_spec §15/§33.1 |
| **`cél_páncél` VÉ/SFÉ extrák bekötése** ✅ | Az SP-ág kész (Sebzés popup „Ellenfél páncél" választó → `panceltalant_jobban_sebez` +3 SP). A VÉ/SFÉ-hatásúak (`sfe_duplazodik` = Meneth, `pocsek_vedekezo_pancelos_ellen` = Béltépő) az egységes „Extrák" gombon át jelennek meg (§42 2. fázis): a választott ellenfél-páncél kategóriától függő aktív/inaktív státusz + hatás-összefoglaló (numerikus VÉ/SFÉ-alkalmazás nélkül - az a §42 3. fázis). A statikus fegyver-VÉ/SFÉ nem függhet a dobásonként változó ellenfél-páncéltól; a popup-szintű Extrák jelzés a helyes feloldás (korábbi ad-hoc jelölés kivezetve). | STUDY.fegyvergenerator_v2 3g |
| **Egységes effekt-modell** | A fortély `módosítók` (`flat/scaled/override`) és a hatás-operátorok (`szorzó/max_limit/…`) egyesítése EGY effekt-nyelvtanra (alak + mód-enum + precedencia). 1. fázis kész (szabvány + `extrak.yaml` pilot). 2. fázis kész az `extrak.yaml`-re: „Extrák" gomb (aktív/inaktív/KM, `extrak-info-calc.ts`) + §42.3 precedencia-motor (`extrak-effekt.ts`: `alkalmazEffektek`, `aktívHatásokCélra`). Numerikus alkalmazás CSAK teljes korrelációnál: Sebzés popup SP-delta (ellenfél-páncél ismert); hiányos infónál warning (VÉ-csökkentés popup, VÉ-t érintő cél_páncél-extra) + Extrák jelzés. Hátra: a teljes 3. fázis - `calcFortelyMods` + `applyFegyverOverrides` + hatás-operátorok beolvasztása EGY runtime kiértékelőbe (regressziós védőháló kell), és a statikus VÉ/SFÉ-táblák effekt-alkalmazása egy jövőbeli „ellenfél statblokk" nézetben. | §42 |

---

## Fegyver v2 bevezetés - hátralévő tételek

> Kanonikus migrációs dokumentum (részletek, döntések, állapot): **`STUDY.fegyvergenerator_v2.md`** (wiki). Itt CSAK a hátralévő tételek pointer-listája áll, hogy ne duplikálódjon. A v2 "mag" kész: a webapp runtime a `fegyverek_v2.json`-t olvassa (data layer csere 3a, típusok/kalkuláció 3b, reactive context 3e, Sebzés popup + Ellenfél páncél SP-ág 3g, kétkezes harc, lovas követelmények, szabálykönyv `md/` átvezetés - mind kész).

Ami a v2 bevezetésből még hátravan (KIZÁRÓLAG ez a 4):

1. **`cél_páncél` VÉ/SFÉ-hatású extrák** ✅ (Meneth `sfe_duplazodik`, Béltépő `pocsek_vedekezo_pancelos_ellen`) - az SP-ág és a VÉ/SFÉ jelölés-ág is kész (jelölés, nem numerikus levonás). Részletek: a fenti backlog-sor + STUDY 3g.
2. **Fegyver Idea implementáció** ✅ - `idea_default` modell (Modell 2): a példány `idea_default`-ról indul, a delta hat a harcértékre. Teljes: közelharc (TÉ/VÉ/SP) + kétkezes + távharc CÉ (per-fegyver). Részletek: a fenti backlog-sor.
3. **Egységes effekt-modell (§42) 2-3. fázisa** - reactive runtime feltétel→hatás kiértékelés. Részletek: a fenti backlog-sor + STUDY.
4. **Pajzs pipeline kivezetése** ✅ - a webapp már a `fegyverek_v2.json` (pajzs-entryk) + `konstansok.pajzs_hatások` alapon dolgozik (`pancel-calc.ts`, `buildPajzsFegyverNév`); a `pajzsok.json`-t NEM tölti be. Archiválva: `archive/data_fegyverek_v1/{pajzsok.json,pajzs_pattern.json}`. A `sync_fegyvertablazatok.py sync_pajzs()` (fegyverek_fixed.json → 068_09.md szabálykönyv-szinkron) marad, más cél.
5. **Távharc fegyverek v2 adatmodellre** ✅ - a távfegyverek tipizált, kézi v2 JSON-on (`data/sources/fegyverek/tavfegyverek_fixed.json` → `data/gen/fegyverek_v2.py::generate_tavfegyverek_v2` → `data/tables/tavfegyverek_v2.json`). Minden mező numerikus (`SP: -99` sentinel = nincs/spec sebzés; `Hatótáv` → `hatótáv_bázis` + `hatótáv_erő_szorzó`; `sebzésjelleg` enum S/V/Z/spec). A nem-numerikus hatások (halál, spec, SFÉ-dupla, pajzs-VÉ, újratöltés, stb.) a közös `extrak.yaml`-ban (`fegyver_extrak.json`), egységes `tavharc_` prefixű id-kkel. A webapp a v2 táblát tölti, `név`-alapú lookup, nincs `parseInt`. A régi `tavfegyver_pattern.json` + `tavfegyverek.json` archiválva. Idea: a per-fegyver `karakter.távfegyverek[].idea` bekötve a CÉ-be (Modell 2 delta, spec §17) - a korábbi közös UI-only idea-state (ami mindkét fegyver CÉ-jét torzította) kivezetve. **Hátra**: a `process_fegyverek.py` teljes kivezetése (a `data/patterns/` üres, de a `code/lib/`-nek van másik fogyasztója: `generate.markdown.py`). | STUDY.tavharc_v2 |

NEM része a v2 bevezetésnek (külön backlog / más alrendszer): Erő-követelmény mechanika (generátor-balansz), Akadályoztatás státuszok (státusz data-layer), Fárasztás érték (taktika data-layer), balansz `raw`→`final` hangolás (külön backlog), opcionális KM-fejezet + custom fegyver mező (külön backlog).

---

## Harc alakzatban 🚧

Előfeltétel: `md/065_03_harc_alakzatban.md` véglegesítése. Engine spec: §28 (TERV).

Összefoglaló: min 3 – max 20 fő; Támadó/Védekezőszint = MIN(csapat Alakzatharc) + Vezető×2 + MIN(fortély fok)×2. Alakzat TÉ/VÉ = AVG(tagok) + harcmodor_bónusz(szint). Már implementált: Alakzatharc képzettség (max_HM-be számít).

TODO:
- [ ] Alakzat típusok spec_lista bővítés
- [ ] NJK Alakzat kalkulátor (KM eszköz overlay)
- [ ] "Alakzat ellen" helyzet (VÉ csökk mérséklés -2, taktika tiltások)
- [ ] Taktika megkötések: Fárasztó/Kezdeményező/Kiváró/Visszafogott tiltott alakzat ellen

---

## Méreggenerátor 🚧

Forrás: `md/141_meregkeveres_szabalyai.md`. Engine spec: §39 (TERV).

Összefoglaló: Komplexitás = Erősség + Súlyosság + Elállás/Hatóidő + Speciális. Min Mk = MAX(CEIL(Kompl/2), param küszöb). 4 típus (étel/légi/kontakt/fegyver).

Nyitott kérdések: wiki `TODO.meregrendszer` (Alvás kategória, másodlagos hatás, alapanyag köv., érzékelés célszám).

TODO:
- [ ] Konstansok YAML: méreg paraméter táblák
- [ ] Méreggenerátor overlay (KM eszköz)
- [ ] Preset mérgek (144_peldamergek.md)

---

## Felszerelés funkció ✅ (kész, 2026-10)

Forrás: `md/010_03_06_felszereles.md`. Engine spec: §15 / §33.1 (IMPLEMENTÁLVA). Pure: `engine/felszereles.ts` (+ `felszereles.test.ts`). UI: `FelszerelesSection.tsx` (Verziók/Napló overlay) + Harcértékek fül „Felszerelésben" chip + Harc fül fegyver-kiszürkítés (`useFegyverInvalidation`). A régi `felszerelés_mgt`→harckeret út KIVEZETVE (más mechanika, l. refactorlog/2026-10-09.md) - NEM visszateendő. Az alábbi lépés-leírás a megvalósított terv (referencia).

Szabály: **Felszerelés keret = 2 + Erő**. 4 forrás von le pontot (`-1` közepes / `-2` nagy). Ha a keret negatívba csúszik: `-1`→Hátrány-1, `-2`→Hátrány-2, `<-2`→nem harcol + a Fizikai próbadobások automatikus kudarcok. A hatás a Fizikai Tulajdonság-/Képzettségpróbákra megy (próba-EH ág), NEM a harckeretre. KM-mérlegeléses (a sávok default-ok).

### Adat-elérhetőség (vizsgálat eredménye)

| Pontforrás | Megvan? | Hol / teendő |
|---|---|---|
| Páncél (hajlékony -1 / merev -2, 50%+ fedés) | ✅ | `páncél_merev` + `páncél_lefedettség` (reactive) |
| Pajzs (közepes -1 / nagy -2) | ✅ | `PajzsPeldany.méret` |
| Fegyver (másfélkezes/nehéz -1 / kétkezes/súlyos -2) | ⚠️ | `fegyver.súly` NINCS a `fegyverek_v2.json`-ban → generátorba + `FegyverAlap` típusba kell vinni |
| Egyéb cipelt tárgyak | ⚠️ | A séma `felszerelés.nagy_tárgyak[].MGT` EXISTS, de a `MGT` mezőnév ELAVULT (a hatályos szabályban nincs MGT). Átnevezés kell: `nagy_tárgyak`→`tárgyak`, `MGT`→`méret` |

### Megvalósítási lépések

1. **Data réteg** (al-lépések):
   - **1a.** `fegyver.súly` kivitele a runtime táblába: `data/gen/fegyverek_v2.py` emittálja a `súly`-t a `fegyverek_v2.json` fegyver-blokkjába + `FegyverAlap` típus (`types.ts`) bővítés. (A `súly` ma csak a forrás `fegyverek.yaml`-ban van.)
   - **1b.** Kanonikus pont-tábla a `data/sources/konstansok.yaml`-ba (a pipeline-ba kötött fő konstans, a webapp EZT olvassa): `felszerelés_pont` leképezések data-driven - méret→pont (`kicsi:0, közepes:1, nagy:2`), pajzs-méret→pont, páncél-struktúra (hajlékony:1/merev:2)→pont, fegyver-súly→pont (`könnyű,átlagos:0, nehéz:1, súlyos:2`) és fegyver-hossz/forgatás→pont (`egykezes:0, másfélkezes:1, kétkezes:2`), + a páncél-fedés küszöb (`felszerelés_páncél_fedés_min: 50`). A fegyver végső pontja `max(hossz_pont, súly_pont)` (VAGY-VAGY). NE hardcode a webappban. **FONTOS**: ez EGY ÚJ, önálló kanonikus konstans - NEM azonos a `data/sources/fegyverek/konstansok.yaml` balance-almappabeli `fegyverhossz[].felszerelés_pont`-jával (az a tervezői eszközé, nincs a pipeline-ban). A két helyen NE duplikálódjon ellentmondóan: a balance-konstans vagy hivatkozzon az új kanonikusra, vagy a kommentje mondja ki, hogy az csak a hossz-ág (súly nélkül) a tervezői becsléshez.
   - **1c. Elavult hivatkozások javítása** (mind a VAGY-VAGY döntés ELŐTTI, súly-nélküli + harckeret-MGT modellt tükrözi, + megszűnt `md/068_01_13` → ma `068_01_09`):
     - `data/sources/fegyverek/konstansok.yaml` `fegyverhossz[].felszerelés_pont` komment: „KIZÁRÓLAG forgatás, a súly NEM számít" + `068_01_13` → a súly-ág felvételére/VAGY-VAGY-ra + md-link frissítés. (A hossz-ág `felszerelés_pont` értékei maradhatnak, de a webapp a `max(hossz, súly)`-t számolja az 1b tábla alapján.)
     - `data/sources/fegyverek/fegyverek.schema.yaml:38` (hossz mező megjegyzés): `068_01_13` md-link frissítés.
     - `data/sources/fegyverek/konstansok.yaml:125` (`szálfegyver_nyélanyag` tömörszárú „+1 Felszerelés pont") - felülvizsgálat: a súly-tengelybe olvad-e vagy külön pont.
     - `code/balance/fegyvergenerator_fegyverlista.py:136` (FSZ magyarázat): „súly NEM számít" + „1 Felszerelés MGT (-1 TÉ, -1 Harckeret)" → a próba-Hátrány modellre + VAGY-VAGY-ra.
   - **1d.** Build-gate: `python3 generate_tables.py --force` + `data/gen/naming_lint.py` (új `konstansok.yaml` kulcsok naming-ellenőrzése) zöld.

   **NEM érintett (névegyezés, más fogalom):** a képzettség szituációs `kategória: "Felszerelés"` módosítók (alkímia, álcázás, orvoslás, méregkeverés, vajákosság, művészetismeret) + `szazarcu` fortély „Felszerelés" - ezek a próba HELYSZÍNI felszereltségét jelölik (labor, ruha), NEM a cipelt-tárgy keretet. Békén hagyandók.
2. **Séma-migráció** (`karakter.yaml` + `types.ts` + round-trip):
   - **2a.** Kézi tárgyak: `felszerelés.nagy_tárgyak[].MGT` → `felszerelés.tárgyak[].méret` (`'kicsi'/'közepes'/'nagy'`). A kézi sor NEM lehet „nincs" (ha nincs a karakternél, töröljük a sort).
   - **2b.** „Felszerelésben" állapot tárolása:
     - **Fegyver**: ÚJ flag a példányon - `FegyverPeldany.felszerelésben: boolean` (default `true`). Ez a példánnyal mozog (törléskor eltűnik, nincs index-karbantartás - szemben egy külső listával). Ez dönti el, bekerül-e a Felszerelés táblázatba ÉS harcban választható-e.
     - **Pajzs / páncél**: `felszerelés.kizárt_auto: ("pajzs"|"páncél")[]` (ÚJ, default üres) - a KM „nincs"-re állíthatja őket a Felszerelés táblázatban. (Csak e kettőre kell lista; a fegyver a saját flagjét használja.)
   - **2c.** Érintett a migrációban: `NagyTargy`→`FelszerelésTárgy` típus, `FegyverPeldany.felszerelésben: boolean` (ÚJ mező, séma `karakter.yaml` fegyver-blokk + template karakterek), `Karakter.felszerelés` típus (`tárgyak` + `kizárt_auto` csak pajzs/páncél), `url-share.ts` (fegyver-flag + `fl.t` + `fl.kiz` round-trip; a `felszerelésben:true` default-ot tömöríteni lehet - csak a `false`-t kell átvinni), `checkpoint-utils.test.ts`, `empty_karakter.json` + `test_karakter2.json` + `test_karakter3.json`. Backward-compat nem kell.
3. **Pure logika** (új modul, pl. `engine/felszereles.ts`, önteszttel):
   - **3a.** `felszerelésMax(karakter) = 2 + karakter.tulajdonságok.erő` (nyers Erő tulajdonság-érték).
   - **3b.** `felszerelésTerhelés(karakter, data)`: összegzi a pontokat: a `felszerelésben === true` fegyverek (`karakter.fegyverek[]`), a pajzs és a páncél (ha nincs a `kizárt_auto`-ban) + a kézi `felszerelés.tárgyak[]`. Pontképzés az 1b. `konstansok.felszerelés_pont` táblából (fegyver: `max(hossz_pont, súly_pont)`; pajzs: méret; páncél: struktúra, csak ha `aktív_páncél` és `lefedettség ≥ konstansok.felszerelés_páncél_fedés_min`; kézi tárgy: méret). `kicsi`=0. (Döntés eldőlve: MINDEN felvett fegyver auto-sor, az egyenkénti `felszerelésben` flag dönti el, hogy számít-e - l. 5b.)
   - **3c.** `felszerelésHátrány(terhelés, max)`: `túllépés = terhelés − max`; `túllépés ≤ 0`→`{ehSzint:0}`; `=1`→`{ehSzint:-1}`; `=2`→`{ehSzint:-2}`; `>2`→`{ehSzint:-2, autoKudarc:true, nemHarcol:true}`.
   - **3d.** Önteszt: a 3 sáv határai (0/-1/-2) + az `autoKudarc`/`nemHarcol` ág (túllépés >2) + a VAGY-VAGY fegyverpont (Balta: egykezes=0 VAGY nehéz=1 → 1) + a `felszerelésben=false` fegyver kihagyása + pajzs/páncél `kizárt_auto` kihagyása + páncél csak `≥ fedés_min` esetén számít (alatta 0).
4. **Próba-EH integráció** (a `felszerelésHátrány.ehSzint` beinjektálása a Fizikai próbákba, NEM a reactive harckeretbe):
   - **4a.** Képzettségpróba: a Fizikai csoportú próbák EH-jába (`statusz-proba.ts` `calcStátuszPróbaEH` MELLÉ egy felszerelés-forrás, vagy a hívó `kepzettseg-proba-calc.ts`-ben összeadva a `fizikai_próba` csoportra). A clamp `[-2,+2]` a meglévő `clampEHSzint`.
   - **4b.** Tulajdonságpróba: a Fizikai tulajdonságok próba-EH-jába (`proba-common.ts` / `TulajdonsagProbaPopup`). A Fizikai tulajdonságok konstansból: `konstansok.felszerelés_hátrány_tulajdonságok = ["erő", "edzettség", "ügyesség", "gyorsaság", "érzékenység"]` (Intelligencia/Emlékezet/Önuralom nem kap Hátrányt).
   - **4c.** `autoKudarc`/`nemHarcol` megjelenítés az érintett próba-popupokban (a Fizikai próba automatikus kudarc, külön dobás nélkül). KM-mérlegeléses → ez JELZÉS/figyelmeztetés, NEM blokkol kódszinten harci akciót (a KM dönt a következményről). A `nemHarcol` a Felszerelés accordion fejlécében is látszódjon (túlterhelt-jelzés mellett).
5. **UI** (al-lépések):
   - **5a. Felszerelés accordion** a Verziók/Napló/Jegyzetek overlay-ben (`OverlayScreenOverlay.tsx`, a `NaploTab` ELÉ, legfelső elem; új `FelszerelesSection.tsx`, `details.naplo-cp-section` minta). Az overlay az AKTÍV karakterrel dolgozik (`karakter`/`setKarakter` prop) - a Felszerelés az aktív karaktert szerkeszti (nem NJK-switcher kontextus).
     - Fejléc (summary): `Felszerelés  Max: X / Aktuális: Y` (X=max keret `2+Erő`, Y=aktuális terhelés). Vizuális jelzés ha `Y > X` (túlterhelt).
     - Táblázat: **név** | **méret**. A méret chip → overlay popup picker (createPortal, Escape zár, kiválasztás=bezárás). A picker tartalma SOR-TÍPUS-függő (2 mód): auto-sornál `{nincs, fix-érték}` (2 opció), kézi sornál `{nincs, kicsi, közepes, nagy}` (ahol „nincs" = sor törlése). "kicsi"=0 pont (végtelen lehet).
     - Fegyverek/pajzs/páncél AUTO sorként, read-only névvel; a méret chip csak `nincs` ↔ a tárgy FIX értéke közt vált (a fix érték az 1b. tábla szerint). A `nincs` választás: FEGYVERNÉL a `FegyverPeldany.felszerelésben=false`-ot állítja (szinkronban az 5b chippel), PAJZS/PÁNCÉLNÁL a `felszerelés.kizárt_auto`-ba írja/törli.
     - Kézi sorok: szabad `név` + teljes picker (`kicsi/közepes/nagy`), tárolás `felszerelés.tárgyak[]`. (A kézi sornál a „nincs" = a sor törlése.)
     - Mindig 1 üres sor alul; ha a `név`-be írnak, új üres sor nyílik alatta.
   - **5b. Harcértékek fül - „Felszerelésben" chip** a fegyver-példányoknál (`HarcertekekFegyverChip.tsx` / `HarcertekekFegyverekSection.tsx`): ÚJ chip „Felszerelésben: igen/nem", kattintásra negál (`FegyverPeldany.felszerelésben` toggle, undo-wrapped). „igen" → bekerül a Felszerelés táblázatba; „nem" → kikerül. (Egy igazságforrás az 5a fegyver-sorával: ugyanaz a flag.)
   - **5c. Harc fül - fegyverválasztó** (`UgyesebbKezSelect.tsx` / `GyengebbKezSelect.tsx` → `FegyverSelectField.tsx`): a `felszerelésben===false` fegyverek szürküljenek ki (disabled/strike a select-opcióban). Ha egy épp AKTÍV fegyvert állítanak „nem"-re (akár az 5b chipen, akár az 5a táblában), a Harc fül essen vissza Puszta kézre: `aktív_fegyver_index`/`aktív_fegyver_bal_index` reset (-1), `kétkezes_harc=false`, `fegyverfogás='egyfegyveres'` - a `removeFegyver` session-takarítás mintájára (`useKarakterMutators.ts`). Közös invalidáló helper (hasonló a `useTaktikaInvalidation`-höz) ajánlott.
6. **Spec/dok**: engine_spec §15/§33.1 TODO→kész; gui_spec UI-leírás; DEVSTATE backlog "Felszerelés → próba-Hátrány" lezárása; MAP.md (`FelszerelesSection.tsx` + pure modul); refactorlog (séma-migráció csapdái: url-share + checkpoint).

### Eldöntött döntések

1. ✅ Fejléc: `Max: X / Aktuális: Y`, ahol **X = max keret** (`2 + Erő`), **Y = aktuális terhelés** (felhasznált pontok összege). Hátrány ha `Y > X`; a túllépés mértéke (`Y − X`) adja: 1→Hátrány-1, 2→Hátrány-2, >2→nem harcol + Fizikai próbák auto kudarc.
2. ✅ Fegyver fix pontja: **VAGY-VAGY** (`md/010_03_06`: „Másfélkezes VAGY súly:nehéz" → -1; „Kétkezes VAGY súly:súlyos" → -2). Pontszám = `max(hossz_pont, súly_pont)` (a magasabb kategória nyer): hossz (forgatás) egykezes:0/másfélkezes:1/kétkezes:2; súly könnyű,átlagos:0/nehéz:1/súlyos:2. Pl. Balta (egykezes=0 VAGY nehéz=1) → 1.
3. ✅ Páncél, pajzs, fegyverek AUTO read-only sorként kerülnek a táblázatba (a méret-chip `nincs` ↔ fix érték közt vált).
4. ✅ „Fizikai tulajdonság" lista (a felszerelés-Hátrány célja a Tulajdonságpróbánál): **Erő, Edzettség, Ügyesség, Gyorsaság, Érzékenység** (Intelligencia/Emlékezet/Önuralom NEM). Konstans: `konstansok.yaml` → `felszerelés_hátrány_tulajdonságok: ["erő", "edzettség", "ügyesség", "gyorsaság", "érzékenység"]` (NE hardcode).
5. ✅ Fegyver „számít-e" eldöntése: a `FegyverPeldany.felszerelésben` flag (default igen), a Harcértékek fülön chip-pel toggle-elhető (5b). „nem" → kikerül a Felszerelés táblából ÉS a Harc fül fegyverválasztóiban kiszürkül; ha épp aktív, a Harc fül Puszta kézre esik vissza (5c). Pajzs/páncél a `kizárt_auto` listával (csak e kettő).

### Végrehajtási sorrend / függőség

1 (data) → 2 (séma) párhuzamos; **3 (pure logika) függ 1b+2-től**; **4 (próba-EH) függ 3-tól**; **5 (UI) függ 2+3-tól**; 6 (spec/dok) a végén. Minden lépés után `npm run build` (527+ teszt + typecheck) zöld a „kész" kritérium; a 3. lépés önteszttel.

---

## Fontos adatmodell összefoglaló

### Karakter séma (v2)
- Egyetlen JSON (`karakter + session`), NEM tartalmaz számított értékeket
- `session`: runtime harc state (vé_csökkenés, aktív_taktikák, fegyverfogás, stb.)
- `előtörténet`: biográfiai mezők (`{ származás_helye, szociális_érzék, külső, előtörténet }`) - Előtörténet overlay (🪪)
- `checkpoints[]`: kiemelt karakter verziók (snapshot-alapú, → engine_spec §31b)
- Multi-slot localStorage: `szilank_char_{uid}`, max 16 slot (ebből max 10 NJK)
- Teszt karakter: `data/karakter/test_karakter2.json` (single source of truth)

### Képzettségek
- `többszörös`: `[]`=egyszeri, `["X","Y"]`=fix lista, `["*"]`=freetext
- Harci → Harcértékek fül; Misztikus → Misztikus fül; többi → Tul/Képz

### Fortélyok
- Tárolás: `{ név, fok, spec_típus, spec_elem, kiérdemelt? }` - név = alapnév
- Locked: Mesterfegyver, Pajzshasználat, Merevvértviselet
- Módok: flat, scaled, override, enyhít, előny, hátrány
- Részletek → engine_spec §16, §16.1, §24, §25

### Fegyverek / Páncél
- Egy fegyvernek EGY rekordja van (nincs külön 1K/2K entry); a variánsokat a `módok[]` tartja. Mesterfegyver fok a példányon.
- Fegyver v2 pipeline (lásd a következő szekciót); a régi v1 (`data/patterns/*_pattern.json`, `fegyverek.json`, pajzs-hozzáfűzés) KIVEZETVE, archiválva (`archive/data_fegyverek_v1/`).
- Részletek → engine_spec §5-§13, §26-§27

### Fegyver v2 adatmodell
- Runtime tábla: `data/tables/fegyverek_v2.json` (webapp ezt olvassa). Generátor: `data/gen/fegyverek_v2.py`, build-gate-be kötve. Mátrix + extrák: `data/tables/sebzesjelleg_pancel_matrix.json`, `data/tables/fegyver_extrak.json`.
- Fegyver = `módok[]` (a régi flat `FegyverAlap` HELYETT). Egy `FegyverMod`: aktor, jelleg, sebzéstípus (S/V/Z), TÉ, VÉ, SP, Átütés, Sebesség, Forgatás, Erőlimit, FP. Van elsődleges és opcionális másodlagos mód.
- Fegyverhossz-kategória skála: egész értékek (a jelenlegi táblában -1..12 tartomány). A régi "penge" (0.5 egységek) modell KIVEZETVE.
- Kétkezes harc limitek (`konstansok.yaml`): `kétkezes_harc_max_egy_fegyver: 3` (per-fegyver fegyverhossz plafon) + `kétkezes_harc_max_fegyverméret: 6` (két fegyver össz fegyverhossza) + `kétkezes_harc_fegyverlevonás_osztó: 2` (harckeret-levonás = `floor(összFegyverhossz / 2)`). Motor: `engine/ketkezes.ts`.
- Fegyverviszony küszöb: Fegyverelőny/Fegyverhátrány 2 fegyverhossz-kategória különbségnél áll be (Fegyverazonosság a semleges eset).
- Részletek → engine_spec §5-§13, §26-§27

### Taktikák / Helyzetek
- Kombó: `kombó_mód` + `kombó_lista`; Megkötés: `harci_helyzet/tiltott|szükséges`
- Helyzet: `kizár_helyzetek` (id), `tiltott_fegyverfogások`, `tiltja_taktikákat`
- Részletek → engine_spec §21

### Reactive Engine
- 53 szabály `data/rules.json`
- Maradék TS: Fájdalomtűrés, Kétkezes harc, Fortély mods, Taktika mods
- Részletek → engine_spec §41

### Build pipeline
- `generate_tables.py`: belépési pont (CLI + freshness + sorrend), a generátorok a `data/gen/` csomagban (Vite buildStart + prebuild)
  - `gen/common.py` (útvonalak, YAML/JSON I/O, magyar rendezés) · `gen/cache.py` (hash-alapú skip) · `gen/schema.py` (séma validáció) · `gen/{konstansok,kepzettsegek,fortelyok,fajok,aktiv_ful}.py` · `gen/validators.py` (referenciális ellenőrzések)
  - **Séma validáció**: minden source entitás kulcshalmazát a `schemas/*.yaml`-hoz méri (ismeretlen kulcs / hiányzó kötelező mező → build hiba). Kötelezőség a séma megjegyzéseiből: `# opcionális` → elhagyható, `# generált` → a generátor adja hozzá
  - Hash-alapú skip: ha a YAML source-ok nem változtak, automatikusan kihagy (`tables/.sources_hash`)
  - Marker fájl: `tables/.generated_marker` - Vite plugin ezt nézi freshness check-hez
  - `--force` flag: kényszerített újragenerálás (`python3 generate_tables.py --force`)
- `vitest run`: 227 unit teszt (31 fájl); build előtt fut
- Deploy: GitHub Pages, auto-deploy push master
- Metadata: `ÉV.ÉVNAPJA.napibuild` - a `public/metadata.json` és a bundle `__APP_VERSION__` ugyanabból a fájlból jön (egy build = egy verzió)

### Cache / friss verzió (GitHub Pages)

A Pages `Cache-Control: max-age=600`-at ad az `index.html`-re, és **nem** engedi headert állítani. Két védelem:
1. **Adat cache-busting**: minden runtime JSON kérés `?v={APP_VERSION}`-nel megy (`data-loader.ts`) → deploy után sosem jön régi tábla új bundle-hez.
2. **Verzió-ellenőrzés indításkor** (`engine/version-check.ts`, `main.tsx`): `metadata.json` `no-store` kéréssel; ha a szerver verziója ≠ a bundle verziója, a böngésző elavult HTML-t szolgált ki → egyszeri, `?v=`-vel cache-kerülő újratöltés, a `#hash` (megosztott karakter) megőrzésével. Loop védelem: sessionStorage (`szilank_reload_version`), 1s timeout, hibánál csendben tovább. A `?v=` utána `replaceState`-tel eltűnik a címsorból.

Korlát: a 2. pont kódja az ÚJ bundle-ben él, tehát egy már beragadt (elavult HTML-t futtató) klienst nem gyógyít meg visszamenőleg - ott egyszeri hard refresh kell. A HTML cache teljes kikapcsolásához CDN kell a Pages előtt.

### Build scriptek

A natív Linux fájlrendszeren (`/repo/github/szilank.code/`) a teljes build ~18s, ezért **mindig `npm run build`-et használunk** (nincs szükség inkrementális variánsokra).

| Script | Mikor használd | Idő |
|--------|---------------|-----|
| `npm run build` | **Mindig ezt használd** - teljes: test + typecheck + bundle | ~18s |
| `npm run build:fast` | Elérhető, de nem használjuk (tesztek nélkül) | ~8s |
| `npm run build:changed` | Elérhető, de nem használjuk (git-based teszt szűrés) | ~10s |
| `npm run test` | Csak tesztek futtatása (build nélkül) | ~5s |
| `npm run test:changed` | Elérhető, de nem használjuk | ~2s |
| `npm run generate` | YAML→JSON generálás (skip ha nincs változás) | ~0.5s / ~3s |

Inkrementális működés:
- **TypeScript**: `incremental: true` + `tsBuildInfoFile` → változatlan fájlok skip
- **generate_tables.py**: MD5 hash az összes YAML source + a teljes generátor kód (`generate_tables.py` + `gen/*.py`) alapján
- **Vite plugin**: `tables/.generated_marker` mtime vs a source YAML-ok ÉS a generátor `.py` fájlok mtime-ja
- **vitest --changed**: git diff-ből határozza meg az érintett teszteket
