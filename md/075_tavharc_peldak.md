## Példalövészet #1

⭕k20

Tetves, a tolvaj-bérgyilkos egy raktár ablakából, nyílpuskával les a sikátorban közelgő áldozatára, egy tehetős kalmárra, aki éppen hazafelé battyog.

A könnyű nyílpuska **Osztója:** `4`

### Tetves Célzó Értéke #1

Ezt már karakteralkotáskor kiszámoltuk, így játék közben már nincs szükség semmilyen számításra. Az érthetőség kedvéért azért listázzuk a `CÉ` komponenseit.

```
Önuralom: 3
Lövészet: 5.szint
Mesterfegyver: 0.fok
(nyílpuska)
```

```
CÉ = -10 (Konstans)
     + 3 (Önuralom)
     + 8 (nyílpuska CÉ)
     + 5 (CM)
     + 2 (Lövészet)
     = 8
```

<br />

---
### A célpont Védő Értéke #1

- Mozgás szorzó: `2x` (lassú, egyenletes)
- Távolság: `15 méter`
- Cella:  (`15m/3 ↑`) → `5`

$$VÉ = {2(lassú\ egyenletes)+0(normál\ méret)+0(jól\ látható)}\ x\ {15(távolság)\over 3(nyílpuska\ Osztója)}$$

```
VÉ = 2 x 5 = 10
```

<br />

---
### Tehát a próba #1

```
8 + k20  vs  10
```

azaz ha Tetves legalább `2`-et dob `k20`-on, akkor találatot ér el. Könnyű cél...

Dob `k20`-zal, az eredmény `6`, végső `CÉ = 8+6 = 14`, tehát eltalálta a célt, dobhatja a sebzést.

---
---
## Példalövészet #2

⭕k20

Lássunk egy bonyolultabb esetet.

Tetves ezúttal ősi nemezisét Rühest, a cingár, aprótermetű tolvajt próbája rövid íjával eltaláni, miközben az az enyhe ködben, a tetőkön oson. Rühes gyors, egyenletes mozgással üget végig egy tetőgerincen `12` méter távolságra. Tetves a szomszédos balkonon áll, de íját megfeszítve, lassan sétálnia kell, hogy Rühes ne kerüljön ki a látóteréből. Balszerencséjére erős szél is fúj, így a célzás tovább nehezedik. Az észlelést továbbá enyhe köd és sötét bonyolítja - csak az épületek lámpafénye és a Vörös Hold segíti a látást.

```
Önuralom: 3
Lövészet: 5.szint
Mesterfegyver: 1.fok
(rövid íj)
```

```
CÉ = -30 (Konstans)
     + 6 (Önuralom 2x)
     + 10 (rövid íj CÉ)
     + 3 (Mf:1)
     + +15 (CM)
     + 4 (Íjászat)
     = 8
```

### A célpont Védő Értéke #2

**Szorzók**
- Mozgás szorzó: `8x` (gyors, egyenletes)
- Lövész mozgása: `2` (lassú egyenletes)
- Célpont mérete: `1` (Rühes cingár, apró, törpe méretű)
- Észlelhetőség: `3` (homályos kontúr)
- Szél: `4` (erős szél)

**Cella**
- Távolság: `12 méter`
- (`12m/3 ↑`) → `4`

$$VÉ = {8(gyorsan\ mozgó)+2(lövész\ lassú, egyenletes)+1(törpe\ méret)+3(homályos\ kontúr+4(erős\ szél))}\ x\ {12(távolság)\over 3(rövid\ íj\ Osztója)}$$

```
VÉ = 18 x 4 = 72
```

### Tehát a próba #2

```
8 + k100  vs  72
```

azaz ha Tetves legalább `64`-et dob `k100`-on, csak akkor talál célt.

Dob `k100`-zal, az eredmény `59`, végső `CÉ = 8+59 = 67`, elvétette.... Rühes lába előtt a tetőcserépen csattan a vessző. A cingár tolvaj egy merész vetődéssel átgurul a tető másik felére és némi cserepet leverve lecsúszik az ereszig. Megmenekült.

---

🔗 [Távharc sötétben](076_tavharc_sotetben.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
