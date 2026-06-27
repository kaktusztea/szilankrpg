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
│   │   ├── hatas_operatorok.yaml
│   │   ├── hatasok.yaml
│   │   ├── esemenyek.yaml
│   │   ├── hatterek.yaml      ← Leíró + Karma hátterek
│   │   ├── kepzettsegek/      ← Képzettség yaml-ok (primer/szekunder alkönyvtárak)
│   │   ├── fortelyok/         ← Fortély yaml-ok (harci/altalanos/tavharc/szabad/misztikus/kiemelt/erzekek)
│   │   └── fajok/             ← Faj hátterek (27 db)
│   ├── schemas/               ← YAML sémák (karakter, fortely, kepzettseg, fegyver, pancel, faj, taktika, statusz, hatas, esemeny, harci_helyzet, manover, hatter)
│   ├── tables/                ← Generált + statikus JSON táblák (runtime)
│   ├── karakter/              ← Karakter template-ek (empty_karakter.json, test_karakter.json)
│   ├── rules.json             ← Reactive engine szabályok (54 deklaratív képlet/aggregáció)
│   └── generate_tables.py     ← YAML→JSON generáló script (Vite plugin és prebuild futtatja)
├── web/karakter/              ← React + Vite + TypeScript webes karakteralkotó app
│   ├── src/
│   │   ├── engine/            ← Kalkulációs engine modulok
│   │   │   ├── types.ts       ← Típusdefiníciók (Karakter v2, Session, Fortely, stb.)
│   │   │   ├── data-types.ts  ← Adat interface-ek (GameData, FortelySummary, TaktikaEntry, stb.)
│   │   │   ├── data-loader.ts ← JSON betöltés runtime
│   │   │   ├── reactive.ts   ← Reactive rule engine (evaluate, buildContext, buildArrayContext)
│   │   │   ├── feltetelek.ts ← buildAktívFeltételek helper
│   │   │   ├── ketkezes.ts   ← Kétkezes harc kalkuláció
│   │   │   ├── fortely-mods.ts ← Fortély módosító kiértékelés
│   │   │   ├── file-ops.ts   ← Save/Load/Duplicate logika
│   │   │   ├── url-share.ts  ← URL-alapú karakter megosztás
│   │   │   ├── validate.ts   ← Karakter validáció (schema + referenciális)
│   │   │   ├── undo-helpers.ts
│   │   │   ├── alapeset.ts   ← Fortély 0.fok (Alapeset) kiértékelés
│   │   │   ├── helpers.ts    ← Közös utility (lookupFegyver)
│   │   │   └── index.ts
│   │   ├── hooks/             ← React hook-ok
│   │   │   ├── useKarakterState.ts    ← Karakter állapotkezelés (localStorage, slotok)
│   │   │   ├── useKarakterActions.ts  ← Karakter műveletek (mentés, betöltés, új, teszt)
│   │   │   ├── useUndoWrappedSetters.ts ← Undo-aware setter wrapperek
│   │   │   ├── useUrlImport.ts        ← URL import hook
│   │   │   ├── useSwipe.ts            ← Swipe gesture kezelés
│   │   │   └── useOverlays.ts         ← Overlay állapotkezelés
│   │   ├── components/
│   │   │   ├── App.tsx / App.css      ← Tab shell, swipe, animáció, Szerk/Game mód
│   │   │   ├── Header.tsx             ← Fejléc (cím, ⚙️, mód toggle)
│   │   │   ├── TabBar.tsx             ← Tab bar (tükrözött, ikon-only)
│   │   │   ├── TabContent.tsx         ← Screen slider wrapper
│   │   │   ├── KpBar.tsx              ← KP sáv (Maradt KP + Primer keret)
│   │   │   ├── SlotList.tsx           ← Multi-karakter slot lista
│   │   │   ├── AppOverlays.tsx        ← Globális overlay-ek összefogó
│   │   │   ├── ScreenErrorBoundary.tsx
│   │   │   ├── formatters.tsx         ← fmtCode + fmtHatás shared helperek
│   │   │   ├── harc/                  ← Harc fül (HarcScreen, EpTable, FegyverTable, stb.)
│   │   │   ├── aktiv/                 ← Aktív fül (taktikák, helyzetek, manőver, státusz, hatás pool)
│   │   │   ├── tulajdonsagok/         ← Tul/Képz fül (tulajdonság grid, képzettségek, PrimerKpBox)
│   │   │   ├── fortelyok/             ← Fortélyok fül (csoportok, felvétel wizard, info panel)
│   │   │   ├── harcertekek/           ← Harcértékek fül (HM, fegyverek, páncél, pajzs)
│   │   │   ├── tavharc/               ← Távharc fül (CÉ/VÉ kalkulátor, fegyverek, CM)
│   │   │   ├── misztikus/             ← Misztikus fül (Aura, Tradíció, Arkánumok, fortélyok)
│   │   │   ├── hatterek/              ← Hátterek fül (szövegfelhő)
│   │   │   └── overlays/              ← Overlay komponensek (menü, mentés, slot, undo, stb.)
│   │   └── styles/
│   │       ├── variables.css
│   │       └── overlays.css
│   ├── public/
│   │   ├── manifest.json      ← PWA manifest
│   │   └── metadata.json      ← Build metadata (generált)
│   ├── vite.config.ts         ← Vite config (serveDataPlugin, metadata, host)
│   ├── generate_metadata.py   ← Build metadata generátor (ÉV.ÉVNAPJA.napibuild)
│   ├── validate_karakter.py   ← Teszt karakter validáló script
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/          ← CI/CD (linkspector, fegyverek, KP, harcmodor, onefile, deploy)
├── code/                       ← Python scriptek (process_fegyverek.py + lib/)
├── work/                       ← Munka fájlok (szilank.rpg.full.md, segédlet odt-k)
├── segedlet/                   ← Segédletek (NJK karlap, ingame segédlet PDF)
└── archive/                    ← Archív (régi ODS karakteralkotók, changelog, odt.work)
```

## TODO Backlog

| Téma                             | Leírás                                                  | Szekció     |
| -------------------------------- | ------------------------------------------------------- | ----------- |
| Harc alakzatban                  | NJK kalkulátor, Alakzat ellen helyzet, taktika tiltások | §28         |
| Méreggenerátor                   | KM eszköz: méreg paraméterek → komplexitás/Mk szint     | §39         |

### Aktív fül
- Belharc rendszer — fegyver/harcmodor korlátozás jelzés + puszta kéz TÉ/VÉ/SP override

### Karakteralkotó — általános
- Láthatatlan ellenfél taktika: kiszedve a yaml-ból, státuszként kezelni?
- Ember (Szigetvilági) faj háttér hozzáadása (slan helyett)

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
- Alakzatharc, Alakzat: támadó/védekező, Vezető: Alakzatparancsnok/Fejvadász stratégis/Íjászparancsnok/Léglovaskapitány/Lovaskapitány/Testőrparancsnok

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

---

## Fontos konvenciók

### Karakter adatmodell
- Karakter séma: v2 (`data/schemas/karakter.yaml`), egységes `fortélyok[]` tömb, `session` szekció runtime state-nek
- Karakter mentés formátum: egyetlen `.json` fájl (karakter + session), NEM tartalmaz származtatott/számított értékeket
- `session` szekció: vé_csökkenés, vé_history, manőver_pont_használt, sebzések, aktív_fegyver_index, aktív_pajzs/páncél/taktika/helyzet/manőver/státuszok, szilánk, fegyverfogás
- Session v2: `aktív_taktikák: AktívTaktika[]`, `aktív_helyzetek: string[]` (körülmények is itt)
- `DEFAULT_SESSION` (types.ts-ben exportálva), betöltéskor hiányzó session pótlása
- Teszt karakter: `data/karakter/test_karakter.json` a single source of truth; runtime fetch
- Validáló script: `web/validate_karakter.py`
- `mentés_dátum`: YYYY-MM-DD HH:MM formátum
- Mentés fájlnév: `kisbetű_éktelenítve_Xtsz.json` (első név max 20 kar, ASCII only)
- Multi-karakter localStorage: max 10 slot, `szilank_char_{uid}` + `szilank_slots` + `szilank_active`
- Karakter ID: uid (UUID, egyedi) + id_leíró (slug, auto-frissül név/TSz-ből)
- isDirty flag: új karakter nem mentődik amíg nincs módosítás
- Teszt mód: teszt karakter nem mentődik, "Szilánk" label narancssárga

### Képzettségek
- `többszörös` mező: string lista (nem boolean!)
  - `[]` = egyszer felvehető
  - `["Közelharc", "Kardvívás", ...]` = fix alnevek listája
  - `["*"]` = szabad szöveges alnév (max 20 karakter)
- Belső tárolás: fix listánál alnév önmagában, szabad szövegesnél `"AlapNév: xyz"`
- Képzettség limitek: primer max = TSz, szekunder max = TSz+3; túllépés → piros (`kep-over` class)
- Tradíció képzettség: `"Tradíció: Vulgármágia"` formátum, tradiciok.json-ból picker
- Harci + misztikus képzettségek: Harcértékek / Misztikus fülön (nem Tul/Képz)

### Fortélyok
→ Kalkuláció részletek: **engine_spec.md §16, §16.1, §25**
- Yaml mezők: `kp_perfok`, `ingyenes_perszint`, `többszörösség.spec_típus`+`spec_lista`, `kiérdemelhető`, `session_toggle`, `emlékeztető`
- Belső tárolás: `{ név, fok, spec_típus, spec_elem, kiérdemelt? }` — név mindig az alapnév
- KP lookup: `f.név` → fortelyKpMap (alapnév). Display: `f.spec_elem ? "${f.név} - ${f.spec_elem}" : f.név`
- Locked fortélyok: `konstansok.locked_fortélyok` (Mesterfegyver, Pajzshasználat, Merevvértviselet)
- Kiérdemelt: nem primer, nem fogyasztja ingyenes keretet
- Szabad fortélyok: `kp_perfok: 6`, ingyenes keret = TSz db
- Nyelvismeret: pont keret = `max(0, (nyelvtanulás_szint - 3) * 3)`
- Módosító módok: `flat`, `scaled`, `override`, `enyhít`, `előny`, `hátrány`
- Alapeset (0.fok): `engine/alapeset.ts`
- Session toggle: yaml `session_toggle: true` → Aktív fül toggle

### Feltétel rendszer
→ Részletes dokumentáció: **engine_spec.md §16, §24**
- Feltétel típusok: string (prefix:érték dispatch) VAGY lista (kalkulált: `[{forrás, operátor, érték}]`)
- Feltétel prefixek: `harci_helyzet:`, `taktika:`, `fegyver:`, `fegyver_kategória:`, `fegyverfogás:`, `páncél:`, `manőver:`, `státusz:`, `szituáció:`
- ID konvenció: YAML `id` → JSON `feltétel_kulcs: "{prefix}:{id}"`

### Reactive Engine
→ Részletes dokumentáció: **engine_spec.md §41**
- 54 deklaratív szabály (`data/rules.json`)
- Maradék TS inline logika: Fájdalomtűrés, Kétkezes harc, Fortély módosítók, Taktika mods

### Fegyverek, páncél, pajzs
→ Kalkuláció részletek: **engine_spec.md §5-§13, §27**
- MK fegyverek: `fegyverek.json` MK_pár + Alapnév + Hárító flag; `process_fegyverek.py` generálja
- Fegyver mezők: `Hárító: "1"/"0"`, `Erőbónusz limit: "0"`=nincs, `"99"`=korlátlan
- Pajzs: `karakter.pajzs: { méret }`, Pajzshasználat fok = fortélyok[] tömb
- Páncél: `méret_illeszkedés: passzol/nem passzol/borzalmas` (MGT: 0/3/6)
- Mesterfegyver NEM számít a max HM-be
- pattern fájlok: `data/tables/*_pattern.json`. Pajzsok hozzáfűzve fegyverek.json-hoz (kategória: "pajzs")

### Kétkezes harc
→ Részletes dokumentáció: **engine_spec.md §26**
- `session.fegyverfogás: "kétkezes"`, `konstansok.kétkezes_harc_bónuszok[]`, `engine/ketkezes.ts`

### Taktikák, harci helyzetek, manőverek
→ Részletes dokumentáció: **engine_spec.md §21**
- Taktika kombó: `kombó_mód` + `kombó_lista`, megkötés típusok: `harci_helyzet/tiltott|szükséges`, `harcmodor/tiltott`, `támadások/min`, `per_küzdelem/max`, `többes_harc/tiltott`
- Taktika `fortély_bővítés`: strict schema, minden taktikában explicit
- Harci helyzet: `kizár_helyzetek` (id-alapú), `tiltott_fegyverfogások`, `tiltja_taktikákat`, `rejtett`
- Státuszok: `többszörös: true` + `alkategóriák` → almenü picker
- Manőver Pont: `CEIL(harcmodor_összeg x 2 / tsz)`

### Build pipeline
- `data/generate_tables.py`: YAML → JSON generálás (konstansok, képzettségek, fortélyok, kiterjesztések, primer fortélyok, fajok, faj keretek, taktikák, harci helyzetek, manőverek, státuszok, hatások, események, hátterek)
- Vite plugin: dev szerver indulásakor automatikusan futtatja
- `prebuild` script: `npm run build` előtt fut
- Runtime: minden adat `tables/*.json`-ból fetchJson-nel, nincs YAML parse, nincs js-yaml dependency
- Deploy: GitHub Pages, `https://kaktusztea.github.io/szilankrpg/`, auto-deploy push master-re
- Build metadata: `ÉV.ÉVNAPJA.napibuild` formátum

### UI konvenciók
- Tab bar: tükrözött (jobb→bal), ikon-only: ✳️🗡️🏹🛡️✨🔵🟣🟡, 18px font
- Screen slider: tükrözött, swipe irány invertált
- Szerkesztő/Game mód: 2000ms fade animáció (narancs↔zöld)
- Game módban: üres képzettség/fortély csoportok elrejtve, szerkesztő kontrollok rejtve
- Jegyzetek (✏️) és Napló (📅): overlay (nem tab)
- Fejléc: ⚙️ menü + 🔧/🎮 mód toggle
- Default tab induláskor: Tul/Képz (index 5 az ALL_TABS-ban)
- Értékválasztó popup-ok: érték kiválasztása bezárja, Escape bezárja módosítás nélkül
- Popup dialógusok: createPortal(document.body)
- Tap interakció: minden szerkesztő elem egyetlen koppintásra reagál
- Context menu prevention: `onContextMenu preventDefault` + CSS touch-callout + user-select
- Touch event isolation: kep-row `onTouchStart/End stopPropagation`
- Swipe isolation: popup overlay-eknél `.closest('.kep-prompt-overlay')` check
- Overlay cancel: mellé koppintás → dispatch Escape
- Törlés: mindig megerősítő dialógus (piros gomb)
- Reset: megerősítő popup, disabled ha nincs mit resetelni
- ScreenErrorBoundary: minden tab burkolt, crash → hibaüzenet
- Harcmodor nevek: `[...new Set(Object.values(konstansok.fegyver_kategória_harcmodor))]`
- Harcmodor display name: közelharci → "Harcmodor: X", távharci → "Táv. harcmodor: X"
- KP tábla: v8.6.0 értékek (2.5-tel osztott)
- WSL + NTFS: nincs symlink, Vite serveDataPlugin oldja meg
- .obsidian/ könyvtár SOHA ne módosítandó
- Strict schema: minden YAML source fájlban explicit megvan minden séma-mező (nincs implicit default)
