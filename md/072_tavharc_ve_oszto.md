## Osztó értéke a távolsági Védő Értékben

A fegyver **Osztó** egy méterben megadott távolságérték és fegyverenként változik. Azt mutatja meg, hogy hány méterenként nő **az adott fegyverrel szemben** a célpont **Védő Értéke**. Gyakorlatilag azt befolyásolja, hogy a cél távolságának növekedésével milyen ütemben romlik találati esélyünk.

Érthető, hogy egy nyílpuska **Osztója** nagyobb, mint egy dobótőré, hiszen az előbbivel jó eséllyel támadhatunk akár `30-40` méterre levő célpontot is, míg egy dobótőr esetében ez már a lehetetlen kategóriába tartozik.

⚡Példa: a **Könnyű nyílpuska** **Osztója** `3`. Tehát `3` méterenként nő vele szemben a célpont Védő Értéke.

$$ {cél\ távolsága\ (m) \over fegyver\ Osztó} → felfelé\ kerekítünk $$

Ez a hányados adja meg, hogy a fegyver **Osztójához** viszonyítva hányadik távolság **Cellában** található a célpont. A `Védő Érték` kiszámításánál ezzel a számmal lesz beszorozva a célpont **Szorzója**, amelyet feljebb tárgyaltunk.

Például ha egy nyílpuskával (melynek **Osztója** `3`) lövünk egy `7` méterre levő célra, akkor a hányados: `3`. \
`7/3 → 3` mivel a `7` osztva `3`-al (felfelé kerekítve) egyenlő `3`-al.

Az egyszerűség kedvéért álljon erről itt egy ábra, melyről megérthetőek a fentiek.

![](images/06_cellaszam.png)

Ha a fegyver Osztója nem `3`, hanem mondjuk `2` lenne, akkor következésképpen a célpont a `4.` "cellában" lenne (`7/2`).

Alább az egyes fegyver-kategóriák tipikus **Osztó** értékét látjuk (a jellemző `CÉ` jellemző mellett). Ettől csak rendkívül kevés esetben tér el egyik-másik konkrét fegyver, azok is csak nagyon indokolt esetben. Látható, hogy minél pontosabb egy fegyver, annál nagyobb az **Osztó** értéke.

| Fegyverkategória                        |  CÉ   | Osztó | Példa fegyverek                             | Speciális                                                                                                                       |
| --------------------------------------- | :---: | :---: | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nem hajításra készített tárgyak**     | `+0`  |  `1`  | Kard, zsámoly, söröskorsó                   | Maximális Hatótávjukhoz hozzáadható:<br />(`Erő x Osztó`)                                                                       |
| **Apró alkalmas fegyverek**             | `+2`  |  `2`  | Tőr, kő                                     | -                                                                                                                               |
| **Apró hajítófegyverek, szálfegyverek** | `+3`  |  `3`  | Hajítótőr, hajítóbárd, dárda                | -                                                                                                                               |
| **Íjak**                                | `+6`  |  `4`  | Rövid íj, hosszú íj, Kézi nyílpuska         | Sebzés bónusz: **Erő** Tulajdonság `1:1`  <br />(ha erre az Erőre lett tervezve)                                                |
| **Nyílpuskák**                          | `+8`  |  `5`  | Minden nyílpuska<br />kivéve Kézi és Kh4rei | A kézi nyílpuskától felfelé Páncéltörőnek számítanak:<br />`SFÉ = a vért rétegeinek száma`<br>(mágikus vértek esetén a KM dönt) |
| ...                                     |       |  ...  | ...                                         | ...                                                                                                                             |
| Modern, nagy hatótávú fegyver           | `+15` | `12`  | Távcsöves mesterlövész puska                | Ezt csak azért írjuk be, hogy látszódjon, ez a távolsági harcrendszer kiválóan adaptálható modern szerepjáték világokra is.     |

🔆 **Megjegyzés**: Javasoljuk a KM-nek, hogy ha esetleg mágikus, vagy kifejezetten jó minőségű fegyver értékeit akarja az alapértékhez képest módosítani, akkor az **Osztó** értékét lehetőleg **NE** módosítsa, inkább a fegyver **Célzó Értékét** változtassa.

---

🔗 [Szorzó értéke a távolsági Védő Értékben](073_tavharc_ve_szorzo.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
