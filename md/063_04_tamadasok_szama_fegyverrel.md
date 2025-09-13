## Támadások száma fegyverrel

```
Alapeset:
 fegyveres támadás száma:
 1 / kör
```

Néhány kivételnél ez kevesebb. Lásd a [Fegyver](068_00_fegyverek.md) táblázatot!

---
### Harckeret

```
Harckeret = 
    aktuális Harcmodor szint
  + Gyorsaság tulajdonság
  - Vért MGT
  - 3
```

Egy karakter plusz támadásainak száma attól függ, hogy milyen fegyvert forgat, mennyire képzett annak Harcmodorában, és hogy mennyire fürge (`Gyorsaság` tulajdonság).

Számszerűen: az aktuális fegyverhez tartozó harcmodor-képzettség szintje és a Gyorsaság tulajdonság összege határozzák meg az ún. **Harckeret** értéket - amiből lejön még `3` pont. A Harckeret tehát harcmodoronként egyedi érték. A `-3` jelképezi a szokásos "nullpontot", ami a képzettségeknél az "alapszint". A vértek `MGT` értéke lejön a Harckeretből, így érdemes megfontolni: a több támadás, vagy a nagyobb védelem a fontosabb.

A **Harckeret** értéke a [Harckeret növelés](fortelyok.harci/harckeret_noveles.md) és [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortélyok segítségével emelhető tovább.

<br />

---
### Fegyver Sebesség

Szintén minden fegyvernek van egy egyedi **Sebesség** értéke. Minél kisebb ez a szám, annál fürgébb, minél nagyobb, annál lomhább az adott fegyver.

Kézifegyvereknél az alábbi módon kategorizálunk, de ez csak irányadó, a konkrét értékeket lásd a [Fegyverek](068_00_fegyverek.md) fejezet táblázataiban:

```
Hány Sebesség pontonként kap +1
  támadást a fegyveres

6: rövid fegyverek
7: egykezes és szálfegyverek
8: kétkezes fegyverek
```

<br />

---
### Plusz támadások száma (fegyverrel)

Az alap `1` támadáson felül kapott **plusz** támadások számát úgy kapjuk meg, hogy megvizsgáljuk, a fegyver `Sebesség` értéke hányszor van meg a karakter aktuális „**Harckeret**” értékében (lefelé kerekítve).

```
Plusz támadások (db) =
   Harckeret / (Fegyver Sebesség) ↓
```

<br />

---
### TÉ levonás támadásonként

```
TÉ:-4

2.támadástól kezdődően
  minden további támadásra
  NEM Additív.
```

```
Második támadás: TÉ:-4
Harmadik támadás: TÉ:-4
...
```

A fenti módosítóknak matematikai oka van: így kerüljük el a plusz kapott támadás okozta radikális ugrást az `1` körön belül leadott támadások potenciális sikeressége kapcsán. Ne feledjük: legrosszabb esetben még így is **Védő Érték csökkenést** okoz minden támadás, így a plusz támadások ereje már önmagában is elég hangsúlyos.

<br />

---
### ⚡Példa több támadásra

```
Harckeret = 8
  5: Kardvívás szintje
 +3: Gyorsaság

Fegyver: Hosszú kard
  Sebesség: 7
```

Mivel a Harckeret elérte a fegyver `7`-es Sebesség értéket, ezért `+1` támadás – összesen tehát már `2 db` jár körönként. A `3.` támadást `14`-es, a `4.` támadást pedig `21`-es **Harckeret** értéknél kapja meg.

---

🔗 [Támadások száma varázsláskor](063_05_tamadasok_szama_varazslaskor.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
