## Fegyverek általános szabályai

### Fegyverméretek, általános fegyver-harcértékek

Alább alapelveket találhatunk az egyes általános fegyverkategóriákhoz – méret szerint. A lentiek irányadó értékek, az egyes konkrét fegyverek számai ettől eltérnek, viszont új fegyver beillesztése a rendszerbe így gyerekjáték.

| **Kategóriánként** | `KÉ` | `TÉ` | `VÉ` |
| ------------------ |:----:|:----:|:----:|
|                    | `2`  | `4`  | `4`  |
<br />

| **Fegyver példa** | **Kategória** | **Sorszám** | `KÉ` | `TÉ` | `VÉ` |
| ----------------- | ------------- |:-----------:|:----:|:----:|:----:|
| tőr               | `rövid`       |     `1`     | `2`  | `4`  | `4`  |
| rövid kard        | `0,5 penge`   |     `2`     | `4`  | `8`  | `8`  |
| hosszú kard       | `1 penge`     |     `3`     | `6`  | `12` | `12` |
| másfélkezes kard  | `1,5 penge`   |     `4`     | `8`  | `16` | `16` |
| kétkezes kard     | `2 penge`     |     `5`     | `10` | `20` | `20` |
| alabárd           | `3 penge`     |     `7`     | `12` | `28` | `28` |
| lándzsa           | `4 penge`     |     `9`     | `18` | `36` | `36` |


---
### Fegyverméret elnevezések, szabályok

- `rövid`: `0,3` méterig
- `0,5 penge`: `0,4 - 0,7` méter
- `1 penge`: `0,8` méter
- `2 penge`: `1,6` méter

---
### Jellemző pengehosszok

- kard
  - méret: `0,75 - 0,9` méter
  - átlag: `0,8` méter
  - jellemzően: `1` penge
  - maximum: `1` penge
- alabárd
  - méret: `1,8 - 2,5` méter
  - átlag: `2,1` méter
  - jellemzően: `2 penge`
  - maximum `3 penge`
- lándzsa
  - méret: `1,8 - 3,5` méter
  - átlag: `2,6` méter
  - jellemzően: `3` penge
  - maximum: `4 penge`
- pika
  - méret: `4 - 7,0` méter
  - átlag: `5,5` méter
  - jellemzően: `7` penge
  - maximum: `8` penge

<br />

---
### Sebzéstípusok

- [Elsődleges](064_02_05_fegyver_sebzes_jellege.md#sebz%C3%A9st%C3%ADpus-els%C5%91dleges)
- [Egyenjogú](064_02_05_fegyver_sebzes_jellege.md#sebz%C3%A9st%C3%ADpus-egyenjog%C3%BA)
- [Másodlagos](064_02_05_fegyver_sebzes_jellege.md#sebz%C3%A9st%C3%ADpus-m%C3%A1sodlagos)
- [Alkalmatlan](064_02_05_fegyver_sebzes_jellege.md#sebz%C3%A9st%C3%ADpus-alkalmatlan)

<br />

---
### Különleges fegyver szabály

```
Jelölése: KF
```

Egyes – speciális – fegyvereknél van megemlítve ez a szabály. Jelentése: a táblázatban leírt harcértékek csak akkor érvényesek, ha speciális iskolában, vagy onnan származó mestertől megtanulta a karakter a fegyver speciális fogásait. Ez részben előtörténet követelmény, amelyet fel kell tüntetni a karakterlapon, másrészt a fegyver Megjegyzés mezőjében szerepel, milyen más, számszerű követelménye van. Bánjunk ezzel a követelménnyel szigorúan! Ha ez nincs meg, a KM dönt, hogy milyen – alacsonyabb – harcértékekkel forgathatja a karakter a fegyvert – már ha egyáltalán...

A fegyverek egyedi fogásaihoz viszont követelmény a [Mesterfegyver fortély](fortelyok.harci/mesterfegyver.md) `2.foka` az adott fegyverre. Ezen speciális fogásokat fortélyok formájában tanulhatja meg a harcos. Leírásukat lásd a [harci fortélyoknál](044_harci_fortelyok.md). Azok a fegyverek számítanak „Speciálisnak”, amelyek komment mezőjében szerepel a `KF` jelölés.

<br />

---
### Puszta kéz

A Puszta kéz kiemelt „fegyver”, hiszen mindig „ott van”. Puszta kézzel viszont bármilyen fegyver ellen meglehetősen kellemetlen harcolni, hiszen nincs mivel távol tartani, fenyegetni az ellenfelet. Ezért a Puszta kéz harcértékei mindenkinek a következők:

```
Puszta kéz:  KÉ:-10,  TÉ:-10,  VÉ:-10
```

---
### Érintő támadás

Ha a cél csupán az ellenfél megérintése – nem sebzés –, akkor ezt könnyebben megteheti a támadó. Támadó Értékére nem jár levonás:

```
Puszta kéz:  KÉ:-10,  TÉ:0,  VÉ:-10
```

<br />

---
### Erőbónusz limit

Általában a fegyverek forgatásakor a karakter [Erő](014_01_tulajdonsagok.md#-er%C5%91) tulajdonsága `1:1` hozzáadódik az `SP` értékhez Sebzéskor - ez az [Erőbónusz](064_02_05_fegyver_sebzes_jellege.md#er%C5%91b%C3%B3nusz-er%C5%91hi%C3%A1ny-er%C5%91b%C3%B3nusz-limit). Azonban egyes fegyvereknél hiába a magas **Erő** Tulajdonság, egy bizonyos értéknél több **Erőbónuszt** nem alkalmazhat a karakter.

🔆 Az egyes fegyvertáblázatokban láthatjuk, hogy mely fegyvereknél érvényesül az Erőbónusz és milyen felső limittel.\
🔆 A számérték a felső maximumot jelzi, a `99`-es érték azt jelzi, hogy az **Erőbónusznak** nincs felső limitje.
⚡ Példa: ha a fegyver Erőbónusz limitje `3`, akkor egy `Erő:+5` Tulajdonságú harcos is csak `+3` bónuszt kap mikor az adott fegyvert forgatja.

→ Bővebben a [Fegyver sebzés jellege fejezetben](064_02_05_fegyver_sebzes_jellege.md#er%C5%91b%C3%B3nusz-er%C5%91hi%C3%A1ny-er%C5%91b%C3%B3nusz-limit).

<br />

---
### Átütés

→ Lásd a [Fegyver sebzés jellege fejezetet](064_02_05_fegyver_sebzes_jellege.md#%C3%A1t%C3%BCt%C3%A9s).

<br />

---
### Fegyverek minősége (Ideája)

Silány munka, vagy messze földön híres fegyverkovács mester remeke - különbséget teszünk köztük.

A minőség a tárgy - ezúttal fegyver - Ideájának erejét is mutatja: mennyire alkalmas arra a célra, amire készítették. A fentiekben semmilyen mágia nem játszik szerepet, pusztán az elkészítés minőségét mutatja. A skála `[-5;+5]` - ez némi harcérték változást is okoz és az **árra** is hatással van.

| Fegyverek minősége | Módosítók                    |    Ár    |
| :----------------: | :--------------------------- | :------: |
|        `-5`        | `KÉ:-5; TÉ,CÉ,VÉ:-10; SP:-5` | `1/13 x` |
|        `-4`        | `KÉ:-4; TÉ,CÉ,VÉ:-8, SP:-4`  | `1/10 x` |
|        `-3`        | `KÉ:-3; TÉ,CÉ,VÉ:-6, SP:-3`  | `1/7 x`  |
|        `-2`        | `KÉ:-2; TÉ,CÉ,VÉ:-4, SP:-2`  | `1/4 x`  |
|        `-1`        | `KÉ:-1; TÉ,CÉ,VÉ:-2, SP:-1`  | `1/2 x`  |
|        `0`         |                              |   `1x`   |
|        `+1`        | `KÉ:+1; TÉ,CÉ,VÉ:+2; SP:+1`  |   `2x`   |
|        `+2`        | `KÉ:+2; TÉ,CÉ,VÉ:+4; SP:+2`  |   `4x`   |
|        `+3`        | `KÉ:+3; TÉ,CÉ,VÉ:+6; SP:+3`  |   `7x`   |
|        `+4`        | `KÉ:+4; TÉ,CÉ,VÉ:+8; SP:+4`  |  `10x`   |
|        `+5`        | `KÉ:+5; TÉ,CÉ,VÉ:+10; SP:+5` |  `13x`   |

#### 🔆 Mágikus fegyverek és a fegyver Ideája

Ökölszabály, hogy a mágikus fegyverbe legfeljebb akkora növelést lehet belefoglalni, amekkora az **Ideájuk** (minőségük). Tehát egy `+2`-es **Ideájú** kardba, maximum `+2`-es mágikus hatást lehet belefoglalni.

---

🔗 [Közelharci fegyverek](068_002_kozelharci_fegyverek.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
