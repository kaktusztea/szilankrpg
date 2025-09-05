## Aura, Mágia Akarata, Mágiaellenállás

<sub>→ [STUDY oldal](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.magia.Aura) </sub>

Minden lélekkel rendelkező lény rendelkezik Aurával, amely az Erők Síkján öleli körbe, védelmezi a lelket. Az Aura a karakterek mágikus akarata és egyben Mágiaellenállása is (Asztrál, Mentál, Fizikai).

### Aura Alap

```
Aura Alap  =  Tsz x 2
```

Az **Aura Alap** az Aura része, annak "bázisa", ami mindig jelen van. Egy karakter élete során megedződik, sokat tapasztal. Az **Aura Alap** értéke ebből a tapasztalásból származik, nem igényel semmilyen tanult képzettséget - értéke a **Tapasztalati Szint** (TSz) emelkedésével automatikusan nő.

### Aurafejlesztés képzettség

Az **Aura Alapon** felül lehetséges - védelmi, vagy mágikus célokból - konkrét gyakorlati képzéssel továbbfejleszteni az Aura erejét. Ezt reprezentálja az [Aurafejlesztés](kepzettsegek.primer.misztikus/aurafejlesztes.md) képzettség.

<br />

---
### Aura aktuális értéke

Az aktuális **Aura** értékére az [Aurafejlesztés](kepzettsegek.primer.misztikus/aurafejlesztes.md) képzettség ad, adhat további pontokat - erre a játékosnak is aktív ráhatása van.

```
Aura = Aura Alap
     + Aurafejlesztés próba eredménye
     - Aura kiterjesztés
```

```
Aurafejlesztés próba:
 Aurafejlesztés + Önuralom +k10
```

Az **Aura** egy változó érték, amit úgy kapunk meg, hogy a varázsló és a védekező fél is **Aurafejlesztés** képzettségpróbát dob az **általa önként kiválasztott Nehézségre**. Természetesen választhatják a **biztos tudás**t is, amit az `1`-es dobás (`k10`) által elérhető maximum jelent - ilyenkor nyilván nem kell dobni sem. ⭕TODO: tisztázni, egyértelműsíteni⭕Ez a "**Biztos Aura**" a támadó felől, és a "**Tudatalatti Mágiaellenállás**" a védekező fél felől.

```
Aura számítása

Aurafejlesztés Célszámok
3  →  2 + Aura alap
6  →  5 + Aura alap
9  →  10 + Aura alap
12 →  15 + Aura alap
15 →  20 + Aura alap
18 →  25 + Aura alap
21 →  30 + Aura alap
24 →  35 + Aura alap
27 →  40 + Aura alap
30 →  45 + Aura alap
```


```
Ha sikerül a próba:
 Aura = érték a táblázatból

Ha nem sikerül a próba:
 Aura = Aura Alap
```

Tehát a **Mágia Akaratát** és a **Mágiaellenállást** azonos módon kell meghatározni.

<br />

### Rontott Aurafejlesztés próba

⭕ más név?

Ha a fent tárgyalt Aurafejlesztés próbát elrontotta a karakter, további negatív hatásokkal kell szembesülnie:

**Védekező**: 1 körig csak az Alap Aurája számít (`2x TSz`), ez idő alatt nem dobhat magasabb **Aura** érték meghatározására.

**Mágiatudó**: ugyanaz, mint a Védekezőnél + `1 körig` nem képes varázsolni sem!

<br />

---
### Mágia Akarata vs Mágiaellenállás

```
Mágia Akarata  vs  Mágiaellenállás
               =
   Támadó Aura vs Védekező Aura
```

Varázsláskor a varázsló és a védekező fél is meghatározza **Aura** értékékét és ezeket vetik össze. A támadónál ezt **Mágia Akaratának**, a védekezőnél **Mágiaellenállásnak** nevezzük.

Ha a **Mágia Akarata** eléri, vagy meghaladja a **Mágiellenállás** értékét, akkor a mágia átjutott a védelmen és kifejti hatását.

A Mágiaellenállás egységes, nincs külön asztrál/mentál ellenállás, vagy "pajzs". Az **Aura** mind az **Asztrál**, **Mentál** és **Fizikai** síkon érkező befolyásoló/változtató hatás ellen védelmet nyújt. Egyes hatásokkal szemben alkalmanként gyengébb/erősebb lehet.

---
### Tudatalatti mágiaellenállás (TME) / Biztos Aura

Amennyiben az áldozat nem tud róla, hogy varázsolnak rá, olyankor a **Tudatalatti Mágiaellenállása** érvényesül, amely a biztos tudásból meglevő **Aura** értékével számol (tehát ha k10-en `1`-es dobott volna, akkor mit ért volna el a próbán). Ugyanígy számoljuk ki a **Biztos Aura** értékét is - a támadó szempontjából.

```
Biztos Aura (TME):
  Önuralom + Aurafejlesztés + 1
  → X Aura
```

<br />

---
### Mágiaellenállás változása

A Mágiaellenállás nem statikus, körülménytől hangulattól függően, események hatására kis mértékben változhat.
Például Meglepődés / Harc / Érzelmi sokk / másra koncentrálás közben ideiglenesen csökkenhet a Mágiaellenállás, mivel egy időben nehezebb védekezni a fizikai és a felsőbb síkokon. 
Ilyen esetekben a KM kérhet **Összpontosítás** próbát, hogy kap -e büntetést a karakter, vagy nem. Alább egy általános táblázat, hogy nagyjából milyen esetben mivel kell számolnia a védekező félnek.

```
Hatások, események módosítói

Érzelmi sokk
  Aura Alap diff: -3  (Asztrális)

Kiégettség
  Aura Alap diff: +1-3 (Asztrális)

Erős koncentrálás másra
  Összpontosítás próba: [6-9-12-15]
  Ha nincs meg, -3 Aura

Harci láz
  Aura Alap diff: +3
  Asztrál/Mentál hatások ellen

Papi védő áldás
  Aura Alap diff: +⭕X⭕ adott hatások ellen

Olyan érzelmi befolyás, ami
  tudat alatt kedvére van a célpontnak
  Aura Alap diff: -3 ilyen Asztrál hatás ellen
```

<br />

---
### Fizikai ellenállás átalakítással szemben

Ha a mágiatudó közvetlenül a célpont testét szeretné átalakítani, akkor nagyobb fába vágta a fejszéjét, mint akár egy sima asztrális befolyásolással. Az ilyen mágia ellen a (fizikai) Mágiaellenáláshoz bónusz járul:

```
Mágiellenállás extra
fizikai behatás ellen

Aura +(2x Edzettség)
```

<br />

---
### ⚡Példa

⭕TODO: hozzáigazítani a doksi változtatásokhoz

#### Varázsló, mint támadó

```
TSz: 7 → Aura Alap = 14
Önuralom: +3
Aurafejlesztés - 7.szint

Biztos Aura (TME) = 24
  + 14 (Aura Alap)
  + 10 (3+7+1)
```

#### Gyanútlan nemesember, mint védekező fél

```
TSz: 5 → Aura Alap = 10
Önuralom: +1
Aurafejlesztés - 5.szint

Biztos Aura (TME) = 15
  +10 (Aura Alap)
  +5  (1+5+1)
```

A varázsló megpróbálja asztrális befolyása alá vonni a nemesembert. Úgy dönt, nem dob, neki elég a Biztos Aura (24), áldozatát jóval gyengébbnek véli.

A nemesember érzékeli az Auraérintést és úgy véli támadója jelentősen erősebb nála - kockázat.
Szeretne `+25`-öt elérni az Aurafejlesztés próbadobás hatására, hogy Aura alapjával együtt `25`-as Aurát (Mágiaellenállást) érjen el (`10+15`).

A `25`-ös Aurához `12`-es célszámot kell megdobnia az `Önuralom + Aurafejlesztés` képzettségpróbán:

```
6 + k10  vs  12
```

Azaz ha legalább `6`-ot dob k10-en, akkor sikerrel jár. Dob: `8`

Ekkor a támadó vs Védő állás így néz ki:

```
24 (Varázsló Mágiájának Akarata)
  vs
25 (Nemesember Mágiaellenálása)
```

A nemesembernek szerencséje volt. Nem tudhatta, mekkora lesz ellenfele Mágiájának Akarata, de jól taktikázott és a kockázatot is megfelelő mederben tartotta. Megpróbálhatott volna `+20` Aura értékre dobni, de mivel annak Nehézsége `15`, így annak megdobására csak `20%` esélye lett volna (`6 + k10  vs 15`).

A mágiatudó csalódottan horkant fel, mágiája csődöt mondott.

---

🔗 [Varázslás módszerek](105_varazslas_modszerek.md) →

⚜️ [Nyitóoldal](start.md#10-m%C3%A1giarendszer-)
