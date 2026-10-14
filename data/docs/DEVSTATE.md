# Szilánk RPG - Fejlesztési állapot

> Konvenciók, build, irányelvek → **AGENTS.md**
> Kódtérkép, fájl-felelősségek → **MAP.md**
> Engine formulák → **engine_spec.md** (§1-§42)
> UI viselkedés → **gui_spec.md**

## Tartalom

- [Nyitott tételek (áttekintés)](#nyitott-tételek-áttekintés)
- [Egységes effekt-modell](#egységes-effekt-modell-) 🚧
- [Szorzók kezelése (megbeszélés alatt)](#szorzók-kezelése--megbeszélés-alatt) 🚧
- [Belharc rendszer](#belharc-rendszer-) 🚧
- [Fegyverek: hangolás és utómunka](#fegyverek-hangolás-és-utómunka-) 🚧
- [Harc alakzatban](#harc-alakzatban-) 🚧
- [Méreggenerátor](#méreggenerátor-) 🚧
- [Fontos adatmodell összefoglaló](#fontos-adatmodell-összefoglaló)
- [Szabálykönyv (md/) konvenciók, tanulságok](#szabálykönyv-md-konvenciók-tanulságok)
- [Elkészült](#elkészült-) ✅

---
## Nyitott tételek (áttekintés)

- **Egységes effekt-modell** (§42) - 2. fázis befejezése, 3. fázis (egy runtime kiértékelő)
- **Szorzók kezelése** - a ×2 duplázók halmozódási szabályának eldöntése (megbeszélés alatt)
- **Belharc rendszer** (§21.4) - Puszta kéz belharci értékei + korlátozás-jelzés
- **Fegyverek: hangolás és utómunka** - paraméter-hangolási javaslat (jóváhagyásra vár), `raw`→`final`, custom fegyver, ár-modell
- **Harc alakzatban** (§28) - NJK kalkulátor, "Alakzat ellen" helyzet, taktika tiltások
- **Méreggenerátor** (§39) - KM eszköz

---
## Egységes effekt-modell 🚧

Engine spec: §42 (TERV), fázisterv: §42.5. Cél: a fortély `módosítók` (`flat/scaled/override`) és a hatás-operátorok (`szorzó/max_limit/…`) egyesítése EGY effekt-nyelvtanra (alak + mód-enum + precedencia).

Állapot:
- **1. fázis - Szabvány** ✅: §42 + a pilot `extrak.yaml`.
- **2. fázis - Adat-migráció** (részben): az `extrak.yaml`-re kész - „Extrák" gomb (aktív/inaktív/KM, `extrak-info-calc.ts`) + §42.3 precedencia-motor (`extrak-effekt.ts`: `alkalmazEffektek`, `aktívHatásokCélra`). Numerikus alkalmazás CSAK teljes korrelációnál: Sebzés popup SP-delta (ellenfél-páncél ismert); hiányos infónál warning (VÉ-csökkentés popup, VÉ-t érintő cél_páncél-extra) + Extrák jelzés.
- **3. fázis - Kód**: hátra.

TODO:
- [ ] 2. fázis befejezése: a fortély `módosítók` és a `hatasok.yaml` átállítása a közös alakra (egylépéses, nincs backward-compat)
- [ ] 3. fázis: `calcFortelyMods` + `applyFegyverOverrides` + hatás-operátorok beolvasztása EGY runtime kiértékelőbe (§42.3 precedencia)
- [ ] Előfeltétel a 3. fázishoz: regressziós védőháló (meglévő fortély-mods tesztek + új precedencia-tesztek)
- [ ] Statikus VÉ/SFÉ-táblák effekt-alkalmazása egy jövőbeli „ellenfél statblokk" nézetben

Kapcsolódik: „Szorzók kezelése" (a passzív `vé_veszteség` duplázók bekötése ugyanebbe a láncba).

---
## Szorzók kezelése 🚧 (megbeszélés alatt)

Egyetlen VÉ-levonási tengelyen (`vé_csökkentés` = aktív/támadó oldal, `vé_veszteség` = passzív/védekező oldal - ugyanaz az érték, két nézőpont) több ×2-es duplázó egyszerre fennállhat. Eldöntendő, hogyan halmozódnak:

- **a.) Szorzók egymást szorozzák** (×2 · ×2 = ×4)
- **b.) Szorzók összeadódnak** (×2 + ×2 → ×3, azaz `1 + Σ(szorzó-1)`)
- **c.) Legnagyobb szorzó számít** (×2)

### Jelenlegi kód-állapot

`components/harc/ve-csokkentes-calc.ts` → `calcVéCsökkentésSzorzó` MA az **a.) szorzás**-t csinálja, de KIZÁRÓLAG a taktika `hatások` (`cél: vé_csökkentés`, `hatás: szorzó`) forráson belül. A passzív `vé_veszteség` + `operátor: duplázás` (helyzet/státusz) duplázók NINCSENEK bekötve ebbe a szorzat-láncba. Ha a döntés az a.) marad, a passzív oldalt is ugyanabba a láncba kell húzni (egységes effekt-modell, §42 kapcsolat).

### Halmozódás-források (data layer, Távharc nélkül)

| Forrás | Elem | Cél |
|--------|------|-----|
| Taktika (`taktikak.yaml`) | Roham, Öngyilkos roham | `vé_csökkentés` ×2 |
| Harci helyzet (`harci_helyzetek.yaml`) | Földön fekve, Helyhez kötve, VÉ kiterjesztése másra | `vé_veszteség` ×2 |
| Státusz (`statuszok.yaml`) | Kimerültség fok 2 (Kimerültség), fok 3 (Elcsigázottság) | `vé_veszteség` ×2 |

### Kizárási korlátok (mi állhat EGYSZERRE)

- **Taktika-oldal: mindig csak 1 ×2.** Roham és Öngyilkos roham is "❌ Más taktikával együtt" (md/065_02) - egymást és minden más taktikát kizárnak.
- **Helyzet-oldal: max 2 ×2.** Földön fekve kölcsönösen kizárja Helyhez kötve + VÉ kiterjesztése; Helyhez kötve + VÉ kiterjesztése viszont NEM zárja egymást (md/065_03_02, md/065_03_03). Marad: Helyhez kötve + VÉ kiterjesztése.
- **Státusz-oldal: max 1 ×2.** A Kimerültség egyetlen `többszörös: false` státusz-sor, egyszerre egy fok.
- **Gyakorlati maximum: 4 db ×2 egyszerre** (1 taktika + 2 helyzet + 1 státusz-fok).

### Igazolt példák (a 3 szabály eltérő eredménye)

| Eset | a.) szoroz | b.) összead | c.) legnagyobb |
|------|-----------|-------------|----------------|
| Roham + Helyhez kötve | ×4 | ×3 | ×2 |
| Öngyilkos roham + Elcsigázottság | ×4 | ×3 | ×2 |
| Roham + Helyhez kötve + VÉ kiterjesztése | ×8 | ×4 | ×2 |
| Roham + Elcsigázottság + Helyhez kötve + VÉ kiterjesztése | ×16 | ×5 | ×2 |

A tét: a.) a szélső esetben ×16 (brutális), b.) ott is kezelhető (×5), c.) mindig fix ×2.

---
## Belharc rendszer 🚧

Engine spec: §21.4 ("Belharc rendszer összefoglaló"). Kész: a Belharci helyzet (Aktív fül), a nem belharcos fegyverek `TÉ`/`VÉ` = 0 nullázása (`harci_helyzetek.yaml` → `fegyver_override`, `fegyver-calc.ts`), a Belharcos fortély feltételes bónuszai, a belharcos manőverek előfeltétele.

TODO:
- [ ] Puszta kéz belharcban: a v2 adatban külön rekord él (`Puszta kéz, belharcban`, `TÉ`/`VÉ`/`SP` = 0), de a webapp nem cseréli rá a Puszta kezet Belharci helyzetben (a `fegyver_override` feltétele `fegyverhossz > 0`, a Puszta kéz hossza 0 → marad `TÉ`:-3, `VÉ`:-3, `SP`:-5)
- [ ] Korlátozás-jelzés: a belharcos oldal feltételeinek (Közelharc harcmodor, max 0 fegyverhossz) UI-jelzése

---
## Fegyverek: hangolás és utómunka 🚧

Utómunka (a v2 bevezetés lezárult, l. "Elkészült"):
- [ ] Balansz `raw` → `final`: mind a 68 fegyver `state: raw` (a `fegyverek.yaml` `state` mezője a mérőszám). Eszközök: `code/balance/` szimulátor + taktikai AI, l. wiki `STUDY.fegyvergenerator_harcszimulacio`.
- [ ] Custom (egyedi, generált) fegyver a karakterben: `fegyverek[].custom` séma-mező + build-time vagy runtime kiértékelés (nyitott döntés) - wiki `STUDY.fegyvergenerator_v2` 4a.
- [ ] Ár-modell: paraméter-alapú alapár (fegyverhossz / anyag / Idea szorzókból) - a JSON `ár` mező ma placeholder (`null`).

### Bemenő paraméterek hangolása (javaslat, jóváhagyásra vár)

Forrás: `data/sources/fegyverek/fegyverek.yaml` (WORK paraméterek). Szempontok: középkori fegyverismeret + más fantasy RPG-k konvenciói, a Szilánk Fegyvergenerátor modelljén belül (`code/balance/fegyvergenerator_balansz.py` `modok()`), a Fegyver extrák (`extrak.yaml`) és a Felszerelés pont (`max(hossz-pont, súly-pont)`, `md/010_03_06`) figyelembevételével.

Az értékek Erő=0 bázisértékek, a generátorral kiszámolva (előtte → utána).

#### A) Ellentmondások (javítás javasolt)

1. **Szigony, egykezes: `hossz` 5 → 3.** A neve egykezes, de a hossz 5 másfélkezes forgatást ad (+ fölösleges "1 kézzel" mód).
```
előtte  másfélkezes  TÉ5 VÉ5 SP+8 Seb7 (+ 1 kézzel)
utána   egykezes     TÉ3 VÉ3 SP+7 Seb7
```
2. **Csatabárd, kétkezes: `hossz` 5 → 7, `akadály` 2 → 1.** Most másfélkezes, "1 kézzel" móddal. A dán bárd / bárdis 1,5 m fölötti, kétkezes kategória (a hossz 7 a Beszorítható extrát is hozza).
```
előtte  másfélkezes  TÉ5 VÉ5 SP+7 Át2 Seb10 (+ 1 kézzel)
utána   kétkezes     TÉ7 VÉ7 SP+8 Át2 Seb11
```
3. **Harci kalapács: ma azonos a Buzogány, kétkezes-sel.** A harci kalapácsnak (bec de corbin, lucerni kalapács) tüskés hátoldala is van: második aktor `lándzsahegy-rövid-keskeny`, `akadály` 2 → 1.
```
utána  zúzó   TÉ7 VÉ5 SP+9 Át0 Seb10  (elsődleges, változatlan)
       szúró  TÉ7 VÉ7 SP+7 Át4 Seb10  (másodlagos, páncéltörő)
```
4. **Tőr, páncélszúró: Átütés 0.** A rondel / misericorde a páncél réseinek áttörésére készült: aktor `pengehegy-tőr` → `pengehegy-kard`. Opcionálisan + `pontos` extra (Precíz támadás).
```
előtte  TÉ3 VÉ3 SP+4 Át0  →  utána  TÉ3 VÉ3 SP+5 Át1
```
5. **Akadály egységesítése.** A hossz 7 körül vegyesen 1 és 2 szerepel. A 2 ("csak szekéren szállítható") az alabárdra / pikára illik, a kétkezes kardot vállon hordták: Kard, kétkezes 2 → 1 (Csatabárd, kétkezes és Harci kalapács: fent). Alabárd, Pika marad 2.

#### B) Realisztikusabbá tétel

6. **Csatacsákány: `súly` nehéz, `akadály` 1 → 0, második aktor `buzogányfej-tompa`.** Az egykezes harci csákány nehéz fejű, jellemzően kalapácshátú; az akadály 1 a schema szerint a lándzsa jellegűeké.
```
utána  szúró  TÉ3 VÉ3 SP+5 Át4 Seb8  (elsődleges)
       zúzó   TÉ3 VÉ1 SP+6 Át0 Seb8
       Felsz. 0→1, Erő-követelmény 2
```
7. **Buzogány, láncos: `súly` átlagos → nehéz.** Ugyanaz a buzogányfej láncon - nem lehet könnyebb az egykezes (nehéz) buzogánynál.
```
előtte  SP+6 Seb8, Felsz. 0  →  utána  SP+7 Seb9, Felsz. 1, Erő-köv. 2
```
8. **Kard, rapír: második aktor `vágóél-egyenes-átlagos` → `-rövid`, + `pontos`, + `zuzo_ellen_rosszabb`.** A rapír éle gyenge, ma mégis a vágómód adja a jobb `TÉ`/`VÉ`-t; precíziós szúrófegyver (mint a Tőrkard), a vékony penge rossz nehéz ütés hárítására.
```
vágómód  előtte TÉ6 VÉ6 SP+5  →  utána TÉ5 VÉ5 SP+4
```
9. **Szigony (egykezes, kétkezes): + `beakadas_kockazat`.** A szakállas hegy pontosan erre való.

#### C) Döntésre vár (nem módosítandó jóváhagyás nélkül)

10. **Ostor, Ostorkard: `hossz` 9 → kétkezes forgatás, Felsz. 2.** Mindkettő egykezes fegyver. Modell-korlát: a forgatás a hosszból jön, nincs "hosszú, de egykezes" kategória. A hossz 5 `TÉ`:-4 veszteség + fölösleges "1 kézzel" mód. Lehetőségek: marad / hossz 5 / felülírható `forgatás` mező (`konstansok.yaml` + séma bővítés).
11. **Erőbónusz-limit 0: Dzsambia, Rövid bot.** Hasonló fegyvereknél 2 (Kés, Furkós bot); bunkónál, ívelt tőrnél az erőnek számítania kell → mindkettő 2. A Béltépő 0-ja marad (a Pocsék védekező extrával tudatos csomag).
12. **Gyanús limitek (csak jelezve):** Kard, kígyó: 1; Kard, szablya: 4; Buzogány, egykezes és tollas: 4. A régi táblából jönnek; ha nincs mögöttük setting-indok, inkább 99 vagy 3.

#### Szándékosan érintetlen

Szilánk-specifikus fegyverek (Slan, Mara-sequor, Pugoss, Ramiera, Emrelin, Meneth), a teszt-minták (Naginata, Wakizashi), a `state` mező (marad `raw`).

#### Végrehajtáskor

- `fegyverek.yaml` módosítás → az `update_fegyvertablazat.yml` workflow (önteszt-kapu + `sync_fegyvertablazatok.py`) újragenerálja a `md/068_0x` táblákat; lokálisan is futtatható.
- Változik a `data/tables/fegyverek_v2.json` → `npm run build` (vitest is); az érintett fegyverekre épülő golden tesztek frissítendők.
- A balansz-önteszt regressziós elvárásait (`teszt.elvart`) egyik javaslat sem érinti.

---
## Harc alakzatban 🚧

Előfeltétel: `md/065_04_harc_alakzatban.md` véglegesítése. Engine spec: §28 (TERV).

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
- Egyetlen JSON (`karakter + session`), NEM tartalmaz számított értékeket. Séma: `data/schemas/karakter.yaml`, típus: `engine/types.ts`
- `session`: runtime harc state (vé_csökkenés, aktív_taktikák, fegyverfogás, stb.)
- `előtörténet`: biográfiai mezők (`{ származás_helye, szociális_érzék, külső, előtörténet }`) - Előtörténet overlay (🪪)
- `felszerelés`: kézi tárgyak (`tárgyak[]`, `méret`) + `kizárt_auto` (pajzs/páncél); a fegyver a saját `felszerelésben` flagjét használja (→ engine_spec §15)
- `napló[]`, `jegyzetek`: kaland-bejegyzések, szabad jegyzet (Verziók/Napló/Jegyzetek overlay)
- `checkpoints[]`: kiemelt karakter verziók (snapshot-alapú, → engine_spec §31b)
- Multi-slot localStorage: `szilank_char_{uid}`, max 16 slot, ebből max 10 NJK (`ui-constants.ts`: `MAX_KARAKTER_DB`, `MAX_NJK_DB`)
- Template / teszt karakterek: `data/karakter/` (`empty_karakter.json`, `test_karakter2.json` = single source of truth, `test_karakter3.json`)

### Képzettségek
- `többszörös`: `[]`=egyszeri, `["X","Y"]`=fix lista, `["*"]`=freetext
- Harci → Harcértékek fül; Misztikus → Misztikus fül; többi → Tul/Képz

### Fortélyok
- Tárolás: `{ név, fok, spec_típus, spec_elem, kiérdemelt? }` - név = alapnév
- Locked (a Harcértékek fülről kezelt): Mesterfegyver, Pajzshasználat, Merevvértviselet
- Effekt-módok (`konstansok.yaml` → `effekt_módok`, build-validált, §42.2): `flat`, `szorzó`, `scaled`, `override`, `max_limit`, `előny`, `hátrány`, `enyhít`, `letilt`, `szöveges`
- Részletek → engine_spec §16, §16.1, §24, §25, §42

### Fegyver v2 adatmodell
- Runtime táblák (a webapp ezeket olvassa): `data/tables/fegyverek_v2.json` (76 közelharci fegyver + pajzsok), `data/tables/tavfegyverek_v2.json` (28 távfegyver), `sebzesjelleg_pancel_matrix.json`, `fegyver_extrak.json`. Generátor: `data/gen/fegyverek_v2.py` (build-gate).
- Források: `data/sources/fegyverek/` - `fegyverek.yaml` (WORK paraméterek, a generátor modellen át), `fegyverek_fixed.json` (kézzel írt kivételek: Garott, hárítók, Kopják, pajzsok - `aktor: "kivétel"`), `tavfegyverek_fixed.json`, `extrak.yaml`, `konstansok.yaml`, mátrix.
- Egy fegyvernek EGY rekordja van (nincs külön 1K/2K entry). `FegyverAlap`: név, kategória, fegyverhossz, akadály, súly, övön_hordható, ár (ma `null`), idea_default, erő_követelmény, extrák, `módok[]`. Mesterfegyver fok és Idea a karakter-példányon.
- `FegyverMod` (aktoronként egy): aktor, jelleg (`zúzó` / `szúró` / `vágó-egyenes` / `vágó-íves`), sebzéstípus (`elsődleges` = 1. aktor / `másodlagos` = a többi), TÉ, VÉ, SP, Átütés, Sebesség, Forgatás, Erőlimit, FP. A másfélkezes fegyver minden aktorához egy `másfélkezes · 1 kézzel` mód is tartozik (max 4 mód / fegyver).
- Fegyverhossz-kategória: egész skála `0`-`12` (generált fegyverek: 0, 1, 2, 3, 5, 7, 9, 12); a fixed rétegben `-1` = speciális (Garott) és `4` (Kopják).
- Kétkezes harc limitek (`konstansok.yaml`): `kétkezes_harc_max_egy_fegyver: 3` (per-fegyver fegyverhossz plafon) + `kétkezes_harc_max_fegyverméret: 6` (két fegyver össz fegyverhossza) + `kétkezes_harc_fegyverlevonás_osztó: 2` (harckeret-levonás = `floor(összFegyverhossz / 2)`). Motor: `engine/ketkezes.ts`.
- Fegyverviszony küszöb: Fegyverelőny/Fegyverhátrány 2 fegyverhossz-kategória különbségnél áll be (Fegyverazonosság a semleges eset).
- A régi v1 (`data/patterns/*_pattern.json`, `fegyverek.json`, `pajzsok.json`, `tavfegyverek.json`) KIVEZETVE, archiválva (`archive/data_fegyverek_v1/`).
- Részletek → engine_spec §5-§13, §17, §26-§27

### Taktikák / Helyzetek
- Taktika (`taktikak.yaml`, 19 db): kombó (`kombó_mód` + `kombó_lista`), `megkötések`, `hatások` (pl. `vé_csökkentés`), fokozatos taktikák (`fokozatos` + `fokok`)
- Harci helyzet (`harci_helyzetek.yaml`, 40 db): `kizár_helyzetek` (id), `tiltott_fegyverfogások`, `tiltja_taktikákat`, `fegyver_override` (pl. Belharc: fegyver `TÉ`/`VÉ` = 0), `hatások`
- Részletek → engine_spec §21

### Reactive Engine
- 51 szabály `data/rules.json`
- Maradék TS: Fájdalomtűrés, Kétkezes harc, Fortély mods, Taktika mods
- Részletek → engine_spec §41

### Build pipeline
- `generate_tables.py`: belépési pont (CLI + freshness + sorrend), a generátorok a `data/gen/` csomagban (Vite buildStart + prebuild)
  - `gen/common.py` (útvonalak, YAML/JSON I/O, magyar rendezés) · `gen/cache.py` (hash-alapú skip) · `gen/schema.py` (séma validáció) · `gen/{konstansok,kepzettsegek,fortelyok,fajok,aktiv_ful,fegyverek_v2}.py` · `gen/validators.py` (referenciális ellenőrzések) · `gen/naming_lint.py` (YAML naming build-gate)
  - **Séma validáció**: minden source entitás kulcshalmazát a `schemas/*.yaml`-hoz méri (ismeretlen kulcs / hiányzó kötelező mező → build hiba). Kötelezőség a séma megjegyzéseiből: `# opcionális` → elhagyható, `# generált` → a generátor adja hozzá
  - Hash-alapú skip: ha a YAML source-ok nem változtak, automatikusan kihagy (`tables/.sources_hash`)
  - Marker fájl: `tables/.generated_marker` - Vite plugin ezt nézi freshness check-hez
  - `--force` flag: kényszerített újragenerálás (`python3 generate_tables.py --force`)
- `vitest run`: 560 unit teszt (67 fájl); build előtt fut
- Deploy: GitHub Pages, auto-deploy push master
- Metadata: `ÉV.ÉVNAPJA.napibuild` - a `public/metadata.json` és a bundle `__APP_VERSION__` ugyanabból a fájlból jön (egy build = egy verzió)

### Cache / friss verzió (GitHub Pages)

A Pages `Cache-Control: max-age=600`-at ad az `index.html`-re, és **nem** engedi headert állítani. Két védelem:
1. **Adat cache-busting**: minden runtime JSON kérés `?v={APP_VERSION}`-nel megy (`data-loader.ts`) → deploy után sosem jön régi tábla új bundle-hez.
2. **Verzió-ellenőrzés indításkor** (`engine/version-check.ts`, `main.tsx`): `metadata.json` `no-store` kéréssel; ha a szerver verziója ≠ a bundle verziója, a böngésző elavult HTML-t szolgált ki → egyszeri, `?v=`-vel cache-kerülő újratöltés, a `#hash` (megosztott karakter) megőrzésével. Loop védelem: sessionStorage (`szilank_reload_version`), 1s timeout, hibánál csendben tovább. A `?v=` utána `replaceState`-tel eltűnik a címsorból.

Korlát: a 2. pont kódja az ÚJ bundle-ben él, tehát egy már beragadt (elavult HTML-t futtató) klienst nem gyógyít meg visszamenőleg - ott egyszeri hard refresh kell. A HTML cache teljes kikapcsolásához CDN kell a Pages előtt.

### Build scriptek

A natív Linux fájlrendszeren (`/repo/github/szilank.code/`) a teljes build ~30s, ezért **mindig `npm run build`-et használunk** (nincs szükség inkrementális variánsokra).

| Script | Mikor használd | Idő |
|--------|---------------|-----|
| `npm run build` | **Mindig ezt használd** - teljes: test + typecheck + bundle | ~30s |
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

---
## Szabálykönyv (md/) konvenciók, tanulságok

### Emoji headingek és anchor-linkek (⚠️ fontos buktató)

A szabálykönyv headingjei dekoratív emojikat használnak (pl. `⚜️`, `🗡️`, `🅿️`, `✴️`). Ezek anchor-képzése trükkös:

- **A `⚜️` (és sok más dísz-emoji) két kódpont**: a glyph (pl. `⚜` U+269C) + egy variation selector (U+FE0F). A FE0F adja az **emoji-megjelenést**; nélküle a glyph text-stílusú ("csúnya", fekete-fehér, néha dobozos) lesz az editorban.
- **A github-slugger a FE0F-et BENNHAGYJA a slugban** → az `## ⚜️ Valami` heading anchorja `#️-valami` (van egy LÁTHATATLAN U+FE0F a `#` és a `-` között), NEM a sima `#-valami`.
- **Következmény**: a rá mutató linknek is a FE0F-es anchort kell használnia (`...md#️-valami`). A sima `#-valami` **404** a linkspectorban. Ezek a linkek vizuálisan nem gépelhetők - másolni kell őket (a láthatatlan karakter miatt).
- **A repo konvenciója: FE0F-es (szép emoji) headingek + `#️-...` anchorok.** NE "egyszerűsítsd" sima `#-`-re a FE0F eltávolításával: a `⚜` text-stílusú (csúnya) lesz. (2026-10: egy teljes-repo FE0F-törlő kísérlet pont emiatt lett visszavonva.)
- **Keycap emojik** (`1️⃣`/`2️⃣` = szám + U+FE0F + U+20E3) külön óvatosságot kérnek: a FE0F önmagában való törlése szétzilálja a keycap-et (marad a csonka U+20E3).

**Gyakorlat emoji-heading felvételekor / anchor-link írásakor:**
1. Új emoji-heading után a rá mutató link anchorját a tényleges slug alapján add meg (github-slugger: a FE0F-es emojiknál `#️-...`).
2. Anchor-ellenőrzés mindig `npx @umbrelladocs/linkspector check -c .linkspector.yml` a módosítás végén (a 404 a FE0F-eltérést is kiszűri).
3. Variation-selector nélküli, egykódpontos emojik (pl. `🟡`, `🔆`) tiszta `#-...` slugot adnak - ha egyszerű anchor kell, azok jobbak.

---
## Elkészült ✅

- **Fegyver v2 bevezetés** - a webapp a `fegyverek_v2.json`-t olvassa (`módok[]` modell), a régi md→json pipeline archiválva (`archive/data_fegyverek_v1/`), a szabálykönyv táblái generáltak (`sync_fegyvertablazatok.py`). Napló: wiki `STUDY.fegyvergenerator_v2`.
- **Fegyver Idea** - `idea_default` modell: a példány Ideájának deltája hat (közelharc `TÉ`/`VÉ`/`SP`, kétkezes, távharc CÉ). `harc/shared.ts` `ideaDelta()`, spec §17.
- **`cél_páncél` extrák** - Sebzés popup "Ellenfél páncél" választó: mátrix + `SP`-hatású extra numerikusan, a `VÉ`/SFÉ-hatásúak az "Extrák" gombon jelölve. STUDY 3g.
- **Pajzs pipeline** - a pajzsok a `fegyverek_v2.json`-ban + `konstansok.pajzs_hatások` (`pancel-calc.ts`); a `pajzsok.json` archiválva.
- **Távharc fegyverek v2** - `tavfegyverek_fixed.json` → `tavfegyverek_v2.json`, nem-numerikus hatások `tavharc_` extrákként. Wiki `STUDY.tavharc_v2`.
- **Erő-követelmény** - nehéz/súlyos fegyver Erő alatt: Hátrány-1 a Támadó dobásra. `md/064_02_06`, `combat-roll-info.ts`.
- **Fárasztás taktika `VÉ`-csökkentés** - strukturált `hatások` a `taktikak.yaml`-ban, `ve-csokkentes-calc.ts`.
- **Manőver helyzetfüggő módosítók: Nehézség → Dobásmódosító** (2026-10) - dobó-oldali előjel, `99`/`-99` sentinel. Refactorlog `2026-10-10.md`, spec §21. A teljes eredeti terv: a DEVSTATE.md git-története (2026-10-14 előtt).
- **Felszerelés funkció** (2026-10) - keret `2 + Erő`, fegyverpont `max(hossz, súly)`, túllépés → Fizikai próba-Hátrány. Spec §15/§33.1, refactorlog `2026-10-09.md`. A korábbi "akadályoztatás" státuszokat ez váltotta. A teljes eredeti terv: a DEVSTATE.md git-története (2026-10-14 előtt).
- **Fegyvergenerátor KM-fejezet** - `md/068_10_fegyvergenerator.md` (paraméter-táblák, képletek, kidolgozott példák).
- **Fegyvertáblázat CI** - `update_fegyvertablazat.yml`: önteszt-kapu (balansz, harcszimulátor, taktikai AI) + táblagenerálás, a generátor kódjára is triggerel.
