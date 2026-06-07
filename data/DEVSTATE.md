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
│   ├── rules.json             ← Reactive engine szabályok (19 deklaratív képlet/aggregáció)
│   ├── konstansok.yaml        ← Központi konstansok (forrás, JSON-ba generálódik)
│   ├── engine_spec.md         ← Engine kalkuláció spec (§1-§20, minden formula)
│   └── gui_spec.md            ← GUI spec (9 screen, viselkedés, formázás)
├── web/                       ← React + Vite + TypeScript webes app
│   ├── src/
│   │   ├── engine/            ← Kalkulációs engine modulok
│   │   │   ├── types.ts       ← Típusdefiníciók
│   │   │   ├── kp.ts          ← KP számítás
│   │   │   ├── tulajdonsag.ts ← Tulajdonság pont-buy
│   │   │   ├── ep.ts          ← ÉP + S1-S4
│   │   │   ├── harcertek.ts   ← KÉ, TÉ, VÉ, CÉ, SP, Harckeret
│   │   │   ├── pancel.ts      ← SFÉ, MGT, Merevvért büntetés
│   │   │   ├── modifiers.ts   ← Fortély módosítók (flat/scaled/override)
│   │   │   ├── limits.ts      ← Manőver, Felszerelés, HM/CM, Képzettség limitek
│   │   │   ├── tavharc.ts     ← Távharc VÉ kalkulátor
│   │   │   ├── data-loader.ts ← JSON betöltés runtime (konstansok, fegyverek, pajzsok, KP, harcmodor, képzettségDefs, kiterjesztések, fajNevek, fajKeretek, primerFortelyok, fortelySummaries, rules)
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
│   │   │   └── FortelyokScreen.css
│   │   ├── App.tsx             ← Tab shell + swipe + animáció + Szerk/Game mód
│   │   ├── App.css             ← Globális stílusok, dark theme
│   │   └── testdata.ts         ← 8. szintű teszt karakter + elvárt értékek
│   ├── vite.config.ts          ← Vite config (serveDataPlugin, polling, host)
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/          ← CI/CD (linkspector, fegyverek, KP, harcmodor, onefile)
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
  - Fejléc: Név (double-tap → szerkesztő popup) + Szint (double-tap → slider popup, max: konstansok.arányok.max_tsz)
  - Faj: inline `<select>` dropdown (szerkesztő módban közvetlenül koppintható) + Kor box (double-tap → slider 5-500/5)
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
  - Maradt KP + Maradt Szekunder KP kijelzés
  - Zöld háttér (normál), piros (ha Maradt KP < 0)
  - Szekunder maradék: max(0, ...) — sosem negatív
  - Dinamikus: képzettség módosítás azonnal frissíti
  - Képzettségek és Fortélyok state az App szintjén (lifted state)
- ✅ Build pipeline: YAML → JSON generálás automatizálva
  - `data/generate_tables.py`: központi script (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek)
  - Vite plugin: dev szerver indulásakor automatikusan futtatja a generálást
  - `prebuild` script: `npm run build` előtt automatikusan fut
  - `js-yaml` runtime dependency eltávolítva → bundle ~43KB-val kisebb (232KB vs 275KB)
  - Minden adat `tables/*.json`-ból töltődik (fetchJson), nincs runtime YAML parse
- ✅ Reactive Engine (`data/rules.json` + `web/src/engine/reactive.ts`)
  - Deklaratív dependency graph: 25 szabály (ÉP, KÉ, TÉ/VÉ/CÉ alap, KP teljes lánc, SFÉ, távharc VÉ, képzettség limitek, manőver pont, felszerelés, stb.)
  - Skaláris képletek + aggregáló függvények: `sum()`, `sum_lookup()`, `count()`
  - Topológiai sorrend: automatikus dependency resolution (skaláris Context + ArrayContext)
  - HarcScreen: ÉP, KÉ, manőver pont reactive engine-ből
  - App KP sáv: teljes KP lánc reactive engine-ből (calcKp modul kiváltva)
  - Validálva: 25/25 szabály helyes az engine_spec.md és a szabályrendszer md alapján
  - testdata.ts expected8: frissítve teljes KP bontással (kp_képzettségek:224, kp_fortélyok:150, kp_hm:192, elköltött:566, maradt:2)
  - TS-ben marad: spec_kp, kiemelt_kp, fegyver iteráció, fortély módosítók, Fájdalomtűrés enyhítés, páncél MGT
- ✅ tables/kepzettsegek.json, kiterjesztesek.json, fajok.json, faj_tulajdonsag_keretek.json, primer_fortelyok.json, fortelyok.json, konstansok.json
- ✅ Context menu prevention (onContextMenu preventDefault + CSS touch-callout + user-select)
- ✅ Escape gomb: minden popup overlay bezárható Escape-pel
- ✅ GitHub Pages deploy workflow (`.github/workflows/deploy_webapp.yml`)
  - Trigger: push master (web/ vagy data/ változás) + workflow_dispatch
  - Python 3.13 + Node 20 + generate_tables.py + npm ci + build + postbuild (data copy) + deploy
  - URL: `https://kaktusztea.github.io/szilankrpg/`

## Következő lépések
1. **Reactive Engine bővítés** — minden számítási mechanika migrálása a rules.json-ba, amit csak lehet:
   - §11 Páncél MGT (feltételes lookup struktúra típus alapján)
   - §12 Merevvért TÉ büntetés (feltételes: if merev → MGT - lookup)
   - §13 Pajzs VÉ/TÉ (lookup + feltételes fok logika)
   - §5-9 Fegyverenként TÉ/VÉ/SP/Harckeret (parametrikus szabályok / template-ek)
   - §16 Fortély módosítók (iteráció + feltétel dispatch → esetleg deklaratív filter+sum)
   - §18 max_HM (sum harci fortélyok + harcmodorok)
   - spec_kp, kiemelt_kp (feltételes logika → esetleg lookup-tábla + sum)
   - Cél: a TS engine modulok (ep.ts, kp.ts, harcertek.ts, pancel.ts, limits.ts) fokozatos kiváltása
2. **Aktív fül UI** — szituáció toggle-ök (fegyver, pajzs, páncél, taktika, helyzet, manőver, státuszok)
3. **Harcértékek fül** — HM/CM, fegyver/páncél konfigurátor (csak Szerkesztő módban)
4. **Karakter mentés/betöltés** — JSON export/import
5. **Szabályleírás fülek** — md tartalom renderelés (taktikák, helyzetek, manőverek)

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
- `/mnt/c/repo/szilank.code/web/src/engine/` — engine modulok (types, data-loader, reactive, harcertek, pancel, ep, kp, modifiers, limits, tavharc)
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
- Többszörös fortély belső tárolás: `"AlapNév - alnév"` (pl. `"Kultúrkör - erv"`, `"Helyismeret - Erion"`)
- Többszörös fortély KP lookup: base name (`f.név.split(' - ')[0]`) → fortelyKpMap
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
- Faj: inline `<select>` (nincs popup, közvetlenül koppintható szerkesztő módban)
- Rövid koppintás szerkesztő módban: nem csinál semmit (képzettségek, fortélyok)
- Rövid koppintás Game módban: accordion info toggle
- Törlés megerősítő dialógus: centered név + piros gomb ("Képzettség törlése" / "Fortély törlése")
- Reset megerősítő dialógus: piros centered gomb ("ÉP Reset" / "VÉ Reset"), disabled ha nincs mit resetelni
- Default tab induláskor: Tul/Képz (index 2)
- Fájdalomtűrés enyhítés: konstansok.fájdalomtűrés_enyhítés táblából, dinamikusan frissül szint módosításkor
- ÉP TÉ footer double-tap: navigál Tul/Képz fülre + scroll Fájdalomtűrés képzettséghez (data-kep attribútum)
- Sebesülés popup: típus+érték gombok, mindkettő kiválasztva → auto-close, 1-15 látható + ▾ lenyitó (16-40)
- Gyógyulás popup: ÉP/FP + érték gombok, auto-select ha csak egy típus, auto-close
- Overlay cancel: mellé koppintás (globális click handler `el.classList.contains('kep-prompt-overlay')` → dispatch Escape)
- iOS kompatibilitás: double-tap modell (nem long-press), nincs touchstart preventDefault hack, `touch-action: manipulation` CSS
- **Reactive Engine irányelv**: minden számítási mechanikát a `data/rules.json`-ba kell migrálni, amit csak lehet. A TS engine modulok (ep.ts, kp.ts, harcertek.ts, pancel.ts, limits.ts) fokozatosan kiváltandóak. Cél: a szabályrendszer képletei egy helyen, deklaratívan, nem szétszórva TypeScript fájlokban.
