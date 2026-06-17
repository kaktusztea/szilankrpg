## Harci taktikák

- [1 támadás taktika](#1-t%C3%A1mad%C3%A1s-taktika)
- [Érintő taktika](#%C3%A9rint%C5%91-taktika-)
- [Fárasztó taktika](#f%C3%A1raszt%C3%B3-taktika-)
- [Kezdeményező taktika](#kezdem%C3%A9nyez%C5%91-taktika)
- [Kiváró taktika](#kiv%C3%A1r%C3%B3-taktika)
- [Öngyilkos roham taktika](#%C3%B6ngyilkos-roham-taktika)
- [Plusz támadás taktika](#plusz-t%C3%A1mad%C3%A1s-taktika)
- [Roham taktika](#roham-taktika)
- [Támadás erőből taktika](#t%C3%A1mad%C3%A1s-er%C5%91b%C5%91l-taktika)
- [Támadó taktika](#t%C3%A1mad%C3%B3-taktika)
- [Védő taktika](#v%C3%A9d%C5%91-taktika)
- [Teljes Védekezés taktika](#teljes-v%C3%A9dekez%C3%A9s-taktika)
- [Tettetés](#tettetés)
- [Visszafogott taktika](#visszafogott-taktika-)

A Harci taktikák egy adott kör során a **harci jelleg** általános eltolását valósítják meg egy adott irányba. Ez az eltolás tudatos, egy tendenciát modellez, ezért is térnek el a **Harci taktikák** és a [Harci helyzetek](065_01_00_harci_helyzetek.md) (amelyeket harci **Státuszokként** értelmezünk).

### 🔆 Taktika bejelentése

A taktikák használatát ❗**Kör elején, Kezdeményezés előtt** kell bejelenteni.\
Hatásuk a kör végéig tart és nem lehet kör közben módosítani, kivéve a `⇄` jellel megjelölt taktikákat (azokat igen).

### 🔆 Ökölszabály Védő Érték eltolásra

**Védő Értékedet** legfeljebb `-10/+10` értékkel tolhatod el (taktikák kombinálása esetén is).

<br />

---
### 1 támadás taktika

```
Csak 1 támadást adsz le a körben:
  több-támadás TÉ levonás (-3) nem érvényesül
```

❌ Roham, Öngyilkos roham, Plusz támadás, Teljes Védekezés, Fárasztás taktikával együtt

✅ Minden **más** taktikával együtt

Ha **legalább** `2 db` támadásod van, de úgy döntesz, hogy csak `1 db`-ot adsz le a körben, azt az eredeti (levonás nélküli) `TÉ`-vel teheted meg. Ez a több-támadásos modellhez képest `TÉ:+3` bónuszt jelent.

Lásd még: [TÉ levonás támadásonként](063_04_tamadasok_szama_fegyverrel.md#t%C3%A9-levon%C3%A1s-t%C3%A1mad%C3%A1sonk%C3%A9nt)

---
### Érintő taktika ⇄

```
TÉ:+3
Nincs sebzés
```

✅ **Támadó, Védő, Kezdeményező, Kiváró, 1 támadás, Plusz támadás taktikával** együtt

❌ Más taktikával együtt

Csak meg akarsz érinteni valakit harc közben. A pontos helyet **nem** definiálhatod (arra a [Precíz támadás](066_05_altalanos_manoverek.md#prec%C3%ADz-t%C3%A1mad%C3%A1s) Manőver használható).

🔆 Puszta kézre és fegyverre egyaránt vonatkozik

🔆 KM megtilthatja egyes fegyverek használatánál (láncos buzogány, ostorharcos fegyverek)

---
### Fárasztó taktika ⇄

```
2 VÉ: Fárasztás taktika
  +1: Fárasztás fortély
  +1: Pengeelőnyben
```

❌ Nem kell támadást dobni

❌ Más taktikával együtt

❌ [Láthatatlan](065_01_01_pozitiv_helyzetek.md#láthatatlanul-harcolás---hallhatóan) ellenfél ellen

❌ [Pengehátrány](065_01_04_fegyver_harci_helyzetek.md#pengehátrány) harci helyzetből **NEM** alkalmazható.

✅ [Alappenge](065_01_04_fegyver_harci_helyzetek.md#alappenge) és [Pengeelőny](065_01_04_fegyver_harci_helyzetek.md#pengeelőny) harci helyzetben csak

✅ [Levegőből támadás](065_01_01_pozitiv_helyzetek.md#levegőből-támadás) harci helyzetben

🔗 Kapcsolódik: **[Fárasztás](fortelyok.harci/farasztas.md)** harci fortély

Fárasztani kívánod ellenfeledet, ellenállását megtörni anélkül, hogy sebet ejtenél rajta. Leginkább körbevett ellenfél esetén van értelme: a pribékek kifáraszthatják a "vadat", míg vezetőjük felkészül.

---
### Kezdeményező taktika

```
KÉ:+1, VÉ:-1
...
KÉ:+5, VÉ:-5
```

✅ **Támadó taktikával** együtt, de ügyelj a [Védő Érték eltolás ökölszabályra](#-%C3%B6k%C3%B6lszab%C3%A1ly-v%C3%A9d%C5%91-%C3%A9rt%C3%A9k-eltol%C3%A1sra)!

✅ **Érintő, Visszafogott, 1 támadás taktikával** együtt

❌ Más taktikával együtt

Mindenképp szeretnéd magadhoz ragadni a Kezdeményezést.

🔆 A `VÉ` büntetés az ellenfél `1.` támadásával szemben érvényesül - mindenképp.

---
### Kiváró Taktika

```
Átengedett KÉ
  ha megnyerted

TÉ:+2 első
  visszatámadásra
  ha nem kaptál sebet
```

✅ **Támadó, Érintő, Visszafogott, Támadás Erőből, 1 támadás taktikával** együtt

❌ Más taktikával együtt

✅ **Roham ellen** is bevethető

❌ Több ellenféllel való harc esetén

Inkább bevárod ellenfeled támadását, kifejezetten az ellencsapásra készülve.

🔆 Csak akkor alkalmazhatod, ha nem kapsz sebet ellenfelednek az átengedett támadás során.

---
### Öngyilkos roham taktika

```
Max 1x / küzdelem

Első oda-vissza csapásnál:

 Támadónak
   TÉ:+5, VÉ:-10
   TÉ büntetés sebesülésből
     nem érvényesül

 Mindkét félnek
   Sebzés: +7 SP
   VÉ csökkentés duplázódik
```

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

A roham vehemensebb (és őrültebb) verziója. A harcos ekkor szinte semmit nem törődik védekezésével, mindent megtesz, hogy hatalmas sebzést érjen el. Súlyosan sérült harcosok utolsó mentsvára lehet.

🔆 Ha a rohamozó betalál (nem muszáj sebzőnek lennie):

- `VÉ` büntetése azonnal megszűnik
- `+5 SP` nem jár a visszatámadó félnek

🔆 Rohamhoz min `5-10m` nekifutás szükséges (terepviszony, felszerelés súly függő)

---
### Plusz támadás taktika

```
+1 támadás a körben

-3 VÉ csökkenést
szenvedsz el azonnal
```

✅ **Támadó, Érintő, Támadás Erőből taktikával** együtt

❌ Más taktikával együtt

✅ Több ellenféllel való harc esetén

Felpörögsz, cserébe azonnal `VÉ:-3` csökkenést szenvedsz el - mivel rendkívül fárasztó az ilyen felfokozott ritmusú harc.

🔆 Tipp: ha fix plusz támadást szeretnél, a **[Harckeret növelés](fortelyok.harci/harckeret_noveles.md)** fortély felvétele segíthet.

---
### Roham taktika

```
Első oda-vissza csapásnál:

 Támadónak
   TÉ:+4, VÉ:-8

 Mindkét félnek
   Sebzés: +5 SP
   VÉ csökkentés duplázódik
```

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

🔆 Ha a rohamozó betalál (nem muszáj sebzőnek lennie):

- `VÉ` büntetése azonnal megszűnik
- `+5 SP` nem jár a visszatámadó félnek

🔆 **Körön belüli** további támadások már normál harcértékekkel történnek, harci taktika is választható

🔆 Rohamhoz min `5-10m` nekifutás szükséges (terepviszony, felszerelés súly függő)

---
### Támadás erőből taktika

Lassabbat, de nagyobbat ütsz. `TÉ`-ből átrakhatsz `SP` értékedre `1:1` váltószámmal maximum `2`-ig.

```
TÉ:-1, SP:+1
TÉ:-2, SP:+2
```

A fenti limit a **[Támadás erőből](fortelyok.harci/tamadas_erobol.md)** fortéllyal növelhető.

✅ **Kiváró, Plusz támadás, 1 támadás taktikával** együtt

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

---
### Támadó taktika

```
TÉ:+1, VÉ:-2
TÉ:+2, VÉ:-4
TÉ:+3, VÉ:-6
```

✅ [Meglepetés](065_01_01_pozitiv_helyzetek.md#meglepetés) szituációban

❌ [Orvtámadás](065_01_01_pozitiv_helyzetek.md#orvtámadás) szituációban

✅ **Kezdeményező, Kiváró, Érintő, Plusz támadás, 1 támadás taktikával** együtt

❌ Más taktikával együtt

A támadásra helyezed a hangsúlyt. Lehetőségeidhez mérten folyamatosan nyomulsz előre.

---
### Védő taktika

```
VÉ:+1, TÉ:-2
VÉ:+2, TÉ:-4
VÉ:+3, TÉ:-6
VÉ:+4, TÉ:-8
```

❌ [Meglepetés](065_01_01_pozitiv_helyzetek.md#meglepetés) szituációban

❌ [Orvtámadás](065_01_01_pozitiv_helyzetek.md#orvtámadás) szituációban

✅ **Érintő, 1 támadás taktikával** együtt

❌ Más taktikával együtt

A védekezésedre helyezed a hangsúlyt, ekkor kisebb vehemenciával támadsz.

---
### Teljes Védekezés Taktika

```
VÉ:+6, folyamatos hátrálás

Nem támadhatsz, nem varázsolhatsz

Ellenfél VÉ csökkentés: (1 + k20T)
  + "Fárasztó taktika" bónuszuk megmarad
```

❌ Más taktikával együtt

A következő körben csak a védekezéssel törődsz, folyamatosan hátrálsz. A kör közben nem változtathatsz a taktikádon és csak a következő körben támadhatsz újra.

🔆 A [lények méretkülönbségéből](065_01_03_negativ_helyzetek.md#lények-méret-különbsége) adódó `VÉ` módosító továbbra is hozzáadódik/levonódik a fenti  `1 + k20T` dobáshoz/dobásból.

🔆  Ha nem tudsz folyamatosan hátrálni (pl. egy fal miatt), akkor a KM csökkentheti a fenti `VÉ` bónuszt, akár `VÉ:+3`-ig is (sima max Védekező taktika).

---
## Tettetés

Eljátszod, hogy képzetlenebb vagy a valóságosnál, átverve ellenfeled - ezzel esetleg meggondolatlanabb taktikákra kényszeríted ellenfeled. Persze csak akkor működik, ha még nem láttak harcolni eddig valós tudásod szerint.

### Képzettségpróba

Harc legelején dobnod kell egy képzettségpróbát, hogy képes vagy-e mozgásodat úgy megváltoztatni, hogy képzetlenebbnek nézz ki:

```
Harcmodor képzettség + Ügyesség
           vs 15
```

🔆 Hatás: Sebzés esetén dönthetsz úgy, hogy nem sebzel, "mellé csaptál".

🔆 KM tanács: ilyenkor nem tudod bemondani a kidobott Támadó Értéket, mert akkor lebuknál a megtámadott játékosnál. Ilyenkor inkább kérdezz rá a játékos `Védő Értékére`, majd jelezd, hogy "csak VÉ csökkentés".

Az ellenfélnek aktívan jeleznie kell, hogy gyanakszik. Ekkor egy [Harci jártasság felmérését](https://github.com/kaktusztea/szilankrpg/blob/master/md/szituaciok/harci_jartassag_felmerese.md) végezhet, amely nem vesz el Akciót, nem jár semmilyen hátránnyal.

✅ **Kiváró, Visszafogott taktikával** együtt

❌ Más taktikával együtt

---
### Visszafogott taktika ⇄

```
TÉ levonásért cserébe
  kisebb Sebzéskocka

TÉ:-3  →  Hátrány-1 Sebzés dobásra
TÉ:-6  →  Hátrány-2 Sebzés dobásra
TÉ:-9  →  nincs kockadobás,
           csak a fegyver
           alap sebzése
```

🔗 **[Harci anatómia](fortelyok.harci/harci_anatomia.md)** fortély minden foka `3` ponttal csökkenti a `TÉ` büntetést.

✅ **Kezdeményező, Kiváró, 1 támadás taktikával** együtt

❌ Más taktikával együtt

Szándékosan kisebb sebzést próbálsz okozni találatkor - általában mikor nem cél az ellenfél megölése. Némi ritmus megtörés bevállalásával (`TÉ` mínusz) csökkentheted a Sebzésdobás kockáját.

---

🔗 [Harc alakzatban](065_03_harc_alakzatban.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
