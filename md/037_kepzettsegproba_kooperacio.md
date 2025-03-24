## Kooperáció, csoportmunka képzettségpróbánál

Mikor nem egy, hanem több karakter, csapatban próbál megoldani egy próbát, akkor kell az alábbi mechanikákhoz nyúlnunk. Három esetet különbözetünk meg: 

- ⚜️ 1. Csoportos fizikai próbatétel
- ⚜️ 2. Csoportos szellemi próbatétel
- ⚜️ 3. Csapatmunka egy komplex feladat különböző kiosztott részfeladatokkal

---
### ⚜️ 1. Csoportos fizikai próbatétel

```
Dobás:
 MIN( képzettség + Tulajdonság )
 - társak büntetése
```

Ez a csoportos kooperáció nehezebb formája, itt a “leggyengébb láncszem” határozza meg a próbadobást, azaz aki a csapatban legképzetlenebb.

A csapat a tagjának legalacsonyabb `(képzettség szint + Tulajdonság)`értékével dobja a próbát. A rontás az egész csapat rontását jelenti.

Ez tipikusan a "Ne csesszük el" típusú próba. ⚡Példa: csoportos Lopakodás.

#### Társak büntetései

Ha a "kripli kommandóban" többen is vannak, azaz többen bírnak a leggyengébb személy képzettség szintjével hasonló értékkel, az tovább rontja az esélyeket.

```
-1 büntetés / személy

Max -3 büntetés
```

Minden társ `-1` büntetést ad a dobáshoz, amennyiben megfelel a lenti követelményeknek. Legfeljebb `-3` büntetés érhető így el.

#### Társ követelménye

```
(Képzettség-szint + Tulajdonság)
  értéke max 3 pont távolságra van
  a dobó személy értékétől
```

⚡ Példa: legképzetlenebb személy `Képzettség-szint + Tulajdonság` értéke: `4`\
Ilyenkor a `5, 6` és `7` értékkel bíró emberek beszámítanak fejenként `-1` büntetés pontnak. Legfeljebb `-3` büntetés pont érthető így el összesen, tehát a csoport `4-3 = 1` értékre dob `k10` kockával legrosszabb esetben.

🔆 Koordinátor fortély

A fenti büntetést a [Koordinátor](fortelyok.altalanos/koordinator.md) fortély segítségével csökkenthetjük.

<br />

---
### ⚜️ 2. Csoportos szellemi próbatétel

```
Dobás:
 MAX( Képzettség-szint + Tulajdonság )
```

"Összedugjuk a fejünket", hogy sikerüljön egy szellemi probléma megoldása. Ebben az esetben mindenki ugyanahhoz - a próbában érintett - képzettséghez ért és a csapat tagjai a közös tudás előnyeit hasznosítják. A csapatból az dob, akinek legnagyobb a `Képzettség szint + Tulajdonság` értéke és ehhez jönnek a segítők bónuszai.

#### Segítők bónuszai

```
+1 bónusz / személy

Max +3 bónusz
```

Minden segítő `+1` bónuszt ad a dobáshoz, amennyiben megfelel a követelményeknek. Legfeljebb `+3` bónusz érhető így el.

#### Segítő követelménye

```
(Képzettség-szint + Tulajdonság)
  értéke max 3 pont távolságra lehet
  a dobó személy értékétől
```

⚡ Példa: legképzettebb személy `Képzettség-szint + Tulajdonság` értéke: `9`\
Ilyenkor a `8, 7` és `6` értékkel bíró emberek beszámítanak fejenként `+1` pontnak. Legfeljebb `+3` bónusz érthető így el összesen, tehát a csoport `9+3 = 12` értékre dob `k10` kockával optimális esetben.

A fent említett `+3` limit növelhető a **Koordinátor** fortéllyal.

#### 🔆 Koordinátor fortély

A fenti limit határt a [Koordinátor](fortelyok.altalanos/koordinator.md) fortély segítségével emelhetjük.

<br />

---
### ⚜️ 3. Csapatmunka egy komplex feladat különböző kiosztott részfeladatokkal

```
több ismeretre
→ több képzettségpróba
  célszám (lista) 
```

Ez a leginkább magától értetődő eset. Egy komplex feladatnál több képzettségre, vagy (képzettéség+fortély) kiterjesztés kombinációra lehet szükség.

A KM felsorolja, milyen ismeretekre van szükség és mik külön-külön a célszámok a komplex feladat elemeinek elvégzéséhez.

Ezt követően a parti "összedobja, amije van". Az esetleges hiányok kezelését a KM kezeli, lehet, hogy az adott részfeladatot csak alacsonyabb szinten tudják megoldani.

A csoportos munka miatt a végrehajtás ideje jelentősen csökkenhet.

⚡Példa: Több "rétegű" térkép készítés, Ház építése.
