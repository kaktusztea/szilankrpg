
## A harc menete – összefoglalás

### 🧮 Harcértékek
```
KÉ = 10
   + (Gyorsaság + Intelligencia)
   + Tapasztalati szint
   + Harcmodor/Mágia-Tradíció bónusz
   + Mf bónusz
   + Fegyver KÉ

TÉ = 20
   + 2 x (Erő + Ügyesség + Gyorsaság)
   + TÉ HM
   + Harcmodor/Mágia-Tradíció bónusz
   + Mf bónusz
   + Fegyver TÉ

VÉ = 120
   + 2 x (Ügyesség + Gyorsaság)
   + VÉ HM
   + Harcmodor/Mágia-Tradíció bónusz
   + Mf bónusz
   + Fegyver VÉ
   + Pajzs VÉ

VÉ Bónusz:
  → Vértviselet 3.szint:
    - félvért VÉ:+5
    - teljes vért VÉ:+10

CÉ = -30
   + (2 x Önuralom)
   – 30 (Konstans)
   + CM
   + Harcmodor/Mágia-Tradíció bónusz
   + Fegyver CÉ
```

<br />

---
### 🤞 Kezdeményezés

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
Támadó dobás: TÉ + k100
```

```
Minden újabb támadás a körben:

  TÉ:-20 a 2. támadástól kezdődően
  aktuális Támadó Értékre.
  NEM Additív.

Sebzés jellege: elsődleges sebzési
        típusa az alapértelmezett
        (például: Szúró).
        Másodlagos támadási formával
        TÉ:-10 módosítóval támadhatsz

Előnyös/hátrányos helyzetű harcos:
   1 penge méretkülönbségtől

01 támadó dobás: kudarc, KM dönt.
   Pl. az ellenfél kap +1 támadást
```

<br />

---
### 😵 TÉ < VÉ  → VÉ csökkentés

#### [Fegyverméret - Azonos](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---azonos)

```
Mindkét fél Nagykockával csökkent (k100)

Példa: 58  → 8
```

#### [Fegyverméret - pengehátrány](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---pengeh%C3%A1tr%C3%A1ny)

```
Kiskocka értékével csökkent (k100)
  Példa: 58  → 5
```

#### [Fegyverméret - 1 pengés előny](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---1-peng%C3%A9s-el%C5%91ny)

```
Nagykocka értékével csökkent (k100)
  Példa: 58  → 8
```

#### [Fegyverméret - 2 pengés előny](#fegyverm%C3%A9ret---2-peng%C3%A9s-el%C5%91ny)

```
(Nagykocka+1) értékével csökkent (k100)
  Példa: 58  → 9
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
- Többszörös találat (TÉ > VÉ+20):
      20-anként SP:+3   (max +9 SP)
- 00 támadó dobás: SP:+5
      Ellenfél SFÉ nem számít
      (de Aranyharang, Elemi Erő igen)
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
VÉ: +10
```

Ha a karakter végzett egy - hozzá hasonló tudású, vagy erősebb - ellenfelével (úgy hiszi, legyőzte), akkor **Védő Értékéhez** visszatér `+10` pont.\
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
- TÉ: osztás 10-zel, kerekítés (1-5: le, 6-9: fel)
- VÉ: osztás 10-zel
- TÉ: +2 mindenkinek (az osztás után)
- Nincs VÉ csökkentés
- Nincs páncéldobás
- Nincs Manőver használat
- Támadó dobás: k10
- Erősített sebzés:
  1-10:   6 ÉP
  11-20: 12 ÉP
  21-30: 20 ÉP
  31-től halál
```

---

🔗 [Harc menete - részletes](064_02_00_harc_menete_reszletes.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
