## `KÉ`, `TÉ`, `VÉ`, `CÉ`

## Harcértékek felépítése

A karaktert a harcban harcértékei jellemzik. Ezek mutatják meg, hogy mennyire képzett a küzdelem egyes területein. Alapvetően négy érték határozza meg az aktuális harcértékeket, melyek szituációtól, forgatott fegyvertől, illetve harcmodortól függően változhatnak. Ezek az alábbiak:

- Kezdeményező Érték (`KÉ`)
- Támadó Érték (`TÉ`)
- Védő Érték (`VÉ`) / Védő Érték (`VÉ`) Mozgás jellege alapján
- Célzó Érték (`CÉ`)

Ezen értékek öt jellemzőből épülnek fel:

```
- Harcérték Alap
- Tulajdonságok
- Harcérték Módosító
- Harcmodor képzettség
- Mesterfegyver fortély
- Fegyver harcértékei
```

Az alábbiakban részletesen kifejtjük a fenti értékek kiszámítási módját, valamint hogy mi és hogyan képes módosítani őket.

---
### Harcérték Alapok

Első szinten minden karakter egységes konstans értékeket kap `KÉ`, `TÉ`, `VÉ` és `CÉ` értékére. Ehhez az alapértékhez adódnak majd hozzá az egyéb módosítók.

```
KÉ konstans: 3
TÉ konstans: 7
VÉ konstans: 30
CÉ konstans: -10
```

---
És most lássuk a bevezetőben már említett négy konkrét harcértéket.

### Kezdeményező érték (`KÉ`)

⭕k20: ha egységes KÉ lesz, átdolgozni

A Kezdeményező Érték (**KÉ**) szerepe a harcban, hogy meghatározza, ki „mozdul először” a harcban. Nem jelent harci dominanciát, csak azt, hogy ki a gyorsabb, ki cselekedhet előbb.

A kezdeményezés műveletéről bővebben lásd a [Harc menete - Kezdeményezés](064_02_01_kezdemenyezes.md) fejezetet!

Két típusú KÉ létezik:
- Fegyveres KÉ
- Varázslás KÉ

A fenti két KÉ számítása azonos, egyedül a "Harcmodor"/"Mágia Tradíció" által adott bónuszban térnek el (lásd lenn). Külön számolandóak és külön is kezelendőek. Bővebben lásd a [Harc menete](064_02_00_harc_menete_reszletes.md#kezdeményezés) - "Kezdeményezés" és "Varázslás kezdeményezése" bekezdéseket.

A karakter Kezdeményező Értékét a következőképpen kell kiszámítani:

```
🗡️ Kezdeményező Érték meghatározása

+ Konstans: 3
    Minden karakternek
+ Gyorsaság
    A karakter Gyorsaság Tulajdonsága
+ Intelligencia
    A karakter Intelligencia Tulajdonsága
+ Szint
    A karakter Tapasztalati szintje
+ Harcmodor KÉ
  - Harcmodor szintje által kapott bónusz
  - Mágia Tradíció által kapott bónusz
    (mintha Harcmodor képzettség lenne)
+ Speciális
  - Gyors Kezdeményezés fortély KÉ bónusza
  - Szituációkból adódó módosítók
  - Mágia hatására kapott módosító
```

→ [Harcmodor képzettség](https://github.com/kaktusztea/szilankrpg/blob/master/md/062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szintje által kapott bónusz

<br />

---
### Támadó Érték (`TÉ`)

A Támadó Érték szimbolizálja a harcos azon tulajdonságát, hogy az adott fegyverrel milyen hatékonyan képes ellenfele ellen támadást, támadásokat intézni.

Az alábbi táblázat megadja, a Támadó Érték kiszámolásának módját.

```
🗡️ Támadó Érték meghatározása

+ Konstans: 7
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
  - Mágikus fegyver módosítói  
  - Mágiából adódó módosítók
```

→ [Harcmodor képzettségek](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szintje által kapott bónusz

<br />

---
### Védő Érték (`VÉ`)

A Védő Érték szimbolizálja a karakter közelharcban nyújtott azon képességét, hogy mennyire hatásosan képes elhárítani, elkerülni az ellene intézett csapásokat. Értéke nem mondható konstansnak, hisz a harci helyzettől függően változik, ráadásul kihat rá a testi-lelki, szellemi fáradság és persze a [sebesülés](061_03_sebesules.md) is.

```
🗡️ Védő Érték meghatározása

+ Konstans: 24
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
+ Vértviselet – 3. fok
    Lemez mellvértnél VÉ:+3 bónusz
+ Pajzs VÉ
    Készületlenül, Meglepetésnél
    pajzs VÉ nem adódik hozzá.
    Képzetlen Pajzshasználat esetén
    csak értékének fele számít be.
+ Speciális
    - Harc során bekövetkező csökkenés
      (sima találat esetén)
    - Sebesülésből adódó csökkenés
    - Fortélyokból adódó módosítók
    - Harci helyzetből adódó módosítók
      (harc alulról, harc megrendülten, stb)
    - Fegyver minőségéből adódó módosító
        - Mestermunka: max CÉ:+2
        - Gyatra fegyver: max VÉ:-3
        - Mágikus fegyver módosítói
        - Mágiából adódó módosítók
```

→ [Harcmodor képzettségek](062_02_harcmodor_kepzettsegek_es_bonuszaik.md) szintje által kapott bónusz

<br />

### Védő Érték (`VÉ`) - mozgás jellege és mérete szerint

Van olyan helyzet, mikor a karakter képtelen a védekezésre. Vagy valamilyen [Státusz](082_statuszok.md) hatására, vagy nincs tudatában, hogy épp támadás éri. Ilyenkor a teste mozgásának jellege adja az összes **Védő Értékét**, akár egy mozgó tárgynak - az alábbi táblázat szerint:

```
VÉ (Célpont mozgásának jellege)

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
VÉ (Célpont mérete)

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

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
