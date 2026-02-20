# Varázskeret, Rekeszek

Karaktered egy **Varázskeretet** kap, amely úgynevezett **Rekeszekből** áll. Ezen Rekeszek [Erősség](102_04_varazslat_erossege.md) értékeikhez vannak rendelve és azt mutatják meg, mennyire hatalmas varázslatokat formázhatsz meg ha tudásod maximumát, vagy annak határát próbálod súrolni. Ezek a **Rekeszek** az adott Erősségű varázslat használatakor kiürülnek - ez modellezi a mágikus kifáradást.

```
Max E:   1 db
Max E-1: 1 db
Max E-2: 1 db
1 ... (Max E-3): bármennyit
```

A Szilánk rendszerében a `3` legnagyobb Erősséget kezeljük **Rekeszként**, - látható, hogy a további, gyengébb varázslatokra nincs megkötés, azokból bármennyit elvarázsolhatsz. Ezzel a módszerrel modellezzük egyre növekvő hatalmadat, ahogy Misztikus **Tradíció** képzettségedben is fejlődsz.

### Rekesz elhasználása

Amennyiben varázslatod Erősség egy Rekesz alá tartozik, húzd ki / ikszeld ki az adott Rekeszt. A regenerációig ilyen Erősségű varázslatot már nem használhatsz.

Nyilván Magasabb `E` varázslat Rekeszt is felhasználhatsz alacsonyabb **E** céljára - ha valamilyen speciális okból ezt akarnád. Például ha már elhasználtad `6E` varázslatodat, akkor a még meglevő `7E` Rekeszt felhasználhatod `6E` formájában is.

### Minden Rekesz üres

Amennyiben minden Rekeszed kiürült, akkor is képes vagy Szabad varázslatok alkalmazására a továbbiakban.

### ⚡Példa Rekeszekre

**Vulgármágia Tradíció**: `7.szint`

```
7 E:   1 db
6 E:   1 db
5 E:   1 db
1..4 E: bármennyit
```

### Szabad varázslatok

✅ Agóra

A gyengébb, **nem** Rekesz Erősségek alá tartozó varázslatok neve: **Szabad varázslat**. Ezekből nagyjából bármennyit elhasználhatsz.

```
Opcionális:
  Edzettség Tulajdonságpróba

Rontás < 3   → 1 FP
Rontás >= 3  → 3 FP
```

Ha folyamatosan, kiugróan sokat alkalmazol Szabad varázslatokat, akkor a KM - az adott szituáció függvényében dönthet úgy, hogy **Edzettség Tulajdonságpróbát** kell dobnod - az általa megadott Nehézség ellen.

Ha a próba sikertelen és rontásod kisebb, mint `3`, akkor `1 FP` büntetést kapsz. Ha rontásod `3` vagy annál nagyobb, akkor pedig `3 FP` a penzium.

<br />

---
## Varázskeret, Rekesz regeneráció - automatikus

✅ Agóra

```
Passzívan
 1 Rekesz / óra
```

Alapesetben `1 db` Rekesz töltődik vissza óránként. Ehhez a varázstudónak nem kell semmit csinálnia. A sorrend: először a legalacsonyabb Erősségű Rekesz, majd felfele sorban a többi regenerálódik.

## Varázskeret, Rekesz regeneráció - aktív visszanyerés

→ [STUDY: Varázskeret, Rekesz regeneráció](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.varazskeret.rekesz.regeneracio) ⭕TODO⭕

<br />

---
## 🔆 Erősség túlvállalás

→ [ADR: Varázslat túlvállalás](https://github.com/kaktusztea/szilankrpg/wiki/ADR.varazslat.erosseg.tulvallalasos.kimerules.modell) ⭕TODO⭕

---
## 🔆 Összetett próba varázslás Erősségnél

Nagyobb, hosszabb varázslatoknál a KM előírhat összetett próbát. Példa:

```
E igény

1 db 7E Rekesz
1 db 6E Rekesz
+ tovább tarthat a varázslás
```

<br />

---
## 🔆 Mágikus összhangok hatása Erősségre

→ [Mágikus komponensek, összhangok](105_magikus_komponensek_osszhangok.md) ⭕TODO⭕
→ [STUDY oldal](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.magikus.komponensek.osszhangok) ⭕TODO⭕

Rekesz Erősséget módosítanak.

```
[-3; +3]
```

#### ⚡Példa: Tűzvarázslat

- `4`-es Rekeszt használok el, de `7E`-vel hat (`+3`) vulkán mellett.
- `7`-es Rekeszt használok el, de `4E`-vel hat (`-3`) tó mellett.

---

🔗 [Varázslat Komplexitása](102_06_varazslat_komplexitasa.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#10-mágiarendszer-)
