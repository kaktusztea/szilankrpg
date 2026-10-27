## Méreggenerátor

A Szilánk rendszerében - a [Fegyvergenerátorhoz](068_10_fegyvergenerator.md) hasonlóan a mérgek előállítása is determinisztikus, generált módon történik. Minden a [Példamérgek](148_peldamergek.md) fejezetben található vegyület az itt lent leírt mechanikával készült. Amennyiben a játékhoz nem találod elegendőnek az ott bemutatott mérgeket, nyugodtan alkothatsz újat a generátorral.

Előfordul, hogy a képzetlen karakter egy vajákos boltjába tér be, ahol elsorolja az elkészíttetni kívánt méreg tulajdonságait. Ez esetben a bolt tulajdonosának kell - a leírtaknak megfelelően - összeállítania a komponenseket és dobnia a képzettségpróbát. Előfordulhat az is, hogy a kért kombináció meghaladja az illető tudását.

<br />

## Méreg kikeverése → Képzettségpróba: [Mérgek](kepzettsegek.primer/altalanos/mergek.md) + Intelligencia

```
Nehézség = Méreg Komplexitása
```

A **dobás rejtett**, tehát a játékos csak a méreg alkalmazásakor szembesül az esetleges balsikerrel (nem hat a szer).

Rendkívül magas Komplexitású mérgek esetén már narratív bónuszok megszerzése is indokolt lehet. Mágikus/szakrális rituálék, együttállások, varázstárgyak, ereklyék, esetleg szimpatikus mágiával megtámogatva a célpont vére, haja - ezek "Helyzetfüggő módosító" bónuszt adhatnak a képzettségpróbánál.

<br />

## Méreg jelleg csoportok

- Étel és italmérgek
- Légimérgek
- Kontaktmérgek
- Fegyvermérgek

## Méreg összetevő csoportok

- állati
- növényi
- ásványi (szervetlen)

Beszerzésüknek [Alkímia+Vajákosság képzettség követelménye](142_mereg_alapanyagok_beszerzese.md) van.

<br />

---
## Méreg komplexitása

A mérgeket elkészítésük bonyolultsága szerint egy ún. Komplexitással jellemezzük.

A méreg kikeverése **[Mérgek](kepzettsegek.primer/altalanos/mergek.md)** képzettségpróbához kötött, amelynek Nehézsége a **Méreg komplexitásával** azonos.

```
Méreg komplexitása =
  + (1) Erősség
  + (2) Súlyosság
  + (3) Hatáskezdet
  + (4) Hatástartam
  + (5) Bomlási idő
  + (6) Kimutatási idő
  + (7) Elállás
  + (8) Speciális
```

### (1) Méreg Erőssége

```
 Méreg erőssége: [1-10]
```

Ez adja meg, hogy mennyire nehezen áll ellen a szervezet a méregnek, mennyire hatékony. Gyakorlatilag az összetevők "erejétől" függ. A hatékonyabb (esetleg titkos) összetevők ismerete a magas szintű méregkeverés ismérve.

Az `1`-es a leggyengébb, a `10`-es a legerősebb mérgek jellemzője, de tartsuk észben, hogy **az Erősség nem egyenlő a romboló hatással!** Léteznek például nagyon hatékony, `10`-es erősségű altatók is.

Ha a normális adagnál kisebb, vagy nagyobb mennyiséget használunk fel, csökkenhet/megnőhet a méreg erőssége (KM dönt).

#### Adag

```
 0: Normál adag
-1: Kis adag
    Méregérzékelés próba: -1 büntetés
+1: Nagy adag
    Méregérzékelés próba: +1 bónusz
```

Vegyük figyelembe, hogy a hordozó közeg (levegő, fegyver pengéje, stb) legfeljebb mekkora adagot képes tárolni, valamint egyéb nehezítő körülményeket is: például az italméregben nagyobb mennyiségnél nagyon feltűnő lehet a megváltozott íz, stb.

<br />

---
### (2) Súlyosság

```
Hatás maximális súlyossága

1: Enyhe rosszullét, hányás
   Fájdalom(9) → Státusz: Fizikai(1)Fáradtság
2: Eszmélet: Bódultság Státusz, Görcs
   Fájdalom(12) → Státusz: Fizikai(2)Kimerültség
3: Eszmélet: Kábultság Státusz,
   Részleges bénulás
   Fájdalom(15) → Státusz: Fizikai(2)Kimerültség
4: Életveszély, Alvás, Teljes bénulás
   Fájdalom(18) → Státusz: Fizikai(2)Kimerültség
5: Halál
   Fájdalom(21) → Státusz: Fizikai(3)Elcsigázottság
```

#### Másodlagos hatás

Sikeres [Méregellenállás próba](144_meregellenallas_proba.md) esetén is lehet egy méregnek (másodlagos) hatása.\
Az ilyen tulajdonság szintén Komplexitást emel.

```
+0: nincs másodlagos hatás
+2: 2 fokkal enyhébb Súlyosság
+4: 1 fokkal enyhébb Súlyosság
```
⚡ Példa: `+4` Komplexitásért cserébe egy halálos méreg is Életveszélyes állapotot okoz - sikeres próba esetén is.

<br />

---
### (3) Hatáskezdet

```
Bevitel után mennyi idő után hat?

+2: harc végén         Mk 5. szint
+4: Következő körben   Mk 7. szint
+5: Azonnal            Mk 9. szint

+1: 1 jelenet után (harcon kívül)
+0: néhány óra múlva
+1: 1 napon belül
+2: 1 héten belül         Mk 5. szint

+3: 1 holdfordulón belül  Mk 7. szint
+4: Hónapok múlva         Mk 9. szint
+5: Évek múlva            Mk 12. szint

Mk: Mérgek biztos tudás követelmény
```

<br />

---
### (4) Hatástartam

Az aktiválódás után meddig tart a szer hatása.

```
+0: 1 kör
+1: 2 kör
+2: harc végéig;
    rövid jelenet (harcon kívül)
+3: pár óra (harcon kívül)
+5: hónapok
    (Kimutatási idő egyezzen!)
```

<br />

---
### (5) Bomlási idő

Meddig áll el szabad levegőn / folyadékban / pengén kibontás után?

```
0: Pár másodperc
1: 1 perc
2: 10 perc
3: 1 óra
4: 1 nap,   Mk 6.szint
5: 1 hónap, Mk 9.szint
6: Örökké,  Mk 12.szint

Mk: Mérgek biztos tudás követelmény
```

#### Több komponensű méreg

```
E = Első komponens beadásának ideje
U = Utolsó komponens beadásának ideje

Bomlási idő >=
    (U és E közti idő) +
    Hatáskezdet
```

Ha egy méreg [több komponensből áll](#8-speciális), amelyeket időben elnyújtva kell beadni, akkor a Bomlási idő **nem lehet kisebb**, mint ami az első és az utolsó komponens beadása közt eltelt időt, plusz a [Hatáskezdet](#3-hatáskezdet) késleltetése.

Magyarázat: a korábban beadott komponenseknek a szervezetben (vagy a hordozóban) ki kell tartaniuk, amíg a méreg összeáll és hatni kezd - különben külön-külön lebomlanak, mielőtt a hatás beindulna. Így a magas költségű **Bomlási időt** nem lehet egy gyorsan ható, utolsó komponensre "terhelve" megspórolni.

Ez akkor is igaz, ha a komponensek egyenként ártalmatlanok, és csak együtt hatnak.

<br />

---
### (6) Kimutatási idő

Eddig kimutatható a szer - a Hatástartam lejárta után.

```
0: 1 nap
2: fél nap
3: 1 óra;                   Mk 6.szint
4: Hatás lejárta után nem;  Mk 9.szint

Mk: Mérgek biztos tudás követelmény
```

<br />

---
### (7) Elállás

Lezárt állapotban (fiolában, tablettában, stb) eddig áll el.

```
0: 1 holdfordulón belül
2: 1-2 év
4: örökké
```

<br />

---
### (8) Speciális



```
+2: Plusz 1 komponens
+3: Plusz 1 hordozó közeg
    (étel/ital, légnemű, véráram)
+3: Több hordozó közeg, egyenként egyik
    sem mérgező - csak együtt.
    A szervezetben összeállva hatnak.
```

```
+2: Sűrű: kis mennyiség is elég 1 adaghoz
+3: Színtelen
+3: Szagtalan/ízetlen (egyben értendő)
```

```
+3: Félrevezető tünetek 3
    (ennyivel nő az azonosítás nehézsége)
+6: Félrevezető tünetek 6
    (ennyivel nő az azonosítás nehézsége)

+0: Szabadban sem eloszló légméreg:
    nem nehezebb, de speciális fizikai
    közvetítő kell (füstöt okádó labdacs),
    folyamatos utánpótlással
```

<br />

---
### Hány adag méreg készíthető?

Az alapanyagok beszerezhetőségétől függ. Ha megvan az [Alkímia+Vajákosság követelmény](142_mereg_alapanyagok_beszerzese.md) és az alapanyagok nem rendkívül ritkák, vagy teljesen egyediek, akkor - az ésszerűség határait betartva - bármennyi adag készíthető.

---
### Fajok különbözősége

Alapesetben nem teszünk különbséget, a Méregkeverők tisztában vannak a világ leggyakoribb elfszabású teremtményeinek méreggel szemben álló tulajdonságaival.

→ Szabad Fortély: [Különleges faj boncolása](fortelyok.szabad/kulonleges_faj_boncolasa.md) szükséges, ha ritka fajról van szó - az adott fajra felvéve.

---
### Elkészítés ideje

`1` jelenet, ami nem kötött időtartam, KM dönt.\
Lehetnek órák, de napok, hetek is.

### Ár

A méreg elkészítéséhez szükséges alapanyagok, extra felszerelés árát a KM döntse el becsléssel, vagy a kaland szempontjából fontos szempontok alapján.

---

🔗 [Méreg alapanyagok beszerzése](142_mereg_alapanyagok_beszerzese.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#14-méregrendszer)
