## Példaharc

⚡Lássunk egy konkrét összecsapást, hiszen egy példa többet ér több oldal szabályleírásnál is!

### Lord Gustav, Domvik lovagja

```
KÉ: 12 TÉ: 37 VÉ: 54
ÉP: 18
Erő: +3

Fegyver: Hosszú kard  (1 penge)
Sebzés: k20+5 (V/S)  (Erőbónuszzal együtt)

Fájdalomtűrés (7)
  → -4 a TÉ levonásokra

Vért (80% lefedettség)
- Láncing (torzó + 3 (felkarok, combok, lábszár))
- Átlagos minőség, Acél

SFÉ: 8 / 13 / 5
MGT: 10 = 7 + (3 x 1)
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

```
TÉ levonás összes

S1:    -
S2:    -
S3:  -3 TÉ
S4:  -6 TÉ
```

---
### Tetves, a bérgyilkos

```
KÉ: 10 TÉ: 35 VÉ: 52
ÉP: 14

Fegyver: Rövidkard (0.5 penge)
Sebzés: k20+2 (V/S)

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

```
TÉ levonás összes

S1:    -
S2:    -
S3:  -4 TÉ
S4:  -7 TÉ
```

<br />

---
---
## Lord Gustav és Tetves részletes összecsapása

Lord Gustav elmélázva sétál ki a könyvtárból, mikor Tetves, a bérgyilkos veti rá magát. Jó pénzt ígértek neki a lovag haláláért. Gustav szerencsére időben észbe kap (**Lopakodás/rejtőzés** vs. **Észlelés** próbát a lovag nyeri) így Tetves csak a [Meglepetés](065_01_harci_helyzetek.md#meglepet%C3%A9s) `Előny+1` TÉ dobásra bónuszát - és az automatikusan nyert kezedeményezést - kapja meg.

🔆 **Előnyös/Hátrányos helyzet**: mivel kettőjük fegyverének mérete közt nincs meg az `1 penge` méretkülönbség, ezért [Pengeméret - Azonos](065_01_harci_helyzetek.md#fegyverm%C3%A9ret---azonos) helyzetben vannak, tehát sikertelen (nem sebző) támadások esetén `2 + k20T` értékkel csökkentik egymás **Védő Értékét**.

<br />

---
### Gustav első sebe  (`S1` kategória)

Tetvesnek a Meglepetés harci helyzet miatt **TÉ dobásra** `Előny+1` bónusza van, tehát kétszer dob:

```
TÉ dobás: 4 és 17
 → jobb számít: 17

Max Támadó taktika
 → TÉ:+3; VÉ: -6

Teljes TÉ
 → 35 + 3 + 17 = 55
```

A `TÉ: 55` pont meghaladja a lovag `Védő Értékét (44)`: **Talált**!

```
Tetves Sebzés dobás:
  → k20(13) + 2(fegyver)
  → 15 SP (Szúró)
```

Gustav **Páncéldobást** végez. Teste `80%`-ban van befedve a láncing anyagával, így ha `k10`-en `1-8`-ig dob, akkor a csapás védett területet ért.\
Gustav dob: `6`, így a páncél **SFÉ**-je beszámít.

A lovag `SFÉ`-je szúrófegyverek ellen `8`, a végső `SP` így:

```
15-8 = 7 SP
  → -3 ÉP, -4 VÉ
```

A `7 SP` a [Sebzés-táblázat](064_02_06_sebzes.md#sp-%C3%A1tv%C3%A1lt%C3%A1sa-%C3%A9p-sebz%C3%A9sre-%C3%A9s-v%C3%A9-cs%C3%B6kkent%C3%A9sre) alapján `3 ÉP` (❗) sebet és (`-4 VÉ`) csökkenést jelent.

A lovag ezzel a sebesüléssel még az `S1` egészség-kategóriában marad, így `TÉ` büntetést egyelőre nem kap. Ugyanennek a sebnek a hatására egy gyengébb fizikumú (`ÉP: 8`) ember már átcsúszna az `S2` kategóriába.

```
Lord Gustav

TÉ: 37
VÉ: 50
ÉP: 15
```

<br />

---
### Gustav második sebe  (`S2` kategória)

Folytatódik a harc, több sikertelen oda-vissza támadás, Gustav nem támad túl jókat és `VÉ`-je közben lecsökken `46`-re. Rosszul mozdul és bekap egy újabb sebet. **Páncéldobása** (`9`) ezúttal sikertelen, a csapás fedetlen területet ért (mondjuk alkar), így az `SFÉ`-je ezúttal nem számít!

```
Tetves Sebzés dobás:
k20+2 → 11 SP (Szúró)
  → -5 ÉP, -6 VÉ
```

Az újabb sebbel Gustav bőven átkerült az `S2` egészség-kategóriába, ahol - magas Fájdalomtűrésének köszönhetően még mindig nincs `TÉ` büntetése.

A helyzet kezd veszélyessé válni: a lovag elvesztett több, mint `14`-et **Védő Értékéből** és **Életerő Pontjainak** felét. Egy újabb seb kategóriába (`S`)  átlépéssel tovább csökkennének harcértékei.

```
Lord Gustav

TÉ: 37
VÉ: 40
ÉP: 9
```

<br />

---
### Gustav harmadik sebe  (`S3` kategória)

Bár sikerül sebet ejtenie támadóján (sajnos csak `3 ÉP`-t, ritka szerencsétlen Sebzés dobás volt). A sors nem kedvez a lovagnak, a gyilkos válaszul belevág az oldalába a láncingen keresztül, bordák hasadnak. A csapás hatalmas (`14 SP`), de a láncing rengeteget (`8`) felfog.

```
Tetves Sebzés dobás:
SP: 14(dobás) - 8(SFÉ) = 6 SP
    → -3 ÉP, -4 VÉ
```

Gustavnak `6 ÉP`-je marad és `S3`-as kategóriába zuhan (itt már `-3 TÉ` büntetés jár), valamint elveszít még `4 VÉ`-t. Eddig összesen `12 ÉP`-t vesztett!

```
Lord Gustav

TÉ: 34
VÉ: 36
ÉP: 6
```

Még csak `S3` kategóriában van, ha `S4`-be kerülne, automatikusan **Fájdalomtűrés** próbát kellene dobnia **Edzettséggel**, hogy ne ájuljon el azonnal. De erre egyelőre még nincs szükség. Gustav helyzete kezd reménytelen lenni, támolyog, még egy közepes seb és vége van.

A játékos bejelenti, hogy a következő körben utolsó esélyként Gustav teljes **támadó taktikát** (`+3 TÉ; -6 VÉ`) alkalmaz, ha meg kell halni, tegye azt lovagként!

Nem tudja, de ellenfele – látva elcsigázottságát –, szintén teljes támadó taktikát alkalmaz, hogy következő csapása biztos a túlvilágra küldje prédáját és gyorsan eltűnhessen az éjszakában. Az elgondolás jó... de az istenek ma máshogy akarták.

```
Lord Gustav VÉ: 34
```

<br />

---
### A gyilkos veszte

Tetves nyeri a kezdeményezést, viszont **Támadó dobása** csak `3` (összesen: `38`!), ami még így is bőven talál (!) (tekintve, hogy a lovag `VÉ`-je csak `34` a Támadó taktika miatt), viszont sebzésnek `2`-t dob `k20`-on. Mivel `4`-gyel többel ütötte túl ellenfelét, ezért a **Többszörös találatból** további `+3 SP` jár, így a vége: `7 SP`... amit Gustav láncinge (`Szúró SFÉ:8`) pont teljesen felfog (**páncéldobása** sikeres (`3`) volt)!

```
TÉ = 38 (35+3)
Tetves Sebzés dobás:
 → k20(2) + 1(tőr) + 4
 → 7 SP
```

Tetves kardja lecsusszan az felé dobogó lovag vértjéről, aki visszatámadva... `15`-öt dob támadására. Tetves is elveszített már **Védő Értékéből** a harc során, alaphelyzetben aktuális `VÉ`-je `40`, de most ugye neki is `-6` büntetése van erre (Támadó taktika miatt `40-6=33`)

```
Gustav támadása: 34+19 = 53
  → többszörös találat: 3x3= +9 SP
  → a `3x` a lehetséges maximum
```

```
Gustav sebzése:
  → k20(7) + 5 + 9
  → 21 SP
```

Tetvesnek nincs vértje, ezért a `21 SP` teljesen beszámít → `11 ÉP` és `-6 VÉ`. Tetvesnek `3 ÉP`-je marad, majdnem kettészelték!

Míg Gustav 3 sebet (`11 ÉP`) is elviselt és talpon maradt, addig a gyengébb fizikumú Tetves ennyitől már kidől. `3 ÉP`-je maradt, Fájdalomtűrés próbát dob `12` ellen...

```
Fájdalomtűrés (K) + Edzettség (T)
           vs.
       12 (Nehéz)
```

... de elvéti és eszméletlenül rogy össze, miután értetlenül bámul a hasából kimeredő kardra. Ha nem látják el, szép lassan elvérzik.

A lovag kínkeservesen feltápászkodik, hite, bátorsága és a láncing megmentette az életét. A háttérben vasalt csizmák csattogása hallatszik, az őrjárat érkezik futva, de sok dolguk már nem akad...

---

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
