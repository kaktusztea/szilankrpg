# Fegyverrel kapcsolatos helyzetek

Fegyver-specifikus harci helyzetek (státuszok).

## Fegyverméret

A felek által forgatott fegyverek méretének viszonya meghatározza, hogy melyik fél hogyan csökkent Védő Értéket.

### Pengehátrány

Fegyvered mérete legalább `1 pengével` rövidebb ellenfeledénél.
A `VÉ` csökkentést tekintve hátrányban vagy az **Alappengéhez** képest, viszont vannak szituációk, mint például a [Fárasztó taktika](065_02_harci_taktikak.md#f%C3%A1raszt%C3%B3-taktika-), ahol korlátozó tényező lehet.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
k20T
```

### Alappenge

Fegyvered azonos hosszú, vagy **nem** hosszabb legalább `1 pengével` ellenfeledénél. Ha egy karakter Alappenge helyzetben van, akkor nyilván ellenfele is csak abban lehet.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
1 + k20T
```

### Pengeelőny

Fegyvered mérete legalább `1 pengével` hosszabb ellenfeledénél. **Csak akkor** kerül valaki Pengeelőnybe - és így a másik Pengehátrányba - ha ez a pengeméret különbség megvan.

Hatás: [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) ↓

```
2 + k20T
```

<br />

---
## Gyengébb kéz

```
Hátrány-1 TÉ dobásra
```

🔆 [Kétkezesség](fortelyok.harci/ketkezesseg.md) fortély: bármelyik kezeddel levonás nélkül tudsz harcolni - de csak `1` fegyverrel!

<br />

---
## Hajítás alkalmatlan fegyverrel

```
Hátrány-2 Sebzésdobásra
Hátrány-2 CÉ dobásra
Fegyver CÉ = 0
SP: fegyver eredeti sebzése - 5
```

⚡ Példa: hosszú kard hajítása

🔆 Mérsékelheti: [Alkalmatlan fegyver hajítása](fortelyok.harci/alkalmatlan_fegyver_hajitasa.md) fortély

---
## Hajítás nem dobásra készített tárgyakkal

```
Hátrány-1 CÉ dobásra
Hátrány-1 Sebzésdobásra

Fegyver CÉ = 0
SP: -5 + k20 (FP vagy ÉP: KM dönt)
```

⚡ Példa: sámli hajítása

🔆 Bővebben: [Nem dobásra készített tárgyak harcértékei](068_07_hajitofegyverek.md#-nem-dobásra-készített-tárgy)

🔆 Mérsékelheti: [Alkalmatlan tárgyak hajítása](fortelyok.harci/alkalmatlan_targyak_hajitasa.md) fortély

<br />

---
## Képzetlen fegyverhasználat

→ [Harcmodor képzettségek és Bónuszaik](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)

🔆 `3.szint` alatti kapcsolódó [Harcmodor](kepzettsegek.primer/harci/harcmodor.md) képzettségnél

<br />

---
## Pusztakezes harc

Egy fegyvertelen harcos jelentős hátrányban van egy fegyveressel szemben, ezért negatívak a [Puszta kéz](068_02_kozelharci_fegyverek.md) harcértékei.

```
Puszta kéz harcértékei

KÉ: -3, TÉ: -3, VÉ: -3
```

🔆 Kapcsolódik:

- [Természetes fegyver](fortelyok.harci/termeszetes_fegyver.md) fortély
- [Belharci helyzet](065_01_02_semleges_helyzetek.md#belharci-helyzet), ahol a Puszta kéz harcértékei `0`-ra emelkednek és járnak a **Belharcból** eredő esetleges módosítók is.

🔆 A **Puszta kéz** "egykezes" fegyvernek számít, tehát **nem** lehet vele **Kétkezes harcot** folytatni

<br />

---
## Sebzéstípusok

### Sebzéstípus: elsődleges

```
Sima Sebzésdobás
```

Fegyvered elsődleges sebzési típusával támadsz. Például "Hosszú kard: Vágás".

### Sebzéstípus: másodlagos

Fegyvered másodlagos sebzési típusával támadsz. Például "Hosszú kard: Szúrás".

```
Hátrány-1 Sebzésdobásra
```

### Sebzéstípus: alkalmatlan

```
Hátrány-2 Sebzésdobásra
```

Fegyvered nem erre a sebzési típusra lett kialakítva. Például "Hosszú kard: Zúzás".

---

🔗 [Harci helyzetek](065_01_00_harci_helyzetek.md) ↑

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
