## Fáradtság Pont (`FP`)

A rendszer különbséget tesz a fizikai sérülés és a karakter azon állapota között, amely a pillanatnyi állapotát, ájulástól való „távolságát” meghatározza. Ez utóbbit szimulálja a **Fáradtság Pont** (`FP`). Az `FP` értékének semmi köze nincs a **Fájdalomtűrés** képzettséghez, tőle teljesen független fogalom!

Az `FP` az alábbi állapotok szimulálására alkalmas:
- tartós kimerültség
- zúzódásokból adódó "leharcoltság"
- harc harc után rendes, alapos, nyugodt pihenés nélkül
- kialvatlanság
- éhség
- rosszullét
- mérgezés okozta gyengeség
- másnaposság
- pánikroham hatása

Az `FP`-nek nincs kezdeti értéke, csak a fenti hatások valamelyike következtében jöhet létre. Tehát ebből a szempontból jegyzése az `ÉP`-vel ellentétes. Mikor valaki olyan „sebesülést” szenved el, hogy `FP`-t „szerez”, a hatás megegyezik azzal, mint amit valós sebesülés esetén tapasztal, de nem jár strukturális károsodással (valódi `ÉP` sebbel), vagy halállal, legfeljebb ájulással. Tipikus esete az `FP` sebesülésnek, mikor valakit alaposan fejbe kólintanak. Ez – szándéktól függően – okozhat valós sebesülést is, de ezen kívül `Fáradtság Pontokat` is szül. Másik példa lehet, mikor a karakter rosszullétet okozó mérget iszik.

A sima `ÉP` és az `FP` értékek kezelése ugyanabban az `ÉP` táblázatban történik, hatásaik is megegyeznek, csak az `FP` esetén nincs valós fizikai sérülés, viszont a „sebesülés” okozta harcérték levonások úgy számítandóak, mintha valós sebzés történt volna! A gyakorlatban ez úgy néz ki, hogy ha a karakter **Fáradság Pontot** szerez, azt bejelöli a rendes `ÉP` táblázatban.

---
### Sebzések jelölése az `ÉP` táblázatban

Először jelöljük be a valós sebesülés okozta `ÉP`-ket, majd utána az `FP`-ket (ajánlott egy `F` betű írása a rubrikákba).

---
### Valós ÉP seb elszenvedése FP után

Amennyiben a karakter életerő táblázatában van bármennyi `FP`, akkor egy újabb, - immár valós - `ÉP` seb elszenvedésekor először ezeket az `FP` jelölőket "alakítsuk" át valós sebbé és csak utána jelöljünk be újabb seb rubrikákat. Egyszerűen fogalmazva: egy valós sebzés először az `FP`-ket írja át ("felülről") és csak a "maradék" sebez újonnan.

---
### Túlcsordult `FP`

Amennyiben az életerő táblázat "betelt" és van benne `FP`, akkor a "túlcsorduló" bármilyen sebzés (`ÉP, FP`) felülről átírja az `FP` pontokat `ÉP` pontokra.

---
### FP gyógyulása

```
1 FP: ébren óránként
2 FP: alvásban óránként
```

Az `FP`, mivel nem valós sebesülés okozta, gyorsabban „gyógyul”, mint a valós `ÉP` seb. Fizikai behatás esetén kb. **óránként 1 pont „tűnik el”**, és így szép lassan „visszaolvad” a valós sebzésbe. Mérgezés, betegség esetén a hatás tartósabb is lehet, itt a KM dönt. **Alvás közben** a gyógyulási sebesség duplázódik, tehát `2 FP / óra`. Ha a KM úgy látja indokoltnak eltérhet a fenti számoktól.

---
### Tartós rosszullét

Ha a karakter például méregnek „köszönhetően” tartósan gyengélkedik, akkor tartósan alkalmazhatjuk az `FP`-ket, azaz a rosszullét idejére ezek megmaradnak, vagy lassabban tűnnek el.

---
### Verekedés, Kocsmai bunyó és `FP`

```
Bunyóban minden 5. FP
 1 ÉP sebet okoz
```

Az `FP` kiválóan alkalmas kocsmai verekedések, kisebb – nem „vérre menő” – összetűzések szimulálására is. Mint ahogy azt a „Fegyverek” fejezetben láthatjuk, a Puszta kéz sebzése mindig `FP` (kivéve egyes harcművész stílusokat).

**Minden `5. FP` okoz csak `1 ÉP` valós sebesülést: `4 FP, 1 ÉP`**

A szabály sebzésenként számít, tehát bekaphat a karakter több '4 FP' sebet anélkül, hogy 'ÉP' sebet szerezne.

---
### Fejbe vágás

Gyakori eset, hogy valakinek ráhúznak egy nagyot a fejére. Például sisakos ellenfelet fejen találnak egy buzogánnyal. A sisak ugyan megvédi, de a feje mégis igen nagy traumát szenved el, pár körig meglehetősen kellemetlenül érzi magát. Ez természetesen helyzet specifikus, a – KM dönt –, de irányadónak elmondhatjuk, hogy ilyenkor például plusz `2-3 FP` büntetést kap az áldozat, amelyek azonban pár kör alatt elmúlnak. Ne keverjük a **Fejbe vágást** a 🗡️[Leütés hátulról](066_05_altalanos_manoverek.md#leütés-hátulról) harci taktikával!

---
### ⚡ Példa `FP` alkalmazására

Cravignon rossz napja kezdetén rossz embernek, az elöljáró élénkítőszereket előszeretettel magába tömő testőrének szólt be a hétvégi körmeneten, mikor az áttiport a lovag lábán. A jó lovag foghegyről odavetett szitkozódása a kántálásban beállt lélegzetvételnyi szünetben szisszent ki fogainak keritésén. A testőr - ki lábát taposta imént - ezt hallván egy gyors fordulat után méretes öklével vágott Cravignon bal vállába.

- Cravignon `ÉP: 14`
- Testőr Erő: `+2`
- Testőr, Puszta kéz sebzése: `k20 - 5 FP + 2 (Erőbónusz)`
- `1. Sebzés`: `19-5+2 = 14 SP` → `6`, azaz `5 FP és 1 ÉP`

Ezzel Cravignon már `S2` kategóriába került. Csillagokat lát a vállába hasító tompa, de brutális ütéstől. Lustán előrekaszál, de elvéti és ellenfele ismét betalál. Ezúttal gyomorszájon találják. Sziszegve szökik ki száján a levegő.

- `2. Sebzés`: `9 SP` → `3 FP`
- ezzel már `9 db` rubrika lett bejelölve a lovag Életerő táblázatában. `S3` kategóriában van. Még `2` rubrika és `S4`-be kerül.

Szerencséjére a testőr elégnek találja a megtorlást és felzárkózik gazdája mellé. Cravignon kivonszolja magát a kocsma mellé és lerogy a lépcsőre.

Összesen `8 FP` és `1 ÉP` sebet szenvedett el. A `8 FP` szerencsére `8` óra múlva magától, alvással pedig már `4` óra alatt elmúlik. Az `1 ÉP` seb viszont csak `1` nap alatt tűnik el - ahogy máskor is.

---

🔗 [Sebesülés](061_03_sebesules.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
