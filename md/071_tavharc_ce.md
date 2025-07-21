## Célzó Érték számítása

Mikor a támadó lövést, vagy hajítást végez, a Célzó Értékét állítja szembe a célpont távolsági Védő Értékével. A Célzó Érték kiszámolása a következőképpen történik - még karakteralkotási időben.

```
Támadó CÉ =
    -30
    + CM
    + Harcmodor CÉ
    + (2 x Önuralom)
    + Fegyver CÉ
    + Mf-bónusz
```

|     **Összeadandó értékek**     | **Leírás**                                                                                                                                                                                                                                                                                                                                                                                                                             |
|:-------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|              `-30`              | Konstans. Ez az érték gyakorlatilag a célpont Védő Érték alapját adná, de mivel itt csak egyszer (karakteralkotáskor) kell vele számolni, ezért a számolás meggyorsítása miatt átkerült ide negatív előjellel.                                                                                                                                                                                                                         |
|               CM                | Célzóérték Módosító. Szintenként legfeljebb `4` vehető fel. `1 CM = 2 KP`                                                                                                                                                                                                                                                                                                                                                              |
|          Harcmodor CÉ           | Harcmodor képzettség szintje által kapott bónusz (lásd a [Harcmodor képzettségeket](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)!)                                                                                                                                                                                                                                                                                                   |
|          `2x` Önuralom          | Az **Önuralom** Tulajdonság kétszerese                                                                                                                                                                                                                                                                                                                                                                                                 |
| Fegyver CÉ<br>(kategória függő) | Különbséget teszünk a fegyverkategóriák közt attól függően, hogy alapesetben milyen könnyű velük célba találni. Az alábbi értékek csak irányszámok, a konkrét fegyver értékek ettől eltérhetnek.<br> • Hajító szálfegyverek: `CÉ:+0`<br> • Apró hajítófegyverek: `CÉ:+4`<br> • Íjak: `CÉ:+10`<br> • Nyílpuskák: `CÉ:+16`<br />Lásd a [Hajítófegyverek](068_007_hajitofegyverek.md) és [Lőfegyverek](068_008_lofegyverek.md) fejezeteket! |
|      Mesterfegyver fortély      | Mesterfegyver fortély után járó bónusz, amennyiben a használt fegyverre felvette a karakter. Fokonként `CÉ:+3` bónusz.                                                                                                                                                                                                                                                                                                                 |

<br />

---
## Módosítók

| Módosító                                                                                                                                                 |   **CÉ**    |
| :------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: |
| Célzás → 1 célzással eltöltött kör után (nem additív) 🔆                                                                                                 |    `+10`    |
| Célzás → 1 célzással eltöltött kör után (nem additív) - [Képzett célzás](fortelyok.tavharc/kepzett_celzas.md) fortéllyal 🔆                              |    `+20`    |
| Képzetlenségből adódó levonás                                                                                                                            |    `-40`    |
| Hirtelen lövés                                                                                                                                           |    `-30`    |
| Álló cél "belövése" (gyakorlás) min. negyed órán át                                                                                                      |  `+10-30`   |
| [Fegyver minősége](068_001_fegyverek_altalanos_szabalyai.md#fegyverek-min%C5%91s%C3%A9ge-ide%C3%A1ja)                                                    | `[-10;+10]` |
| Nem “belőtt” íjak  / most lő először ezzel az íjjal - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) 9.szintje alatt            |    `-30`    |
| Nem “belőtt” nyílpuskák / most lő először ezzel a nyílpuskával - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) 9.szintje alatt |    `-15`    |
| Egyes [Távolsági Harci Fortélyokból](044_harci_fortelyok.md#távolsági-harci-fortélyok) adódó bónuszok.                                                   |             |

🔆 **Célzás**: íjnál csak 1 körig lehet kitartani! 1 kör után nincs bónusz, sőt körönként `CÉ:-10` büntetés jár!

### Fegyver belövése

Ha **legalább fél órát** töltött el a karakter a “belövéssel”,  a "*Nem belőtt (fegyver)*" büntető módosítók megszűnnek. A használat során folyamatosan tűnik el a hátrány - erre már felesleges képletet alkotni - a KM dönt.

---
## Célzott Támadó dobás

```
CÉ + k100  vs  VÉ
```

---

🔗 [Célpont Védő Értékének számítása, Szorzó, Osztó](072_tavharc_ve_szorzo_oszto.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
