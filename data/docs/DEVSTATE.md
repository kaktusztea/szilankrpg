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
| Láthatatlan ellenfél | Taktika vs státusz döntés | - |
| Ember (Szigetvilági) | Faj háttér hozzáadása (slan helyett) | - |
| **Fegyver Idea implementáció** ✅ | `idea_default` modell (Modell 2): a fegyver-definíció `idea_default` a standard példány kezdő-Ideája; a v2 harcértékek EZT MÁR tartalmazzák. A felvett példány `idea_default`-ról indul, hangolható (sérülés le / áldás fel). A kalkuláció a `IDEA[példány] − IDEA[idea_default]` DELTÁT alkalmazza (TÉ/VÉ/SP) - `ideaDelta()` pure fn (`harc/shared.ts`), a `fegyver_idea_tabla.json` adja a szint-táblát. Bekötve: Harcértékek fül chip + Harc fül (`buildFegyverRows`/`calcFegyverResults`) + kétkezes harc (`ketkezes.ts`) + **távharc CÉ** (per-fegyver `karakter.távfegyverek[].idea`, a CÉ-be 1:1 delta a `idea_default`-hoz képest, spec §17). Teljes (közelharc + kétkezes + távharc). | harcszimulacio.spec §16/8 |
| Akadályoztatás státuszok | `Fegyver/Pajzs akadályoztatása`, `Páncél akadályoztatása` - `md/082`-ben definiált, `statuszok.yaml`-ban nincs | harcszimulacio.spec §16/9 |
| Fárasztás érték data layerbe | A `3 VÉ` csak `megjegyzés` prózában él (`módosítók: {}`) - séma-bővítés kell | harcszimulacio.spec §16/2 |
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
- MK fegyverek: 2 entry (1K/2K), 1 kártya Harcértékek fülön
- Pattern fájlok: `data/patterns/*_pattern.json` (kézzel szerkesztett md→json konfig, NEM generált); Pajzs hozzáfűzve fegyverek.json-hoz
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
