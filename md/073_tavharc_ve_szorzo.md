## Szorzó értéke a távolsági Védő Értékben

Emlékeztetőül:

```
Célpont VÉ =
  Szorzó  ×  Cella
```

A **Szorzó** a célpont egyedi jellemzőit, illetve a környezet hatásait szimulálja. Az alábbi módosítók **összege** adja meg értékét:

```
Szorzó =
+ Mozgás módosító (lövészé)❕
+ Mozgás módosító (célponté)
+ Méret módosító  (célponté)
+ Észlelhetőség   (célponté)
+ Szél ereje
```

---
### Szorzó - Mozgás módosító (célpont)

Ha a célpont mozog, jóval nehezebb eltalálni. A távolság növekedésével ez a nehézség nem lineárisan, hanem exponenciálisan nő, éppen ezért érthető, hogy a mozgás is a Távolsági szorzó része. Alább a Célpont egyes mozgás típusaihoz tartozó módosítókat olvashatjuk.

```
Célpont mozgás jellege

1x: Álló
    A célpont mozdulatlan
2x: Lassú, egyenletes
    Lassú séta, léptetés lovon
3x: Gyors, egyenletes
    Egyenletesen futó ember, vágtató lovas
4x: Kiszámíthatatlan
    A célpont ugrál, cikk-cakkban fut
5x: Harcoló célpont
    Csak konkrét harcoló fél eltalálása jó

2x: Harcoló csoport (bárki jó találatnak)
    Ezt is a Méret módosító
    értékénél szimuláljuk
3x: Szándékosan kitérő célpont
    Rontott Akrobatikapróbája után
    a Lövész Célzó dobást tesz
    ezzel a Mozgás módosítóval
```

- **Harcoló csoport**: Harcoló tömegbe lövést jelent, ahol **bármelyik** fél eltalálása megfelel.
  → Kit talál el: random dobás → `k10`
- [Sikertelenül szándékosan kitérő célpont](szituaciok/kiteres_loves_elol_sikertelen.md)

---
### Szorzó - Mozgás módosító (lövész)

Természetesen a lövést végző személy mozgása is befolyásolja a találati esélyeket, hiszen könnyebb állva célozni, mint mondjuk futásból. A lövész mozgása az alábbiak szerint módosíthatja a **Szorzót**:

```
Lövész mozgása

0x: Mozdulatlanul áll
1x: Lassan egyenletesen sétál
2x: Lassan fut
3x: Rohan
```

---
### Szorzó - Méret módosító

```
Méret módosító

4x: pénzérme
3x: alma
2x: fej, dinnye, macska
1x: törpe, sas, hiúz
1x: célpont félfedezék mögött

0x: átlagos ember/elf méretű

-1x: ogre
-1x: ló oldalról, 2 harcoló ember
-2x: lovas, bölény
-3x: óriás
```

---
### Szorzó - Észlelhetőség módosító

A látási viszonyok erősen meghatározzák a távolsági harcot, hiszen például félhomályban sokkal nehezebb eltalálni valakit, mint fényes nappal. Viszont... könnyebb valakit eltalálni sötétben, ha zajt ad ki, mintha csendben lapulna. Egyszóval a fenti körülmények is módosítják a **Szorzó** értékét:

```
Célpont láthatósága és hangossága

+0x: Jól kivehető kontúr
     Nappali célpont; Napnyugtakor
     háztetőn álldogáló célpont
+1x: Szürkületben
+1x: Homályos kontúr
     Félhomályban mozgó alaké
     Testközelben levő célpont sötétben
+2x: Éppen kivehető kontúr (zajos)
     Sötétben moccanó, neszező árnyak
+5x: Éppen kivehető kontúr (csendes)
     Sötétben, csendben lapuló árnyak
+5x: Háttérrel egybeolvadó kontúr (zajos)
*    Vaksötétben harcoló ellenfél

+99x: Háttérrel egybeolvadó kontúr (csendes)
      Lehetetlen.
      Nem látható, lopakodó,
      némán osonó fejvadász

* csak speciális mentális gyakorlat segítségével
```

---
### Szorzó - Szél hatása

Az erős szél eltérítheti a lövedéket. Orkán erejű szélben a lövés/hajítás lehetetlen, mindig célt téveszt.

```
Szél ereje

+0x: Szélcsend
+1x: Enyhe
+2x: Erős
+3x: Viharos
+99x: Orkán (lehetetlen)
```

---

🔗 [Célpont Védő Érték kiszámítása](074_tavharc_celpont_vedo_ertek.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
