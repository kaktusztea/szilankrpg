
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
   + Erőbónusz
     (fegyverfüggő limit lehetséges)
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
"Fegyverméret különbség
  határozza meg a
  VÉ csökkentést
```

<br />

---
### 😵 VÉ csökkentés ( TÉ < VÉ )

```
"k20T" rövidítés == k20 tízes része

Példák:
   5  → 0
  16  → 1
  20  → 2
```

#### [Alap VÉ csökkentés](065_01_04_fegyver_harci_helyzetek.md#alap-vé-csökkentés)

```
Mindkét fél csökkentése
  1 + k20T
```

#### [Pengeelőny](065_01_04_fegyver_harci_helyzetek.md#pengeelőny)

```
VÉ csökkentés
  2 + k20T
```

<br />

---
### 🗡️ Fegyver sebzése

```
 k20 + Fegyver SP Alap
```

```
Módosítók
  Roham: SP:+5
  Támadás erőből fortély bónusza
```

```
Többszörös találat bónusza
  TÉ >= VÉ + 5    SP:+2
  TÉ >= VÉ + 10   SP:+4
  TÉ >= VÉ + 15   SP:+6
```

<br />

---
### 💥 Találat, Sebzés ( TÉ >= VÉ )

```
Páncéldobás: áldozat dob k10 (%)
   • 0 SFÉ
   • van SFÉ (szúró, vágó, zúzó).
     Fegyver Átütés csökkenti SFÉ
     aktuális értékét.
```

```
SP = Fegyver SP
   + módosítók
   + bónuszok
   – aktuális SFÉ
```

```
ÉP seb
  • SP → ÉP átváltás Sebzés táblázatban

VÉ csökkentés sebzés esetén
  • SP → VÉ átváltás Sebzés táblázatban
  • Fárasztó taktika alkalmazásakor:
    • nincs Sebzés
    • 3 + k20T VÉ csökkentés
```

Lásd: [Sebzés táblázat](064_02_07_sebzes.md)

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
  Harckeret / (Fegyver Sebesség) ↓
```

Lásd: [Harckeret](063_04_tamadasok_szama_fegyverrel.md#harckeret) és [Fegyverek](068_00_fegyverek.md)

<br />

---
### 🚷 Mozgásgátló Tényező (MGT)

Lásd a [Vértek, Páncélok - MGT fejezetét](069_00_vertek_pancelok.md#mozgásgátló-tényező-mgt).

<br />

---
### 📖Csataszabályok

Nagy tömegjelenetben a sok statisztika kezelése drasztikusan lelassíthatja a játékot. Ilyenkor a következő – opcionális – szabályt javasoljuk:

```
• TÉ: +7 mindenkinek
• Nincs VÉ csökkentés
• Nincs páncéldobás
• Nincs Manőver használat
• Erősített sebzés:
  1-10:   6 ÉP
  11-20: 12 ÉP
  21-30: 20 ÉP
  31-től halál
```

---

🔗 [Harc menete - részletes](064_02_00_harc_menete_reszletes.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
