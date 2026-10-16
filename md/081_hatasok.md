## Hatások 🔥

A Hatások "elemi" változások, amiket egy karakter elszenved - általában egy **Státusz** viselése következtében.

Egy **Státusz** több **Hatást** is képes okozni a karakteren. Hogy egy Státusz milyen Hatások listáját okozza, azt a [Státuszok](082_statuszok.md) oldalon találod. Mágikus tárgyak, fegyverek is képesek lehetnek **Hatások** okozására.

### Szorzó hatások ökölszabály ❗

Egy karakterre ható több szorzó kombinációja esetén CSAK a legnagyobb számít.\
Természetesen ez a másik karakter oldalán is igaz, így szélsőséges esetben lehetséges, hogy a támadó és védő szorzói erősítik egymás hatását (összeszorzódnak).

<br />

## ⚜️ Előny+1,2 és Hátrány-1,2 Hatások

```
MIN,MAX: [-2, +2]
```

Az `Előny` és `Hátrány` speciális, kockadobásokat érintő Hatások.\
Hogy milyen dobást befolyásolnak, az változó - amire épp vonatkoznak:

```
KÉ dobás
TÉ dobás
CÉ dobás
Tulajdonságpróba
Érzék Tulajdonságpróba
Képzettségpróba (mágia is)
Sebzésdobás
Mágia Akarata
Mágiaellenállás dobás
```

🔆 Halmozódásuk esetén is az alábbi alsó és felső korlátuk érvényes: `[-2, +2]`.

🔆 A fenti Előny/Hátrány modell **Státuszok** és **képzettség-kiterjesztések** esetén alkalmazandó. Ezzel szemben a Fortélyok fix bónuszai és Harci taktikák esetén konstans, statikus módosítókat alkalmazunk.

### 🔥 Előny+1

```
2x dobhat, nagyobb számít

Védekezés esetén:
  támadó dob → Hátrány-1
```

### 🔥 Előny+2

```
3x dobhat, legnagyobb számít

Védekezés esetén:
  támadó dob → Hátrány-2
```

### 🔥 Hátrány-1

```
2x dobhat, kisebb számít

Védekezés esetén:
  támadó dob → Előny+1
```

### 🔥 Hátrány-2

```
3x dobhat, legkisebb számít

Védekezés esetén:
  támadó dob → Előny+2
```

<br />

---
---
### 🔥 Antyssjárás elvesztése

Valamilyen okból nem vagy képes az Antyss síkjára bejutni, ott közlekedni - alvás közben sem.

<br />

---
### 🔥 Automatikus kudarc

- KÉ dobásra (utolsónak kezdeményezhetsz)
- Tulajdonságpróbára
- Képzettségpróbára

Az adott Tulajdonságra/Képzettségre nem is dobhatsz próbát, azonnali kudarc.

Példa: csábítás **Befolyásolás-próba** borzasztó büdösen.

<br />

---
### 🔥 Automatikus tulajdonság/képzettségpróba

Sima próbadobás (Tulajdonságpróba, Képzettségpróba)

Ami másnak automatikus siker, az neked sima próbadobás.

<br />

---
### 🔥 Beszéd - zavart

- Nehezen tudsz szavakat formálni
- Varázslásnál: Extra Önuralom tulajdonságpróba (Nehéz). Ha megvan, sikerül a hang komponenst kimondani

### 🔥 Beszéd - némult

- Képtelen vagy beszéddel hangot kiadni magadból, még egy nyikkanást sem.
- Mágia hangalapú komponensét sem tudod alkalmazni

<br />

---
### 🔥 Érzék - Hátrány-1 (zavart)

Látás / Hallás / Szaglás.

```
Hátrány-1 minden adott érzéken
  alapuló tulajdonságpróbára és
  képzettségpróbára
```

### 🔥 Érzék - Hátrány-2 (részleges)

Látás / Hallás / Szaglás.

```
Hátrány-2 minden adott érzéken
  alapuló tulajdonságpróbára és
  képzettségpróbára
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

Az `S1` Egészség kategória összes rubrikája feltöltődik új [FP](061_02_faradtsag_pont.md) jelölőkkel.

### 🔥 `FP S2`

Az `S1` ÉS `S2` Egészség kategóriák összes rubrikája feltöltődik új [FP](061_02_faradtsag_pont.md) jelölőkkel.

<br />

---
### 🔥 Harcképtelenség

- Tudsz mozogni, menni, de harcolni nem
- minden támadás ellened automatikusan sebző

<br />

---
### 🔥 Mozgás - feleződik

- [Mozgás](063_01_harci_kor.md#2-mozgás) értéked feleződik ↑ - harcon belül
- Felére csökken a megtehető távolságod - harcon kívül

---
### 🔥 Mozgás - lecövekelt

Valamilyen okból nem tudsz helyet változtatni. A testrészeid mozgását nem befolyásolja.

---
### 🔥 Mozgás - képtelen

- minden támadás ellened automatikusan sebző
- mozdulni se bírsz nyaktól lefelé
- szemmozgás, légzés működik
- csak fizikai hatás, mentális hatása nincs

<br />

---
### 🔥 Pszi használat elvesztése

Képtelen vagy [Pszí](090_pszi.md) alkalmazására. Az Aurádra nincs hatással.

<br />

---
### 🔥 Sebzés csökkentett

```
0 + k20 SP
```

<br />

---
### 🔥 `1` támadás elvesztése

```
-1 támadás a körben
(minimum 1)
```

<br />

---
### 🔥 Többszörös támadás elvesztése

```
Max 1 támadás / kör
```

---
### 🔥 Varázslás képesség elvesztése

Képtelen vagy bármilyen mágia végzésére, fenntartására. Az Aurádra nincs hatással.

<br />

---
### 🔥 VÉ veszteség duplázódik

Irányodba indított támadásnál a szokásos elszenvedett VÉ veszteséged duplázódik.

🔆 Nem halmozható. Lásd még: [Halmozódás más szorzókkal](081_hatasok.md#szorz%C3%B3-hat%C3%A1sok-%C3%B6k%C3%B6lszab%C3%A1ly-)

<br />

---
### 🔥 VÉ csökkentés bónusz `+[1;2]`

Védő Érték csökkentésedhez `1`-től `2`-ig terjedő bónuszt kapsz.

Additív, de maximális értéke összesen: `+2`.

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
