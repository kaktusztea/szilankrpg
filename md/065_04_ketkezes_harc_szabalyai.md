# Kétkezes harc szabályai

„_Két fegyver jobb, mint egy_.”

Ha mindkét kezedben fegyvert forgatnál, ahhoz a [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortély valamelyik fokát kell ismerned.

<br />

## Harcérték bónuszok

Lásd a [Kétkezes harc fortély](fortelyok.harci/ketkezes_harc.md) leírásában.

<br />

## Harckeret módosítók

```
Nagyobb fegyver Sebessége számít

→ minden 0.5 penge: -1 Harckeret
  (SUM pengeméretek)

→ Kétkezes harc fortély bónusz
  0.fok: +1 Harckeret
  1.fok: +2 Harckeret
  2.fok: +3 Harckeret
  3.fok: +4 Harckeret

→ Kétkezesség fortély: +1 Harckeret
```

 A „rövid” fegyverek `0 pengének` számítanak.

<br />

## Fegyverméret limit

```
Max SUM pengehossz:
 2 x 1 penge

2 penge SUM felett:
 minden fegyver harcérték: 0
```

<br />

## Sebzés

Mindig az ügyesebb kézben levő fegyver sebez.\
Kivéve ha szándékosan a [Rosszabbik kézben tartott fegyverrel](065_01_04_fegyver_harci_helyzetek.md#rosszabbik-k%C3%A9zben-tartott-fegyver) akarsz támadni.

<br />

---
### ⚡Példa-1: Harc 2 db tőrrel

```
Kétkezes harc: 2.fok
→ Fegyver harcértékek összeadódnak
→ Egyik Mf számít csak Tőrre

Harckeret
 +3: Kétkezes harc: 2.fok
 -0: SUM pengehossz: 0 penge (0+0)
```

### ⚡Példa-2: Harc `2 db` szablyával

```
Kétkezes harc: 3.fok
→ Fegyver harcértékek összeadódnak
→ Mf 2x számít

Harckeret
 +4: Kétkezes harc: 3.fok
 -4: SUM pengehossz: 2 penge (1+1)
```

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
