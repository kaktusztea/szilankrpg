
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
 Fegyverméret különbség
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

#### [Pengehátrány](065_01_04_fegyver_harci_helyzetek.md#pengehátrány)

```
VÉ csökkentés
  1 + k20T
```

#### [Alappenge](065_01_04_fegyver_harci_helyzetek.md#alappenge)

```
VÉ csökkentés
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
  TÉ >= VÉ + 5    SP:+3
  TÉ >= VÉ + 10   SP:+6
  TÉ >= VÉ + 15   SP:+9
```

<br />

---
### 💥 Találat, Sebzés ( TÉ >= VÉ )

```
Páncéldobás: áldozat dob k10 (%)
   • 0 SFÉ
   • van fizikai SFÉ
     Fegyver Átütés csökkenti SFÉ
     aktuális értékét.
```

```
ÉP = Fegyver SP
   + módosítók
   + bónuszok
   – aktuális SFÉ
```

```
Fárasztó taktika alkalmazásakor:
• nincs támadó dobás, nincs Sebzés
• 2 VÉ csökkentés
   +1: Fárasztás fortély
   +1: Pengeelőnyben
```

Lásd: [Sebzés](064_02_07_sebzes.md)

Lásd: [Fárasztó taktika](065_02_harci_taktikak.md#fárasztó-taktika-)

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
• TÉ: +7 extra mindenkinek
• SP: +5 extra mindenkinek
• Nincs VÉ csökkentés
• Nincs páncéldobás
• Nincs Manőver használat
```

---

🔗 [Harc menete - részletes](064_02_00_harc_menete_reszletes.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
