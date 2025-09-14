## Példa egy páncél leírására

**JK**: „Milyen a páncélja?”

**KM**: „Ez egy Sodrony páncél. Fémalapanyaga acél, Anyagminősége (`-1 SFÉ`), Kidolgozottsága Pocsék.

Három tagot látsz: mellvért-darabot, felkar-tagot, alkar-tagot. Méretben passzol rád, nem kapsz extra büntetést.”

---
## ⚡Példa 1: Átlagos páncél

A lehető legátlagosabb sodronying, fejen (sisak) és lábszárakon **kívül** mindent beborítva.

Tehát a lefedettség `80%`: mellkas (`50%`), felkar (`10%`), alkar (`10%`), combok (`10%`).

### SFÉ

```
Struktúra: Sodronying

Alap SFÉ: 8 / 13 / 5 / 15
+0 SFÉ: Anyagminőség átlagos
+0 SFÉ: Fémalapanyag: Acél

Végső SFÉ: 8 / 13 / 5 / 15
```

### MGT

```
Védett terület:
  torzó +
  felkar, alkarok, combok (3)
```

```
MGT: 12
+8: Sodronying
+6 (+2 MGT / tag) (pocsék)
-2: Erő MGT csökkentése
```

### Ár

```
Torzó: 5x ár
→  10x (Struktúra Sodrony)
→   1x (Anyagminőség)
→ 0,5x (Kidolgozottság „gyenge”)

5x = 10x x 1x x 0.5
```

```
1x = 1 db tag ára
  (5x / 5)
```

```
Végleges ár: 8x
  (5x + (3 x 1x))
```

Azaz egy átlagos bőr mellvért darab nyolcszorosába kerül a fenti teljes páncél-kombó (csak `3` taggal szoroztunk, mert a torzó-darabot már beleszámoltuk).

---
## ⚡Példa 2: Legvacakabb teljes lemezvért

... amiben a lehető legnehezebb mozogni (Kidolgozottság: pocsék, Fémalapanyaga: bronz) és még az Anyagminősége is a legvacakabb.

Mindent lefed (100%).

### SFÉ: `10 / 13 / 5 / 15`

```
→ Struktúra: Lemezpáncél
→ Alap SFÉ: 15 / 18 / 10 / 20
→ Anyagminőség leggyengébb: SFÉ:-2
→ Fémalapanyag: Bronz: SFÉ:-3
```

### MGT: `21`

```
Védett terület:
  torzó +
  felkar, alkarok, combok,
  lábszárak, fej (5)
```

```
MGT: 21
+10: Lemez
+2: Bronz
+10 (+2 MGT / tag)
   Kidolgozottság pocsék
-1: Erő MGT csökkentése
```

### Ár

```
Torzó: 0,5x ár
→  100x (Struktúra Lemez)
→ 0,1x (Anyagminőség vacak)
→ 0,5x (Kidolgozottság „pocsék”)
→ 0,5x (Fémalapanyag: Bronz)

(100x x 0,1x x 0.5 x 0.5)
```

```
0,1x = 1 db tag ára
  (0,5x / 5)
```

```
1x: Végleges ár
  (0,5x + (0,1 x 5x))
```

 Azaz pontosan egy átlagos bőr mellvért árának megfelelő pénzbe kerül a fenti **teljes** gyatra páncél-kombó (csak 5 taggal szoroztunk, mert a torzó-darabot már beleszámoltuk).
 
---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
