## Manőver végbevitelének lépései

A játékos a kör elején bejelenti, hogy Manővert akar alkalmazni és azt is, hogy melyiket. Ezután a karakterek Kezdeményezést dobnak (kivéve pl. a **Meglepetés** szituációt), majd mikor az alkalmazóra kerül a sor, jön a Manőver.

Ha a KM úgy látja jónak, megtilthatja adott szituációban a Manőver alkalmazását. Amennyiben a játékos ezt a döntést nem képes kulturáltan kezelni, a KM növelje intenzíven a Manőver nehézségét...

Minden **Manővernek** lehetnek egyéni, speciális követelményei, ezek a saját leírásuknál találhatóak meg.

Egy Manőver alkalmazása az alábbi három - opcionális - alapfázisból állhat. Hogy melyikre van szükség, azt az adott Manőver leírásánál találjuk. Ha minden szükséfes fázis sikeres, akkor a Manőver is sikeres. Végrehajtásuk sorrendjében:

<br />

#### `1.` Megakasztás

Az **Ellenfél** teszi. Sima (extra) támadás, ami ha talál, a Manőver automatikusan sikertelen.

#### `2.` Végrehajtás

Manővert végző teszi aktuális, fegyveres `TÉ` értékkel. Sikeréhez sebzést érő támadás szükséges `TÉ:+4` módosítóval, de nem okoz sebet. Ha a támadás sikertelen, a Manőver is. Azért dobjuk ezt az Ellenpróba előtt, mert ez ad gyorsabban eredményt 🔆

#### `3.` Ellenpróba

Manővert végző teszi. `Próbadobás vs Célszám`

---
## ⚜️`1.` Megakasztás (M)

A Megakasztás az első fázis a Manőver végrehajtása során.\
Megelőző támadási forma, melyre **az Ellenfél** jogosult teljes, fegyveres `TÉ` harcértékével. Ez egy soron kívüli extra támadás, nem hat rá a támadások számából adódó levonás sem. **Csak akkor** szükséges, ha az adott típusú manőver fázisai között ez (`M`) szerepel.

Ha a Megakasztás találatot ér el (nem kell, hogy valós sebzést is okozzon), akkor **a Manőver nem sikerült**. Tipikus példa manőver a [Belharcba kerülés](066_06_belharcos_manoverek.md#belharcba-kerülés).

🔆 Ez a támadás a hagyományos módon sebezni is képes.

🔆 Ha a Megakasztás sikertelen, **NEM** ❗ okoz `VÉ` csökkentést (mint egy sima sikertelen támadás).

<br />

---
## ⚜️`2.` Végrehajtás (V)

```
(TÉ +4 + k20)  vs  VÉ
```

Nem más, mint egy támadás az aktuális, **fegyveres TÉ** értékeddel, melyhez `TÉ:+4` módosító járul. Ha ez a támadás sikeres, akkor jöhet az Ellenpróba fázis (ha szükséges). Ne feledjük, hogy a `TÉ` értékébe beleszámít az esetleges több támadás levonás is (`-4`), amennyiben nem az első támadás!

Ha a **Végrehajtás** sikertelen, akkor a helyzet talán megvolt, de nem sikerült kihasználni.

<br />

---
## ⚜️`3.` Ellenpróba (E)

```
Manőver Alap + k10

       vs

Manőver Célszám =
 + Manőver Alap (Ellenfél)
 + Manőver Nehézség
```

### 🔆 Ellenpróba Dobás extra módosítói

```
+1 / Manőver pont
  (max 4 költhető)

+2 / Belharc fortély fok
  (csak belharcos manővereknél)

[-2; +2] Testméret különbség
[-2; +2] Páncél különbség

Hátrány-1
  Eszmélet: Bódultság Státus
Hátrány-2
  Eszmélet: Kábultság Státus
```

### 🔆Manőver Célszám extra módosítói

```
+1 / Manőver Pont (ellenfél)
  (max 2 költhető)

+2 / Belharc fortély fok (ellenfél)
  (csak belharcos manővereknél)

+2: Újrapróbálkozás
  → az ellenfél már számít rá

[-5;+5]
  KM által megadott +/- érték.
  Körülmény függő könnyítés / nehezítés.

+3: Manőver követelményei
    nem teljesülnek támadó számára
```

Az **Ellenpróba** azt modellezi, hogy a karakter képes-e megteremteni maga számára a lehetőséget, úgymond "megágyazni magának", hogy megkísérelhesse a **Manővert**. A harcban ez helyezkedést, "pozícióba kerülést" jelent, amelynek sikere függ a karakter és ellenfelének **Manőver Alapjától**, a Manőver **Nehézségétől** és egyéb módosító körülményektől. A játékban logikailag az **Ellenpróbának** kéne előbb jönnie, de mivel a **Végrehajtás** gyorsabban számolható, azt dobjuk előbb (ha van).

Az **Ellenpróba** dobása során a KM meghatározza a próba **Célszámát**, a játékos, pedig veszi [Manőver Alapját](066_01_manover_alap.md), esetlegesen felhasznál [Manőver Pontokat](066_02_manover_pontok.md), majd dob hozzá `k10`-el. Ha a végső érték eléri a célszámot, akkor az **Ellenpróba** **sikeres volt.**

Ha csak az **Ellenpróba** az adott Manőver követelménye, akkor annak sikere esetén az egész **Manőver** automatikusan sikeresnek tekinthető.

### Manőver Pontok

Opcionális felhasználásukkal mindkét fél növelheti esélyeit: a támadó fél az **Ellenpróba** dobásához adhat bónusz pontokat, a védekező a Manőver Célszámát növelheti ugyanígy. Támadó oldalán egy manőverre maximum `4 MP`, védő oldalon `2 MP` használható fel és ezt előre be kell jelenteniük - még a dobások előtt.

Manőver Pontokat a **Védő Értékkel** együtt, azonos zavartalan pihenési körülmények között lehet visszanyerni.

---
## Általános szabályok

### Manőver Végbevitel-követelmény

A Manőverek végrehajtásával bárki próbálkozhat, akkor is, ha az adott Manővernél leírt **Végbevitel-követelményeket** nem teljesíti. Ilyenkor `+3` büntetés jár az **Ellenpróba** Célszámára.

### Újrapróbálkozás

A Manőver ha sikeres volt, ha nem – az Ellenfél legközelebb már számít az ilyen jellegű támadásra, ezért amennyiben ismét ezt a Manővert kísérli meg az alkalmazó, akkor az **Ellenpróba** során a célszám már `+2`-vel nőni fog. Ez a büntetés **nem** halmozódik.

A fenti módosító akkor is megjelenhet, ha az Ellenfél az alkalmazót már látta korábban küzdeni és egy konkrét Manővert gyakran alkalmazni. KM dönt.

### Körülmények

A KM a körülményektől és szituációtól függően adhat pozitív/negatív célszám módosítót `[+5;-5]` értékhatáron belül. Sőt, a KM dönthet úgy, hogy a feltételei adottak, nincs szükség Ellenpróbára. További módosítókkal lásd a fenti táblázatokban.

### Sikertelen Manőver és VÉ csökkentés

A sikertelen Manőver ugyanúgy és ugyanakkora **VÉ csökkentést** okoz, mintha egy sima sikertelen támadás történt volna.

---

🔗 [Általános Manőverek listája](066_05_altalanos_manoverek.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
