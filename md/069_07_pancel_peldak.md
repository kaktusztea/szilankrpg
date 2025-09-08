## Példa egy páncél leírására

**JK**: „Milyen a páncélja?”

**KM**: „Ez egy Sodrony páncél. Fémalapanyaga acél, Anyagminősége (`-1`)-es (SFÉ-re), Kidolgozottsága Gyenge. Három tagot látsz: mellvért-darabot, felkar-tagot, alkar-tagot. Méretben passzol rád, nem kapsz extra büntetést.”

---
## ⚡Példa 1: Átlagos páncél

A lehető legátlagosabb sodronying, fejen (sisak) és lábszárakon **kívül** mindent beborítva.

Tehát a lefedettség **80%**: mellkas (50%), felkar (10%), alkar (10%), combok (10%).
### SFÉ

```
Struktúra: Sodronying
Alap SFÉ: 8 / 13 / 5 / 15
Anyagminőség átlagos: +0 SFÉ
Fémalapanyag: Acél:   +0 SFÉ

Végső SFÉ: 8 / 13 / 5 / 15
```

### MGT

```
→ Struktúra: Sodronying
→ Kidolgozottság gyenge
  (nem az alapanyag, az elkészítés gyenge!)
→ Alap MGT: 13 (Lánc/Sodrony)
→ Kidolgozottság: +3 MGT / tag
  Nem merev, fém / Gyenge munka
→ Védett terület: 4 db tag
  mellkas, felkar, alkarok, combok
→ Erő MGT csökkentése: +2
  (4 = (2 x 2 Erő))

Össz MGT: 21
  + 13
  + (4 x 3)
  - (2 x 2)
```


### Ár

```
Torzó: 5x ár
→  10x (Struktúra Sodrony)
→   1x (Anyagminőség)
→ 0,5x (Kidolgozottság „gyenge”)

(10x x 1x x 0,5)
```

```
1 db tag ára: 1x
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
### SFÉ

```
→ Struktúra: Lemezpáncél
→ Alap SFÉ: 15 / 18 / 10 / 20
→ Anyagminőség leggyengébb: SFÉ:-2
→ Fémalapanyag: Bronz: SFÉ:-3

Végső SFÉ:  10 / 13 / 5 / 15
```

### MGT

```
→ Struktúra: Lemez: 18
→ Fémalapanyag: Bronz: 6
→ Alap MGT: 24 (bronz lemez)
→ Kidolgozottság: +5 MGT / tag
  Merev, fém / Pocsék munka
→ Védett terület: 6 db tag
  torzó, felkar, alkarok,
  combok, lábszárak, fej
→ Erő MGT csökkentése: +2
  (2 = (2 x 1 Erő) )

Össz MGT: 52
  + 18 + 6
  + (6 x 5)
  - (2 x 1)
```

### Ár

```
Torzó: 0,5x ár
→  100x (Struktúra Lemez)
→ 0,1x (Anyagminőség vacak)
→ 0,5x (Kidolgozottság „pocsék”)
→ 0,5x (Fémalapanyag: Bronz)

(100x x 0,1x x 0,5 x 0,5)
```

```
1 db tag ára: 0,1x
  (0,5x / 5)
```

```
Végleges ár: 1x
  (0,5x + (0,1 x 5x))
```

 Azaz pontosan egy átlagos bőr mellvért árának megfelelő pénzbe kerül a fenti **teljes** gyatra páncél-kombó (csak 5 taggal szoroztunk, mert a torzó-darabot már beleszámoltuk).
 
---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
