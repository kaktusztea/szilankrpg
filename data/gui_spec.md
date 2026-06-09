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
- **Double-tap**: 350ms threshold minden szerkesztő interakcióhoz (Tulajdonságok, Képzettségek, Fortélyok, Név, Szint, Kor)
- **Popup overlay-ek**: `createPortal(document.body)`, `.kep-prompt-overlay` osztály, `position: fixed; inset: 0; z-index: 100`
- **Escape**: minden popup overlay bezárható
- **Accordion/collapse**: elemek lenyithatók koppintásra (Game mód), másik koppintás becsukja
- **Szín kód**: sárga (`--warning`) = módosítható/köztes érték, zöld (`--success`) = teljes/számított, piros (`--error`/`--accent`) = hiba/limit túllépés/kiemelt

---

## App fejléc (header)

- `padding: 8px 12px`, háttér: `--primary`, `border-bottom: 1px solid #333`
- Bal: "Szilánk RPG" (`font-weight: bold, 16px`) — double-tap → verzió info sáv (5s, sárga, 14px bold)
- Jobb: gombok (`header-btns`, `gap: 6px`):
  - 🧪 Teszt: teszt karakter betöltés (megerősítő popup)
  - 📄 Új: üres karakter (megerősítő popup, `data/empty_karakter.json`)
  - 💾 Mentés: karakter JSON letöltés (`karakter.név.json`)
  - 📂 Betöltés: file picker + schema + referenciális validáció
  - 🔧/🎮 Mód toggle: háttér `#ff9800`/`#4caf50`, szöveg `#000`, 15px
  - Gombok stílusa: `background: --input-bg; border: 1px solid #555; border-radius: 4px; padding: 4px 8px; font-size: 16px`
- Megerősítő popup-ok: overlay, centered, label (bold) + dim szöveg + piros gomb
- Betöltési hiba popup: piros "Betöltési hiba" label + hibaüzenet + OK gomb

---

## Szerkesztő mód vs Game mód

| | Szerkesztő mód                          | Game mód                   |
|---|------------------------------------------|----------------------------|
| Tulajdonságok            | szerkeszthető | read-only                  |
| Képzettségek             | szerkeszthető (szint, felvétel) | read-only    |
| Fortélyok                | szerkeszthető (fok, felvétel)   | read-only    |
| Harcértékek              | szerkeszthető | **nem látszik** (editOnly) |
| Fegyverek, Páncél        | szerkeszthető | read-only                  |
| Hátterek                 | szerkeszthető | read-only                  |
| **Aktív fül**            | szerkeszthető | **szerkeszthető** ✅        |
| **ÉP / VÉ csökkenés**   | szerkeszthető | **szerkeszthető** ✅        |
| **Manőver Pont használat** | szerkeszthető | **szerkeszthető** ✅      |
| **Jegyzetek**            | szerkeszthető | **szerkeszthető** ✅        |
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
- **VÉ csökkenés box**: label `VÉ csökkenés` (bold, fehér, uppercase), érték negálva kijelezve (pl. -3, -5), alatta gombok: -1, -2, -3, +1, ⟲ (reset).
  - -1/-2/-3: VÉ csökkentés (disabled ha minden fegyver VÉ = 0 a táblázatban)
  - +1: VÉ visszaadás (disabled ha csökkenés = 0)
  - ⟲: reset (disabled ha 0, megerősítő popup: piros "VÉ Reset" gomb)
  - VÉ oszlop flash: sárga animáció csökkenéskor, zöld animáció +1-nél (1s fade-out)
  - Double-tap a label-re vagy értékre: VÉ csökkenés történet popup (pl. "-3; -2; +1"), mellé kopp bezárja
  - Dinamikusan csökkenti a Teljes harcértékek VÉ oszlopát (Math.max(0,...) clamp).
- **ÉP táblázat**:
  - **Fejléc sor** (4 oszlopos grid, S1-S4-hez igazítva):
    - S1 pozíció: `ÉP: X(Y)` — X=max ÉP, Y=megmaradt ÉP
    - S2 pozíció: `⟲ ÉP reset` gomb (centered, max-width 70%, disabled ha nincs seb, megerősítő popup: piros "ÉP Reset" gomb)
    - S3 pozíció: `⚔️ Seb` gomb (overlay popup)
    - S4 pozíció: `💚 Gyógy` gomb (overlay popup, disabled ha nincs seb)
  - 4 oszlop (S1-S4), mindegyikben ÉP/4 db rubrika
  - Oszlop footer: TÉ levonás értékek — **Fájdalomtűrés képzettség szint alapján enyhítve** (konstansok.fájdalomtűrés_enyhítés táblából)
    - Dupla kopp a TÉ footer-en → navigál a Tul/Képz fülre, scroll a Fájdalomtűrés képzettséghez (ha felvéve)
  - Az aktuális sebesülés-kategória TÉ levonás footere invertált színnel kiemelve (0 sebnél is: S1 aktív)
  - Rubrikák fentről lefelé töltődnek S1→S2→S3→S4 sorrendben
  - Kitöltött rubrikák: típus+sorszám jelölés (V1, Z2, FP3)
  - Szín: ÉP sebek pirosas-narancs árnyalatok (sorszámonként enyhén eltérő), FP sebek lila
  - FP utáni ÉP seb: fentről lefelé felülírja a meglévő FP rubrikákat, majd üres helyeket tölt
  - Gyógyulás utáni compaction: kitöltött rubrikák tömörítődnek felülre
  - Sorszám újrahasználat: ha egy seb összes rubrikája begyógyult, a száma felszabadul
  - TÉ levonás dinamikusan vonódik le a Teljes harcértékek TÉ oszlopából (sebesülés kategória alapján)
  - **⚔️ Sebesülés overlay popup**:
    - Típus gombok: S, V, Z, FP (kerek, aktív=zöld) — kezdetben egyik sincs kiválasztva
    - Érték gombok: 1-15 (alapból látható, 5 oszlop grid) + ▾ lenyitó → 16-40 (rejtett)
    - Mindkettő kiválasztva → azonnal bezárul és érvényre lép. Nincs OK/Mégse.
  - **💚 Gyógyulás overlay popup**:
    - Típus gombok: ÉP, FP (kerek, aktív=zöld, disabled ha az adott típusból nincs seb)
    - Ha csak egy típusú seb van → auto-select (nem kell választani)
    - Típus után: érték gombok (1..max, 5 oszlop grid)
    - Mindkettő kiválasztva → azonnal bezárul. Nincs OK/Mégse.
  - Mellé koppintás (overlay háttér) = cancel mindkét popup-nál
- **Manőver Pont**: Manőver Alap + aktuális/max MP + gombok (+1, -1). Default: max.

---

## 3. Tulajdonságok + Képzettségek fül/screen

### Fejléc (legfelül)
- **Név + Szint** sor: két összeérő box
  - Név box (flex:1): `Név: Dorek a Toroni` — double-tap → szerkesztő popup (max 40 karakter)
  - Szint box: `Szint: 8` — double-tap → gombgrid popup (3-21, 5 oszlop flexbox, utolsó sor középre)
- **Faj + Kor** sor (CSAK szerkesztő módban):
  - Faj box (flex:1): inline `<select>` dropdown (26 faj a tables/fajok.json-ból, közvetlenül koppintható)
  - Kor box: `Kor: 32` — double-tap → két lépéses popup (tartomány: 10–100/100–200/200–1000, majd érték gombok: 2/5/50-es lépésekkel)
- **Game módban**: Faj és Kor eltűnik, a Név kiírásban jelenik meg: `"Dorek a Toroni (Ember (Északi), 32)"`
- **Játékos box** (CSAK szerkesztő módban): `Játékos: Attila` — double-tap → szerkesztő popup (max 40 kar)
  - Mentés fájlnévben: `karakternév_játékosnév_Xtsz.json` (ha ki van töltve)

### Tulajdonságok
- Tulajdonság pontok kijelzés (szerkesztő mód): `Tulajdonság pontok: X/Y` (piros ha túllépés)
- 8 tulajdonság fix 2 oszlop × 4 sor grid-ben (fentről lefelé, aztán következő oszlop)
- Megjelenítés: teljes név + érték egymás mellett, pl. `Erő: 3`
- Nem reszponzív, fix layout
- Szerkesztő módban: double-tap (350ms) → popup overlay gomb-grid (-5..+7), érték választás azonnal bezárja
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
- Double-tap (350ms): szint választó popup (gombok 1-15 grid, 5×3 elrendezés, aktív=zöld), érték választás azonnal bezárja
- Escape: popup bezárás

#### Viselkedés Game módban
- Koppintás: lenyílik accordion adatlap:
  - **Próba**: dobható / nem dobható / ellenpróba
  - **Domináns tulajdonságok**: pl. "Ügyesség, Gyorsaság"
  - **Kiterjeszti**: fortélyok listája (normál/erős jelzéssel)

### KP sáv (Szerkesztő módban, minden fülön)
- Fix sáv a tab-bar felett, két szekció (bal/jobb, független háttérszín)
- Bal: `Maradt KP: X` — zöld háttér (normál), piros ha X < 0
- Jobb: `Primer keret: Y` — zöld háttér (normál), piros ha Y < 0 (primer túllépés)
- Primer keret = primer_limit - primer_költés
- Primer költés = primer képzettségek KP + primer fortélyok KP + kp_hm + kp_cm
- Primer limit = összes_kp + spec_kp
- Dinamikusan frissül minden módosításnál
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
- Double-tap (350ms): fok választó popup (kerek radio gombok 1..maxfok, aktív=zöld), érték választás azonnal bezárja
  - maxfok=1 esetén NEM ugrik fel popup (se felvételkor, se double-tap-re) — ehelyett "1 fok a maximum" hint (2s)
  - Mesterfegyver (locked): double-tap → "Mesterfegyver fortélyokat a Harcértékek fülön kezeld!" hint (3s)
- Felvételkor (dropdown): maxfok>1 → azonnal fok popup; többszörös → megfelelő picker popup
- Mesterfegyver NEM jelenik meg a harci fortély dropdown-ban
- Mesterfegyver bejegyzések: locked (nem szerkeszthető, nem törölhető), lista tetején, szinkronizálva fegyver példányokból
- ✕ törlés: mindig megerősítő dialógus (piros "Törlés" gomb) — locked elemeknél nincs ✕
- Escape: popup bezárás

### Viselkedés Game módban
- Koppintás: lenyílik inline accordion info panel:
  - Leírás (dőlt)
  - Hatás (aktuális fok hatás szövege)
  - Követelmény (ha van)
  - Kiterjeszti (normál + erős képzettség lista, zöld szín)

---

## 4b. Harcértékek fül/screen (editOnly: true — Game módban nem látszik)

HM/CM vásárlás, fegyver és páncél konfiguráció. Csak Szerkesztő módban elérhető.

### HM / CM szekció
- HM TÉ, HM VÉ: +/- gombok + érték
- CM: +/- gombok + érték
- Validáció: HM összeg ≤ max_HM, aszimmetria ≤ max_HM_aszimmetria, CM ≤ max_CM
- Info sor: `HM: X/Y  Aszimmetria: X/Y  CM: X/Y`
- Piros szín ha túllépés

### Harcmodorok (read-only)
- Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc szintek
- A Tul/Képz fülről szinkronizálva

### Fegyverek
- Fegyver példány kártyák listája
- Fejléc: fegyver neve (MK fegyvereknél suffix nélkül, `Alapnév` mezőből) + ✕ törlés
- Mezők (`he-field-btn` stílus, dupla katt → overlay popup):
  - MF fok: kerek gombok 0-3
  - Idea: 3 soros popup (-5..-1 / 0 / +1..+5)
  - Anyag: 1 oszlopos popup (acél, bronz, abbitacél, mithrill, lunír)
- \+ Új fegyver dropdown: kategóriánként csoportosítva (MK 2K variáns kiszűrve)
- MK (másfélkezes) fegyverek: 1 kártya a Harcértékek fülön, 2 sor a Harc fülön (1K + 2K)
- Mesterfegyver szinkron: MF fok módosítás → `syncMfFortelyok` frissíti a fortélyok tömböt

### Páncél
- Mezők (`he-field-btn` stílus, dupla katt → overlay popup):
  - Struktúra: lista (konstansok.páncél_struktúrák) + "— nincs —"
  - Fémalapanyag: csak fém struktúránál látszik
  - Kidolgozottság: pocsék / átlagos / mestermunka
  - Méret: passzol / nem passzol / borzalmas
  - Sisak: toggle (dupla katt negálja, igen/nem)
  - Végtagvédettség: kerek gombok 0-4
  - Idea: 3 soros popup (-4..-1 / 0 / +1..+4)
  - Rongálódás: kerek gombok 0-5

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

## 6b. Jegyzetek fül/screen

- Teljes képernyős `<textarea>` — szabad szöveges jegyzetmező
- Mindkét módban (szerkesztő + game) elérhető és szerkeszthető
- Tartalom a karakter fájlba mentődik (`jegyzetek` mező)
- Placeholder: "Szabad jegyzetek..."

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
| harcertekek | 🛡️ Harcértékek | true |
| misztikus | ✨ Misztikus | false |
| hatterek | 📜 Hátterek | false |
| jegyzetek | 📝 Jegyzetek | false |
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
- Értékválasztás azonnal bezárja a popup-ot (nincs OK/Mégse gomb)

---

## Adatfolyam

```
YAML források (data/konstansok.yaml, kepzettsegek/, fortelyok/, fajok/)
     ↓  generate_tables.py (automatikus: Vite buildStart + prebuild)
tables/*.json (runtime adat)
     ↓  fetchJson (data-loader.ts)
GameData (memória) + rules.json
     ↓
Reactive Engine (evaluate) → computed values
     ↓
React komponensek
```

### Reactive Engine (`data/rules.json` + `engine/reactive.ts`)
Deklaratív számítási szabályok dependency graph-ban:
- **Skaláris képletek**: `+`, `-`, `*`, `/`, `floor()`, `ceil()`, `min()`, `max()`, `abs()`
- **Aggregáló függvények**: `sum(tömb, mező)`, `sum_lookup(tömb, mező, tábla, kulcs, érték)`, `sum_where(tömb, összegMező, szűrőMező, szűrőÉrték)`, `count(tömb)`
- **Lookup**: `lookup(tömb, kulcsMező, kulcsÉrték, értékMező)`
- **Feltételes**: `if(feltétel, then, else)` — ternary kifejezés
- **Topológiai sorrend**: automatikus dependency resolution (inputs mező alapján)
- **Context**: `buildContext()` — skaláris értékek (tulajdonságok, tsz, konstansok, HM, CM, páncél inputok, stb.)
- **ArrayContext**: `buildArrayContext()` — tömbök (képzettségek, fortélyok, kp_tábla, harci_fortélyok, csatolt_mgt táblák)
- **StringContext**: string-keyed lookup-okhoz (pl. páncél_kidolgozottság → csatolt_mgt tábla kulcs)

#### Jelenlegi rules.json szabályok (53 db):
| ID | Formula típus | Leírás |
|----|--------------|--------|
| ÉP | képlet | 28 + edzettség × 4 |
| S1_max, S2_max, S3_max | képlet | ÉP/4, ÉP/2, ÉP×3/4 |
| KÉ | képlet | alap + gyorsaság + intelligencia + tsz + fortélyMod |
| TÉ_alap | képlet | alap + erő + ügyesség + gyorsaság + HM_TÉ |
| VÉ_alap | képlet | alap + gyorsaság + ügyesség + HM_VÉ |
| CÉ_alap | képlet | alap + önuralom + CM |
| összes_kp | képlet | tsz × (perszint + intelligencia) |
| összes_szekunder_kp | képlet | tsz × (szekunder_perszint + emlékezet) |
| tulajdonság_pont_keret | képlet | alap + floor(tsz/2) |
| manőver_pont | képlet | ceil(harcmodor_összeg × 2 / tsz) |
| felszerelés_keret | képlet | 2 + erő |
| felszerelés_mgt | képlet | max(0, terhelés - keret) |
| max_CM | képlet | tsz × max_cm_perszint |
| max_HM | sum_where | harci fortélyok (MF nélkül) + harcmodorok + alakzatharc |
| max_HM_aszimmetria | képlet | floor(tsz / 2) |
| kp_képzettségek | sum_lookup | képzettség szintek → KP tábla lookup → összeg |
| kp_fortélyok | sum | fortély fokok összege × fortélyfok konstans |
| kp_hm | képlet | (HM_TÉ + HM_VÉ) × kp.hm |
| kp_cm | képlet | CM × kp.cm |
| elköltött_kp | képlet | kp_képzettségek + kp_fortélyok + kp_hm + kp_cm + kiemelt_kp |
| maradék_kp | képlet | összes_kp + spec_kp + összes_szekunder_kp - elköltött_kp |
| sfé_fizikai | képlet | struktúra + alapanyag + idea - rongálódás |
| sfé_energia | képlet | struktúra + alapanyag + idea - rongálódás |
| páncél_MGT | képlet | max(0, struktúra_mgt + alapanyag_mgt + csatolt_mgt + méret_mgt - erő) |
| merevvért_TÉ_büntetés | if | if(merev, max(0, MGT - csökkentés), 0) |
| távharc_cella | képlet | ceil(távolság / osztó) |
| távharc_cél_VÉ | képlet | max(szorzó,1)×cella + min(szorzó,0) |
| képzettség_max_szint_primer | képlet | min(max_szint, tsz) |
| képzettség_max_szint_szekunder | képlet | min(max_szint, tsz + plusz) |
| fegyver_TÉ | képlet | alap + erő + ügy + gyor + HM + harcmodor + fegyver + MF + fortély |
| fegyver_VÉ | képlet | alap + gyor + ügy + HM + harcmodor + fegyver + MF + fortély |
| fegyver_SP | képlet | fegyver + min(erő, limit) + MF + fortély |
| fegyver_harckeret | képlet | max(0, harcmodor + gyor - MGT - felszMGT + fortély) |
| fegyver_támadások | képlet | 1 + floor(harckeret / sebesség) |
| spec_kp | sum + képlet | KP bónusz fortélyok (negatív kp_perfok) + tartós_sérülés |
| kiemelt_kp | sum | ingyenes keret feletti kiemelt fortélyok KP-ja |
| kp_primer_képzettségek | sum_lookup | primer képzettség szintek → KP tábla |
| kp_primer_fortélyok | sum | primer fortélyok fok × kp_perfok |
| primer_költés | képlet | kp_primer_képzettségek + kp_primer_fortélyok + kp_hm + kp_cm |
| primer_keret | képlet | összes_kp + spec_kp - primer_költés |
| páncél_struktúra_mgt | lookup | struktúrák tábla → mgt |
| páncél_struktúra_sfé_* | lookup | struktúrák tábla → sfé_fizikai/energia |
| páncél_merev, páncél_fém | lookup | struktúrák tábla → merev/fém flag |
| páncél_alapanyag_* | lookup | fémalapanyagok tábla → mgt/sfé_bónusz |
| páncél_méret_mgt | lookup | méret tábla → érték |
| merevvért_csökkentés | lookup | merevvért_tábla → csökkentés |
| páncél_csatolt_db | képlet | végtagvédettség + sisak |
| páncél_lefedettség | if | if(van, 50 + végtag×10 + sisak×10, 0) |

#### TS-ben maradó logika (nem deklaratív):
- Fortély módosítók összegyűjtése (feltételes iteráció — egyelőre hardcoded 0, TODO §16)
- Fájdalomtűrés enyhítés (küszöb-tábla lookup)

### Runtime adatbetöltés (GameData)
Minden adat `fetchJson`-nel:
- `tables/konstansok.json` — központi konstansok
- `tables/fegyverek.json` — fegyver adatok (MK_pár, Alapnév mezőkkel)
- `tables/tavfegyverek.json`, `tables/pajzsok.json` — távfegyver/pajzs adatok
- `tables/kepzettseg_kp.json` — KP költség tábla szintenként
- `tables/harcmodor_kepzettsegek_bonuszok.json` — harcmodor bónuszok szintenként
- `tables/kepzettsegek.json` — 39 képzettség definíció
- `tables/kiterjesztesek.json` — képzettség→fortély inverz mapping
- `tables/fajok.json` — 26 faj neve
- `tables/faj_tulajdonsag_keretek.json` — faj→tulajdonság min/max keretek
- `tables/primer_fortelyok.json` — 53 harci+misztikus fortély neve
- `tables/fortelyok.json` — 168 fortély összefoglaló
- `data/rules.json` — reactive engine szabályok (53 db)
- `data/empty_karakter.json` — üres karakter template (induláskor betöltődik, validálva)

### Karakter state struktúra (App szintjén)
- `karakter: Karakter | null` — egyetlen unified state objektum (schema v2)
- Convenience setterek: `setTulajdonságok`, `setKépzettségek`, `setFortélyok`, `setSession` (useCallback, partial update)
- Derived getterek (early return utáni destructuring): `tulajdonságok`, `képzettségek`, `fortélyok`, `session`
- Inicializálás: `data.emptyKarakter` betöltéskor (validated)
- Mentés/betöltés: teljes `karakter` objektum JSON-ként (session-nel együtt)
- Név/TSz/Kor/Faj: lifted props → TulajdonsagokScreen

A Tulajdonságok/Képzettségek/Fortélyok/Harcértékek fülek **szerkesztő** jellegűek.
Az Aktív és Harc fülek **runtime** jellegűek (a harc közbeni állapotot kezelik).
A Jegyzetek fül mindkét módban írható.
A Szabályleírás fülek **read-only** referenciák.
