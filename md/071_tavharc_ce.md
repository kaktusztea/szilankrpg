## Célzó Érték számítása

Mikor a támadó lövést, vagy hajítást végez, a Célzó Értékét állítja szembe a célpont távolsági Védő Értékével. A Célzó Érték kiszámolása a következőképpen történik - még karakteralkotási időben.

```
Támadó CÉ =
    -10
    + CM
    + Harcmodor CÉ
    + Önuralom
    + Fegyver CÉ
    + Mf-bónusz
```

|     **Összeadandó értékek**     | **Leírás**                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :-----------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|              `-10`              | Konstans. Ez az érték gyakorlatilag a célpont Védő Érték alapját adná, de mivel itt csak egyszer (karakteralkotáskor) kell vele számolni, ezért a számolás meggyorsítása miatt átkerült ide negatív előjellel.                                                                                                                                                                                                                                             |
|               CM                | Célzóérték Módosító. Szintenként legfeljebb `2` (⭕k20) vehető fel. `1 CM = 6 KP`                                                                                                                                                                                                                                                                                                                                                                           |
|          Harcmodor CÉ           | Harcmodor képzettség szintje által kapott bónusz (lásd a [Harcmodor képzettségeket](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)!)                                                                                                                                                                                                                                                                                                                       |
|            Önuralom             | Az **Önuralom** Tulajdonság                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Fegyver CÉ<br>(kategória függő) | Különbséget teszünk a fegyverkategóriák közt attól függően, hogy alapesetben milyen könnyű velük célba találni. Az alábbi értékek csak irányszámok, a konkrét fegyver értékek ettől eltérhetnek.<br> • Hajító szálfegyverek: `CÉ:+0` ⭕k20<br> • Apró hajítófegyverek: `CÉ:+4` ⭕k20<br> • Íjak: `CÉ:+10` ⭕k20<br> • Nyílpuskák: `CÉ:+16` ⭕k20<br />Lásd a [Hajítófegyverek](068_07_hajitofegyverek.md) és [Lőfegyverek](068_08_lofegyverek.md) fejezeteket! |
|      Mesterfegyver fortély      | Mesterfegyver fortély után járó bónusz, amennyiben a használt fegyverre felvette a karakter. Fokonként `CÉ:+3` bónusz.                                                                                                                                                                                                                                                                                                                                     |

<br />

---
## Módosítók

⭕k20 konverzió kész, tesztelni az értékeket

| Módosító                                                                                                                                                 |  **CÉ**   |
| :------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| Célzás → 1 célzással eltöltött kör után (nem additív) 🔆                                                                                                 |   `+3`    |
| Célzás → 1 célzással eltöltött kör után (nem additív) - [Képzett célzás](fortelyok.tavharc/kepzett_celzas.md) fortéllyal 🔆                              |   `+7`    |
| Képzetlenségből adódó levonás                                                                                                                            |   `-13`   |
| Hirtelen lövés                                                                                                                                           |   `-10`   |
| Álló cél "belövése" (gyakorlás) min. negyed órán át                                                                                                      |  `+3-10`  |
| [Fegyver minősége](068_01_fegyverek_altalanos_szabalyai.md#fegyverek-minősége-ideája)                                                                    | `[-3;+3]` |
| Nem “belőtt” íjak  / most lő először ezzel az íjjal - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) 9.szintje alatt            |   `-10`   |
| Nem “belőtt” nyílpuskák / most lő először ezzel a nyílpuskával - [Távolsági Harcmodor](kepzettsegek.primer.harci/tavolsagi_harcmodor.md) 9.szintje alatt |   `-5`    |
| Egyes [Távolsági Harci Fortélyokból](044_harci_fortelyok.md#távolsági-harci-fortélyok) adódó bónuszok.                                                   |           |

🔆 **Célzás**: íjnál csak 1 körig lehet kitartani! 1 kör után nincs bónusz, sőt körönként `CÉ:-3` büntetés jár!

### Fegyver belövése

Ha **legalább fél órát** töltött el a karakter a “belövéssel”,  a "*Nem belőtt (fegyver)*" büntető módosítók megszűnnek. A használat során folyamatosan tűnik el a hátrány - erre már felesleges képletet alkotni - a KM dönt.

---
## Célzott Támadó dobás

```
CÉ + k20  vs  VÉ
```

---

🔗 [Célpont Védő Értékének számítása, Szorzó, Osztó](072_tavharc_ve_szorzo_oszto.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
