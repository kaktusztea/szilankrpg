## Példaharc

⚡Lássunk egy konkrét összecsapást, hiszen egy példa többet ér több oldal szabályleírásnál is!

### Lord Gustav, Domvik lovagja

```
KÉ: 22 TÉ: 37 VÉ: 51
Fegyver: Hosszú kard  (1 penge)
Sebzés: k20+5 (V/S)  (Erőbónuszzal együtt)
ÉP: 18
Erő: +3
Fájdalomtűrés (7)
  → 4 ponttal csökkennek a TÉ levonások

Vért:
- Láncing (torzó, felkarok, combok, lábszár befedve: 80%)
- Átlagos minőség, Acél

SFÉ: 8 / 13 / 5
MGT: 5 (13 - (2 x 3) + (3 x 2) = 13
+ Vértviselet – 2.fok
```

#### Életerő Pontok (Lord Gustav)

| **\_\_S1\_\_** | **\_\_S2\_\_** | **\_\_S3\_\_** | **\_\_S4\_\_** |
| -------------- | -------------- | -------------- | -------------- |
| `1V`           | `2V`           | `3V`           | `3V`           |
| `1V`           | `2V`           | `3V`           |                |
| `1V`           | `2V`           | `3V`           |                |
| `2V`           | `2V`           | `3V`           |                |
| `2V`           | `3V`           | ✖️✖️           | ✖️✖️           |

#### Harcérték levonások `S` kategóriákban (Lord Gustav)

| **\_\_S1\_\_** | **\_\_S2\_\_** | **\_\_S3\_\_** | **\_\_S4\_\_** |
| :------------: | :------------: | :------------: | :------------: |
|      `-`       |      `0`       |    `TÉ:-3`     |    `TÉ:-6`     |

---
### Tetves, a bérgyilkos

```
KÉ: 15 TÉ: 35 VÉ: 46
Fegyver: Rövidkard (0,5 penge)
Sebzés: k20+2 (V/S)
ÉP: 14
Fájdalomtűrés (6)
 → 3 ponttal csökkennek a TÉ levonások

Vért: -
SFÉ: -
```

#### Életerő Pontok (Tetves)

| **\_\_S1\_\_** | **\_\_S2\_\_** | **\_\_S3\_\_** | **\_\_S4\_\_** |
| -------------- | -------------- | -------------- | -------------- |
| `1V`           | `1V`           | `1V`           | `1V`           |
| `1V`           | `1V`           | `1V`           | `1V`           |
| `1V`           | `1V`           | `1V`           |                |
| `1V`           | `1V`           | ✖️✖️             | ✖️✖️             |
| ✖️✖️             | ✖️✖️             | ✖️✖️             | ✖️✖️             |

#### Harcérték levonások `S` kategóriákban (Tetves)

| **\_\_S1\_\_** | **\_\_S2\_\_** | **\_\_S3\_\_** | **\_\_S4\_\_** |
| :------------: | :------------: | :------------: | :------------: |
|      `-`       |      `-1`      |    `TÉ:-4`     |    `TÉ:-7`     |

<br />

---
---
### Lord Gustav és Tetves részletes összecsapása

Lord Gustav elmélázva sétál ki a könyvtárból, mikor Tetves, a bérgyilkos veti rá magát. Jó pénzt ígértek neki a lovag haláláért. Gustav szerencsére időben észbe kap (**Lopakodás/rejtőzés** vs. **Észlelés** próbát a lovag nyeri) így Tetves csak a [Meglepetés](065_01_harci_helyzetek.md#meglepet%C3%A9s) `Előny+1` TÉ dobásra bónuszát - és az automatikusan nyert kezedeményezést - kapja meg.

🔆 **Megjegyzés**: mivel kettőjük fegyverének mérete közt nincs meg az `1 penge` méretkülönbség, ezért [Pengeméret - Azonos](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---azonos) helyzetben vannak, tehát sikertelen (nem sebző) támadások esetén `2 + k20 tizes része` értékkel csökkentik egymás **Védő Értékét**.

<br />

---
#### Gustav első sebe  (`S1` kategória)

Tetves kétszer dob az `Előny+1` TÉ dobásra bónusza miatt: `4` és `15`. A jobb érték számít: `15`.\
Továbbá Támadó taktikát alkalmaz: `TÉ:+2; VÉ: -4` arányban.

Összesen `35+2+15= 52`, ami pont  meghaladja a lovag `Védő Értékét`: **Talált**!

```
Tetves Sebzés dobás:
  → k20+2  → 20 SP (Vágó)
```

Gustav **Páncéldobást** végez. Teste `80%`-ban van befedve a láncing anyagával, így ha `k10`-en `1-8`-ig dob, akkor a csapás védett területet ért.\
Gustav dob: `6`, így a páncél **SFÉ**-je beszámít.

A lovag `SFÉ`-je vágófegyverek ellen `13`, a végső `SP` így:

```
20-13 = 7 SP
  → -3 ÉP, -4 VÉ
```

A `7 SP` a [Sebzés-táblázat](064_02_06_sebzes.md#sp-%C3%A1tv%C3%A1lt%C3%A1sa-%C3%A9p-sebz%C3%A9sre-%C3%A9s-v%C3%A9-cs%C3%B6kkent%C3%A9sre) alapján `3 ÉP` (❗) sebet és (`-4 VÉ`) csökkenést jelent.

A lovag ezzel a sebesüléssel még az `S1` egészség-kategóriában marad, így `TÉ` büntetést egyelőre nem kap. Ugyanennek a sebnek a hatására egy gyengébb fizikumú (`ÉP: 8`) ember már átcsúszna az `S2` kategóriába.

```
Lord Gustav VÉ: 47
```

<br />

---
#### Gustav második sebe  (`S2` kategória)

Folytatódik a harc, több sikertelen oda-vissza támadás, Gustav nem támad túl jókat és `VÉ`-je közben lecsökken `44`-re. Rosszul mozdul és bekap egy újabb sebet. **Páncéldobása** (`9`) ezúttal sikertelen, a csapás fedetlen területet ért (mondjuk alkar), így az `SFÉ`-je ezúttal nem számít!

```
Tetves Sebzés dobás:
k20+2 → 11 SP (Vágó)
  → -5 ÉP, -6 VÉ
```

Az újabb sebbel Gustav bőven átkerült az `S2` egészség-kategóriába, ahol - magas Fájdalomtűrésének köszönhetően még mindig nincs `TÉ` büntetése.

Aktuális harcértékei: `KÉ: 22, TÉ: 37, VÉ: 38, ÉP: 9`

A helyzet kezd veszélyessé válni: a lovag elvesztett több, mint `14`-et **Védő Értékéből** és **Életerő Pontjainak** felét. Egy újabb seb kategóriába (`S`)  átlépéssel tovább csökkennének harcértékei.

```
Lord Gustav VÉ: 38
```

<br />

---
#### Gustav harmadik sebe  (`S3` kategória)

Bár sikerül sebet ejtenie támadóján (sajnos csak `3 ÉP`-t, ritka szerencsétlen Sebzés dobás volt). A sors nem kedvez a lovagnak, a gyilkos válaszul belevág az oldalába a láncingen keresztül, bordák hasadnak.

```
SP: 19-13 = 6 SP
  → -3 ÉP, -4 VÉ
```

Gustavnak `6 ÉP`-je marad és `S3`-as kategóriába zuhan (itt már `-3 TÉ` büntetés jár), valamint elveszít még `4 VÉ`-t. Eddig összesen `12 ÉP`-t vesztett!

Aktuális harcértékei: `KÉ: 22, TÉ: 34, VÉ: 34, ÉP: 6`

Még csak `S3` kategóriában van, ha `S4`-be kerülne, automatikusan **Fájdalomtűrés** próbát kellene dobnia **Edzettséggel**, hogy ne ájuljon el azonnal. De erre egyelőre még nincs szükség. Gustav helyzete kezd reménytelen lenni, támolyog, még egy közepes seb és vége van.

A játékos bejelenti, hogy a következő körben utolsó esélyként teljes **támadó taktikát** (`+3 TÉ; -6 VÉ`) alkalmaz, ha meg kell halni, tegye azt lovagként!

Nem tudja, de ellenfele – látva elcsigázottságát –, szintén teljes támadó taktikát alkalmaz, hogy következő csapása biztos a túlvilágra küldje prédáját és gyorsan eltűnhessen az éjszakában. Az elgondolás jó... de az istenek ma máshogy akarták.

```
Lord Gustav VÉ: 34
```

<br />

---
#### A gyilkos veszte

Tetves nyeri a kezdeményezést, viszont Támadó dobása csak `1` (összesen: `35`!), ami még így is bőven talál (!) (tekintve, hogy a lovag `VÉ`-je csak `28` a Támadó taktika miatt), viszont sebzésnek `2`-t dob `k20`-on. Mivel `4`-gyel többel ütötte túl ellenfelét, ezért a **Többszörös találatból** további `+3 SP` jár, így a vége: `7 SP`... amit Gustav láncinge pont teljesen felfog (**páncéldobása** sikeres (`3`) volt)!

Tetves kardja lecsusszan az felé dobogó lovag vértjéről, aki visszatámadva... `15`-öt dob támadására. Tetves is elveszített már **Védő Értékéből** a harc során, alaphelyzetben aktuális `VÉ`-je `43`, de most ugye neki is `-6` büntetése van erre (Támadó taktika miatt `42-6=37`)

```
Gustav támadása: 34+19 = 53
  → többszörös találat (3x!): +9 SP
```

```
Gustav sebzése:
  k20 + 5 + 9 = 21 SP
```

Tetvesnek nincs vértje, ezért a `21 SP` teljesen beszámít → `11 ÉP` és `-6 VÉ`. Tetvesnek `3 ÉP`-je marad, majdnem kettészelték!

Míg Gustav 3 sebet (`12 ÉP`) is elviselt és talpon maradt, addig a gyengébb fizikumú Tetves ennyitől már kidől. `3 ÉP`-je maradt, Fájdalomtűrés próbát dob `12` ellen...

```
Fájdalomtűrés (K) + Edzettség (T)  vs.  12 (Nehéz)
```

... de elvéti és eszméletlenül rogy össze, miután értetlenül bámul a hasából kimeredő kardra. Ha nem látják el, szép lassan elvértzik.

A lovag kínkeservesen feltápászkodik, hite, bátorsága és a láncing megmentette az életét. A háttérben vasalt csizmák csattogása hallatszik, az őrjárat érkezik futva, de sok dolguk már nem akad...

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
