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
- [Visszafogott taktika](#visszafogott-taktika-)

A Harci taktikák egy adott kör során a **harci jelleg** általános eltolását valósítják meg egy adott irányba. Ez az eltolás tudatos, egy tendenciát modellez, ezért is térnek el a Harci taktikák a Harci helyzetektől (amelyeket harci **Státuszokként** értelmezünk).

### 🔆 Taktika bejelentése

A taktikák használatát **kör elején, kezdeményezés előtt** kell bejelenteni.\
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

Csak meg akarsz érinteni valakit harc közben.

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
  VÉ csökkentés: 4 + k20T
```

❌ Más taktikával együtt

❌ [Láthatatlan](065_01_06_szemelyhez_kotott.md#láthatatlanul) ellenfél ellen

❌ [Fegyverméret - pengehátrány](065_01_04_fegyver_harci_helyzetek.md#fegyverméret---pengehátrány) harci helyzetből **NEM** alkalmazható.

✅ [Levegőből támadás](065_01_03_harci_poziciok.md#levegőből-támadás) harci helyzetben

🔗 Kapcsolódik: **[Fárasztás](fortelyok.harci/farasztas.md)** harci fortély

Fárasztani kívánod ellenfeledet, ellenállását megtörni anélkül, hogy sebet ejtenél rajta. Leginkább körbevett ellenfél esetén van értelme: a pribékek kifáraszthatják a „vadat”, míg vezetőjük felkészül.

🔆 A Többszörös találat **NEM** növeli tovább a `VÉ` csökkentést.

---
### Kezdeményező taktika

```
KÉ:+1, VÉ:-2
KÉ:+2, VÉ:-4
```

✅ **Támadó taktikával** együtt, de ügyelj a [Védő Érték eltolás ökölszabályra](#-%C3%B6k%C3%B6lszab%C3%A1ly-v%C3%A9d%C5%91-%C3%A9rt%C3%A9k-eltol%C3%A1sra)!

✅ **Érintő, Visszafogott taktikával** együtt

❌ Más taktikával együtt

Ha mindenáron magadhoz akarod ragadni a kezdeményezést megteheted, de ennek ára van. A kapkodás sebezhetővé tesz. Kezdeményező taktika alkalmazása esetén megnövelheted **Kezdeményező Értékedet** maximum `2`-vel, de cserébe kétszer annyival tolod el `Védő Értékedet` mínuszba az **ellenfél első támadásával szemben** (akár megnyerted így a kezdeményezést, akár nem).

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

Ha inkább bevárod ellenfeled támadását, kifejezetten az ellencsapásra készülve.\
Csak akkor alkalmazhatod, ha nem kapsz sebet ellenfelednek az átengedett támadás során.

---
### Öngyilkos roham taktika

```
Első oda-vissza csapásnál
  TÉ:+5, VÉ:-10
  VÉ csökkentés duplázódik
  Sebzés: +7 SP

TÉ büntetés sebesülésből
  nem érvényesül

Max 1x használható / küzdelem
```

❌ Más taktikával együtt

❌ Ostorharc harcmodorban

A roham vehemensebb (és őrültebb) verziója. A harcos ekkor szinte semmit nem törődik védekezésével, mindent megtesz, hogy hatalmas sebzést érjen el. Súlyosan sérült harcosok utolsó mentsvára lehet.

Minden másban megegyezik a sima **Rohammal**.

---
### Plusz támadás taktika

```
+1 támadás a körben

-4 VÉ csökkenést
szenvedsz el azonnal
```

✅ **Támadó taktikával, Érintő, Támadás Erőből taktikával** együtt

❌ Más taktikával együtt

✅ Több ellenféllel való harc esetén

Felpörögsz és csapásaid záporoznak ellenfeledre, cserébe azonnal `-4 VÉ` csökkenést szenvedsz el, mivel rendkívül fárasztó az ilyen felfokozott ritmusú harc. A taktikát a kör elején kell eldönteni és a kör végéig már nem módosítható.

🔆 Tipp: ha fix plusz támadást szeretnél, a **[Harckeret növelés](fortelyok.harci/harckeret_noveles.md)** fortély felvétele segíthet.

---
### Roham taktika

```
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

🔆 **Körön belüli** további támadások normál harcértékekkel történnek, harci taktika is választható

🔆 Rohamhoz min `5-10m` nekifutás szükséges (terepviszony, felszerelés súly függő)

---
### Sűrű taktika

```
-1 támadás

1 db (TÉ:-4) támadásod
  alap TÉ-vel megy
```

Akkor tudod alkalmazni, ha már legalább `3` támadásod van a körben.\
`-1` támadásért cserébe `1 db` "másodlagos" támadásodat, ami már `TÉ:-4` [levonással menne](063_04_tamadasok_szama_fegyverrel.md#t%C3%A9-levon%C3%A1s-t%C3%A1mad%C3%A1sonk%C3%A9nt), továbbra is alap `TÉ`-vel dobhatod.

✅ **Támadó, Érintő taktika, Fárasztó, Kezdeményező, Plusz támadás, Támadás erőből**

❌ Más taktikával együtt

⚡Példa: `3` támadásod van, `1` támadást beáldozol, ekkor támadásaid így történnek:

```
1.támadás: Alap TÉ
2.támadás: Alap TÉ
```

⚡ Példa: `4` támadásod van, `1` támadást beáldozol, ekkor támadásaid így történnek:
```
1.támadás: Alap TÉ
2.támadás: Alap TÉ
3.támadás: TÉ:-4
```

⚡ Példa: `5` támadásod van, `2` támadást beáldozol, ekkor támadásaid így történnek:

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

A támadásra helyezed a hangsúlyt és nyomulsz előre, ekkor védekezésedre kevésbé ügyelsz, sebezhetőbb vagy. Te határozod meg, hogy mennyire tolod el a harcmodorodat a támadás irányába. `TÉ`-det `+1-3`-ig növelheted meg ideiglenesen. Minden pont növelés után `-2` **Védő Érték** módosítót kapsz.

A szándékot, hogy Támadó taktikát akarsz alkalmazni, előre be kell jelentened, mielőtt az adott kör elkezdődött volna. Kör közben nem változtathatsz a taktikán. Ha ebben a taktikában küzdesz, akkor lehetőségeidhez mérten folyamatosan nyomulsz előre.

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

Te határozod meg, hogy mennyire tolod el a harcmodorodat a védekezés irányába. **Védő Értékedet** `+1-4`-ig növelheted meg ideiglenesen. Minden pont növelés után `-2` **Támadó Érték** módosítót kapsz.

---
### Teljes Védekezés Taktika

```
VÉ:+6

Ellenfeled csak (1 + k20T)
  értékkel csökkenthet rajtad VÉ-t

Folyamatos hátrálás, nincs támadás,
  nem kombinálható más taktikával
```

❌ Más taktikával együtt

A következő körben csak a védekezéssel törődsz (előre be kell jelentened) és kizárólag a feléd irányuló támadásokat próbálod elkerülni, nem támadsz (!), valamint folyamatosan hátrálsz, akkor `VÉ:+6` módosítót kapsz arra a körre. A kör közben nem változtathatsz a taktikádon, ha ismét támadni akarsz, azt csak a következő körben teheted meg.

Kizárólag a védekezésre figyelhetsz, tehát nem is varázsolhatsz. Ha nem így teszel, vagy nem vagy képes a folyamatos hátrálásra (például egy fal miatt), akkor a KM csökkentheti a fenti `VÉ` módosítódat, akár `0`-ig is.

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
