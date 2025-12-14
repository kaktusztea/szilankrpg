# Fegyverrel kapcsolatos helyzetek

Ide jönnek a fegyver-specifikus harci helyzetek/státuszok.

# Fegyverméret
## Fegyverméret - pengehátrány

Fegyvered legalább `1 pengével` rövidebb ellenfeledénél.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
1 + k20 tízes része (0;1;2)
```

---
## Fegyverméret - Azonos

Fegyvered és ellenfeled fegyverméret különbsége kisebb, mint `1 penge`.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
2 + k20 tízes része (0;1;2)
```

---
## Fegyverméret - 1 pengés előny

Fegyvered legalább `1 pengével` hosszabb ellenfeledénél.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
2 + k20 tízes része (0;1;2)
```

---
## Fegyverméret - 2 pengés előny

Fegyvered legalább `2 pengével` hosszabb ellenfeledénél.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
3 + k20 tízes része (0;1;2)
```

<br />

---
## Hajítás alkalmatlan fegyverrel

```
Hátrány-2 Sebzésdobásra
Hátrány-2 CÉ dobásra
```

Kapcsolódik: [Alkalmatlan fegyver hajítása](fortelyok.harci/alkalmatlan_fegyver_hajitasa.md) fortély.

---
## Hajítás nem dobásra készített tárgyakkal

```
Hátrány-1 Sebzésdobásra
Hátrány-1 CÉ dobásra
Fegyver CÉ = 0
```

⚡ Példa: sámli hajítása

🔆 Bővebben: [Nem dobásra készített tárgyak harcértékei](068_07_hajitofegyverek.md#-nem-dobásra-készített-tárgy)

🔆 Mérsékelheti: [Alkalmatlan tárgyak hajítasa](fortelyok.harci/alkalmatlan_targyak_hajitasa.md) fortély

<br />

---
## Képzetlen fegyverhasználat

→ [Harcmodor képzettségek és Bónuszaik](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)

🔆 `3.szint` alatti kapcsolódó [Harcmodor](kepzettsegek.primer.harci/harcmodor.md) képzettségnél

<br />

---
## Pusztakezes harc

```
Puszta kéz harcértékei

KÉ: -3, TÉ: -3, VÉ: -3
```

Amennyiben valaki fegyvertelenül, puszta kézzel kénytelen egy felfegyverzett ellenféllel harcolni, akkor alapesetben hátrányban van. Ez a [Puszta kéz](068_02_kozelharci_fegyverek.md) negatív harcértékeiben mutatkozik meg. A különböző pusztakezes Fortélyok csak mérsékelik ezt a hátrányt. Egyetlen kivétel a harcművészek [Élő fegyver](fortelyok.slan/elo_fegyver.md) fortélya, amely mérsékeli az említett hátrányokat.

A fenti levonások kizárólag [Belharcban](065_01_01_belharci_szituacio.md) nem érvényesülnek, ahhoz viszont „**Belharcba kerülés**” Manőver szükséges! Belharcban a Puszta kéz harcértékei `0`-ra emelkednek, valamint járnak a **Belharcból** eredő esetleges módosítók is.

A **Puszta kéz** – mint fegyver – szabály szempontjából „egykezes” fegyvernek számít, tehát **nem** lehet vele **Kétkezes harcot** folytatni!

<br />

---
## Rosszabbik kézben tartott fegyver

```
Hátrány-1 TÉ dobásra
```

Ha – például sérülés hatására – a harcos kénytelen átvenni fegyverét ügyetlenebb kezébe, akkor `Hátrány-1` büntetés jár `TÉ` dobására.

Kivétel: [Kétkezesség fortély](fortelyok.harci/ketkezesseg.md), amely megléte esetén bármelyik kezeddel is levonás nélkül tudsz harcolni - de csak `1` fegyverrel!

<br />

---
# Sebzéstípusok

## Sebzéstípus: elsődleges

```
Sima Sebzésdobás
```

Fegyvered elsődleges sebzési típusával támadsz. Például "Hosszú kard: Vágás".

---
## Sebzéstípus: másodlagos

Fegyvered másodlagos sebzési típusával támadsz. Például "Hosszú kard: Szúrás".

```
Hátrány-1 Sebzésdobásra
```

---
## Sebzéstípus: alkalmatlan

```
Hátrány-2 Sebzésdobásra
```

Fegyvered nem erre a sebzési típusra lett kialakítva. Például "Hosszú kard: Zúzás".

---

🔗 [Harci helyzetek](065_01_00_harci_helyzetek.md) ↑

⚜️ [Nyitóoldal](start.md#6-harcrendszer-️)
