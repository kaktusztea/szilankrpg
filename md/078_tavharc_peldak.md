## ⚡`I.` Példalövészet merénylet

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

azaz ha Tetves legalább `5`-öt dob `k20`-on, akkor találatot ér el. Könnyű cél (`75 % esély`)...

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
CÉ = -15 (Konstans)
     + 3 (Önuralom)
     + 5 (Rövid íj CÉ)
     + 1 (Mf:1)
     + 5 (CM)
     + 2 (Íjászat)
```

```
CÉ = 1
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
1 + k20  vs  21
```

azaz ha Tetves csak a `20`-as dobás `k20`-on talál célt. Nehéz próba.

```
k20 Célzó dobás: 12

CÉ = 1 + 12 = 13
 → Nem talált
```

 Elvétette.... Rühes lába előtt a tetőcserépen csattan a vessző. A cingár tolvaj egy merész vetődéssel átgurul a tető másik felére és némi cserepet leverve lecsúszik az ereszig. Megmenekült.

Ha nem fújt volna a szél (`-2` a Szorzóra), akkor Tetves éppen célt talált volna és Rühes napja is sokkal rosszabbul alakul.

---

🔗 [Távharc sötétben](079_tavharc_sotetben.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
