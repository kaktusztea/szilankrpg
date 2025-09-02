## Célpont Védő Érték kiszámítása

🔆 A lenti számítások automatizálva lettek a [Karakteralkotó](start.md#karakteralkot%C3%B3) "**Harcértékek**" fülének tetején, így játék közben könnyen tudod kalkulálni a célpont Védő Értékét.

- [Szorzó leírása](073_tavharc_ve_szorzo.md)
- [Osztó, Cella leírása](072_tavharc_ve_oszto_cella.md)

```
Cella =
  (Távolság (m) / Fegyver Osztó) ↑
```

```
Célpont VÉ = 
  Szorzó  x  Cella
```

A célpont `Védő Értékét` a korábban tárgyalt **Szorzó** és a célpont Távolságának és a **Fegyver Osztó** hányadosának (**Cella**) szorzataként kapjuk meg.

A célpont `Védő értéke` reprezentálja a célpont eltalálásának nehézségét. Ugyanolyan célszámként viselkedik, mint a rendes `Védő érték`, azaz, ha a lövést/hajítást végző karakter `Célzó Értékkel` együtt számított **Támadó dobása** eléri, vagy meghaladja ezen értéket, akkor találatról beszélünk. Amennyiben az érték alatta marad, a támadás célt téveszt.

<br />

---
#### 🔆 Speciális eset: Szorzó értéke `1` alá kerülne

Ritkán fordul elő ez az eset, főleg álldogáló, nagy méretű célok esetén. Ilyenkor a `Védő Érték` negatív értéket is felvehet a negatív **Szorzó** miatt. Ez nem gond, hiszen a `CÉ` alap `-30` alappal indul, viszont a célpont `VÉ` számítása módosul:

```
Célpont VÉ =
  Szorzó
    +   ──→ összeadás (!)
  Cella    
```


→ A képlet majdnem ugyanaz, de nem szorzás, hanem **összeadás** történik.

→ Ha a Szorzó értéke éppen `0`, a cépont `Védő Értéke` akkor is kiszámolható a fenti képlettel.

---

🔗 [Távharc taktikák](075_tavharc_taktikak.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)