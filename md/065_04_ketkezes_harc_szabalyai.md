## Kétkezes harc szabályai

„_Két fegyver jobb, mint egy_.”

Ha mindkét kezedben fegyvert forgatnál, ahhoz a [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortély valamelyik fokát kell ismerned.

---
### Alapeset, harcérték bónuszok, Harckeret módosítók

Lásd a [fortély leírásában](fortelyok.harci/ketkezes_harc.md)

---
### Harckeret bónuszok, pengehossz függő levonások

A **Harckeretbe** beleszámít a [Kétkezes harc](fortelyok.harci/ketkezes_harc.md) fortély egyes fokai által adott bónusz:

```
0.fok: +1 Harckeret
1.fok: +2 Harckeret
2.fok: +3 Harckeret
3.fok: +4 Harckeret
```

A **Harckeret** értékébe a forgatott fegyverek összesített **hossza** is beleszól:

```
Minden 0.5 penge:
  -1 Harckeret
```

- Adjuk össze a forgatott két fegyver pengehosszait
- Minden `0.5` penge `1` ponttal csökkenti a **Harckeretet**
- **Fontos**: A „rövid” fegyverek `0 pengének` számítanak számolásnál!

<br />

---
### Méret limit, követelmény

- maximum `2 db`, `1 pengés` kombinációval lehet kétkezes harcot folytatni, e összesített pengeméret (`2`) felett semmilyen bónusz nem számít és a fegyverek minden harcértéke `0`-ra esik.
- `2 db`, `1 penge` hosszú fegyver forgatása esetén követelmény is van: `Erő +2`

<br />

---
### Támadások számának kalkulálása

 A **Harckeret** kalkulálásánál a **nagyobb** pengehosszú fegyver **Sebesség** értéke számít.

A **Harckerethez** hozzáadódik a **Kétkezes harc** fortély egyes fokai által adott bónusz.

<br />

---
### Ügyesebb kéz, [Kétkezesség](fortelyok.harci/ketkezesseg.md) fortély 

Kétkezes harc bónuszainak érvényesítéséhez fontos feltétel, hogy a nagyobbik fegyver **csak az ügyesebbik kézben forgatható**.

Kivéve **Kétkezesség** fortély megléte esetén - ekkor nincs ilyen megkötés.

Ha a **Kétkezes harc** legalább `1.fokon` megvan, akkor a **Kétkezesség** megléte `+1` **Harckeret** bónuszt ad.

<br />

---
### Sebzésnél melyik fegyver talál be a kettőből

A `k20`-as sebződobással együtt dobunk `k6`-tal is:

#### Azonos méretű fegyverek esetén

```
1-3: gyengébb kéz fegyvere sebez
4-6: ügyesebb kéz fegyvere sebez
```

#### Nagy + kisebb fegyver esetén

```
1-2: gyengébb kéz fegyvere sebez
3-6: ügyesebb kéz fegyvere sebez
```

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
