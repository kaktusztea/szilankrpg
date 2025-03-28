## Harc alakzatban

Mikor összehangoltan, csoportban mozognak harcosok, akkor komoly előnyt képesek kiépíteni. Az egyén feladata ellenük nagyon nehézzé válik, ilyenkor leginkább egy másik alakzat az, ami hatékonyan képes lehet vele felvenni a harcot.

Az alakzat tagjai küzdhetnek különféle harcmodorokban - a lényeg az összeszokottság. Nem készítünk külön szabályokat az összeszokottság mértékének módosítóira - egy heroikus rendszerben valószínűleg összeszokott csapat indít csak csoportos támadást.

## Alakzat egyedi jellemzői

⚜️ **Támadófok**
- `MIN(`Támadó-alakzat` fortély)`
- Legalacsonyabb [Támadó-alakzat](fortelyok.harci/alakzat_tamado.md) fortély foka (csapattagok között)
- Bónusz `+2 / fok`

⚜️ **Védekezőfok**
- `MIN(Védekező-alakzat fortély)`
- Legalacsonyabb [Védekező-alakzat](fortelyok.harci/alakzat_vedekezo.md) fortély foka (csapattagok között)
- Bónusz `+2 / fok`

⚜️ **Alakzatszint**
- [Csoportos fizikai próbatétel](037_kepzettsegproba_kooperacio.md#%EF%B8%8F-1-csoportos-fizikai-pr%C3%B3bat%C3%A9tel) szerint a csapat [Alakzatharc](kepzettsegek.primer.harci/alakzatharc.md) képzettség átlaga
- [Parancsnok](fortelyok.harci/parancsnok.md) fortély enyhít a csoportos büntetéseken

---

⚜️**Támadószint**: `Alakzatszint + Támadófok bónusz`

⚜️**Védekezőszint**: `Alakzatszint + Védekezőfok bónusz`

---
## Alakzat harcértékeinek meghatározása

**TÉ SUMMA**
- Alakzat tagjainak fegyveres `TÉ` átlaga 
- `TÉ bónusz`: **Támadószint** mint egy extra [harcmodorból adódó érték](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)

**VÉ SUMMA**
- Alakzat tagjainak fegyveres `VÉ` átlaga 
- `VÉ bónusz`:  **Védekezőszint** mint egy extra [harcmodorból adódó érték](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)
- ⭕Legyen?⭕Személyek száma utáni `VÉ` bónusz (`+3 VÉ / fő;  max +30 VÉ`)

🔆**Megjegyzés**: [Lovaglás bónuszai](067_01_lovas_harc_szabalyok.md#lovasl%C3%A9glovas-harc%C3%A9rt%C3%A9kek-kisz%C3%A1m%C3%ADt%C3%A1sa) is beszámítanak az alapértékekbe, ha hátasokon harcol az alakzat

<br />

---
## ⚡Példa: 4 fős alakzat

Borz
- Alakzatharc: `6.szint`
- Támadó-alakzat fortély: `2.fok`
- Védekező-alakzat fortély: `2.fok`

Tetves
- Alakzatharc: `7.szint`
- Támadó-alakzat fortély: `1.fok`
- Védekező-alakzat fortély: `2.fok`

Rühes
- Alakzatharc: `8.szint`
- Támadó-alakzat fortély: `0.fok`
- Védekező-alakzat fortély: `2.fok`

Csámpa
- Alakzatharc: `10.szint`
- Támadó-alakzat fortély: `1.fok`
- Védekező-alakzat fortély: `2.fok`

<br />

---
## ⚡Harcértékek: 4 fős alakzat

⚡Támadófok: `0`
- `MIN(2; 1; 0; 1)`

⚡Védekezőfok: `2`
- `MIN(2; 2; 2; 2)`

⚡Alakzatszint: `6 - (2x1) → 4`
- legalacsonyabb képzettség: `6`
- két társ van `3` szint "távon" belül, tehát tehát `-(2x1)` büntetés

⚡Támadószint: `4`
- Alakzatszint (`4`): kiterjeszti **Támadófok** (`0`)
- `0.fok: nincs bónusz`
- `4 + 0 = 4`

⚡Védekezőszint: `8`
- Alakzatszint (`4`): kiterjeszti **Védekezőfok** (`2`)
- `2.fok: +4 bónusz`
- `4 + 4 = 8`

---
🔆**Alakzat TÉ értéke**
- Alakzat tagjainak fegyveres `TÉ` átlaga 
- `TÉ bónusz`: **Támadószint** (`4`) mint egy extra [harcmodorból adódó érték](062_02_harcmodor_kepzettsegek_es_bonuszaik.md)
    - `TÉ: +3` (`4.szinten` ennyi bónusz jár)

🔆**Alakzat VÉ értéke**
- Alakzat tagjainak fegyveres `VÉ` átlaga 
- `VÉ bónusz`: **Védekezőszint** (`8`) mint egy extra harcmodorból adódó érték
    - `VÉ: +15` (`8.szinten` ennyi bónusz jár)
- `VÉ bónusz - tagok száma után`
    - `4` fős a csapat, `VÉ: +3/fő`
    - `VÉ: +12`

<br />

---
## Személyek száma utáni `VÉ` bónusz

```
+3 VÉ / fő
 Max 30 (3 x 10)
```

A személyek száma is növeli az alakzat harcértékét. Egyszerűbb, ha ez fix érték, bár nyilván felmerül, hogy egy képzett harcosoknál ez többet kéne adjon, **viszont** ezt az [Alakzatharc](kepzettsegek.primer.harci/alakzatharc.md) képzettség-szintből [adódó bónuszokkal](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szimuláljuk. Belátható, hogy egy szuper harcos nem ad hozzá túl sokat az alakzathoz, ha képzetlen az alakzatharcban.

Miért csak `VÉ` bónuszt ad?\
Mert a támadás bónuszok az **Alakzatharc képzettség-szintből** jönnek.\
Az alakzat tagjainak nagyobb száma inkább a nehezebb megtámadhatóságot (`VÉ` bónusz) ((és ugye a durvább `VÉ-csökkentést`)) adja.

<br />

---
## Kezdeményezés szabályai

Mindig az alakzat nyeri a kezdeményzést a személyekkel szemben.

<br />

---
## VÉ regenerálódás

⭕TODO: ez legyen?⭕
Az Alakzat `VÉ` értéke minden kör elején visszaáll eredeti értékére (mint az élőhalottaknál).

Látható, hogy `1` körön belül kell annyira "leverni" az alakzat Védő Értékét, hogy aztán találatot érhessünk el.

Tipp: erre használható esetlegesen a [Plusz támadás taktika](065_02_harci_taktikak.md#plusz-t%C3%A1mad%C3%A1s-taktika).

<br />

---
## VÉ csökkentés és pengeméret különbségek

Az alakzat jellemző főfegyvere vs egyén pengehosszának különbsége adja a pengeméret különbség megállapítását.

### Alakzat VÉ csökkentése (fix értékek)

```
-2 penge különbség (alakzaté)
  VÉ csökkentés: 3

-1 penge különbség (alakzaté)
  VÉ csökkentés: 5

Azonos pengehossznál:
  VÉ csökkentés: 7

+1 penge különbség (alakzaté)
  VÉ csökkentés: 10

+2 penge különbség (alakzaté)
  VÉ csökkentés: 15
```

#### Túlerő módosítója

```
3 fő: +0 VÉ csökkentés
4 fő: +1 VÉ csökkentés
5+ fő: +2 VÉ csökkentés
```

Tehát az egyén számára legrosszabb esetben minden körben `-17 VÉ csökkenést` szenved el.

### Egyén VÉ csökkentése

Az alakzat ellen harcoló **egyén** ugyanúgy kis/nagykockával csökkent, mint normál harc esetében - pengeméret különbségtől függően.

<br />

---
## Támadások száma

```
Minden egyéni ellenfélre 1-1 támadás jut,
  akikkel az alakzat harcol.
```

Egyértelműsítés:
- Ha `1` emberrel harcolnak, akkor rá `1`-et támad az alakzat.
- Ha `3` emberrel harcolnak, akkor mindegyik egyénre `1-1`-et támad az alakzat.

<br />

---
## Alakzat `ÉP`

Összesített `ÉP` értéke van, tehát az alakzatban levő összes ember `ÉP` értékét egybe vesszük egy "masszába".

Minden ember `10 ÉP`-nek számít. Minden `10. ÉP` elvesztésénél `1` fővel csökken az Alakzat száma. Ez kihat a `VÉ` csökkentésre és harcértékekre is.

Egyes lényeknél eltérhet ez a szám. Pl. orkok esetén vehetjük `15 ÉP` értékűnek `1` személyt.

<br />

---
## Alakzat sebzése

A jellemző főfegyver sebzése.

<br />

---
## Alakzat taktikái, Manőverek

Kizárólag az alábbi taktikák engedélyezettek
- Támadó - fixen `TÉ:+10 / VÉ:-20`
- Védő - fixen `TÉ:+10 / VÉ:-20`
- Roham - `TÉ:+20`, `VÉ:-40`
- Fárasztó - `+5`; sebzés helyett  `+10` VÉ csökkentés

Manőverek használata nem lehetséges.

<br />

---
## Alakzat vs Alakzat

Maximum létszám: `20`❓

Ennél nagyobb létszámú összecsapásokat nem modellezünk.

Minden mint, az `1.ESETBEN`, kivéve...

```
1 támadás / kör minden alakzatnak

VÉ csökkentés/kör: 5  (csak)
  + 1 túlerő személyenként (max: +5)

A VÉ értéke NEM áll vissza kör elején
```


---

🔗 [Kétkezes harc szabályai](065_04_ketkezes_harc_szabalyai.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
