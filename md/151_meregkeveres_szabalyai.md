## Méregkeverés szabályai

A mérgeket jelleg szerint négy csoportra bontjuk:
- Étel és italmérgek
- Légimérgek
- Kontaktmérgek
- Fegyvermérgek

A mérgeket összetevő szerint csoportosítva pedig szintén három kategóriába sorolhatjuk:
- állati
- növényi
- ásványi (szervetlen)

A **Méregkeverés** külön képzettség, működését lásd [annak leírásában](kepzettsegek.primer.altalanos/meregkeveres.md).

---
## A méreg szintje

A mérgeket elkészítésük bonyolultsága szerint egy ún. Szinttel jellemzünk.

A méreg kikeverése **Méregkeverés** képzettpróbához kötött, amelynek célszáma a **Méreg szintjével** azonos.

```
Méreg szintje =
    Erősség
  + Súlyosság
  + Elállás
  + Hatóidő
  + Speciális
```

---
### (1) Méreg Erőssége

```
 Méreg erőssége: 1-10
```

A **Méreg erőssége** `(1-10)` intervallumban mozog.\
Ez adja meg, hogy mennyire nehezen áll ellen a szervezet a méregnek, mennyire hatékony. Gyakorlatilag az összetevők „erejétől" függ. A hatékonyabb (esetleg titkos) összetevők ismerete a magas szintű méregkeverés ismérve.

Az `1`-es a leggyengébb, a `10`-es a legerősebb mérgek jellemzője, de tartsuk észben, hogy **az Erősség nem egyenlő a romboló hatással!** Léteznek például nagyon hatékony, `10`-es erősségű altatók is.

#### Plusz adag

Ha a normális adagnál kisebb, vagy nagyobb mennyiséget használunk fel, csökkenhet/megnőhet a méreg erőssége (KM dönt).

**Erősség változása**:
- Kis adag: Erősség `50%`-al csökken (lefele kerekítünk)
- Nagy adag: Erősség: `50%`-al nő (lefele kerekítünk)

Vegyük figyelembe viszont, hogy a hordozó közeg (levegő, fegyver pengéje, stb) legfeljebb mekkora adagot képes tárolni, valamint egyéb nehezítő körülményeket is: például az italméregben nagyobb mennyiségnél nagyon feltűnő lehet a megváltozott íz, stb.

<br />

---
### (2) Hatása súlyossága

````diff
⭕TODO⭕
- Alvás: melyik "Hatás" kategóriába tartozzon?
- Most a legenyhébben van (1), de lehet, hogy nehezebb alvást előidézni, mint pl. bódulatot...?
````

| Hatás max súlyossága                                                                                             | Érték |
| :--------------------------------------------------------------------------------------------------------------- | :---- |
| Enyhe rosszullét, hányás, alvás                                                                                  | ⭕`1`  |
| [Eszmélet: Bódultság Státusz](082_statuszok.md#%EF%B8%8F-eszm%C3%A9let-1-b%C3%B3dults%C3%A1g), Görcs             | ⭕`2`  |
| [Eszmélet: Kábultság Státusz](082_statuszok.md#%EF%B8%8F-eszm%C3%A9let-2-k%C3%A1bults%C3%A1g), Részleges bénulás | ⭕`3`  |
| Életveszély, Teljes bénulás                                                                                      | ⭕`4`  |
| Halál                                                                                                            | ⭕`5`  |

#### Másodlagos hatás

A mérgeknek lehet ún. **Másodlagos hatása**, amely a sikeres próba esetén következik be. Ennek hatása legfeljebb a rendes hatásnál `1`-el ⭕(`2`-vel???)⭕ alacsonyabb kategóriájú lehet. (Pl. Halál→Életveszély(⭕vagy Bódulat⭕))

<br />

---
### (3) Elállás / Kiürülés

Ez a tétel attól függ, hogy milyen típusú mérget szándékozik készíteni a méregkeverő:

- **Elállás**: kizárólag fegyvermérgek esetén: meddig áll el szabad levegőn/folyadékban?
- **Kiürülés**: minden más méreg típus esetén - mennyi idő alatt ürül ki az áldozat szervezetéből

#### (3a) Elállás

| Meddig áll el? | Érték | Méregkeverés követelmény |
|:-------------- |:-----:|:------------------------:|
| Pár másodperc  |  `0`  |            -             |
| `1 perc`       |  `1`  |            -             |
| `10 perc`      |  `2`  |            -             |
| `1 óra`        |  `3`  |        `3.szint`         |
| `1 nap`        |  `4`  |        `6.szint`         |
| `1 hónap`      |  `5`  |        `9.szint`         |
| Örökké         |  `6`  |        `12.szint`        |

#### (3b) Kiürülés

| Mennyi idő alatt ürül ki | Érték | Méregkeverés követelmény |
|:------------------------ |:-----:|:------------------------:|
| `1 kör`                  |  `0`  |        `3.szint`         |
| `1 óra`                  |  `1`  |        `6.szint`         |
| `1 nap`                  |  `2`  |        `9.szint`         |
| `1 hét`                  |  `3`  |        `12.szint`        |

<br />

---
### (4) Hatóidő

| Milyen gyorsan hat?       | Érték | Méregkeverés követelmény |
| :------------------------ | :---: | :----------------------: |
| `30 perc` - `3 óra` múlva | `+0`  |           `-`            |
| `4 - 23 óra` múlva        | `+1`  |        `3.szint`         |
| `2-20 perc` múlva         | `+1`  |        `3.szint`         |
| `1-10 nap` múlva          | `+2`  |        `5.szint`         |
| `2-6 kör` múlva           | `+2`  |        `5.szint`         |
| `2-4 hét` múlva           | `+3`  |        `7.szint`         |
| Gyorsan (`10 szegmens`)   | `+4`  |        `7.szint`         |
| Hónapok múlva             | `+4`  |        `9.szint`         |
| Azonnal (`1 szegmens`)    | `+5`  |        `9.szint`         |
| Évek múlva                | `+5`  |        `12.szint`        |

<br />

---
### (5) Speciális

- Több komponensű: minden újabb komponensre bontás: `+2`
- Több hordozó közeg (étel/ital, légnemű, véráramban ható): plusz hordozónként `+3`
- Több hordozó közegből csak `1` amiben hatóanyag van, a többi természetes alapanyag: `+3`
- Sűrű: ha egészen kis mennyiség is elég 1 adaghoz: `+2`
- Színtelen: `+3`
- Szagtalan/ízetlen: `+3` (egyben értendő)
- Félrevezető tünetek: `+3/+6` (két lépcső lehetséges, ennyivel nő a méreg azonosítás nehézsége)
- Szabadban sem eloszló légméreg: itt nincs Nehézség módosító, hanem olyan fizikai közvetítő kell, ami ezt megoldja: egy labdacs, ami látványosan okádja a füstöt - folyamatos utánpótlást adva.

<br />

---
### Hány adag méreg készíthető?

Ez az alapanyagok beszerezhetőségétől függ. Amennyiben megvan az **Alkímia+Vajákosság** követelmény és az alapanyagok nem rendkívül ritkák, vagy teljesen egyediek, akkor - az ésszerűség határait betartva - bármennyi adag készíthető.

---
### Fajok különbözősége

Alapesetben nem teszünk különbséget, a Méregkeverők tisztában vannak Yn3v leggyakoribb elfszabású teremtményeinek méreggel szembeni tulajdonságaival.

Amennyiben nem hagyományos, ritka fajról van szó, akkor ahhoz a [Különleges faj boncolása](fortelyok.szabad/kulonleges_faj_boncolasa.md) Szabad Fortély megléte szükséges az adott fajra felvéve.

---

🔗 [Méregellenállás próba](152_meregellenallas.md) →

⚜️ [Nyitóoldal](start.md#15-m%C3%A9regrendszer-m%C3%A9rgek)
