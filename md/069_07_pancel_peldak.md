## Példa egy páncél leírására

**JK**: "Milyen a páncélja?"

**KM**: "Ez egy Sodrony páncél. Alapanyaga acél, Ideája (`-1 SFÉ`), Kidolgozottsága Pocsék.

Három tagot látsz: mellvért-darabot, felkar-tagot, alkar-tagot. Méretben passzol rád, nem kapsz extra büntetést."

---
## ⚡Példa 1: Átlagos páncél

A lehető legátlagosabb sodronying, fejen (sisak) és lábszárakon **kívül** mindent beborít.

Tehát a lefedettség `80%`: mellkas (`50%`), felkar (`10%`), alkar (`10%`), combok (`10%`). Most csak a Fizikai SFÉ értékét nézzük.

### SFÉ: `10`

```
Struktúra: Sodronying

Alap SFÉ: 10
+0 SFÉ: Idea átlagos
+0 SFÉ: Alapanyag: Acél

Végső SFÉ: 10
```

### MGT: `9`

```
Védett terület:
  torzó +
  felkar, alkarok, combok (3)
```

```
MGT: 9
+8: Sodronying
+3 (+1 MGT / tag) (pocsék)
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

  1/5x
  10x (Torzó ár)
   1x (Kidolgozottság "átlagos")
   3x (Csatolt tagok db)
```

```
Végleges ár: 13x
  10x + 6x
```

Azaz egy átlagos bőr torzódarab `16`-szorosába kerül a fenti teljes páncélkombó.

<br />

---
## ⚡Példa 2: Legvacakabb teljes lemezvért

... amiben a lehető legnehezebb mozogni (Alapanyaga: bronz; Ideája a legvacakabb és még a tagok Kidolgozottsága: pocsék).

Mindent lefed (`100%`).

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
  torzó (50%) +
  felkar, alkarok, combok,
  lábszárak, fej (5x10%)
```

```
MGT: 26
+10: Lemez
 +2: Bronz
+15 (+3 MGT / tag)
   Kidolgozottság pocsék
 -1: Erő MGT csökkentése
```

### Ár: `7,5x`

```
Torzó: 5x ár

→ 100x (Struktúra Lemez)
→ 0,5x (Alapanyag: Bronz)
→ 0,1x (Idea vacak)

(100x x 0,5x x 0,1)
```

```
Csatolt tagok ára: 2,5x

x 1/5
x 5   (Torzó ár)
x 0,5 (Kidolgozottság "pocsék")
x 5   (Csatolt tagok db)
```

```
Végleges ár: 7,5x
  (5x + 2,5x)
```

 Azaz egy átlagos bőr mellvért árának `7,5`-szeresének megfelelő pénzbe kerül a fenti **teljes** gyatra páncél-kombó.

---

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
