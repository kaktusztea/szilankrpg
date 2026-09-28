# Kétkezes harc szabályai

"_Két fegyver jobb, mint egy_."

<br />

## Harcérték kétkezes harcban

Lásd a [Kétkezes harc fortély](fortelyok.harci/ketkezes_harc.md) leírásában.

```
Nagyobb fegyver
  Sebessége számít
  Harcmodora számít
```

❌ Hárítófegyverrel **nem** lehet Kétkezes harcot végezni.

<br />

## SUM [Fegyverhossz](068_01_01_fegyverhossz_kategoriak.md)

A két fegyver "hossz" paraméterének összege.

```
Max: 2 x 3 hossz

SUM 6 hossz felett vagy Fegyverhossz > 6
  fegyverek harcértéke: 0
```

<br />

## Fegyverméretek hatása [Harckeretre](063_04_tamadasok_szama_fegyverrel.md#harckeret)

 A két fegyver összesített "hossz" paraméterét (SUM) `2`-vel osztjuk ↓ és ennyi lejön a Harckeretből.

```
-1: minden 2 hossz után ↓
    (SUM fegyverhossz)
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
Kivéve ha direkt a [Gyengébb kézzel](065_01_04_fegyver_harci_helyzetek.md#gyengébb-kéz) akarsz támadni.

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
  1 = 1 + 0
```

---

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
