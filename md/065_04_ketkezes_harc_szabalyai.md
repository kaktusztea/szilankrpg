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

## SUM Pengeméretek

A két fegyver pengeméreteinek összege.
  
```
Max: 2 x 1 penge

2 penge felett
  fegyverek harcértéke: 0

„rövid” fegyverek
  0 pengének számítanak
```

<br />

## Harckeret módosítók

```
-1: minden 0.5 penge
    (SUM pengeméretek)

+1: Kétkezesség fortély

+1: Kétkezes harc 0.fok
+2: Kétkezes harc 1.fok
+3: Kétkezes harc 2.fok
+4: Kétkezes harc 3.fok
```



<br />

## Sebzés

Mindig az ügyesebb kézben levő fegyver sebez.\
Kivéve direkt a [Rosszabbik kézben tartott fegyverrel](065_01_04_fegyver_harci_helyzetek.md#rosszabbik-k%C3%A9zben-tartott-fegyver) támadáskor.

<br />

---
### ⚡Példa-1: Harc 2 db tőrrel

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

### ⚡Példa-2: Szablya + tőr

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
