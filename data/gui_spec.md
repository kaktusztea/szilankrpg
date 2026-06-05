# GUI Spec — Szilánk RPG Karakteralkotó

Mobil-first, responsive design. Tab-alapú navigáció (alsó tab bar).

---

## Technológia és konfig

- **Stack**: React 19 + Vite 6 + TypeScript 5.8
- **Base URL**: `/szilankrpg/`
- **Max szélesség**: 600px (centered)
- **Font**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Base font-size**: 14px
- **Context menu**: disabled (`onContextMenu preventDefault`)
- **User select**: disabled (`user-select: none`, `-webkit-touch-callout: none`)

## CSS változók (dark theme)

```css
--bg: #1a1a2e
--surface: #16213e
--primary: #0f3460
--accent: #e94560
--text: #eee
--text-dim: #999
--input-bg: #2a2a4a
--success: #4caf50
--warning: #ff9800
--error: #f44336
```

## KP sáv színek
- Normál háttér: `#2e7d32`
- Negatív háttér: `#c62828`

---

## Általános elvek

- **Mobile-first**: 320px szélességtől használható
- **Két mód**: Szerkesztő mód és Game mód (toggle gomb a fejlécben)
  - Toggle gomb szín: Szerkesztő=`#ff9800`, Game=`#4caf50` (háttér), szöveg: `#000`
- **Tab navigáció**: alul fix tab bar, horizontálisan scrollozható (minden tab közvetlenül elérhető, nincs "..." menü)
- **Screen váltás**: jobb-bal swipe gesztussal (mobilon, threshold: 30px), desktop-on tab kattintás
- **Swipe**: csak horizontális, `Math.abs(dx) > Math.abs(dy)` check
- **Long press**: 400ms timeout minden szerkesztő interakcióhoz
- **Popup overlay-ek**: `createPortal(document.body)`, `.kep-prompt-overlay` osztály, `position: fixed; inset: 0; z-index: 100`
- **Escape**: minden popup overlay bezárható
- **Accordion/collapse**: elemek lenyithatók koppintásra (Game mód), másik koppintás becsukja
- **Szín kód**: sárga (`--warning`) = módosítható/köztes érték, zöld (`--success`) = teljes/számított, piros (`--error`/`--accent`) = hiba/limit túllépés/kiemelt

---

## App fejléc (header)

- `padding: 8px 12px`, háttér: `--primary`, `border-bottom: 1px solid #333`
- Bal: "Szilánk RPG" (`font-weight: bold, 16px`)
- Jobb: mód toggle gomb
  - Szerkesztő: háttér `#ff9800`, szöveg `🔧 Szerkesztés`
  - Game: háttér `#4caf50`, szöveg `🎮 Game mód`
  - Szöveg szín mindkettőben: `#000`

---

## Szerkesztő mód vs Game mód

| | Szerkesztő mód                          | Game mód                   |
|---|------------------------------------------|----------------------------|
| Tulajdonságok            | szerkeszthető | read-only                  |
| Képzettségek             | szerkeszthető (szint, felvétel) | read-only    |
| Fortélyok                | szerkeszthető (fok, felvétel)   | read-only    |
| Fegyverek, Páncél        | szerkeszthető | read-only                  |
| Hátterek                 | szerkeszthető | read-only                  |
| **Aktív fül**            | szerkeszthető | **szerkeszthető** ✅        |
| **ÉP / VÉ csökkenés**   | szerkeszthető | **szerkeszthető** ✅        |
| **Manőver Pont használat** | szerkeszthető | **szerkeszthető** ✅      |
| Szabályleírás fülek      | read-only     | read-only                  |

### Viselkedés
- **Toggle gomb** a fejlécben (pl. 🔧/🎮 ikon): váltás a két mód között
- **Game módban**: a szerkesztő kontrollok (input mezők, szint-állítók, felvétel gombok) eltűnnek — csak az értékek látszanak
- **Game módban elérhető**: Aktív fül teljes egészében, VÉ csökkenés +/- gombok, ÉP jelölés, Manőver Pont felhasználás

---

## 1. Aktív fül/screen

A harc közbeni szituáció beállítása. Minden itt kiválasztott elem befolyásolja a "Harc" fülön megjelenő értékeket.

### Fejléc (mindig látható)
- Név, Faj, Kor, Tapasztalati szint, Aura (max/aktuális)

### Aktív elemek

| Elem                          | Típus                  | Leírás                                                        |
|-------------------------------|------------------------|---------------------------------------------------------------|
| Aktív fegyver                 | single-select lista    | Karakter fegyver-példányai. Default: "Puszta kéz"            |
| Aktív pajzs                   | boolean toggle         | Pajzs viselve igen/nem                                        |
| Aktív páncél                  | boolean toggle         | Páncél viselve igen/nem                                       |
| Harci akrobatika aktív        | boolean toggle         | Ha fortély megvan, bónuszt ad TÉ/VÉ-re                       |
| Aktív manőver                 | single-select dropdown | Manőverek listájából                                          |
| Aktív harci taktika           | single-select dropdown | Harci taktikák listájából                                     |
| Aktív harci helyzet           | single-select dropdown | Harci helyzetek listájából                                    |
| Aktív státuszok               | multi-select toggle    | Koppintás negál. Pl: Áldott 1/2, Átkozott 1/2, Bénultság 1/2 |

### Viselkedés
- Dropdown-ok mellett **X** gomb: default állapotba állít vissza
- Az állapotválasztók módosítókat vezérelnek → Harc fül értékei azonnal frissülnek

---

## 2. Harc fül/screen

A karakter aktuális harci értékei, az "Aktív" fül beállításai alapján számítva.

### Tartalom

- **Felső box-sor** (egy sorban, egymás mellett, gap: 8px; mobilon ≤480px: 2×2 grid):
  - **KÉ box**: label `KÉ` (14px, bold, fehér, uppercase), érték (28px, bold, fehér)
  - **SFÉ box** (balra rendezve): fejléc label `SFÉ (X%)` (14px, bold, fehér, uppercase), alatta `Fizikai: X` és `Energia: X` egymás alatt (14px, érték: 16px bold)
  - **VÉ csökk. box**: label (14px, bold, fehér, uppercase), érték (24px, bold, warning/sárga szín), alatta gombok: +1, +2, +3, -1, ⟲ (12px, 4px gap). Dinamikusan csökkenti a Teljes harcértékek VÉ oszlopát.
  - **MP box**: label `MP` (14px, bold, fehér, uppercase), érték `X/Y` (20px, bold, success/zöld szín), alatta gombok: -1, ⟲ (12px). Default: max.
  - Minden box: háttér surface szín, 1px solid #444 border, 6px border-radius, 8px 12px padding
- **Teljes harcértékek** tábla (fegyverenként):
  - Fegyver | Tám/kör | TÉ | VÉ | SP | Pengehossz
  - TÉ label: accent/piros szín (azonos az ÉP TÉ levonás színével)
  - VÉ label: warning/sárga szín (azonos a VÉ csökkenés box színével)
  - TÉ értékek: dinamikusan csökkennek sebesülés kategória TÉ levonással
  - VÉ értékek: dinamikusan csökkennek VÉ csökkenés értékkel
- **VÉ csökkenés**: aktuális érték + gombok: +1, +2, +3, -1, ⟲ (reset)
- **ÉP táblázat**:
  - 4 oszlop (S1-S4), mindegyikben ÉP/4 db rubrika
  - Fejléc: ÉP összérték | Seb: X/Y
  - Oszlop footer: TÉ levonás értékek (`TÉ: 0`, `TÉ: -3`, `TÉ: -6`, `TÉ: -9`)
  - Az aktuális sebesülés-kategória TÉ levonás footere invertált színnel kiemelve (0 sebnél is: S1 aktív)
  - Spacing az utolsó rubrika-sor és a TÉ footer között (kicsi, 4px)
  - Rubrikák fentről lefelé töltődnek S1→S2→S3→S4 sorrendben
  - Kitöltött rubrikák: típus+sorszám jelölés (V1, Z2, FP3)
  - Szín: ÉP sebek pirosas-narancs árnyalatok (sorszámonként enyhén eltérő), FP sebek lila
  - FP utáni ÉP seb: fentről lefelé felülírja a meglévő FP rubrikákat, majd üres helyeket tölt
  - Gyógyulás utáni compaction: kitöltött rubrikák tömörítődnek felülre (nincs lyuk középen, FP felcsúszik ÉP mögé)
  - Sorszám újrahasználat: ha egy seb összes rubrikája begyógyult, a száma felszabadul
  - TÉ levonás dinamikusan vonódik le a Teljes harcértékek TÉ oszlopából (sebesülés kategória alapján)
  - **⚔️ Sebesülés gomb**: típus (S/V/Z/FP) + érték választó. Default: S (Szúró).
  - **💚 Gyógyulás gomb**: disabled ha nincs seb. Megnyitja a Gyógyulás dialógust:
    - ÉP / FP választó gombok. Default: ÉP (első). Ha az adott típusból nincs seb → disabled + auto-select a másik.
    - Gombokon jelzi a max-ot: `ÉP (X)` / `FP (X)`
    - Érték input: max = az adott típusú sebek száma. Mellette `/ X` jelzés.
    - Hátulról töröl, utána compaction.
  - **⟲ Reset**: mindent töröl
- **Manőver Pont**: Manőver Alap + aktuális/max MP + gombok (+1, -1). Default: max.

---

## 3. Tulajdonságok + Képzettségek fül/screen

### Fejléc (legfelül)
- **Név + Szint** sor: két összeérő box
  - Név box (flex:1): `Név: Dorek a Toroni` — hosszú nyomásra szerkeszthető (popup dialógus, max 40 karakter)
  - Szint box: `Szint: 8` — hosszú nyomásra szerkeszthető (popup slider, range 1..konstansok.arányok.max_tsz)
- **Faj + Kor** sor (CSAK szerkesztő módban):
  - Faj box (flex:1): `Faj: Ember (Északi)` — hosszú nyomásra dropdown popup (26 faj a tables/fajok.json-ból)
  - Kor box: `Kor: 32` — hosszú nyomásra slider popup (5-500, lépésköz 5)
- **Game módban**: Faj és Kor eltűnik, a Név kiírásban jelenik meg: `"Dorek a Toroni (Ember (Északi), 32)"`

### Tulajdonságok
- 8 tulajdonság fix 2 oszlop × 4 sor grid-ben (fentről lefelé, aztán következő oszlop)
- Megjelenítés: teljes név + érték egymás mellett, pl. `Erő: 3`
- Nem reszponzív, fix layout
- Szerkesztő módban: hosszú nyomás (400ms) → popup overlay slider (-5..+7), OK/Mégse gombokkal
- Game módban: read-only
- **Faj limit warning**: ha az érték meghaladja/alulmúlja a kiválasztott faj min/max keretét → sárga szín + koppintásra lenyíló info (`Faj max: X` vagy `Faj min: X`)

### Képzettségek (alatta, csoport-bontásban)
- Csoportok sorrendje: Harci → Misztikus → Fizikai → Világi → Alvilági → Művészeti → Tudományos
- Csoportok összecsukhatóak (header koppintásra toggle, ▸/▾ nyíl + elemszám)
- Minden képzettség: név + szint (0-15) + ✕ törlés gomb
- Szint színkód: 0=piros, 1-8=sárga, 9+=zöld
- Csoportonként 1 db dropdown választó (Szerkesztő módban): új képzettség felvétele → azonnal felugrik a szint választó popup
- Törlés (✕ gomb): szint=0 → azonnal töröl, szint>0 → piros "Törlés" gombot tartalmazó megerősítő dialógus
- Többszörös képzettségek felvételkor csoportosítva a testvéreik mellé kerülnek

#### Többszörös képzettségek
- A `többszörös` mező a képzettség YAML-ban **string lista** (nem boolean):
  - `[]` → egyszer felvehető, normál viselkedés
  - `["Közelharc", "Kardvívás", ...]` → fix lista, dropdown-ban `"AlapNév: AlNév"` formátumban
  - `["*"]` → szabad szöveges, custom dialógus (max 20 karakter), `"AlapNév: alnév"` formátumban
- Megjelenítés: prefixes (`"Harcmodor: Közelharc"`, `"Ősi nyelv ismerete: Enoszukei"`)
- Belső tárolás: fix listánál alnév önmagában, szabad szövegesnél `"AlapNév: xyz"`

#### Viselkedés Szerkesztő módban
- Rövid koppintás: nem csinál semmit
- Hosszú nyomás (400ms): szint választó popup (gombok 1-15 grid, 5×3+2 elrendezés, aktív=zöld), érték választás azonnal bezárja
- Escape: popup bezárás

#### Viselkedés Game módban
- Koppintás: lenyílik accordion adatlap:
  - **Próba**: dobható / nem dobható / ellenpróba
  - **Domináns tulajdonságok**: pl. "Ügyesség, Gyorsaság"
  - **Kiterjeszti**: fortélyok listája (normál/erős jelzéssel)

### KP sáv (Szerkesztő módban, minden fülön)
- Fix sáv a tab-bar felett
- Tartalom: `Maradt KP: X    Maradt Szekunder KP: Y`
- Háttérszín: zöld (normál), piros (ha Maradt KP < 0)
- Szekunder maradék: `max(0, szekunder_kp - szekunder_költött)`
- Dinamikusan frissül minden képzettség módosításnál
- Game módban eltűnik

---

## 4. Fortélyok fül/screen

Fortélyok listája csoport szerint: Harci → Általános → Érzékek → Szabad → Kiemelt → Misztikus.

### Megjelenés
- Csoportok összecsukhatóak (header koppintásra toggle, ▸/▾ nyíl + elemszám)
- Kompakt lista: név + fok (szám). Fok szín: sárga ha fok < maxfok, zöld ha fok = maxfok
- Ingyenes keret alatti többszörös fortélyoknál 🎁 jel a név mellett
- ✕ törlés gomb minden fortélynál (szerkesztő módban)
- Csoportonként 1 db dropdown (szerkesztő módban): új fortély felvétele

### Dropdown lista jelölések
- Normál: `"FortélyNév (max X)"`
- Ingyenes kerettel (Kultúrkör, Helyismeret): `"Név (max 1) 🎁N"` ahol N a maradék ingyenes keret
- KP-t adó (Vakság, stb.): `"Név (max X) ➕6KP"` vagy több foknál: `"Név (max 3) ➕6-12-18KP"`
- Többszörösen felvehető fortélyok mindig láthatóak a dropdown-ban (nem szűrődnek ki)

### Többszörös fortélyok (generikus, `többszörösség` yaml mező alapján)
- `spec_típus: ""` → normál, egyszer felvehető
- `spec_típus` nem üres + `spec_lista: [...]` → fix lista dropdown (pl. Kultúrkör: 29 elem). Már felvett elemek kiszűrődnek.
- `spec_típus` nem üres + `spec_lista: []` → freetext popup (max 20 karakter) (pl. Helyismeret, Alkalmatlan fegyver hajítása)
- Felvett példányok neve: `"AlapNév - alnév"` formátum (pl. `"Kultúrkör - erv"`, `"Helyismeret - Erion"`)

### KP logika (fortélyok)
- `kp_perfok` yaml mező: `6` (normál), `0` (ingyenes/kiemelt), negatív (KP-t ad)
- `ingyenes_perszint` yaml mező: `0` (nincs ingyenes), `2` (minden 2. TSz-en 1 db ingyenes, kezdve 1.TSz)
- Ingyenes keret képlet: `floor((TSz + 1) / ingyenes_perszint)`
- Az ingyenes keret feletti példányok `kp_perfok` KP-ba kerülnek
- Többszörös fortélyok KP számítása a base name alapján (`"Kultúrkör - erv"` → lookup `"Kultúrkör"`)

### Viselkedés Szerkesztő módban
- Rövid koppintás: nem csinál semmit
- Hosszú nyomás (400ms): fok választó popup (kerek radio gombok 1..maxfok, aktív=zöld), érték választás azonnal bezárja
  - maxfok=1 esetén NEM ugrik fel popup (se felvételkor, se hosszú nyomásra)
- Felvételkor (dropdown): maxfok>1 → azonnal fok popup; többszörös → megfelelő picker popup
- ✕ törlés: mindig megerősítő dialógus (piros "Törlés" gomb)
- Escape: popup bezárás

### Viselkedés Game módban
- Koppintás: lenyílik inline accordion info panel:
  - Leírás (dőlt)
  - Hatás (aktuális fok hatás szövege)
  - Követelmény (ha van)
  - Kiterjeszti (normál + erős képzettség lista, zöld szín)

---

## 5. Misztikus fül/screen

- Tradíció képzettség (név + szint)
- Szféra / Arkánum képzettségek (név + szint lista)
- Metódus fortélyok (név + max + fok) (Game módban a "max" nem)
- Misztikus fortélyok (név + max + fok) (Game módban a "max" nem)
- Aura értékek

---

## 6. Leíró + Karma Hátterek fül/screen

- Leíró Hátterek: szabad szöveges lista
- Karma Hátterek: szabad szöveges lista (név + jellemzők/körülmények)

---

## 7. Szabályleírás: Harci taktikák fül/screen

- Harci taktikák listája (név)
- Koppintás: accordion-szerűen lenyílik a leírás (markdown renderelve)
- Read-only referencia oldal

---

## 8. Szabályleírás: Harci helyzetek fül/screen

- Harci helyzetek listája (név)
- Koppintás: accordion lenyílik a leírás
- Read-only referencia oldal

---

## 9. Szabályleírás: Manőverek fül/screen

- Manőverek listája (név)
- Koppintás: accordion lenyílik a leírás
- Read-only referencia oldal

---

## Tab bar

Alul fix, horizontálisan scrollozható szalag.

### Tab lista (sorrend)
| ID | Label | editOnly |
|----|-------|----------|
| aktiv | ❎ Aktív | false |
| harc | 🗡️ Harc | false |
| tulajdonsagok | 🔵 Tul/Képz | false |
| fortelyok | 🟣 Fortélyok | false |
| misztikus | ✨ Misztikus | false |
| harcertekek | 🛡️ Harcértékek | true |
| hatterek | 📜 Hátterek | false |
| taktikak | 🎯 Taktikák | false |
| helyzetek | 🎯 Helyzetek | false |
| manoverek | 🎯 Manőverek | false |

- `editOnly: true` → Game módban a tab eltűnik
- Default aktív tab induláskor: index 2 (`tulajdonsagok`)

### Stílus
- `flex-shrink: 0`, `white-space: nowrap`, `overflow-x: auto`, scrollbar rejtett
- Tab betűméret: 12px, padding: 8px 14px
- Inaktív szín: `--text-dim` (#999)
- Aktív tab: `--accent` szín (#e94560), bold
- Háttér: `--surface`, `border-top: 1px solid #333`, padding: 4px 0
- Egér scroll: `onWheel` → `scrollLeft += deltaY`

---

## Screen váltás animáció

- CSS transition: `transform 0.15s ease-out`
- Screen-ek horizontálisan egymás mellett (`display: flex`)
- Aktív screen: `translateX(-${activeTab * 100}%)`
- Csak szomszédos screen-ek renderelődnek: `Math.abs(i - activeTab) <= 1`
- Swipe gesztus: `onTouchStart`/`onTouchEnd` a `<main>` elemen
- **Swipe isolation**: `handleTouchStart` ellenőrzi `.closest('.kep-prompt-overlay')` → ha overlay nyitva, swipe letiltva
- **Kep-row védelem**: `onTouchStart/End stopPropagation` a kep-row elemeken (szerkesztő módban)
- **Screen slide padding**: 12px

---

## Popup overlay-ek (közös stílus)

- Overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; touch-action: none`
- Tartalom: `background: --surface; border: 1px solid #555; border-radius: 8px; padding: 16px; min-width: 250px; touch-action: auto`
- Gombok (`.kep-prompt-btns`): `background: --primary; border: 1px solid #555; border-radius: 4px; padding: 4px 12px; font-size: 13px`
- Törlés gomb (`.btn-del-confirm`): `background: --error; color: #fff`
- Input mezők: `background: --input-bg; border: 1px solid #555; border-radius: 4px; padding: 6px 10px; font-size: 14px`
- Slider (`<input type="range">`): `width: 100%; accent-color: --accent`
- Szint grid gombok (`.fort-fok-btn`): `36px × 36px; border-radius: 50%; border: 2px solid #555; font-size: 16px; font-weight: bold`
  - Aktív: `border-color: --success; background: --success; color: #000`
  - Törlő (`.fort-fok-del`): `border-color: --error; color: --error`
- Szint grid (képzettségek): `grid-template-columns: repeat(5, 36px); gap: 6px`
- Fok radios (fortélyok): `flex; gap: 8px; justify-content: center`
- Értékválasztás azonnal bezárja a popup-ot (nincs OK/Mégse, kivéve Tulajdonság/Szint/Kor slider ahol van)

---

## Adatfolyam

```
YAML források (data/konstansok.yaml, kepzettsegek/, fortelyok/, fajok/)
     ↓  generate_tables.py (automatikus: Vite buildStart + prebuild)
tables/*.json (runtime adat)
     ↓  fetchJson (data-loader.ts)
GameData (memória)
     ↓
React komponensek
```

### Runtime adatbetöltés (GameData)
Minden adat `tables/*.json`-ból, `fetchJson`-nel:
- `tables/konstansok.json` — központi konstansok
- `tables/fegyverek.json`, `tavfegyverek.json`, `pajzsok.json` — fegyver/pajzs adatok
- `tables/kepzettseg_kp.json` — KP költség tábla szintenként
- `tables/harcmodor_kepzettsegek_bonuszok.json` — harcmodor bónuszok szintenként
- `tables/kepzettsegek.json` — 39 képzettség definíció
- `tables/kiterjesztesek.json` — képzettség→fortély inverz mapping
- `tables/fajok.json` — 26 faj neve
- `tables/faj_tulajdonsag_keretek.json` — faj→tulajdonság min/max keretek
- `tables/primer_fortelyok.json` — 53 harci+misztikus fortély neve
- `tables/fortelyok.json` — 168 fortély összefoglaló (név, csoport, maxfok, leírás, fokok, kiterjesztések)

### Karakter state struktúra (App szintjén)
- `képzettségek: { név: string; szint: number }[]` — lifted state, KP kalkuláció inputja
- `fortélyok: { név: string; fok: number }[]` — lifted state, KP kalkuláció inputja (tartalmazza a többszörös példányokat is `"AlapNév - alnév"` formátumban)
- Inicializálás: `testKarakter8.fortélyok` + `fortélyok_kiemelt.kulturkörök` + `fortélyok_kiemelt.helyismeret` → egységes tömbbe
- A többi karakter adat egyelőre `testKarakter8`-ból jön (statikus)

A Tulajdonságok/Képzettségek/Fortélyok fülek **szerkesztő** jellegűek (a karakter adatait módosítják).
Az Aktív és Harc fülek **runtime** jellegűek (a harc közbeni állapotot kezelik).
A Szabályleírás fülek **read-only** referenciák.
