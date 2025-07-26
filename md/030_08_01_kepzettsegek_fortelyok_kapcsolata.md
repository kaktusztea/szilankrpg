## Képzettségek és fortélyok kapcsolata

Két módszer létezik: **Bónusz adása** és **Kiterjesztés** (Normál, Erős).

### `1.` Fortély mint bónusz

```
Valamilyen bónuszt ad

1.fok: Jellemzően +2
2.fok: Jellemzően +4
3.fok: Jellemzően +6
...
```

Ebben az esetben az adott fortély megléte nem követelmény, viszont ha megvan, akkor valamilyen - jellemzően statikus -, vagy egyedi bónuszt ad a kapcsolódó képzettségre.

---
### `2.` Képzettségek kiterjesztése Fortélyokkal

Egyes képzettségek az alap tudást lefedő ismeretek keretein túl is "kiterjeszthetőek", egyesek pedig "felszeletelhetőek" tudásterületekre. A [Szabad Fortélyok](042_szabad_fortelyok.md) jellemzője, hogy mind ilyen képzettség-kiterjesztést végeznek, de egyes egyéb fortélyok is képesek erre. Hogy melyek, azok mindig az adott képzettség adatlapján olvashatóak (a KM megkövetelhet egyéb kiterjesztéseket is, ha indokoltnak látja).

A képzettségkiterjesztésnek két módja van: **Normál** és **Erős**. Ez azt fejezi ki, hogy mennyire szigorú a kapcsolat a képzettség és a fortély között. Ha van egy képzettségpróba, amelynek ismeret területe a KM szerint ezen képzettség alá tartozik ÉS lefed egy kapcsolódó Fortélyt, akkor használjuk ezeket a kiterjesztéseket.

### 🔆 Képzettség törzstudása

Amennyiben nincs olyan fortély, amely az adott próba esetén szükséges lenne, kiterjesztené a képzettséget, akkor a szükséges tudás része az alapismeretnek, amit a képzettség felvétele önmagában is lefed. Ilyenkor sima képzettségpróba dobandó az itt leírt megkötések nélkül.

<br />

### 🟩 `2.1` Normál kiterjesztés

Ebben a kapcsolatban a Fortély megléte nem követelmény, de hiánya esetén levonással dobhat a játékos, mivel a törzstudás (a képzettség maga) nem nyújt az adott területen teljeskörű ismeretet.

```
0.fok: -3
1.fok: +0
2.fok: +2
3.fok: +4
...
```

`0.fok:` ha nincs meg a Fortély, akkor `-3` módosítóval dobjuk a képzettségpróbát

`1.fok:` ekkor simán, alapértékkel dobjuk a képzettségpróbát

`2+.fok`: ha több fokú a fortély, akkor minden további foka `+2` bónuszt ad a próbára

### 🟥 `2.2` Erős kiterjesztés

Ekkor a kapcsolat olyan erős a két ismeret között, hogy a fortély követelménnyé válik, amennyiben nincs meg legalább `1.fokon`, akkor a képzettségpróba nem is dobható.

```
0.fok: letilt
1.fok: +0
2.fok: +2
3.fok: +4
...
```

`0.fok:` ha nincs meg a Fortély, akkor az adott próba nem is dobható, automatikusan sikertelen

`1.fok`: ekkor simán, alapértékkel dobjuk a képzettségpróbát

`2+.fok`: ha több fokú a fortély, akkor minden további foka `+2` bónuszt ad a próbára

<br />

---
### 🔆 Speciális: Több fortély terjeszt ki egy képzettséget

Van, hogy egy képzettségpróba esetén nem csak egy, hanem több fortély is szükséges, mint kiterjesztés. Két esetet különböztetünk meg:

#### • Több Normál kiterjesztés hiányzik

A Normál kiterjesztések `-3` büntetései **NEM** additívak. Ha több (Normál kiterjesztésű) fortély kapcsolódik a képzettségpróbához és egyik sincs meg, a büntetés akkor is csak `-3`-ban maximálódik.

#### • Legalább 1 Erős kiterjesztés hiányzik

Ha több fortély terjeszt ki képzettségpróbánál és legalább `1 db` olyan hiányzik, amelyik **Erős kiterjesztésben** van, akkor **az egész próba automatikusan sikertelen** - nem is lehet dobni.

<br />

### 🔆 Speciális: Több fortély bónusza

Amennyiben több fortély terjeszt ki egy képzettséget, akkor az esetleges bónuszok (`2.foktól kezdődően`) közül a legalacsonyabb számít.

Tehát ha például egy képzettséget kiterjeszt
- `A` fortély - `2.fok`
- `B` fortély - `3.fok`

... akkor csak `+2` jár a képzettségpróbára, mivel a `2.fok` (alacsonyabb) bónusza határozza meg a plusz értéket.

<br />

### 🔆 Speciális: Más karakter pótolja a hiányzó kiterjesztő fortélyt

Mikor több fortély terjeszt ki egy képzettséget (mind szükséges az adott probánál), de valamelyik hiányzik, akkor ezt - a szituáció ismeretében a KM bírálata után -  pótolhatja egy másik karakter, így elkerülve a levonást (Normál hiány), vagy az automatikus sikertelen próbát (Erős hiány).

Ilyen, több karakteres képzettségpróbánál a kapcsolódó képzettség és Tulajdonság minimuma számít, azaz annak a résztvevőnek a képzettség-szintje és kapcsolódó Tulajdonsága, akié az alacsonyabb.

<br />

---
### ⚡Példa besegítésre, hiányzó fortély pótlásával

Mechanikus felvonót tervezni egy épületbe
- Nehézség: `18` (Rendkívül Nehéz)
- Kell hozzá: [Kvantikum](kepzettsegek.szekunder/kvantikum.md) képzettség + **Emlékezet** Tulajdonsággal dobjuk a próbát.
- KM dönt: erre az adott esetre az alábbi 2 képzettség kiterjesztő fortély szükséges:
    - [Építészet](fortelyok.altalanos/epiteszet.md) (Erős kiterjesztés Kvantikum felé)
    - [Mechanika](fortelyok.altalanos/mechanika.md) (Erős kiterjesztés Kvantikum felé)
- JK-1: "Kvantikum - `11.szint`", Emlékezet: `+2`. **Építészet** fortélyom van, de **Mechanika** nincs.
- JK-2: De nekem van **Mechanika**! Az én képzettségem: "Kvantikum - `10. szint`". Emlékezet: `+3`
- A két JK együtt megtervezi a felvonót és a beépítés módját
    - Dobás: `10 + 2` (Kvantikum minimum, Emlékezet minimum) + k10  vs  `18`
    - `12 + k10  vs.  18`
    - `6`-os dobástól megvan, az esély `50%`

<br />

---
### ⚡ Példa képzettség kiterjesztésere - hiányzó fortéllyal

Johanius Krad pap egy címert vizsgál a bálterem tükrös falán.

\- JK: "Felismerem ezt a címert?"

\- KM: "Ez egy Nehéz (Célszám: `12`) **Lexikum** képzettségpróba, amit ebben az esetben kiterjeszt a Heraldika Szabad Fortély. Megvan a karakterednek ez a fortély?"

\- JK: "Nincs. A Lexikum képzettségem amúgy `8.szintű`."

\- KM: "A Heraldika fortély **Normál kiterjesztésben** van a Lexikummal, így - bár nincs meg a Heraldika Szabad Fortélyod - így is dobhatsz képzettségpróbát, de csak `-3`-mal. A próbánál az **Emlékezet** Tulajdonságodat használd."

\- JK: "Jó, akkor `+2` (Emlékezet) + `8-3` (Lexikum -3) + `k10`  vs. `12`"

```
7 + k10  vs  12
```
  → Tehát ha legalább `5`-öt dobok `k10`-en, akkor sikerül a próba.

<br />

---
### ⚡ Példa képzettség kiterjesztésere - 2 fortéllyal

Horgas Apó orkok [nyomát fedezte fel](szituaciok/nyomok_nyomkovetes_termeszet.md#nyomok-észrevétele-a-természetben-) a folyóparton és követni szeretné, hova vezetnek.

Ez a klasszikus [Nyomok követése természetben](szituaciok/nyomok_nyomkovetes_termeszet.md#nyomok-követése-a-természetben-) Szituáció.

\- KM: "Mennyi a **Természetjárás** képzettséged és az **Érzékenység** Tulajdonságod? Ezekkel fogsz dobni."

\- JK: "Természetjárás: `7.szint`, Érzékenység: `+2`"

\- KM: "Ehhez a szituációhoz a **Természetjárás** képzettséghez **két** kiterjesztő **Szabad Hátter** kapcsolódik. Ezekkel hogy állsz? Ha nincs meg bármelyik, akkor is dobhatsz, de csak `-3` büntetéssel."
- [Nyomolvasás](fortelyok.altalanos/nyomolvasas.md)
- [Tájtípus: erdős](fortelyok.szabad/tajtipus_erdos.md)

\- JK: "Nyomolvasás: `2.fok`, Tájtípus: erdős: `1.fok`, kimaxoltam."

\- KM: "Remek, mindkét kiterjesztés megvan és kapsz `+2` bónuszt, mert a Nyomolvasás Szabad Háttered nem `1.`, hanem `2.fokú`."\
Összetett képzettségpróba lesz, mert hosszan kell követni a nyomokat. Két próbát kell dobnod:

```
Nehéz: 12
Átlagos: 9
```

\- JK: "OK, az **Átlagos (9)** így már dobás nélkül is megvan. A **Nehéz (12)**-re dobok... megvan!

```
7 + 2 + k10 → 14
```

\- KM: "Rendben, meglátod a következő csizmanyomot, aztán pár letört ágat, némi szőrcsomóval, ami beleakadt. Észak felé, a hegyek irányába haladtok..."

---

🔗 [Fortélyok kiterjesztéslistája](030_08_02_fortelyok_kepzettsegkiterjesztes_listaja.md) →

⚜️ [Nyitóoldal](start.md#3-k%C3%A9pzetts%C3%A9grendszer-)
