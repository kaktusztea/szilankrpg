## Célpont Védő Érték kiszámítása

A célpont `Védő Értékét` a korábban tárgyalt **Szorzó** és a **Cella** (célpont Távolságának és a **Fegyver Osztó** hányadosa) szorzataként kapjuk meg.

```
Cella =
  (Távolság (m) / Fegyver Osztó) ↑
```

```
Célpont VÉ =
  Szorzó  x  Cella
```

- [Szorzó leírása](073_tavharc_ve_szorzo.md)
- [Osztó, Cella leírása](072_tavharc_ve_oszto_cella.md)

🔆 A fenti számítások automatizálva lettek a [Karakteralkotó](szabalyrendszer.md#karakteralkotó----segédlet) "**Harcértékek**" fülének tetején, így játék közben könnyen tudod kalkulálni a célpont Védő Értékét.

<br />

---
## Célzó dobás vs távolsági Védő Érték

A célpont `Védő értéke` reprezentálja eltalálásának nehézségét. Ugyanolyan célszámként viselkedik, mint a rendes `Védő érték`, azaz, ha a lövést/hajítást végző karakter `Célzó Értékkel` együtt számított **Célzó dobása** eléri, vagy meghaladja ezen értéket, akkor találatról beszélünk. Amennyiben az érték alatta marad, a támadás célt téveszt.

```
Támadó          Célpont
CÉ + k20   vs   VÉ
```

<br />

---
#### 🔆 Speciális eset: Szorzó értéke `1` alá kerülne

Ritkán fordul elő ez az eset, főleg álldogáló, nagy méretű célok esetén. Ilyenkor a `Védő Érték` negatív értéket is felvehet a negatív **Szorzó** miatt. Ez nem gond, hiszen a `CÉ` alap `-15` alappal indul, viszont a célpont `VÉ` számítása módosul:

```
Célpont VÉ =
  Szorzó
    +   ──→ összeadás (!)
  Cella
```


→ A képlet majdnem ugyanaz, de nem szorzás, hanem **összeadás** történik.

→ Ha a Szorzó értéke éppen `0`, a célpont `Védő Értéke` akkor is kiszámolható a fenti képlettel.

---

🔗 [Távharc taktikák](075_tavharc_taktikak.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)