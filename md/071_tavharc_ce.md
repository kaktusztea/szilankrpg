## Célzó Érték számítása

Mikor a **támadó** lövést, vagy hajítást végez, a `Célzó Értékét` állítja szembe a célpont távolsági `Védő Értékével`. A **Célzott Támadó dobás** így néz ki:

```
Támadó          Célpont
CÉ + k20   vs   VÉ
```

A `Célzó Érték` kiszámolása a következőképpen történik - még karakteralkotási időben:

```
Támadó CÉ =
    -15
    + CM
    + Harcmodor CÉ
    + Önuralom
    + Fegyver CÉ
    + Mf-bónusz
```

```
-15: Konstans
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
   +0 → Nem hajításra alkalmas tárgyak
   +1-2 → Apró, alkalmas fegyverek
   +2-3 → Hajító szálfegyverek
   +2-3 → Apró hajítófegyverek
   +5-6 → Íjak
   +5-8 → Nyílpuskák
   (+15 → Távcsöves puska) 
   (Hajító / Lőfegyverek harcértékei)

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
## CÉ Módosítók

→ [Távolsági fortélyok bónuszai](044_harci_fortelyok.md#t%C3%A1vols%C3%A1gi-harci-fort%C3%A9lyok)

```
+3: 1 célzással eltöltött
    kör után (nem additív) 🔆
+7: Kitartott célzás fortéllyal
    1 célzással eltöltött
    kör után (nem additív) 🔆
-7: Hirtelen lövés
```

🔆 **Célzás**: íjnál csak `1` körig lehet kitartani! `1` kör után nincs bónusz, sőt körönként `CÉ:-3` büntetés jár!

### Bővebben

- [Fegyver minősége](068_01_13_fegyverek_minosege_ideaja.md)
- [Távolsági fortélyok bónuszai](044_harci_fortelyok.md#t%C3%A1vols%C3%A1gi-harci-fort%C3%A9lyok)
- [Távolsági Harcmodor képzettség](kepzettsegek.primer.harci/tavolsagi_harcmodor.md)

---

🔗 [Osztó és Cella értéke a távolsági Védő Értékben](072_tavharc_ve_oszto_cella.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
