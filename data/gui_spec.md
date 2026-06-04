# GUI Spec — Szilánk RPG Karakteralkotó

Mobil-first, responsive design. Tab-alapú navigáció (alsó tab bar vagy felső swipe tabs).

---

## Általános elvek

- **Mobile-first**: 320px szélességtől használható
- **Két mód**: Szerkesztő mód és Game mód (toggle gomb a fejlécben)
- **Tab navigáció**: alul fix tab bar, max 5 ikon látható, a többi "..." menüben
- **Screen váltás**: jobb-bal swipe gesztussal (mobilon), desktop-on tab kattintás + opcionális nyíl billentyűk
- **Swipe**: csak horizontális, nem ütközhet vertikális scroll-lal (threshold: 30px horizontális mozgás mielőtt aktiválódik)
- **Desktop**: tab bar kattintható, swipe opcionális (egér drag is működjön)
- **Accordion/collapse**: elemek lenyithatók koppintásra, másik koppintás becsukja
- **Dropdown**: állapotválasztók legördülő menüvel
- **Szín kód**: sárga = input, zöld = számított, piros = hiba/limit túllépés

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

### Tulajdonságok (felül)
- 8 tulajdonság fix 2 oszlop × 4 sor grid-ben (fentről lefelé, aztán következő oszlop)
- Megjelenítés: teljes név + érték egymás mellett, pl. `Erő: 3`
- Nem reszponzív, fix layout
- Szerkesztő módban: hosszú nyomás + vízszintes húzás → csúszka (-5..+7). Felengedéskor élesedik az érték.
- Game módban: read-only

### Képzettségek (alatta, csoport-bontásban)
- Csoportok sorrendje: Harci → Misztikus → Fizikai → Világi → Alvilági → Művészeti → Tudományos
- Minden képzettség: név + szint (0-15) + ✕ törlés gomb (jobb oldalon, szint mellett balra)
- Csoportonként 1 db dropdown választó (Szerkesztő módban): új képzettség felvétele. Kiválasztás után újabb jelenik meg.
- Törlés (✕ gomb): szint=0 esetén azonnal töröl, szint>0 esetén confirm() megerősítést kér.

#### Többszörös képzettségek
- A `többszörös` mező a képzettség YAML-ban **string lista** (nem boolean):
  - `[]` → egyszer felvehető, normál viselkedés
  - `["Közelharc", "Kardvívás", ...]` → fix lista, dropdown-ban `"AlapNév: AlNév"` formátumban jelenik meg
  - `["*"]` → szabad szöveges, felvételkor custom dialógus kéri az alnevet (max 20 karakter, `maxLength` input), `"AlapNév: alnév"` formátumban tárolódik
- Megjelenítés a listában is prefixes: pl. `"Harcmodor: Közelharc"`, `"Táv. harcmodor: Íjászat"`, `"Ősi nyelv ismerete: Enoszukei"`
- Belső tárolás: fix listásoknál az alnév önmagában (pl. `"Közelharc"`), szabad szövegesnél `"AlapNév: xyz"` formátumban

#### Viselkedés Szerkesztő módban
- Rövid koppintás: dropdown választó lista a képzettség nevekkel (meglévőnél az aktuális a default)
- Hosszú nyomás + húzás: szint állítás vízszintes csúszkával (0-15). Felengedésnél élesedik.
- Touch event stopPropagation: slide közben nem triggerelődik a tab swipe

#### Viselkedés Game módban
- Rövid vagy hosszú koppintás (mindegy): lenyílik egy accordion adatlap:
  - **Próba**: dobható / nem dobható / ellenpróba
  - **Domináns tulajdonságok**: pl. "Ügyesség, Gyorsaság"
  - **Kiterjeszti**: fortélyok listája amelyek kiterjesztik ezt a képzettséget (normál/erős jelzéssel)
- A kiterjesztés adatok a `tables/kiterjesztesek.json` inverz mappingből jönnek

---

## 4. Fortélyok fül/screen

Fortélyok listája csoport szerint (Harci → Általános → Érzékek → Szabad). Misztikus NEM itt.

### Megjelenés
- Kompakt lista: név + fok
- **1 koppintás**: lenyílik inline (accordion, nem popup!) a hatás/bónusz leírás
  - Harci fortélyoknál: követelmények, hatástext, módosítók
  - Szabad fortélyoknál: milyen képzettségeket terjeszt ki
- **Újabb koppintás** (ugyanarra vagy másra): becsukódik

### Speciális elemek itt
- Nyelvismeret fortélyok (nyelv + fok lista)
- Kultúrkör, Helyismeret fortélyok

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

- Alul fix, horizontálisan scrollozható szalag (mint a 2016-os Macbook Touch Bar)
- Minden tab egymás mellett, `flex-shrink: 0`, `nowrap`
- Ha nem fér ki mind → ujjal/egérrel húzva scrollozható
- Scrollbar rejtett (`scrollbar-width: none`)
- Nincs "..." menü — minden tab közvetlenül elérhető
- Aktív tab: accent szín, bold
- Tab betűméret: 12px, padding: 8px 14px
- Háttér: surface szín, border-top: 1px solid #333

---

## Screen váltás animáció

- CSS transition: `transform 0.15s ease-out`
- Screen-ek horizontálisan egymás mellett (`display: flex`)
- Aktív screen: `translateX(-N * 100%)`
- Csak szomszédos screen-ek renderelődnek (teljesítmény)
- Swipe gesztus mobilon, tab kattintás desktop-on — mindkettő animált

---

## Adatfolyam

```
Aktív fül (szituáció beállítás)
     ↓
Engine számítás (§1-§20)
     ↓
Harc fül (számított értékek megjelenítése)
```

A Tulajdonságok/Képzettségek/Fortélyok fülek **szerkesztő** jellegűek (a karakter adatait módosítják).
Az Aktív és Harc fülek **runtime** jellegűek (a harc közbeni állapotot kezelik).
A Szabályleírás fülek **read-only** referenciák.
