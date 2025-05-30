## Hatások 🔥

A Hatások "elemi" változások, amiket egy karakter elszenved - általában egy **Státusz** viselése következtében.

Egy **Státusz** több **Hatást** is képes okozni a karakteren.  Hogy egy Státusz milyen Hatások listáját okozza, azt a [Státuszok](082_statuszok.md) oldalon találod.

<br />

## ⚜️ Előny-1,2 és Hátrány-1,2 Hatások

```
MIN,MAX: [-2, +2]
```

Az `Előny` és `Hátrány`  speciális, kockadobásokat érintő Hatások.\
Hogy milyen dobást befolyásolnak, az változó - amire épp vonatkoznak:
- Támadó Dobás
- Manőver
- Tulajdonságpróba
- Képzettségpróba (mágia is)
- Sebzés
- Mágia Akarata
- Mágiaellenállás

🔆 Halmozódásuk esetén is az alábbi alsó és felső korlátuk érvényes: `[-2, +2]`.

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
### 🔥 Beszédvesztés -  részleges

- Nem tudsz szavakat formálni, legfeljebb kiáltani: "Hö!"
- Mágia hangalapú komponensét sem tudod alkalmazni
    - ⭕TODO⭕ a mágikus beszéd legyen más, azt ne blokkolja ez a Hatás (?)
    - ⭕TODO⭕ nem a hangszalagok adják ki a mágikus hangot ??

### 🔥 Beszédvesztés - teljes

- Képtelen vagy beszéddel hangot kiadni magadból, még egy nyikkanást sem.
- Mágia hangalapú komponensét sem tudod alkalmazni

---
### 🔥 Gondolkodásképtelenség

⭕TODO⭕

Nem vagy képes gondolkodni - reagálni, tervezni.

---
### 🔥 Harcképtelenség

- Tudsz mozogni, menni, de harcolni nem
- `Védő Értéked` a mozgásod jellegétől függ (lásd a [táblázatot](065_01_harci_helyzetek.md#%C3%A9szrev%C3%A9tlen-t%C3%A1mad%C3%A1s))

---
### 🔥 Mozgás - lassulás

- [Mozgás](063_05_mozgas_harc_kozben.md) értéked feleződik ↑ - harcon belül
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
### 🔥 Reflexek - lassú

Kezdeményezéskor nem dobhatsz, a statikus KÉ értékeddel veszel részt a körben.

### 🔥 Reflexek - lomha ⭕TODO? más név⭕

Kezdeményezéskor dobsz, de az értéket **levonod** (!) a fegyveres KÉ értékedből.

<br />

---
### 🔥 Süketség - részleges

Hallasz, de sokkal rosszabbul. Hallás próbakor... ⭕TODO⭕

### 🔥 Süketség - teljes

⭕TODO⭕

<br />

---
### 🔥 Többszörös támadás elvesztése

```
Max 1 támadás / kör
```

---
### 🔥 Vakság - részleges

⭕TODO: Hatások?⭕

### 🔥 Vakság - teljes

⭕TODO: Hatások?⭕

<br />

---
### 🔥 Varázslás képesség elvesztése

Képtelen vagy bármilyen mágia végzésére, fenntartására. Az Aurádra nincs hatással.

<br />

---
### 🔥 VÉ veszteség duplázódik

Mikor sikertelen támadást adnak le rád, az elszenvedett `VÉ` csökkenésed duplázódik.

<br />

---
### 🔥 VÉ csökkentés duplázódik

Mikor sikertelen támadást adsz le, az okozott `VÉ` csökkentésed duplázódik.

<br />


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
