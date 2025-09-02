## Osztó és Cella értéke a távolsági Védő Értékben

### Osztó

A fegyver **Osztó** egy méterben megadott távolságérték és fegyverenként változik. Azt mutatja meg, hogy hány méterenként nő **az adott fegyverrel szemben** a célpont **Védő Értéke**. Gyakorlatilag azt befolyásolja, hogy a cél távolságának növekedésével milyen ütemben romlik találati esélyünk.

Érthető, hogy egy nyílpuska **Osztója** nagyobb, mint egy dobótőré, hiszen az előbbivel jó eséllyel támadhatunk akár `30-40` méterre levő célpontot is, míg egy dobótőr esetében ez már a lehetetlen kategóriába tartozik.

⚡Példa: a **Könnyű nyílpuska** **Osztója** `5`. Tehát `5` méterenként nő vele szemben a célpont Védő Értéke.


### Cella

```
Cella =
  (Távolság (m) / Fegyver Osztó) ↑
```

Ez a hányados (felfelé kerekítve) adja meg, hogy a fegyver **Osztójához** viszonyítva hányadik **"távolság-cellában"** található a célpont. A `Védő Érték` kiszámításánál ezzel a számmal lesz beszorozva a célpont **Szorzója**, amelyet a [következő oldalon](073_tavharc_ve_szorzo.md) tárgyalunk.

#### ⚡ Cella példa

```
Cella értéke

3 = 7/3 ↑
```

Ha egy Hajítótőrrel (melynek **Osztója** `3`) lövünk egy `7` méterre levő célra, akkor a hányados: `3`. Az egyszerűség kedvéért álljon erről itt egy ábra, melyről megérthetőek a fentiek.

![](images/06_cellaszam.png)

Ha a fegyver Osztója nem `3`, hanem mondjuk `2` lenne, akkor következésképpen a célpont a `4.` "cellában" lenne (`7/2`). Látható, hogy minél pontosabb egy fegyver, annál nagyobb az **Osztó** értéke.

🔆 **Mágikus, minőségi bónuszok**: Javasoljuk a KM-nek, hogy ha esetleg mágikus, vagy kifejezetten jó minőségű fegyver értékeit akarja az alapértékhez képest módosítani, akkor az **Osztó** értékét lehetőleg **NE** módosítsa, inkább a fegyver **Célzó Értékét** változtassa.

---

🔗 [Szorzó értéke a távolsági Védő Értékben](073_tavharc_ve_szorzo.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
