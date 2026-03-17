## Harci taktikák

- [Érintő taktika](#%C3%A9rint%C5%91-taktika-)
- [Fárasztó taktika](#f%C3%A1raszt%C3%B3-taktika-)
- [Kezdeményező taktika](#kezdem%C3%A9nyez%C5%91-taktika)
- [Kiváró taktika](#kiv%C3%A1r%C3%B3-taktika)
- [Öngyilkos roham taktika](#%C3%B6ngyilkos-roham-taktika)
- [Plusz támadás taktika](#plusz-t%C3%A1mad%C3%A1s-taktika)
- [Roham taktika](#roham-taktika)
- [Sűrű taktika](#s%C5%B1r%C5%B1-taktika)
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
### Érintő taktika ⇄

```
TÉ:+3
Nincs sebzés
```

✅ **Támadó, Védő, Kezdeményező, Kiváró taktikával** együtt

❌ Más taktikával együtt

Csak meg akarsz érinteni valakit harc közben. A pontos helyet **nem** definiálhatod (arra a [Területre támadás](066_05_altalanos_manoverek.md#ter%C3%BCletre--pontra-t%C3%A1mad%C3%A1s) Manőver használható), de a [Páncéldobás](069_04_vedett_terulet_panceldobas.md#p%C3%A1nc%C3%A9ldob%C3%A1s) nyilván megadja, vérttel fedett vagy nem fedett területet találtál el.

🔆 Puszta kézre és fegyverre egyaránt vonatkozik

🔆 KM megtilthatja egyes fegyverek használatánál (láncos buzogány, ostorharcos fegyverek)

---
### Fárasztó taktika ⇄

```
Ha nincs találat
  VÉ csökkentés extra: +1
```

```
Sebzés helyett:
  VÉ csökkentés: 3 + k20T
```

❌ Más taktikával együtt

❌ [Láthatatlan](065_01_06_szemelyhez_kotott.md#láthatatlanul) ellenfél ellen

❌ [Pengehátrány](065_01_04_fegyver_harci_helyzetek.md#pengehátrány) harci helyzetből **NEM** alkalmazható.

✅ [Levegőből támadás](065_01_03_harci_poziciok.md#levegőből-támadás) harci helyzetben

🔗 Kapcsolódik: **[Fárasztás](fortelyok.harci/farasztas.md)** harci fortély

Fárasztani kívánod ellenfeledet, ellenállását megtörni anélkül, hogy sebet ejtenél rajta. Leginkább körbevett ellenfél esetén van értelme: a pribékek kifáraszthatják a „vadat”, míg vezetőjük felkészül.

🔆 A Többszörös találat **NEM** növeli tovább a `VÉ` csökkentést.

---
### Kezdeményező taktika

```
KÉ:+1, VÉ:-1
...
KÉ:+5, VÉ:-5
```

✅ **Támadó taktikával** együtt, de ügyelj a [Védő Érték eltolás ökölszabályra](#-%C3%B6k%C3%B6lszab%C3%A1ly-v%C3%A9d%C5%91-%C3%A9rt%C3%A9k-eltol%C3%A1sra)!

✅ **Érintő, Visszafogott taktikával** együtt

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

✅ **Támadó, Érintő, Visszafogott, Támadás Erőből taktikával** együtt

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

Felpörögsz, cserébe azonnal `VÉ:-4` csökkenést szenvedsz el - mivel rendkívül fárasztó az ilyen felfokozott ritmusú harc.

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
### Sűrű taktika

```
-1 támadás

1 db (TÉ:-4) támadásod
  alap TÉ-vel megy
```

✅ **Támadó, Érintő, Fárasztó, Kezdeményező, Plusz támadás, Támadás erőből taktika**

❌ Más taktikával együtt

`-1` támadásért cserébe `1 db` "másodlagos" támadásodat, ami már `TÉ:-4` [levonással menne](063_04_tamadasok_szama_fegyverrel.md#t%C3%A9-levon%C3%A1s-t%C3%A1mad%C3%A1sonk%C3%A9nt), továbbra is alap `TÉ`-vel dobhatod. Akkor tudod csak alkalmazni, ha már **legalább** `3` támadásod van a körben.

⚡Példa: `3` támadásod van, `1` támadást beáldozol:

```
1.támadás: Alap TÉ
2.támadás: Alap TÉ
```

⚡ Példa: `4` támadásod van, `1` támadást beáldozol:
```
1.támadás: Alap TÉ
2.támadás: Alap TÉ
3.támadás: TÉ:-4
```

⚡ Példa: `5` támadásod van, `2` támadást beáldozol:

```
1.támadás: Alap TÉ
2.támadás: Alap TÉ
3.támadás: Alap TÉ
```

---
### Támadás erőből taktika

Erre a **[Támadás erőből](fortelyok.harci/tamadas_erobol.md)** fortélyt használhatod.

✅ **Kiváró taktikával** együtt

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

---
### Támadó taktika

```
TÉ:+1, VÉ:-2
TÉ:+2, VÉ:-4
TÉ:+3, VÉ:-6
```

✅ [Meglepetés](065_01_03_harci_poziciok.md#meglepetés) szituációban

❌ [Észrevétlen támadás](065_01_03_harci_poziciok.md#észrevétlen-támadás) szituációban

✅ **Kezdeményező, Kiváró taktikával** együtt

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

❌ [Meglepetés](065_01_03_harci_poziciok.md#meglepetés) szituációban

❌ [Észrevétlen támadás](065_01_03_harci_poziciok.md#észrevétlen-támadás) szituációban

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

🔆 A [lények méretkülönbségéből](065_01_07_lenyek.md) adódó `VÉ` módosító továbbra is hozzáadódik/levonódik a fenti  `1 + k20T` dobáshoz/dobásból.

🔆  Ha nem tudsz folyamatosan hátrálni (pl. egy fal miatt), akkor a KM csökkentheti a fenti `VÉ` bónuszt, akár `VÉ:+3`-ig is (sima max Védekező taktika).

---
## Tettetés

Eljátszod, hogy képzetlenebb vagy a valóságosnál, átverve ellenfeled - ezzel esetleg meggondolatlanabb taktikákra kényszeríted ellenfeled. Persze csak akkor működik, ha még nem láttak harcolni eddig valós tudásod szerint.

- Megadod, mennyivel alacsonyabb `TÉ` értékkel harcolsz
- Kevesebbet támadhatsz - igény szerint
- `VÉ` értéked megmarad, de igény szerint úgy tűnik `1-1` beérkező támadásnál, mintha épp csak szerencse hatására hárítottál

**Ellepróba** szükséges a csel elhitetésére:

```
Te:
Harcmodor képzettség + Ügyesség
              vs
Ellenfél:
Harcmodor képzettség + Érzékenység
```


✅ **Kiváró, Visszafogott taktikával** együtt

❌ Más taktikával együtt

---
### Visszafogott taktika ⇄

```
TÉ levonásért cserébe
  kisebb Sebzéskocka

TÉ:-3  →  k20 helyett k10
TÉ:-6  →  k20 helyett k6
TÉ:-9  →  nincs kockadobás
          csak a fegyver
          alap sebzése
```

🔗 **[Harci anatómia](fortelyok.harci/harci_anatomia.md)** fortély minden foka `3` ponttal csökkenti a `TÉ` büntetést.

✅ **Kezdeményező, Kiváró taktikával** együtt

❌ Más taktikával együtt

Szándékosan kisebb sebzést próbálsz okozni találatkor - általában mikor nem cél az ellenfél megölése. Némi ritmus megtörés bevállalásával (`TÉ` mínusz) csökkentheted a Sebzésdobás kockáját.

---

🔗 [Harc alakzatban](065_03_harc_alakzatban.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
