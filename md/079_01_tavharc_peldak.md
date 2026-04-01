## ⚡`I.` Példalövészet merénylet

Tetves, a tolvaj-bérgyilkos egy raktár ablakából les nyílpuskával a sikátorban hazafelé battyogó tehetős kalmárra.

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
CÉ = -15 (Konstans)
     + 3 (Önuralom)
     + 8 (nyílpuska CÉ)
     + 5 (CM)
     + 2 (Lövészet)
```

```
CÉ = 3
```

---
### `I/2` A célpont Védő Értéke

```
Cella: 4  (20m / 5 ↑)

Távolság: 20 méter
Nyílpuska Osztó: 5
```

```
Szorzó: 2
+ 2x: Mozgás: lassú, egyenletes
```

```
VÉ = 8  (2 x 4)
```

---
### `I/3` Célzó dobás

```
3(CÉ) + k20   vs   8(VÉ)
```

azaz ha Tetves legalább `5`-öt dob `k20`-on, akkor találatot ér el. Átlagos cél (`75 % esély`)...

```
k20 Célzó dobás: 6

CÉ = 3 + 6 = 9
 → Találat
 → dobhatja a sebzést
```

<br />

---
---
## ⚡`II.` Példalövészet a balkonról

Lássunk egy bonyolultabb esetet.

Tetves ezúttal ősi nemezisét Rühest, a cingár, aprótermetű tolvajt próbálja rövid íjával eltalálni, miközben az az enyhe ködben, a tetőkön oson. Rühes lassú, egyenletes mozgással üget végig egy tetőgerincen `12` méter távolságra.

Tetves a szomszédos balkonon áll, de rövid íját megfeszítve, lassan sétálnia kell, hogy Rühes ne kerüljön ki a látóteréből. Balszerencséjére enyhe szél is fúj, így a célzás tovább nehezedik. Az észlelést továbbá enyhe köd és sötét bonyolítja - csak az épületek lámpafénye és a Vörös Hold segíti a látást.

---
### `II/1` Tetves Célzó Értéke

Tetves Íjászat képzettsége is `6.szintű`, sőt a **Rövid íjra** van `Mf: 1.fok` fortélya is.\
Ez némileg mérsékli a fegyver rosszabb `CÉ` jellemzőjét és `Osztóját`.

```
Önuralom: 3
Íjászat: 6.szint
Mesterfegyver: 1.fok
Rövid íj CÉ: 5
```

```
CÉ = -15 (Konstans)
     + 3 (Önuralom)
     + 5 (Rövid íj CÉ)
     + 1 (Mf:1)
     + 6 (CM)
     + 3 (Íjászat)
```

```
CÉ = 3
```

---
### `II/2` A célpont Védő Értéke

```
Szorzók: 7
+ 2x: Mozgás: lassú, egyenletes
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
VÉ = 7 x 3 = 21
```

---
### `II/3` Célzó dobás

```
3 + k20  vs  21
```

azaz ha Tetvesnek minum`18`-as dobásra van szüksége `k20`-on, hogy célt találjon. Nehéz próba.

```
k20 Célzó dobás: 15

CÉ = 3 + 15 = 18
 → Nem talált
```

 Elvétette.... Rühes lába előtt a tetőcserépen csattan a vessző. A cingár tolvaj egy merész vetődéssel átgurul a tető másik felére és némi cserepet leverve lecsúszik az ereszig. Megmenekült.

Ha nem fújt volna ennyire erősen a szél (`-1` Szorzóra) vagy nem ilyen rosszak a látási viszonyok (ez is `-1` Szorzóra), akkor Tetves éppen célt talált volna (`VÉ=18 (6x3)`) és Rühes napja is sokkal rosszabbul alakul.

---

🔗 [Távharc sötétben](079_02_tavharc_sotetben.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
