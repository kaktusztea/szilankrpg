## Páncél Ára

A páncél teljes árát a következőképpen kaphatjuk meg:

```
Teljes ár
   = Torzó Struktúra Ár
   + Csatolt tagok Ára
```

---
### Torzó Ár

Ez a mellvért tag ára egyedül.

```
  0.1x: Posztó/Bunda
  0.5x: Fegyverkabát
  1x  : Bőrpáncél
 10x  : Lánc/Sodrony
 50x  : Pikkely fémpáncél
100x  : Lemezpáncél
```

---
### Csatolt tagok ára, Kidolgozottság

A plusz csatolt tagok egyenként a torzó-darab árának `1/5`-ét érik, azaz egy teljes vért a torzó-darab árának pont a kétszerese.

```
1 csatolt tag ára
     = 1/5
     x (Torzó ár)
     x (Csatolt tagok db)
     x Kidolgozottság

Csatolt tagok (max 5 db)
  felkar-tagok
  alkar-tagok
  comb-tagok
  lábszár-tagok
  sisak
```

```
Kidolgozottság
   0.5: Pocsék
   1: Átlagos
 100: Mestermunka
```

---
### Fémalapanyag Ár szorzó

A különböző fém ötvözetek alapanyagai változtathatnak az `Ár` szorzón.

```
  1x  : Acél
  0,5x: Bronz
 10x  : Abbitacél
100x  : Mithrill
 *    : Lunír

* a csillagos ég
```

---
### Anyagminőség Ár szorzó

A jobb anyagminőség nagyon megdobhatja a vért árát:

```
Anyagminőség Ár

+SFÉ       Ár
 -4      1/10 x
 -3       1/7 x
 -2       1/4 x
 -1       1/2 x
 +1        2x
 +2        4x
 +3        7x
 +4       10x
```

---
### Miért szorzó érték az „Ár”?

```
1x = 1 arany
1x = minden tekintetben
     átlagos bőr mellvért ára
```

Az SFÉ táblázatban nem véletlenül _szorzó_ értékek szerepelnek arany, vagy más fizetőeszköz helyett. Itt ugyan `1x = 1 arany` arányszámot vázoltunk, de tájegységtől függően más-más lehet a vértek ára.

Természetesen ebbe is bele lehet kötni, hogy pl. egy adott országban nem pont ezek az arányok, de ennyire részletes bontásba véleményünk szerint értelmetlen belemenni – felesleges bonyolítás lenne.

---

🔗 [Páncél példák](069_07_pancel_peldak.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
