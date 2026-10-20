## ⚡Távolsági harc vaksötétben, zajos célpontra

Ez egy speciális eset, sokat számít a "vak" szerencse is, de nem lehetetlen. Ami újdonság az az, hogy a **Célzó dobást** megelőzi egy random Szerencsedobás.

### Szerencsedobás a sötét miatt

```
k10
 vs
(Távolság - Érzékenység)

Speciális (k10)
  1: kudarc mindig
 10: siker mindig
```

Dobjunk `k10`-zel - módosító nélkül. A Célszám a célpont távolsága **méterben** mínusz a lövész **Érzékenység** Tulajdonsága.

Ha sikeres a próba, akkor elkezdhetjük kiszámolni a `CÉ` és `VÉ` értékeket a táblázatban megadott `5x` [Észlelhetőség Szorzóval](072_02_tavharc_ve_szorzo.md#szorzó---észlelhetőség-módosító).

Ha a próba sikertelen, akkor a lövés/dobás is automatikusan sikertelen. A rontás mértékétől függően közelben lévő barátot, szövetségest találhat el az eltévedt lövedék - KM dönt.

Érthető, hogy közvetlen közelről egy képzetlen karakter is valószínűleg betalál, viszont ahogy nő a távolság, úgy csökkenek (drasztikusan) a találati esélyek.

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
###  `I/2` Szerencsedobás

```
Érzékenység: +2

k10   vs   8 (10-2)

→ Esély: 30%
```

Ha sikeres, tehet Célzó dobást, egyébként automatikusan célt téveszt.

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
VÉ = Szorzó x Cella
VÉ = 7 × 2 = 14
```

```
Célzó dobás #1

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
VÉ = 6 × 2 = 12
```

```
Célzó dobás #2

2(CÉ) + k20   vs   12(VÉ)
 → találati esély: 50%
```

---

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
