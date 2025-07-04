## Támadások száma fegyverrel

```
Alapeset:
 fegyverek támadás száma: 1 / kör
```

Néhány kivételnél ez kevesebb. Lásd a [Fegyver](068_00_fegyverek.md) táblázatot!

---
### Harckeret

```
Harckeret = 
    aktuális Harcmodor szint
  + Gyorsaság tulajdonság
  - 3
```

Egy karakter plusz támadásainak száma attól függ, hogy milyen fegyvert forgat, mennyire képzett annak Harcmodorában, és hogy mennyire fürge (`Gyorsaság` tulajdonság).

Számszerűen: az aktuális fegyverhez tartozó harcmodor-képzettség szintje és a Gyorsaság tulajdonság összege határozzák meg az ún. **Harckeret** értéket - amiből lejön még `3` pont. A Harckeret tehát harcmodoronként egyedi érték. A `-3` jelképezi a szokásos "nullpontot", ami a képzettségeknél az "alapszint".

A **Harckeret** értéke a [Harckeret növelés](fortelyok.harci/harckeret_noveles.md) és [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortélyok segítségével emelhető tovább.

<br />

---
### Fegyver Sebesség

Szintén minden fegyvernek van egy egyedi **Sebesség** értéke. Minél kisebb ez a szám, annál fürgébb, minél nagyobb, annál lomhább az adott fegyver.

Kézifegyvereknél az alábbi módon kategorizálunk, de ez csak irányadó, a konkrét értékeket lásd a [Fegyverek](068_00_fegyverek.md) fejezet táblázataiban:

```
(6) rövid fegyverek            → 6 Sebesség pontonként nő 1-el a támadások száma
(7) egykezes és szálfegyverek  → 7 Sebesség pontonként nő 1-el a támadások száma
(8) kétkezes fegyverek         → 8 Sebesség pontonként nő 1-el a támadások száma
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
TÉ:-20 a 2. támadástól kezdődően
  aktuális Támadó Értékre.
  NEM Additív.
```

```
Második támadás: TÉ:-20
Harmadik támadás: TÉ:-20
...
```

A fenti módosítóknak matematikai oka van: így kerüljük el a plusz kapott támadás okozta radikális ugrást az `1` körön belül leadott támadások potenciális sikeressége kapcsán. Ne feledjük: legrosszabb esetben még így is **Védő Érték csökkenést** okoz minden támadás, így a plusz támadások ereje már önmagában is elég hangsúlyos.

<br />

---
### ⚡Példa több támadásra

- Fegyver: Hosszú kard: `Sebesség: 7`
- Harcmodor: `Kardvívás – 5.szint`
- Gyorsaság tulajdonság: `+3`

Ekkor az aktuális **Harckeret** érték:  `5+3 = 8`

Mivel ez elérte a`7`-es értéket, ezért `+1` támadás – összesen tehát már `2 db` jár körönként. A `3.` támadást `14`-es, a `4.` támadást pedig `21`-es **Harckeret** értéknél kapja meg.

---

🔗 [Támadások száma varázsláskor](063_05_tamadasok_szama_varazslaskor.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
