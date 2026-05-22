## Képzettségek és fortélyok kapcsolata

Egy fortély egyes képzettség(ek)re **két módon** gyakorolhat hatást:

- **Bónusz adása**
- **Kiterjesztés** (**N**ormál, **E**rős).

---
### `1.` Fortély mint bónusz

```
Valamilyen bónuszt ad

1.fok: jellemzően +2
2.fok: jellemzően +4
3.fok: jellemzően +6
...
```

Ebben az esetben képzettség használatához a kapcsolódó fortély megléte nem követelmény, viszont ha megvan, akkor valamilyen - jellemzően statikus -, vagy egyedi bónuszt ad.

---
### `2.` Képzettségek kiterjesztése Fortélyokkal

Egyes képzettségek az alap tudást lefedő ismeretek keretein túl is "**kiterjeszthetőek**", egyesek pedig "felszeletelhetőek" tudásterületekre. A [Szabad Fortélyok](042_szabad_fortelyok.md) jellemzője, hogy mind ilyen képzettség-kiterjesztést végeznek, de egyes egyéb, "általános" fortélyok is képesek erre. Hogy melyek, azok mindig az adott képzettség adatlapján olvashatóak (a KM megkövetelhet egyéb kiterjesztéseket is, ha indokoltnak látja).

### ⚜️ Mi az a kiterjesztés?

A képzettségkiterjesztésnek két módja van: **Normál** és **Erős**. Ez azt fejezi ki, hogy mennyire szigorú a kapcsolat a képzettség és a fortély között. Ha van egy képzettségpróba, amelynek megkövetelt ismereti területe a KM szerint ezen képzettség alá tartozik ÉS lefed egy kapcsolódó Fortélyt, akkor **kiterjesztésről** beszélünk.

### 🔆 Képzettség törzstudása

Amennyiben nincs olyan fortély, amely az adott próba esetén szükséges lenne, kiterjesztené a képzettséget, akkor a szükséges tudás része az alapismeretnek, amit a képzettség felvétele önmagában is lefed. Ilyenkor sima képzettségpróba dobandó az itt leírt megkötések nélkül.

<br />

### 🟩 `2.1` Normál kiterjesztés

Ebben a kapcsolatban a fortély megléte nem követelmény, de hiánya esetén hátrány dobással próbálkozhat a játékos, mivel a törzstudás (a képzettség maga) nem nyújt az adott területen teljes körű ismeretet.

```
Fortély foka és
 hatása képzettségpróbára

0.fok: Hátrány-2 a dobásra
1.fok: 0 (sima dobás)
2.fok: Előny+1 a dobásra
3.fok: Előny+2 a dobásra
```

### 🟥 `2.2` Erős kiterjesztés

Ekkor a kapcsolat olyan erős a két ismeret között, hogy a fortély követelménnyé válik, amennyiben nincs meg legalább `1.fokon`, akkor a képzettségpróba nem is dobható.

```
Fortély foka és
 hatása képzettségpróbára

0.fok: kudarc, nem is dobhatsz
1.fok: 0 (sima dobás)
2.fok: Előny+1
3.fok: Előny+2
```

<br />

---
### 🔆 Speciális: Több fortély terjeszt ki egy képzettséget

Van, hogy egy képzettségpróba esetén nem csak egy, hanem több fortély is szükséges, mint kiterjesztés. Két esetet különböztetünk meg:

#### • Több Normál kiterjesztés hiányzik

A Normál kiterjesztések `Hátrány-2` büntetése **NEM** halmozódik. Ha több (Normál kiterjesztésű) fortély kapcsolódik a képzettségpróbához és egyik sincs meg, a büntetés akkor is `Hátrány-2` marad.

#### • Legalább 1 Erős kiterjesztés hiányzik

Ha több fortély terjeszt ki egy képzettséget a próba során és **legalább** `1 db` olyan hiányzik, amelyik **Erős kiterjesztésben** van, akkor **az egész próba automatikusan sikertelen** - nem is lehet dobni.

<br />

### 🔆 Speciális: Több fortély bónusza

Amennyiben a fentiek szerint egy szituációban több fortély terjeszt ki egy képzettséget, akkor az esetleges Előny bónuszok (`2.foktól kezdődően`) közül a legalacsonyabb számít. Kivéve, ha az alacsonyabb elérte a maximum fokát. Ilyenkor a magasabb bónusza az irányadó.

Tehát ha például egy képzettséget egy szituációban a KM szerint kiterjeszt
- `A` fortély - `2.fok`
- `B` fortély - `3.fok`

... akkor csak `Előny+1` jár a képzettségpróbára, mivel a `2.fok` (alacsonyabb) bónusza határozza meg az Előny fokozatát.

<br />

---
### ⚡ Példa képzettség kiterjesztésere - hiányzó fortéllyal

Johanius Krad pap egy címert vizsgál a bálterem tükrös falán.

\- JK: "Felismerem ezt a címert?"

\- KM: "Ez egy Nehéz (Célszám: `12`) **Lexikum** képzettségpróba, amit ebben az esetben kiterjeszt a Heraldika Szabad Fortély. Megvan a karakterednek ez a fortély?"

\- JK: "Nincs. A Lexikum képzettségem amúgy `8.szintű`."

\- KM: "A Heraldika fortély **Normál kiterjesztésben** van a Lexikummal, így - bár nincs meg a Heraldika Szabad Fortélyod - így is dobhatsz képzettségpróbát, de `Hátrány-2`-vel. A próbánál az **Emlékezet** Tulajdonságodat használd."

\- JK: "Jó, akkor `+2` (Emlékezet) + `8` (Lexikum) + `k10` (`Hátrány-2`)  vs. `12`"

```
10 + k10 (Hátrány-2)  vs  12
```

  → Tehát `k10`-zel háromszor dobok és a legkisebb számít.

<br />

---
### ⚡ Példa képzettség kiterjesztésere - 2 fortéllyal

Horgas Apó orkok [nyomát fedezte fel](szituaciok/nyomok_nyomkovetes_termeszet.md#nyomok-észrevétele-a-természetben-) a folyóparton és követni szeretné, hova vezetnek.

Ez a klasszikus [Nyomok követése természetben](szituaciok/nyomok_nyomkovetes_termeszet.md#nyomok-követése-a-természetben-) Szituáció.

\- KM: "Mennyi a **Természetjárás** képzettséged és az **Érzékenység** Tulajdonságod? Ezekkel fogsz dobni."

\- JK: "Természetjárás: `6.szint`, Érzékenység: `+1`"

\- KM: "Ehhez a szituációhoz a **Természetjárás** képzettséghez **két** kiterjesztő **Szabad Fortély** kapcsolódik. Ezekkel hogy állsz? Ha nincs meg bármelyik, akkor is dobhatsz, de `Hátrány-2`-vel."
- [Nyomolvasás/eltűntetés](fortelyok.altalanos/nyomolvasas_eltuntetes.md)
- [Tájtípus: erdős](fortelyok.szabad/tajtipus_erdos.md)

\- JK: "Nyomolvasás: `2.fok`, Tájtípus: erdős: `1.fok`, kimaxoltam."

\- KM: "Remek, mindkét kiterjesztés megvan és kapsz `Előny+1` bónuszt, mert a Nyomolvasás/eltűntetés fortélyod nem `1.`, hanem `2.fokú`." A "Tájtípus: erdős" nem korlátozza le a Nyomolvasás/eltűntetés bónuszát, mert nincs magasabb foka, mint `1`.\
Összetett képzettségpróba lesz, mert hosszan kell követni a nyomokat. Két próbát kell dobnod:

```
Nehéz: 12
Átlagos: 9
```

\- JK: "OK, az **Átlagos (9)** így már dobás nélkül is megvan. A **Nehéz (12)**-re dobok... megvan!

```
Alap: 6 + 1 = 7

7 + k10 (Előny+1)  vs  12
→ k10-zel kétszer dobok, nagyobb számít
```

\- KM: "Rendben, meglátod a következő csizmanyomot, aztán pár letört ágat, némi szőrcsomóval, ami beleakadt. Észak felé, a hegyek irányába haladtok..."

---

🔗 [Fortélyok kiterjesztéslistája](030_08_02_fortelyok_kepzettsegkiterjesztes_listaja.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#3-képzettségrendszer-)
