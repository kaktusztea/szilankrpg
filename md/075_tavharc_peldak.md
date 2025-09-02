## `I.` Példalövészet merénylet

Tetves, a tolvaj-bérgyilkos egy raktár ablakából, nyílpuskával les a sikátorban közelgő áldozatára, egy tehetős kalmárra, aki éppen hazafelé battyog.

A könnyű nyílpuska **Osztója:** `5`

### `I/1` Tetves Célzó Értéke

Ezt már karakteralkotáskor kiszámoltuk, így játék közben már nincs szükség semmilyen számításra. Az érthetőség kedvéért azért listázzuk a `CÉ` komponenseit.

```
Önuralom: 3
Lövészet: 5.szint (CÉ:+2)
Mesterfegyver: 0.fok
Nyílpuska CÉ: 8
```

```
CÉ = -10 (Konstans)
     + 3 (Önuralom)
     + 8 (nyílpuska CÉ)
     + 5 (CM)
     + 2 (Lövészet)
```

```
CÉ = 8
```

<br />

---
### `I/2` A célpont Védő Értéke

```
Cella: 4  (20m / 5 ↑)

Távolság: 20 méter
Nyílpuska Osztó: 5
```

```
Szorzó: 3
+ 3x: Mozgás: lassú, egyenletes
```

```
VÉ = 12  (3 x 4)
```

<br />

---
### `I/3` Célzó dobás

```
8(CÉ) + k20   vs   12(VÉ)
```

azaz ha Tetves legalább `4`-et dob `k20`-on, akkor találatot ér el. Könnyű cél (`85 % esély`)...

```
k20 Célzó dobás: 6

CÉ = 8 + 6 = 14
 → Találat
 → dobhatja a sebzést
```

<br />

---
---
## `II.` Példalövészet a balkonról

Lássunk egy bonyolultabb esetet.

Tetves ezúttal ősi nemezisét Rühest, a cingár, aprótermetű tolvajt próbája rövid íjával eltaláni, miközben az az enyhe ködben, a tetőkön oson. Rühes lassú, egyenletes mozgással üget végig egy tetőgerincen `12` méter távolságra.

Tetves a szomszédos balkonon áll, de rövid íját megfeszítve, lassan sétálnia kell, hogy Rühes ne kerüljön ki a látóteréből. Balszerencséjére erős szél is fúj, így a célzás tovább nehezedik. Az észlelést továbbá enyhe köd és sötét bonyolítja - csak az épületek lámpafénye és a Vörös Hold segíti a látást.

---
### `II/1` Tetves Célzó Értéke

Tetves Íjászat képzettsége is `5.szintű`, sőt a **Rövid íjra** van `Mf: 1.fok` fortélya is.\
Ez némileg mérsékli a fegyver rosszabb `CÉ` jellemzőjét.

```
Önuralom: 3
Íjászat: 5.szint
Mesterfegyver: 1.fok
Rövid íj CÉ: 5
```

```
CÉ = -10 (Konstans)
     + 3 (Önuralom)
     + 5 (Rövid íj CÉ)
     + 1 (Mf:1)
     + 5 (CM)
     + 2 (Íjászat)
```

```
CÉ = 6
```

---
### `II/2` A célpont Védő Értéke

```
Szorzók: 8
+ 3x: Mozgás: lassú, egyenletes
+ 1x: Lövész mozgása: lassú egyenletes
+ 1x: Célpont mérete:törpe méret (Rühes cingár)
+ 1x: Észlelhetőség: homályos kontúr
+ 2x: Szél: erős
```

```
Cella: 3  (12m / 4 ↑)

Távolság: 12 méter
Rövid íj Osztó: 4
```

```
VÉ = Szorzó x Cella
VÉ = 8 x 3 = 24
```

---
### `II/3` Célzó dobás

```
6 + k20  vs  24
```

azaz ha Tetves legalább `18`-at dob `k20`-on, csak akkor talál célt. Nehéz próba.

```
k20 Célzó dobás: 12

CÉ = 6 + 12 = 18
 → Nem talált
```

 Elvétette.... Rühes lába előtt a tetőcserépen csattan a vessző. A cingár tolvaj egy merész vetődéssel átgurul a tető másik felére és némi cserepet leverve lecsúszik az ereszig. Megmenekült.

Ha nem fújt volna a szél (`-2` a Szorzóra), akkor Tetves éppen célt talált volna és Rühes napja is sokkal rosszabbul alakul.

---

🔗 [Távharc sötétben](076_tavharc_sotetben.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
