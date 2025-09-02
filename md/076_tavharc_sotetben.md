## Távolsági harc vaksötétben, zajos célpontra

⭕k20

Ez egy speciális eset, sokat számít a "vak" szerencse is, de nem lehetetlen. Ami újdonság az az, hogy a Célzó dobást megelőzi egy random Szerencsedobás.

### Szerencsedobás

```
k10
 vs
(Távolság - Érzékenység)
```

Dobjunk `k10`-zel, a dobáshoz ne adjunk hozzá semmit. A Célszám a célpont távolsága **méterben** mínusz a lövész **Érzékenység** Tulajdonsága. Ha sikeres a próba, akkor elkezdhetjük kiszámolni a `CÉ` és `VÉ` értékeket a táblázatban megadott `15x` [Észlelhetőség Szorzóval](072_tavharc_ve_szorzo_oszto.md#szorzó---észlelhetőség-módosító).

Ha a fenti `k10`-es próba sikertelen, akkor a lövés/dobás is automatikusan sikertelennek minősül. A rontás mértékétől függően közelben lévő barátot, szövetségest találhat el az eltévedt lövedék. Erről a KM dönt. Az `1`-es dobás itt is mindig kudarc, a `10`-es mindig siker.

Érthető, hogy közvetlen közelről egy képzetlen karakter is valószínűleg betalál, viszont ahogy nő a távolság, úgy csökkenek (drasztikusan) a találati esélyei.

### ⚡ Példalövészet vaksötétben

- `4.`szintű harcos nyílpuskával
- Önuralom:`+3`
- Érzékenység: `+2`
- CM: `16`
- Nyílpuska: `CÉ:16`
- Lövészet – `4.szint` → `CÉ:+3`

```
CÉ = 16 + 16 + 3 
    + 6(Önuralom(2x))
    – 30(konstans)
    = 11
```

#### Célpont általános jellemzői

- Távolság: `10 méter`
- Cella:  (`10m/3 ↑`) → `4`
- Észlelhetőség: sötét, zajos célpont (`+12x`)

#### Szerencse dobás

A karakter Érzékenysége `+2`. A játékos először is dob `k10`-el:  ha az eredmény nagyobb, vagy egyenlő `(10-2)=8` értékkel, amire `30%` esély van, akkor dobhaat Célzást, egyébként automatikusan célt téveszt.

#### Példa-1: Célpont sétál, zajos, sötét

- Mozgás szorzó: `5x` (lassan mozgó)
- Észlelhetőség szorzó: `12x` sötét, zajos célpont
- `VÉ = (12+5) x 4 = 68`
- Találati esély: `43%`

#### Példa-2: Célpont áll, zajos, sötét

- Mozgás szorzó: `3x` (álló)
- Észlelhetőség szorzó: `12x` sötét, zajos célpont
- `VÉ = (12+3) x 4 = 60`
- Találati esély: `51%`

---

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
