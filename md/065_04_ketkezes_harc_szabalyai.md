# Kétkezes harc szabályai

„_Két fegyver jobb, mint egy_.”

Ha mindkét kezedben fegyvert forgatnál, ahhoz a [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortély valamelyik fokát kell ismerned.

---
## Harcérték bónuszok

Lásd a [Kétkezes harc fortély](fortelyok.harci/ketkezes_harc.md) leírásában.

---
## Harckeret módosítók, Támadások száma

```
Nagyobb fegyver Harckeret számít

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

---
## Fegyverméret limit

```
Max SUM pengehossz:
 2 x 1 penge

2 penge SUM felett:
 minden fegyver harcérték: 0
```

<br />

---
## Sebzésnél melyik fegyver sebez

Mindig az ügyesebb kézben levő fegyver sebez - kivéve ha szándékosan a [Rosszabbik kézben tartott fegyverrel](065_01_04_fegyver_harci_helyzetek.md#rosszabbik-k%C3%A9zben-tartott-fegyver) akarsz.

<br />

---
### ⚡Példa-1

```
Harc 2 db tőrrel

„Rövid” fegyverek:
0+0=0 penge → nincs Harckeret levonás:

Kétkezes harc fortély fokai után:
1.fok: +2 Harckeret
2.fok: +3 Harckeret
3.fok: +4 Harckeret
```

### ⚡Példa-2

Harc `2 db` szablyával (`1` pengés fegyverek)

```
Össz hosszuk 2 penge 
 (1 + 1)

→  (2 / 0.5) = 4 levonás
```

Tehát a **Harckeret** `4`-gyel csökken a fegyverek hossza miatt.\
Bónuszok és levonások összege:

```
Kétkezes harc fortély fokai után:
1.fok: (2-4) =  -2 Harckeret
2.fok: (3-4) =  -1 Harckeret
3.fok: (4-4) =  +0 Harckeret
```

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)