## ⚡Távolsági harc vaksötétben, zajos célpontra

Ez egy speciális eset, sokat számít a "vak" szerencse is, de nem lehetetlen. Ami újdonság az az, hogy a **Célzó dobást** megelőzi egy random Szerencsedobás.

### Szerencsedobás a sötét miatt

```
k10
 vs
(Távolság - Érzékenység)
```

Dobjunk `k10`-zel, a dobáshoz ne adjunk hozzá semmit. A Célszám a célpont távolsága **méterben** mínusz a lövész **Érzékenység** Tulajdonsága. Ha sikeres a próba, akkor elkezdhetjük kiszámolni a `CÉ` és `VÉ` értékeket a táblázatban megadott `5x` [Észlelhetőség Szorzóval](073_tavharc_ve_szorzo.md#szorz%C3%B3---%C3%A9szlelhet%C5%91s%C3%A9g-m%C3%B3dos%C3%ADt%C3%B3).

Ha a fenti `k10`-es próba sikertelen, akkor a lövés/dobás is automatikusan sikertelennek minősül. A rontás mértékétől függően közelben lévő barátot, szövetségest találhat el az eltévedt lövedék. Erről a KM dönt. Az `1`-es dobás itt is mindig kudarc, a `10`-es mindig siker.

Érthető, hogy közvetlen közelről egy képzetlen karakter is valószínűleg betalál, viszont ahogy nő a távolság, úgy csökkenek (drasztikusan) a találati esélyei.

<br />

---

### `I/1` Harcos Célzó Értéke nyílpuskával, vaksötétben

```
CÉ = 2
```

```
CÉ = – 15(konstans)
     + 3 (Önuralom)
     + 8 (nyílpuska CÉ)
     + 5 (CM)
     + 1 (Lövészet 4.szint)
```

---
###  `I/2` Szerencse dobás

```
Érzékenység: +2
```
A játékos először is dob `k10`-el: ha az eredmény nagyobb, vagy egyenlő `(10-2)=8` értékkel, amire `30%` esély van, akkor dobhat Célzást, egyébként automatikusan célt téveszt.

---
### `I/3` A célpont Védő Értéke vaksötétben

Két esetet nézünk: az elsőben a célpont lassan oson, a másodikban egy helyben áll.

### ⚡Példa-1: Célpont 🔆sétál, zajos, sötét

```
Cella: 2  (10m / 5 ↑)

Távolság: 10 méter
Nyílpuska Osztó: 5
```

```
Szorzó: 7
 + 2x: Mozgás: lassan mozgó
 + 5x: Észlelhetőség
       (sötét, zajos célpont)
```

```
VÉ = 14  (7 x 2)
VÉ = Szorzó x Cella
```

```
Célzó dobás-1

2(CÉ) + k20   vs   14(VÉ)
 → találati esély: 40%
```

### ⚡Példa-2 Célpont 🔆áll, zajos, sötét

```
Cella: 2  (10m / 5 ↑)

Távolság: 10 méter
Nyílpuska Osztó: 5
```

```
Szorzó: 6
 + 1x: Mozgás: álló
 + 5x: Észlelhetőség
       (sötét, zajos célpont)
```

```
VÉ = 12  (6 x 2)
```

```
Célzó dobás-2

2(CÉ) + k20   vs   12(VÉ)
 → találati esély: 50%
```

---

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
