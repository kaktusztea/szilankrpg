## Harci taktikák

| **Taktika név**                                                       | **Hatás**                                                                                                                                                                                                                                                        |
| :-------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Támadó taktika](#t%C3%A1mad%C3%B3-taktika)                           | `TÉ:+1 = VÉ:-2`; max `TÉ:+3`                                                                                                                                                                                                                                     |
| [Védő taktika](#v%C3%A9d%C5%91-taktika)                               | `VÉ:+1 = TÉ:-2`; max `VÉ:+4`                                                                                                                                                                                                                                     |
| [Teljes Védekezés taktika](#teljes-v%C3%A9dekez%C3%A9s-taktika)       | `VÉ:+6`, ellenfeled csak `1 + k20T` értékkel csökkenthet rajtad `VÉ`-t. Folyamatos hátrálás, nincs támadás, nem kombinálható más taktikával.                                                                                                          |
| [Kezdeményező taktika](#kezdem%C3%A9nyez%C5%91-taktika)               | `KÉ:+1 → VÉ:-2`, max `KÉ:+2`                                                                                                                                                                                                                                     |
| [Sűrű taktika](#s%C5%B1r%C5%B1-taktika)                               | `-1` támadásért cserébe `1 db` olyan támadásod, ami `TÉ:-4` levonással menne, alap `TÉ`-vel történik.                                                                                                                                                            |
| [Kiváró taktika](#kiv%C3%A1r%C3%B3-taktika)                           | Átengedett `KÉ`, cserébe első visszatámadásra `TÉ:+1`⭕k20                                                                                                                                                                                                        |
| [Fárasztó taktika](#f%C3%A1raszt%C3%B3-taktika-) ⇄                    | • `+1 VÉ extra csökkentés` sima VÉ csökkentésnél<br />• `(4 + k20` tízes része) `VÉ csökkentés` Sebzés helyett<br />• [Fegyverméret - pengehátrány](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---pengeh%C3%A1tr%C3%A1ny) harci helyzetből **NEM** alkalmazható. |
| [Visszafogott taktika](#visszafogott-taktika-) ⇄                      | Kisebb értékű kockával dobhatsz sebzéskor. Lásd a taktika részletes leírását!                                                                                                                                                                                    |
| [Plusz támadás taktika](#plusz-t%C3%A1mad%C3%A1s-taktika)             | `+1 támadás`<br />Cserébe **minden** támadásodnál a körben az alábbi [VÉ csökkentést](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x) szenveded el: `(1 + k20T)`.<br />A kör elején kell eldönteni, kör közben már nem módosítható.                   |
| [Roham taktika](#roham-taktika)                                       | • `TÉ:+4`, `VÉ:-8` (első oda-visszacsapáskor)<br/>• `VÉ` csökkentés: `(3 + k20T)` első oda-visszacsapásnál , Sebzéshez: `+5 SP` (oda-vissza))<br/>• Sikeres sebzés esetén a visszacsapás nem kapja meg a bónuszokat                                   |
| [Öngyilkos roham taktika](#%C3%B6ngyilkos-roham-taktika)              | • `TÉ:+5`,`VÉ:-10` (első oda-visszacsapáskor)<br/>• `VÉ` csökkentés: `(3 + k20T`) első oda-visszacsapásnál<br/>•  Sebzéshez: `+7 SP` (oda-vissza)<br/>• `TÉ` büntetések (sérülésből) nem érvényesek<br/>• Max `1x` használható egy küzdelemben        |
| [Támadás erőből taktika](#t%C3%A1mad%C3%A1s-er%C5%91b%C5%91l-taktika) | Erre a [Támadás erőből](fortelyok.harci/tamadas_erobol.md) fortélyt használhatod (lásd a leírását).                                                                                                                                                              |
| [Érintő taktika](#%C3%A9rint%C5%91-taktika-) ⇄                        | `TÉ:+3`                                                                                                                                                                                                                                                          |

A Harci taktikák egy adott kör során a **harci jelleg** általános eltolását valósítják meg egy adott irányba. Ez az eltolás tudatos, egy tendenciát modellez, ezért is térnek el a Harci taktikák a Harci helyzetektől (amelyeket harci Státuszokként értelmezünk inkább).

### Taktika bejelentése

A taktikák használatát kör elején, kezdeményezés előtt kell bejelenteni és ez hatásuk a kör végéig tart, nem lehet kör közben módosítani - kivéve a `⇄` jellel megjelölt taktikákat, mert azokat kör közben, támadások között is lehet variálni.

### Ökölszabály Védő Érték eltolásra 🔆

Egyes taktikák kombinálhatóak egymással, mások nem (lásd leírásukat), de fontos szabály, hogy **Védő Értékedet** legfeljebb `-30/+30`-al tolhatod el.

---
### Támadó taktika

```
TÉ:+1, VÉ:-2
...
TÉ:+3, VÉ:-6
```

✅ [Meglepetés](065_01_harci_helyzetek.md#meglepetés) szituációban

❌ [Észrevétlen támadás](065_01_harci_helyzetek.md#észrevétlen-támadás) szituációban

✅ **Kezdeményező taktikával** együtt

✅ **Kiváró taktikával** együtt

❌ Más taktikával együtt

Dönthetsz úgy, hogy a következő körben a támadásra helyezed a hangsúlyt és nyomulsz előre. Ekkor védekezésedre kevésbé ügyelsz, sebezhetőbb vagy. Te határozod meg, hogy mennyire tolod el a harcmodorodat a támadás irányába. `TÉ`-det `+1-3`-ig növelheted meg ideiglenesen. Minden pont növelés után `-2` **Védő Érték** módosítót kapsz.

A szándékot, hogy Támadó taktikát akarsz alkalmazni, előre be kell jelentened, mielőtt az adott kör elkezdődött volna. Kör közben nem változtathatsz a taktikán. Ha ebben a taktikában küzdesz, akkor lehetőségeidhez mérten folyamatosan nyomulsz előre.

---
### Védő taktika

```
VÉ:+1, TÉ:-2
...
VÉ:+4, TÉ:-8
```

❌ [Meglepetés](065_01_harci_helyzetek.md#meglepetés) szituációban

❌ [Észrevétlen támadás](065_01_harci_helyzetek.md#észrevétlen-támadás) szituációban

❌ Más taktikával együtt

Dönthetsz úgy, hogy a következő körben a védekezésedre helyezed a hangsúlyt. Ekkor kisebb vehemenciával támadsz, ez megmutatkozik Támadó Értékedben is.

Te határozod meg, hogy mennyire tolod el a harcmodorodat a védekezés irányába. **Védő Értékedet** `+1-4`-ig növelheted meg ideiglenesen. Minden pont növelés után `-2` **Támadó Érték** módosítót kapsz.

Tehát vállalásodtól függően így módosíthatod harcértékeidet. Pl:

---
### Teljes Védekezés Taktika

```
- VÉ:+6
- Ellenfeled csak (1 + k20T)
  cértékkel sökkenthet rajtad VÉ-t.
```

❌ Más taktikával együtt

Ha úgy döntesz, hogy a következő körben csak a védekezéssel törődsz (előre be kell jelenteni!), kizárólag a feléd irányuló támadásokat próbálod elkerülni, nem támadsz (!), valamint folyamatosan hátrálsz, akkor `VÉ:+6` módosítót kapsz arra a körre. A kör közben nem változtathatsz a taktikádon, ha ismét támadni akarsz, azt csak a következő körben teheted meg.

Fontos, hogy másra nem pazarolhatod figyelmedet, kizárólag a védekezésre, tehát nem is varázsolhatsz. Ha nem így teszel, vagy nem vagy képes a folyamatos hátrálásra (például egy fal miatt, ami elzárja mögötted az utat), akkor a KM – tetszése szerint – csökkentheti a fenti `VÉ` módosítódat, akár `0`-ig is.

---
### Kezdeményező taktika

```
KÉ:+1, VÉ:-2
KÉ:+2, VÉ:-4
```

✅ **Támadó taktikával** együtt, de ügyelj a [Védő Érték eltolás ökölszabályra](#%C3%B6k%C3%B6lszab%C3%A1ly-v%C3%A9d%C5%91-%C3%A9rt%C3%A9k-eltol%C3%A1sra-)!

✅ **Visszafogott taktikával** együtt

✅ **Érintő taktikával** együtt

❌ Más taktikával együtt

Ha mindenáron magadhoz akarod ragadni a kezdeményezést megteheted, de ennek ára van. A kapkodás sebezhetővé tesz. Kezdeményező taktika alkalmazása esetén megnövelheted **Kezdeményező Értékedet** maximum `2`-vel, de cserébe kétszer annyival tolod el `Védő Értékedet` mínuszba az **ellenfél első támadásával szemben** (akár megnyerted így a kezdeményezést, akár nem).

---
### Sűrű taktika

Akkor tudod alkalmazni, ha már legalább `3` támadásod van a körben.\
`-1` támadásért cserébe `1 db` "másodlagos" támadásodat, ami már `TÉ:-4` [levonással menne](063_04_tamadasok_szama_fegyverrel.md#t%C3%A9-levon%C3%A1s-t%C3%A1mad%C3%A1sonk%C3%A9nt), továbbra is alap `TÉ`-vel dobhatsz.

✅ **Támadó taktika**

✅ **Kezdeményező taktika**

✅ **Fárasztó taktika**

✅ **Plusz támadás taktika**

✅ **Támadás erőből taktika**

✅ **Érintő taktika**

❌ Más taktikával együtt

<br />

⚡ `3` támadásod van, `1` támadást beáldozol, ekkor támadásaid így történnek:
- `1.támadás`: Alap TÉ
- `2.támadás`: Alap TÉ

⚡ `4` támadásod van, `1` támadást beáldozol, ekkor támadásaid így történnek:
- `1.támadás`: Alap TÉ
- `2.támadás`: Alap TÉ
- `3.támadás`: `TÉ:-4`

⚡ `5` támadásod van, `2` támadást beáldozol, ekkor támadásaid így történnek:
- `1.támadás`: Alap TÉ
- `2.támadás`: Alap TÉ
- `3.támadás`: Alap TÉ

---
### Kiváró Taktika

```
Átengedett KÉ
 → TÉ:+1⭕ első
   visszatámadásra
```

✅ **Támadó taktikával** együtt

✅ **Visszafogott taktikával** együtt

✅ **Támadás Erőből taktikával** együtt

✅ **Érintő taktikával** együtt

✅ **Roham ellen** is bevethető
 
❌ Más taktikával együtt

❌ Több ellenféllel való harc esetén

Ha inkább bevárod ellenfeled támadását, kifejezetten az ellencsapásra készülve, az apró előnyhöz juttathat. Ha megnyered a `KÉ`-t akkor szándékosan átengedheted ellenfelednek a támadás elsőbbségét, majd amennyiben nem kapsz sebet, előnyt kovácsolhatsz a jó időzítésből. Hatása:

Ha úgy döntesz, hogy a fenti feltételekkel lemondasz a kezdeményezésről, cserébe az adott körben **első visszatámadásodra** `TÉ:+1`⭕ módosítót kapsz.

---
### Fárasztó taktika ⇄

```
Ha nincs találat
  VÉ csökkentés extra: +1
```

```
Sebzés helyett:
  VÉ csökkentés: 4 + k20T
```

❌ Más taktikával együtt

❌ [Láthatatlan](065_01_harci_helyzetek.md#l%C3%A1thatatlanul) ellenfél ellen

❌ [Fegyverméret - pengehátrány](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---pengeh%C3%A1tr%C3%A1ny) harci helyzetből **NEM** alkalmazható.

✅ [Levegőből támadás](065_01_harci_helyzetek.md#leveg%C5%91b%C5%91l-t%C3%A1mad%C3%A1s) harci helyzetben

Ha fárasztani kívánod ellenfeledet, ellenállását megtörni anélkül, hogy sebet ejtenél rajta, akkor a harc ugyanúgy folyik, mint más esetben, csak
- ha nem érsz el találatot támadó dobásod során, akkor  **VÉ csökkentésedre** `+1` bónuszt kapsz
- Sebző támadás esetén pedig elmarad maga a sebzés, helyette [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x): `3 + k20T`. A Többszörös találat **NEM** növeli tovább a `VÉ` csökkentést.

A Fárasztó taktikának leginkább körbevett ellenfél esetén van értelme: a pribékek kifáraszthatják a „vadat”, míg vezetőjük felkészül.

Kapcsolódó fortély: [Fárasztás](fortelyok.harci/farasztas.md) harci fortély

---
### Visszafogott taktika ⇄

```
Sebzéskocka változik:
TÉ:-3  →  k20 helyett k10
TÉ:-6  →  k20 helyett k6
TÉ:-9  →  nincs kockadobás
           csak a fegyver alap sebzése
```

A [Harci anatómia](fortelyok.harci/harci_anatomia.md) fortély minden foka `3`-mel csökkenti a `TÉ` büntetést.

✅ **Kezdeményező taktikával** együtt

✅ **Kiváró taktikával** együtt

❌ Más taktikával együtt


Szándékosan kisebb sebzést próbálsz okozni találatkor - általában olyankor fordul elő, mikor nem cél az ellenfél megölése.

Némi ritmus megtörés bevállalásával csökkentheted az okozott sebzést: kisebb értékű kockával dobhatsz sebzéskor.

---
### Plusz támadás taktika

```
+1 támadás

Minden támadásodnál
  VÉ csökkentés: 1 + k20T
  büntetést szenvedsz el
```

✅ **Támadó taktikával** együtt

✅ **Támadás Erőből taktikával** együtt

✅ **Érintő taktikával** együtt
 
❌ Más taktikával együtt

✅ Több ellenféllel való harc esetén


Felpörögsz és csapásaid záporoznak ellenfeledre. `+1 támadáshoz` jutsz a körben.

Cserébe **minden** támadásodnál az adott körben `1 VÉ csökkenést` szenvedsz el, mivel rendkívül fárasztó az ilyen felfokozott ritmusú harc. A taktikát a kör elején kell eldönteni és a kör végéig már nem módosítható.

🔆Tipp: ha fix növelésre vágysz, a [Harckeret növelés](fortelyok.harci/harckeret_noveles.md) fortély felvétele segíthet.

---
### Roham taktika

```
Első oda-vissza csapásnál:
- TÉ:+4, VÉ:-8
- VÉ csökkentés duplázódik (oda-vissza)
- Sebzés: +5 SP (oda-vissza)
```

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

Roham esetén **az első oda- és visszacsapás során** a támadó `TÉ:+4` és `VÉ:-8` módosítót kap, és `+5 SP` bónuszt sebzésdobására (`+1` sebzés kategória). Az okozott **VÉ csökkentés** duplázódik az első oda- és visszacsapásnál is.

Ha roham során a karakter sebző támadást ér el, akkor az őt sújtó **VÉ büntetés** azonnal megszűnik, a rá leadott visszacsapást már **normál VÉ**-vel várhatja és a `+5 SP` bónusz sem jár a visszatámadó félnek. Ez akkor is így van, ha a Sebzést teljesen felfogta az ellenfél vértje.

A **körön belüli** további támadások már normál harcértékekkel történnek és innen már választható harci taktika is!

Rohamhoz legalább `5-10` méter nekifutás szükséges. Hogy pontosan mennyi, az szituáció-függő, a KM szava dönt a terepviszonyok és a felszerelés súlyának ismeretében.

Fontos, hogy Rohamnál is számítanak a fegyverméret kategóriák, tehát egy pikás védekezőt megrohamozni nem mindig bölcs dolog...

---
### Öngyilkos roham taktika

```
Első oda-vissza csapásnál:
- TÉ:+5, VÉ:-10
- VÉ csökkentés duplázódik (oda-vissza)
- Támadó TÉ büntetése sebesülésből
  nem érvényesül
- Sebzés: +7 SP (oda-vissza)
```

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

A roham vehemensebb (és őrültebb) verziója. A harcos ekkor szinte semmit nem törődik védekezésével, mindent megtesz, hogy (dupla) sebzést érjen el. Különlegessége, hogy erre az egy támadásra nem érvényesülnek a sérülésből adódó **TÉ levonások**, az adrenalin elsöpör minden gátat. Súlyosan sérült harcosok utolsó mentsvára lehet ez a taktika. Küzdelmenként **legfeljebb 1x** alkalmazható. A fentieken és a harcérték módosítókon kívül az **Öngyilkos roham** minden másban megegyezik a sima **Rohammal**.

---
### Támadás erőből taktika

Erre a [Támadás erőből](fortelyok.harci/tamadas_erobol.md) fortélyt használhatod (lásd a leírását).

✅ **Kiváró taktikával** együtt

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

---
### Érintő taktika ⇄

```
TÉ:+3
Nincs sebzés
```

✅ **Támadó taktikával** együtt

✅ **Védő taktikával** együtt

✅ **Kezdeményező taktikával** együtt

✅ **Kiváró taktikával** együtt

❌ Más taktikával együtt

Ha csak meg akarunk érinteni valakit harc közben, az könnyebb, mint sérülést okozó támadást végbevinni. Érintő támadásnál a fenti `TÉ` bónuszokat kapod és nem okozol semmilyen sebzést.

A fentiek Puszta kézre és aktuálisan forgatott fegyverre egyaránt vonatkoznak. A KM dönthet úgy, hogy egyes speciális fegyvereknél (láncos buzogány, ostorharcos fegyverek) megtagadhatja ennek a taktikának az alkalamzását.

---

🔗 [Harc alakzatban](065_03_harc_alakzatban.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
