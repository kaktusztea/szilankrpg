# Fegyverek ára

A fegyverek ára - a péncélokhoz hasonlóan - egy arány-szorzó, ami egymáshoz képest mutatja meg az egyes típusok értékét. Jó tudni, hogy a fegyverek jellemzően olcsóbbak a [Páncéloknál](069_06_pancel_ara.md). A 

```
10 átlagos hosszúkard == 1 bőrvért ára
(átlagos, acél)          (átlagos)
```

## Fegyver ár számítása

```
Fegyver ár szorzója =

x fegyver alapár
x Hossz
x Alapanyag
x Idea
```

### ⚜️ Fegyver alapár

Ez a [Fegyvergenerátor](068_10_fegyvergenerator.md) oldalon kiszámított, fődarab- és fejrész-összetételéből kiszámolt alap érték (ár-osztály × fejdarab × hossz).

### ⚜️ Hossz szorzó

```
0.5x - 0-2 hossz
  1x - 3-6 hossz
  2x - 7+  hossz
```

### ⚜️ Alapanyag szorzó

A fém-rész anyaga a fém-osztályú fegyvereknél hangolható (Bronz / Acél / Abbitacél / Mithrill); a fa / kő nem-fém anyag a fegyver gyári felépítéséből adódik.

```
   0.1x: Fa
   0.1x: Kő
   0.5x: Bronz
     1x: Acél
    10x: Abbitacél
   100x: Mithrill
100000x: Lunír
```

### ⚜️ Idea szorzó

A [Páncélok Idea szorzóihoz](069_06_pancel_ara.md#idea-%C3%A1r-szorz%C3%B3) hasonló, de a fegyvernél a teljes `-5` … `+5` Idea-sáv használható (a páncél Idea-ban korlátozott).

```
 -5        0.05x
 -4        0.1x
 -3        0.15x
 -2        0.25x
 -1        0.5x
  0        1x
 +1        2x
 +2        4x
 +3        7x
 +4       10x
 +5       13x
```

## Példa: átlagos Hosszú kard

```
1x: Kard, hosszú

1x: hossz(3)
1x: acél
1x: Idea(0)
```

---

🔗 [Puszta kéz](068_01_06_puszta_kez.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
