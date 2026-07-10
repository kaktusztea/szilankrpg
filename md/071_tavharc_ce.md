## Célzó Érték számítása

Mikor a **támadó** fél lövést, vagy hajítást végez, a `Célzó Értékét` állítja szembe a célpont távolsági `Védő Értékével`. A **Célzott Támadó dobás** így néz ki:

```
Támadó          Célpont
CÉ + k20   vs   Távolsági VÉ
```

A `Célzó Érték` kiszámolása a következőképpen történik - még karakteralkotási időben:

```
Támadó CÉ =
  -15
  + Önuralom
  + CM
  + Harcmodor CÉ
  + Fegyver CÉ
  + Mf-bónusz
```

```
-15: Konstans
  Védő Érték Alap, ami gyorsításként
  került át a CÉ alá, negatív előjellel.

+ Önuralom Tulajdonság: 1:1 beszámít

+ CM: Célzóérték Módosító
   Tapasztalati Szintenként legfeljebb
   2 pont vehető fel. 1 CM = 6 KP

+ Harcmodor CÉ
   Harcmodor képzettség szint bónusza
   (lásd a Harcmodor képzettségeket!)

+ Fegyver CÉ
   Egyedi fegyver érték.
   Irányszámok:
   +0   → Nem hajításra alkalmas tárgyak
   +1-2 → Apró, alkalmas fegyverek
   +2-3 → Hajító szálfegyverek
   +2-3 → Apró hajítófegyverek
   +5-6 → Íjak
   +5-8 → Nyílpuskák
   (+15 → Távcsöves puska)

+ Mesterfegyver fortély (max 3 fok)
   CÉ: +1 / fok bónusz
   Konkrét távolsági fegyverre
```

Lásd bővebben:
- [Harcmodor képzettségek bónuszai](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)
- [Hajítófegyverek harcértékei](068_07_hajitofegyverek.md)
- [Lőfegyverek harcértékei](068_08_lofegyverek.md)

<br />

---
## CÉ Módosítók

→ [Távharci helyzetek](074_tavharci_helyzetek.md)\
→ [Távolsági fortélyok](044_harci_fortelyok.md#t%C3%A1vols%C3%A1gi-harci-fort%C3%A9lyok)

```
Kitartott célzás helyzet
 +3: alapeset
 +7: "Kitartott célzás fejlesztése" fortéllyal
     (+3 alapeset + 4 fortély)

Lövés reflexből helyzet
 -7: Lövés reflexből
 -0: "Lövés reflexből fejlesztése" fortéllyal
```

🔆 **Kitartott célzás**: íjnál csak `1` körig lehet kitartani! `1` kör után nincs bónusz, sőt körönként `CÉ:-3` büntetés jár!

### Kapcsolódik

- [Távolsági fortélyok](044_harci_fortelyok.md#t%C3%A1vols%C3%A1gi-harci-fort%C3%A9lyok)
- [Fegyver minősége](068_01_14_fegyverek_minosege_ideaja.md)
- [Távolsági Harcmodor képzettség](kepzettsegek.primer/harci/tavolsagi_harcmodor.md)

---

🔗 [Osztó és Cella értéke a távolsági Védő Értékben](072_01_tavharc_ve_oszto_cella.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)
