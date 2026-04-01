## `KÉ`, `TÉ`, `VÉ`, `CÉ`

## Harcértékek felépítése

A karaktert a harcban harcértékei jellemzik. Ezek mutatják meg, hogy mennyire képzett a küzdelem egyes területein. Alapvetően négy, összesített érték határozza meg az aktuális harcértékeket, melyek szituációtól, forgatott fegyvertől, illetve harcmodortól függően változhatnak. Ezek az alábbiak:

```
KÉ: Kezdeményező Érték
TÉ: Támadó Érték
VÉ: Védő Érték
CÉ: Célzó Érték
```

A fenti értékek hat jellemzőből épülnek fel:

```
→ Harcérték Alap
→ Tulajdonságok
→ Harcérték Módosító
→ Harcmodor képzettség
→ Mesterfegyver fortély
→ Fegyver harcértékei
```

Az alábbiakban részletesen kifejtjük a `4` harcérték kiszámítási módját, valamint hogy mi és hogyan képes még módosítani őket.

---
### Harcérték Alapok

Az `1.` Tapasztalati szinten minden karakter egységes, konstans értékeket kap `KÉ`, `TÉ`, `VÉ` és `CÉ` értékére. Ehhez az alapértékhez adódnak majd hozzá az egyéb módosítók.

```
  0: KÉ konstans
 10: TÉ konstans
 30: VÉ konstans
-15: CÉ konstans
```

<br />

---
### Kezdeményező érték (`KÉ`)

A Kezdeményező Érték (`KÉ`) szerepe a harcban, hogy meghatározza, ki "mozdul először" a harcban. Nem jelent harci dominanciát, csak azt, hogy ki a gyorsabb, ki cselekedhet előbb. A kezdeményezés műveletéről bővebben lásd a [Harc menete - Kezdeményezés](064_02_01_kezdemenyezes.md) fejezetet!

A `KÉ` egy darab, konkrét érték, ezt használjuk **minden** típusú cselekedet esetén. Nem tér el harcban, vagy varázslásban, az egyes fegyvereknek **sincs** saját Kezdeményező Értékük! A következőképpen kerül kiszámításra:

```
🗡️ Kezdeményező Érték meghatározása

+ Konstans: 0
    Minden karakternek
+ Gyorsaság
    A karakter Gyorsaság Tulajdonsága
+ Intelligencia
    A karakter Intelligencia Tulajdonsága
+ Szint
    A karakter Tapasztalati szintje
+ Speciális
  - Gyors Kezdeményezés fortély KÉ bónusza
  - Szituációkból adódó módosítók
  - Mágia hatására kapott módosító
```

<br />

---
### Támadó Érték (`TÉ`)

A Támadó Érték szimbolizálja a harcos azon tulajdonságát, hogy az adott fegyverrel, az adott harcmodorban milyen hatékonyan képes ellenfele irányában támadást, támadásokat intézni.

```
🗡️ Támadó Érték meghatározása

+ Konstans: 10
    Minden karakternek
+ Erő
    A karakter Erő Tulajdonsága
+ Ügyesség
    A karakter Ügyesség Tulajdonsága
+ Gyorsaság
    A karakter Gyorsaság Tulajdonsága
+ Harcmodor TÉ
    Harcmodor képzettség szintje által
    kapott bónusz
+ Fegyver TÉ
    A forgatott fegyver Támadó Értéke
+ Mesterfegyver fortély
    +1 fokonként
+ HM
    A TÉ-re költött (KP-ból felvett)
    Harcérték módosító
+ Plusz támadás levonása
    A 2. támadástól kezdve minden támadás
    fixen TÉ:-4 levonással történik
    (nem halmozódik!)
+ Speciális
  - Fortélyokból adódó módosítók
  - Harci helyzetből adódó módosítók
  - Fegyver minőségéből adódó módosító
    - TÉ: -3
    - TÉ: +3
  - Szituációkból adódó módosítók
  - Mágikus fegyver módosítói
  - Mágia hatására kapott módosító
```

→ [Harcmodor képzettség](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szintje által kapott bónusz

<br />

---
### Védő Érték (`VÉ`)

A Védő Érték szimbolizálja a karakter közelharcban nyújtott azon képességét, hogy mennyire hatásosan képes elhárítani, elkerülni az ellene intézett csapásokat. Értéke nem mondható állandónak, hisz a harci helyzettől függően változik, ráadásul kihat rá a testi, szellemi fáradtság (lásd [VÉ csökkenés](064_02_03_vedo_ertek_csokkentese.md)) és persze a [sebesülés](061_03_sebesules.md) is.

```
🗡️ Védő Érték meghatározása

+ Konstans: 30
    Minden karakternek
+ Ügyesség
    A karakter Ügyesség Tulajdonsága
+ Gyorsaság
    A karakter Gyorsaság Tulajdonsága
+ Harcmodor VÉ
    Harcmodor képzettség szintje által
    kapott bónusz
+ Fegyver VÉ
    A forgatott fegyver Védő Értéke
+ Mesterfegyver fortély
    +1 fokonként
+ HM
    A VÉ-re költött (KP-ból felvett)
    Harcérték módosító
+ Merevvértviselet – 3. fok
    Merev mellvérteknél VÉ:+3 bónusz
+ Pajzs VÉ
    Készületlenül, Meglepetésnél
    pajzs VÉ nem adódik hozzá.
    Képzetlen Pajzshasználat esetén
    csak értékének fele számít be.
+ Speciális
    - Harc során bekövetkező csökkenés
      (nem sebző találat esetén)
    - Sebesülésből adódó csökkenés
    - Fortélyokból adódó módosítók
    - Harci helyzetből adódó módosítók
      (harc alulról, harc megrendülten, stb)
    - Fegyver minőségéből adódó módosító
      - VÉ: -2
      - VÉ: +2
      - Gyatra fegyver, Mestermunka, stb.
    - Mágikus fegyver módosítói
    - Szituációkból adódó módosítók
    - Mágia hatására kapott módosító
```

→ [Harcmodor képzettségek](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szintje által kapott bónusz

<br />

### Védő Érték (`VÉ`) - mozgás jellege és mérete szerint

Van olyan helyzet, mikor a karakter képtelen a védekezésre, például valamilyen [Státusz](082_statuszok.md) hatására, vagy nincs tudatában, hogy épp támadás éri. Ilyenkor a teste mozgásának jellege adja az összes **Védő Értékét**, akár egy mozgó tárgynak - az alábbi táblázat szerint:

```
VÉ (ellenfél mozgásának jellege)

 7 - Álló helyzet
10 - Lassú egyenletes
     (séta)
17 - Egyenletes kocogás
27 - Sprint egyenes vonalon
17 - Lassú kiszámíthatatlan
27 - Közepesen gyors, kiszámíthatatlan
37 - Gyors, kiszámíthatatlan
```

```
VÉ módosító
(ellenfél mérete)

-10 - Óriás
 -3 - Ork
 +0 - Elfszabású
 +7 - Goblin
+13 - macska
+20 - egér
```

<br />

---
### Célzó Érték (CÉ)

→ Lásd a [Távolsági Harc - Célzó Érték számítása](071_tavharc_ce.md) fejezetet!

---

🔗 [Harcmodor képzettségek és bónuszaik](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
