# Szilánk Karakter webapp

Webes karakteralkotó és harckezelő alkalmazás a Szilánk RPG szabályrendszerhez. Mobilra és Desktopra is optimalizált.

Kliens mód kizárólag, tehát nincs szerver komponens, könnyen hosztolható egyénileg is például github.io alá.

---
## Módok

Az app két módban használható (fejléc jobb oldalán a 🔧/🎮 gombbal váltható):

- **Szerkesztő mód** (🔧): karakter létrehozás és módosítás - minden mező szerkeszthető
- **Játék mód** (🎮): játék közben - csak a harc- és session-kezelés aktív, a karakter adatai írásvédettek

---
## Fejléc

A fejléc bal oldalán a **Szilánk pont** (keretes szám) látható, jobb oldalán a gombok:

| Gomb | Funkció |
| ---- | ------- |
| ↩    | Visszavonás (undo) - a szám a visszavonható lépéseket mutatja |
| ✏️   | Verziók, Napló, Jegyzetek ablak |
| 🧑   | Karakterek (karaktertár, mentés/betöltés) |
| 🔧/🎮 | Szerkesztő ⇄ Játék mód váltás |

---
## Fülek

Az alsó tab-sorral navigálhatsz (swipe gesztussal is), balról jobbra:

| Ikon | Fül                          | Rövid leírás                                             |
| ---- | ---------------------------- | -------------------------------------------------------- |
| 🟡   | Hátterek                     | Faj, Leíró és Karma hátterek választása (szövegfelhő)    |
| 🟣   | Fortélyok                    | Fortélyok felvétele, fok állítás, követelmény-ellenőrzés |
| 🔵   | Tulajdonságok + Képzettségek | 8 tulajdonság + képzettségek csoportos listája           |
| ✨    | Misztikus                    | Tradíció, Arkánumok, Faj misztérium, Misztikus fortélyok |
| 🛡️  | Harcértékek                  | HM/CM, fegyverek, páncél, pajzs beállítása               |
| 🏹   | Távharc                      | Távfegyverek, CÉ kalkulátor, célpont VÉ szorzók          |
| 🗡️  | Harc                         | Teljes harcértékek, VÉ csökkenés, ÉP/sebesülés, MP       |
| ✳️   | Aktív                        | Taktikák, helyzetek, manőverek, státuszok               |

---
## Főbb funkciók

### Karakteralkotás (Szerkesztő mód)

- **Tulajdonságok**: koppintással popup-ból állíthatók (-5..+7), faj-korlátok ellenőrzésével
- **Képzettségek**: csoportokba rendezve, szint popup-pal (1-15), TSz limit jelzéssel
- **Fortélyok**: fok pöttyök (●/○), követelmény-ellenőrzés (piros jelzés nem teljesüléskor), többszörös fortélyok kezelése, egyedi Szabad fortély felvétele (saját név + kiterjesztés választás)
- **Fegyverek**: példányonként Mesterfegyver fok, Idea, Anyag beállítás
- **Páncél**: struktúra, fémalapanyag, kidolgozottság, sisak, végtag, méret - SFÉ és MGT automatikus számítás
- **KP sáv**: a tab-bar felett folyamatosan mutatja a maradék KP-t és a primer keretet

### Harckezelés (Játék mód)

- **Aktív fül**: fegyverfogás (Egyfegyveres / Fegyver+pajzs / Fegyver+hárító / Kétkezes), taktikák kombó-szabályokkal, harci helyzetek, manőverek, státuszok - minden választás azonnal hat a Harc fülre
- **Harc fül**: fegyverenkénti TÉ/VÉ/SP/Támadás tábla, KÉ, TÉ, SFÉ, VÉ csökkenés, MP boxok a fejlécben, harcérték részletek bontás (TÉ/VÉ/SP összetevők: fegyver alap, MF, taktika, fortély, páncél stb.)
  - **Kezdeményezés dobás**: a KÉ boxra koppintva `KÉ + k20` dobás nagy számmal; az utolsó 3 dobás a KÉ boxban látszik
  - **Támadó dobás**: a fejléc TÉ boxra vagy a fegyvertábla TÉ cellájára koppintva — első fázisban aktív hatások és Előny/Hátrány picker, második fázisban `TÉ + k20` dobás eredménnyel. Ha a k20 ≥ 16 → Előny+1, k20 = 20 → Előny+2 jelzés. Manuális dobás is lehetséges (saját kocka értékkel).
  - **Sebzésdobás**: a Támadó dobás eredménye után a „Sebzés" gombbal indítható — SP bontás (alap, erő, MF, taktika, fortély), statikus bónuszok, Előny/Hátrány kocka picker, másodlagos sebzés toggle és újradobás gomb. Az Átütés értéke is kijelzésre kerül (ha > 0).
  - **SFÉ infó**: az SFÉ boxra koppintva részletes páncél infó popup nyílik (páncél név, struktúra, alapanyag, SFÉ bontás, lefedettség %, MGT bontás).
  - **VÉ csökkentés**: a VÉ csökkenés boxban a `-N` gombokkal csökkentheted a védőértéket (támadásonként), `+1` gombbal visszaállíthatsz egyet, `⟲` nullázza. A label/érték koppintással a csökkentések története is látszik.
  - **Manőver pont (MP)**: az MP box mutatja az aktuális/max manőver pontot; `-1` gombbal csökkentheted, `⟲` visszaállítja a maximumra.
  - **Manőver végrehajtása** (⚔️ gomb): az Aktív fülön indítható manőver dobás. Először mód választó (Aktív = én hajtom végre / Passzív = ellenem hajtják végre), majd a kiválasztott manőver popup-ban fázisonkénti (M/V/E) eredmény rögzítés, MP felhasználás, belharcos bónusz — a végeredmény Sikeres/Sikertelen.
  - **Harci akrobatika ki/be**: session kapcsoló (Igen/Nem) - letiltva ha hiányzik a fortély, nem megfelelő a páncél (struktúra vagy túl magas MGT), vagy kevés az Akrobatika képzettség szint (koppintásra megjelenik a hiányzó feltétel)
  - **Páncél viselve ki/be**: session kapcsoló (Igen/Nem) - viseled-e épp a páncélt (hat az SFÉ-re, MGT-re és a Harci akrobatika elérhetőségére)
- **ÉP táblázat / Sebesülés**: S1-S4 rubrikák, TÉ levonás automatika
  - **Sebesülés rögzítése**: típus (S/V/Z/FP) + érték választás (1-15, bővíthető ▾ nagyobb értékekre)
  - **Gyógyulás**: ÉP vagy FP + érték választás (csak a meglévő sebekre)
- **Távharc**: CÉ + célpont VÉ kalkulátor szorzó-pickerekkel (mozgás, méret, szél stb.)
  - **Célzó dobás**: a CÉ/VÉ box-ra koppintva — első fázisban aktív hatások, Előny/Hátrány picker és forrásaik (harci helyzetek, taktikák, státuszok, fortélyok), második fázisban `CÉ + k20` dobás a kiszámolt VÉ-vel összevetve → Találat / Nem talált jelzés. Találat után SP dobás is indítható. Manuális dobás is lehetséges.
  - **Lövéskitérés**: védekező eszköz - válaszd ki a bejövő fegyvert és a távolságot, az app kiszámolja a célszámot (fegyver kategória + távolság). "Kitérés" gombbal `Akrobatika+Gyorsaság + k10` dobás a célszám ellen → siker (kitértél) / sikertelen (a lövész jöhet)

### Aktív fül

- **Fortély bónuszok**: harci fortélyok emlékeztetői (lila szín)
- **Alapesetek** (alapból becsukva): fortélyok 0. fokának büntetései, ha nem rendelkezel a fortéllyal (pl. Lovas harc nélkül: TÉ/VÉ: -9)
- **Taktikák**: módosítók zöld ✔ jellel (beszámított jelzés). Skálázható taktikák extra fokjai kék pöttyel (●) jelölve, ha a Harcmodor szinted eléri a küszöböt. Taktikához kapcsolódó fortély bónuszok a chip alatt megjelennek.
- **Harci helyzetek**: infó szöveg + kapcsolódó fortély bónuszok
- **Státuszok**: fokozatonkénti hatások (Előny/Hátrány, letilt, szorzó stb.)

---
## Verziók, Napló, Jegyzetek (✏️)

A fejléc ✏️ gombjával nyíló ablak három részből áll:

- **Karakter verziók**: kiemelt pillanatképek (checkpoint) a karakterről. Bármikor létrehozhatsz egyet, megtekintheted vagy visszaállhatsz rá. Visszaállításnál választhatsz: az utána lévő verziók törlése, vagy új verzióként hozzáfűzés. Napló bejegyzés írásakor opcionálisan automatikusan is készül verzió.
- **Napló**: játék session bejegyzések (dátum, KM, kaland neve, események). Összecsukható lista, szerkeszthető.
- **Jegyzetek**: szabad szöveges jegyzetmező (mindig nyitva).

## Előtörténet (🪪)

A Tulajdonságok fül fejlécében a 🪪 gombbal nyíló ablak a karakter biográfiai adatait fogja össze: Becenév, Név, Kor, Vallás, Származás helye, Szociális érzék, Külső, és egy hosszú Előtörténet szövegmező (max 5000 karakter).

---
## Rejtett funkciók

### Karakter URL megosztás
A Karakterek ablakban (🧑) minden slot sorában a 🔗 gombbal egyetlen URL-be tömörítheted a karaktert és vágólapra másolhatod. Az URL megnyitásakor az app automatikusan importálja a karaktert.

### VÉ csökkenés történet

A Harc fülön a **VÉ csökkenés** label-re vagy értékre koppintva megjelenik a VÉ változások története (pl. "-3; -2; +1"). Mellé koppintás bezárja.

### Képzettség info panel (Játék mód)

A Tulajdonságok+Képzettségek, Harcértékek és Misztikus füleken játék módban a képzettség sorra koppintva kinyílik egy info panel: Próba, Domináns tulajdonságok, Kiterjesztő fortélyok (zöld = megvan, piros = nincs meg), és alul 🔗 szabály link + 🎲 Képzettségpróba dobás gomb.

### Tulajdonságpróba dobás (Játék mód)

A Tulajdonságok+Képzettségek fülön játék módban bármelyik Tulajdonság boxra koppintva megnyílik a Tulajdonságpróba ablak (`Tulajdonság + k6 vs Célszám`):

- **Nehézség** gomblista (inline): 3 (Könnyű) … 8 (Emberfeletti) — koppintással választható, aktív kiemelten jelölt
- **Előny/Hátrány** választó: Hátrány-2, Hátrány-1, — (default), Előny+1, Előny+2
- **Dobás**: az eredmény (legjobb/legrosszabb k6 az Előny/Hátrány szerint) a célszámhoz mérve → **Siker** (zöld) / **Sikertelen** (piros). Manuális dobás is lehetséges (saját kocka értékkel).
- **Kiemelt siker/kudarc**: ha az eredmény és a célszám különbsége ≥ 6, ⚜️ Kiemelt siker / ⚜️ Kiemelt kudarc jelenik meg
- Ha a célszám a max dobással (6) sem érhető el, „Lehetetlen" jelenik meg a Dobás gomb helyén
- **Extrák** (lenyitható szekció):
  - **Összetett próba**: 1 elsődleges + 1-3 másodlagos dobás (egyre könnyebb célszámmal); összesített Siker/Sikertelen
  - **Ellenpróba**: célszám nélkül dobsz — az eredményt az ellenfél dobásával kell összevetni
- ⟲ gombbal újradobhatod (eredmény törlése, nehézség marad)
- Escape / ✕: popup bezárása

### Képzettségpróba dobás (🎲, Játék mód)

A képzettség info paneljében a 🎲 gombbal nyíló ablak levezényli a képzettségpróbát (`Tulajdonság + Képzettség szint + k10 vs Célszám`):

- **Tulajdonság** és **Nehézség** gomblista (inline, két oszlopban). A Dobás gomb inaktív, amíg mindkettő nincs kiválasztva.
- **Nehézség**: alapból a 6 (Könnyű) … 21 (Emberfeletti) célszámok; a ▾ nyíllal a 21 felettiek is (24, 27, 30).
- **Kiterjesztő fortély** (ha a képzettséghez tartozik ilyen, popup): választható, hogy melyik fortély terjeszti ki a próbát. Kis státusz pötty jelzi: zöld = felvéve, sárga = hiányzó Normál kiterjesztés, piros = hiányzó Erős kiterjesztés. A fortély **foka** szerint a próba Előny/Hátrány dobást kap (Normál 0.fok → Hátrány-2, 2.fok → Előny+1, 3.fok → Előny+2). Erős kiterjesztés hiányában a próba nem dobható („Nem dobhatsz").
- **Dobás**: az eredmény (a legjobb/legrosszabb k10 az Előny/Hátrány szerint) a célszámhoz mérve → **Siker** (zöld) / **Sikertelen** (piros). Manuális dobás is lehetséges (saját kocka értékkel).
- **Kiemelt siker/kudarc**: ha az eredmény és a célszám különbsége ≥ 6, ⚜️ Kiemelt siker / ⚜️ Kiemelt kudarc jelenik meg
- Ha a célszám a max dobással sem érhető el, „Lehetetlen" jelenik meg a Dobás gomb helyén.
- **Extrák** (lenyitható szekció):
  - **Összetett próba**: 1 elsődleges + 1-3 másodlagos dobás (könnyebb célszámmal); összesített Siker/Sikertelen
  - **Vállalás** (1-3): bónuszként hozzáadódik a próbához, de a dobás után k6 kritikus hiba ellenőrzés — ha k6 ≤ vállalás értéke, Kritikus Hiba
  - **Ellenpróba**: célszám nélkül dobsz — az eredményt az ellenfél dobásával kell összevetni
  - **Helyettesítés**: másik képzettséggel dobsz a próba eredeti képzettsége helyett (az eredeti szint helyett `floor(helyettesítő szint / 3)`, max 5 értékkel)
- ⟲ gombbal újradobhatod (eredmény törlése, beállítások maradnak)
- Escape / ✕: popup bezárása

### Szabály linkek (🔗)

Fortélyoknál és képzettségeknél megjelenik egy 🔗 ikon, ami a GitHub-on lévő szabályrendszer releváns oldalára navigál.

### Támadás szám info panel

A Harc fül fegyver táblázatában a **Tám** (Támadások száma) cellára koppintva egy info popup ugrik fel: fegyver neve, Sebesség értéke, és a számított Harckeret bontása (harcmodor, gyorsaság, MGT, fortély).

### Mágia akarata segédlet

A Misztikus fülön a **Mágia akarata** kártyára koppintva egy négyfüles referencia-ablak nyílik: Aurakiterjesztés (hatótáv módosítók), Auraerősítés (komplexitás→bónusz tábla), Összhang (előny-hátrány módosítók), Képzettség+ (szint→bónusz tábla).

### Szilánk pont és gyors-elérés (fejléc)
A fejlécben a "Szilánk" felirat melletti keretes számra koppintva megnyílik a Szilánk pont ablak, ami egyben gyors-elérési hub is:
- 0–3 közötti Szilánk pont érték választható
- **Szabályrendszer** link (a szabálykönyv GitHub oldalára navigál)
- **Webapp manuál** link (ez a README)
- **Segédlet pdf** link (a játék közbeni segédlet letöltése)

### Undo (Visszavonás)
A fejléc ↩ gombjával - max 6 lépés visszavonható. Minden szerkesztési művelet (tulajdonság, képzettség, fortély, harcérték, fegyver, taktika, VÉ csökkenés, sebzés stb.) visszaállítható.

### Verzió infó

A "Szilánk" feliratra duplán koppintva 5 másodpercre megjelenik a build verzió.

---
## Karaktertár

- Max 10 karakter tárolható a böngésző localStorage-ában
- 🧑 Karakterek: slot lista (aktív ●, többi ○), relatív idő kijelzéssel
- Felső sor: 📄 új karakter, 📁 betöltés fájlból, 📦 összes karakter mentése (backup)
- Slot soronkénti gombok: 🔗 link másolása, 💾 mentés fájlba, 📤 megosztás (mobil), ⧉ duplikálás, ✕ törlés
- Betöltés: fájlból (JSON, egyedi vagy backup) vagy URL-ből

---
## Technikai tudnivalók

- **Automatikus mentés**: minden módosítás azonnal localStorage-ba mentődik
- **Offline működés**: egyszer betöltve az app internet nélkül is használható
- **Böngésző**: modern böngésző szükséges (Chrome, Firefox, Safari, Edge)
- **Képernyő**: 320px szélességtől használható, optimális: mobil (< 600px)

---
## Billentyűk és gesztusok

| Gesztus              | Hatás                         |
| -------------------- | ----------------------------- |
| Swipe (balra/jobbra) | Fül váltás                    |
| Koppintás            | Elem kiválasztása / értékadás |
| Escape               | Bármely popup bezárása        |
| Háttérre koppintás   | Ablak bezárása                |
