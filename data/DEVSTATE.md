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
│   ├── tables/                ← Generált JSON táblák (fegyverek, távfegyverek, pajzsok, KP, harcmodor bónusz, távharc szorzók, tradíciók, képzettségek, kiterjesztések)
│   ├── konstansok.yaml        ← Központi konstansok (KP, arányok, páncél, harcmodorok, nyelvek, stb.)
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
│   │   │   ├── data-loader.ts ← YAML/JSON betöltés runtime (konstansok, fegyverek, pajzsok, KP, harcmodor, képzettségDefs, kiterjesztések)
│   │   │   └── index.ts       ← Barrel export
│   │   ├── components/
│   │   │   ├── HarcScreen.tsx  ← Harc fül (KÉSZ: KÉ, SFÉ, VÉ csökk, MP, fegyvertábla, ÉP táblázat)
│   │   │   ├── HarcScreen.css
│   │   │   ├── EpTable.tsx     ← ÉP rubrika táblázat (sebesülés/gyógyulás/compaction)
│   │   │   ├── EpTable.css
│   │   │   ├── TulajdonsagokScreen.tsx  ← Tulajdonságok + Képzettségek fül (KÉSZ)
│   │   │   └── TulajdonsagokScreen.css
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
  - Tulajdonságok: fix 2×4 grid, teljes nevek, húzásos csúszka (-5..+7)
  - Képzettségek: 7 csoportban, dropdown választó, ✕ törlés, hosszú nyomás szint-csúszka (0-15)
  - Többszörös képzettségek: generikus `többszörös` lista mező (fix alnév lista VAGY `["*"]` szabad szöveges)
  - Game mód adatlap: próba, domináns tulajdonságok, kiterjesztő fortélyok
  - Touch event isolation: slide közben nem triggerelődik a tab swipe
- ✅ tables/kepzettsegek.json: 39 képzettség def (név, csoport, primer, többszörös, próba, domináns_tulajdonságok)
- ✅ tables/kiterjesztesek.json: inverz mapping (képzettség → kiterjesztő fortélyok, 27 képzettségre)

## Következő lépések
1. **Aktív fül UI** — szituáció toggle-ök (fegyver, pajzs, páncél, taktika, helyzet, manőver, státuszok)
2. **Fortélyok fül** — accordion lista
3. **Harcértékek fül** — HM/CM, fegyver/páncél konfigurátor (csak Szerkesztő módban)
4. **Karakter mentés/betöltés** — JSON export/import
5. **GitHub Pages deploy** workflow
6. **Szabályleírás fülek** — md tartalom renderelés (taktikák, helyzetek, manőverek)

## Új chat nyitásakor olvasd be ezeket
- `/mnt/c/repo/szilank.code/data/DEVSTATE.md` (ez a fájl)
- `/mnt/c/repo/szilank.code/data/engine_spec.md` — engine kalkulációk specifikációja
- `/mnt/c/repo/szilank.code/data/gui_spec.md` — GUI specifikáció (screen-ek, viselkedés, formázás)
- `/mnt/c/repo/szilank.code/data/konstansok.yaml` — központi konstansok
- `/mnt/c/repo/szilank.code/data/schemas/` — összes schema (fortely, kepzettseg, karakter, pancel, fegyver, faj)
- `/mnt/c/repo/szilank.code/web/src/App.tsx` — fő app komponens (tab rendszer, mód toggle)
- `/mnt/c/repo/szilank.code/web/src/components/HarcScreen.tsx` — Harc fül implementáció
- `/mnt/c/repo/szilank.code/web/src/components/TulajdonsagokScreen.tsx` — Tulajdonságok + Képzettségek fül
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
- Generált JSON-ok: `tables/kepzettsegek.json` és `tables/kiterjesztesek.json` — python3 scripttel a yaml-okból (lásd DEVSTATE történet)
- Touch event isolation: slide kontrollok `onTouchStart/End` stopPropagation-nel védve a tab swipe ellen
