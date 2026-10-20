## Hatások 🔥

A Hatások "elemi" változások, amiket egy karakter elszenved - általában egy **Státusz** viselése következtében.

Egy **Státusz** több **Hatást** is képes okozni a karakteren. Hogy egy Státusz milyen Hatások listáját okozza, azt a [Státuszok](082_statuszok.md) oldalon találod. Mágikus tárgyak, fegyverek is képesek lehetnek **Hatások** okozására.

### Szorzó hatások ökölszabály

→ [Lásd itt](010_11_bonuszok_alkalmazasi_sorrendje_okolszabalyok.md#-ökölszabály-szorzó-hatások)

<br />

---
## ⚜️ Előny+1,2 és Hátrány-1,2 Hatások

```
MIN,MAX: [-2, +2]
```

Az `Előny` és `Hátrány` speciális, kockadobásokat érintő Hatások.\
Az alábbi dobásokat befolyásolhatják:

```
KÉ dobás
TÉ dobás
CÉ dobás
Tulajdonságpróba
Érzék Tulajdonságpróba
Képzettségpróba (mágia is)
Sebzésdobás
Mágia Akarata
Mágiaellenállás
```

🔆 Halmozódásuk esetén is alsó és felső korlátuk érvényes: `[-2, +2]`.

🔆 Az Előny/Hátrány modell **Státuszok** és **Képzettség-kiterjesztések** esetén alkalmazandó. Ezzel szemben a **Fortélyok** bónuszai és **Harci taktikák** esetén konstans, statikus módosítókat alkalmazunk.

### 🔥 Előny+1

```
2x dobhat, nagyobb számít
```

### 🔥 Előny+2

```
3x dobhat, legnagyobb számít
```

### 🔥 Hátrány-1

```
2x dobhat, kisebb számít
```

### 🔥 Hátrány-2

```
3x dobhat, legkisebb számít
```

<br />

---
---
### 🔥 Antyssjárás elvesztése

Valamilyen okból nem vagy képes az Antyss síkjára bejutni, ott közlekedni - még alvás közben sem.

<br />

---
### 🔥 Automatikus kudarc

- KÉ dobásra → utolsónak kezdeményezhetsz
- Tulajdonságpróbára
- Képzettségpróbára

Tulajdonságra/Képzettségre nem is dobhatsz próbát, azonnali kudarc.

Példa: csábítás **Befolyásolás-próba** a latrinából kimászva.

<br />

---
### 🔥 Automatikus Tulajdonság/Képzettségpróba

Sima próbadobás (Tulajdonságpróba, Képzettségpróba)

Nehezebben mennek bizonyos hétköznapi dolgok.\
Ami másnak automatikus siker, az neked már próbadobásos.

<br />

---
### 🔥 Beszéd - zavart

- Nehezen tudsz szavakat formálni
- Varázslásnál: Extra **Önuralom** Tulajdonságpróba (**Nehéz**). Ha megvan, sikerül a varázslat hang komponensét kimondani

### 🔥 Beszéd - némult

- Képtelen vagy beszéddel hangot kiadni magadból, még egy nyikkanást sem.
- Mágia hangalapú komponensét nem tudod alkalmazni

<br />

---
### 🔥 Érzék - Hátrány-1 (zavart)

Látás / Hallás / Szaglás.

```
Hátrány-1 minden adott érzéken
  alapuló Tulajdonságpróbára és
  Képzettségpróbára
```

### 🔥 Érzék - Hátrány-2 (részleges)

Látás / Hallás / Szaglás.

```
Hátrány-2 minden adott érzéken
  alapuló Tulajdonságpróbára és
  Képzettségpróbára
```

### 🔥 Érzék - automatikus kudarc (kioltott)

Látás / Hallás / Szaglás.

```
Automatikus kudarc minden
  adott érzéken alapuló próbára.
```

<br />

---
### 🔥 `FP S1`

Az `S1` Egészség kategória összes rubrikája feltöltődik új [FP](061_02_faradtsag_pont.md) jelölőkkel. Ha `S1` már betelt, nincs hatása.

### 🔥 `FP S2`

Az `S1` ÉS `S2` Egészség kategóriák összes rubrikája feltöltődik új [FP](061_02_faradtsag_pont.md) jelölőkkel. Ha `S2` már betelt, nincs hatása.

<br />

---
### 🔥 Harcképtelenség

- Tudsz mozogni, menni, de harcolni nem
- minden támadás ellened: automatikus Sebzés

<br />

---
### 🔥 Mozgás - feleződik

- [Mozgás](063_01_harci_kor.md#2-mozgás) értéked feleződik ↑ - harc közben
- Felére csökken a megtehető távolságod - harcon kívül

---
### 🔥 Mozgás - lecövekelt

Valamilyen okból nem tudsz helyet változtatni. A testrészeid mozgását nem befolyásolja.

---
### 🔥 Mozgás - képtelen

- minden támadás ellened: automatikus Sebzés
- mozdulni se bírsz nyaktól lefelé
- szemmozgás, légzés működik
- csak fizikai hatás, mentális hatása nincs

<br />

---
### 🔥 Pszi használat elvesztése

Képtelen vagy [Pszí](090_pszi.md) alkalmazására. Az Aurádra nincs hatással.

<br />

---
### 🔥 `1` támadás elvesztése

```
-1 támadás a körben
(minimum 1 marad)
```

---
### 🔥 Többszörös támadás elvesztése

```
Max 1 támadás / kör
```

<br />

---
### 🔥 Varázslás képesség elvesztése

Képtelen vagy bármilyen mágia létrehozára, fenntartására. Az Aurádra nincs hatással.

<br />

---
### 🔥 VÉ veszteség duplázódik

Irányodba indított támadásnál az elszenvedett `VÉ` veszteséged duplázódik.

🔆 Nem halmozható többször. Lásd még: [Halmozódás más szorzókkal](081_hatasok.md#szorzó-hatások-ökölszabály)

<br />

---
### 🔥 VÉ csökkentés bónusz `+[1;2]`

Védő Érték csökkentésedhez `1` vagy `2` bónuszt kapsz.

Additív, de maximum: `+2`

<br />

---
### 🔥 VÉ csökkentés: `X`

Ellenfeled Védő Értékét csökkented `X` értékkel.

<br />

---
### 🔥 Vérzés - gyenge

```
-1 ÉP / 10 perc
(harcban nem számít)
```

---
### 🔥 Vérzés - közepes

```
-1 ÉP / 2 kör
```

---
### 🔥 Vérzés - erős

```
-1 ÉP / kör
```

---

🔗 [Státuszok](082_statuszok.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#8-hatások-és-státuszok)
