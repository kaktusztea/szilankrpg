## Képzettségpróba

A felvett képzettségeket gyakran próbára is tesszük, sokszor a komfortzónán (biztos tudás) kívüli mértékben is. Ilyenkor képzettségdobást teszünk.

  - [Próbadobás](#pr%C3%B3badob%C3%A1s)
  - [Tulajdonság választás (opcionális)](#tulajdons%C3%A1g-v%C3%A1laszt%C3%A1s-opcion%C3%A1lis)
  - [Páncél MGT hatása fizikai Képzettségpróbákra](#p%C3%A1nc%C3%A9l-mgt-hat%C3%A1sa-fizikai-k%C3%A9pzetts%C3%A9gpr%C3%B3b%C3%A1kra)
  - [Kombinált képzettségpróba (több Tulajdonsággal egyszerre)](#kombin%C3%A1lt-k%C3%A9pzetts%C3%A9gpr%C3%B3ba-t%C3%B6bb-tulajdons%C3%A1ggal-egyszerre)
  - [Vállalás és Kritikus hiba](#v%C3%A1llal%C3%A1s-%C3%A9s-kritikus-hiba)
  - [Próba biztos tudásból](#pr%C3%B3ba-biztos-tud%C3%A1sb%C3%B3l)
  - [Siker/Kudarc mértéke](#sikerkudarc-m%C3%A9rt%C3%A9ke)
  - [Próba képzetlenül](#pr%C3%B3ba-k%C3%A9pzetlen%C3%BCl)
  - [Összetett képzettségpróba, Másodlagos próbadobások](#%C3%B6sszetett-k%C3%A9pzetts%C3%A9gpr%C3%B3ba-m%C3%A1sodlagos-pr%C3%B3badob%C3%A1sok)
  - [Összetett képzettségpróba - ellenpróba eset](#%C3%B6sszetett-k%C3%A9pzetts%C3%A9gpr%C3%B3ba---ellenpr%C3%B3ba-eset)
  - [Helyettesítés](#helyettes%C3%ADt%C3%A9s)
  - [Sérülés hatása képzettségpróbára](#s%C3%A9r%C3%BCl%C3%A9s-hat%C3%A1sa-k%C3%A9pzetts%C3%A9gpr%C3%B3b%C3%A1ra)
  - [Tulajdonság vs Képzettség ellenpróba](#tulajdons%C3%A1g-vs-k%C3%A9pzetts%C3%A9g-ellenpr%C3%B3ba)

### Csoportos képzettségek

- [Csoportos képzettségpróba](030_07_01_csoportos_kepzettsegproba.md)
- [Csoportosan végezhető képzettségek listája](030_07_02_csoportosan_vegezheto_kepzettsegek.md)

---
### Próbadobás

Vesszük az adott szituációban épp szükséges **Tulajdonság** értékét (KM mondja meg, hogy melyiket), hozzáadjuk a **Képzettség** szint értékét, majd dobunk `k10`-es kockával és a fentieket összeadjuk. Ha a kapott szám nagyobb, vagy egyenlő az adott szituációra meghatározott **Célszámmal**, akkor a próba sikerült.

Ha a KM úgy látja, hogy az adott próbánál több Tulajdonság is szerepet játszik, akkor a szükséges Tulajdonságok átlagával kell számolni. **Fontos**: az `1` és `10` dobások **NEM** kiemelt értékek, nem jelentenek kritikus hibát, vagy sikert.

```
Tulajdonság + Képzettség + k10
            vs
          Célszám
```

#### Képzettségpróba Célszámok

```
 6: Könnyű
 9: Átlagos
12: Nehéz
15: Nagyon nehéz
18: Rendkívül nehéz
21: Emberfeletti
...
30: Maximum célszám
```

A **Célszám** `21` fölé is mehet, arra is lehetséges próbát tenni. Ilyen magas célszámok esetén érdemes könnyítő módszereket keresni. Random példa: "szakrális emberáldozat csökkenti az adott próba nehézségét".

Példák `21` feletti célszámokra:
- [Aktuális Aura számításánál](104_aura_magia_akarata_magiaellenallas.md#aura-aktu%C3%A1lis-%C3%A9rt%C3%A9ke) Aurafejlesztés képzettségpróba
- [Méreg komplexitása](151_meregkeveres_szabalyai.md#a-m%C3%A9reg-komplexitása) Méregkeverésnél

<br />

---
### Tulajdonság választás (opcionális)

Hogy mely Tulajdonsággal kell a képzettségpróbát dobni, azt alapesetben a KM határozza meg, de van, hogy megoldható több Tulajdonsággal is.

A KM is felajánlhatja a "menüt", de a játékos is jelentkezhet ötlettel, hogy ő melyik Tulajdonság segítségével **hogyan** oldaná meg a feladatot. A KM dönt, hogy ezt elfogadja-e.

Tulajdonságonként viszont eltér(het)
- Nehézség
- megvalósítás módja, hossza
- rontás hatása

⚡ Példa: **Ügyesség** segítségével a határoló falakon ide-oda pattogva feljutni valahova, vagy helyből **Erő** segítségével ugrani egyet felfelé. Lehet, hogy a különböző megvalósítások különböző Nehézséget eredményznek.

<br />

---
### Páncél MGT hatása fizikai Képzettségpróbákra

Páncélod akadályozhat a fizikai Képzettségpróbák végrehajtásában.

Ezt a [Páncél akadályoztatása](082_statuszok.md#%EF%B8%8F-p%C3%A1nc%C3%A9l-akad%C3%A1lyoztat%C3%A1sa-1-mgt-%EF%B8%8F-mgt) Státusz írja le.

<br />

---
### Kombinált képzettségpróba (több Tulajdonsággal egyszerre)

Kizárólag [Összetett képzettségpróba](#%C3%B6sszetett-k%C3%A9pzetts%C3%A9gpr%C3%B3ba-m%C3%A1sodlagos-pr%C3%B3badob%C3%A1sok) esetén alkalmazható!

A Kombinált Tulajdonságpróbához hasonló helyzet, mikor a KM szerint nem csak `1`, hanem `2` Tulajdonság is szerepet kell kapjon a próba során.

Ekkor 
- a fontosabbnak ítélt Tulajdonsággal dobandó az első próba
- a másodlagos fontosságúnak ítélt Tulajdonsággal dobandó a csökkentett Nehézségű próba (lásd lenn az [Összetett képzettségpróbát](#%C3%B6sszetett-k%C3%A9pzetts%C3%A9gpr%C3%B3ba-m%C3%A1sodlagos-pr%C3%B3badob%C3%A1sok)!)

<br />

---
### Vállalás és Kritikus hiba

A Vállalás azt jelenti, hogy (ha a KM is beleegyezik) képzettségpróba esetén kaphatsz `[+1; +3]` bónuszt a próbára - te döntöd el mennyit. Minél többet vállalsz, annál nagyobb veszélynek teszed ki magad. Ugyanis a próba előtt „Vállalás próbát" kell dobni:

```
k6 vs. (a vállalás értéke)

Max vállalás: 3

Kritikus hiba:
 Dobás <= (vállalás értéke)
```

Először a képzettségpróba jön - a már megnövelt értékkel. Ha sikeres, akkor a próba hatása is sikeres lesz.\
Ez után jön viszont a fenti **Vállalás próba** - függetlenül attól, hogy a képzettségpróba sikeres volt-e, vagy sem.

Ha `k6`-on a **Vállalás** értékénél nagyobbat dobsz, nincs további hatás, viszont, ha avval megegyező értékűt, vagy kisebbet, akkor 🔆 **Kritikus hibát** vétesz. Ebből látszik, hogy vállalni csak nagyon fontos, ritka esetben van értelme. Úgy foglalhatjuk össze, hogy mikor vállalsz, olyankor megpróbálkozol valami olyan dologgal, ami hatékonyabb, mint jelenlegi tudásod, de még nem gyakoroltad be rendesen (pl. csak ellested a mesteredtől), így magadat is nagyobb eséllyel sodrod veszélybe. Nem fizikai próbáknál az is előfordulhat, hogy nem is vagy tudatában, milyen szörnyű bajba keverted magad, a rontás nem azonnali fizikai hatással jár - később jársz pórul.

A **Kritikus hiba** nem jelenti szükségszerűen a karakter végleges eltávozását, de jó időre kivonja őt a forgalomból, például napokra kómába kerül, vagy hosszútávú nagy bajba sodorja, amiről tudomása sincs. Ez lehet egy narratív elem is, amit a KM alkalmaz majd a közeljövőben.

Előfordulhat tehát olyan eset, hogy a **képzettségpróba** és így annak hatása sikeres volt, viszont a karakter közben **Kritikus hibát** vétett, aminek minden következményét vállalnia kell. Heroikus, önfeláldozó vagy ostoba cselekedet? Mindenki döntse ele maga.

#### 🔆 Fontos szabályok Vállalásra

- A Vállalás értéke nem haladhatja meg a használt képzettség aktuális értékét!
- Összetett, több dobást igénylő képzettségpróbánál nem alkalmazható Vállalás! Például megmászni a nagy hegyet.
- Kritikus hiba esetén **nem működik a Papi gyógyítás sem** a karakteren - a sors oly erőihez próbált nyúlni, amelyek eltaszították vakmerő tettét.

A fenti példánál maradva egy 2-es Vállalás esetén már a következőképpen fest a próba:

```
+ 2 (Ügyesség)
+ 5 (Mászás)
+ 2 (Vállalás)
+ k10

vs. 15 (Nagyon nehéz)

Azaz: (9+k10)  vs  15
```

Látható, hogy a vállalás sokat dob az esélyeken, de megvan a rizikója is: ha a fenti karakter a dobás előtt a Vállalás-próbánál `k6`-on `1`-et, vagy `2`-t dob, akkor **Kritikus hibát** vét!

<br />

---
### Próba biztos tudásból

Bizonyos képzettségeket csak biztos tudásból lehet megpróbálni, nincs lehetőség képzettségpróba dobására. Tipikusan a „Tudok-e valamit róla?"-jellegű határozottan eldönthető esetekben. Ilyenkor a KM dönti el, hogy az adott képzettségszinttel az adott feladat megoldható, avagy sem.

<br />

---
### Siker/Kudarc mértéke

⚜️ Ha `6` vagy annál nagyobb különbséggel (`2` tudás fok) rontottál, akkor kiemelten nagy hibát vétettél.

⚜️ Ha `6` vagy annál nagyobb különbséggel (`2` tudás fok) dobtál sikert, akkor kiemelten jól sikerült a próba.

A fenti kudarcnak/sikernek narratív hatása van, ezt maga a játékos mesélje el. Például különösen jól sikert a hamisítás és egy játékostársa némi előnyhöz juthat a Meggyőzés próbája során. Ha a KM-nek nem tetszik a játékos ötlete, felülbíráhatja.

<br />

---
### Próba képzetlenül

```
→ +3 a próba nehézségére
→ Fizikai képzettségeknél nincs büntetés
```

Ha a karakter egyáltalán nem jártas az adott képzettségben (vonatkozó értéke nulla), akkor - ha a képzettség leírásánál engedélyezett a képzetlen dobás - ugyanúgy próbát dob, mint bárki, de a **célszám `3`-al emelkedik**. Fizikai képzettségeknél **nem jár** a fenti, célszámot emelő büntetés.

Ha az adott képzettséget nem lehet képzetlenül megpróbálni, akkor a KM egyszerűen megtagadja a próbát, automatikusan sikertelennek véve azt.

<br />

---
### Összetett képzettségpróba, Másodlagos próbadobások

Ha a karakternek egy olyan összetett feladatot kell elvégeznie, ami nem intézhető el egy darab dobással (pl. megmászni egy hegyet, vagy rettentő magas várfalat, esetleg órákon keresztül verset szavalni), akkor igazságtalan lenne a maximális nehézséget többször megdobatni vele, hiszen így drasztikusan lecsökken az esélye a sikerre. Ilyenkor a következő módszert használjuk:

- A játékos dob egy próbát az indokolt maximális nehézségre, például „Nagyon nehéz" (`Célszám:12`).
- Ezután dob több (a KM dönti el, hány) próbát **1 fokozattal (`-3` célszám) alacsonyabb nehézség ellen**. Pl. (`2 db Nehéz próbát`). Így a siker eloszlása sokkal fokozatosabb és a biztos tudást is jobban jutalmazzuk, valamint elkerüljük, hogy egy kezdő - csak azért, mert szerencséset dobott - egy hosszú, részletes, tudását jóval meghaladó feladatot „véletlenül" megcsinálhasson.
- Hogy a másodlagos dobásból hány kell, az főleg attól függ, hogy a feladat „milyen hosszú", mennyire „többlépcsős".
- Ha nagyon finom bontást akarunk, akkor `akár 2 fokozattal` (-6  célszám) alacsonyabb nehézségre is dobathatunk akár így is: Nagyon nehéz (1 db), Nehéz(1 db), Átlagos (1 db).

#### ⚡Példa: Megmászni egy 200 méter magas, omladékos hegyet

```
Tetves, a tolvaj

7: Mászás képzettsége
2: Ügyessége

Dobás: k10 + 9
```

```
15: Próba célszám
    (Nagyon nehéz)
```

Mivel az út hosszú, nem intézhető el a dolog `1 db` dobással, a KM `2 db Másodlagos próbát` ír elő.

```
Célszámok, esélyük

15 (50%)
12 (80%)
12 (80%)
```

```
30%: Teljes feladat siker esélye

(0.5 x 0.8 x 0.8)
```

Látható, hogy az összetettebb feladatok nagyobb fokú biztos tudást igényelnek.

Tehát a próbák:

```
→ 1x Nagyon nehéz (15)
→ 2x Nehéz        (12)
```

Hasonló szituáció: [Mászás képzettségpróbára összetett példa](szituaciok/maszas_osszetett_pelda.md)

<br />

---
### Összetett képzettségpróba - ellenpróba eset

Különleges eset az ilyen. Olyankor fordulat elő, mikor hosszabb, összetettebb próba szükséges, amelyben a felek összemérhetik tudásukat.

- Ellenpróbákat dobatunk, tehát **nincs** Nehézség célszám
- Ellenpróbák száma páratlan és zárt végű, tehát meghatározott darab, jellemzően: `3, 5, 7`, vagy extrém esetben `9`
- Minél hosszabb, összetettebb a cselekmény, annál több a dobások száma
- Aki több ellenpróbát megnyer, az nyeri végül az összetett próbát

#### ⚡Konkrét példa

Hősünket napokon át üldözi egy felbérelt zsoldos lóháton. Mindketten kihozzák hátasukból a maximumot, figyelnek a pihenésre, etetésre, a fenntartható maximális tempóra. Az ellepróba azt dönti el, utoléri-e áldozatát.

#### Narratív eszköz

Ez a játékmechanika tempókezelési eszközt is adhat a KM kezébe a mesélés során, ha nem akarja lemesélni minden mozzanatát például egy hosszabb, - de sokadjára már unalmas - üldözésnek.

Ezen felül a ez a módszer a feszültség fenntartására is alkalmas, mert esélyesen egészen az utolsó pár dobásig nem tudni, ki kerekedik majd felül. Alkalmazhatjuk fázisokban, időben szétterítve is, tehát attól függően, ki nyerte épp az aktuális dobást, a történet is aszerint alakul, míg az utolsó dobásnál következik be a kapott eredmény okozta esemény (például a fent említett zsoldos 5 napi üldözés után utolérte áldozatát).

<br />

---
### Helyettesítés

Vannak olyan esetek, amikor egyes képzettségek ismerete helyettesítő segítséget nyújthat más képzettségek használatakor.

Ekkor a **Helyettesítő képzettség** szintjének `1/3` része alkalmazható az elsődleges képzettség helyett.

❗**Fontos**: a helyettesítő értékek NEM adódnak hozzá az elsődleges képzettséghez, hanem kiváltják azt.

Tehát:

```
- (Szint/3) behelyettesítő értékként
- Max szint helyettesítve: 5
- lefelé kerekítünk
```

A helyettesítő képzettség(ek) értelemszerűen legfeljebb `5.szintű` helyettesítő értéket képesek adni (`15/3=5`).

Az egyes helyettesítés-párokat nem írjuk le mind, ezek helyzetfüggőek, a KM rögtönözhet ha az adott szituációban úgy ítéli meg, hogy egy képzettség behelyettesíthető a fentiek szerint a másik helyére.

#### ⚡Példa: Nyomozás helyettesítéssel

A karakter egy bűntény helyszínén gyanús személyekkel találkozik. Kikérezné őket, **Nyomozás** képzettségpróbát kéne dobnia. Mivel **Nyomozás** képzettsége csak `2.szintű`, ezért egy kapcsolódó képzettsége segítségére támaszkodik, amiben sokkal járatosabb és le is fedi az aktuális szituációban szükséges ismeretet. A KM az adott helyzetben ezt jól megindokoltnak látja, így engedélyezi.

- Nyomozás `2.szint`
- Emberismeret: `9.szint`  (Nyomozás képzettség helyettesítése)

Ebben az esetben az **Emberismeret** képzettség az, amely helyettesítő képzettségként működik, ezért annak `1/3`-a működhet **Nyomozás** képzettségként (a próba idejére): `9/3 = 3`

Tehát a próbát `3 + Érzékenység  vs  Próba célszám` értékekkel dobja.

#### ⚡További Helyettseítés példák felsorolásszerűen

- [Akrobatika](kepzettsegek.primer.altalanos/akrobatika.md) ⇆ [Mászás](kepzettsegek.szekunder/maszas.md)
- [Orvoslás](kepzettsegek.primer.altalanos/orvoslas.md) ⇆ [Méregkeverés](kepzettsegek.primer.altalanos/meregkeveres.md)
- [Alkímia](kepzettsegek.szekunder/alkimia.md) ⇆ [Méregkeverés](kepzettsegek.primer.altalanos/meregkeveres.md)
- [Vajákosság](kepzettsegek.szekunder/vajakossag.md) ⇆ [Természetjárás](kepzettsegek.szekunder/termeszetjaras.md)
- [Lexikum](kepzettsegek.szekunder/lexikum.md) ⇆ [Művészetismeret](kepzettsegek.szekunder/muveszetismeret.md)
- stb.

<br />

---
### Sérülés hatása képzettségpróbára

Ha megsérül a karakter és `S3`, vagy `S4` sebesülés-kategóriába kategóriába került, akkor ["Sérült" Státuszt](082_statuszok.md#%EF%B8%8F-s%C3%A9r%C3%BClt-1-s3) kap és az ott leírtak szerinti hatások sújtják a képzettségpróbáit.

<br />

---
### Tulajdonság vs Képzettség ellenpróba

Előfordulhat olyan furcsa helyzet, hogy a KM véleménye szerint egy szituációban az egyik fél a Tulajdonságát, a másik egy képzettségét használná.

Ekkor azt javasoljuk, hogy - akár a realizmus feláldozásával is - de próbálja vagy Tulajdonság ellenpróbába, vagy Képzettség ellepróbába fordítani a szituációt. Ne bonyolítsunk feleslegesen.

---

🔗 [Képzettségpróba Hátrányok](030_06_02_kepzettsegproba_hatranyok.md) →

⚜️ [Nyitóoldal](start.md#3-k%C3%A9pzetts%C3%A9grendszer-)
