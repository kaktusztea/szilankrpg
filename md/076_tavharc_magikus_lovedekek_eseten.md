## Távolsági harc mágikus lövedékek esetén

A mágiatudók gyakran távolból, saját Aurájukból kicsapva, máskor egy távolabbi pontból indítanak különféle mágikus támadást ellenfeleik felé, amely fizikai sebesülést okoz. De hogyan történik ilyenkor a célzás, milyen sebességgel halad a lövedék, milyen nehéz a kontroll? Erre adunk választ az alábbiakban.

[Mágikus Célzás](kepzettsegek.primer.harci/magikus_celzas.md) **harcmodor** felvétele szükséges célzott mágikus hatások létrehozásához.

## Célzó érték, Osztó

```
+ CÉ Alap
  (TSz + Gyorsaság + Intelligencia)
+ CHM
+ CÉ: (1-4) Mágikus lövedék
+ CÉ: (0-3) Formánk értéke
```

### Mágikus lövedék Értékei

```
Mágikus lövedék I
 CÉ:+1
 Osztó: 0,5

Mágikus lövedék II
 CÉ:+2
 Osztó: 1

Mágikus lövedék III
 CÉ:+3
 Osztó: 2
 
Mágikus lövedék IV
 CÉ:+4
 Osztó: 3
```

A **Mágikus lövedék `I-IV`** valójában `1 db` fegyver, amely `4` különböző értékkel rendelkezhet, a [Pontos csatamágia](fortelyok.misztikus/pontos_csatamagia.md) fortély fokától függően. A [Karakteralkotó](start.md#karakteralkot%C3%B3) fegyverválasztójában azt a verzióját használd, amely megfelel a **Pontos csatamágia** fortélyod fokának.

A **Mágikus lövedék** szimulálja a távolsági fegyver kategóriákat.

### Formák `CÉ` módosítói

Távolba ható csapásként az egyes formák különböző `Célzó Érték` módosítókkal bírnak és más sebzésablakkal (min, max) rendelkeznek,. Például a Nyíl forma a legalkalmasabb a pontos célzásra, de kisebb maximális sebzéssel bír.

```
Lövedékkent
CÉ, Forma

3: Nyíl
   Alap sebzés: +0
   Max sebzés: +7
1: Csóva
0: Gömb
   Alap sebzés: +5
   Max sebzés: +20
0: Zápor
```


```
Távoli pontban
CÉ, Forma

0: Kitörés
   Alap sebzés: +0
   Max sebzés: +20
```

<br />

---
## Fegyver: Mágikus lövedék

**Jellemzők**

```
→ Mágikus célzás kell
→ Távolsággal gyengül
  -1E / 5 méter

→ Mellékhatás mágiatudó körül
  látható csak lövésig
```

**Aura**

```
1. Nem kell kinyúlni Aurával
  (varázslótól indul)

2. Lehet kinyúlva máshonnan,
   más szögből indítani 
   ( +Nehézség )

```

**Ellen Észleléspróba harc közben**

```
Könnyű nehézség
```

<br />

---
## Fegyver: Mágia adott pontban

Egy távoli pontban létrehozott elemi mágia.

**Jellemzők**

```
→ Mágikus célzás kell
→ Alap Erősség, nem gyengül

→ Mágiatudó és cél közt auraszál
  mellékhatással látható míg
  a mana gyűlik. Könnyű kitérni.
```

**Szorzó módosítók**
```
+1x: más szögből indított lövedék

+1x / 3 méter távolság ↓
  → varázstudótól távolabbi pontból
    indított lövedék
  → ⚡ Példa: 3x
    10 méter távolságra a
    varázstudótól induljon tűznyíl
```

**Aura**

```
→ Ki kell nyúlni
→ Lassú létrehozás
→ Látszik az auraszál ha nincs leplezve
→ Nem gyengül a távolsággal (Előny)
```

**Ellen Észleléspróba harc közben**

```
Átlagos nehézség
```

**Kizárólagos formák**

```
kitörés, fal, ...
```


⭕ [Work in progress](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.magikus.celzas#fegyver-m%C3%A1gia-adott-pontban)

<br />

---
### [Mesterfegyver](fortelyok.harci/mesterfegyver.md) fortély és mágikus fegyverek

Ez a fortély a mágikus fegyverekre is felvehető, akár bármely más fegyverre.

```
+1 CÉ / fok
```

---
### [Mágikus lövedék gyorsítása](https://github.com/kaktusztea/szilankrpg/blob/master/md/fortelyok.misztikus/magikus_lovedek_gyorsitasa.md)

A lövedék sebessége alapból lassú, de ezzel a fortéllyal növelni lehet.

Kapcsolódik: [Szándékos kitérés lövés elől](075_tavharc_taktikak.md#sz%C3%A1nd%C3%A9kos-kit%C3%A9r%C3%A9s-l%C3%B6v%C3%A9s-el%C5%91l)

---
## Kapcsolódó Arkánumok

[Elemi mágia - Formulák - Őselem idézése](https://github.com/kaktusztea/szilankrpg/blob/master/md/kepzettsegek.primer.arkanumok/elemi_magia.md#őselem-idézése)
