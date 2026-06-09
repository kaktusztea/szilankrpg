# Szilánk RPG — Fejlesztési állapot guide

## Repo struktúra
```
/mnt/c/repo/szilank.code/
├── md/                        ← Éles szabályrendszer (markdown)
├── data/                      ← Adatfájlok
│   ├── schemas/               ← YAML sémák (fortely, kepzettseg, karakter, pancel, fegyver, faj)
│   ├── fortelyok/             ← Fortély adatfájlok (168 db, csoportonként alkönyvtár)
│   │   ├── harci/             (44 db, mind részletes)
│   │   ├── altalanos/         (41 db, mind részletes)
│   │   ├── szabad/            (59 db, alap kitöltés)
│   │   ├── erzekek/           (6 db, mind részletes)
│   │   ├── kiemelt/           (9 db, mind részletes)
│   │   └── misztikus/         (9 db, mind részletes)
│   ├── kepzettsegek/          ← Képzettség adatfájlok (39 db)
│   ├── fajok/                 ← Faj hátterek (26 db)
│   ├── tables/                ← Generált JSON táblák (generate_tables.py által: konstansok, fegyverek, távfegyverek, pajzsok, KP, harcmodor bónusz, távharc szorzók, tradíciók, képzettségek, kiterjesztések, fajok, faj keretek, primer fortélyok, fortélyok)
│   ├── generate_tables.py    ← YAML→JSON generáló script (Vite plugin és prebuild futtatja)
│   ├── rules.json             ← Reactive engine szabályok (53 deklaratív képlet/aggregáció)
│   ├── konstansok.yaml        ← Központi konstansok (forrás, JSON-ba generálódik)
│   ├── empty_karakter.json    ← Üres karakter template (induláskor betöltődik)
│   ├── test_karakter.json     ← Teszt karakter (single source of truth)
│   ├── engine_spec.md         ← Engine kalkuláció spec (§1-§20, minden formula)
│   └── gui_spec.md            ← GUI spec (11 screen, viselkedés, formázás)
├── web/                       ← React + Vite + TypeScript webes app
│   ├── src/
│   │   ├── engine/            ← Kalkulációs engine modulok
│   │   │   ├── types.ts       ← Típusdefiníciók (Karakter v2, Session, Fortely, stb.)
│   │   │   ├── data-loader.ts ← JSON betöltés runtime
│   │   │   ├── reactive.ts   ← Reactive rule engine (evaluate, buildContext, buildArrayContext)
│   │   │   └── index.ts       ← Barrel export
│   │   ├── components/
│   │   │   ├── HarcScreen.tsx  ← Harc fül (KÉSZ)
│   │   │   ├── HarcScreen.css
│   │   │   ├── EpTable.tsx     ← ÉP rubrika táblázat
│   │   │   ├── EpTable.css
│   │   │   ├── TulajdonsagokScreen.tsx  ← Tulajdonságok + Képzettségek fül (KÉSZ)
│   │   │   ├── TulajdonsagokScreen.css
│   │   │   ├── FortelyokScreen.tsx      ← Fortélyok fül (KÉSZ)
│   │   │   ├── FortelyokScreen.css
│   │   │   ├── HarcertekekScreen.tsx    ← Harcértékek fül (KÉSZ)
│   │   │   └── HarcertekekScreen.css
│   │   ├── App.tsx             ← Tab shell + swipe + animáció + Szerk/Game mód
│   │   ├── App.css             ← Globális stílusok, dark theme
│   │   └── testdata.ts         ← 8. szintű teszt karakter + elvárt értékek
│   ├── vite.config.ts          ← Vite config (serveDataPlugin, metadata generation, polling, host)
│   ├── generate_metadata.py   ← Build metadata generátor (verzió: ÉV.ÉVNAPJA.napibuild)
│   ├── validate_karakter.py   ← Teszt karakter validáló script
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/          ← CI/CD (linkspector, fegyverek, KP, harcmodor, onefile)
├── code/                       ← Python scriptek (process_fegyverek.py + lib/)
└── segedlet/                   ← ODS karakteralkotó (v9.3.2)
```

## Elkészült
- ✅ Adatmodell: 5 schema (fortely, kepzettseg, karakter, pancel, fegyver, faj)
- ✅ Konstansok: teljes (KP, arányok, páncél, harcmodorok, mesterfegyver, kétkezes harc, merevvért, pajzs, aura, nyelvek, feltétel prefixek)
- ✅ Engine spec: 20 szekció, validálva a szabályrendszer + ODS ellen
- ✅ Engine core: TypeScript implementáció, tesztelve 8.szintű karakter ellen (15/18 ✅, maradék 3 javítva)
- ✅ GUI spec: 9+1 screen leírás, formázás, viselkedés
- ✅ Harc fül UI: KÉ/SFÉ/VÉ csökk/MP boxok, fegyvertábla, ÉP rubrika táblázat (sebesülés/gyógyulás/compaction/TÉ levonás)
  - VÉ csökkenés: label "VÉ csökkenés", negált kijelzés (-3, -5...), gombok: -1/-2/-3/+1/⟲
    - VÉ tábla flash: sárga (csökkenéskor), zöld (+1 visszaadáskor), 1s fade-out
    - -1/-2/-3 gombok disabled ha minden fegyver VÉ = 0; +1 disabled ha csökkenés = 0
    - ⟲ reset: disabled ha 0, megerősítő popup ("VÉ Reset")
    - VÉ értékek nem mennek 0 alá (Math.max(0,...) clamp)
    - Double-tap label/értékre: VÉ csökkenés történet popup (pl. "-3; -2; -2; +1"), mellé kopp bezárja
  - VÉ csökkent: reset gomb → megerősítő popup ("VÉ Reset"), disabled ha 0
  - ÉP táblázat fejléc: 4 oszlopos grid (ÉP érték, ÉP reset gomb, Seb gomb, Gyógy gomb)
  - Sebesülés/Gyógyulás: overlay popup (típus+érték gombok, auto-close mindkettő kiválasztva)
  - Sebesülés: 1-15 látható + ▾ lenyitó 16-40
  - Gyógyulás: auto-select ha csak 1 típusú seb van
  - ÉP Reset: megerősítő popup, disabled ha nincs seb
  - TÉ levonás: Fájdalomtűrés enyhítés (konstansok.fájdalomtűrés_enyhítés), dinamikus
  - TÉ footer double-tap: navigál Tul/Képz → scroll Fájdalomtűrés-hez
  - képzettségek prop: lifted state, Fájdalomtűrés szint módosítás azonnal hat
- ✅ Tab rendszer: swipe + animáció (0.15s) + scrollozható tab bar
- ✅ Szerkesztő/Game mód toggle
- ✅ Data betöltés: Vite plugin a ../data/ könyvtárból (nincs duplikálás)
- ✅ 168 fortély yaml, 39 képzettség yaml, 26 faj yaml
- ✅ Tulajdonságok + Képzettségek fül: teljes UI (szerkesztő + game mód)
  - Fejléc: Név (double-tap → szerkesztő popup) + Szint (double-tap → gombgrid 3-21, 5 oszlop, utolsó sor középre)
  - Faj: inline `<select>` dropdown (szerkesztő módban közvetlenül koppintható) + Kor box (double-tap → két lépéses popup: tartomány → érték)
  - Game módban Faj+Kor a Név mellé konkatenálódik: "Dorek (Ember (Északi), 32)"
  - Tulajdonságok: fix 2×4 grid, teljes nevek, double-tap → popup gomb-grid (-5..+7), érték választás bezárja
  - Faj limit warning: sárga szín + koppintásra lenyíló "Faj max/min: X" ha túllépés
  - Képzettségek: 7 csoportban (összecsukható), dropdown + azonnali szint popup, ✕ törlés (piros megerősítés)
  - Szint választó: popup gombok 1-15 grid (5×3), aktív=zöld, érték választás bezárja (double-tap triggereli)
  - Szint színkód: 0=piros, 1-8=sárga, 9+=zöld
  - Többszörös képzettségek: generikus `többszörös` lista mező (fix alnév lista VAGY `["*"]` szabad szöveges max 20 kar)
  - Többszörös felvételkor csoportosítva a testvéreik mellé kerülnek
  - Game mód adatlap: próba, domináns tulajdonságok, kiterjesztő fortélyok
  - Rövid koppintás szerkesztő módban: nem csinál semmit (csak double-tap)
- ✅ Fortélyok fül: teljes UI (szerkesztő + game mód)
  - 6 csoport (Harci → Általános → Érzékek → Szabad → Kiemelt → Misztikus), összecsukható
  - Fok kijelzés: szám, szín: sárga (nem max), zöld (max)
  - Dropdown: `"Név (max X)"`, ingyenes kerettel: `🎁N`, KP-t adó: `➕6-12-18KP`
  - Többszörös fortélyok: generikus `többszörösség` yaml mező alapján
    - `spec_típus` + `spec_lista: [...]` → fix lista dropdown (szűri a már felvetteket)
    - `spec_típus` + `spec_lista: []` → freetext popup (max 20 kar)
    - Példányok neve: `"AlapNév - alnév"` formátum
  - Fok választó: kerek radio gombok (1..maxfok), aktív=zöld, maxfok=1 → "1 fok a maximum" hint (2s, warning szín)
  - Ingyenes keret: `floor((TSz+1)/ingyenes_perszint)` db, 🎁 jel az ingyeseknél
  - KP logika: `kp_perfok` per fortély, base name lookup többszörös fortélyoknál
  - Törlés: mindig megerősítő dialógus (piros "Törlés" gomb)
  - Game mód: koppintás → accordion info (leírás, hatás, követelmény, kiterjesztések)
  - Rövid koppintás szerkesztő módban: nem csinál semmit (csak double-tap)
- ✅ KP sáv (szerkesztő mód, minden fülön, tab-bar felett)
  - Két szekció: "Maradt KP: X" (bal, piros ha <0) + "Primer keret: Y" (jobb, piros ha <0)
  - Dinamikus: képzettség/fortély módosítás azonnal frissíti
  - Képzettségek és Fortélyok state az App szintjén (lifted state)
- ✅ Build pipeline: YAML → JSON generálás automatizálva
  - `data/generate_tables.py`: központi script (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek)
  - Vite plugin: dev szerver indulásakor automatikusan futtatja a generálást
  - `prebuild` script: `npm run build` előtt automatikusan fut
  - `js-yaml` runtime dependency eltávolítva → bundle ~43KB-val kisebb (232KB vs 275KB)
  - Minden adat `tables/*.json`-ból töltődik (fetchJson), nincs runtime YAML parse
- ✅ Reactive Engine (`data/rules.json` + `web/src/engine/reactive.ts`)
  - Deklaratív dependency graph: 53 szabály (ÉP, KÉ, TÉ/VÉ/CÉ alap, KP teljes lánc incl. spec_kp/kiemelt_kp/primer, SFÉ, MGT, merevvért, távharc VÉ, képzettség limitek, manőver pont, felszerelés, max_HM, max_HM_aszimmetria, fegyver TÉ/VÉ/SP/harckeret/támadások, páncél lookup-ok, lefedettség)
  - Skaláris képletek + aggregáló: `sum()`, `sum_lookup()`, `sum_where()`, `count()`, `lookup()`, `if()`
  - Topológiai sorrend: automatikus dependency resolution (skaláris Context + ArrayContext)
  - HarcScreen: ÉP, KÉ, manőver pont, SFÉ, páncél_MGT, fegyver TÉ/VÉ/SP/támadások — mind reactive engine-ből
  - App KP sáv: teljes KP lánc reactive engine-ből
  - testdata.ts expected8: frissítve teljes KP bontással (kp_képzettségek:224, kp_fortélyok:150, kp_hm:192, elköltött:566, maradt:2)
  - TS-ben marad: fortély módosítók (§16, TODO), Fájdalomtűrés enyhítés (küszöb-tábla lookup)
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
  - 💾 Mentés gomb: `karakter.név.json` letöltés + `mentés_dátum` timestamp
  - 📂 Betöltés gomb: file picker, schema validáció (incl. napló tömb)
  - 📄 Új karakter gomb: megerősítő popup, `data/empty_karakter.json`-ból tölti
  - 🧪 Teszt karakter gomb: megerősítő popup, `data/test_karakter.json` runtime fetch + referenciális validáció
  - Validáció betöltéskor: schema struktúra + referenciális integritás (faj, fortélyok, képzettségek, páncél enum-ok, fegyver anyag/alaptípus)
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
- ✅ Kor választó: két lépéses (tartomány → érték), 10-100/2, 100-200/5, 200-1000/50
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
  - HM/CM vásárlás: +/- gombok, validálás (max_HM, aszimmetria, max_CM)
  - Harcmodorok: read-only lista (Tul/Képz fülről szinkronizálva)
  - Fegyverek: példány lista, + Új fegyver (kategóriánkénti dropdown)
    - Mezők: MF fok, Idea, Anyag — `he-field-btn` stílus, dupla katt → overlay popup
    - Per-element double-tap: `tapTimers` Map (key-per-gomb, nincs interferencia)
    - MK fegyverek: dropdown-ban csak 1K variáns, `Alapnév` mező mint display name (suffix nélkül)
    - MK 2K variáns: automatikusan megjelenik a Harc fülön mint külön sor
    - `MK_pár` + `Alapnév` mezők a `fegyverek.json`-ban (process_fegyverek.py generálja)
  - Páncél: `he-field-btn` stílus, dupla katt → overlay popup
    - Struktúra, Fémalapanyag (csak fém struktúránál), Kidolgozottság, Méret, Sisak (toggle), Végtagvédettség, Idea, Rongálódás
    - méret_illeszkedés értékek: `passzol`, `nem passzol`, `borzalmas`
  - Mesterfegyver fortély szinkronizáció:
    - Fegyver MF fok módosítás → automatikusan létrehozza/frissíti a Mesterfegyver fortélyt
    - Fortélyok fülön: locked (nem szerkeszthető/törölhető), lista tetején
    - Dupla katt locked elemre → hint: "Mesterfegyver fortélyokat a Harcértékek fülön kezeld!" (3s)
    - Mesterfegyver NEM jelenik meg a Fortélyok fül dropdown-jában
- ✅ Jegyzetek fül (📝): teljes képernyős textarea, mindkét módban elérhető, mentődik karakter fájlba
- ✅ Napló fül (📖): bejegyzés lista (dátum, KM, kaland, események), szerkesztés/törlés, accordion, editOnly
- ✅ Távharc fül (🏹): skeleton (TODO: távharc kalkulátor)
- ✅ Harc fül fegyver tábla: dinamikus (karakter.fegyverek-ből), MK párok kibontva, kategória→harcmodor lookup
- ✅ Reactive Engine migráció: TELJES (pancel.ts, kp.ts, harcertek.ts mind törölve)
  - spec_kp: sum(kp_bónusz_fortélyok) + tartós_sérülés (negatív kp_perfok fortélyokból automatikus)
  - kiemelt_kp: sum(kiemelt_fortélyok, fizetős_kp) — ingyenes keret feletti többlet
  - primer_költés + primer_keret: deklaratív (primer_képzettségek + primer_fortélyok + HM + CM)
  - Páncél lookup-ok: 11 szabály (struktúra/alapanyag/méret/merevvért StringContext lookup-okkal)
  - `if` keyword fix: hozzáadva az identifier exclusion listához
- ✅ Tulajdonság pontok kijelzés: `Tulajdonság pontok: X/Y` (szerkesztő módban, piros ha túllépés)
- ✅ Játékos neve mező: double-tap szerkesztő popup, mentés fájlnévben (`karakter_játékos_Xtsz.json`)
- ✅ `onSelect preventDefault` eltávolítva (okozta az input karakter-elvesztés bugot iOS-en)
- ✅ Mentés fájlnév: `kisbetű_éktelenítve_Xtsz.json` formátum (első név max 20 kar, ASCII only)

## Következő lépések

## Új chat nyitásakor olvasd be ezeket
- `/mnt/c/repo/szilank.code/data/DEVSTATE.md` (ez a fájl)
- `/mnt/c/repo/szilank.code/data/engine_spec.md` — engine kalkulációk specifikációja
- `/mnt/c/repo/szilank.code/data/gui_spec.md` — GUI specifikáció (screen-ek, viselkedés, formázás)
- `/mnt/c/repo/szilank.code/data/konstansok.yaml` — központi konstansok
- `/mnt/c/repo/szilank.code/data/schemas/` — összes schema (fortely, kepzettseg, karakter, pancel, fegyver, faj)
- `/mnt/c/repo/szilank.code/web/src/App.tsx` — fő app komponens (tab rendszer, mód toggle)
- `/mnt/c/repo/szilank.code/web/src/components/HarcScreen.tsx` — Harc fül implementáció
- `/mnt/c/repo/szilank.code/web/src/components/TulajdonsagokScreen.tsx` — Tulajdonságok + Képzettségek fül
- `/mnt/c/repo/szilank.code/web/src/components/FortelyokScreen.tsx` — Fortélyok fül
- `/mnt/c/repo/szilank.code/web/src/components/HarcertekekScreen.tsx` — Harcértékek fül
- `/mnt/c/repo/szilank.code/web/src/engine/` — engine modulok (types, data-loader, reactive)
- `/mnt/c/repo/szilank.code/data/rules.json` — reactive engine deklaratív szabályok

## Fontos konvenciók
- Módosító módok: `flat`, `scaled`, `override`
- Feltétel prefixek: `szituáció:`, `harci_helyzet:`, `taktika:`, `fegyver:`, `fegyver_kategória:`, `manőver:`, `státusz:`
- Követelmények: elemek között ÉS, egy elem név listája VAGY
- Mesterfegyver NEM számít a max HM-be
- Manőver Pont: `CEIL(harcmodor_összeg × 2 / tsz)`
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
- Teszt karakter: `data/test_karakter.json` a single source of truth; runtime fetch (nincs testdata.ts)
- Validáló script: `web/validate_karakter.py` — ellenőrzi a test_karakter.json konzisztenciáját (yaml defs, KP, faj, session)
- Session default: `DEFAULT_SESSION` (types.ts-ben exportálva), betöltéskor hiányzó session pótlása
- Deploy: GitHub Pages, `https://kaktusztea.github.io/szilankrpg/`, auto-deploy push master-re
- Generált JSON-ok: `data/generate_tables.py` script → `tables/` könyvtár (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek)
- Vite plugin: dev szerver indulásakor automatikusan futtatja a generate_tables.py-t; nincs per-request regenerálás
- Runtime: minden adat `tables/*.json`-ból fetchJson-nel, nincs YAML parse, nincs js-yaml dependency
- Touch event isolation: kep-row-on `onTouchStart/End stopPropagation` (szerkesztő módban, védi a véletlen lapozást)
- Swipe isolation popup overlay-eknél: App.tsx `handleTouchStart` `.closest('.kep-prompt-overlay')` check → swipe letiltva
- Context menu prevention: `onContextMenu preventDefault` + `-webkit-touch-callout: none` + `user-select: none`
- Értékválasztó popup-ok: érték kiválasztása azonnal bezárja (nincs OK/Mégse gomb), Escape bezárja módosítás nélkül
- Szint választó (képzettségek): gombok 1-15 grid (5 oszlop), aktív=zöld
- Fok választó (fortélyok): kerek radio gombok (1..maxfok), aktív=zöld
- Popup dialógusok: createPortal(document.body) — kiszöknek a screen-slide overflow kontextusból
- Double-tap: 350ms threshold → popup megnyitás (Név, Szint, Kor, Tulajdonságok, Képzettségek, Fortélyok, ÉP TÉ footer→navigáció)
- Double-tap Harcértékek fülön: per-element `tapTimers` Map (key: `mf-{i}`, `idea-f-{i}`, `anyag-{i}`, `p-struk`, stb.)
- Mesterfegyver fortély: locked a Fortélyok fülön (nem törölhető/szerkeszthető), szinkronizálva fegyver.mesterfegyver_fok-ból
- MK fegyverek: `fegyverek.json` MK_pár (pár másik tagja) + Alapnév (display name suffix nélkül); process_fegyverek.py generálja
- méret_illeszkedés értékek: `passzol`, `nem passzol`, `borzalmas` (MGT: 0, 3, 6)
- Faj: inline `<select>` (nincs popup, közvetlenül koppintható szerkesztő módban)
- Rövid koppintás szerkesztő módban: nem csinál semmit (képzettségek, fortélyok)
- Rövid koppintás Game módban: accordion info toggle
- Törlés megerősítő dialógus: centered név + piros gomb ("Képzettség törlése" / "Fortély törlése")
- Reset megerősítő dialógus: piros centered gomb ("ÉP Reset" / "VÉ Reset"), disabled ha nincs mit resetelni
- Default tab induláskor: Tul/Képz (index 3)
- Fájdalomtűrés enyhítés: konstansok.fájdalomtűrés_enyhítés táblából, dinamikusan frissül szint módosításkor
- ÉP TÉ footer double-tap: navigál Tul/Képz fülre + scroll Fájdalomtűrés képzettséghez (data-kep attribútum)
- Sebesülés popup: típus+érték gombok, mindkettő kiválasztva → auto-close, 1-15 látható + ▾ lenyitó (16-40)
- Gyógyulás popup: ÉP/FP + érték gombok, auto-select ha csak egy típus, auto-close
- Overlay cancel: mellé koppintás (globális click handler `el.classList.contains('kep-prompt-overlay')` → dispatch Escape)
- iOS kompatibilitás: double-tap modell (nem long-press), nincs touchstart preventDefault hack, `touch-action: manipulation` CSS
- **Reactive Engine irányelv**: minden számítási mechanika a `data/rules.json`-ban van (53 szabály). Nincs TS engine modul. A HarcScreen és App.tsx csak context-et épít (lookup táblák, string context, extras) és `evaluate()`-ot hív. Egyetlen maradék TS inline logika: fortély módosítók (§16, TODO) és Fájdalomtűrés enyhítés.
- Tradíció képzettség: `"Tradíció: Vulgármágia"` formátum (nem `többszörös` yaml mező!), tradiciok.json-ból picker; Szakrális altípusoknál isten választó (pantheon csoportosítva)
- `tables/tradiciok.json`: egységes struktúra `{ név, típus, altípusok[] }` — altípusok lehetnek egyszerű (Bárdmágia) vagy pantheon-csoportosított (Szakrális/istenek)
- `tables/nyelvek.json`: 37 nyelv `{ név, csoport }` — Nyelvismeret fortély picker ebből kínál csoportosított dropdown-t
- Szabad fortélyok: `kp_perfok: 6`, csoport-szintű ingyenes keret = TSz db; kiérdemelt fortélyok (`kiérdemelt: true`) nem fogyasztják se a keretet se a KP-t
- Fortély `kiérdemelt?: boolean` mező: opcionális, szabad fortélyoknál felvételkor "Felvett/⭐ Kiérdemelt" picker
- Nyelvismeret fortély: pont keret = `max(0, (nyelvtanulás_szint - 3) * 3)`, dropdown disabled ha keret elfogyott, piros jelzés túllépésnél (hátulról)
- Alkalmatlan fegyver hajítása: `spec_típus: "fegyver"` → dropdown a karakter fegyvereiből (nem freetext)
- Képzettség limitek: primer max = TSz, szekunder max = TSz+3; túllépés → piros név + szint (`kep-over` class)
- `mentés_dátum`: karakter JSON-ba mentéskor YYYY-MM-DD HH:MM formátumban
- `szilánk`: session alá került (nem top-level karakter mező)
- Napló fül (📖 editOnly): bejegyzések (dátum, KM, kaland, események), accordion lista, szerkesztés/törlés, `karakter.napló[]` tömb
