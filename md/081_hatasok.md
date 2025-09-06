## Hatások 🔥

A Hatások "elemi" változások, amiket egy karakter elszenved - általában egy **Státusz** viselése következtében.

Egy **Státusz** több **Hatást** is képes okozni a karakteren.  Hogy egy Státusz milyen Hatások listáját okozza, azt a [Státuszok](082_statuszok.md) oldalon találod. Mágikus tárgyak, fegyverek is képesek lehetnek **Hatások** okozására.

<br />

## ⚜️ Előny-1,2 és Hátrány-1,2 Hatások

```
MIN,MAX: [-2, +2]
```

Az `Előny` és `Hátrány` speciális, kockadobásokat érintő Hatások.\
Hogy milyen dobást befolyásolnak, az változó - amire épp vonatkoznak:
- Támadó dobás
- Célzó dobás
- Manőver Ellenpróba dobás
- Tulajdonságpróba
- Képzettségpróba (mágia is)
- Sebzésdobás
- Mágia Akarata
- Mágiaellenállás dobás

🔆 Halmozódásuk esetén is az alábbi alsó és felső korlátuk érvényes: `[-2, +2]`.

🔆 Az Előny/Hátrány modell Státuszok (harci és normál) esetén alkalmazandó. A statikus ismeretek, mint a fortélyok, vagy harci taktikák esetén a konstans módosítókat alkalmazzuk.

### 🔥 Előny-1

```
2x dobhat, nagyobb számít

Védekezés esetén:
  támadó dob → Hátrány-1
```

### 🔥 Előny-2

```
3x dobhat, legnagyobb számít

Védekezés esetén:
  támadó dob → Hátrány-2
```

### 🔥 Hátrány-1

`2x` dob, a kisebb dobás számít

Védekezésnél: a támadó dob → `Előny-1`

### 🔥 Hátrány-2

`3x` dob, a legkisebb dobás számít

Védekezésnél: a támadó dob → `Előny-2`

<br />

---
---
### 🔥 Antyssjárás elvesztése

Valamilyen okból nem vagy képes az Antyss síkjára bejutni, ott közlekedni - alvás közben sem.

---
### 🔥 Automatikus kudarc

- Tulajdonságpróbára
- Képzettségpróbára

Az adott Tulajdonságra/Képzettségre nem is dobhatsz próbát, azonnali kudarc.

Példa: csábítás **Befolyásolás-próba** borzasztó büdösen.

---
### 🔥 Automatikus tulajdonság/képzettségpróba

Sima próbadobás (Tulajdonságpróba, Képzettségpróba)

Ami másnak automatikus siker, az neked sima próbadobás.

---
### 🔥 Beszédvesztés - részleges

- Nehezen tudsz szavakat formálni
- Varázslásnál: Extra Összpontositas próba (Nehéz). Ha megvan, sikerül a hang komponenst kimondani

### 🔥 Beszédvesztés - teljes

- Képtelen vagy beszéddel hangot kiadni magadból, még egy nyikkanást sem.
- Mágia hangalapú komponensét sem tudod alkalmazni

---
### 🔥 Érzék - zavart

Látás, Hallás, Szaglás.

```
Hátrány-1 minden adott érzéken
  alapuló tulajdonságpróbára és
  képzettségpróbánál
```

### 🔥 Érzék - részleges

```
Hátrány-2 minden adott érzéken
  alapuló tulajdonságpróbára és
  képzettségpróbánál
```

### 🔥 Érzék - teljes

```
Automatikus sikertelenség
minden adott érzéken alapuló
próbára.
```

<br />

---
### 🔥 `FP S1`

Az `S1` Egészség kategória összes rubrikája feltöltődik új [FP](061_02_faradsag_pont.md) jelölőkkel.

### 🔥 `FP S2`

Az `S1` ÉS `S2` Egészség kategóriák összes rubrikája feltöltődik új [FP](061_02_faradsag_pont.md) jelölőkkel.

<br />

---
### 🔥 Harcképtelenség

- Tudsz mozogni, menni, de harcolni nem
- `Védő Értéked` a mozgásod jellegétől függ (lásd a [táblázatot](065_01_harci_helyzetek.md#%C3%A9szrev%C3%A9tlen-t%C3%A1mad%C3%A1s))


---
### 🔥 Kezdeményezés - lassú

`Hátrány-1` jár Kezdeményező dobásodra.

### 🔥 Kezdeményezés - nagyon lassú

`Hátrány-2` jár Kezdeményező dobásodra.

<br />

---
### 🔥 Mozgás - lassulás

- [Mozgás](063_03_mozgas_harc_kozben.md) értéked feleződik ↑ - harcon belül
- Felére csökken a megtehető távolságod - harcon kívül

---
### 🔥 Mozgás - lecövekelt

Valamilyen okból nem tudsz helyet változtatni. A testrészeid mozgását nem befolyásolja.

---
### 🔥 Mozgás - képtelen

- VÉ csak a test mozgásának jellegétől függ (lásd a [táblázatot](065_01_harci_helyzetek.md#%C3%A9szrev%C3%A9tlen-t%C3%A1mad%C3%A1s))
- mozdulni se bírsz nyaktól lefelé
- szemmozgás, légzés működik
- csak fizikai hatás, mentális hatása nincs

<br />

---
### 🔥 Pszi használat elvesztése

Képtelen vagy bármilyen diszciplína végzésére, fenntartására. Az Aurádra nincs hatással.

<br />


---
### 🔥 Sebzés csökkentett

```
k20+0 SP
```

<br />

---
### 🔥 `1` támadás elvesztése

```
-1 támadás a körben
(min 1)
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

<br />

---
### 🔥 VÉ csökkentés bónusz `+[1;2]`

Védő Érték csökkentésedhez `1`-től `2`-ig terjedő bónuszt kapsz.

<br />

---
### 🔥 VÉ csökkentés: `X`

Ellenfeled Védő Értékét csökkented `X` értékkel.


---
### 🔥 Vérzés - gyenge
  
```
- 1 ÉP / 10 perc
- harcban nem számít
```

---
### 🔥 Vérzés - közepes

```
1 ÉP / 2 kör
```

---
### 🔥 Vérzés - erős

```
1 ÉP / kör
```

---

🔗 [Státuszok](082_statuszok.md) →

⚜️ [Nyitóoldal](start.md#8-hat%C3%A1sok-%C3%A9s-st%C3%A1tuszok)
