# Szilánk RPG — Fejlesztési állapot guide

## Repo struktúra
```
/mnt/c/repo/szilank.code/
├── md/                        ← Éles szabályrendszer (markdown)
├── data/                      ← Adatfájlok
│   ├── docs/                  ← Specifikációk, fejlesztői doksik
│   │   ├── DEVSTATE.md        ← Fejlesztési állapot (ez a fájl)
│   │   ├── engine_spec.md     ← Engine kalkuláció spec (§1-§39)
│   │   └── gui_spec.md        ← GUI spec (screen-ek, viselkedés, formázás)
│   ├── sources/               ← YAML forrásadatok (amiből generálunk)
│   │   ├── konstansok.yaml    ← Központi konstansok (forrás, JSON-ba generálódik)
│   │   ├── harci_helyzetek.yaml
│   │   ├── taktikak.yaml
│   │   ├── manoverek.yaml
│   │   ├── statuszok.yaml     ← 19 státusz (strukturált hatásokkal)
│   │   ├── hatas_operatorok.yaml       ← 8 hatás mechanika típus (előny, hátrány, letilt, stb.)
│   │   ├── hatasok.yaml               ← 29 elnevezett Hatás katalógus (081_hatasok.md)
│   │   ├── esemenyek.yaml     ← 23 esemény/célpont (hatások céljai)
│   │   ├── hatterek.yaml      ← Leíró + Karma hátterek
│   │   ├── kepzettsegek/      ← Képzettség adatfájlok (81 db, alkönyvtárakban)
│   │   │   ├── primer/altalanos/   (10 db)
│   │   │   ├── primer/harci/       (5 db)
│   │   │   ├── primer/misztikus/   (2 db)
│   │   │   ├── primer/arkanumok/   (16 db)
│   │   │   ├── primer/faj_miszteriumok/ (26 db)
│   │   │   └── szekunder/          (22 db)
│   │   ├── fortelyok/         ← Fortély adatfájlok (177 db, csoportonként alkönyvtár)
│   │   │   ├── harci/         (44 db)
│   │   │   ├── altalanos/     (41 db)
│   │   │   ├── szabad/        (59 db)
│   │   │   ├── erzekek/       (6 db)
│   │   │   ├── kiemelt/       (9 db)
│   │   │   ├── misztikus/     (9 db)
│   │   │   └── tavharc/       (9 db)
│   │   └── fajok/             ← Faj hátterek (27 db)
│   ├── schemas/               ← YAML sémák (karakter, fortely, kepzettseg, fegyver, pancel, faj, taktika, statusz, hatas, esemeny, harci_helyzet, szituacio, manover, hatter)
│   ├── tables/                ← Generált + statikus JSON táblák (runtime)
│   ├── karakter/              ← Karakter template-ek
│   │   ├── empty_karakter.json  ← Üres karakter template
│   │   └── test_karakter.json   ← Teszt karakter (single source of truth)
│   ├── rules.json             ← Reactive engine szabályok (54 deklaratív képlet/aggregáció)
│   └── generate_tables.py     ← YAML→JSON generáló script (Vite plugin és prebuild futtatja)
├── web/                       ← React + Vite + TypeScript webes app
│   ├── src/
│   │   ├── engine/            ← Kalkulációs engine modulok
│   │   │   ├── types.ts       ← Típusdefiníciók (Karakter v2, Session, Fortely, stb.)
│   │   │   ├── data-types.ts  ← Adat interface-ek (GameData, FortelySummary, TaktikaEntry, stb.)
│   │   │   ├── data-loader.ts ← JSON betöltés runtime
│   │   │   ├── reactive.ts   ← Reactive rule engine (evaluate, buildContext, buildArrayContext)
│   │   │   ├── feltetelek.ts ← buildAktívFeltételek helper
│   │   │   ├── ketkezes.ts   ← Kétkezes harc kalkuláció (calcKétkezesHarc)
│   │   │   ├── file-ops.ts   ← Save/Load/Duplicate logika
│   │   │   ├── validate.ts   ← Karakter validáció (schema + referenciális)
│   │   │   ├── undo-helpers.ts ← describeKepChange
│   │   │   ├── alapeset.ts   ← Fortély 0.fok (Alapeset) kiértékelés
│   │   │   ├── helpers.ts    ← Közös utility függvények (lookupFegyver)
│   │   │   └── index.ts       ← Barrel export
│   │   ├── components/
│   │   │   ├── HarcScreen.tsx  ← Harc fül (KÉSZ)
│   │   │   ├── HarcScreen.css
│   │   │   ├── EpTable.tsx     ← ÉP rubrika táblázat
│   │   │   ├── EpTable.css
│   │   │   ├── TulajdonsagokScreen.tsx  ← Tulajdonságok + Képzettségek fül (KÉSZ)
│   │   │   ├── TulajdonsagokScreen.css
│   │   │   ├── TulajdonsagCell.tsx      ← Tulajdonság cella popup
│   │   │   ├── PrimerKpBox.tsx          ← Primer KP bontás doboz
│   │   │   ├── FortelyokScreen.tsx      ← Fortélyok fül (KÉSZ)
│   │   │   ├── FortelyokScreen.css
│   │   │   ├── FortelyFelvetel.tsx      ← Közös fortély felvételi wizard
│   │   │   ├── HarcertekekScreen.tsx    ← Harcértékek fül (KÉSZ)
│   │   │   ├── HarcertekekScreen.css
│   │   │   ├── AktivScreen.tsx         ← Aktív fül (KÉSZ)
│   │   │   ├── AktivScreen.css
│   │   │   ├── HatasPoolCalc.ts        ← Hatás pool kalkuláció helper
│   │   │   ├── MisztikusScreen.tsx     ← Misztikus fül (KÉSZ)
│   │   │   ├── TavharcScreen.tsx       ← Távharc fül (KÉSZ)
│   │   │   ├── TavharcScreen.css
│   │   │   ├── HatterekScreen.tsx      ← Hátterek fül (KÉSZ)
│   │   │   ├── HatterekScreen.css
│   │   │   ├── NaploTab.tsx            ← Napló overlay komponens
│   │   │   └── formatters.tsx          ← fmtCode + fmtHatás shared helperek
│   │   ├── App.tsx             ← Tab shell + swipe + animáció + Szerk/Game mód + Napló
│   │   └── App.css             ← Globális stílusok, dark theme
│   ├── vite.config.ts          ← Vite config (serveDataPlugin, metadata generation, polling, host)
│   ├── generate_metadata.py   ← Build metadata generátor (verzió: ÉV.ÉVNAPJA.napibuild)
│   ├── validate_karakter.py   ← Teszt karakter validáló script
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/          ← CI/CD (linkspector, fegyverek, KP, harcmodor, onefile, deploy)
├── code/                       ← Python scriptek (process_fegyverek.py + lib/)
└── segedlet/                   ← ODS karakteralkotó (v9.3.2)
```

## Elkészült
- ✅ Adatmodell: 5 schema (fortely, kepzettseg, karakter, pancel, fegyver, faj)
- ✅ Konstansok: teljes (KP, arányok, páncél, harcmodorok, mesterfegyver, kétkezes harc, merevvért, pajzs, aura, feltétel prefixek, fegyver_kategória_harcmodor, több_támadás_TÉ_levonás, locked_fortélyok)
- ✅ Engine spec: 37 szekció (§1-§37), validálva a szabályrendszer + ODS ellen
- ✅ Engine core: TypeScript implementáció, tesztelve 8.szintű karakter ellen (15/18 ✅, maradék 3 javítva)
- ✅ GUI spec: 8 screen + 2 overlay leírás, formázás, viselkedés
- ✅ Harc fül UI: KÉ/SFÉ/VÉ csökk/MP boxok, fegyvertábla, ÉP rubrika táblázat (sebesülés/gyógyulás/compaction/TÉ levonás)
  - VÉ csökkenés: label "VÉ csökkenés", negált kijelzés (-3, -5...), gombok: -1/-2/-3/+1/⟲
    - VÉ tábla flash: sárga (csökkenéskor), zöld (+1 visszaadáskor), 1s fade-out
    - -1/-2/-3 gombok disabled ha minden fegyver VÉ = 0; +1 disabled ha csökkenés = 0
    - ⟲ reset: disabled ha 0, megerősítő popup ("VÉ Reset")
    - VÉ értékek nem mennek 0 alá (Math.max(0,...) clamp)
    - Koppintás label/értékre: VÉ csökkenés történet popup (pl. "-3; -2; -2; +1"), mellé kopp bezárja
  - VÉ csökkent: reset gomb → megerősítő popup ("VÉ Reset"), disabled ha 0
  - ÉP táblázat fejléc: 4 oszlopos grid (ÉP érték, ÉP reset gomb, Seb gomb, Gyógy gomb)
  - Sebesülés/Gyógyulás: overlay popup (típus+érték gombok, auto-close mindkettő kiválasztva)
  - Sebesülés: 1-15 látható + ▾ lenyitó 16-40; Seb gomb disabled ha minden rubrika ÉP (nincs hely)
  - Gyógyulás: auto-select ha csak 1 típusú seb van
  - ÉP Reset: megerősítő popup, disabled ha nincs seb
  - TÉ levonás: Fájdalomtűrés enyhítés (konstansok.fájdalomtűrés_enyhítés), dinamikus
  - TÉ footer tap: navigál Tul/Képz → scroll Fájdalomtűrés-hez
  - képzettségek prop: lifted state, Fájdalomtűrés szint módosítás azonnal hat
- ✅ Tab rendszer: swipe + animáció (0.15s) + tükrözött tab bar (jobb→bal, 18px ikon-only + szöveges fülek)
- ✅ Szerkesztő/Game mód toggle (2000ms fade animáció narancs↔zöld)
- ✅ Data betöltés: Vite plugin a ../data/ könyvtárból (nincs duplikálás)
- ✅ 177 fortély yaml, 81 képzettség yaml, 27 faj yaml
- ✅ Tulajdonságok + Képzettségek fül: teljes UI (szerkesztő + game mód)
  - Fejléc: Név (tap → szerkesztő popup) + Szint (tap → gombgrid 3-21, 5 oszlop, utolsó sor középre)
  - Faj: inline `<select>` dropdown (szerkesztő módban közvetlenül koppintható) + Kor box (tap → +/− overlay)
  - Game módban Faj+Kor a Név mellé konkatenálódik: "von Agabor (Ember (Északi), 32)"
  - Tulajdonságok: fix 2x4 grid, teljes nevek, tap → popup gomb-grid (-5..+7), érték választás bezárja
  - Faj limit warning: sárga szín + automatikusan megjelenő "Faj max/min: X" info box (nem zárható)
  - Képzettségek: 7 csoportban (összecsukható), dropdown + azonnali szint popup, ✕ törlés (piros megerősítés)
  - Szint választó: popup gombok 1-15 grid (5x3), aktív=zöld, érték választás bezárja (tap triggereli)
  - Szint színkód: 0=piros, 1-8=sárga, 9+=zöld
  - Többszörös képzettségek: generikus `többszörös` lista mező (fix alnév lista VAGY `["*"]` szabad szöveges max 20 kar)
  - Többszörös felvételkor csoportosítva a testvéreik mellé kerülnek
  - Game mód adatlap: próba, domináns tulajdonságok, kiterjesztő fortélyok
- ✅ Fortélyok fül: teljes UI (szerkesztő + game mód)
  - 6 csoport (Harci → Távharc → Általános → Érzékek → Szabad → Kiemelt), összecsukható
  - Fok kijelzés: pöttyök (●/○) — 3 fix hely, balról jobbra töltődik, maxfok feletti hidden; Nyelvismeret: szöveges label marad
  - Dropdown: `"Név (max X)"`, ingyenes kerettel: `🎁N`, KP-t adó: `➕6-12-18KP`
  - Többszörös fortélyok: generikus `többszörösség` yaml mező alapján
    - `spec_típus` + `spec_lista: [...]` → fix lista dropdown (szűri a már felvetteket)
    - `spec_típus` + `spec_lista: []` → freetext popup (max 20 kar)
    - Példányok neve: `"AlapNév - alnév"` formátum
  - Fok választó: kerek radio gombok (1..maxfok), aktív=zöld, maxfok=1 → "1 fok a maximum" hint (2s, warning szín)
  - Felvételkor maxfok>1: fok: 0-val kerül be (nincs pre-selected), popup felugrik, mellé katt → 0.fokon marad
  - Ingyenes keret: `floor((TSz+1)/ingyenes_perszint)` db, 🎁 jel az ingyeseknél
  - KP logika: `kp_perfok` per fortély, base name lookup többszörös fortélyoknál
  - Törlés: mindig megerősítő dialógus (piros "Törlés" gomb)
  - Game mód: koppintás → accordion info (leírás, hatás, követelmény, kiterjesztések)
  - Követelmény ellenőrzés: piros bal border + "⚠ Követelmény:" info (automatikusan jelenik meg)
    - Típusok: képzettség (szint ellenőrzés, OR lista bármelyik elég), fortély (fok ellenőrzés, többszörös bármelyik példány)
    - Harcmodor lista összevonás: ha mind harcmodor → "Harcmodor ≥ X" (lista `data.konstansok.harcmodorok`-ból)
  - Rendezés: locked fortélyok előre → azonos nevűek együtt (ABC) → azon belül fok desc
  - Game mód váltáskor info accordion resetelődik
  - Kiterjeszti szekció: zöld ha képzettség felvéve (≥1.szint), piros ha nincs
- ✅ Build pipeline: YAML → JSON generálás automatizálva
  - `data/generate_tables.py`: központi script (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek)
  - Vite plugin: dev szerver indulásakor automatikusan futtatja a generálást
  - `prebuild` script: `npm run build` előtt automatikusan fut
  - `js-yaml` runtime dependency eltávolítva → bundle ~43KB-val kisebb (232KB vs 275KB)
  - Minden adat `tables/*.json`-ból töltődik (fetchJson), nincs runtime YAML parse
- ✅ Reactive Engine (`data/rules.json` + `web/src/engine/reactive.ts`)
  - Deklaratív dependency graph: 54 szabály (ÉP, KÉ, TÉ/VÉ/CÉ alap, KP teljes lánc incl. spec_kp/kiemelt_kp/primer, SFÉ, MGT, merevvért, távharc VÉ, képzettség limitek, manőver pont, felszerelés, max_HM, max_HM_aszimmetria, fegyver TÉ/VÉ/SP/harckeret/támadások, páncél lookup-ok, lefedettség, Aura)
  - Skaláris képletek + aggregáló: `sum()`, `sum_lookup()`, `sum_where()`, `count()`, `lookup()`, `if()`
  - Topológiai sorrend: automatikus dependency resolution (skaláris Context + ArrayContext)
  - HarcScreen: ÉP, KÉ, manőver pont, SFÉ, páncél_MGT, fegyver TÉ/VÉ/SP/támadások — mind reactive engine-ből
  - App KP sáv: teljes KP lánc reactive engine-ből
  - Fájdalomtűrés enyhítés: TS-ben (küszöb-tábla lookup konstansokból, HarcScreen inline)
- ✅ tables/kepzettsegek.json, kiterjesztesek.json, fajok.json, faj_tulajdonsag_keretek.json, primer_fortelyok.json, fortelyok.json, konstansok.json
- ✅ Context menu prevention (onContextMenu preventDefault + CSS touch-callout + user-select)
- ✅ Escape gomb: minden popup overlay bezárható Escape-pel
- ✅ GitHub Pages deploy workflow (`.github/workflows/deploy_webapp.yml`)
  - Trigger: push master (web/ vagy data/ változás) + workflow_dispatch
  - Python 3.13 + Node 20 + generate_tables.py + npm ci + build + postbuild (data copy) + deploy
  - URL: `https://kaktusztea.github.io/szilankrpg/`
- ✅ Karakter séma v2 (`data/schemas/karakter.yaml`)
  - Egységes `fortélyok[]` tömb (harci, általános, érzék, szabad, kiemelt többszörösök — mind `{név, fok}`)
  - Eltávolítva: `fortélyok_kiemelt`, `fortélyok_szabad`, `származtatott` szekciók
  - `session` szekció: runtime állapot (vé_csökkenés, vé_history, manőver_pont_használt, sebzések, aktív_fegyver_index, aktív_pajzs/páncél/taktika/helyzet/manőver/státuszok)
  - Nem tárol származtatott/számított értékeket (ÉP, KÉ, TÉ, VÉ, SP, KP, SFÉ, MGT)
  - Validáció: `schema_version === 2` + kötelező mezők ellenőrzés betöltéskor
- ✅ Karakter mentés/betöltés (JSON export/import)
  - ⚙️ menü: Karakter betöltése / Karakter mentése / Új karakter / Teszt karakter
  - Mentés: `karakter.név.json` letöltés + `mentés_dátum` timestamp
  - Betöltés: file picker, schema validáció (incl. napló tömb)
  - Új karakter: megerősítő popup, `data/karakter/empty_karakter.json`-ból tölti
  - Teszt karakter: megerősítő popup, `data/karakter/test_karakter.json` runtime fetch + referenciális validáció
  - Validáció betöltéskor: schema struktúra + referenciális integritás (faj, anyanyelv, fortélyok, képzettségek, páncél enum-ok, fegyver anyag/alaptípus)
  - Session state lifted: VÉ csökkenés, MP használat, ÉP rubrikák (sebzések) mind az App-szintű karakter objektumban
  - EpTable: sebzések prop-on keresztül kapja/adja vissza (nem lokális state)
  - Név/Szint/Kor/Faj: lifted state (App → TulajdonsagokScreen props)
- ✅ KP sáv (szerkesztő mód, minden fülön, tab-bar felett)
  - Két szekció: "Maradt KP: X" (bal) + "Primer keret: Y" (jobb)
  - Bal: piros háttér ha maradék < 0
  - Jobb: piros háttér ha primer túlléptük (primer költés > primer limit)
  - Primer költés = primer képzettségek + primer fortélyok + HM + CM
  - Primer limit = összes_kp + spec_kp
- ✅ Szint választó: gombgrid 3-21 (5 oszlop, utolsó sor középre)
- ✅ Kor választó: +/− gombok long press gyorsítással (200ms→30ms, 7s után ×10 lépés), 1–2000 tartomány
- ✅ Build metadata (`web/generate_metadata.py` → `public/metadata.json`)
  - Verzió formátum: `ÉV.ÉVNAPJA.napibuild` (pl. `26.158.4`)
  - Napi build counter: `.build_counter` fájl (nem repo része)
  - Compile-time injection: `__APP_VERSION__` via Vite `define`
  - Double-tap "Szilánk RPG" fejléc → sárga info sáv (5s): `Szilánk RPG build: X.Y.Z`
- ✅ Reactive Engine bővítés (2. kör)
  - Új engine funkciók: `sum_where(tömb, összegMező, szűrőMező, szűrőÉrték)`, `lookup(tömb, kulcsMező, kulcsÉrték, értékMező)`, `if(feltétel, then, else)`, `abs()`
  - `max_HM` szabály: `sum_where(harci_fortélyok, fok, is_mesterfegyver, 0) + harcmodor_összeg + alakzatharc_szint`
  - `max_HM_aszimmetria` szabály: `floor(tsz / 2)`
  - `páncél_MGT` szabály: `max(0, struktúra_mgt + alapanyag_mgt + csatolt_mgt + méret_mgt - erő)`
  - `merevvért_TÉ_büntetés` szabály: `if(páncél_merev, max(0, páncél_MGT - merevvért_csökkentés), 0)`
  - `calcPancelInputs()`: lookup-ok TS-ben → később teljes migrálás rules.json-ba (3. kör)
  - Eltávolítva: `ep.ts`, `tulajdonsag.ts`, `limits.ts`, `tavharc.ts`, `modifiers.ts`, `calcPancel()`, `calcKE()`, `calcCE()`, `kp.ts`, `harcertek.ts`, `pancel.ts`
  - Megmaradt TS engine modul: NINCS — minden kalkuláció a rules.json-ban vagy inline context-építés
- ✅ Harcértékek fül (🛡️, szerkesztő módban, Fortélyok fül mellett)
  - HM vásárlás: +/- gombok, validálás (max_HM, aszimmetria). CM: Távharc fülre került.
  - Harci képzettségek: szerkeszthető szekció (kep-row stílus, tap → szint picker popup, ✕, dropdown)
  - Fegyverek: példány lista, + Új fegyver (kategóriánkénti dropdown)
    - Mezők: MF fok, Idea, Anyag — `he-field-btn` stílus, tap → overlay popup
    - MF fok: piros szöveg ha Mesterfegyver követelmény nem teljesül
    - Minden szerkesztő elem: egyszeri tap → overlay popup
    - MK fegyverek: dropdown-ban csak 1K variáns, `Alapnév` mező mint display name (suffix nélkül)
    - MK 2K variáns: automatikusan megjelenik a Harc fülön mint külön sor
    - `MK_pár` + `Alapnév` mezők a `fegyverek.json`-ban (process_fegyverek.py generálja)
  - Páncél: `he-field-btn` stílus, tap → overlay popup
    - Struktúra, Fémalapanyag (csak fém struktúránál), Kidolgozottság, Méret, Sisak (toggle), Végtagvédettség, Idea, Rongálódás
    - méret_illeszkedés értékek: `passzol`, `nem passzol`, `borzalmas`
  - Mesterfegyver fortély szinkronizáció:
    - Fegyver MF fok módosítás → automatikusan létrehozza/frissíti a Mesterfegyver fortélyt
    - Fegyver törlés → session aktív_fegyver_index/bal_index és kétkezes_harc reset
    - Fortélyok fülön: locked (nem szerkeszthető/törölhető), lista tetején
    - Tap locked elemre → hint: "Ezt a fortélyt a Harcértékek/Távharc fülön kezeld!" (3s, távfegyver név alapján)
    - Mesterfegyver és Pajzshasználat NEM jelenik meg a Fortélyok fül dropdown-jában
- ✅ Jegyzetek fül (📝): teljes képernyős textarea, mindkét módban elérhető, mentődik karakter fájlba
- ✅ Napló fül (📖): bejegyzés lista (dátum, KM, kaland, események), szerkesztés/törlés, accordion, editOnly
- ✅ Távharc fül (🏹): teljes implementáció (CÉ/VÉ kalkulátor, fegyver kezelés, szorzó pickerek)
- ✅ Harc fül fegyver tábla: dinamikus (karakter.fegyverek-ből), MK párok kibontva, kategória→harcmodor lookup
  - Tám cella kattintható (Game mód): info popup (fegyver név, sebesség, harckeret)
- ✅ Reactive Engine migráció: TELJES (pancel.ts, kp.ts, harcertek.ts mind törölve)
  - spec_kp: sum(kp_bónusz_fortélyok) + tartós_sérülés (negatív kp_perfok fortélyokból automatikus)
  - kiemelt_kp: sum(kiemelt_fortélyok, fizetős_kp) — ingyenes keret feletti többlet
  - primer_költés + primer_keret: deklaratív (primer_képzettségek + primer_fortélyok + HM + CM)
  - Páncél lookup-ok: 11 szabály (struktúra/alapanyag/méret/merevvért StringContext lookup-okkal)
  - `if` keyword fix: hozzáadva az identifier exclusion listához
- ✅ Tulajdonság pontok kijelzés: `Tulajdonság pontok: X/Y` (szerkesztő módban, piros ha túllépés)
- ✅ Játékos neve mező: tap szerkesztő popup, mentés fájlnévben (`karakter_játékos_Xtsz.json`)
- ✅ `onSelect preventDefault` eltávolítva (okozta az input karakter-elvesztés bugot iOS-en)
- ✅ Mentés fájlnév: `kisbetű_éktelenítve_Xtsz.json` formátum (első név max 20 kar, ASCII only)
- ✅ Pajzs szekció a Harcértékek fülön
  - `PajzsPeldany` típus: `{ méret: string }`
  - Karakter top-level `pajzs` mező (karakter.yaml séma v2 bővítve)
  - Méret: tap → popup (— nincs — / kis / közepes / nagy)
  - Pajzshasználat fok: tap → kerek gombok 0-3, szinkronizálja a Pajzshasználat fortélyt
  - Kézben, fegyver mellett: read-only indikátor (`session.aktív_pajzs` alapján), kattintás → sárga hint
  - Pajzshasználat fortély: locked a Fortélyok fülön (nem szerkeszthető/törölhető, nem jelenik meg dropdown-ban)
  - `setPajzsFok()`: fortélyok tömbben közvetlenül módosítja a Pajzshasználat fortélyt
  - Harcérték chip: TÉ/VÉ/SP/Sebesség (ha van méret), áthúzás ha nem "csak pajzs" mód
  - Pajzs fegyverként: `fegyverek.json`-ban (kategória: "pajzs", process_fegyverek.py generálja), dropdown-ból kiszűrve
  - Aktív fül: Ügyesebb kéz dropdown-ban megjelenik (idx: -2, zöld szín), ha van pajzs méret
  - Harc fül: pajzs fegyver sor megjelenik a fegyvertáblában (Közelharc harcmodor)
  - Pajzs harc bónusz: Pajzshasználat fortély `fegyver_kategória:pajzs` feltételes módosítói (TÉ/VÉ/SP per fok, data-driven)
- ✅ Nyelvismeret fok UI: "Alap"/"Udvari" label (szám helyett), lekerekített téglalap gombok, centered fejléc
  - Nyelv picker: custom styled gomb-lista csoportonként (narancssárga fejléc + elválasztó vonal), scrollozható (max 70vh)
- ✅ Kor választó javítások: szabályos kör gombok (42x42px), 10–58 / 60–100 toggle split (cserélődő tartalom)
- ✅ Harcértékek fül szekció elválasztók: `.he-section + .he-section { border-top: 1px solid #333 }`, h3 border-bottom eltávolítva
- ✅ process_fegyverek.py fix: `data/patterns` → `data/tables` + `_pattern.json` szűrő
- ✅ Fejléc ⚙️ menü: Karakter betöltése / Karakter mentése / Új karakter / Teszt karakter (overlay popup)
  - Régi ikon gombok (🧪📄💾📂) eltávolítva a fejlécből
- ✅ Tab bar tükrözés: jobbról balra sorrend (Aktív jobb szélre), induláskor jobbra scrollozva
  - Screen slider és swipe irány is tükrözve
  - Ikon-only tab-ok: ✳️🗡️🏹🔵🟣🛡️✨📜 (szöveges: Jegyzetek, Napló, Taktikák, Helyzetek, Manőverek)
  - Tab font-size: 18px, padding: 8px
- ✅ Screen címek: h2 hozzáadva (Tul/Képz, Fortélyok, Harcértékek)
- ✅ Anyanyelv mező + ingyenes Nyelvismeret fortélyok
  - `karakter.anyanyelv: string` top-level mező (nyelvek.json-ból)
  - Tul/Képz fül: inline `<select>` dropdown (szerkesztő módban, Faj/Kor alatt)
  - Anyanyelv módosítás → szinkronizálja kiérdemelt Nyelvismeret fortélyokat (Közös + anyanyelv, fok:1)
  - Kiérdemelt Nyelvismeret: 🎁 jelölés, fok emelhető (Udvari), fizetős rész = fok-1 pont
  - 🎁➕ jelölés ha kiérdemelt és fok > 1 (ingyenes alap + ráköltöttünk)
  - `validateKarakterData`: anyanyelv referenciális validáció (nyelvek.json ellen)
- ✅ Game módban üres fortély/képzettség csoportok elrejtése
- ✅ Nyelvismeret dropdown: 🌏 → 🎁 ikon (egységes "ingyenes keret" jelzés)
- ✅ §16 Fortély módosítók (mindig-aktív, feltétel="") implementálva
- ✅ §16.1 Alapeset (fok:0): `engine/alapeset.ts` kiértékelő, feltétel prefix dispatch, accordion megjelenítés Hatás pool-ban, Hárítófegyver VÉ fortély-check
  - `generate_tables.py`: fokok[].módosítók mező hozzáadva a fortelyok.json-hoz
  - `data-loader.ts`: FortelyModosito interface + FortelyFokSummary.módosítók
  - `HarcScreen.tsx`: generikus iteráció (flat + scaled mód), fortelyMods Record
  - `HarcScreen.tsx`: alapeset módosítók beszámítása harcértékekbe (evaluateAlapesetek → fortelyMods, pl. Lovas/Léglovas harc TÉ:-9 VÉ:-9)
  - Érintett: Gyors kezdeményezés (KÉ), Harckeret növelés (harckeret+KÉ), Harci akrobatika (TÉ/VÉ scaled), Természetes páncél (SFÉ)
  - Harci akrobatika yaml fix: "harci akrobatika" → "Harci akrobatika" (nagybetű)
- ✅ Páncél gombok: disabled + szürke ha nincs struktúra kiválasztva (`.he-field-disabled`)
- ✅ Feltétel prefix javítások fortély yaml-okban:
  - `szituáció:belharc` → `harci_helyzet:belharci_helyzet`
  - `szituáció:fárasztás_taktika` → `taktika:fárasztás`
  - `szituáció:fegyverrántás` → `harci_helyzet:fegyverrántás`
  - `szituáció:roham` → `taktika:roham`
- ✅ Aktív fül adatforrások (YAML → JSON):
  - `data/sources/taktikak.yaml` → `tables/taktikak.json` (14 taktika, kombó_mód/lista, fokozatos, megkötések)
  - `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (31 helyzet, id, infó, hatások, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek[id-k])
  - `data/sources/szituaciok.yaml` TÖRÖLVE → 7 körülmény beolvadt `harci_helyzetek.yaml`-ba (`csoport: "körülmény"`)
  - `data/sources/manoverek.yaml` → `tables/manoverek.json` (34 manőver, nehézség, fázisok, hatás)
  - `data/sources/statuszok.yaml` → `tables/statuszok.json` (19 státusz, kategória, fokok+alcím+strukturált hatások)
  - `data/sources/hatas_operatorok.yaml` → `tables/hatas_operatorok.json` (8 hatás mechanika típus)
  - `data/sources/hatasok.yaml` → `tables/hatasok.json` (29 elnevezett Hatás: id, név, leírás, mechanika[])
  - `data/sources/esemenyek.yaml` → `tables/esemenyek.json` (22 célpont: harci, próba, fizikai, képesség csoportok)
  - Schema validáció: `validate_aktiv_ful()`, `validate_hatasok()`, `validate_esemenyek()`, `validate_statuszok()`, `validate_hatasok_katalogus()`
  - Referenciális integritás: státusz operátor → hatas_operatorok id, cél → esemenyek id; Hatás katalógus mechanika → operátor+cél
  - Régi `harcihelyzetek.yaml` törölve
- ✅ Aktív fül UI (AktivScreen.tsx) — teljes
  - Szilánk: fejléc sávba költözött (kattintásra értékválasztó popup 0-3)
  - Fegyver (Ügyesebb kéz / Gyengébb kéz): inline field-btn dropdown. Gyengébb kéz feltételes (csak nem-egyfegyveres fogásnál).
  - Fegyverfogás: overlay picker (4 opció, disabled logika, hint szöveg inaktívaknál)
  - Páncél viselve: field-btn toggle (Pajzs kézben beolvadt a Fegyverfogás picker-be)
  - Taktikák: overlay picker (ABC, fokozatos: 📶 jelzés, két lépéses fokválasztó), chip katt → fok módosító picker
  - Taktika chip: kétsoros (felül név+fok bold, alul módosítók szürkén pl. "TÉ:+2 VÉ:-4")
  - Taktika megkötések: harci_helyzet/tiltott, harcmodor/tiltott, támadások/min runtime validáció
  - Manőver: overlay picker (Általános/Belharci kategóriák, nehézség+fázisok+hatás), infó a box-ban (Nehézség+fázisok | hatás)
  - Szekció sorrend: Fegyver+Fogás (felül) → Hatás pool → Taktikák → Harci helyzetek → Manőver → Státuszok → Narratív Előny/Hátrányok
  - Harci helyzetek: overlay picker (név + infó, ABC)
  - Körülmények: beolvadtak pozitív/semleges csoportba (körülmény csoport megszűnt)
  - Státuszok: overlay picker (Fizikai/Szellemi/Mágikus kategóriák, két lépéses fokválasztó emberi olvasható hatásokkal), chip katt → fok ciklikus váltás
  - Hatás pool box (2 szekció): Fortély bónuszok | Alapesetek (accordion)
  - Narratív Előny/Hátrányok: "+ Új" gomb → overlay popup (Hátrány/Előny gombok + szöveg + OK, Enter = OK)
  - Több támadás TÉ levonás: konstansokból (`több_támadás_TÉ_levonás`), generikusan (taktika +3 kioltja)
  - Minden picker: Escape + mellé katt bezárja
- ✅ Hátterek fül (HatterekScreen.tsx)
  - Faj háttér: read-only chip (karakter.hátterek.faj), kattintásra navigál Tulajdonságok fülre
  - Szövegfelhő: Leíró hátterek (Származás/Jellem/Küllem/Fóbia) + Karma hátterek
  - Adatforrás: `data/sources/hatterek.yaml` → `tables/hatterek.json`
  - Tap toggle (aktív ↔ inaktív), kijelöltek előre + ABC sorrend
  - Game módban nem szerkeszthető
- ✅ Taktika módosítók → Harc fül
  - Aktív taktikák TÉ/VÉ/KÉ/SP módosítói beépítve a harcérték kalkulációba
  - Fokozatos taktikáknál (Támadó, Védő, Kezdeményező, stb.) a kiválasztott fok értékeit használja
  - Nem-fokozatos taktikáknál a `módosítók` mezőből olvas
  - KÉ box, fegyvertábla TÉ/VÉ/SP és VÉ max csökkenés mind reagál
- ✅ §16 feltételes fortély módosítók
  - Session aktív taktikák/helyzetek feltétel kulcsai alapján aktiválódnak (körülmények is helyzetek)
  - `aktívFeltételek` Set: összegyűjti az aktív `feltétel_kulcs` értékeket (taktika, harci_helyzet, fegyverfogás, fegyver_kategória)
  - Fortély módosítók ahol `feltétel` egyezik → bekerülnek a harcérték kalkulációba
  - Érintett fortélyok: Belharc, Elsöprő roham, Fárasztás, Fegyverrántás, Gladiátor (Bestiái/Közönsége), Célzás, Harci anatómia (orvtámadás)
- ✅ Session séma bővítés: `aktív_taktika/helyzet` → `aktív_taktikák[]/helyzetek[]` (körülmények is helyzetek)
  - `AktívTaktika` interface: `{ név, fok? }`
- ✅ Tab bar átrendezés: sorrend 🟡🟣🔵✨🏹🗡️✳️🛡️ (középre rendezve, reszponzív méret)
  - Game módban 🛡️ eltűnik a jobb szélről (többi fix marad)
  - Tab váltás mód-korrekció: `prevGameMode` ref → index újraszámítás mód váltáskor
- ✅ Jegyzetek (✏️) és Napló (📅) overlay-re költöztetve
  - Felső sáv gombok (fejlécben ⚙️ mellé): ✏️ és 📅, kattintásra fullscreen overlay nyílik
  - Overlay: fejléc + teljes képernyős tartalom, mellé kattintás bezár (nincs ✕ gomb)
  - Escape bezárja
  - Alsó tab bar-ból eltávolítva (nem swipe-olható)
- ✅ PWA manifest + Fullscreen
  - `web/public/manifest.json` (display: standalone)
  - ⚙️ menüben "Teljes képernyő" gomb: desktop → requestFullscreen(), mobil → platform-specifikus hint overlay
- ✅ Ctrl+S → karakter mentés (preventDefault a böngésző mentés helyett)
- ✅ Kor választó egyszerűsítés: 3 oszlopos digit picker (százas/tízes/egyes), 500ms delay bezáródás előtt, reszponzív gombméret (min(42px, 6vh))
- ✅ Képzettségek/Fortélyok sorrendezés: csökkenő (szint/fok szerint)
  - Kiemelt elemek a csoport tetején: Harcmodor képzettségek, Mesterfegyver, Pajzshasználat, Merevvértviselet
- ✅ Duplikáció feloldás: Mesterfegyver/Pajzshasználat/Merevvértviselet
  - Egyetlen source of truth: `fortélyok[]` tömb
  - `mesterfegyver_fok` eltávolítva a `FegyverPeldany` típusból
  - `pajzshasználat_fok` eltávolítva a `PajzsPeldany` típusból
  - Összekötés: `fortélyok[Mesterfegyver].spec_elem` === `fegyverek[].alap` (Alapnév)
  - Harcértékek fül: `getMfFok()` / `setMfFok()` / `getPajzsFok()` / `setPajzsFok()` / `getMerevvertFok()` / `setMerevvertFok()` helperek
  - HarcScreen: MF fok lookup fortélyokból (`k.fortélyok.find(...)`)
  - Merevvértviselet: Harcértékek fül Páncél szekció, Struktúra melletti gomb (csak merev páncélnál)
  - Mind a három locked a Fortélyok fülön (nem szerkeszthető, dropdown-ból kiszűrve)

## Elkészült mérföldkövek
1. ✅ Taktika kombó inkonzisztencia (szimmetrizálva, megkötések felvíve)
2. ✅ Aktív fül (taktika/helyzet/körülmény/manőver/státusz picker, Hatás pool, narratív módosítók, fegyver jobb/bal/kétkezes)
3. ✅ Hátterek fül (szövegfelhő, data layer-ből)
4. ✅ Fortély követelmény ellenőrzés (§25 engine_spec, yaml-ok kitöltve, UI: piros jelzés + info)
5. ✅ Fegyverfogás rendszer (§27: picker, hárítófegyver beolvasztás, világoskék összesítő sor, Fegyver schema Hárító flag)

## TODO Backlog

### Összegzés (nyitott TODO-k)

| Téma                             | Leírás                                                  | Szekció     |
| -------------------------------- | ------------------------------------------------------- | ----------- |
| Lovas harc rendszer              | ✅ Kész (Ph kijelzés opcionális, §38)                   | Harc+Aktív  |
| Belharc / Belharci helyzet       | Fegyver/harcmodor korlátozás jelzés, puszta kéz override  | Aktív fül   |
| Harc alakzatban                  | NJK kalkulátor, Alakzat ellen helyzet, taktika tiltások | §28         |
| Méreggenerátor                   | KM eszköz: méreg paraméterek → komplexitás/Mk szint    | §39         |

### Karakteralkotó — általános
- ✅ VÉ eltolás ökölszabály: max ±10 (taktikák kombinálása esetén is) — konstansok + clamp implementálva
- ✅ Harci helyzetek kombinálása: teljes kizárás mátrix implementálva (harci_helyzetek.yaml `kizár_helyzetek`, 13 helyzetnél aktív)
- Láthatatlan ellenfél taktika: kiszedve a yaml-ból, státuszként kezelni?
- Ember (Szigetvilági) faj háttér hozzáadása (slan helyett)
- ✅ Undo stack (↩ Visszavonás menüpont, overlay popup, max 6 entry, `_undo` a karakter JSON-ban)
- ✅ Multi-karakter localStorage (max 10 slot, `szilank_char_{uid}` + `szilank_slots` + `szilank_active`)
- ✅ Karakter lista overlay ("Karakterek" menüpont, `{név} ({tsz}sz)` + relatív idő + ✕ törlés + 🧪 Teszt + 📁 Fájlból)
- ✅ Karakter ID: uid (UUID, egyedi) + id_leíró (slug, auto-frissül név/TSz-ből)
- ✅ Duplikálás (📋 menüpont): deep clone, új uid, név " v2" suffix, Karakterek ablak nyílik
- ✅ Mentés overlay (💾): "Aktuális karakter" / "Összes (backup)" → "Megosztás" (share sheet) / "Helyi mentés"
- ✅ Teszt mód: teszt karakter nem mentődik, "Szilánk" label narancssárga
- ✅ isDirty flag: új karakter nem mentődik amíg nincs módosítás

### Aktív fül
- ✅ Kétkezes harc (§26 engine_spec, HarcScreen összevont kalkuláció, lila keret, pengelevonás, fok-függő MF, harckeret yaml fortélyból `fegyverfogás:kétkezes` feltétellel)

- ✅ Harci akrobatika: session_toggle (yaml `session_toggle: true`) + TÉ/VÉ bekötés + manőver bónusz
- Belharc rendszer — fegyver/harcmodor korlátozás jelzés + puszta kéz TÉ/VÉ/SP override
- Páros harc körülmény — implementálva (picker + fortély)

### Fortélyok — hiányzó számszerűsítések
- ✅ Harci anatómia: manőver bónusz (`manőver:leütés_hátulról`, `manőver:precíz_támadás`) + Visszafogott TÉ csökkentés (`feltétel: "taktika:visszafogott"`)
- ✅ Orgyilkos: SP + Előny sebzésdobás (`feltétel: "harci_helyzet:orvtámadás"`)
- ✅ Alkalmatlan fegyver hajítása: enyhít (`feltétel: "harci_helyzet:hajítás_alkalmatlan_fegyverrel"`)
- ✅ Alkalmatlan tárgyak hajítása: enyhít (`feltétel: "harci_helyzet:hajítás_nem_dobásra_készített"`)
- ✅ Harc helyhez kötve: vé_veszteség + té_dobás enyhít (`feltétel: "harci_helyzet:helyhez_kötve"`)
- ✅ Testőr: vé_veszteség + támadások_száma enyhít (`feltétel: "harci_helyzet:vé_kiterjesztés"`)
- ✅ Természetes fegyver: SP override, puszta kéz feltétel — már volt
- ✅ Természetes páncél: SFÉ flat — már volt
- ✅ Pajzshasználat: §13 data-driven (pajzs_TÉ_büntetés konstans + fortély yaml pajzs_TÉ_mérséklés + VÉ+2 3.fok, feltétel: fegyverfogás==fegyver_pajzs)
- ✅ Hárítófegyver használat: Fegyverfogás picker + hárítóVÉ bekötés + fegyverek.json beolvasztás + MF VÉ bónusz

### Harci helyzetek — kategorizálás és egyszerűsítés ✅

Szabályrendszer átszervezés és webapp implementáció kész.

**Elvégzett változtatások:**
- Picker 3 csoportra bontva: Pozitív (zöld), Semleges (narancs), Negatív (piros) fejléccel
- Helyzetek egyoldalúsítva (csak saját karakterre vonatkozó módosítók, nincs aszimmetrikus "Támadó/Védő" bontás)
- Többfokú helyzetek szétbontva: Sötétben (×3), Tűz ruhán (×2), Láthatatlanul (×2), Beszorított → Beszorított ellenfél
- `kizár_helyzetek` id-alapú (nem név) — többfokúak kölcsönösen kizárják egymást
- Rejtett elemek (Pengeelőny, Pengehátrány, Pusztakezes, Képzetlen) nem jelennek meg a picker-ben
- Készületlenség beolvadt Meglepetésbe (törölve)
- VÉ csökkentés egyszerűsítés: k20T (Pengehátrány), 1+k20T (Alappenge), 2+k20T (Pengeelőny)
- Hatás pool: `infó` mező + alapeset hozzáfűzés + fortély bónusz alatta (→ jelöléssel, zöld ha aktív ✔)
- Taktikák hatás pool: zöld módosítók végén ✔ jel (beszámított)
- Manőver szekció: label kiemelve (aktiv-label, mint Taktikák/Helyzetek)

**Kombinálási szabályok (implementált, data-driven):**
- `tiltja_taktikákat: true` → összes taktika disabled (Orvtámadás)
- `kizár_helyzetek: [id-k]` → picker szűrés + hozzáadáskor eltávolítás
- Taktika megkötések: `harci_helyzet/tiltott` (Fárasztás: Pengehátrány, Láthatatlanul×2)

**TODO:**
- [x] Magasabbról + Lovas harc: implementálva (§38, `kizár_helyzetek` data-driven)


### Harc alakzatban 🚧

Előfeltétel: Alakzatharc szabályrendszer kidolgozása (`md/065_03_harc_alakzatban.md`).
Engine spec: §28 (TERV — NEM IMPLEMENTÁLT).

**Szabályrendszer összefoglaló:**
- Alakzat: min 3 fő, max 20 fő
- Támadószint = MIN(csapat Alakzatharc) + Vezető_fok×2 + MIN(csapat Támadó-alakzat fok)×2
- Védekezőszint = MIN(csapat Alakzatharc) + Vezető_fok×2 + MIN(csapat Védekező-alakzat fok)×2
- Alakzat TÉ = AVG(tagok TÉ) + harcmodor_bónusz(Támadószint)
- Alakzat VÉ = AVG(tagok VÉ) + harcmodor_bónusz(Védekezőszint) + MIN(tagok, 10)
- Kezdeményezés: alakzat mindig nyer egyén ellen
- VÉ csökkentés ellen: -2 (normál), -3 (Teljes Védekezés)
- VÉ csökkentés által: fix 3 (pengealap/hátrány) vagy 4 (előny), +1 ha 5+ fő
- ÉP: 28/fő, minden 28 ÉP-nél -1 fő
- Taktikák: fix módosítók (Támadó +3/-6, Védő +4/-8, Roham +4/-8, Fárasztó +2 csökk)
- Tiltott egyén által alakzat ellen: Fárasztó, Kezdeményező, Kiváró, Visszafogott

**Képzettség:**
- Alakzatharc (primer/harci) — már felvehető, szintje beleszámít max_HM-be (rules.json)

**Fortélyok (yaml-ok léteznek, módosítók üresek):**
- Alakzatharc (`alakzatharc.yaml`) — többszörös (spec_típus: "harci alakzatok", spec_lista: ["lovas ék", "testudo"]), maxfok: 2
- Alakzat: támadó (`alakzat_tamado.yaml`) — maxfok: 2, követelmény: Harcmodor ≥ 6
- Alakzat: védekező (`alakzat_vedekezo.yaml`) — maxfok: 2, követelmény: Harcmodor ≥ 6
- Vezető: Alakzatparancsnok (`vezeto_alakzatparancsnok.yaml`) — maxfok: 2, követelmény: Alakzatharc 6/9 + Befolyásolás ≥ 3
- Vezető: Fejvadász stratégis (`vezeto_fejvadasz_strategis.yaml`) — maxfok: 2
- Vezető: Íjászparancsnok (`vezeto_ijaszparancsnok.yaml`) — maxfok: 2
- Vezető: Léglovaskapitány (`vezeto_leglovaskapitany.yaml`) — maxfok: 2
- Vezető: Lovaskapitány (`vezeto_lovaskapitany.yaml`) — maxfok: 2
- Vezető: Testőrparancsnok (`vezeto_testorparancsnok.yaml`) — maxfok: 2

**Megjegyzés:** A Vezető fortélyok mindegyike +2 bónuszt ad az Alakzatszintre fokonként. A fortély hatása NEM a játékos karakter harcértékeit módosítja — az alakzat szintű kalkuláció NJK eszközben történik.

**TODO:**
- [ ] Alakzat típusok spec_lista bővítés (a md szerint: kicsi/nagy/lovas, gyalogos formációk)
- [ ] NJK Alakzat kalkulátor (KM eszköz): input tagok száma/szintek/fokok/TÉ-VÉ átlag → output alakzat harcértékek
- [ ] Aktív fül: "Alakzat ellen" helyzet hozzáadás (VÉ csökkentés mérséklés -2, taktika tiltások)
- [ ] Taktika megkötések: Fárasztó/Kezdeményező/Kiváró/Visszafogott → tiltott alakzat ellen
- [ ] engine_spec §28 TERV → IMPLEMENTÁLVA státuszra emelés implementáció után

### Méreggenerátor 🚧

Forrás: md/141_meregkeveres_szabalyai.md — Méreg paraméterek → Komplexitás kalkulátor (KM eszköz).

**Szabályrendszer összefoglaló:**
- Komplexitás = Erősség(1-10) + Súlyosság(1-5) + Elállás/Kiürülés(0-6) + Hatóidő(0-5) + Speciális(Σ)
- Min. Méregkeverés szint = MAX(CEIL(Komplexitás/2), legmagasabb paraméter Mk küszöb)
- Méregellenállás: (Edzettség + k6) vs Méreg_Erősség
- 4 típus: étel/ital, légi, kontakt, fegyver (elállás vs kiürülés szétválás)
- Speciális: +2/+3/+6 módosítók (többkomponens, sűrű, színtelen, szagtalan, félrevezető)

**Nyitott kérdések (wiki TODO.meregrendszer):**
- Hatás súlyossága: "Alvás" kategóriája (1 vagy 2?)
- Másodlagos hatás: -1 vagy -2 kategóriával alacsonyabb?
- Alapanyag követelmény: (Alkímia + Vajákosság) >= Komplexitás/2 — véglegesítendő
- Méregérzékelés: Méregkeverés próba alap célszáma hiányzik
- Hatás időtartama, FP mint hatás — nincs véglegesítve
- Elkészítés ideje — nincs modellezve

**TODO:**
- [ ] Konstansok YAML: méreg paraméter táblák (erősség, súlyosság, elállás, kiürülés, hatóidő, speciálisok)
- [ ] Méreggenerátor overlay (KM eszköz): input paraméterek → output komplexitás + min Mk + érzékelés nehézség
- [ ] Preset mérgek (144_peldamergek.md alapján): Lórúgás, Könnycsepp, Múló évszakok
- [ ] engine_spec §39 TERV → IMPLEMENTÁLVA státuszra emelés implementáció után

### Távharc fül
- ✅ Távharc kalkulátor (CÉ + VÉ) — §17: TavharcScreen.tsx implementálva
- ✅ Data layer: TavfegyverAlap, TavharcSzorzok típusok, tavharc_szorzok.json javítva, karakter séma (távfegyverek[], session.aktív_távfegyver_index)
- ✅ process_fegyverek.py: Harcmodor + Kategória post-process tavfegyverekre
- ✅ MesterfegyverBonusz: CÉ mező hozzáadva (konstansok + types)
- ✅ Fegyver felvétel/törlés/MF/Idea kezelés (szerkesztő mód), VÉ szorzó pickerek + Távolság popup (game mód)
- ✅ CM szerkesztő: Harcértékek fülről átkerült ide (max limit enforce)
- ✅ HM limit enforce (Harcértékek fül: HM_TÉ + HM_VÉ ≤ max_HM)
- ✅ Virtuális fegyverek: "Alkalmatlan fegyver hajítása" + "Alkalmatlan tárgyak hajítása" fortélyból
- ✅ Tab sorrend: Harcértékek a Távharc és Misztikus közé került
- ✅ Fortélyok fül: locked Mesterfegyver hint → "Távharc fülön kezeld" ha távfegyverhez tartozik
- ✅ Támadás/kör fix: 1 + FLOOR(HK/Seb) (alap 1 hiányzott)
- ✅ Nyílpuska: "1/2 kör" alapeset, "Gyors újratöltés" ≥1.fok → "1x" (konstansokból)
- ✅ MF követelmény hiba: piros szín ha nem teljesül (mint Harcértékek fülön)
- ✅ MF + Merevvért gomb: lila keret (`.he-field-fortely`)
- ✅ Célzás CÉ bónusz: feltételes fortély CÉ (0.fok kiérdemelt + magasabb fok override)
- ✅ Törlés gomb: padding fix (konzisztens méret)

### Lovas harc rendszer 🚧

Engine spec: §38.

**Data layer (✅ KÉSZ):**
- [x] `lovas_harc.yaml` + `leglovas_harc.yaml`: 0.fok (Alapeset) hozzáadva: TÉ:-9, VÉ:-9
- [x] `harci_helyzetek.yaml`: teljes kizárás mátrix (lovas↔léglovas↔magasabbról↔belharc↔földön↔helyhez kötve↔orvtámadás↔stb.) + `tiltott_fegyverfogások` mező
- [x] `taktikak.yaml`: "(Lég)Lovas roham" + "(Lég)Lovas támadás galoppból" — megkötés: `harci_helyzet/szükséges`
- [x] `taktikak.yaml`: "Roham" + "Öngyilkos roham" → megkötés: `harci_helyzet/tiltott`
- [x] `manoverek.yaml`: "Hátas táncoltatása", "Lovas áttörés", "Lóhátról lerántás", "Lovas megakasztása" (típus: "lovas")
- [x] `generate_tables.py`: "lovas" manőver típus validáció
- [x] `harci_helyzet.yaml` schema: `tiltott_fegyverfogások` mező

**Engine / Webapp (✅ KÉSZ):**
- [x] AktivScreen taktika picker: `harci_helyzet/szükséges` megkötés logika (új mód)
- [x] AktivScreen taktika picker: Roham/Öngyilkos roham disabled ha lovas/léglovas helyzet aktív
- [x] AktivScreen manőver picker: "Lovas" kategória csoport
- [x] AktivScreen fegyverfogás picker: data-driven `tiltott_fegyverfogások` (hárító+kétkezes disabled)
- [x] AktivScreen helyzet hozzáadás: fogás auto-reset ha tiltott
- [x] data-types.ts: HarciHelyzetEntry bővítés (id, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek, tiltott_fegyverfogások)
- [x] Magasabbról + összes kizárás: data-driven `kizár_helyzetek` (meglévő logika)
- [x] HarcScreen Ph oszlop: +1 penge kijelzés ha lovas helyzet + fortély ≥ 1.fok (data-driven: fortély yaml `pengehossz`/`min_pengehossz` módosítók)

### Harc fül
- ✅ Harc fül fegyvertábla: aktív fegyver sor normál, többi halványítva. Fegyverfogás ≠ Egyfegyveres: világoskék összesítő sor (`#90caf9`, kétkezes/pajzs/hárító).
- ✅ Szituáció → Körülmény beolvasztás: `szituaciok.yaml` törölve, 7 elem `harci_helyzetek.yaml`-ban (pozitív/semleges), `session.aktív_szituációk` törölve, picker 3 csoport
- ✅ Sérült státusz auto: useEffect (S3→fok1, S4→fok2), AktivScreen locked chip + picker szürkítve
- ✅ Távharc fortélyok data layer: `fortelyok/tavharc/` mappa (9 fortély yaml), "🏹 Távharc" picker csoport (`alcsoport` mező)
- ✅ Hatás pool: harci helyzet alatti fortély bónusz (`→ Fortély (fok): hatás ✔`), alapeset 0.fok hozzáfűzés az infóhoz
- ✅ Backtick → monospace formázás: `fmtCode()` helper (AktivScreen + FortelyokScreen), Harc fül számok monospace
- ✅ localStorage quota exceeded: try/catch (silent fail, nem crashel)
- ✅ Hárítófegyver VÉ: fortély-ellenőrzés (`hasHárítóFortély`) — nincs fortély → hárítóVÉ = 0
- ✅ Teszt karakter: megerősítő popup eltávolítva (közvetlen betöltés)
- ✅ Kétkezes harc harckeret: dupla számolás fix (yaml feltételes módosító + konstans 0.fok, nem duplikálva)
- ✅ Kétkezesség harckeret +1: feltétel hozzáadva (`session.kétkezes_harc == true`)
- ✅ `aktívFeltételek` Set: `fegyverfogás:{id}` hozzáadva (HarcScreen + AktivScreen)
- ✅ HatterekScreen: pushUndo bekötve (háttér módosítás → isDirty + testMode kezelés)
- ✅ Üres karakter nem mentődik (név+képzettség+fortély mind üres → autosave skip)
- ✅ pushUndo: testMode kikapcsol (teszt karakteren módosítás → saját karakter lesz)
- ✅ Státuszok szekció: per-elem megjelenítés (nem aggregált), státusz név+alcím bordó (`#cd7c6f`), hatás sorok fehér, szöveges: csak megjegyzés
- ✅ Karakterek overlay: slot név max 15 karakter + `..` + verzió suffix megtartva
- ✅ Harci helyzetek picker: csoport label félkövér
- ✅ `esemenyek.yaml`: `általános` cél hozzáadva (csoport: egyéb) szöveges narratív hatásokhoz
- ✅ Taktika VÉ eltolás limit: `konstansok.taktika_vé_eltolás_limit: 10`, HarcScreen clamp
- ✅ Hárítófegyver MF VÉ bónusz: hárítóVÉ-hez hozzáadva
- ✅ ScreenErrorBoundary: minden tab renderelés burkolt, crash → hibaüzenet (nem fehér halál)
- ✅ Tab indikátor: ezüst karika (`#b0bec5`, aspect-ratio:1), fix 42×42px gombok, gap:4px, center pozíció animált (0.2s)
- ✅ Game mód transition: 2000ms ease
- ✅ Fortélyok fül: fok pöttyök balról jobbra, 3 fix hely (hidden ha maxfok < 3)
- ✅ Fortélyok fül: követelménytext lista formátum (schema + 177 yaml konvertálva)
- ✅ Fortélyok fül: Követelmény sor fmtCode() (backtick→monospace)
- ✅ Fortélyok fül: csoport label szín világos lila (`#ce93d8`, 17px)
- ✅ Harcértékek: Merevvértviselet gomb mindig megjelenik (nem csak merevvértnél)
- ✅ Harcértékek: "Harci képzettségek" szerkeszthető szekció (Tul/Képz fülről átkerült, kep-row + szint picker + ✕ + dropdown)
- ✅ Misztikus fül (✨): teljes implementáció (Aura/ME/Mágia akarata boxok, Tradíció kétlépéses picker, Arkánumok, Faj misztérium auto, Ősi nyelv free-text)
- ✅ Tul/Képz: harci + misztikus csoport kiszűrve (átkerült Harcértékek/Misztikus fülre)
- ✅ Tul/Képz: képzettségek ABC sorrendbe (szint desc helyett)
- ✅ Tul/Képz: Arkánum képzettség felvétel bug fix (`:` split nem roncsol önálló neveket)
- ✅ Tul/Képz: Arkánum piros ha nincs Tradíció (warning prop)
- ✅ Képzettség csoport label: kék (`#42a5f5`, 17px) mindhárom fülön
- ✅ Képzettség szint szín: fehér normál, zöld ≥9, piros >tsz limit (egységes `.kep-szint` class)
- ✅ Távharc VÉ szín: zöld ha VÉ ≤ CÉ+1 (tuti találat)
- ✅ Aura rules.json szabály: `2*(tsz+önuralom)`, konstansok: aura.mágiaellenállás_konstans + táblák
- ✅ Primer KP bontás box (Tul/Képz fül alja, szerkesztő módban): HM/CM, harcmodor, misztikus, világi, harci fort, miszt fort — részletes bontással
- ✅ Primer KP: távharc harcmodorok (Hajítás, Íjászat, stb.) is primerként számolva (App.tsx fix)
- ✅ Új karakter popup: szöveg frissítve ("NEM vész el, mentésre kerül")
- ✅ Upstream sync: Belharc→Belharcos, Belharci szituáció→Belharci helyzet, Körülmények megszűnt
- ✅ Harci fortélyok: követelménytext kitöltve (18 fortély, szöveges követelmények md-ből)
- ✅ empty_karakter.json: hiányzó session mezők pótolva (strict schema)
- ✅ Becenév mező: karakter schema + Tul/Képz fül (max 12 kar), browser tab title override
- ✅ Fortély schema: `kiérdemelhető` mező (177 yaml frissítve), `todo` mező eltávolítva (175 yaml-ból)
- ✅ Misztikus fortélyok: Fortélyok fülről → Misztikus fülre áthelyezve, FortélyFelvétel wizard
- ✅ Többszörös fortély fix: Titkos szervezet, Különleges faj boncolása, Tánc: belső stílus, Harci iskola (free-text)
- ✅ Többszörös fortély fix: Belső/Külső síkok lényeinek ismerete (fix lista picker)
- ✅ Kiérdemelt fortélyok: nem számítanak primer költésbe, nem foglalják az ingyenes keretet
- ✅ Modularizáció: file-ops, feltetelek, ketkezes, validate, undo-helpers, formatters, HatasPoolCalc, NaploTab, TulajdonsagCell, PrimerKpBox, FortelyFelvetel, data-types, helpers, AktivHelpers
- ✅ Data layer kiemelés: fegyver_anyagok, képzettség/fortély_csoport_sorrend, nyelv_fok_nevek, pinned_taktikák, közös_nyelv, tulajdonság_sorrend → konstansok.yaml
- ✅ Jegyzetek overlay: floating célszám panel (Tulajdonságpróba k6, Képzettségpróba k10) — `<details>` accordion
- ✅ Fullscreen: requestFullscreen user gesture fix (setShowMenu a hívás után, nem előtte)
- ✅ Aktív fül ikon: ❎ → ✳️
- ✅ Harc + Távharc screen: h2 fejléc hozzáadva (🗡️ Harc, 🏹 Távharc)
- ✅ Távharc screen: "Távfegyverek" szekció cím eltávolítva (redundáns a h2-vel)
- ✅ Harcértékek screen: Harci képzettségek display name ("Harcmodor: X", "Táv. harcmodor: X")
- ✅ Harcértékek screen: Harci képzettség felvételkor szint picker automatikusan felugrik
- ✅ Mesterfegyver követelmény: fegyver-specifikus harcmodor ellenőrzés (nem az egész OR lista, hanem a fegyver kategóriájához tartozó harcmodor)
- ✅ MF fok chip: ha követelmény nem teljesül, alatta piros `⚠ Harcmodor ≥ X` szöveg (mindkét screen)
- ✅ Visszavonás: VÉ visszanyerés pozitív esetben "VÉ visszanyerés: +X" (nem "VÉ csökkenés")
- ✅ Aktív screen: `margin-top: auto` bug fix (tartalom alulra igazítódott nagy screenen)
- ✅ Aktív screen: szekció elválasztó vonal eltávolítva (`.aktiv-section` border-bottom)
- ✅ Aktív screen: Manőver szekció szín világos szürke (`#bbb`, volt zöld)
- ✅ Aktív screen: "Narratív módosítók" → "Narratív Előny/Hátrányok"
- ✅ Aktív screen: Hatás pool egyszerűsítés (`.hatas-pool-section` wrapper eltávolítva, "Fortély bónuszok" cím eltávolítva)
- ✅ Aktív screen + Távharc screen: Escape bezárás hiányzó popup-okra (Fegyverfogás, Narratív, MF fok, stb.)
- ✅ Taktika fortély_bővítés: generikus rendszer (taktikak.yaml `fortély_bővítés` mező, extra fok extrapoláció, lila ● jelölés, invalidáció fortély törlésnél)
- ✅ Anyanyelv picker: ABC sorrend (hu locale)
- ✅ Schema konzisztencia: `karakter.yaml` bővítve (uid, id_leíró), `szituacio.yaml` elavult schema törölve, `taktika.yaml` schema + source bővítve (fortély_bővítés)
- ✅ Lovas harc rendszer implementálva (§38 engine_spec, data layer + webapp kész, Ph kijelzés opcionális)
- ✅ Harci helyzetek kizárás mátrix: 13 helyzet kölcsönös kizárásai definiálva (harci_helyzetek.yaml `kizár_helyzetek`)
- ✅ Harci helyzet `tiltott_fegyverfogások` mező: data-driven fegyverfogás tiltás (schema + yaml + AktivScreen generikus logika)
- ✅ HarcertekekScreen bug fix: harci képzettség felvétel szint picker cancel → 0.szintű képzettség eltávolítása (korábban szint:1-gyel maradt)
- ✅ Fortélyok fül: Mesterfegyver követelmény kijelzés → konkrét harcmodor név ("Harcmodor - Kardvívás ≥ 8" a generikus "Harcmodor ≥ 8" helyett)
- ✅ Refaktor: `as any` cast eliminálás (28→14), `isHelyzetAvailable()` + `renderHelyzetItems()` + `renderTaktikaFokok()` helperek, `FegyverChip` + `PancelPopup` + `FegyverfogásPicker` alkomponensek, `lookupFegyver` helper (16 helyen alkalmazva), App.tsx KP sáv `useMemo`, NaploTab + HarcertekekScreen + MisztikusScreen inline style → CSS class konverzió
- ✅ CSS konverzió állapot (200+ kar sorok): App.tsx 0 ✅ | NaploTab 0 ✅ | AktivScreen 1 ✅ | FortelyokScreen 1 ✅ | TavharcScreen 1 ✅ | TulajdonsagokScreen 1 ✅ | HarcScreen 3 ✅ | MisztikusScreen 3 ✅ | HarcertekekScreen 13 (maradék: className logika, nincs inline style)
- ✅ Szabályrendszer md: harci helyzet kizárások (`❌ Kizárja:`) hozzáadva 065_01_01/02/03 fájlokhoz
- ✅ "Lovas akasztása" → "Lovas megakasztása" átnevezés (data + md)
- ✅ Kétkezes harc gyengébb kéz bug fix: pajzs (idx:-2) kiszűrve a dropdown-ból
- ✅ Napló fókusz bug fix: belső `EntryForm` komponens → `renderForm` helper (nem remountolódik state változáskor)

## Fontos konvenciók
- Módosító módok: `flat`, `scaled`, `override`, `enyhít`, `előny`, `hátrány`
- Feltétel típusok: string (session dispatch: `"taktika:X"`, `"harci_helyzet:Y"`) VAGY lista (kalkulált: `[{forrás, operátor, érték}]`)
- Feltétel prefixek (string): `harci_helyzet:`, `taktika:`, `fegyver:`, `fegyver_kategória:`, `fegyverfogás:`, `páncél:`, `manőver:`, `státusz:`, `szituáció:` (backward-compat)
- ID konvenció: YAML-ban `id` mező (snake_case, ékezetes). JSON-ban generált `feltétel_kulcs: "{prefix}:{id}"`. Manőver id: fortély `manőver:{id}` cél referencia.
- Kalkulált feltétel forrásai: session mezők + reactive engine computed + ctx (generikus lookup, nincs hardcode)
- `engine/alapeset.ts`: `evaluateAlapesetek()` + `evaluateFeltétel()` — 0.fok kiértékelés, prefix dispatch
- Követelmények: elemek között ÉS, egy elem név listája VAGY
- Mesterfegyver NEM számít a max HM-be
- Manőver Pont: `CEIL(harcmodor_összeg x 2 / tsz)`
- KP tábla: v8.6.0 értékek (2.5-tel osztott)
- WSL + NTFS: nincs symlink, Vite serveDataPlugin oldja meg
- .obsidian/ könyvtár SOHA ne módosítandó
- Képzettség `többszörös` mező: string lista (nem boolean!)
  - `[]` = egyszer felvehető
  - `["Közelharc", "Kardvívás", ...]` = fix alnevek listája
  - `["*"]` = szabad szöveges alnév (prompt, max 20 karakter)
- Többszörös képzettség belső tárolás: fix listánál alnév önmagában (pl. `"Közelharc"`), szabad szövegesnél `"AlapNév: xyz"`
- Fortély yaml mezők: `kp_perfok` (KP/fok), `ingyenes_perszint` (0=nincs, 2=minden 2.TSz 1 db), `többszörösség.spec_típus`+`spec_lista`
- Többszörös fortély belső tárolás: `{ név: "Kultúrkör", fok: 1, spec_típus: "kultúrkör", spec_elem: "erv" }` — név mindig az alapnév
- Többszörös fortély KP lookup: `f.név` → fortelyKpMap (név = alapnév, nem kell split)
- Többszörös fortély display name: `f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név`
- Karakter séma: v2 (`data/schemas/karakter.yaml`), egységes `fortélyok[]` tömb, `session` szekció runtime state-nek
- Karakter mentés formátum: egyetlen `.json` fájl (karakter + session), NEM tartalmaz származtatott értékeket
- Teszt karakter: `data/karakter/test_karakter.json` a single source of truth; runtime fetch
- Validáló script: `web/validate_karakter.py` — ellenőrzi a test_karakter.json konzisztenciáját (yaml defs, KP, faj, session)
- Strict schema: minden YAML source fájlban explicit megvan minden séma-mező (nincs implicit default, `generate_tables.py` setdefault csak biztonsági háló)
- Session toggle fortélyok: yaml `session_toggle: true` → Aktív fülön generikus toggle gomb, HarcScreen csak aktív toggle-nél alkalmazza TÉ/VÉ módosítókat
- Pengelimit: `konstansok.kétkezes_harc_max_pengeméret` (nincs hardcode 2.0)
- Kétkezes harc data-driven: `konstansok.kétkezes_harc_bónuszok[]` tartalmazza `mindkét_fegyver_értékei`, `mf`, `TÉ`, `VÉ` fokonként. Harckeret bónusz: yaml fortélyból (`fegyverfogás:kétkezes` feltétel), 0.fok: konstans +1.
- Pengelevonás osztó: `konstansok.kétkezes_harc_pengelevonás_osztó` (0.5)
- Harcmodor nevek: `[...new Set(Object.values(konstansok.fegyver_kategória_harcmodor))]` — unique-olt (pajzs kategória duplikálná Közelharc-ot)
- Harcmodor display name (Harcértékek fül): közelharci → "Harcmodor: X", távharci → "Táv. harcmodor: X", egyéb → nyers név. Csak megjelenítés, belső referenciák a nyers nevet használják.
- Többszörös státuszok: yaml `többszörös: true` + `alkategóriák: [...]` → generikus alkategória almenü picker
- Fegyverfogás: `session.fegyverfogás` explicit mező (enum: egyfegyveres/fegyver_pajzs/fegyver_hárító/kétkezes), opciók `konstansok.fegyverfogás_opciók`-ból
- Fegyver `Hárító` flag: `fegyverek.json`-ban `"1"/"0"` (process_fegyverek.py generálja: név prefix "Hárító:" / ", hárító" / Speciális "Hárítófegyverként")
- Fegyver `Erőbónusz limit`: `"0"` = nincs erőbónusz, `"99"` = korlátlan. Kód: `parseInt(érték)` ha nem üres, else 99 (üres/NaN nem fordul elő strict schema-val).
- Pajzs TÉ büntetés: `konstansok.pajzs_TÉ_büntetés` (1D: méret→büntetés) + fortély yaml `pajzs_TÉ_mérséklés` mód
- Fortély `emlékeztető` flag: yaml `emlékeztető: true/false` → AktivScreen Hatás pool "Fortély bónuszok" szekció (19 fortélynál true)
- Session default: `DEFAULT_SESSION` (types.ts-ben exportálva), betöltéskor hiányzó session pótlása
- Deploy: GitHub Pages, `https://kaktusztea.github.io/szilankrpg/`, auto-deploy push master-re
- Generált JSON-ok: `data/generate_tables.py` script → `tables/` könyvtár (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek, taktikák, harci helyzetek, manőverek, státuszok, hatások, események, hátterek)
- Vite plugin: dev szerver indulásakor automatikusan futtatja a generate_tables.py-t; nincs per-request regenerálás
- Runtime: minden adat `tables/*.json`-ból fetchJson-nel, nincs YAML parse, nincs js-yaml dependency
- Touch event isolation: kep-row-on `onTouchStart/End stopPropagation` (szerkesztő módban, védi a véletlen lapozást)
- Swipe isolation popup overlay-eknél: App.tsx `handleTouchStart` `.closest('.kep-prompt-overlay')` check → swipe letiltva
- Context menu prevention: `onContextMenu preventDefault` + `-webkit-touch-callout: none` + `user-select: none`
- Értékválasztó popup-ok: érték kiválasztása azonnal bezárja (nincs OK/Mégse gomb), Escape bezárja módosítás nélkül
- Szint választó (képzettségek): gombok 1-15 grid (5 oszlop), aktív=zöld
- Fok választó (fortélyok): kerek radio gombok (1..maxfok), aktív=zöld
- Popup dialógusok: createPortal(document.body) — kiszöknek a screen-slide overflow kontextusból
- Tap interakció: minden szerkesztő elem egyetlen koppintásra reagál (popup megnyitás)
- Locked fortélyok (Harcértékek fülön kezeltek): `konstansok.yaml → locked_fortélyok` lista. Fortélyok fülön nem szerkeszthető/törölhető, dropdown-ból kiszűrve.
- MK fegyverek: `fegyverek.json` MK_pár (pár másik tagja) + Alapnév (display name suffix nélkül) + Hárító flag; process_fegyverek.py generálja
- méret_illeszkedés értékek: `passzol`, `nem passzol`, `borzalmas` (MGT: 0, 3, 6)
- Faj: inline `<select>` (nincs popup, közvetlenül koppintható szerkesztő módban)
- Rövid koppintás szerkesztő módban: nem csinál semmit (képzettségek, fortélyok)
- Rövid koppintás Game módban: accordion info toggle
- Törlés megerősítő dialógus: centered név + piros gomb ("Képzettség törlése" / "Fortély törlése")
- Reset megerősítő dialógus: piros centered gomb ("ÉP Reset" / "VÉ Reset"), disabled ha nincs mit resetelni
- Default tab induláskor: Tul/Képz (index 5 az ALL_TABS-ban)
- Fájdalomtűrés enyhítés: konstansok.fájdalomtűrés_enyhítés táblából, dinamikusan frissül szint módosításkor
- ÉP TÉ footer tap: navigál Tul/Képz fülre + scroll Fájdalomtűrés képzettséghez (data-kep attribútum)
- Sebesülés popup: típus+érték gombok, mindkettő kiválasztva → auto-close, 1-15 látható + ▾ lenyitó (16-40)
- Gyógyulás popup: ÉP/FP + érték gombok, auto-select ha csak egy típus, auto-close
- Overlay cancel: mellé koppintás (globális click handler `el.classList.contains('kep-prompt-overlay')` → dispatch Escape)
- iOS kompatibilitás: egyszeri tap interakció, `-webkit-tap-highlight-color: transparent` globálisan, `touch-action: manipulation` ahol kell
- **Reactive Engine irányelv**: minden számítási mechanika a `data/rules.json`-ban van (54 szabály). Nincs TS engine modul. A HarcScreen és App.tsx csak context-et épít (lookup táblák, string context, extras) és `evaluate()`-ot hív. Maradék TS inline logika: Fájdalomtűrés enyhítés (küszöb-tábla lookup). §16 fortély módosítók (mindig-aktív + feltételes) és taktika módosítók implementálva a HarcScreen-ben (iteráció fortelyok + session aktív taktikák/helyzetek felett).
- Tradíció képzettség: `"Tradíció: Vulgármágia"` formátum (nem `többszörös` yaml mező!), tradiciok.json-ból picker; Szakrális altípusoknál isten választó (pantheon csoportosítva)
- `tables/tradiciok.json`: egységes struktúra `{ név, típus, altípusok[] }` — altípusok lehetnek egyszerű (Bárdmágia) vagy pantheon-csoportosított (Szakrális/istenek)
- `tables/nyelvek.json`: 37 nyelv `{ név, csoport }` — Nyelvismeret fortély picker ebből kínál csoportosított dropdown-t
- Szabad fortélyok: `kp_perfok: 6`, csoport-szintű ingyenes keret = TSz db; kiérdemelt fortélyok (`kiérdemelt: true`) nem fogyasztják se a keretet se a KP-t
- Fortély `kiérdemelt?: boolean` mező: opcionális, szabad fortélyoknál felvételkor "Felvett/⭐ Kiérdemelt" picker
- Nyelvismeret fortély: pont keret = `max(0, (nyelvtanulás_szint - 3) * 3)`, dropdown disabled ha keret elfogyott, piros jelzés túllépésnél (hátulról). Kiérdemelt Nyelvismeret: fizetős fok = `max(0, fok - 1)` (első fok ingyenes).
- Alkalmatlan fegyver hajítása: `spec_típus: "fegyver"` → dropdown a karakter fegyvereiből (nem freetext)
- Képzettség limitek: primer max = TSz, szekunder max = TSz+3; túllépés → piros név + szint (`kep-over` class)
- `mentés_dátum`: karakter JSON-ba mentéskor YYYY-MM-DD HH:MM formátumban
- `szilánk`: session alá került (nem top-level karakter mező)
- Napló fül (📖 editOnly): bejegyzések (dátum, KM, kaland, események), accordion lista, szerkesztés/törlés, `karakter.napló[]` tömb
- Pajzs adatmodell: `karakter.pajzs: { méret: string }` — top-level mező (mint páncél)
- Pajzshasználat fortély: locked a Fortélyok fülön, source of truth a `fortélyok[]` tömb
- Nyelvismeret fok megjelenítés: "Alap" (fok:1), "Udvari" (fok:2) — `NYELV_FOK_LABELS` konstans a FortelyokScreen-ben
- Nyelvismeret felvétel: custom styled gomb-lista overlay (`.nyelv-picker`, `.nyelv-csoport`, `.nyelv-btn`), mellé katt/Escape cancel
- Kor választó: 10–58 / 60–100 toggle split (cserélődő tartalom, nem append), 42x42px kerek gombok
- Harcértékek fül szekció elválasztó: `.he-section + .he-section { border-top }`, h3-on nincs border-bottom
- process_fegyverek.py: pattern fájlok helye `data/tables/*_pattern.json` (fegyver, tavfegyver, pajzs). Hárítófegyverek beolvasztva fegyverek.json-ba (md tag átnevezés). Pajzsok hozzáfűzve fegyverek.json-hoz (kategória: "pajzs", pajzsok.json-ból).
- Fejléc: ⚙️ menü gomb (overlay popup: Karakter betöltése/mentése, Új/Teszt karakter) + 🔧/🎮 mód toggle
- Tab bar: tükrözött (jobb→bal), induláskor `scrollLeft = scrollWidth`, ikon-only fülek, 18px font, aktív tab alatti 3px accent csík (slide animáció)
- Screen slider: tükrözött (`TABS.length-1-activeTab`), swipe irány invertált
- `karakter.anyanyelv`: top-level string mező, nyelvek.json-ból választható, szinkronizálja kiérdemelt Nyelvismeret fortélyokat
- Kiérdemelt Nyelvismeret: `kiérdemelt: true`, fok emelhető, pont számítás: `max(0, fok-1)` fizetős; 🎁 / 🎁➕ jelölés
- Ingyenes jelölés egységesítés: minden "ingyen kapott" fortély 🎁 jellel (Kultúrkör, Helyismeret, Szabad keret, kiérdemelt Nyelvismeret)
- Game mód: üres képzettség/fortély csoportok elrejtve
- §16 fortély módosítók: `fortelyMods` Record a HarcScreen-ben, generikus iteráció fokok[].módosítók-ból. 6 mód (flat, scaled, override, enyhít, előny, hátrány). `fortelyok.json` tartalmazza a módosítókat. AktivScreen: manőver bónuszok + előny/hátrány szekció a Hatás pool-ban (feltétel szűréssel).
- Páncél gombok: disabled + `.he-field-disabled` ha nincs struktúra (`!k.páncél.alap`)
- Aktív fül adatforrások: `taktikak.json`, `harci_helyzetek.json`, `manoverek.json`, `statuszok.json`, `hatas_operatorok.json`, `esemenyek.json`, `hatterek.json` — generate_tables.py validáció
- Taktika kombó: `kombó_mód: "whitelist"|"blacklist"` + `kombó_lista: string[]`
- Taktika fortély_bővítés: `fortély_bővítés: { fortély: string, extra_fokok_per_fok: number } | null` — minden taktikában explicit (strict schema). Extra fokok: lineáris extrapoláció utolsó definiált fokból. Lila ● jelölés picker-ben. Invalidáció useEffect-tel (App.tsx).
- Session v2: `aktív_taktikák: AktívTaktika[]`, `aktív_helyzetek: string[]` (körülmények is itt, régi `aktív_szituációk` törölve)
- Taktika megkötés típusok: `harci_helyzet/tiltott` (adott helyzetnél NEM használható), `harci_helyzet/szükséges` (adott helyzet(ek) aktív szükséges, §38), `harcmodor/tiltott`, `támadások/min`, `per_küzdelem/max`, `többes_harc/tiltott`
- Harci helyzet `tiltott_fegyverfogások`: yaml lista mező (§38.4). Ha aktív helyzet tartalmazza a fogás id-ját → Fegyverfogás picker disabled + helyzet hozzáadáskor auto-reset Egyfegyveresre. Data-driven, nincs hardcoded id a kódban.
- AktivScreen.tsx: Hatás pool (Fortély bónuszok + Alapesetek) + taktikák/helyzetek/manőver/státuszok overlay picker + Fegyverfogás picker + fegyver Ügyesebb/Gyengébb kéz + páncél toggle + narratív Előny/Hátrányok
