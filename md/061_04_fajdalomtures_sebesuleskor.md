## Fájdalomtűrés sebesüléskor

## Fájdalomtűrés

A [Fájdalomtűrés](kepzettsegek.primer.altalanos/fajdalomtures.md) képzettség fontos szerepet játszik a harcban elszenvedett sebek fájdalmának elnyomásában, illetve egyéb helyzetekben a kín elviselésében.

Különbséget teszünk harcon belüli és azon kívüli fájdalomtűrés között - részben játéktechnikai gyorsítás miatt, részben mert harc közben az adrenalin hatására nő a kín tűrése, valamint próbáltuk a harc heroizmusát is megőrizni.

---
### `1.` Fájdalomtűrés harc közben

Ha harc közben más sebesülés kategóriába (`S`) lép a karakter, akkor statikus `TÉ` levonást kap büntetésül. Az első (`S1`) kategóriában lévő karaktert még nem sújtják negatív módosítók, sérülése – számára – olyan könnyű, ami még nem akadályozza a harcban. Az `S2`, `S3` és `S4` kategóriákba kerülve viszont már `TÉ` büntetések sújtják.

```
TÉ levonás alap

S1:    -
S2:  -3 TÉ
S3:  -6 TÉ
S4:  -9 TÉ
```

Ennek értékét csökkentik statikusan a [Fájdalomtűrés](kepzettsegek.primer.altalanos/fajdalomtures.md) képzettség egyes szintjei, így tehát a levonások értéke karakterenként változik.

```
TÉ levonás enyhítése
  Fájdalomtűrés képzettséggel

4.szint:  1 TÉ enyhítés
6.szint:  2 TÉ enyhítés
8.szint:  3 TÉ enyhítés
10.szint: 4 TÉ enyhítés
11.szint: 5 TÉ enyhítés
12.szint: 6 TÉ enyhítés
13.szint: 7 TÉ enyhítés
14.szint: 8 TÉ enyhítés
15.szint: 9 TÉ enyhítés
```

---
### `S4` kategóriás fájdalomtűrés

```
Fájdalomtűrés (K) + Edzettség (T)
          vs
          12
```

Ha a karakter az `S4` (Súlyosan sebesült) kategóriába ér, egyszeri **([Fájdalomtűrés](kepzettsegek.primer.altalanos/fajdalomtures.md) + Edzettség)** képzettségpróbát kell dobnia **Nehéz** (`12`) célszám ellen.

Sikertelen próba esetén a karakter elájul.\
Siker esetén ezt a próbát a következő sebesüléskor kell csak újradobnia. 

🔆 A [Harci láz](fortelyok.harci/harci_laz.md) fortély egyes fokai előnyt adnak a fenti próbára.

---
### ⚡ Példa Fájdalomtűrés `TÉ` módosítóira

Tetves, a tolvaj Fájdalomtűrése `5.szintű`, ez `2` pontot enyhít.\
Ekkor az ő sebesülés táblázata így néz ki:

```
TÉ levonás összes

S1:    -
S2:  -1 TÉ
S3:  -4 TÉ
S4:  -7 TÉ
```

---
### `2.` Fájdalomtűrés harcon kívül

Mérgezés, kínzás, egyéb fájdalom esetén a karakterek **Fájdalomtűrés** képzettségpróbát kell dobnia a KM által meghatározott célszámra - általában **Önuralom** Tulajdonsággal.

---

🔗 [Példa sebesülésre](061_05_pelda_sebesulesre.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
