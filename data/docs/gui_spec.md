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

### Egyedi színek (nem CSS változók)
| Szín | Kód | Használat |
|------|-----|-----------|
| Narancssárga | `#e0a050` | Kategória fejlécek (Manőver picker, Státusz picker, Karma hátterek) |
| Lila | `#ce93d8` | Fortély nevek (Fortély bónusz pool) |
| Halvány kék | `#90caf9` | Taktika nevek (Hatás pool) |
| Sötétebb kék | `#42a5f5` | Harci helyzet nevek (Hatás pool) |
| Arany | `#ffd54f` | Körülmény csoport fejléc (picker) |
| Világoskék | `#7eb8da` | Háttér alkategória labelek (Származás, Jellem, stb.) |
| Sötét box háttér | `#1a1a2e` | Hatás pool box háttér |
| Kártya háttér | `#2a2a3e` | Hatás pool item, hatter-tag |
| Elválasztó | `#444` | Szekció vonalak, picker keret |
| Elválasztó (belső) | `#333` | Szekció border-bottom |

## KP sáv színek
- Normál háttér: `#2e7d32`
- Negatív háttér: `#c62828`

---

## Általános elvek

- **Mobile-first**: 320px szélességtől használható
- **Két mód**: Szerkesztő mód és Game mód (toggle gomb a fejlécben)
  - Toggle gomb szín: Szerkesztő=`#ff9800`, Game=`#4caf50` (háttér), szöveg: `#000`, átmenet: 1000ms ease
- **Tab navigáció**: alul fix tab bar, horizontálisan scrollozható (minden tab közvetlenül elérhető, nincs "..." menü)
- **Screen váltás**: jobb-bal swipe gesztussal (mobilon, threshold: 30px), desktop-on tab kattintás
- **Swipe**: csak horizontális, `Math.abs(dx) > Math.abs(dy)` check
- **Double-tap**: 350ms threshold minden szerkesztő interakcióhoz (Tulajdonságok, Képzettségek, Fortélyok, Név, Szint, Kor)
- **Popup overlay-ek**: `createPortal(document.body)`, `.kep-prompt-overlay` osztály, `position: fixed; inset: 0; z-index: 100`
- **Escape**: minden popup overlay bezárható
- **Overlay bezárás**: mellé kattintás (background click) — nincs ✕ gomb
- **Accordion/collapse**: elemek lenyithatók koppintásra (Game mód), másik koppintás becsukja
- **Szín kód**: sárga (`--warning`) = módosítható/köztes érték, zöld (`--success`) = teljes/számított, piros (`--error`/`--accent`) = hiba/limit túllépés/kiemelt

---

## App fejléc (header)

- `padding: 8px 12px`, háttér: `--primary`, `border-bottom: 1px solid #333`
- Bal: "Szilánk RPG" (`font-weight: bold, 16px, white-space: nowrap`) — double-tap → verzió info sáv (5s, sárga, 14px bold)
- Bal mellette: Szilánk pont box (keretes, zöld szám, kattintás → értékválasztó popup 0/1/2/3)
- Jobb: gombok (`header-btns`, `gap: 6px`, `flex-shrink: 0`, `margin-left: auto`):
  - 📅 Napló overlay gomb (mindkét mód)
  - ✏️ Jegyzetek overlay gomb (mindkét mód)
  - ⚙️ Menü gomb (20% szélesebb padding): overlay popup (↩ Visszavonás / 📂 Karakterek / 📋 Duplikál / 💾 Mentés / 📄 Új karakter / Teljes képernyő)
  - 🔧/🎮 Mód toggle: háttér `#ff9800`/`#4caf50`, szöveg `#000`, 15px, `white-space: nowrap`, 1000ms fade
- ⚙️ menü popup: `.menu-item` gombok (centered szöveg, `padding: 10px 16px`)
  - Teljes képernyő: desktop → requestFullscreen/exitFullscreen; mobil → hint popup (iOS/Android specifikus szöveg)
- Megerősítő popup-ok (Új karakter): overlay, centered, label (bold) + dim szöveg + piros gomb
- Betöltési hiba popup: piros "Betöltési hiba" label + hibaüzenet + OK gomb

### Undo overlay
- Felugró popup: "Visszavonás" cím
- Lista: legutóbbi felül, legrégebbi alul (max 6)
- Kiválasztás: kattintás → a kiválasztott + felette lévők piros háttérrel kiemelve
- "Visszaállítás (N művelet)" gomb: piros, csak kiválasztás után aktív
- Overlay mellé kattintás: bezár
- Jegyzetek és Napló NEM vonódik vissza (mindig friss marad)

### Local Storage (multi-slot)
- `szilank_slots`: slot lista (max 10, uid + név + tsz + mentés_dátum)
- `szilank_char_{uid}`: per-karakter JSON (session + `_undo` integrálva)
- `szilank_active`: aktív karakter uid
- Autosave: minden karakter/undo változáskor, ha `isDirty=true` és nem testMode
- "Új karakter": isDirty=false → nem mentődik amíg módosítás nem történik
- "Duplikál": deep clone, új uid, név " v2" suffix (ismétlésnél v3, v4...), Karakterek ablak megnyílik
- Mentés overlay: "Aktuális karakter" / "Összes (backup)" → "Megosztás" / "Helyi mentés"
- Karakterek overlay: slot lista `{név} ({tsz}sz)` + relatív idő + ✕ törlés + 🧪 Teszt + 📁 Fájlból. Név max 15 karakter (utána `..`), verzió suffix (v2) megtartva.

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

### Viselkedés
- **Toggle gomb** a fejlécben (pl. 🔧/🎮 ikon): váltás a két mód között
- **Game módban**: a szerkesztő kontrollok (input mezők, szint-állítók, felvétel gombok) eltűnnek — csak az értékek látszanak
- **Game módban elérhető**: Aktív fül teljes egészében, VÉ csökkenés +/- gombok, ÉP jelölés, Manőver Pont felhasználás

---

## 1. Aktív fül/screen

A harc közbeni helyzetek, körülmények, taktikák beállítása. Minden itt kiválasztott elem befolyásolja a "Harc" fülön megjelenő értékeket.
Mindkét módban (szerkesztő + game) elérhető és szerkeszthető.

### Tartalom (fentről lefelé)

| Elem | Típus | Leírás |
|------|-------|--------|
| Fegyver (Ügyesebb kéz) | field-btn dropdown | Karakter fegyver-példányai + "Puszta kéz". Mindig látható. |
| Fegyver (Gyengébb kéz) | field-btn dropdown | Csak ha Fegyverfogás ≠ Egyfegyveres. Kétkezesnél: fegyverek (pengelimit szűrt, hárítók kiszűrve). Hárítónál: hárítófegyverek. Pajzsnál: disabled "Pajzs". |
| Session toggle fortélyok | field-btn toggle(k) | Generikus: yaml `session_toggle: true` → gomb. Disabled ha nincs fortély. Pl. "H. akrobatika" |
| Fegyverfogás | field-btn → overlay picker | Egyfegyveres / Fegyver+pajzs / Fegyver+hárító / Kétkezes harc. Kiváltja a korábbi "2 kezes harc" és "Pajzs kézben" toggle-öket. |
| Páncél viselve | field-btn toggle | Hatással a Harc fül SFÉ-re |
| Hatás pool box | info szekció | 7 alszekció: Taktikák, Harci helyzetek, Státuszok, Manőver bónuszok, Előny/Hátrány, Fortély bónuszok, Narratív módosítók |
| Taktikák | overlay picker + chip | ABC, fokozatos: 📶, két lépéses fokválasztó, chip katt → fok módosítás. Chip: kétsoros (név+fok bold, módosítók szürkén) |
| Manőver | aktiv-label fejléc + field-btn + overlay picker | Általános/Belharci kategóriák, infó a box-ban (Nehézség+fázisok sor, hatás sor) |
| Harci helyzetek | overlay picker + chip | 4 csoportra bontva: Pozitív (zöld `#4caf50`), Semleges (narancs `#ff9800`), Negatív (piros `#f44336`), Körülmény (arany `#ffd54f`) fejléccel. Csoporton belül ABC. Rejtett elemek (yaml `rejtett: true`) nem jelennek meg. Kizárás: yaml `kizár_helyzetek` (id alapú) szűri a pickert + hozzáadáskor eltávolít. Yaml `tiltja_taktikákat: true` → taktika picker disabled + meglévők törlődnek. |
| Státuszok | overlay picker + chip | Fizikai/Szellemi/Mágikus kategóriák, két lépéses fokválasztó, chip katt → fok ciklikus. Többszörös státuszok (yaml `többszörös: true`): alkategória almenü → fok. |
| Narratív módosítók | "+ Új" gomb → overlay popup | Popup: Hátrány-2/-1, Előny+1/+2 gombok (kötelező) + szöveg input + OK. Enter = OK. |

### Taktika kombó szabályok
- Picker csak a kompatibilis taktikákat kínálja (whitelist/blacklist + megkötések szűrés)
- Megkötések: `harci_helyzet/tiltott`, `harcmodor/tiltott`, `támadások/min`
- Fokozatos taktikáknál két lépéses picker (taktika → fok)
- Chip kattintás fokozatos taktikánál: fokválasztó picker újra felugrik

### Hatás pool szekciók
1. **Taktikák**: per-taktika sorok. Név halvány kék (`#90caf9`), módosítók zöld (`#66bb6a`) + ✔ jel a végén (beszámított), megjegyzés fehér. Formátum: `Név (fok): TÉ: +X, VÉ: -Y ✔ • megjegyzés`
2. **Harci helyzetek**: per-helyzet sorok. Név sötétebb kék (`#42a5f5`), utána az `infó` mező szövege (fehér). Ha van 0.fok alapeset aminek feltétele ez a helyzet: " Alapeset: {hatástext}" hozzáfűzve. Ha van fortély aminek feltétele `harci_helyzet:{id}` → alatta indentálva: `→ Fortély (fok): hatástext ✔` (zöld ha aktív, szürke ha nem).
3. **Státuszok**: per-elem megjelenítés (nem aggregált). Taktika hatás: név kék (`#90caf9`), alatta soronként fehér hatás sorok. Státusz hatás: `Név (fok) alcím` gesztenye/bordó (`#cd7c6f`), félkövér, alatta soronként fehér hatás sorok. Szöveges operátor: csak `megjegyzés` szöveg (cél nem jelenik meg).
4. **Manőver bónuszok**: fortélyok `manőver:X` célú módosítói (id→név lookup, pl. "Precíz támadás: +4 (Harci anatómia)")
5. **Előny / Hátrány**: fortélyok `előny`/`hátrány` módú módosítói (feltételes). Formátum: `Előny+X: Cél (Fortély)` (pl. "Előny+2: Sebzésdobás (Orgyilkos)")
6. **Fortély bónuszok**: harci fortélyok narratív hatásszövegei (yaml `emlékeztető: true` flag alapján). Fortély név lila (`#ce93d8`).
7. **Alapesetek**: fortélyok 0.fokának hatástextjei (`<details>` accordion, alapból becsukva). Fejléc: "Alapesetek (N) ▾" szürke. Elemek: fortély név bold fehér + hatástext fehér. Csak feltétel teljesülésekor aktív.
8. **Narratív módosítók**: KM által hozzáadott szöveges + opcionális Előny/Hátrány

### Stílus
- `.aktiv-field-btn`: keretezett label+érték (he-field-btn stílus)
- `.aktiv-hatas-pool`: sötét háttér, keretes box, szekciók elválasztó vonallal
- `.hatas-pool-item .fortely-nev`: lila (#ce93d8)
- `.taktika-chip-name`: halvány kék (`#90caf9`)
- Overlay picker: `.aktiv-picker` (görgethető, 80vh max), `.aktiv-picker-item` kártyák
- `.manover-category-label`: narancssárga kategória fejléc

### Viselkedés
- Minden módosítás azonnal frissíti a session-t → Harc fül értékei reagálnak

### Fegyverfogás választó

A Fegyverfogás (Egyfegyveres / Fegyver+pajzs / Fegyver+hárító / Kétkezes harc) dedikált választó az Aktív fülön.

**GUI terv:**
- **Fegyverfogás field-btn**: kattintásra overlay popup nyílik (szokásos `.kep-prompt-overlay` + `.aktiv-picker` stílus)
- **Popup tartalma**: egymás alatt a választható opciók (`.manover-card` stílus):
  - Egyfegyveres (alap)
  - Fegyver + pajzs (csak ha van pajzs a karakteren)
  - Fegyver + hárítófegyver (csak ha van hárítófegyver + fortély)
  - Kétkezes harc (csak ha mindkét kézben fegyver ÉS összpenge ≤ limit)
- **Választás**: kattintás az opcióra → bezáródik, session frissül
- **Aktuális megjelenítés**: a field-btn label mutatja az aktív fogást (pl. "Fegyverfogás: Kétkezes harc")
- **Kiváltja**: a "2 kezes harc" és "Pajzs kézben" toggle gombok eltűnnek (beleolvadnak a Fegyverfogás választóba)

**Session hatás:**
- Egyfegyveres → `kétkezes_harc: false`, `aktív_pajzs: false`, Gyengébb kéz dropdown eltűnik
- Fegyver + pajzs → `aktív_pajzs: true`, `kétkezes_harc: false`, Gyengébb kéz: disabled "Pajzs"
- Fegyver + hárító → `aktív_pajzs: false`, `kétkezes_harc: false`, Gyengébb kéz: hárítófegyver választó (auto-select ha 1 db)
- Kétkezes harc → `kétkezes_harc: true`, `aktív_pajzs: false`, Gyengébb kéz: fegyver választó (pengelimit szűrt, hárítók kiszűrve)

**Inkompatibilitás (inaktív + szürke a popup-ban, nem elrejtve):**
- Puszta kéz jobb kézben → Fegyverfogás választó disabled + szürke, fix "Egyfegyveres"
- Kétkezes fegyver jobb kézben → csak "Egyfegyveres" aktív, többi szürke
- Nincs pajzs a karakteren → "Fegyver + pajzs" szürke, disabled
- Nincs hárítófegyver / nincs fortély → "Fegyver + hárítófegyver" szürke, disabled + hint szöveg alatta
- Összpenge > limit vagy nincs nem-hárító fegyver bal kézhez → "Kétkezes harc" szürke, disabled

---

## 2. Harc fül/screen

A karakter aktuális harci értékei, az "Aktív" fül beállításai alapján számítva.

### Tartalom

- **Felső box-sor** (egy sorban, egymás mellett, gap: 8px; mobilon ≤480px: 2x2 grid):
  - **KÉ box**: label `KÉ` (14px, bold, fehér, uppercase), érték (28px, bold, fehér)
  - **SFÉ box** (balra rendezve): fejléc label `SFÉ (X%)` (14px, bold, fehér, uppercase), alatta `Fizikai: X` és `Energia: X` egymás alatt (14px, érték: 16px bold)
  - **VÉ csökk. box**: label (14px, bold, fehér, uppercase), érték (24px, bold, warning/sárga szín), alatta gombok: +1, +2, +3, -1, ⟲ (12px, 4px gap). Dinamikusan csökkenti a Teljes harcértékek VÉ oszlopát.
  - **MP box**: label `MP` (14px, bold, fehér, uppercase), érték `X/Y` (20px, bold, success/zöld szín), alatta gombok: -1, ⟲ (12px). Default: max.
  - Minden box: háttér surface szín, 1px solid #444 border, 6px border-radius, 8px 12px padding
- **Teljes harcértékek** tábla (fegyverenként):
  - Fegyver | Tám/kör | TÉ | VÉ | SP | Pengehossz
  - Fegyverfogás ≠ Egyfegyveres: összesítő sor felül (lila/purple keret `#9c27b0`), normál sorok halványítva (opacity: 0.4)
    - Kétkezes: összevont harcértékek (§26)
    - Fegyver+pajzs: jobb kéz fegyver + pajzsVÉ bónusz + TÉ büntetés (Pajzshasználat fok-függő), név: "Fegyver + Pajzs". Csak a lila sorban (normálból kiszűrve).
    - Fegyver+hárító: jobb kéz fegyver + hárítóVÉ bónusz, név: "Fegyver + Hárító: X"
  - Egyfegyveres: csak az Ügyesebb kézben kiválasztott fegyver sora normál, többi halványítva (opacity: 0.4)
  - Tám cella kattintható (Game mód): info overlay popup (fegyver név, Sebesség, Harckeret). Bezárás: mellé katt / Escape.
  - TÉ label: accent/piros szín (azonos az ÉP TÉ levonás színével)
  - VÉ label: warning/sárga szín (azonos a VÉ csökkenés box színével)
  - TÉ értékek: dinamikusan csökkennek sebesülés kategória TÉ levonással
  - VÉ értékek: dinamikusan csökkennek VÉ csökkenés értékkel
- **VÉ csökkenés box**: label `VÉ csökkenés` (bold, fehér, uppercase), érték negálva kijelezve (pl. -3, -5), alatta gombok: -1, -2, -3, +1, ⟲ (reset).
  - -1/-2/-3: VÉ csökkentés (disabled ha minden fegyver VÉ = 0 a táblázatban)
  - +1: VÉ visszaadás (disabled ha csökkenés = 0)
  - ⟲: reset (disabled ha 0, megerősítő popup: piros "VÉ Reset" gomb)
  - VÉ oszlop flash: sárga animáció csökkenéskor, zöld animáció +1-nél (1s fade-out)
  - Koppintás a label-re vagy értékre: VÉ csökkenés történet popup (pl. "-3; -2; +1"), mellé kopp bezárja

### Formázás
- Fegyver táblázat számok (nem első oszlop): `font-family: monospace`
- VÉ csökkentés gombok: `font-family: monospace`
- SFÉ értékek (`<strong>`): `font-family: monospace`
- SFÉ lefedettség %: `font-family: monospace`
- ÉP számok: `font-family: monospace`
- Backtick formázás (`\`text\``): `<code>` elem, monospace, háttér `#333`, padding `0 3px`, border-radius `2px` — minden hatástext és infó megjelenítésnél (Aktív fül, Fortélyok fül)
  - Dinamikusan csökkenti a Teljes harcértékek VÉ oszlopát (Math.max(0,...) clamp).
- **ÉP táblázat**:
  - **Fejléc sor** (4 oszlopos grid, S1-S4-hez igazítva):
    - S1 pozíció: `ÉP: X(Y)` — X=max ÉP, Y=megmaradt ÉP
    - S2 pozíció: `⟲ ÉP reset` gomb (centered, max-width 70%, disabled ha nincs seb, megerősítő popup: piros "ÉP Reset" gomb)
    - S3 pozíció: `⚔️ Seb` gomb (overlay popup, disabled ha minden rubrika ÉP sebekkel betelt)
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

## 2b. Távharc fül/screen

Távharc kalkulátor. A célpont Védő Értékét számítja a §17 engine spec alapján.

### Terv
- Távharc VÉ kalkulátor (távolság, szorzók, cella)
- Érintett fortélyok:
  - Mozgó cél mestere
  - Mágikus lövedék gyorsítása

---

## 3. Tulajdonságok + Képzettségek fül/screen

### Fejléc (legfelül)
- **Név + Szint** sor: két összeérő box
  - Név box (flex:1): `Név: von Agabor` — tap → szerkesztő popup (max 40 karakter)
  - Szint box: `Szint: 8` — tap → gombgrid popup (3-21, 5 oszlop flexbox, utolsó sor középre)
- **Faj + Kor** sor (CSAK szerkesztő módban):
  - Faj box (flex:1): inline `<select>` dropdown (27 faj a tables/fajok.json-ból, közvetlenül koppintható)
  - Kor box: `Kor: 32` — tap → +/− overlay (long press gyorsítás: 200ms→30ms, 7s után ×10 lépés, 1–2000)
- **Game módban**: Faj és Kor eltűnik, a Név kiírásban jelenik meg: `"von Agabor (Ember (Északi), 32)"`
- **Anyanyelv** (CSAK szerkesztő módban): inline `<select>` dropdown (`tables/nyelvek.json`-ból)
  - Módosítás → szinkronizálja kiérdemelt Nyelvismeret fortélyokat (Közös Alap + anyanyelv Alap, `kiérdemelt: true`)
- **Játékos box** (CSAK szerkesztő módban): `Játékos: Attila` — double-tap → szerkesztő popup (max 40 kar)
  - Mentés fájlnévben: `karakternév_játékosnév_Xtsz.json` (ha ki van töltve)

### Tulajdonságok
- Tulajdonság pontok kijelzés (szerkesztő mód): `Tulajdonság pontok: X/Y` (piros ha túllépés)
- 8 tulajdonság fix 2 oszlop x 4 sor grid-ben (fentről lefelé, aztán következő oszlop)
- Megjelenítés: teljes név + érték egymás mellett, pl. `Erő: 3`
- Nem reszponzív, fix layout
- Szerkesztő módban: double-tap (350ms) → popup overlay gomb-grid (-5..+7), érték választás azonnal bezárja
- Game módban: read-only
- **Faj limit warning**: ha az érték meghaladja/alulmúlja a kiválasztott faj min/max keretét → sárga szín + automatikusan megjelenő info box (`Faj max: X` vagy `Faj min: X`), nem zárható kattintással

### Képzettségek (alatta, csoport-bontásban)
- Csoportok sorrendje: Harci → Misztikus → Fizikai → Világi → Alvilági → Művészeti → Tudományos
- Csoportok összecsukhatóak (header koppintásra toggle, ▸/▾ nyíl + elemszám)
- Game módban: üres csoportok elrejtve
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

#### Tradíció képzettség (speciális)
- Nem a `többszörös` yaml mezőt használja — saját picker logika
- Felvételkor: kétlépéses tradíció picker popup (`tables/tradiciok.json`-ból)
  - Altípus nélküli tradíciók (pl. Magasmágia): közvetlenül választható → `"Tradíció: Magasmágia"`
  - Altípusos tradíciók (Bárdmágia, Sámánmágia, Szakrális): második lépés altípus picker
  - Szakrális: pantheon-csoportosított isten lista (leírással)
  - Eredmény: `"Tradíció: Bárdmágia (Csepűrágó)"`, `"Tradíció: Szakrális (Darton)"`
- Egyszer felvehető: ha bármilyen `"Tradíció: ..."` létezik → eltűnik a dropdown-ból
- Primer képzettségként kezelt (prefix-match logikával)

#### Képzettség limitek
- Primer max szint = TSz, Szekunder max szint = TSz + 3
- Túllépés: név ÉS szint szám pirosra vált (`kep-over` CSS class)

#### Viselkedés Szerkesztő módban
- Rövid koppintás: nem csinál semmit
- Double-tap (350ms): szint választó popup (gombok 1-15 grid, 5x3 elrendezés, aktív=zöld), érték választás azonnal bezárja
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

Fortélyok listája csoport szerint: ⚔️ Harci → 🏹 Távharc → 🔧 Általános → 👁️ Érzékek → 🆓 Szabad → ⭐ Kiemelt → ✨ Misztikus.
A "Távharc" csoport a `fortelyok/tavharc/` mappából jövő fortélyokat tartalmazza (logikailag harci, vizuálisan elkülönítve).

### Megjelenés
- Csoportok összecsukhatóak (header koppintásra toggle, ▸/▾ nyíl + elemszám)
- Game módban: üres csoportok elrejtve
- Kompakt lista: név + fok karikák (●/○). Teli=aktív fok (balról: üres, jobbra: teli). Max fok elérve: zöld szín.
  - Nyelvismeret kivétel: fok szám helyett "Alap" (1) / "Udvari" (2) label, fok választó gombok lekerekített téglalapok
- Ingyenes keret alatti többszörös fortélyoknál 🎁 jel a név mellett
- ✕ törlés gomb minden fortélynál (szerkesztő módban)
- Csoportonként 1 db dropdown (szerkesztő módban): új fortély felvétele

### Dropdown lista jelölések
- Normál: `"FortélyNév (X)"` ahol X a maxfok
- Ingyenes kerettel (Kultúrkör, Helyismeret): `"Név (1) 🎁N"` ahol N a maradék ingyenes keret
- Szabad fortélyok: `"Név (1) 🎁N"` ha van szabad ingyenes keret (TSz db összesen a csoportból)
- Nyelvismeret: `"Nyelvismeret (2) 🎁N"` ahol N a maradék nyelvtanulás pont
- KP-t adó (Vakság, stb.): `"Név (X) ➕6KP"` vagy több foknál: `"Név (3) ➕6-12-18KP"`
- `spec_típus: "fegyver"`: disabled ha nincs fegyver a karakteren vagy mindhez felvéve
- `spec_típus: "nyelv"` (Nyelvismeret): disabled ha pont keret elfogyott
- Többszörösen felvehető fortélyok mindig láthatóak a dropdown-ban (nem szűrődnek ki)

### Többszörös fortélyok (generikus, `többszörösség` yaml mező alapján)
- `spec_típus: ""` → normál, egyszer felvehető
- `spec_típus` nem üres + `spec_lista: [...]` → fix lista dropdown (pl. Kultúrkör: 29 elem). Már felvett elemek kiszűrődnek.
- `spec_típus: "fegyver"` + `spec_lista: []` → dropdown a karakter fegyvereiből (Harcértékek fülről). Disabled ha nincs fegyver / mindhez felvéve.
- `spec_típus: "nyelv"` + `spec_lista: []` → custom styled gomb-lista overlay (`.nyelv-picker`, csoportonként narancssárga fejléc + `.nyelv-btn` gombok, `tables/nyelvek.json`-ból, max 70vh scrollozható). Mellé katt/Escape cancel. Már felvett nyelvek kiszűrődnek.
- `spec_típus` egyéb + `spec_lista: []` → freetext popup (max 20 karakter) (pl. Helyismeret, Páros harc)
- Felvett példányok neve: `"AlapNév - alnév"` formátum (pl. `"Kultúrkör - erv"`, `"Helyismeret - Erion"`)

### Szabad fortélyok speciális kezelés
- Csoport-szintű ingyenes keret: TSz db (az egész szabad csoportból összesen)
- Ingyenes keretbe eső fortélyok: 🎁 jelölés a soron
- Keret felett: 6 KP/db (szekunder KP-ból)
- Kiérdemelt fortélyok (`kiérdemelt: true`): 🎁 jelölés, nem fogyasztják se a keretet se a KP-t
- Felvételkor popup: "6/0 Felvett" / "⭐ Kiérdemelt" választó

### Nyelvismeret pont keret
- Nyelvtanulás képzettség 4. szinttől: `(szint - 3) x 3` pont
- Fizetős fok számítás: nem-kiérdemelt teljes foka + kiérdemelt `max(0, fok-1)` (első fok ingyenes)
- Nyelvismeret fizetős össz-fok ≤ pont keret
- Túllépés: utolsó N fizetős sor piros (név + fok), incl. kiérdemelt ha fok>1
- Dropdown disabled ha keret elfogyott

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
  - Mesterfegyver (locked): double-tap → "Ezt a fortélyt a Harcértékek fülön kezeld!" hint (3s)
- Felvételkor (dropdown): maxfok>1 → azonnal fok popup (egyik sem pre-selected, fok: 0-val kerül be); többszörös → megfelelő picker popup
- Locked fortélyok (konstansok.locked_fortélyok): NEM jelennek meg a dropdown-ban, nem szerkeszthetők/törölhetők, lista tetején
- Mesterfegyver bejegyzések: szinkronizálva fegyver példányokból (Harcértékek fül)
- ✕ törlés: mindig megerősítő dialógus (piros "Törlés" gomb) — locked elemeknél nincs ✕
- Escape: popup bezárás

### Viselkedés Game módban
- Koppintás: lenyílik inline accordion info panel:
  - Leírás (dőlt)
  - Hatás (aktuális fok hatás szövege)
  - Követelmény (ha van)
  - Kiterjeszti (normál + erős képzettség lista, zöld szín)

### Követelmény ellenőrzés
- Gépileg ellenőrizhető típusok: `képzettség` (szint), `fortély` (fok)
- Nem teljesülő követelmény: piros bal border (`.fort-kov-hiba`) + automatikus piros info sor ("⚠ Követelmény: X ≥ Y")
- OR lista (név tömbben): bármelyik egyezés elegendő
- Harcmodor összevonás: ha a követelmény lista összes eleme harcmodor → "Harcmodor ≥ X" (rövidített)
- Többszörös fortély követelmény (pl. Nyelvismeret): bármelyik példány teljesítheti
- Case-insensitive összehasonlítás mindkét típusnál
- Rendezés: locked fortélyok előre → azonos nevűek együtt (ABC) → azon belül fok desc

### Mód váltás
- Game → Szerkesztő váltáskor: info accordion resetelődik (nyitott panel bezáródik)

---

## 4b. Harcértékek fül/screen (editOnly: true — Game módban nem látszik)

HM/CM vásárlás, fegyver és páncél konfiguráció. Csak Szerkesztő módban elérhető.

- Alap font-size: `16px` (konzisztens a többi füllel)
- Szekció fejlécek: `17px bold`

### HM / CM szekció
- HM TÉ, HM VÉ: +/- gombok + érték
- CM: +/- gombok + érték
- Validáció: HM összeg ≤ max_HM, aszimmetria ≤ max_HM_aszimmetria, CM ≤ max_CM
- Info sor: `HM: X/Y  Aszimmetria: X/Y  CM: X/Y`
- Piros szín ha túllépés

### Harcmodorok (read-only)
- Harcmodor képzettség szintek (konstansok.fegyver_kategória_harcmodor values)
- A Tul/Képz fülről szinkronizálva

### Fegyverek
- Fegyver példány kártyák listája
- Fejléc: fegyver neve (MK fegyvereknél suffix nélkül, `Alapnév` mezőből) + ✕ törlés
- Mezők (`he-field-btn` stílus, dupla katt → overlay popup):
  - MF fok: kerek gombok 0-3. Piros szöveg ha a Mesterfegyver követelménye nem teljesül.
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

### Pajzs
- Mezők (`he-field-btn` stílus, dupla katt → overlay popup):
  - Méret: — nincs — / kis / közepes / nagy
  - Pajzshasználat fok: kerek gombok 0-3 (szinkronizálja a Pajzshasználat fortélyt a Fortélyok fülön)
  - Kézben: read-only indikátor (`session.aktív_pajzs`), kattintás → sárga hint ("A pajzs kézben állapotot az Aktív fülön állíthatod!")
- Pajzshasználat fortély szinkronizáció:
  - Pajzs fok módosítás → automatikusan létrehozza/frissíti a Pajzshasználat fortélyt
  - Fortélyok fülön: locked (nem szerkeszthető/törölhető), lista tetején
  - Dupla katt locked elemre → hint: "Ezt a fortélyt a Harcértékek fülön kezeld!" (3s)
  - Pajzshasználat NEM jelenik meg a Fortélyok fül dropdown-jában

---

## 5. Misztikus fül/screen

- Tradíció képzettség (név + szint)
- Szféra / Arkánum képzettségek (név + szint lista)
- Metódus fortélyok (név + max + fok) (Game módban a "max" nem)
- Misztikus fortélyok (név + max + fok) (Game módban a "max" nem)
- Aura értékek

---

## 6. Hátterek fül/screen (🟡)

Szövegfelhő alapú háttér választó. Adatforrás: `tables/hatterek.json`.

### Tartalom
- **Faj háttér**: read-only chip (karakter.hátterek.faj), kattintásra navigál Tulajdonságok fülre
- **Leíró hátterek**: kategóriánként (Származás, Jellem, Küllem, Fóbia) — szövegfelhő, dupla katt toggle
- **Karma hátterek**: egyetlen csoport — szövegfelhő, dupla katt toggle

### Viselkedés
- Dupla katt: aktivál/deaktivál (toggle)
- Aktív elemek: színes kijelölés (leíró = zöld, karma = narancs), sor elejére rendezés, ABC sorrend
- Game módban: nem szerkeszthető (dupla katt nem reagál)
- Kategória label: világoskék (#7eb8da), bold
- Csoport fejléc (Leíró/Karma): narancssárga (#e0a050), uppercase

### Stílus
- `.hatter-tag`: lekerekített pill (border-radius: 12px), sötét háttér, szürke
- `.hatter-tag.active`: zöld háttér+keret (leíró) / narancs háttér+keret (karma)

---

## 6b. Jegyzetek overlay (✏️)

- Fejléc gombbal nyitható fullscreen overlay (nem tab)
- Teljes képernyős `<textarea>` — szabad szöveges jegyzetmező
- Mindkét módban (szerkesztő + game) elérhető és szerkeszthető
- ✕ gomb vagy Escape bezárja
- Tartalom a karakter fájlba mentődik (`jegyzetek` mező)
- Placeholder: "Szabad jegyzetek..."

---

## 6c. Napló overlay (📅)

Fejléc gombbal nyitható fullscreen overlay (nem tab). Mindkét módban elérhető. ✕ gomb vagy Escape bezárja.

Játék session bejegyzések naplója.

### Tartalom
- Screen: `padding: 12px; min-height: 100%`
- Fejléc: `h2` "📖 Napló" (margin:0) + "+ Új bejegyzés" gomb (jobb oldal, `background: --primary; border: 1px solid #555; border-radius: 4px; padding: 6px 12px; font-size: 14px`)
- Ha nincs bejegyzés: `"Nincs bejegyzés."` szürke szöveg

### Összecsukott bejegyzés lista
- Rekord sor: `background: --surface; border: 1px solid #444; border-radius: 4px; padding: 8px 10px; font-size: 15px; cursor: pointer`
- Formátum: `[dátum] KM: Kaland neve`
- Sorok gap: `margin-bottom: 4px`

### Kinyitott bejegyzés (accordion)
- Panel: `background: #1a1a3a; border: 1px solid #444; border-top: none; border-radius: 0 0 4px 4px; padding: 8px 10px; font-size: 14px`
- Események szöveg: `white-space: pre-wrap; color: --text`
- Gombok sor (`margin-top: 8px; gap: 8px`):
  - "Szerkeszt": `background: --primary; border: 1px solid #555; border-radius: 4px; padding: 4px 10px; font-size: 13px`
  - "Törlés": `background: --error; border: none; border-radius: 4px; padding: 4px 10px; color: #fff; font-size: 13px`

### Szerkesztő form (inline, accordion-ban)
- Container: `background: #1a1a3a; border: 1px solid #444; border-top: none; border-radius: 0 0 4px 4px; padding: 10px; flex-direction: column; gap: 8px`
- Mezők: `background: --input-bg; border: 1px solid #555; border-radius: 4px; padding: 6px 10px; font-size: 14px`
- Dátum sor: `<input type="date">` + "Ma" gomb (`background: --primary; padding: 4px 8px; font-size: 13px`)
- Események: `<textarea rows=4; resize: vertical; font-family: inherit>`
- Gombok sor:
  - "Mentés": `background: --success; color: #000; font-weight: bold; font-size: 14px; padding: 6px 14px`
  - "Mégse": `background: --input-bg; border: 1px solid #555; font-size: 14px; padding: 6px 14px`

### Új bejegyzés form
- Azonos stílussal mint szerkesztő form, de `background: --surface; border: 1px solid #555; border-radius: 6px; padding: 12px; margin-top: 8px`

### Viselkedés
- Kattintás rekord sorra: toggle accordion (open/close)
- Mellé kattintás (screen háttérre, rekord boxokon kívülre): accordion bezárul
- Szerkesztés közben: mellé kattintás NEM zárja be (védi a form-ot)
- Szerkesztés "Mentés": adatok frissülnek, accordion bezárul
- Szerkesztés "Mégse": változtatás eldobva, szerkesztés mód bezárul (accordion nyitva marad)
- Dátum "Ma" gomb: mai dátumot állít be (YYYY-MM-DD)
- "+ Új bejegyzés": dátum automatikusan mai napra, üres mezők

### Tárolás
- `karakter.napló[]` tömb: `{ dátum: string, km: string, kaland: string, események: string }`
- Mentéskor a karakter JSON-ba kerül (💾 gombbal)

---

---

## Tab bar

Alul fix, horizontálisan scrollozható szalag.

### Tab lista (sorrend — megjelenítés balról jobbra)
| ID | Label | editOnly |
|----|-------|----------|
| hatterek | 🟡 | false |
| fortelyok | 🟣 | false |
| tulajdonsagok | 🔵 | false |
| misztikus | ✨ | false |
| tavharc | 🏹 | false |
| harc | 🗡️ | false |
| aktiv | ❎ | false |
| harcertekek | 🛡️ | true |

Overlay screen-ek (fejléc gombokkal nyithatók, nem a tab bar-ban):
| ID | Fejléc ikon | Elérhetőség |
|----|-------------|-------------|
| jegyzetek | ✏️ | mindkét mód |
| naplo | 📅 | mindkét mód |

- `editOnly: true` → Game módban a tab eltűnik (🛡️ jobb szélről, többi fix)
- Default aktív tab induláskor: `tulajdonsagok` (index 5 az ALL_TABS-ban)
- **Tükrözött sorrend**: reverse() renderelés → a tömb utolsó eleme jelenik meg balra
- Screen slider is tükrözve: `translateX(-(TABS.length-1-activeTab)*100%)`, swipe irány invertált
- Mód váltás korrekció: `prevGameMode` ref → ID alapú index újraszámítás

### Stílus
- `justify-content: center`, `overflow: hidden` (nem scrollozható)
- Gombméret: `font-size: min(18px, calc(100vw / var(--tab-count) - 8px))`, `flex-shrink: 1`
- Tab betűméret: 18px, padding: 8px
- Inaktív szín: `--text-dim` (#999)
- Aktív tab: `--accent` szín (#e94560), bold
- Aktív tab indikátor: 3px accent csík az aktív gomb alatt, slide animáció (0.2s ease-out), betöltéskor transition nélkül
- Háttér: `--surface`, `border-top: 1px solid #333`, padding: 4px 0
- Egér scroll: `onWheel` → `scrollLeft += deltaY`

---

## Screen váltás animáció

- CSS transition: `transform 0.15s ease-out`
- Screen-ek horizontálisan egymás mellett (`display: flex`), **tükrözött sorrendben** renderelve
- Aktív screen: `translateX(-${(TABS.length - 1 - activeTab) * 100}%)`
- Csak szomszédos screen-ek renderelődnek: `Math.abs(i - activeTab) <= 1`
- Swipe gesztus: `onTouchStart`/`onTouchEnd` a `<main>` elemen, **invertált irány** (jobbra swipe = nagyobb index)
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
- Szint grid gombok (`.fort-fok-btn`): `36px x 36px; border-radius: 50%; border: 2px solid #555; font-size: 16px; font-weight: bold`
  - Aktív: `border-color: --success; background: --success; color: #000`
  - Törlő (`.fort-fok-del`): `border-color: --error; color: --error`
- Szint grid (képzettségek): `grid-template-columns: repeat(5, 36px); gap: 6px`
- Fok radios (fortélyok): `flex; gap: 8px; justify-content: center`
- Értékválasztás azonnal bezárja a popup-ot (nincs OK/Mégse gomb)

---

## Adatfolyam

```
YAML források (data/sources/konstansok.yaml, sources/kepzettsegek/, sources/fortelyok/, sources/fajok/)
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
| ÉP | képlet | 28 + edzettség x 4 |
| S1_max, S2_max, S3_max | képlet | ÉP/4, ÉP/2, ÉPx3/4 |
| KÉ | képlet | alap + gyorsaság + intelligencia + tsz + fortélyMod |
| TÉ_alap | képlet | alap + erő + ügyesség + gyorsaság + HM_TÉ |
| VÉ_alap | képlet | alap + gyorsaság + ügyesség + HM_VÉ |
| CÉ_alap | képlet | alap + önuralom + CM |
| összes_kp | képlet | tsz x (perszint + intelligencia) |
| összes_szekunder_kp | képlet | tsz x (szekunder_perszint + emlékezet) |
| tulajdonság_pont_keret | képlet | alap + floor(tsz/2) |
| manőver_pont | képlet | ceil(harcmodor_összeg x 2 / tsz) |
| felszerelés_keret | képlet | 2 + erő |
| felszerelés_mgt | képlet | max(0, terhelés - keret) |
| max_CM | képlet | tsz x max_cm_perszint |
| max_HM | sum_where | harci fortélyok (MF nélkül) + harcmodorok + alakzatharc |
| max_HM_aszimmetria | képlet | floor(tsz / 2) |
| kp_képzettségek | sum_lookup | képzettség szintek → KP tábla lookup → összeg |
| kp_fortélyok | sum | fortély fokok összege x fortélyfok konstans |
| kp_hm | képlet | (HM_TÉ + HM_VÉ) x kp.hm |
| kp_cm | képlet | CM x kp.cm |
| elköltött_kp | képlet | kp_képzettségek + kp_fortélyok + kp_hm + kp_cm + kiemelt_kp |
| maradék_kp | képlet | összes_kp + spec_kp + összes_szekunder_kp - elköltött_kp |
| sfé_fizikai | képlet | struktúra + alapanyag + idea - rongálódás |
| sfé_energia | képlet | struktúra + alapanyag + idea - rongálódás |
| páncél_MGT | képlet | max(0, struktúra_mgt + alapanyag_mgt + csatolt_mgt + méret_mgt - erő) |
| merevvért_TÉ_büntetés | if | if(merev, max(0, MGT - csökkentés), 0) |
| távharc_cella | képlet | ceil(távolság / osztó) |
| távharc_cél_VÉ | képlet | max(szorzó,1)xcella + min(szorzó,0) |
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
| kp_primer_fortélyok | sum | primer fortélyok fok x kp_perfok |
| primer_költés | képlet | kp_primer_képzettségek + kp_primer_fortélyok + kp_hm + kp_cm |
| primer_keret | képlet | összes_kp + spec_kp - primer_költés |
| páncél_struktúra_mgt | lookup | struktúrák tábla → mgt |
| páncél_struktúra_sfé_* | lookup | struktúrák tábla → sfé_fizikai/energia |
| páncél_merev, páncél_fém | lookup | struktúrák tábla → merev/fém flag |
| páncél_alapanyag_* | lookup | fémalapanyagok tábla → mgt/sfé_bónusz |
| páncél_méret_mgt | lookup | méret tábla → érték |
| merevvért_csökkentés | lookup | merevvért_tábla → csökkentés |
| páncél_csatolt_db | képlet | végtagvédettség + sisak |
| páncél_lefedettség | if | if(van, 50 + végtagx10 + sisakx10, 0) |

#### TS-ben maradó logika (nem deklaratív):
- Fájdalomtűrés enyhítés (küszöb-tábla lookup)

### Runtime adatbetöltés (GameData)
Minden adat `fetchJson`-nel:
- `tables/konstansok.json` — központi konstansok
- `tables/fegyverek.json` — fegyver adatok (MK_pár, Alapnév mezőkkel)
- `tables/tavfegyverek.json`, `tables/pajzsok.json` — távfegyver/pajzs adatok
- `tables/kepzettseg_kp.json` — KP költség tábla szintenként
- `tables/harcmodor_kepzettsegek_bonuszok.json` — harcmodor bónuszok szintenként
- `tables/kepzettsegek.json` — 81 képzettség definíció
- `tables/kiterjesztesek.json` — képzettség→fortély inverz mapping
- `tables/fajok.json` — 27 faj neve
- `tables/faj_tulajdonsag_keretek.json` — faj→tulajdonság min/max keretek
- `tables/primer_fortelyok.json` — 53 harci+misztikus fortély neve
- `tables/fortelyok.json` — 169 fortély összefoglaló
- `tables/tradiciok.json` — tradíciók (altípusokkal, Szakrális istenekkel)
- `tables/nyelvek.json` — 37 nyelv (csoportosítva)
- `data/rules.json` — reactive engine szabályok (53 db)
- `data/karakter/empty_karakter.json` — üres karakter template (induláskor betöltődik, validálva)
- `data/karakter/test_karakter.json` — teszt karakter (🧪 gomb, runtime fetch + validáció)

### Karakter state struktúra (App szintjén)
- `karakter: Karakter | null` — egyetlen unified state objektum (schema v2)
- Top-level: `schema_version`, `név`, `játékos`, `mentés_dátum`, `tsz`, `kor`, `anyanyelv`, `vallás`, `leírás`, `tulajdonságok`, `HM_TÉ`, `HM_VÉ`, `CM`, `képzettségek`, `fortélyok`, `fortélyok_speciális`, `hátterek`, `fegyverek`, `páncél`, `pajzs`, `felszerelés`, `jegyzetek`, `napló`, `session`
- `session`: `szilánk`, `vé_csökkenés`, `vé_history`, `manőver_pont_használt`, `sebzések`, `aktív_fegyver_index`, `aktív_fegyver_bal_index`, `kétkezes_harc`, `aktív_pajzs`, `aktív_páncél`, `aktív_taktikák`, `aktív_helyzetek`, `aktív_manőver`, `aktív_státuszok`, `narratív_módosítók`, `harci_akrobatika`, `fegyverfogás`
- `mentés_dátum`: mentéskor automatikusan kitöltve (YYYY-MM-DD HH:MM), betöltéskor read-only
- Convenience setterek: `setTulajdonságok`, `setKépzettségek`, `setFortélyok`, `setSession` (useCallback, partial update)
- Derived getterek (early return utáni destructuring): `tulajdonságok`, `képzettségek`, `fortélyok`, `session`
- Inicializálás: `data.emptyKarakter` betöltéskor (validated)
- Mentés/betöltés: teljes `karakter` objektum JSON-ként (session-nel együtt)
- Név/TSz/Kor/Faj: lifted props → TulajdonsagokScreen

A Tulajdonságok/Képzettségek/Fortélyok/Harcértékek fülek **szerkesztő** jellegűek.
Az Aktív és Harc fülek **runtime** jellegűek (a harc közbeni állapotot kezelik).
A Jegyzetek fül mindkét módban írható.
