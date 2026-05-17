## Példa egy páncél leírására

**JK**: "Milyen a talált páncél?"

**KM**: "Ez egy Sodrony páncél. Alapanyaga acél, Ideája `-1 (SFÉ)`, Kidolgozottsága Pocsék.

Három tagot látsz: mellvért-darabot, felkar-tagot, alkar-tagot. Méretben passzol rád, nem kapsz extra büntetést."

---
## ⚡Példa 1: Átlagos páncél

A lehető legátlagosabb sodronying, fejen (sisak) és lábszárakon **kívül** mindent beborít.

Tehát a lefedettség `80%`: mellkas (`50%`), felkar (`10%`), alkar (`10%`), combok (`10%`). A példában most csak a `Fizikai SFÉ` értékét számoljuk.

### SFÉ: `10`

```
Struktúra: Sodronying

10: Alap
+0: Idea átlagos
+0: Acél Alapanyag
```

### MGT: `9`

```
Védett terület: 80%
  +50%: torzó
  +30%: felkar, alkarok, combok
        (3 x 10%)
```

```
MGT: 9
 +8: Sodronying
 +3 (+1 MGT / tag) (átlagos)
 -2: Erő MGT csökkentése
```

### Ár: `16x`

```
Torzó: 10x ár
  10x (Struktúra Sodrony)
   1x (Alapanyag: Acél)
   1x (Idea: Átlagos)
```

```
Csatolt tagok ára: 6x ár
  1/5x (1db alap szorzója)
  10x  (Torzó ár)
   1x  (Kidolgozottság "átlagos")
   3x  (Csatolt tagok db)
```

```
Végleges ár: 13x
  10x + 6x
```

Azaz egy átlagos bőr torzódarab `16`-szeresének megfelelő pénzbe kerül a fenti teljes sodrony páncélszett.

<br />

---
## ⚡Példa 2: Legvacakabb teljes lemezvért

... amiben a lehető legnehezebb mozogni (Alapanyaga: bronz; Ideája a legvacakabb és még a tagok Kidolgozottsága is: pocsék).

```
Lefedettség: 100%
```

### SFÉ: `12`

```
Struktúra: Lemezpáncél
 +20: Alap SFÉ
  -3: Idea leggyengébb
  -5: Alapanyag: Bronz
```

### MGT: `26`

```
Védett terület: 100%
  +50%: torzó
  +50%: felkar, alkarok, combok,
        lábszárak, fej
        (5 x 10%)
```

```
MGT: 26
+10: Lemez
 +2: Bronz
+15 (+3 MGT / tag) (pocsék)
 -1: Erő MGT csökkentése
```

### Ár: `7,5x`

```
Torzó: 5x ár
  100x (Struktúra Lemez)
  0,5x (Alapanyag: Bronz)
  0,1x (Idea vacak)

(100x x 0,5x x 0,1)
```

```
Csatolt tagok ára: 2,5x
  1/5x (1db alap szorzója)
  5x   (Torzó ár)
  0,5x (Kidolgozottság "pocsék")
  5x   (Csatolt tagok db)
```

```
Végleges ár: 7,5x
  (5x + 2,5x)
```

 Azaz egy átlagos bőr mellvért árának `7,5`-szeresének megfelelő pénzbe kerül a fenti teljes gyatra páncélszett.

---

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
