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

A **[Méregkeverés](kepzettsegek.primer.altalanos/meregkeveres.md)** külön képzettség, működését lásd annak leírásában.

---
## A méreg komplexitása

A mérgeket elkészítésük bonyolultsága szerint egy ún. Komplexitással jellemezzük.

A méreg kikeverése **Méregkeverés** képzettpróbához kötött, amelynek célszáma a **Méreg komplexitásával** azonos.

```
Méreg komplexitása =
  + Erősség
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
Ez adja meg, hogy mennyire nehezen áll ellen a szervezet a méregnek, mennyire hatékony. Gyakorlatilag az összetevők "erejétől" függ. A hatékonyabb (esetleg titkos) összetevők ismerete a magas szintű méregkeverés ismérve.

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

```
Hatás max súlyossága

⭕1: Enyhe rosszullét, hányás, alvás
⭕2: Eszmélet: Bódultság Státusz, Görcs
⭕3: Eszmélet: Kábultság Státusz,
     Részleges bénulás
⭕4: Életveszély, Teljes bénulás
⭕5: Halál
```

#### Másodlagos hatás

A mérgeknek lehet ún. **Másodlagos hatása**, amely a sikeres próba esetén következik be. Ennek hatása legfeljebb a rendes hatásnál `1`-el ⭕(`2`-vel???)⭕ alacsonyabb kategóriájú lehet. (Pl. Halál→Életveszély(⭕vagy Bódulat⭕))

<br />

---
### (3) Elállás / Kiürülés

Ez a tétel attól függ, hogy milyen típusú mérget szándékozik készíteni a méregkeverő:

- **Elállás**: kizárólag fegyvermérgek esetén: meddig áll el szabad levegőn/folyadékban?
- **Kiürülés**: minden más méreg típus esetén - mennyi idő alatt ürül ki az áldozat szervezetéből

A "**Méregkeverés X.szint**" ("Mk") az **igényelt biztos tudás** szintjét jelenti.

#### (3a) Elállás

```
Meddig áll el?

0: Pár másodperc
1: 1 perc
2: 10 perc
3: 1 óra, Méregkeverés 3.szint
4: 1 nap, Mk 6.szint
5: 1 hónap, Mk 9.szint
6: Örökké, Mk 12.szint
```

#### (3b) Kiürülés

```
Mennyi idő alatt ürül ki?

0: 1 kör, Mk 3. szint
1: 1 óra, Mk 6. szint
2: 1 nap, Mk 9. szint
3: 1 hét, Mk 12. szint
```

<br />

---
### (4) Hatóidő

```
Milyen gyorsan hat?

+0: (30 perc - 3 óra múlva)
+1: (4 - 23 óra múlva), Mk 3. szint
+1: (2 - 20 perc múlva), Mk 3. szint
+2: (1 - 10 nap múlva), Mk 5. szint
+2: (2 - 6 kör múlva), Mk 5. szint
+3: (2 - 4 hét múlva), Mk 7. szint
+4: Gyorsan (10 szegmens), Mk 7. szint
+4: Hónapok múlva, Mk 9. szint
+5: Azonnal (1 szegmens), Mk 9. szint
+5: Évek múlva, Mk 12. szint
```

<br />

---
### (5) Speciális

```
+2: Plusz 1 komponens
+3: Plusz 1 hordozó közeg
    (étel/ital, légnemű, véráram),
+3: Több hordozó közegből
    csak 1 a méreg hatóanyag,
    a többi természetes alapanyag
+2: Sűrű: kis mennyiség is
    elég 1 adaghoz
+3: Színtelen
+3: Szagtalan/ízetlen (egyben értendő)
+3/+6: Félrevezető tünetek I, II.
    (ennyivel nő az azonosítás nehézsége)
+0: Szabadban sem eloszló légméreg:
    nem nehezebb, de speciális fizikai
    közvetítő kell (füstöt okádó labdacs),
    folyamatos utánpótlással)
```

<br />

---
### Hány adag méreg készíthető?

Ez az alapanyagok beszerezhetőségétől függ. Amennyiben megvan az **Alkímia+Vajákosság** követelmény és az alapanyagok nem rendkívül ritkák, vagy teljesen egyediek, akkor - az ésszerűség határait betartva - bármennyi adag készíthető.

---
### Fajok különbözősége

Alapesetben nem teszünk különbséget, a Méregkeverők tisztában vannak Yn3v leggyakoribb elfszabású teremtményeinek méreggel szembeni tulajdonságaival.

Amennyiben nem hagyományos, ritka fajról van szó, akkor ahhoz a [Különleges faj boncolása](fortelyok.szabad/kulonleges_faj_boncolasa.md) Szabad Fortély megléte szükséges az adott fajra felvéve.

---

🔗 [Méregellenállás próba](142_meregellenallas.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#14-méregrendszer-mérgek)
