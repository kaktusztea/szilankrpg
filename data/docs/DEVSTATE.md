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

## Fontos adatmodell összefoglaló

### Karakter séma (v2)
- Egyetlen JSON (`karakter + session`), NEM tartalmaz számított értékeket
- `session`: runtime harc state (vé_csökkenés, aktív_taktikák, fegyverfogás, stb.)
- Multi-slot localStorage: `szilank_char_{uid}`, max 10 slot
- Teszt karakter: `data/karakter/test_karakter2.json` (single source of truth)

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
- `vitest run`: 107 unit teszt (66 deterministic + 22 fuzz + 15 golden; build előtt fut)
- Deploy: GitHub Pages, auto-deploy push master
- Metadata: `ÉV.ÉVNAPJA.napibuild`
