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
│   │   │   ├── data-loader.ts ← YAML/JSON betöltés runtime (konstansok, fegyverek, pajzsok, KP, harcmodor, képzettségDefs, kiterjesztések, fajNevek, fajKeretek, primerFortelyok, fortelySummaries)
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
- ✅ Tab rendszer: swipe + animáció (0.15s) + scrollozható tab bar
- ✅ Szerkesztő/Game mód toggle
- ✅ Data betöltés: Vite plugin a ../data/ könyvtárból (nincs duplikálás)
- ✅ 168 fortély yaml, 39 képzettség yaml, 26 faj yaml
- ✅ Tulajdonságok + Képzettségek fül: teljes UI (szerkesztő + game mód)
  - Fejléc: Név (hosszú nyomás → szerkesztő popup) + Szint (hosszú nyomás → slider popup, max: konstansok.arányok.max_tsz)
  - Faj box (szerkesztő mód, hosszú nyomás → dropdown, 26 faj tables/fajok.json-ból) + Kor box (hosszú nyomás → slider 5-500/5)
  - Game módban Faj+Kor a Név mellé konkatenálódik: "Dorek (Ember (Északi), 32)"
  - Tulajdonságok: fix 2×4 grid, teljes nevek, hosszú nyomás → popup overlay slider (-5..+7), OK/Mégse
  - Faj limit warning: sárga szín + koppintásra lenyíló "Faj max/min: X" ha túllépés
  - Képzettségek: 7 csoportban (összecsukható), dropdown + azonnali szint popup, ✕ törlés (piros megerősítés)
  - Szint választó: popup gombok 1-15 grid (5×3+2), aktív=zöld, érték választás bezárja
  - Szint színkód: 0=piros, 1-8=sárga, 9+=zöld
  - Többszörös képzettségek: generikus `többszörös` lista mező (fix alnév lista VAGY `["*"]` szabad szöveges max 20 kar)
  - Többszörös felvételkor csoportosítva a testvéreik mellé kerülnek
  - Game mód adatlap: próba, domináns tulajdonságok, kiterjesztő fortélyok
  - Rövid koppintás szerkesztő módban: nem csinál semmit (csak hosszú nyomás)
- ✅ Fortélyok fül: teljes UI (szerkesztő + game mód)
  - 6 csoport (Harci → Általános → Érzékek → Szabad → Kiemelt → Misztikus), összecsukható
  - Fok kijelzés: szám, szín: sárga (nem max), zöld (max)
  - Dropdown: `"Név (max X)"`, ingyenes kerettel: `🎁N`, KP-t adó: `➕6-12-18KP`
  - Többszörös fortélyok: generikus `többszörösség` yaml mező alapján
    - `spec_típus` + `spec_lista: [...]` → fix lista dropdown (szűri a már felvetteket)
    - `spec_típus` + `spec_lista: []` → freetext popup (max 20 kar)
    - Példányok neve: `"AlapNév - alnév"` formátum
  - Fok választó: kerek radio gombok (1..maxfok), aktív=zöld, maxfok=1 → nincs popup
  - Ingyenes keret: `floor((TSz+1)/ingyenes_perszint)` db, 🎁 jel az ingyeseknél
  - KP logika: `kp_perfok` per fortély, base name lookup többszörös fortélyoknál
  - Törlés: mindig megerősítő dialógus (piros "Törlés" gomb)
  - Game mód: koppintás → accordion info (leírás, hatás, követelmény, kiterjesztések)
  - Rövid koppintás szerkesztő módban: nem csinál semmit (csak hosszú nyomás)
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
- ✅ tables/kepzettsegek.json, kiterjesztesek.json, fajok.json, faj_tulajdonsag_keretek.json, primer_fortelyok.json, fortelyok.json, konstansok.json
- ✅ Context menu prevention (onContextMenu preventDefault + CSS touch-callout + user-select)
- ✅ Escape gomb: minden popup overlay bezárható Escape-pel
- ✅ GitHub Pages deploy workflow (`.github/workflows/deploy_webapp.yml`)
  - Trigger: push master (web/ vagy data/ változás) + workflow_dispatch
  - Python 3.13 + Node 20 + generate_tables.py + npm ci + build + postbuild (data copy) + deploy
  - URL: `https://kaktusztea.github.io/szilankrpg/`

## Következő lépések
1. **Aktív fül UI** — szituáció toggle-ök (fegyver, pajzs, páncél, taktika, helyzet, manőver, státuszok)
2. **Harcértékek fül** — HM/CM, fegyver/páncél konfigurátor (csak Szerkesztő módban)
3. **Karakter mentés/betöltés** — JSON export/import
4. **Szabályleírás fülek** — md tartalom renderelés (taktikák, helyzetek, manőverek)

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
- `/mnt/c/repo/szilank.code/web/src/engine/` — engine modulok (types, data-loader, harcertek, pancel, ep, kp, modifiers, limits, tavharc)

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
- Hosszú nyomás: 400ms timeout → popup megnyitás (Név, Szint, Faj, Kor, Tulajdonságok, Képzettségek, Fortélyok)
- Rövid koppintás szerkesztő módban: nem csinál semmit (képzettségek, fortélyok)
- Rövid koppintás Game módban: accordion info toggle
- Törlés megerősítő dialógus: piros "Törlés" gomb
- Default tab induláskor: Tul/Képz (index 2)
