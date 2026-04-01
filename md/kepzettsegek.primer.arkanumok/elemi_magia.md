## Elemi mágia arkánum

Ősi nyelv: ⭕?

Az **Anyag** szféra alá tartozó arkánum.

```
Képzettség

1.szint
  Követelmény: Önuralom 0
  1-2.szintig csak elméleti ismeret

3.szint
  Követelmény: ???
  Már varázsolhat Elemi mágia
    mozaikokból a tanuló.

6.szint
  Követelmény: ???
  A varázsló már idézhet elementált.

9.szint
  Követelmény: ???
  A varázsló képes kommunikálni
    egy választott sík lényeivel.*
 Külön fortély felvehető:
   "Elemi sík nyelve"
   (plusz választott nyelv)⭕

12.szint
  Követelmény: ???
  A varázsló megpróbálhat
    síkurat idézni

15.szint
  Követelmény: ???
```

## Kísérőjelenségek

⭕TODO

Tűzvarázslat előtt lehül a levegő (a hőt kivonja a környezetből)

---
## Formulák

⭕TODO: Bevezető

## ✨Őselem idézése

### Erősség

Ez is képzettségpróba.

```
Erősség: 1
  Sebzés: k20 - 5
Erősség: 2
  Sebzés: k20 - 4
Erősség: 3
  Sebzés: k20 - 3
Erősség: 4
  Sebzés: k20 - 2
Erősség: 5
  Sebzés: k20 - 1
Erősség: 6
  Sebzés: k20 + 0
Erősség: 7
  Sebzés: k20 + 1
Erősség: 8
  Sebzés: k20 + 2
Erősség: 9
  Sebzés: k20 + 3
Erősség: 10
  Sebzés: k20 + 4
Erősség: 11
  Sebzés: k20 + 5
Erősség: 12
  Sebzés: k20 + 6
Erősség: 13
  Sebzés: k20 + 7
Erősség: 14
  Sebzés: k20 + 8
Erősség: 15
  Sebzés: k20 + 9
Erősség: 16
  Sebzés: k20 + 10
Erősség: 17
  Sebzés: k20 + 11
Erősség: 18
  Sebzés: k20 + 12
Erősség: 19
  Sebzés: k20 + 13
Erősség: 20
  Sebzés: k20 + 14

Erősség: 21
  Sebzés: k20 + 15
```

### Időtartam

```
Alapeset: 1 kör

Kitolása Erősség növelésével
```

⭕TODO⭕: hivatkozás mágiaelmélet oldalra.

### Komplexitás - formák

```
Alapvető formák
  +Komplexitás: 4
  Gömb, nyíl, kitörés,
    szőnyeg, fal

Haladó formák
  +Komplexitás: 6
  Példák: aura, sátor,
    zápor, csóva, kard

Szabad formák
  +Komplexitás: 8
  ⭕TODO⭕lehet, hogy túl szigorú?

Forma szétválasztása több részre
  +Komplexitás: +3 / rész

Méret átmérő növelés
  Példa: "gömb" méter átmérője növeli
    a varázslat Erősségét minden
    méter átmérő növeléssel.
  Ettől a sebzés nem csökken.
```

⭕Összpontosítás próba nehézsége is nő, nem csak a Komplexitás⭕

<br />

### Komplexitás - mozgatás

Ha az idézett forma közelharcba kezd az áldozattal, `TÉ` jellemzőt nyer. Ilyenkor az védekező oldalon az alap VÉ számít csak (ha nem mágikus a fegyver).

```
Lassú mozgatás
(Kocogó ember sebessége)
  +Komplexitás: +3
  KÉ=10
  TÉ=10; VÉ=30*

Átlagos mozgatás
(Futó ember sebessége)
  +Komplexitás: +6
  KÉ=15
  TÉ=20; VÉ=40*

Gyors mozgatás
(Sprintelő ember sebessége)
  +Komplexitás: +6
  KÉ=10
  TÉ=20; VÉ=40*

Sebes mozgatás
  +Komplexitás: +9
  KÉ=20
  TÉ=30; VÉ=50*
  CÉ=2, Osztó: 1

Villámgyors mozgatás,
  +Komplexitás: +12
  KÉ=25
  TÉ=40; VÉ=60*

Leggyorsabb mozgatás,
  +Komplexitás: +15
  KÉ=30
  TÉ=60; VÉ=80*
```

🔆Fontos: az idézett forma `TÉ/VÉ` értéke nem lehet nagyobb a varázsló harcértékeinél - kivéve, ha mentálisan összeköt egy képzettebb harcost a varázslattal. Az ilyesmi már igazán magas szintű mágiának számít.


⭕TODO: Link [Mágia célzására](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.magia.celzasa), ha bekerül a fő doksiba.

⭕TODO: Méret módosító: ez is link a Mágia alaptörvényeire - ha kész lesz.

### Formák mérete és erőssége

Ha ez értelmezhető, akkor a formák méreténél a legnagyobb átmérőre vonatkoztatunk. Maximálisan annyi méter lehet a legnagyobb átmérő, mint amekkora a mozaik _Erőssége_. Viszont, ha növeljük az átmérőt, akkor az erősség is megoszlik a területen.

⚡**Példa**: egy `3` méter magas tűzfalat hoz létre `6E`-vel a varázsló. A tűzfal hatása ekkor `2E`-nek felel meg.

### Hatás-eloszlás

⭕(a Manamentes modellhez)⭕

A fenti példánál az ez `3`, mert annyira "nyújtja ki" a varázsló.

### Sebződés

⭕Ez is kérdéses még, nem könnyű eldönteni, hogy random is legyen, de közben meg sok se legyen. Az alap sebzés a sebző elemmel való 2 szegmenses érintkezést jelenti kivéve a nyíl és a kitörés formát, ahol a sebzés egyben, azonnal történik. Ha a 2 szegmensnél tovább tartózkodik valaki az elemmel érintkezésben, akkor a többszörös idő többszörös sebzést okoz. 1 kör például már 5x-ös sebzést! Viszont nem fog senki egy tűzgolyóban álldogálni valószínűleg.⭕

---
### ⚡Példavarázslat: Gyors tűzgolyó

```
Komplexitás = 13
  + 4 (gömb)
  + 9 (gyors)
TÉ=30
```

---
### ⚡Veszedelmes 2 fejű tűzsárkány

```
Komplexitás = 18
+6: Szabad forma
+3: két fej = 2 rész
+9: gyors

(+3: plusz fejenként)

TÉ=30
```

A sárkány irányításához **Összpontosítás** próba is dobatható (KM határozza meg a célszámot)

---
### ⚡Lecsapó tűzkígyó

```
Komplexitás = 14
6: Szabad forma
8: Villámgyors

TÉ = 60
```



<br />

---
---
## ✨Elementál idézése

```
Szolga
  Erősség: 10
  Komplexitás: 10

Harcos
  Erősség: 14
  Komplexitás: 14

Fejedelem
  Erősség: 17
  Komplexitás: 17

Síkúr
  Erősség: 20
  Komplexitás: 20
```

A megidézett elementálokra mentálisan, vagy asztrálisan hatni a következő követelményekkel lehet:

```
Elemi mágia – 9.szint
Mentál/Asztrálmágia – 9.szint
```

---
## ✨Elementál űzése

- Mana: lénytől függ
- Komplexitás: lénytől függ
- Időtartam: ⭕???⭕

```
Szolga
  Erősség: 12
  Komplexitás: 12
  Ha elementál maradni akar:
    +Komplexitás: +3

Harcos
  Erősség: 16
  Komplexitás: 16
  Ha Elementál menni akar:
    +Komplexitás: +0

Fejedelem
  Erősség: 18
  Komplexitás: 19

Síkúr
  Erősség: 22
  Komplexitás: 22
```

---
## ✨Őselem megkötése anyagban

⭕TODO⭕

Magas szinten ennél jönne elő pl. a tűzalak, vízalak, földalak, légies alak

⭕(ez azért jó, mert pl. a Vulgármágiában van sima tűzalak, ami könnyebb is, de célvarázslat, míg itt sokkal szabadabb a varázsló, de nagyobb a varázslat költsége.)
