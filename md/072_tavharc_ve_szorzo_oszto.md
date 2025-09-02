## Célpont Védő Értékének számítása

🔆 A lenti számítások automatizálva lettek a [Karakteralkotó](start.md#karakteralkot%C3%B3) "Harcértékek" fülének tetején, így játék közben könnyen tudod kalkulálni ezt az értéket.

---

```
Célpont VÉ = 
  Szorzó x (Távolság / Fegyver Osztó) ↑
```

A célpont **Védő értéke** reprezentálja a célpont eltalálásának nehézségét. Ugyanolyan célszámként viselkedik, mint a rendes Védő érték, azaz, ha a lövést/hajítást végző karakter Célzó Értékkel együtt számított Támadó dobása eléri, vagy meghaladja ezen értéket, akkor találatról beszélünk. Amennyiben az érték alatta marad, a támadás célt téveszt.

A célpont **Védő Értékét**  az ún. **Szorzó** és a célpont Távolságának és a **Fegyver Osztó** hányadosának (felfele kerekítünk) szorzataként kapjuk meg.

---
### ⚜️ Szorzó

A Szorzó a célpont egyedi jellemzőit, illetve a környezet hatásait szimulálja. Az alábbi módosítók **összege** adja meg értékét:

- \+ Mozgás módosító - célponté
- \+ Mozgás módosító - lövészé❕
- \+ Méret módosító - célponté
- \+ Észlelhetőség - célponté
- \+ Szél ereje

---
#### Szorzó - Mozgás módosító

Ha a célpont mozog, jóval nehezebb eltalálni. A távolság növekedésével ez a nehézség nem lineárisan, hanem exponenciálisan nő, éppen ezért érthető, hogy a mozgás is a Távolsági szorzó része. Alább a Célpont egyes mozgás típusaihoz tartozó módosítókat olvashatjuk.

| Célpont mozgásának jellege                                                             | Módosító | Megjegyzés                                                    |
| :------------------------------------------------------------------------------------- | :------: | ------------------------------------------------------------- |
| Álló                                                                                   |   `1x`   | A célpont mozdulatlan                                         |
| Harcoló csoport (bárki jó találatnak)                                                  |   `0x`   | `0x`, mert mindent a **Méret** módosító értékénél szimulálunk |
| Lassú, egyenletes                                                                      |   `2x`   | Lassú séta, léptetés lovon                                    |
| Gyors, egyenletes                                                                      |   `3x`   | Egyenletesen futó ember, vágtató lovas                        |
| [Sikertelenül szándékosan kitérő célpont](szituaciok/kiteres_loves_elol_sikertelen.md) |   `3x`   | Rontott Gyorsaságpróba után a lövész célzó dobást tesz        |
| Kiszámíthatatlan                                                                       |   `5x`   | A célpont ugrál össze-vissza, cikk-cakkban fut                |
| Harcoló célpont                                                                        |   `7x`   | Csak egy konkrét harcoló fél eltalálása jó                    |

Természetesen a lövést végző személy mozgása is befolyásolja a találati esélyeket, hiszen könnyebb állva célozni, mint mondjuk futásból. A lövész mozgása az alábbiak szerint módosíthatja a **Szorzót**:

| Lövész mozgása                     | Módosító |
| ---------------------------------- |:--------:|
| Mozdulatlan / Álló lövész          |  `+0x`   |
| A lövész lassan egyenletesen sétál |  `+1x`   |
| A lövész lassan fut                |  `+2x`   |
| A lövész rohan                     |  `+3x`   |

---
#### Szorzó - Méret módosító

| Célpont mérete                                                                 | Módosító |
| ------------------------------------------------------------------------------ |:--------:|
| Pénzérme                                                                       |  `+4x`   |
| Alma                                                                           |  `+3x`   |
| Fej, Dinnye, Macska                                                            |  `+2x`   |
| Törpe, Sas, Hiúz                                                               |  `+1x`   |
| Célpont fedezék mögött                                                         |  `+1x`   |
| Átlagos ember/elf méretű                                                       |  `+0x`   |
| [Harcoló csoport](szituaciok/harcolo_tomegbe_loves__barki_jo_talalatnak.md) \* |   `0x`   |
| Ogre                                                                           |  `-1x`   |
| Ló oldalról / 2 harcoló ember                                                  |  `-1x`   |
| Lovas, Bölény                                                                  |  `-2x`   |
| Óriás                                                                          |  `-3x`   |

**Harcoló csoport**: Harcoló tömegbe lövés.
Bármelyik fél eltalálása jó.
Kit talál el: random dobás → `k10`

---
#### Szorzó - Észlelhetőség módosító

A látási viszonyok erősen meghatározzák a távolsági harcot, hiszen például félhomályban sokkal nehezebb eltalálni valakit, mint fényes nappal. Viszont... könnyebb valakit eltalálni sötétben, ha zajt ad ki. Ezeknek megfelelően a fenti körülmények is módosítják a Szorzó értékét. A fentieket az alábbi táblázatokban foglalhatjuk össze.

| Környezeti fényviszonyok | Szorzó Módosító |                 Megjegyzés                 |
| ------------------------ | :-------------: |:------------------------------------------ |
| Szürkületben             |      `+1x`      | Szürkületben nehezebb a távolság becslése. |


| A célpont láthatósága és hangossága    |  Szorzó Módosító  | Példa                                                             |
| -------------------------------------- | :---------------: | :---------------------------------------------------------------- |
| Jól kivehető kontúr                    |       `+0x`       | Nappali célpont; napnyugtakor háztetőn álldogáló célpont          |
| Homályos kontúr                        |       `+1x`       | Félhomályban mozgó alaké;<br />Testközelben levő célpont sötétben |
| Éppen kivehető kontúr (zajos)          |       `+2x`       | Sötétben moccanó, neszező árnyak                                  |
| Éppen kivehető kontúr (csendes)        |       `+5x`       | Sötétben, csendben lapuló árnyak                                  |
| Háttérrel egybeolvadó kontúr (zajos)   |      `+5x*`       | Vaksötétben harcoló ellenfél;<br />Távoli célpont sötétben        |
| Háttérrel egybeolvadó kontúr (csendes) | Lehetetlen (`99`) | Nem látható, lopakodó, némán osonó fejvadász                      |

\* Csak speciális mentális gyakorlat segítségével.

---
#### Szorzó - Szél hatása

Amennyiben erős szél fúj, akkor az is módosíthatja a célpont Védő Értékét, mivel az erős széllökések eltéríthetik a lövedéket.

| Szél ereje  |  Szorzó módosító   |
| ----------- | :----------------: |
| Szélcsend   |       `+0x`        |
| Enyhe       |       `+1x`        |
| Erős        |        +2x         |
| Viharos     |        +3x         |
| Orkán erejű | A lövés lehetetlen |

---
#### 🔆 Speciális eset: Szorzó értéke `1` alá kerülne

Ritkán fordul elő ez az eset, főleg álldogáló, nagy méretű célok esetén. Ilyenkor a `Védő Érték` negatív értéket is felvehet a negatív **Szorzó** miatt. Ez nem gond, hiszen a `CÉ` alap `-30` alappal indul, viszont a célpont `VÉ` számítása módosul:

```
Célpont VÉ = Szorzó  +  (Távolság / Fegyver Osztó) ↑
                     └────→ összeadás, nem szorzás
```

🔆 A képlet majdnem ugyanaz, de nem szorzás, hanem összeadás történik.

🔆 Ha a Szorzó értéke éppen `0`, a cépont Védő Értéke akkor is kiszámolható a fenti képlettel.

---
### ⚜️ Fegyver Osztó

A fegyver **Osztó** egy méterben megadott távolságérték és fegyverenként változik. Azt mutatja meg, hogy hány méterenként nő **az adott fegyverrel szemben** a célpont **Védő Értéke**. Gyakorlatilag azt befolyásolja, hogy a cél távolságának növekedésével milyen ütemben romlik találati esélyünk.

Érthető, hogy egy nyílpuska **Osztója** nagyobb, mint egy dobótőré, hiszen az előbbivel jó eséllyel támadhatunk akár `30-40` méterre levő célpontot is, míg egy dobótőr esetében ez már a lehetetlen kategóriába tartozik.

⚡Példa: a **Könnyű nyílpuska** **Osztója** `3`. Tehát `3` méterenként nő vele szemben a célpont Védő Értéke.

$$ {cél\ távolsága\ (m) \over fegyver\ Osztó} → felfelé\ kerekítünk $$

Ez a hányados adja meg, hogy a fegyver **Osztójához** viszonyítva hányadik távolság “cellában” található a célpont. A `Védő Érték` kiszámításánál ezzel a számmal lesz beszorozva a célpont **Szorzója**, amelyet feljebb tárgyaltunk.

Például ha egy nyílpuskával (melynek **Osztója** `3`) lövünk egy `7` méterre levő célra, akkor a hányados: `3`. \
`7/3 → 3` mivel a `7` osztva `3`-al (felfelé kerekítve) egyenlő `3`-al.

Az egyszerűség kedvéért álljon erről itt egy ábra, melyről megérthetőek a fentiek.

![](images/06_cellaszam.png)

Ha a fegyver Osztója nem `3`, hanem mondjuk `2` lenne, akkor következésképpen a célpont a `4.` "cellában" lenne (`7/2`).

Alább az egyes fegyver-kategóriák tipikus **Osztó** értékét látjuk (a jellemző `CÉ` jellemző mellett). Ettől csak rendkívül kevés esetben tér el egyik-másik konkrét fegyver, azok is csak nagyon indokolt esetben. Látható, hogy minél pontosabb egy fegyver, annál nagyobb az **Osztó** értéke.

| Fegyverkategória                        |  CÉ   | Osztó | Példa fegyverek                             | Speciális                                                                                                                       |
| --------------------------------------- | :---: | :---: | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nem hajításra készített tárgyak**     | `+0`  | `0,5` | Kard, zsámoly, söröskorsó                   | Maximális Hatótávjukhoz hozzáadható:<br />(`Erő x Osztó`)                                                                       |
| **Apró alkalmas fegyverek**             | `+2`  | `0,5` | Tőr, kő                                     | -                                                                                                                               |
| **Apró hajítófegyverek, szálfegyverek** | `+3`  |  `1`  | Hajítótőr, hajítóbárd, dárda                | -                                                                                                                               |
| **Íjak**                                | `+6`  |  `2`  | Rövid íj, hosszú íj, Kézi nyílpuska         | Sebzés bónusz: **Erő** Tulajdonság `1:1`  <br />(ha erre az Erőre lett tervezve)                                                |
| **Nyílpuskák**                          | `+8`  |  `3`  | Minden nyílpuska<br />kivéve Kézi és Kh4rei | A kézi nyílpuskától felfelé Páncéltörőnek számítanak:<br />`SFÉ = a vért rétegeinek száma`<br>(mágikus vértek esetén a KM dönt) |
| ...                                     |       |  ...  | ...                                         | ...                                                                                                                             |
| Modern, nagy hatótávú fegyver           | `+15` |  `8`  | Távcsöves mesterlövész puska                | Ezt csak azért írjuk be, hogy látszódjon, ez a távolsági harcrendszer kiválóan adaptálható modern szerepjáték világokra is.     |

🔆 **Megjegyzés**: Javasoljuk a KM-nek, hogy ha esetleg mágikus, vagy kifejezetten jó minőségű fegyver értékeit akarja az alapértékhez képest módosítani, akkor az **Osztó** értékét lehetőleg **NE** módosítsa, inkább a fegyver **Célzó Értékét** változtassa.

---

🔗 [Távharc taktikák](073_tavharc_taktikak.md) →

⚜️ [Nyitóoldal](start.md#7-t%C3%A1vols%C3%A1gi-harcrendszer-)
