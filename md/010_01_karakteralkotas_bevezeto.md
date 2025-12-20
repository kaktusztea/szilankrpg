## Karakteralkotás bevezető

Milyen jellegűek a Szilánk karakterei?

Fontos különbség más, hagyományos rendszerekhez képest, hogy a Szilánk karaktereinek **nincs kasztja**, sem alap tudáskészlete, így minden jellemzőjét neked kell meghatároznod nulláról - viszont ez sokkal nagyobb szabadságot is ad, még ha több számolással is jár. Ez utóbbiban nyújt hatalmas segítséget az automatizált [Karakteralkotó](010_02_karakteralkoto_ods.md).

Mikor karaktert alkotsz, először fejben elképzeled a küllemét, a jellemét, a származását, hogy mihez ért, miben jó, milyen ismereteket tanult eddigi pályafutása során, majd jöhetnek a számokkal ennek megfeletetett, modellezett jellemzői.

Ha egyből fejest ugranál a közepébe, a [Példakarakter megalkotása](010_12_peldakarakter_megalkotasa.md) fejezetben lépésről lépésre bemutatjuk a folyamatot. Mindazonáltal érdemes lehet előbb elolvasni a megelőző fejezeteket is.

<br />

---
### Karakter Tapasztalati szintje

```
[1; 21] Tapasztalati szint

3.szint: nullpont
```

Először a karakter [Tapasztalati Szintjét](010_04_tsz_szintlepes.md) kell meghatároznod. A `Szilánk` rendszerében `[1; 21]` szint intervallumban játszhatsz karakterrel, a **3. Tapasztalati szint** szimbolizálja a "nullpontot", az átlagos, hétköznapi, novícius karaktert, amit más szerepjátékok `1.szintű` kalandozóként jellemeznek.

Ez a filozófia (`3.szint` a nullpont) a szabályrendszer más területein - mint a képzettségek ismerete - is visszaköszön majd.

Hogy a KM hányadik szintet engedélyez kezdésnek, az csak rajta és a parti játékosainak megegyezésén múlik. Lehet életút játékot kezdeni a legelejéről (ekkor `3.TSz` a javasolt), de rögtön fejest is ugorhattok a magasabb szintű karaktereket igénylő kalandokba.

<br />

---
### Tulajdonságok meghatározása

```
[-5; 5]
```

Folytatásként a `8 db` egyedi [Tulajdonságod](010_05_01_00_tulajdonsagok_listaja.md) értékét kell meghatároznod `[-5; 5]` intervallumban **Tulajdonságpontok** elosztásával. A fenti intervallumot a [Fajok](021_faj_hatterek.md) egyedi jellmzői módosíthatják.

<br />

---
### Karakteralkotó Pontok számítása

A [Karakteralkotó Pontjaid](010_07_kp.md) (`KP`) adnak lehetőséget a különböző ismeretek felvételére (képzettség, fortély, Harcérték Módosító (HM/CM)). Figyelj, hogy a [Szekunder KP](010_07_kp.md)-kat csak [Szekunder ismeretekre költheted](010_09_primer_szekunder_ismeretek.md).

<br />

---
### Képzettségek felvétele

```
[0; 15] szint
```

Most a [Képzettségek listáját](030_01_kepzettseglista.md) tekintsd át, majd elkezdhetsz `KP`-kat költeni rájuk. Az egyes képzettségszintek exponenciálisan [egyre drágábbak](030_05_kepzettsegszintek_kp_igenye.md), ahogy a `0-15`-ös skálán haladsz felfelé. A `3.szint` itt is a "nullpontot" jelképezi, alatta inkább levonás jár. Sok képzettségnek van - jellemzően - Tulajdonság-követelménye, ezeket lásd az adott képzettségek leírásában. A csatákban használt [Harcmodorok](030_01_kepzettseglista.md#harci-képzettségek-🅿️), a [Pszí használat](kepzettsegek.primer.misztikus/pszi_hasznalat.md) és a varázslásban alkalmazott [Mágikus Szférák és Arkánumok](107_magikus_szferak_arkanumok.md) is ilyen képzettségek. Szintén képzettségek a mágikus és papi [Tradíciók](050_tradiciok.md).

<br />

---
### Fortélyok felvétele

```
[1; 4]. fok
```

Karakteralkotó Pontjaidat [Fortélyok](040_fortelyok.md) felvételére is költheted, amelyek változóan, `[1-4]` fokúak is lehetnek. Ezek nem szélesen skálázandó, hanem "szűk", biztos tudást adhatnak, vagy egy képzettség egy meglevő aspektusának erősítését végezhetik - jellemzően `+2` bónuszt adva fokonként. 

A [Kiemelt Fortélyok](041_kiemelt_fortelyok.md) három egyedi ismeretet adnak, amelyekre nem kell `KP`-t költened.

A [Szabad Fortélyok](042_szabad_fortelyok.md) - melyekből Tapasztalati Szintenként `1 db` **ingyen jár** - specializált, egy, vagy több képzettséget [kiterjesztő](030_08_01_kepzettsegek_fortelyok_kapcsolata.md#2-k%C3%A9pzetts%C3%A9gek-kiterjeszt%C3%A9se-fort%C3%A9lyokkal) ismeretek.

A [Pszí alkalmazás](fortelyok.misztikus/pszi_kiterjesztes.md) is a Fortélyok közt található.

Fontos kiemelni a [Mesterfegyver](fortelyok.harci/mesterfegyver.md) harci fortélyt amely egy konkrét fegyver hatékonyabb használatát foglalja magában.

<br />

---
### Harcérték módosítók (HM/CM)

A [Harcérték Módosítók (HM, CM)](062_04_hm_cm.md) az általános harci tapasztalat növekedését szimbolizálják, felvételük szintén `KP`-ból történik.

<br />

---
### Hátterek felvétele

A [Hátterek](020_hattererek.md) számos érdekes aspektussal ruházhatják fel karakteredet. Leginkább színesítő szerepet látnak el, **nem** kerülnek `KP`ba.

- [Faj Háttér](021_faj_hatterek.md) felvételével határozhatod meg karaktered faját - tulajdonság limitációik, érzékeiket érintő, kapcsolódó fortélyaik, faj-misztériumuk ez alatt a háttér alatt kerülnek összefogásra.
- [Leíró Hátterek](022_leiro_hatterek.md): egyszavas jellemzők, melyek a karakter jellemét, hátterét színesítik - tetszés szerint vehetőek fel.
- [Karma Hátterek](023_karma_hatterek.md): események, különleges, kalandok során végzett cselekedetek hatására kapott jellemzők.

<br />

---
### Származtatott értékek

Jöhetnek a [Származtatott értékek](010_10_00_szarmaztatott_ertekek.md) kiszámításai. Ezek a jellemzők nem kerülnek külön pontba, a karakter meglevő ismereteinek értékeiből számoljuk ki őket:

- [Életerő Pont és Fáradság Pont](010_10_01_ep_fp.md)
- [Manőver Pontok](066_02_manover_pontok.md)
- [Mágiaellenállás](010_10_04_magiaellenallas.md)
- [Méregellenállás](010_10_05_meregellenallas.md) 

Végül jöjjön karaktered [harcértékeinek megállapítása](062_01_ke_te_ve_ce.md) a harci ismereteid értékei alapján.

<br />

---
### Mágia ismeretek felépítése

Használjunk egy "fa" hasonlatot.

A "törzs", az **alapozás** egy [Mágia Tradíció](051_00_magia_tradiciok.md) képzettség felvétele, amely meghatározza, milyen jellegű mágiát fog használni, milyen "tradíciót" követ karaktered.

A fa "ágai" a [Mágikus Szférák vagy  Arkánum](107_magikus_szferak_arkanumok.md) képzettségek. Ezek a mágiaiskolák, amelyeket az adott Tradíció alatt karaktered megtanult és annak kontextusában használni is képes. Lehet a tanult Arkánum neve ugyanaz, ám egy "Asztrálmágia Arkánum" más-más formulákat tartalmaz a [Magasmágia](051_01_magasmagia.md) és másokat például a [Vulgármágia](051_02_vulgarmagia.md) alatt.

Jöjjenek végül a [Misztikus és Mágia fortélyok](045_misztikus_magia_fortelyok.md) amelyek a "levelek" a fa ágain. Ide tartoznak a [Varázslás módszerek](105_varazslas_modszerek.md) és más misztikus, színesítő, specializálódó ismeretek.

<br />

---
### Ajánlás karakteralkotás opcionális menetére

A lenti folyamat leginkább karakterközpontú játékosok számára ajánlott, akik nem csak egy számhalmazon alapuló gyilkológéppel szeretnének játszani, hanem "élő, lélegző" karaktereket alkotnának.

Az elvont és színesítő ismeretek felől haladunk a "tápos" irányba. A harci, misztikus ismeretek meghatározása történik a folyamat legvégén.

- `1.` Karakter előtörténeténetének kidolgozása - számok nélkül
- `2.` Karakter jelleme, személyiségének meghatározása
- `3.` Szabad Fortélyok kiválasztása
- `4.` Szekunder KP elköltése
- `5.` Sima KP elköltése (ne feledd ,ezeket is lehet szekunder ismeretekre fordítani!)

---

🔗 [Karakteralkotó ods](010_02_karakteralkoto_ods.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#1-karakteralkotás)
