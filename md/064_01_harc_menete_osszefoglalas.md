
## A harc menete – összefoglalás

### 🧮 Harcértékek

```
KÉ = 3
   + (Gyorsaság + Intelligencia)⭕k20
   + Tapasztalati szint
   + Harcmodor/Mágia-Tradíció bónusz

TÉ = 7
   + Erő + Ügyesség + Gyorsaság
   + TÉ HM
   + Harcmodor/Mágia-Tradíció bónusz
   + Mf bónusz
   + Fegyver TÉ

VÉ = 24
   + Ügyesség + Gyorsaság
   + VÉ HM
   + Harcmodor/Mágia-Tradíció bónusz
   + Mf bónusz
   + Fegyver VÉ
   + Pajzs VÉ

VÉ Bónusz:
  → Vértviselet 3.szint:
    - félvért VÉ:+1⭕k20
    - teljes vért VÉ:+3⭕k20

CÉ = -10 (Konstans)
   + Önuralom
   + CM
   + Harcmodor/Mágia-Tradíció bónusz
   + Fegyver CÉ
```

<br />

---
### 🤞 Kezdeményezés ⭕k20

```
Kezdeményező dobás: KÉ + k20
```

Minden kör elején van kezdeményezés, ami csak a cselekvési sorrend meghatározására szolgál, nem jelent dominanciát, vagy a harc irányítását.

A magasabb számot kapott kezd, `20`-as dobásra rá lehet dobni újra.

Azonos kezdeményezésnél: egyszerre csapnak.

<br />

---
### 🤺 Támadás

```
Támadó dobás: TÉ + k20
```

```
Minden újabb támadás a körben:

  TÉ:-4 a 2. támadástól kezdődően
  aktuális Támadó Értékre.
  NEM Additív.

Sebzés jellege: elsődleges sebzési
        típusa az alapértelmezett
        (például: Szúró).
        Másodlagos támadási formával
        TÉ:-2 módosítóval támadhatsz

Előnyös/hátrányos helyzetű harcos:
   1 penge méretkülönbségtől
```

<br />

---
### 😵 TÉ < VÉ  → VÉ csökkentés

#### [Fegyverméret - pengehátrány](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---pengeh%C3%A1tr%C3%A1ny)

```
VÉ csökkentés:
  1 + k20 tizes része
```

#### [Fegyverméret - Azonos](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---azonos)

```
Mindkét fél csökkent:
  2 + k20 tizes része
```

#### [Fegyverméret - 1 pengés előny](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---1-peng%C3%A9s-el%C5%91ny)

```
VÉ csökkentés:
  2 + k20 tizes része
```

#### [Fegyverméret - 2 pengés előny](#fegyverm%C3%A9ret---2-peng%C3%A9s-el%C5%91ny)

```
VÉ csökkentés:
  3 + k20 tizes része
```

<br />

---
### 🗡️ Fegyver

```
Fegyver SP: k20 + X

X: fegyver alap sebzése
```

```
- Erő Tulajdonság 1:1-ben hozzáadódik
  (vagy levonódik, ha negatív).
  Erőbónusz limit lehet egyes fegyverekre. 
- Mesterfegyver fortély: +1 SP / fok
- Fegyver mágia bónusz hozzáadódik
```

```
- Többszörös találat (TÉ > VÉ+20 ⭕k20):
      20-anként SP:+3   (max +9 SP)
- Roham: SP:+5
- Támadás erőből fortély bónusza
```

<br />

---
### 💥 TÉ >= VÉ  → Találat, Sebzés

```
Páncéldobás: áldozat dob k10    
   → nincs SFÉ
   → van SFÉ (szúró, vágó, zúzó)
     Fegyver Átütés csökkenti!
```

```
SP = Fegyver SP
   + módosítók
   + bónuszok
   – aktuális SFÉ
```

```
ÉP seb:
  - SP ↔ ÉP átváltás Sebzés táblázatban

VÉ csökkentés:
  - SP ↔ VÉ átváltás Sebzés táblázatban
  - Fárasztó taktika alkalmazásakor:
    nincs Sebzés, VÉ:+5 csökkentés
```

Lásd: [Sebzés táblázat](064_02_06_sebzes.md)

**Megjegyzés**: a [Harci anatómia](fortelyok.harci/harci_anatomia.md) ÉP bónusza csak akkor adható hozzá, ha az vértmentes pontot támadsz!

<br />

---
### 🍎 VÉ regenerálódás
```
1 kör pihenéssel töltött idő:
    visszatér a harcban
    (nem sebtől) elvesztett VÉ
```

Teljes, fenyegetetlen nyugalom szükséges!

#### Győzelmi szabály

```
VÉ: +3
```

Ha a karakter végzett egy - hozzá hasonló tudású, vagy erősebb - ellenfelével (úgy hiszi, legyőzte), akkor **Védő Értékéhez** visszatér `+3` pont.

Ez a siker hatása a szervezetre + heroizmus. Persze itt is lehetnek kivételek (barát megölése, stb).

<br />

---
### 🔢 Támadások száma

```
1 + Plusz támadások

Plusz támadások (db) =
  Harckeret / (Fegyver Sebesség)
```

```
Harckeret =
    aktuális Harcmodor szint
  + Gyorsaság
  - 3

Fegyver Sebesség:
  fegyverenként eltérő egyéni érték 
```

Lásd: [Fegyverek táblázat](068_00_fegyverek.md)

<br />

---
### 🚷 Mozgásgátló Tényező (MGT)

Lásd a [Vértek, Páncélok - MGT fejezetét](069_00_vertek_pancelok.md#mozgásgátló-tényező-mgt).

<br />

---
### 📖Csataszabályok

Nagy tömegjelenetben a sok statisztika kezelése drasztikusan lelassíthatja a játékot. Ilyenkor a következő – opcionális – szabályt javasoljuk:

```
- TÉ: +7 mindenkinek (az osztás után)
- Nincs VÉ csökkentés
- Nincs páncéldobás
- Nincs Manőver használat
- Erősített sebzés:
  1-10:   6 ÉP⭕
  11-20: 12 ÉP⭕
  21-30: 20 ÉP⭕
  31-től halál⭕
```

---

🔗 [Harc menete - részletes](064_02_00_harc_menete_reszletes.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
