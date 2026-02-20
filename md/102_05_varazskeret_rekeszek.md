# Varázskeret, Rekeszek

Karaktered egy Varázskeretet kap, amely úgynevezett **Rekeszekből** Ezen Rekeszek [Erősség](102_04_varazslat_erossege.md) értékei mutatják meg, mennyire hatalmas varázslatokat formázhatsz meg ha tudásod maximumát, vagy annak határát próbálod súrolni. Ezek a Rekeszek az adott Erősségű varázslat használatakor kiürülnek - ez a mágikus kifáradást szimbolizálja.



```
Max E:   1 db
Max E-1: 1 db
Max E-2: 1 db
1 ... (Max E-3): bármennyit
```

A Szilánk rendszerében a `3` legnagyobb Erősséget kezeljük Rekeszként, látható, hogy a további, gyengébb varázslatokra nincs megkötés, azokból bármennyit elvarázsolhatsz. Ezzel modellezzük egyre növekvő hatalmadat, ahogy **Tradíció** képzettségedben is fejlődsz.

### ⚡Példa: Vulgármágia Tradíció: `7.szint`

```
7 E:   1 db
6 E:   1 db
5 E:   1 db
1..4 E: bármennyit
```

### Speciális eset

🔆 Magasabb `E` varázslat rekeszt is felhasználhatsz alacsonyabb **E** céljára - ha valamiért ezt akarnád. Például ha már elhasználtad `6E` varázslatodat, akkor a még meglevő `7E` Rekeszt felhasználhatod `6E` formájában is.

<br />


---
## Mágia rekesz regeneráció

```
Passzívan
 1 rekesz / óra
```

Alapesetben `1 db` Rekesz töltődik vissza óránként. Ehhez a varázstudónak nem kell semmit csinálnia. A sorrend: először a legalacsonyabb Erősségű Rekesz, majd felfele sorban a többi regenerálódik.


---
## 🔆 Erősség túlvállalás

→ [ADR: Varázslat túlvállalás](https://github.com/kaktusztea/szilankrpg/wiki/ADR.varazslat.erosseg.tulvallalasos.kimerules.modell) ⭕TODO⭕

---
## 🔆 Összetett próba varázslás Erősségnél

Nagyobb, hosszabb varázslatoknál a KM előírhat összetett próbát. Példa:

```
1 db 7E
1 db 6E
+ tovább tart a varázslás
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
