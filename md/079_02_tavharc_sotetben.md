## ⚡Távolsági harc vaksötétben, zajos célpontra

Ez egy speciális eset, sokat számít a "vak" szerencse is, de nem lehetetlen. A **Célzó dobást** megelőzi egy random Szerencsedobás.

### Szerencsedobás a sötét miatt

```
k10
 vs
(Távolság - Érzékenység)

Speciális (k10)
  1: kudarc mindig
 10: siker mindig
```

→ Dobás: `k10`\
→ Célszám: célpont távolsága **méterben** mínusz a lövész **Érzékenység** Tulajdonsága. Távolsággal csökken a rontás esélye.

→ Sikeres próba: mehet a lövés, `VÉ`: `5x` [Észlelhetőség Szorzóval](072_02_tavharc_ve_szorzo.md#szorzó---észlelhetőség-módosító) (Vaksötétben harcoló ellenfél)\
→ Sikertelen próba: lövés/dobás is automatikusan sikertelen. Rontás mértékétől függően közelben lévő barátot, szövetségest találhatsz el - KM dönt.

<br />

---
### `I/1` Harcos Célzó Értéke nyílpuskával

```
CÉ = 2
 – 15(konstans)
 + 3 (Önuralom)
 + 8 (nyílpuska CÉ)
 + 5 (CM)
 + 1 (Lövészet 4.szint)
```

---
###  `I/2` Szerencsedobás sötét miatt

```
Célszám: 8 (10-2)
  Érzékenység: +2
  Távolság: 10m

k10   vs   8

→ Esély: 30%
→ Sikeres próba: mehet a lövés
→ Sikertelen próba: mellé
```

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
