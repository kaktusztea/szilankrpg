## Célzó Érték számítása

Mikor a támadó lövést, vagy hajítást végez, a `Célzó Értékét` állítja szembe a célpont távolsági `Védő Értékével`. A **Célzott Támadó dobás** így néz ki:

```
Támadó CÉ + k20   vs   Célpont VÉ
```

A `Célzó Érték` kiszámolása a következőképpen történik - még karakteralkotási időben:

```
Támadó CÉ =
    -10
    + CM
    + Harcmodor CÉ
    + Önuralom
    + Fegyver CÉ
    + Mf-bónusz
```

```
-10: Konstans
  Ez az érték gyakorlatilag a célpont
  Védő Érték alapját adná, de mivel
  itt csak egyszer (karakteralkotáskor)
  kell vele számolni, ezért a számolás
  meggyorsítása miatt átkerült ide
  negatív előjellel.

+ CM: Célzóérték Módosító
   Tapasztalati Szintenként legfeljebb
   2 pont vehető fel. 1 CM = 6 KP

+ Harcmodor CÉ
   Harcmodor képzettség szint bónusza
   (lásd a Harcmodor képzettségeket!)

+ Önuralom Tulajdonság: 1:1 beszámít

+ Fegyver CÉ
   fegyverkategóriák különbsége:
   alapesetben milyen könnyű a találat
   Irányszámok:
 • CÉ: +0 - Nem hajításra való tárgyak
 • CÉ: +2 - Apró, alkalmas fegyverek
 • CÉ: +3 - Hajító szálfegyverek
 • CÉ: +3 - Apró hajítófegyverek
 • CÉ: +6 - Íjak
 • CÉ: +8 - Nyílpuskák
 • (CÉ: +15 - Távcsöves puska) 
 • (Hajítófegyverek Lőfegyverek harcértékei)

+ Mesterfegyver fortély (max 3 fok)
   CÉ: +1 / fok bónusz
   adott távolsági fegyverre
```

Lásd bővebben:
- [Harcmodor képzettségek bónuszai](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)
- [Hajítófegyverek harcértékei](068_07_hajitofegyverek.md)
- [Lőfegyverek harcértékei](068_08_lofegyverek.md)

<br />

---
## Módosítók

| Módosító                                                                                                                                                   |  **CÉ**   |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------- |:---------:|
| Célzás → 1 célzással eltöltött kör után (nem additív) 🔆                                                                                                   |   `+3`    |
| Célzás → 1 célzással eltöltött kör után (nem additív) - [Képzett célzás](fortelyok.tavharc/kepzett_celzas.md) fortéllyal 🔆                                |   `+7`    |
| Hirtelen lövés                                                                                                                                             |   `-7`    |
| Álló cél "belövése" (gyakorlás) min. negyed órán át                                                                                                        | `+[3-10]` |
| [Fegyver minősége](068_01_fegyverek_altalanos_szabalyai.md#fegyverek-minősége-ideája)                                                                      | `[-5;+5]` |
| Nem “belőtt” íjak  / most lő először ezzel az íjjal - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) `9.szintje` alatt            |   `-10`   |
| Nem “belőtt” nyílpuskák / most lő először ezzel a nyílpuskával - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) `9.szintje` alatt |   `-5`    |
| Egyes [Távolsági Harci Fortélyokból](044_harci_fortelyok.md#távolsági-harci-fortélyok) adódó bónuszok.                                                     |           |

🔆 **Célzás**: íjnál csak 1 körig lehet kitartani! 1 kör után nincs bónusz, sőt körönként `CÉ:-3` büntetés jár!

### Fegyver belövése

Ha **legalább fél órát** töltött el a karakter a “belövéssel”,  a "*Nem belőtt (fegyver)*" büntető módosítók megszűnnek. A használat során folyamatosan tűnik el a hátrány - erre már felesleges képletet alkotni - a KM dönt.

---

🔗 [Osztó értéke a távolsági Védő Értékben](072_tavharc_ve_oszto.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
