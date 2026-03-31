## Harc alakzatban

Mikor összehangoltan, csoportban mozognak harcosok, akkor komoly előnyt képesek kiépíteni. Az egyén feladata ellenük nagyon nehézzé válik, ilyenkor leginkább egy másik alakzat az, ami hatékonyan képes lehet vele felvenni a harcot.

Az alakzat tagjai küzdhetnek különféle harcmodorokban - a lényeg az összeszokottság. Nem készítünk külön szabályokat az összeszokottság mértékének módosítóira - egy heroikus rendszerben valószínűleg összeszokott csapat indít csak csoportos támadást. A fentiket az **[Alakzatharc](kepzettsegek.primer.harci/alakzatharc.md)** képzettség tanulásával lehet elsajátítani.

Egy alakzat minimum létszáma `3` **fő** (mert `2` fő legfeljebb  [Páros harcot](fortelyok.harci/paros_harc.md) végezhet).

---
## Mozgástér

Alakzatharchoz jelentős helyre van szükség. Épületen belül, csatornában, barlangban **nem lehetséges**, csak ha kivételesen nagy tér áll rendelkezésre (pl. nagy belső udvar).

---
## Alakzat egyedi jellemzői

### Vezető fortélyok

Ha van a csoportban olyan, aki ezzel bír és elvállaja a vezetést, az bónuszt ad a lenti Támadószint, Védekezőszint számításánál.
  - [Vezető: Alakzatparancsnok](fortelyok.harci/vezeto_alakzatparancsnok.md)  (gyalogos alakzat esetén)
  - [Vezető: Íjászparancsnok](fortelyok.harci/vezeto_ijaszparancsnok.md)  (íjász/lövész alakzat esetén)
  - [Vezető: Lovaskapitány](fortelyok.harci/vezeto_lovaskapitany.md)  (lovas alakzat esetén)
  - [Vezető: Léglovaskapitány](fortelyok.harci/vezeto_leglovaskapitany.md)  (lovas alakzat esetén)

### ⚜️Támadószint

```
+ MIN( Alakzatharc képzettség )
+ 2 / Vezető fortély bónusz fok
+ MIN(Támadó-alakzat fortély fok) x 2
```

- Csapattagok **[Alakzatharc](kepzettsegek.primer.harci/alakzatharc.md)** képzettsége közül a **legalacsonyabb** ([csoportos fizikai képzettségpróba](030_06_02_csoportos_kepzettsegproba.md#️-1-csoportos-fizikai-képzettségpróba) szabályai szerint).
- Csapattagok közül a legalacsonyabb [Támadó-alakzat](fortelyok.harci/alakzat_tamado.md) fortély foka `2` bónusz szintet ad fokonként.

### ⚜️Védekezőszint

```
+ MIN( Alakzatharc képzettség )
+ 2 / Vezető fortély bónusz fok
+ MIN(Védekező-alakzat fortély fok) x 2
```

Tehát a csapattagok közül a legalacsonyabb [Védekező-alakzat](fortelyok.harci/alakzat_vedekezo.md) fortély foka `2` bónusz szintet ad fokonként.

---
## Alakzat harcértékeinek meghatározása

A lenti értékeket célszerű játékalkalom **előtt** kiszámítani, így nem von el időt sem játékostól, sem a mesélőtől. Mivel előre tudható, hogy mely csapattagok, vagy nem játékos karakterek képesek és szoktak így küzdeni, ez felkészülési időben könnyen megállapítható.

### 🔆Alakzat TÉ értéke

```
+ Támadószint bónusza
+ Alakzat tagjainak fegyveres TÉ átlaga
```

**Támadószint** `TÉ` bónusza: mint egy extra [harcmodorból képzettség szintjéből adódó érték](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)

### 🔆Alakzat VÉ értéke

```
+ Védekezőszint bónusza
+ Alakzat tagjainak fegyveres VÉ átlaga
+ Személyek száma utáni VÉ bónusz
  (+1 VÉ / fő;  max +10 VÉ)
```

**Védekezőszint** `VÉ` bónusza: mint egy extra [harcmodorból képzettség szintjéből adódó érték](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)

🔆 **Megjegyzés**
- [Lovaglás bónuszai](067_01_lovas_harc_szabalyai.md#lovasléglovas-harcértékek-kiszámítása) is beszámítanak az alapértékekbe, ha hátasokon harcol az alakzat
- Íjászok/Lövészek esetén `TÉ` helyett a `CÉ` az, amelyre  a harcmodorból adódó bónusz jár

<br />

---
## Személyek száma utáni `VÉ` bónusz

```
+1 VÉ / fő
   (max 10)
```

A személyek száma is növeli az alakzat harcértékét. Egyszerűbb, ha ez fix érték, bár nyilván felmerül, hogy egy képzett harcosoknál ez többet kéne adjon, **viszont** ezt az [Alakzatharc](kepzettsegek.primer.harci/alakzatharc.md) képzettség-szintből [adódó bónuszokkal](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szimuláljuk. Belátható, hogy egy szuper harcos nem ad hozzá túl sokat az alakzathoz, ha képzetlen az alakzatharcban.

Miért csak `VÉ` bónuszt ad?
- mert a támadás bónuszok az **Alakzatharc képzettség-szintből** jönnek.
- az alakzat tagjainak nagyobb száma inkább a nehezebb megtámadhatóságot (`VÉ` bónusz) ((és ugye a durvább `VÉ-csökkentést`)) adja.

<br />

---
## ⚡Példa: 4 fős alakzat harcértékei

```
Borz
  Alakzatharc: 6.szint
  Támadó-alakzat fortély: 2.fok
  Védekező-alakzat fortély: 2.fok
  🔆 Vezető: Alakzatparancsnok: 1.fok

Tetves
  Alakzatharc: 7.szint
  Támadó-alakzat fortély: 1.fok
  Védekező-alakzat fortély: 2.fok

Rühes
  Alakzatharc: 8.szint
  Támadó-alakzat fortély: 0.fok
  Védekező-alakzat fortély: 2.fok

Csámpa
  Alakzatharc: 10.szint
  Támadó-alakzat fortély: 1.fok
  Védekező-alakzat fortély: 2.fok
```

---
### ⚡Támadószint: `8`

```
+6: legalacsonyabb Alakzatharc szint
+2: bónusz (Vezető: Alakzatparancsnok (1.fok))
+0 = MIN(2; 1; 0; 1) x 2
```

### ⚡Védekezőszint: `12`

```
+6: legalacsonyabb Alakzatharc szint
+2: bónusz (Borz, Vezető: Alakzatparancsnok (1))
+4: MIN(2; 2; 2; 2) x 2
```
<br />

### 🔆 Alakzat TÉ értéke = 33

```
+28: Alakzat tagjainak fegyveres TÉ átlaga
 +5: TÉ bónusz Támadószint (8) után, mint egy
     extra harcmodorból képzettség szintjéből
     adódó bónusz
```

### 🔆 Alakzat VÉ értéke = 49

```
+40: Alakzat tagjainak fegyveres VÉ átlaga
 +9: TÉ bónusz Védekezőszint (8) után, mint egy
     extra harcmodorból képzettség szintjéből
     adódó bónusz
+4: Tagok száma (4) után
```

→ [Képzettség szintjéből adódó bónusz](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) ( Támadószint, Védekezőszint )

<br />

---
## Kezdeményezés szabályai

Mindig az alakzat nyeri a kezdeményzést a személyekkel szemben.

<br />

---
## VÉ csökkenés alakzat ellen alacsonyabb

```
-2: Alapból gyengébb
-3: Alakzat Teljes Védekezésben
```

Az alakzat ellen harcoló **egyén** ugyanúgy csökkent `Védő Értéket`, mint normál harc esetében - pengeméret különbségtől függően, viszont:

Az alakzat **ellen** leadott minden `VÉ` csökkentésből, tehát az alakzat által elszenvedett `VÉ` csökkenésből mindig `-2` levonandó, mivel egy alakzat nem úgy fárad, mint egy egyedül harcoló lény, sokkal nehezebb a "kifulladására" játszani.

Amennyiben az Alakzat [Teljes Védekezés](065_02_harci_taktikak.md#teljes-védekezés-taktika) taktikába áll be, akkor a fenti csökkentés `-3` értékre módosul.

**Tipp**: ezen hatás ellen megfontolandó lehet a [Plusz támadás taktika](065_02_harci_taktikak.md#plusz-támadás-taktika).

<br />

---
## VÉ csökkentés alakzat által és pengeméret különbségek

Az alakzat jellemző főfegyvere vs egyén **pengehosszának** különbsége adja a pengeméret különbség megállapítását.

Az Alakzat sikertelen támadásai által okozott `VÉ` csökkentés egy fix érték, amely az alábbiak szerint kerül kiszámításra.

### Alakzat VÉ csökkentése (fix értékek)

```
3 VÉ: Alakzat Pengehátrányban
3 VÉ: Alakzat Alappengénél
4 VÉ: Alakzat Pengeelőnyben
```

### Túlerő módosítója

```
VÉ csökkentés

+0 VÉ: 3 főnél (legkisebb Alakzat)
+1 VÉ: 5+ főnél (nem additív)
```

Tehát az egyén, - a  számára legrosszabb esetben - minden körben `-5 VÉ csökkenést` szenved el.

<br />

---
## Alakzat támadásainak száma

```
Hányat támad az alakzat?

1:1 támadás
  minden egyéni ellenfélre
  akikkel az alakzat harcol

Max 1:1 támadás = Alakzat létszáma
```

```
Példa

1 emberre: 1 támadás
3 emberre: 1:1-et mindenkire
```

<br />

---
## Alakzat `ÉP`

Összesített `ÉP` értéke van, tehát az alakzatban levő összes ember `ÉP` értékét egybe vesszük egy "masszába".

Minden ember `28 ÉP`-nek számít. Minden `28. ÉP` elvesztésénél `1` fővel csökken az Alakzat száma. Ez kihat a `VÉ` csökkentésre és harcértékekre is.

Egyes lényeknél eltérhet ez a szám. Pl. orkok esetén vehetjük `40 ÉP` értékűnek az `1` személyt.

<br />

---
## Alakzat sebzése

A jellemző főfegyver sebzése.

<br />

---
## Alakzat taktikái, Manőverek

Az Alakzat számára kizárólag az alábbi taktikák engedélyezettek és azok is csak fix értékekkel:

```
TÉ:+3 / VÉ:-6: Támadó taktika (fix)
VÉ:+4 / TÉ:-8: Védő taktika (fix)
TÉ:+4, VÉ:-8 : Roham taktika
+1 VÉ csökkentés:
  Fárasztó taktika, nincs találat
+4 VÉ csökkentés:
  Fárasztó taktika, lenne találat

```

Manőverek használata alakzatban nem lehetséges.

<br />

---
## Tiltott harci taktikák Alakzat ellen

Egy Alakzat ellen az alábbi taktikák NEM használhatóak:

- [Fárasztó taktika](065_02_harci_taktikak.md#fárasztó-taktika-): egy Alakzatot nem lehet úgy fárasztani, mint egy személyt
- [Kezdeményező taktika](065_02_harci_taktikak.md#kezdeményező-taktika): nincs értelme, mert az alakzaté a Kezdeményezés amúgy is
- [Kiváró taktika](065_02_harci_taktikak.md#kiváró-taktika): nincs értelme, mert az alakzaté a Kezdeményezés amúgy is
- [Visszafogott taktika](065_02_harci_taktikak.md#visszafogott-taktika-): egy Alakzatot nem lehet visszafogottan megütni, mint egy személyt

<br />

---
## Alakzat vs Alakzat

```
Maximum létszám: 20
```

Két Alakzat egymással való harcát is modellezzük - kis (`max 20 fő / Alakzat`) létszámig. Ennél nagyobb létszámú összecsapásokat nem modellezünk.

Minden szabály ugyanaz, mint a fent leírtak, kivéve az alábbiak:

```
1 tám/kör mindkét alakzatnak

VÉ csökkentés/kör: 2

+1 VÉ csökkentés / +3 ember
  (max: +5 VÉ)
```

---

🔗 [Kétkezes harc szabályai](065_04_ketkezes_harc_szabalyai.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
