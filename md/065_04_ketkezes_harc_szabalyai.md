# Kétkezes harc szabályai

„_Két fegyver jobb, mint egy_.”

<br />

## Harcérték bónuszok

Lásd a [Kétkezes harc fortély](fortelyok.harci/ketkezes_harc.md) leírásában.

<br />

## Harckeret módosítók

```
-1: minden 0.5 penge
    (SUM pengeméretek)

+1: Kétkezes harc 0.fok
+2: Kétkezes harc 1.fok
+3: Kétkezes harc 2.fok
+4: Kétkezes harc 3.fok

+1: Kétkezesség fortély
```

Nagyobb fegyver Sebessége számít.\
A „rövid” fegyverek `0 pengének` számítanak.

<br />

## Fegyverméret limit

```
Max SUM pengehossz:
 2 x 1 penge

SUM 2 penge felett:
 fegyverek harcértéke: 0
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

Harckeret
 +3: Kétkezes harc (2.fok)
 -0 = 0 / 0.5  (Σ 0+0 penge)
```

### ⚡Példa-2: Szablya + tőr

```
Kétkezes harc: 3.fok
→ Fegyver harcértékek összeadódnak
→ Mf: Szablya ÉS Tőr is számít

Harckeret
 +4: Kétkezes harc (3.fok)
 -3 = 1.5 / 0.5  (Σ 1 + 0.5 penge)
```

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
