# Kétkezes harc szabályai

„_Két fegyver jobb, mint egy_.”

<br />

## Harcérték kétkezes harcban

Lásd a [Kétkezes harc fortély](fortelyok.harci/ketkezes_harc.md) leírásában.

```
Nagyobb fegyver
  Sebessége számít
  Harcmodora számít
```

<br />

## SUM [Pengeméretek](065_01_04_fegyver_harci_helyzetek.md#fegyverm%C3%A9ret)

A két fegyver pengeméreteinek összege.

```
Max: 2 x 1 penge

SUM 2 penge felett
  fegyverek harcértéke: 0

„rövid” fegyverek
  0 pengének számítanak
```

<br />

## Fegyverméretek hatása [Harckeretre](063_04_tamadasok_szama_fegyverrel.md#harckeret)

 A két fegyver összpengeméretét (SUM) elosztjuk `0.5`-tel és ennyi lejön a Harckeretből.

```
-1: minden 0.5 penge után
    (SUM pengeméretek)
```

### Fortélyok hatása [Harckeretre](063_04_tamadasok_szama_fegyverrel.md#harckeret)

```
+1: Kétkezesség fortély

+1: Kétkezes harc 0.foka
+2: Kétkezes harc 1.foka
+3: Kétkezes harc 2.foka
+4: Kétkezes harc 3.foka
```

<br />

## Sebzés

Mindig az ügyesebb kézben levő fegyver sebez.\
Kivéve ha direkt a [Rosszabbik kézben tartott fegyverrel](065_01_04_fegyver_harci_helyzetek.md#rosszabbik-k%C3%A9zben-tartott-fegyver) akarsz támadni.

<br />

---
### ⚡Példa: Harc 2 db tőrrel

```
Kétkezes harc: 2.fok
→ Fegyver harcértékek összeadódnak
→ Mf: csak 1x számít Tőrre

Harckeret: +3
 +3: Kétkezes harc (2.fok)
 -0 = 0 / 0.5 (pengehossz után)
 
```

```
SUM Pengeméret
  0 = 0 + 0
```

### ⚡Példa: Szablya + tőr

```
Kétkezes harc: 3.fok
→ Fegyver harcértékek összeadódnak
→ Mf: Szablya ÉS Tőr is számít

Harckeret: +1
 +4: Kétkezes harc (3.fok)
 -3 = 1.5 / 0.5 (pengehossz után)
```

```
SUM Pengeméret
  1.5 = 1 + 0.5
```

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
