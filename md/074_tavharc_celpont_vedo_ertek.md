## Célpont Védő Érték kiszámítása

A célpont `Védő Értékét` a korábban tárgyalt **Szorzó** és a **Cella** (célpont Távolságának és a **Fegyver Osztó** hányadosa) szorzataként kapjuk meg.

```
Cella =
  (Távolság (m) / Fegyver Osztó) ↑
```

```
Célpont VÉ =
  Szorzó  ×  Cella
```

- [Szorzó leírása](073_tavharc_ve_szorzo.md)
- [Osztó, Cella leírása](072_tavharc_ve_oszto_cella.md)

🔆 A fenti számítások automatizálva lettek a [Karakteralkotó webapp](https://kaktusztea.github.io/szilankrpg/) "**Távharc** (🏹)" fülén, így játék közben könnyen tudod kalkulálni a támadó `CÉ` és a célpont távolsági Védő Érték statisztikákat.

<br />

---
## Célzó dobás vs távolsági Védő Érték

A célpont távolsági `Védő értéke` reprezentálja eltalálásának nehézségét. Ha a lövést/hajítást végző `Célzó Érték + k20` dobása eléri ezt, akkor találatról beszélünk - egyébként a támadás célt téveszt.

```
Támadó          Célpont
CÉ + k20   vs   Távolsági VÉ
```

<br />

#### 🔆 Speciális eset: Szorzó értéke `1` alá kerülne

Ritkán fordul elő, leggyakrabban álldogáló, nagy méretű célok esetén. Ilyenkor a `Védő Érték` negatív értéket is felvehet a negatív **Szorzó** miatt. Ez nem gond, hiszen a `CÉ` alap `-15` alappal indul, viszont a célpont `VÉ` számítása módosul:

```
Célpont VÉ =
  Cella
    -   ──→ kivonás (!)
  Szorzó

(kivonás Szorzó negatív értéke miatt)
```

→ Ha a **Szorzó** értéke éppen `0`, a célpont `Védő Értéke` akkor is kiszámolható a fenti képlettel.

---

🔗 [Távharc taktikák](075_tavharc_taktikak.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#7-távolsági-harcrendszer-)