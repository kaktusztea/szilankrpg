## ⚡`I.` Példalövészet: Merénylet

Tetves, a tolvaj-bérgyilkos egy raktár ablakából les nyílpuskával a sikátorban hazafelé battyogó tehetős kalmárra.

Nyílpuska **Osztó: `5`**

### `I/1` Tetves Célzó Értéke

Karakteralkotáskor kiszámoltuk, játék közben nincs szükség újrakalkulációra. Az érthetőség kedvéért listázzuk a `CÉ` komponenseit:

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
VÉ = Szorzó x Cella
VÉ = 2 × 4 = 8
```

---
### `I/3` Célzó dobás

```
3(CÉ) + k20   vs   8(VÉ)
```

azaz ha Tetves legalább `5`-öt dob `k20`-on, akkor találatot ér el. Nem egy nagy feladat (`75 % esély`).

```
k20 Célzó dobás: 6

CÉ = 3 + 6 = 9
 → Találat
 → Sebzésdobás
```

<br />

---
---
## ⚡`II.` Példalövészet a balkonról

Lássunk egy bonyolultabb esetet.

Tetves ezúttal ősi nemezisét Rühest, a cingár, aprótermetű tolvajt próbálja rövid íjával eltalálni, miközben az az enyhe ködben, a tetőkön oson. Rühes lassú, egyenletes mozgással üget végig egy tetőgerincen `12` méter távolságra.

Tetves a szomszédos balkonon áll, de rövid íját megfeszítve, lassan sétálnia kell, hogy Rühes ne kerüljön ki a látóteréből. Balszerencséjére erős szél is fúj, így a célzás tovább nehezedik. Az észlelést továbbá enyhe köd és sötét bonyolítja - csak az épületek lámpafénye és a Vörös Hold segíti a látást.

---
### `II/1` Tetves Célzó Értéke

A magasabb Harcmodor (Íjászat) szint és a Mesterfegyver fortély némileg mérsékli a fegyver rosszabb `CÉ` jellemzőjét és `Osztóját`.

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
+ 1x: Célpont mérete:törpe méret (Rühes elég cingár)
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
VÉ = 7 × 3 = 21
```

---
### `II/3` Célzó dobás

```
3 + k20  vs  21
```

azaz Tetvesnek minimum`18`-as dobásra van szüksége `k20`-on, hogy célt találjon. Elég nehéz próba.

```
k20 Célzó dobás: 15

CÉ = 3 + 15 = 18
 → Nem talált
```

 Elvétette.... Rühes lába előtt a tetőcserépen csattan a vessző. A cingár tolvaj egy merész vetődéssel átgurul a tető másik felére és némi cserepet leverve lecsúszik az ereszig. Megmenekült.

Ha nem fújt volna ennyire erősen a szél (`-1x` Szorzó) vagy nem ilyen rosszak a látási viszonyok (szintén `-1x` Szorzó), akkor Tetves éppen célt talált volna (`VÉ=18 (6x3)`) és Rühes napja is sokkal rosszabbul alakul.

---

🔗 [Távharc sötétben](079_02_tavharc_sotetben.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
