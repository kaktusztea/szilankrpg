## Távolsági harc csatamagia esetén

A mágiatudók gyakran távolból, saját Aurájukból kicsapva, máskor egy távolabbi pontból indítanak különféle mágikus támadást ellenfeleik felé, amely fizikai sebesülést okoz. De hogyan történik ilyenkor a célzás, milyen sebességgel halad a lövedék, milyen nehéz a kontroll? Erre adunk választ az alábbiakban.

[Mágikus Célzás](kepzettsegek.primer.harci/magikus_celzas.md) **harcmodor**: ennek felvétele szükséges célzott mágikus hatások létrehozásához.

**Kapcsolódik**

- [Mágiatáv növelés](fortelyok.misztikus/magiatav_noveles.md) fortély
- [Mágikus lövedék gyorsítása](fortelyok.misztikus/magikus_lovedek_gyorsitasa.md) fortély

<br />

---
## Célzó érték, Osztó

```
+ CÉ Alap
  (TSz + Gyorsaság + Intelligencia)
+ CHM
+ CÉ: (1-4) Mágiatáv I-IV
+ CÉ: (0-3) Mesterfegyver (Mágiatáv) foka
+ CÉ: (0-3) Forma egyedi értéke
```

### Mágiatáv Értékei

```
Mágiatáv I
 CÉ:+1
 Osztó: 0.5

Mágiatáv II
 CÉ:+2
 Osztó: 1

Mágiatáv III
 CÉ:+3
 Osztó: 2
 
Mágiatáv IV
 CÉ:+4
 Osztó: 3
```

A **Mágiatáv `I-IV`** valójában `1 db` virtuális "fegyver", amely `4` különböző értékkel rendelkezhet, a [Mágiatáv növelés](fortelyok.misztikus/magiatav_noveles.md) fortély fokától függően. A [Karakteralkotó](start.md#karakteralkot%C3%B3) fegyverválasztójában azt a verzióját használd, amely megfelel a **Mágiatáv növelés** fortélyod fokának.

A **Mágiatáv** szimulálja a (mágikus) távolsági "fegyver" kategóriákat ("tárgy, hajító, nyíl, nyílpuska").

### Formák `CÉ` módosítói

Távolba ható csapásként az egyes formák különböző `Célzó Érték` módosítókkal bírnak és más maximális Sebzéssel rendelkeznek,. Például a Nyíl forma a legalkalmasabb a pontos célzásra, de kisebb maximális sebzéssel bír, mert kisebb energiát képes összpontosítani, mint mondjuk egy tűzgolyó.

```
Távolbahatás módja: Lövedék

+3 CÉ: Nyíl
       Max sebzés: +7
+1 CÉ: Csóva
       Max sebzés: ⭕??
+0 CÉ: Gömb
       Max sebzés: +20
+0 CÉ: Zápor
       Max sebzés: ⭕??
```


```
Távolbahatás módja: Területmágia

+0 CÉ: Kitörés
       Max sebzés: +20
```

<br />

---
## ⚜️Távolbahatás módja: Lövedék

```
→ Mágikus célzás kell
→ Aura ereje: alap (nem gyengül)
→ Erősség távolsággal gyengül
  -1E / 5 méter

→ Mellékhatás: mágiatudó körül
  látható csak lövésig. Alacsonyabb
  észlelhetőség.

→ Ellen Észleléspróba harc közben:
  Átlagos nehézség (9)
```

### Indítás pontja

#### `1.` Auratestből

Varázslótól indul. Nincs Célzásnál Szorzó nehezítés.

#### `2.` Aurával kinyúlva máshonnan, vagy más szögből indítani 

```
Szorzó nehezítés

+1x: más szögből indított lövedék

+1x / 5 méter távolság ↓
  → varázstudótól távolabbi pontból
    indított lövedék
```

```
⚡ Példa: +4x
+3x: 15 méter távolságra a
     varázstudótól induljon tűznyíl
+1x: más szögben induljon
```

### Kizárólagos formák - Lövedék

Ezek a formák csak **Lövedék** formában hozhatóak létre.

```
nyíl, ... ⭕
```

<br />

---
## ⚜️Távolbahatás módja: Területmágia

```
→ Mágikus célzás kell
→ Aura akarata: távolsággal gyengül
→ Erősség: alap (nem gyengül)

→ Mellékhatás: mágiatudó és cél közt
  Auraszál látható míg a mana gyűlik.
  Hha nincs leplezve. Könnyű kitérni.

→ Lassabb létrehozás

→ Ellen Észleléspróba harc közben:
  Könnyű nehézség (6)
```

### Indítás pontja

```
Ki kell nyúlni a távoli ponthoz,
a hatás rögtön ott jön létre.
→ Aura akarata: távolsággal gyengül
```

### Kizárólagos formák - Területmágia

Ezek a formák csak "**Területmágia**" távolbahatással hozhatóak létre.

```
kitörés, fal, ...⭕
```

<br />

---
### [Mesterfegyver](fortelyok.harci/mesterfegyver.md) fortély és mágikus fegyverek

Ez a fortély a **Mágiatáv** "fegyverre" is felvehető, akár bármely más fegyverre.

```
+1 CÉ / fok
```

---
### [Mágikus lövedék gyorsítása](https://github.com/kaktusztea/szilankrpg/blob/master/md/fortelyok.misztikus/magikus_lovedek_gyorsitasa.md) fortély

A lövedék sebessége alapból lassú, ezt a Komplexitás növelésével lehet fokozni. Ebben ad könnyítést ez a fortély. A pontosságra (`CÉ`, `Osztó`) semmilyen hatása nincs.

Kapcsolódik: [Szándékos kitérés lövés elől](075_tavharc_taktikak.md#sz%C3%A1nd%C3%A9kos-kit%C3%A9r%C3%A9s-l%C3%B6v%C3%A9s-el%C5%91l)

---
## Kapcsolódó Arkánumok

[Elemi mágia - Formulák - Őselem idézése](https://github.com/kaktusztea/szilankrpg/blob/master/md/kepzettsegek.primer.arkanumok/elemi_magia.md#őselem-idézése)
