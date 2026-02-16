# Varázslat Erőssége

⭕TODO⭕: ezek alól ide migrálni.

- [ADR: Mágia Erőssége](https://github.com/kaktusztea/szilankrpg/wiki/ADR.varazslat.erossege)
- [ADR: Mágia Erősség Túlvállalás, Kimerülés modell](https://github.com/kaktusztea/szilankrpg/wiki/ADR.varazslat.erosseg.tulvallalasos.kimerules.modell)


A változtatás "energiaigényét", nagyságát szimbolizálja.

<br />

## Max Erősség

A **Mágia tradíció képzettség** szintje limitálja a mágia Erősséget.

```
Max varázslat Erősség
 = Mágia Tradíció képzettség
```

## Varázslat szükséges Erőssége

```
- vagy az adott varázslat leírásában szerepel
- vagy te számolod ki / mondod meg mekkorát
  akarsz (ha skálázható mint pl. egy tűznyíl)
- vagy a KM mond egy 1-15 közötti értéket
  a leírt kívánt hatás alapján, amit leírsz neki
```

<br />

---
## Mágiakeret, rekeszek

Karaktered egy Mágiakeretet kap, amely meghatározza, hogy az adott **jelenetben** (egy teljes harc) hány darab, mekkora erősségű (`E`) varázslatot lőhetsz el. A jelenet a zavartalan nyugalmi pillanatig tart (mikor a `VÉ` csökkenések hatása is elmúlik). A felső `3 db` rekesz ekkor "töltődik vissza".

```
Max E:   1 db
Max E-1: 1 db
Max E-2: 1 db
1 ... (Max E-3): bármennyit
```

Példa: Vulgármágia Tradíció: `7.szint`

```
7 E:   1 db
6 E:   1 db
5 E:   1 db
1..4 E: bármennyit
```

🔆 Magasabb `E` varázslat rekeszt is felhasználhatsz alacsonyabb **E** céljára - ha valamiért ezt akarnád. Például ha már elhasználtad `6E` varázslatodat, akkor még meglevő `7E` slotodat felhasználhatod `6E` formájában is.

🔆 Erősségre hathatnak az Összhangok

<br />

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
## Mágikus összhangok hatása Erősségre

Rekesz Erősséget módosítanak.

```
[-3; +3]
```

Példa: Tűzvarázslat
- 4-es Slotot lövök el, de 7E-vel hat (+3) vulkán mellett.
- 7-es Slotot lövök el, de 4E-vel hat (-3) tó mellett.

---
## Mágia slot regeneráció

→ [ADR: Varázslat túlvállalás](https://github.com/kaktusztea/szilankrpg/wiki/ADR.varazslat.erosseg.tulvallalasos.kimerules.modell) ⭕

---

🔗 [Varázslat Komplexitása](102_05_varazslat_komplexitasa.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#10-mágiarendszer-)
