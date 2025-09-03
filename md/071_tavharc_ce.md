## Célzó Érték számítása

Mikor a **támadó** lövést, vagy hajítást végez, a `Célzó Értékét` állítja szembe a célpont távolsági `Védő Értékével`. A **Célzott Támadó dobás** így néz ki:

```
Támadó          Célpont
CÉ + k20   vs   VÉ
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
 • CÉ: +0 → Nem hajításra alkalmas tárgyak
 • CÉ: +1-2 → Apró, alkalmas fegyverek
 • CÉ: +2-3 → Hajító szálfegyverek
 • CÉ: +2-3 → Apró hajítófegyverek
 • CÉ: +5-6 → Íjak
 • CÉ: +5-8 → Nyílpuskák
 • (CÉ: +15 → Távcsöves puska) 
 • (Hajító / Lőfegyverek harcértékei)

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
Célzás

+3: Célzás
    1 célzással eltöltött
    kör után (nem additív) 🔆
+7: Célzás +Képzett célzás fortély
    1 célzással eltöltött
    kör után (nem additív) 🔆
-7: Hirtelen lövés
```
🔆 **Célzás**: íjnál csak `1` körig lehet kitartani! `1` kör után nincs bónusz, sőt körönként `CÉ:-3` büntetés jár!

```
Fegyver, Belövés

-10: Új fegyver
    Nem “belőtt” íjak, vagy 
    most lő először ezzel.
    Harcmodor 9.szintje alatt
    
+[3-10]: Konkrét álló cél
    Ennek "belövése" minimum
    negyed órán át (gyakorlás)

[-5;+5]: Fegyver minősége
```

Bővebben:
- [Fegyver minősége](068_01_fegyverek_altalanos_szabalyai.md#fegyverek-minősége-ideája)
- [Távolsági fortélyok bónuszai](044_harci_fortelyok.md#t%C3%A1vols%C3%A1gi-harci-fort%C3%A9lyok)
- [Távolsági Harcmodor képzettség](kepzettsegek.primer.harci/tavolsagi_harcmodor.md)

### Fegyver belövése

Ha **legalább fél órát** töltött el a karakter a “belövéssel”,  a **"Nem belőtt (fegyver)"** büntető módosítók megszűnnek. A használat során folyamatosan tűnik el a hátrány - erre már felesleges képletet alkotni - a KM dönt.

---

🔗 [Osztó és Cella értéke a távolsági Védő Értékben](072_tavharc_ve_oszto_cella.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
