
## A harc menete – összefoglalás

### 🧮 Harcértékek

```
KÉ = 0
   + (Gyorsaság + Intelligencia)
   + Tapasztalati szint
   + Gyors kezdeményezés fortély bónusza

TÉ = 7
   + Erő + Ügyesség + Gyorsaság
   + TÉ HM
   + Harcmodor bónusz
   + Mf bónusz
   + Fegyver TÉ

VÉ = 24
   + Ügyesség + Gyorsaság
   + VÉ HM
   + Harcmodor bónusz
   + Mf bónusz
   + Fegyver VÉ
   + Pajzs VÉ
   +3 (Merevvértviselet 3.szint)

CÉ = -15 (Konstans)
   + Önuralom
   + CM
   + Harcmodor bónusz
   + Fegyver CÉ

SP Alap =
 + fegyver alap sebzése
 + Erőbónusz (fegyverfüggő limit lehetséges)
 + Mesterfegyver fortély: +1 SP / fok
 + Fegyver mágia bónusz
```

<br />

---
### 🤞 Kezdeményezés

```
Kezdeményező dobás: KÉ + k20
```

<br />

---
### 🤺 Támadás

```
Támadó dobás: TÉ + k20

k20 dobás
    1: NEM kiemelkedő kudarc
16-19: Sebzésdobásra Előny+1
   20: Sebzésdobásra Előny+2 
```

```
Minden újabb támadás a körben:
  TÉ:-4 (NEM additív!)
```

```
Sebzés jellege
→ Elsődleges sebzési forma
  az alapértelmezett
→ Másodlagos támadási formával
  TÉ:-2 módosító

```

```
Előnyös/hátrányos helyzetű harcos:
   1 penge méretkülönbségtől
```

<br />

---
### 😵 VÉ csökkentés ( TÉ < VÉ )

```
"k20T" rövidítés == k20 tízes része

Példák:
5  → 0
16 → 1
20 → 2
```

#### [Fegyverméret - pengehátrány](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---pengeh%C3%A1tr%C3%A1ny)

```
VÉ csökkentés
  1 + k20T
```

#### [Fegyverméret - Azonos](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---azonos)

```
Mindkét fél csökkentése
  2 + k20T
```

#### [Fegyverméret - 1 pengés előny](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---1-peng%C3%A9s-el%C5%91ny)

```
VÉ csökkentés
  2 + k20T
```

#### [Fegyverméret - 2 pengés előny](#fegyverm%C3%A9ret---2-peng%C3%A9s-el%C5%91ny)

```
VÉ csökkentés
  3 + k20T
```

<br />

---
### 🗡️ Sebzés

```
 k20 + Fegyver SP Alap
```

```
→ Roham: SP:+5
→ Támadás erőből fortély bónusza
```

```
Többszörös találat bónusza
   TÉ >= VÉ + 4    SP:+3
   TÉ >= VÉ + 8    SP:+6
   TÉ >= VÉ + 12   SP:+9
```

<br />

---
### 💥 Találat, Sebzés ( TÉ >= VÉ )

```
Páncéldobás: áldozat dob k10    
   • nincs SFÉ
   • van SFÉ (szúró, vágó, zúzó)
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
  • SP → ÉP átváltás Sebzés táblázatban

VÉ csökkentés:
  • SP → VÉ átváltás Sebzés táblázatban
  • Fárasztó taktika alkalmazásakor:
    nincs Sebzés, VÉ:+5 csökkentés
```

Lásd: [Sebzés táblázat](064_02_06_sebzes.md)

<br />

---
### 🍎 VÉ regenerálódás

```
1 kör nyugodt pihenéssel töltött idő
  → visszatér a harcban
    elvesztett VÉ
  → seb okozta csökkenés megmarad
```

```
Győzelmi szabály
  VÉ: +3
```

<br />

---
### 🔢 Támadások száma

```
1 + Plusz támadások

Plusz támadások (db) =
  Harckeret / (Fegyver Sebesség)
```

Lásd: [Harckeret](../063_04_tamadasok_szama_fegyverrel.md#harckeret) és [Fegyverek](068_00_fegyverek.md)

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
  1-10:   6 ÉP
  11-20: 12 ÉP
  21-30: 20 ÉP
  31-től halál
```

---

🔗 [Harc menete - részletes](064_02_00_harc_menete_reszletes.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
