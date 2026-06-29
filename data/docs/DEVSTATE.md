# Szilánk RPG — Fejlesztési állapot

> Konvenciók, build, irányelvek → **AGENTS.md**
> Kódtérkép, fájl-felelősségek → **MAP.md**
> Engine formulák → **engine_spec.md** (§1-§41)
> UI viselkedés → **gui_spec.md**

---

## TODO Backlog

| Téma | Leírás | Spec |
|------|--------|------|
| Harc alakzatban | NJK kalkulátor, Alakzat ellen helyzet, taktika tiltások | §28 |
| Méreggenerátor | KM eszköz: méreg paraméterek → komplexitás/Mk szint | §39 |
| Belharc rendszer | Fegyver/harcmodor korlátozás jelzés + puszta kéz override | §21.4 |
| Láthatatlan ellenfél | Taktika vs státusz döntés | — |
| Ember (Szigetvilági) | Faj háttér hozzáadása (slan helyett) | — |

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

## Legutóbbi refaktorálás (2026-06-29)

Cél: modularizáció, teljesítmény, DRY.

| # | Terület | Fájlok | Hatás |
|---|---------|--------|-------|
| 1 | fegyver-calc evaluate optimalizáció | `reactive.ts` (+filterFegyverRules), `fegyver-calc.ts`, `useHarcComputed.ts` | 54→5 rule/fegyver, páncél ctx egyszer |
| 2 | HatasPoolCalc szétbontás | `aktiv/HatasPoolCalc.ts` (4 pure fn + orchestrator) | Tesztelhető részek |
| 3 | Közös MF/penge util | `harc/shared.ts` (új), `harc-reszletek-calc.ts` | DRY: findMfFok, getMfBónusz |
| 4 | EpTable logika kiszervezés | `harc/ep-logic.ts` (új), `EpTable.tsx` | Pure logic külön |
| 5 | AktivHelpers szétszedés | `aktiv/taktika-helpers.ts`, `aktiv/helyzet-helpers.ts` (új), `AktivHelpers.ts` (barrel) | SRP |
| 6 | TabContent adapter | `karakter-setters.ts` (új), `TabContent.tsx` | makeFieldSetter eliminálja inline lambdákat |
| 7 | Feltétel eval kiszervezés | `engine/feltetel-eval.ts` (új), `useHarcComputed.ts` | Feltétel logika újrahasznosítható |
| 8 | Generikus hook-ok | `hooks/useEscapeClose.ts`, `hooks/usePopupState.ts` (új) | Inline useEffect eliminálás |
| 9 | shared.ts bővítés | `harc/shared.ts` (+calcSpOverride, resolveNagyobbKisebb), `HarcCalc.ts` (törölve) | DRY: SP override + kétkezes pengeméret |
| 10 | HarcFegyverTable DRY | `HarcFegyverTable.tsx` | Egyetlen renderRow() minden sorra (TÉ/VÉ duplikáció eliminálva) |
| 11 | pajzsFegyverNév konszolidáció | `shared.ts` (+buildPajzsFegyverNév), 5 fájl | 5 inline duplikáció → 1 helper |
| 12 | Escape hack eltávolítás | `useOverlays.ts`, `EpTable.tsx` | dispatchEvent hack → direkt reset + useEscapeClose |
| 13 | Setter konvenció konszolidáció | `karakter-setters.ts` (+makeFajSetter, makeUndoKarakterSetter), `TabContent.tsx` | Egységes undo-aware setter minta |
| 14 | calcFortélyPool olvashatóság | `aktiv/HatasPoolCalc.ts` (+isFeltételAktív, extractHelyzetKötés) | 3-level nesting → flat helpers |
| 15 | EpDialogs kiemelés | `harc/EpDialogs.tsx` (új), `EpTable.tsx` | useEffect trigger → explicit click handler |
| 16 | Taktika üzleti logika kiemelés | `aktiv/taktika-helpers.ts` (+getExtraFokok, formatFokMods), `AktivTaktikak.tsx` | Render ↔ logika szétválasztás |
| 17 | fegyver-calc cache fix | `fegyver-calc.ts` | Module-szintű let → WeakMap (HMR-safe) |
| 18 | Overlay/picker konszolidáció | `PopupOverlay.tsx`, `PickerOverlay.tsx`, `misztikus/Overlay.tsx`, `FortelyPopups.tsx`, `FortelyFelvetel.tsx`, `FortelyRow.tsx`, `SpecPicker.tsx`, `HarcPopups.tsx`, `StatuszPickerOverlay.tsx` | 2 központi shell (PopupOverlay + PickerOverlay) + ESC kezelés; 9 fájlból inline createPortal eliminálva; 6 fájlból redundáns useEscapeClose/useEffect törölve |
| 19 | Inline style → CSS class | `AktivHelyzetek.tsx`, `styles/common.css` | Helyzet picker csoport színek CSS classban (`.aktiv-picker-group-pozitív/semleges/negatív`) |
| 20 | MF lookup DRY (canonical) | `engine/mf-utils.ts` (új), `harcertekek/helpers.ts`, `harc/shared.ts` | Egységes `findMfFok` + `getMfBónusz` az engine layerben |
| 21 | Taktika fokDef interpoláció DRY | `aktiv/taktika-helpers.ts` (+interpolateFokDef), `harc/taktika-calc.ts` | Közös helper a fortély_bővítés extrapolációra |
| 22 | Reactive engine belső bontás | `engine/reactive-parse.ts` (új), `engine/reactive.ts` | evalFormula + 5 aggregate resolver → külön fájl (tesztelhetőség) |
| 23 | Undo hook kiszervezés | `hooks/useUndo.ts` (új), `hooks/useKarakterState.ts` | Undo logika önálló hook-ba |
| 24 | Unit test infrastruktúra | `vitest.config.ts`, 13 test fájl (88 teszt, ebből 22 fuzz/property-based) | Vitest + fast-check bekötve buildbe; lefedi: reactive-parse, reactive, mf-utils, utils, validate, ep-logic, shared, taktika-helpers |

---

## Fontos adatmodell összefoglaló

### Karakter séma (v2)
- Egyetlen JSON (`karakter + session`), NEM tartalmaz számított értékeket
- `session`: runtime harc state (vé_csökkenés, aktív_taktikák, fegyverfogás, stb.)
- Multi-slot localStorage: `szilank_char_{uid}`, max 10 slot
- Teszt karakter: `data/karakter/test_karakter.json` (single source of truth)

### Képzettségek
- `többszörös`: `[]`=egyszeri, `["X","Y"]`=fix lista, `["*"]`=freetext
- Harci → Harcértékek fül; Misztikus → Misztikus fül; többi → Tul/Képz

### Fortélyok
- Tárolás: `{ név, fok, spec_típus, spec_elem, kiérdemelt? }` — név = alapnév
- Locked: Mesterfegyver, Pajzshasználat, Merevvértviselet
- Módok: flat, scaled, override, enyhít, előny, hátrány
- Részletek → engine_spec §16, §16.1, §24, §25

### Fegyverek / Páncél
- MK fegyverek: 2 entry (1K/2K), 1 kártya Harcértékek fülön
- Pattern fájlok: `tables/*_pattern.json`; Pajzs hozzáfűzve fegyverek.json-hoz
- Részletek → engine_spec §5-§13, §26-§27

### Taktikák / Helyzetek
- Kombó: `kombó_mód` + `kombó_lista`; Megkötés: `harci_helyzet/tiltott|szükséges`
- Helyzet: `kizár_helyzetek` (id), `tiltott_fegyverfogások`, `tiltja_taktikákat`
- Részletek → engine_spec §21

### Reactive Engine
- 54 szabály `data/rules.json`
- Maradék TS: Fájdalomtűrés, Kétkezes harc, Fortély mods, Taktika mods
- Részletek → engine_spec §41

### Build pipeline
- `generate_tables.py`: YAML → JSON (Vite buildStart + prebuild)
- `vitest run`: 88 unit teszt (66 deterministic + 22 property-based fuzz; build előtt fut)
- Deploy: GitHub Pages, auto-deploy push master
- Metadata: `ÉV.ÉVNAPJA.napibuild`
