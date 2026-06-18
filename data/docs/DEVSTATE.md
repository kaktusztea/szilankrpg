# Szilánk RPG — Fejlesztési állapot guide

## Repo struktúra
```
/mnt/c/repo/szilank.code/
├── md/                        ← Éles szabályrendszer (markdown)
├── data/                      ← Adatfájlok
│   ├── docs/                  ← Specifikációk, fejlesztői doksik
│   │   ├── DEVSTATE.md        ← Fejlesztési állapot (ez a fájl)
│   │   ├── engine_spec.md     ← Engine kalkuláció spec (§1-§27)
│   │   └── gui_spec.md        ← GUI spec (screen-ek, viselkedés, formázás)
│   ├── sources/               ← YAML forrásadatok (amiből generálunk)
│   │   ├── konstansok.yaml    ← Központi konstansok (forrás, JSON-ba generálódik)
│   │   ├── harci_helyzetek.yaml
│   │   ├── taktikak.yaml
│   │   ├── szituaciok.yaml
│   │   ├── manoverek.yaml
│   │   ├── statuszok.yaml     ← 19 státusz (strukturált hatásokkal)
│   │   ├── hatasok.yaml       ← 8 hatás operátor (előny, hátrány, letilt, stb.)
│   │   ├── esemenyek.yaml     ← 21 esemény/célpont (hatások céljai)
│   │   ├── hatterek.yaml      ← Leíró + Karma hátterek
│   │   ├── kepzettsegek/      ← Képzettség adatfájlok (81 db, alkönyvtárakban)
│   │   │   ├── primer/altalanos/   (10 db)
│   │   │   ├── primer/harci/       (5 db)
│   │   │   ├── primer/misztikus/   (2 db)
│   │   │   ├── primer/arkanumok/   (16 db)
│   │   │   ├── primer/faj_miszteriumok/ (26 db)
│   │   │   └── szekunder/          (22 db)
│   │   ├── fortelyok/         ← Fortély adatfájlok (169 db, csoportonként alkönyvtár)
│   │   │   ├── harci/         (45 db)
│   │   │   ├── altalanos/     (41 db)
│   │   │   ├── szabad/        (59 db)
│   │   │   ├── erzekek/       (6 db)
│   │   │   ├── kiemelt/       (9 db)
│   │   │   └── misztikus/     (9 db)
│   │   └── fajok/             ← Faj hátterek (27 db)
│   ├── schemas/               ← YAML sémák (karakter, fortely, kepzettseg, fegyver, pancel, faj, taktika, statusz, hatas, esemeny, harci_helyzet, szituacio, manover, hatter)
│   ├── tables/                ← Generált + statikus JSON táblák (runtime)
│   ├── karakter/              ← Karakter template-ek
│   │   ├── empty_karakter.json  ← Üres karakter template
│   │   └── test_karakter.json   ← Teszt karakter (single source of truth)
│   ├── rules.json             ← Reactive engine szabályok (53 deklaratív képlet/aggregáció)
│   └── generate_tables.py     ← YAML→JSON generáló script (Vite plugin és prebuild futtatja)
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
│   │   │   ├── HarcertekekScreen.css
│   │   │   ├── AktivScreen.tsx         ← Aktív fül (KÉSZ)
│   │   │   ├── AktivScreen.css
│   │   │   ├── HatterekScreen.tsx      ← Hátterek fül (KÉSZ)
│   │   │   └── HatterekScreen.css
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
- ✅ Engine spec: 27 szekció (§1-§27), validálva a szabályrendszer + ODS ellen
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
  - TÉ footer double-tap: navigál Tul/Képz → scroll Fájdalomtűrés-hez
  - képzettségek prop: lifted state, Fájdalomtűrés szint módosítás azonnal hat
- ✅ Tab rendszer: swipe + animáció (0.15s) + tükrözött tab bar (jobb→bal, 18px ikon-only + szöveges fülek)
- ✅ Szerkesztő/Game mód toggle (1000ms fade animáció narancs↔zöld)
- ✅ Data betöltés: Vite plugin a ../data/ könyvtárból (nincs duplikálás)
- ✅ 169 fortély yaml, 81 képzettség yaml, 27 faj yaml
- ✅ Tulajdonságok + Képzettségek fül: teljes UI (szerkesztő + game mód)
  - Fejléc: Név (tap → szerkesztő popup) + Szint (tap → gombgrid 3-21, 5 oszlop, utolsó sor középre)
  - Faj: inline `<select>` dropdown (szerkesztő módban közvetlenül koppintható) + Kor box (tap → +/− overlay)
  - Game módban Faj+Kor a Név mellé konkatenálódik: "von Agabor (Ember (Északi), 32)"
  - Tulajdonságok: fix 2x4 grid, teljes nevek, double-tap → popup gomb-grid (-5..+7), érték választás bezárja
  - Faj limit warning: sárga szín + automatikusan megjelenő "Faj max/min: X" info box (nem zárható)
  - Képzettségek: 7 csoportban (összecsukható), dropdown + azonnali szint popup, ✕ törlés (piros megerősítés)
  - Szint választó: popup gombok 1-15 grid (5x3), aktív=zöld, érték választás bezárja (double-tap triggereli)
  - Szint színkód: 0=piros, 1-8=sárga, 9+=zöld
  - Többszörös képzettségek: generikus `többszörös` lista mező (fix alnév lista VAGY `["*"]` szabad szöveges max 20 kar)
  - Többszörös felvételkor csoportosítva a testvéreik mellé kerülnek
  - Game mód adatlap: próba, domináns tulajdonságok, kiterjesztő fortélyok
  - Rövid koppintás szerkesztő módban: nem csinál semmit (csak double-tap)
- ✅ Fortélyok fül: teljes UI (szerkesztő + game mód)
  - 6 csoport (Harci → Általános → Érzékek → Szabad → Kiemelt → Misztikus), összecsukható
  - Fok kijelzés: karikák (●/○) — teli=aktív fok, üres=nem aktív; Nyelvismeret: szöveges label marad
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
  - Deklaratív dependency graph: 53 szabály (ÉP, KÉ, TÉ/VÉ/CÉ alap, KP teljes lánc incl. spec_kp/kiemelt_kp/primer, SFÉ, MGT, merevvért, távharc VÉ, képzettség limitek, manőver pont, felszerelés, max_HM, max_HM_aszimmetria, fegyver TÉ/VÉ/SP/harckeret/támadások, páncél lookup-ok, lefedettség)
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
  - HM/CM vásárlás: +/- gombok, validálás (max_HM, aszimmetria, max_CM)
  - Harcmodorok: read-only lista (Tul/Képz fülről szinkronizálva)
  - Fegyverek: példány lista, + Új fegyver (kategóriánkénti dropdown)
    - Mezők: MF fok, Idea, Anyag — `he-field-btn` stílus, tap → overlay popup
    - MF fok: piros szöveg ha Mesterfegyver követelmény nem teljesül
    - Per-element double-tap: `tapTimers` Map (key-per-gomb, nincs interferencia)
    - MK fegyverek: dropdown-ban csak 1K variáns, `Alapnév` mező mint display name (suffix nélkül)
    - MK 2K variáns: automatikusan megjelenik a Harc fülön mint külön sor
    - `MK_pár` + `Alapnév` mezők a `fegyverek.json`-ban (process_fegyverek.py generálja)
  - Páncél: `he-field-btn` stílus, dupla katt → overlay popup
    - Struktúra, Fémalapanyag (csak fém struktúránál), Kidolgozottság, Méret, Sisak (toggle), Végtagvédettség, Idea, Rongálódás
    - méret_illeszkedés értékek: `passzol`, `nem passzol`, `borzalmas`
  - Mesterfegyver fortély szinkronizáció:
    - Fegyver MF fok módosítás → automatikusan létrehozza/frissíti a Mesterfegyver fortélyt
    - Fegyver törlés → session aktív_fegyver_index/bal_index és kétkezes_harc reset
    - Fortélyok fülön: locked (nem szerkeszthető/törölhető), lista tetején
    - Dupla katt locked elemre → hint: "Ezt a fortélyt a Harcértékek fülön kezeld!" (3s)
    - Mesterfegyver és Pajzshasználat NEM jelenik meg a Fortélyok fül dropdown-jában
- ✅ Jegyzetek fül (📝): teljes képernyős textarea, mindkét módban elérhető, mentődik karakter fájlba
- ✅ Napló fül (📖): bejegyzés lista (dátum, KM, kaland, események), szerkesztés/törlés, accordion, editOnly
- ✅ Távharc fül (🏹): skeleton (TODO: távharc kalkulátor)
- ✅ Harc fül fegyver tábla: dinamikus (karakter.fegyverek-ből), MK párok kibontva, kategória→harcmodor lookup
  - Tám cella kattintható (Game mód): info popup (fegyver név, sebesség, harckeret)
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
- ✅ Pajzs szekció a Harcértékek fülön
  - `PajzsPeldany` típus: `{ méret: string, pajzshasználat_fok: number }`
  - Karakter top-level `pajzs` mező (karakter.yaml séma v2 bővítve)
  - Méret: double-tap → popup (— nincs — / kis / közepes / nagy)
  - Pajzshasználat fok: double-tap → kerek gombok 0-3, szinkronizálja a Pajzshasználat fortélyt
  - Kézben: read-only indikátor (`session.aktív_pajzs` alapján), kattintás → sárga hint
  - Pajzshasználat fortély: locked a Fortélyok fülön (nem szerkeszthető/törölhető, nem jelenik meg dropdown-ban)
  - `setPajzsFok()`: fortélyok tömbben közvetlenül módosítja a Pajzshasználat fortélyt
- ✅ Nyelvismeret fok UI: "Alap"/"Udvari" label (szám helyett), lekerekített téglalap gombok, centered fejléc
  - Nyelv picker: custom styled gomb-lista csoportonként (narancssárga fejléc + elválasztó vonal), scrollozható (max 70vh)
- ✅ Kor választó javítások: szabályos kör gombok (42x42px), 10–58 / 60–100 toggle split (cserélődő tartalom)
- ✅ Harcértékek fül szekció elválasztók: `.he-section + .he-section { border-top: 1px solid #333 }`, h3 border-bottom eltávolítva
- ✅ process_fegyverek.py fix: `data/patterns` → `data/tables` + `_pattern.json` szűrő
- ✅ Fejléc ⚙️ menü: Karakter betöltése / Karakter mentése / Új karakter / Teszt karakter (overlay popup)
  - Régi ikon gombok (🧪📄💾📂) eltávolítva a fejlécből
- ✅ Tab bar tükrözés: jobbról balra sorrend (Aktív jobb szélre), induláskor jobbra scrollozva
  - Screen slider és swipe irány is tükrözve
  - Ikon-only tab-ok: ❎🗡️🏹🔵🟣🛡️✨📜 (szöveges: Jegyzetek, Napló, Taktikák, Helyzetek, Manőverek)
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
  - `generate_tables.py`: fokok[].módosítók mező hozzáadva a fortelyok.json-hoz
  - `data-loader.ts`: FortelyModosito interface + FortelyFokSummary.módosítók
  - `HarcScreen.tsx`: generikus iteráció (flat + scaled mód), fortelyMods Record
  - Érintett: Gyors kezdeményezés (KÉ), Harckeret növelés (harckeret+KÉ), Harci akrobatika (TÉ/VÉ scaled), Természetes páncél (SFÉ)
  - Harci akrobatika yaml fix: "harci akrobatika" → "Harci akrobatika" (nagybetű)
- ✅ Páncél gombok: disabled + szürke ha nincs struktúra kiválasztva (`.he-field-disabled`)
- ✅ Feltétel prefix javítások fortély yaml-okban:
  - `szituáció:belharc` → `harci_helyzet:belharci_szituáció`
  - `szituáció:fárasztás_taktika` → `taktika:fárasztás`
  - `szituáció:fegyverrántás` → `harci_helyzet:fegyverrántás`
  - `szituáció:roham` → `taktika:roham`
- ✅ Aktív fül adatforrások (YAML → JSON):
  - `data/sources/taktikak.yaml` → `tables/taktikak.json` (14 taktika, kombó_mód/lista, fokozatos, megkötések)
  - `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (31 helyzet, id, infó, hatások, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek[id-k])
  - `data/sources/szituaciok.yaml` → `tables/szituaciok.json` (7 szituáció)
  - `data/sources/manoverek.yaml` → `tables/manoverek.json` (34 manőver, nehézség, fázisok, hatás)
  - `data/sources/statuszok.yaml` → `tables/statuszok.json` (19 státusz, kategória, fokok+alcím+strukturált hatások)
  - `data/sources/hatasok.yaml` → `tables/hatasok.json` (8 hatás operátor: előny, hátrány, arányos, duplázás, letilt, max_limit, szöveges, enyhít)
  - `data/sources/esemenyek.yaml` → `tables/esemenyek.json` (21 esemény/célpont: harci, próba, fizikai, képesség csoportok)
  - Schema validáció beépítve a `generate_tables.py`-be (`validate_aktiv_ful()`, `validate_hatasok()`, `validate_esemenyek()`, `validate_statuszok()`)
  - Referenciális integritás: státusz hatás.operátor → hatasok id, hatás.cél → esemenyek id
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
  - Szekció sorrend: Fegyver+Fogás (felül) → Hatás pool → Taktikák → Manőver → Harci helyzetek → Státuszok → Szituációk → Narratív módosítók
  - Harci helyzetek: overlay picker (név + infó, ABC)
  - Szituációk: overlay picker (név + infó, ABC)
  - Státuszok: overlay picker (Fizikai/Szellemi/Mágikus kategóriák, két lépéses fokválasztó emberi olvasható hatásokkal), chip katt → fok ciklikus váltás
  - Hatás pool box (7 szekció): Taktikák | Harci helyzetek | Státusz hatások | Manőver bónuszok | Előny/Hátrány | Fortély bónuszok | Narratív módosítók
  - Narratív módosítók: "+ Új" gomb → overlay popup (Hátrány/Előny gombok + szöveg + OK, Enter = OK)
  - Több támadás TÉ levonás: konstansokból (`több_támadás_TÉ_levonás`), generikusan (taktika +3 kioltja)
  - Minden picker: Escape + mellé katt bezárja
- ✅ Hátterek fül (HatterekScreen.tsx)
  - Faj háttér: read-only chip (karakter.hátterek.faj), kattintásra navigál Tulajdonságok fülre
  - Szövegfelhő: Leíró hátterek (Származás/Jellem/Küllem/Fóbia) + Karma hátterek
  - Adatforrás: `data/sources/hatterek.yaml` → `tables/hatterek.json`
  - Dupla katt toggle (aktív ↔ inaktív), kijelöltek előre + ABC sorrend
  - Game módban nem szerkeszthető
- ✅ Taktika módosítók → Harc fül
  - Aktív taktikák TÉ/VÉ/KÉ/SP módosítói beépítve a harcérték kalkulációba
  - Fokozatos taktikáknál (Támadó, Védő, Kezdeményező, stb.) a kiválasztott fok értékeit használja
  - Nem-fokozatos taktikáknál a `módosítók` mezőből olvas
  - KÉ box, fegyvertábla TÉ/VÉ/SP és VÉ max csökkenés mind reagál
- ✅ §16 feltételes fortély módosítók
  - Session aktív taktikák/helyzetek/szituációk feltétel kulcsai alapján aktiválódnak
  - `aktívFeltételek` Set: összegyűjti az aktív `feltétel_kulcs` értékeket (taktika, harci_helyzet, szituáció)
  - Fortély módosítók ahol `feltétel` egyezik → bekerülnek a harcérték kalkulációba
  - Érintett fortélyok: Belharc, Elsöprő roham, Fárasztás, Fegyverrántás, Gladiátor (Bestiái/Közönsége), Célzás, Harci anatómia (orvtámadás)
- ✅ Session séma bővítés: `aktív_taktika/helyzet` → `aktív_taktikák[]/helyzetek[]/szituációk[]`
  - `AktívTaktika` interface: `{ név, fok? }`
- ✅ Tab bar átrendezés: sorrend 🟡🟣🔵✨🏹🗡️❎🛡️ (középre rendezve, reszponzív méret)
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
2. ✅ Aktív fül (taktika/helyzet/szituáció/manőver/státusz picker, Hatás pool, narratív módosítók, fegyver jobb/bal/kétkezes)
3. ✅ Hátterek fül (szövegfelhő, data layer-ből)
4. ✅ Fortély követelmény ellenőrzés (§25 engine_spec, yaml-ok kitöltve, UI: piros jelzés + info)
5. ✅ Fegyverfogás rendszer (§27: picker, hárítófegyver beolvasztás, lila összesítő sor, Fegyver schema Hárító flag)

## TODO Backlog

### Karakteralkotó — általános
- VÉ eltolás ökölszabály: max ±10 (taktikák kombinálása esetén is) — validáció
- Harci helyzetek kombinálása: szabályok tisztázása
- Láthatatlan ellenfél taktika: kiszedve a yaml-ból, státuszként kezelni?
- Ember (Szigetvilági) faj háttér hozzáadása (slan helyett)
- Undo gomb + undo stack (navigálható)
- ODS checker-ek implementálása (KP, limitek, stb.)
- Faj misztérium képzettségek → Mágia fülre

### Aktív fül
- ✅ Kétkezes harc (§26 engine_spec, HarcScreen összevont kalkuláció, lila keret, pengelevonás, fok-függő MF, 0.fok TÉ/VÉ/harckeret konstansokból)

- ✅ Harci akrobatika: session_toggle (yaml `session_toggle: true`) + TÉ/VÉ bekötés + manőver bónusz
- Belharc / Belharci szituáció — külön rendszer
- Páros harc szituáció

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
- ✅ Hárítófegyver használat: Fegyverfogás picker + hárítóVÉ bekötés + fegyverek.json beolvasztás (TODO: MF VÉ bónusz)
- Kaszabolás: runtime döntés — fortély emlékeztető elég
- Kitérés lövés elől: próba bónusz — próba rendszer nincs implementálva
- Támadás erőből: interaktív SP↔TÉ csere — nem automatikus módosító
- Szabad fortélyok felvételénél: mutassa rögtön a kiterjesztéseket (UI feature)

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
- Hatás pool: mindig `infó` mező jelenik meg (nem a hatások[] struktúra)
- Taktikák hatás pool: zöld módosítók végén ✔ jel (beszámított)
- Manőver szekció: label kiemelve (aktiv-label, mint Taktikák/Helyzetek)

**Kombinálási szabályok (implementált, data-driven):**
- `tiltja_taktikákat: true` → összes taktika disabled (Orvtámadás)
- `kizár_helyzetek: [id-k]` → picker szűrés + hozzáadáskor eltávolítás
- Taktika megkötések: `harci_helyzet/tiltott` (Fárasztás: Pengehátrány, Láthatatlanul×2)

**TODO:**
- [ ] Közrefogás: Pengeelőny semlegesítés logika (Harc fül VÉ csökkentés)
- [ ] Magasabbról + Lovas harc: kizáró jelzés (ha lovas harc aktív, Magasabbról disabled)
- [ ] Belharci szituáció: komplex rendszer (harcmodor + pengehossz feltételek, fegyver override)
- [ ] Puszta kéz + Kétkezes harc: Fegyverfogás picker kizárás (ha mindkét kéz puszta kéz)


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

### Távharc fül
- Távharc kalkulátor (CÉ és VÉ) — §17
- Távharc fortélyok yaml elkészítése

### Harc fül
- ✅ Harc fül fegyvertábla: aktív fegyver sor normál, többi halványítva. Fegyverfogás ≠ Egyfegyveres: lila összesítő sor (kétkezes/pajzs/hárító).
- Lovas harc

## Fontos konvenciók
- Módosító módok: `flat`, `scaled`, `override`, `enyhít`, `előny`, `hátrány`
- Feltétel típusok: string (session dispatch: `"taktika:X"`, `"harci_helyzet:Y"`) VAGY lista (kalkulált: `[{forrás, operátor, érték}]`)
- Feltétel prefixek (string): `szituáció:`, `harci_helyzet:`, `taktika:`, `fegyver:`, `fegyver_kategória:`, `manőver:`, `státusz:`
- ID konvenció: YAML-ban `id` mező (snake_case, ékezetes). JSON-ban generált `feltétel_kulcs: "{prefix}:{id}"`. Manőver id: fortély `manőver:{id}` cél referencia.
- Kalkulált feltétel forrásai: session mezők + reactive engine computed + ctx (generikus lookup, nincs hardcode)
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
- Kétkezes harc data-driven: `konstansok.kétkezes_harc_bónuszok[]` tartalmazza `mindkét_fegyver_értékei`, `mf` ("nincs"/"nagyobb"/"mindkettő"), `harckeret`, `TÉ`, `VÉ` fokonként
- Pengelevonás osztó: `konstansok.kétkezes_harc_pengelevonás_osztó` (0.5)
- Harcmodor nevek: `Object.values(konstansok.fegyver_kategória_harcmodor)` — nincs hardcoded lista
- Többszörös státuszok: yaml `többszörös: true` + `alkategóriák: [...]` → generikus alkategória almenü picker
- Fegyverfogás: `session.fegyverfogás` explicit mező (enum: egyfegyveres/fegyver_pajzs/fegyver_hárító/kétkezes), opciók `konstansok.fegyverfogás_opciók`-ból
- Fegyver `Hárító` flag: `fegyverek.json`-ban `"1"/"0"` (process_fegyverek.py generálja: név prefix "Hárító:" / ", hárító" / Speciális "Hárítófegyverként")
- Fegyver `Erőbónusz limit`: `"0"` = nincs erőbónusz, `"99"` = korlátlan. Kód: `parseInt(érték)` ha nem üres, else 99 (üres/NaN nem fordul elő strict schema-val).
- Pajzs TÉ büntetés: `konstansok.pajzs_TÉ_büntetés` (1D: méret→büntetés) + fortély yaml `pajzs_TÉ_mérséklés` mód
- Fortély `emlékeztető` flag: yaml `emlékeztető: true/false` → AktivScreen Hatás pool "Fortély bónuszok" szekció (19 fortélynál true)
- Session default: `DEFAULT_SESSION` (types.ts-ben exportálva), betöltéskor hiányzó session pótlása
- Deploy: GitHub Pages, `https://kaktusztea.github.io/szilankrpg/`, auto-deploy push master-re
- Generált JSON-ok: `data/generate_tables.py` script → `tables/` könyvtár (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek, taktikák, harci helyzetek, szituációk, manőverek, státuszok, hatások, események, hátterek)
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
- ÉP TÉ footer double-tap: navigál Tul/Képz fülre + scroll Fájdalomtűrés képzettséghez (data-kep attribútum)
- Sebesülés popup: típus+érték gombok, mindkettő kiválasztva → auto-close, 1-15 látható + ▾ lenyitó (16-40)
- Gyógyulás popup: ÉP/FP + érték gombok, auto-select ha csak egy típus, auto-close
- Overlay cancel: mellé koppintás (globális click handler `el.classList.contains('kep-prompt-overlay')` → dispatch Escape)
- iOS kompatibilitás: double-tap modell (nem long-press), nincs touchstart preventDefault hack, `touch-action: manipulation` CSS
- **Reactive Engine irányelv**: minden számítási mechanika a `data/rules.json`-ban van (53 szabály). Nincs TS engine modul. A HarcScreen és App.tsx csak context-et épít (lookup táblák, string context, extras) és `evaluate()`-ot hív. Maradék TS inline logika: Fájdalomtűrés enyhítés (küszöb-tábla lookup). §16 fortély módosítók (mindig-aktív + feltételes) és taktika módosítók implementálva a HarcScreen-ben (iteráció fortelyok + session aktív taktikák/helyzetek/szituációk felett).
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
- process_fegyverek.py: pattern fájlok helye `data/tables/*_pattern.json` (fegyver, tavfegyver, pajzs). Hárítófegyverek beolvasztva fegyverek.json-ba (md tag átnevezés).
- Fejléc: ⚙️ menü gomb (overlay popup: Karakter betöltése/mentése, Új/Teszt karakter) + 🔧/🎮 mód toggle
- Tab bar: tükrözött (jobb→bal), induláskor `scrollLeft = scrollWidth`, ikon-only fülek, 18px font, aktív tab alatti 3px accent csík (slide animáció)
- Screen slider: tükrözött (`TABS.length-1-activeTab`), swipe irány invertált
- `karakter.anyanyelv`: top-level string mező, nyelvek.json-ból választható, szinkronizálja kiérdemelt Nyelvismeret fortélyokat
- Kiérdemelt Nyelvismeret: `kiérdemelt: true`, fok emelhető, pont számítás: `max(0, fok-1)` fizetős; 🎁 / 🎁➕ jelölés
- Ingyenes jelölés egységesítés: minden "ingyen kapott" fortély 🎁 jellel (Kultúrkör, Helyismeret, Szabad keret, kiérdemelt Nyelvismeret)
- Game mód: üres képzettség/fortély csoportok elrejtve
- §16 fortély módosítók: `fortelyMods` Record a HarcScreen-ben, generikus iteráció fokok[].módosítók-ból. 6 mód (flat, scaled, override, enyhít, előny, hátrány). `fortelyok.json` tartalmazza a módosítókat. AktivScreen: manőver bónuszok + előny/hátrány szekció a Hatás pool-ban (feltétel szűréssel).
- Páncél gombok: disabled + `.he-field-disabled` ha nincs struktúra (`!k.páncél.alap`)
- Aktív fül adatforrások: `taktikak.json`, `harci_helyzetek.json`, `szituaciok.json`, `manoverek.json`, `statuszok.json`, `hatasok.json`, `esemenyek.json`, `hatterek.json` — generate_tables.py validáció
- Taktika kombó: `kombó_mód: "whitelist"|"blacklist"` + `kombó_lista: string[]`
- Session v2: `aktív_taktikák: AktívTaktika[]`, `aktív_helyzetek: string[]`, `aktív_szituációk: string[]` (régi `aktív_taktika`/`aktív_helyzet` string törölve)
- AktivScreen.tsx: Hatás pool + taktikák/helyzetek/szituációk/státuszok overlay picker + manőver picker + Fegyverfogás picker + fegyver Ügyesebb/Gyengébb kéz + páncél toggle + narratív módosítók
