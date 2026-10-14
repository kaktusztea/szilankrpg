# Fegyvergenerátor

Fontos: ez a fejezet **nem szükséges a játékhoz** - a fegyverek harcértékei már készen vannak a [fegyvertáblázatokban](068_00_fegyverek.md).\
Az alábbiakra használható:

- **Megérteni**, hogyan lettek a fegyverek értékei legenerálva.
- **Saját fegyvert alkotni**, ha a meglevő fegyverekkel elégedetlen vagy és szeretnél nulláról újat alkotni. Elsősorban KM-eknek és vállalkozó kedvű csapatoknak ajánlott.

A generátor determinisztikus: a fegyver néhány paraméteréből (hossz, sebzőfelület, súly, anyag, stb.) egyszerű összeadással jönnek ki a harcértékek. Majdnem minden táblázatokban található fegyver így készült - ám van pár speciális kivétel.

---
## Az alapelv

```
Minden fegyver egy fa bot alapból indul
 (zúzó, TÉ = VÉ).
 Erre "aggatjuk rá" a paramétereket.
 
Minden előnyt egyensúlyozzunk ki
 valamilyen hátránnyal is.
```

Ami valamiben erősít, máshol gyengít: a nehéz fegyver nagyobbat üt, de lassabb; az íves penge páncéltalan ellenfélen hatékonyabb, de fémvérten könnyebben lecsúszik. Így nincs "mindent vivő" fegyver.

---
## A folyamat

```
1. Fegyverhossz       mekkora a fegyver (0-12)
2. Aktorok            sebzőfelületek, fontossági
                      sorrendben (1. = elsődleges)
3. Fejdarab, pengés   fej-darabszám, van-e éle
4. Egyéb              láncos, hajlékony,
                      szálfegyver nyél
5. Súly               könnyű / átlagos /
                      nehéz / súlyos
6. Alapanyag, Idea    anyag és minőség
7. Erőbónusz-limit    kell-e plafon (kisebb fegyverek)
8. Számolás           képletekkel, aktoronként
                      egy fegyvermód
9. Ellenőrzés         hasonló táblázatbeli
                      fegyverrel (lásd a végén)
```

---
## Aktor és fejdarab

**Aktor** = egy sebzőfelület (vágóél, pengehegy, buzogányfej, lándzsahegy). Egy fegyvernek több aktora is lehet - mindegyik egy külön **fegyvermód**, saját harcértékekkel.

**Fejdarab** = a fegyver fején lévő fizikai darabok száma. Egy fizikai fejen több aktor is lehet.

```
Hosszú kard
  2 aktor:    vágóél + pengehegy
  1 fejdarab: egyetlen penge

Alabárd
  3 aktor:    vágóél + lándzsahegy + buzogányfej
  2 fejdarab: pengevas + buzogányfej
```

Az aktorok sorrendje a **Sebzéstípust** adja:

```
elsődleges   1. aktor        büntetés nélkül
másodlagos   többi aktor     bejelenthető,
                             Sebzésdobás: Hátrány-1
alkalmatlan  nincs rá aktor  ha a KM engedi,
                             Sebzésdobás: Hátrány-2
```

---
## Paraméter-táblák

```
Magasabb Sebesség = lassabb fegyver
```

### ⚜️ Fegyverhossz

```
hossz  TÉ/VÉ  SP  Sebesség  forgatás     Felsz.
  0      0    +0     5      egykezes       0
  1      1    +1     5      egykezes       0
  2      2    +2     5      egykezes       0
  3      3    +3     6      egykezes       0
  5      5    +4     6      másfélkezes    1
  7      7    +5     7      kétkezes       2
  9      9    +5     8      kétkezes       2
 12     12    +5     9      kétkezes       2

övön hordható:  0, 1, 2
Beszorítható:   7, 9
másfélkezes:    külön "1 kézzel" fegyvermód is
Felsz.:         Felszerelés pont; a végső érték
                a hossz és a súly szerinti
                pont közül a nagyobb
```

A két fegyver hossz-különbsége adja a [Fegyverelőny, Fegyverhátrány, Fegyverazonosság](065_03_04_fegyver_harci_helyzetek.md) viszonyt (`VÉ` csökkentés). A Beszorítható extráról: [Fegyver extrák](068_01_03_fegyver_extrak.md). Felszerelés pont: [Felszerelés](010_03_06_felszereles.md).

### ⚜️ Aktorok

```
(csak a nem-nulla deltákat írjuk ki;
 "nincs" = minden delta 0)

Zúzó
  botvég                      nincs (referencia)
  buzogányfej-tompa           SP:+2, VÉ:-2
  buzogányfej-szöges          SP:+1, Átütés:2, VÉ:-3
Szúró
  pengehegy-apró              nincs
  pengehegy-tőr               SP:+1
  pengehegy-kard              SP:+2, Átütés:1
  (egykezes pengehegynél: "Pontos" extra)
Vágó-egyenes
  vágóél-egyenes-rövid        TÉ:+1, VÉ:+1
  vágóél-egyenes-átlagos      SP:+1, TÉ:+2, VÉ:+2
  vágóél-egyenes-nagy         SP:+2, TÉ:+2, VÉ:+2
Vágó-íves
  vágóél-íves-rövid           SP:+1
  vágóél-íves-átlagos         SP:+2, Sebesség:+1
  vágóél-íves-nagy            SP:+3, Sebesség:+1
Szúró (lándzsahegyek)
  lándzsahegy-rövid-átlagos   SP:+3, Átütés:2
  lándzsahegy-rövid-széles    SP:+4
  lándzsahegy-rövid-keskeny   SP:+2, Átütés:4
  lándzsahegy-tőrhossz        SP:+4
  lándzsahegy-rövidkardhossz  SP:+5
  lándzsahegy-hosszúkardhossz SP:+6, Sebesség:+1
```

Speciális aktorok (kevés, egyedi fegyverhez):

```
Zúzó
  kampós             SP:-5
                     másodlagos aktornak, extra:
                     Kampós véggel lábkirántás
  vasököl            TÉ:-1, VÉ:-2
                     fém ütőfelület
                     (Vasököl, Markolatgomb)
  ököl               SP:-5, TÉ:-3, VÉ:-3
                     puha: FP-sebzés (Puszta kéz)
  ököl-belharc       nincs
                     puha: FP-sebzés (Puszta kéz
                     Belharcban)
Szúró
  pengehegy-rejtett  VÉ:-3
                     tenyérbe rejtett tüske
                     (Tőr, ököl)
```

- Szúró aktorok: szúrásnál a súly nem számít - nehéz fegyvernél ez `SP`-veszteség, könnyűnél nyereség.
- Egyenes él: `TÉ`/`VÉ` bónusz (jobb hárítás)
- Íves: több `SP`, cserébe pontatlanabb és nagyobb méretben lassabb.

### ⚜️ Fejdarab, pengés, láncos, hajlékony

```
fejdarab  TÉ  Sebesség
  0        0     0      csak botvég / ököl
  1        0    +1      penge, zúzófej
  2       -2    +2
  3       -4    +3

  A botvég és az ököl kivételével minden
  aktornál legalább 1.

pengés     TÉ:+1, VÉ:+1, SP:+1
           kard jellegű, "van éle"
láncos     SP:+1, Sebesség:+1
           extra: a pajzs VÉ-je feleződik
hajlékony  VÉ:-2, Sebesség:+1
           extra: megkerüli a pajzsot,
           fegyvertörés-immunis
```

### ⚜️ Súly

```
súly      SP*  Sebesség  Erő-követelmény
könnyű    -1     -1            -
átlagos    0      0            -
nehéz     +1     +1            2
súlyos    +2     +2            3

* Szúró módnál a súly SP-je nem számít
  (nincs erőkar).
* Nehéz/súlyos fegyvernél a delta SP helyett
  Átütésbe is mehet (pl. csatabárd).
* Ha a forgató Ereje kisebb a követelménynél:
  Hátrány-1 a Támadó dobásra.
```

A súlyt a fegyver mérete és anyaga nagyjából meghatározza - ettől legfeljebb `1` kategóriával térj el (pl. tömör kis buzogány: nehéz; üreges nagy penge: átlagos).

---
### ⚜️ Alapanyag és Idea

```
alapanyag    TÉ/VÉ  SP   egyéb
csont          0    -4
kő             0    -3
bronz          0    -2
fa             0     0
acél           0     0   alap
abbitacél     +1    +1
feketeacél    +1    +1   Chi-harcban törhetetlen
mithrill      +1    +2   súly -1 kategória
lunír         +1     0   súly -2 kategória
álomfém       +1    +1   Átütés:+2; mágiamentes
                         zónában elveszti bónuszait
ősfém         +2    +2   szellem- és élőholt
                         lényeket is sebez
élőereklye    +2    +3   törhetetlen, egy
                         viselőhöz kötődik

idea   TÉ/VÉ   SP   Sebesség   egyéb
 -5     -3     -5      +2
 -4     -2     -4      +1
 -3     -1     -3      +1
 -2     -1     -2       0
 -1      0     -1       0
  0      0      0       0
 +1      0     +1       0
 +2     +1     +2       0
 +3     +1     +3      -1
 +4     +2     +4      -1      súly -1 kategória
 +5     +3     +5      -2      súly -2 kategória
```

A legendás anyagok és a magas Idea ritkák és drágák - a `+4`/`+5` Idea narratív indoklást kíván. Részletek: [Fegyver Ideája](068_01_02_fegyver_idea.md).

### ⚜️ Szálfegyver nyél, Erőbónusz-limit, Akadály

```
szálfegyver nyél
  sima          nincs hatás
  fanyelű       extra: Fegyvertörés-ellenpróba -2
                (a fa nyél könnyebben törik)
  vasaltszárú   súly +1 kategória
  tömörszárú    SP:+1, súly +2 kategória

erőbónusz-limit
  az SP-hez adható Erőbónusz plafonja
  nincs plafon  a legtöbb fegyver
  0-5           tőrök, könnyű, finom pengék

akadály
  0 / 1 / 2: hosszú cipelésnél mennyire
  akadályoz, harcértéket nem módosít
  (lásd: Páncél MGT, Akadály)
```

<br />

---
## Képletek

Aktoronként (fegyvermódonként) külön számolj:

```
TÉ       = hossz + aktor + fejdarab + pengés
           + alapanyag + Idea
VÉ       = hossz + aktor + pengés
           + alapanyag + Idea + hajlékony
SP       = hossz + aktor + pengés + láncos
           + alapanyag + Idea + nyél + súly*
Átütés   = aktor + alapanyag (+ súly**)
Sebesség = hossz + aktor + fejdarab + láncos
           + hajlékony + súly + Idea

*  szúró módnál a súly nem számít
** ha a súly-delta Átütésbe megy
   (szúró módnál ez sem számít)
```

A fejdarab csak a `TÉ`-t rontja (a `VÉ`-t nem), a hajlékony csak a `VÉ`-t.

**Súly-eltolás:** az Idea, az alapanyag és a nyél súly-módosítója a súly *kategóriáját* tolja el (a táblázat széleinél megáll), és az új kategória teljes sora érvényes (`SP`, Sebesség, Erő-követelmény).

```
nehéz súlyú fegyver mithrillből (súly -1)
  → átlagosként számol:
    SP:0, Sebesség:0, nincs Erő-követelmény
```

**A játékban** ehhez jön még az Erőbónusz (a limitig) az `SP`-hez, és sebzésdobáskor a sebzésjelleg × páncél módosító (lent).

<br />

### Egy kézzel forgatva

```
másfélkezes · 1 kézzel
  TÉ:-2, VÉ:-2, Átütés:0, Erőbónusz-limit max 2
  → mindig külön fegyvermód

kétkezes · 1 kézzel
  TÉ:-4, VÉ:-4, Átütés:0, Erőbónusz-limit 0
  → szituáció (pajzs, kiesett kéz)

Az SP egyik esetben sem változik.
```

Részletek: [Másfél- és kétkezes fegyverek egy kézzel](068_01_06_masfelkezes_es_ketkezes_fegyverek_egy_kezzel.md).

<br />

---
## Sebzésjelleg × páncél

Sebzésdobáskor a fegyvermód jellege a cél vértjének fajtája szerint `SP`-bónuszt vagy -büntetést kap (az `SFÉ`-levonás mellett). Ez teszi szituáció-függővé a fegyvereket.

```
jelleg        csupasz  puha  bőr  lánc  merev
zúzó             0       0    +1   +3    +3
szúró           +2      +3    +1    0    -3
vágó-egyenes    +1      +1     0   -2    -4
vágó-íves       +3      +2     0   -2    -4

merev = pikkely, lemez
```

A zúzó a páncélos ellenfél válasza, a vágó-íves a páncéltalané, a szúró a rugalmas középút. Merev vért ellen az **Átütés** segít (csökkenti az effektív `SFÉ`-t). Részletek: [Fegyverek sebzése](068_01_04_fegyverek_sebzese.md).

<br />

---
## Kidolgozott példák

A `GAME` értékek Erőbónusz nélküli bázisértékek, ahogy a fegyvertáblázatokban.

### ⚡ Hosszú kard (a számolás lépésenként)

```
WORK
  hossz: 3, fejdarab: 1, pengés: 1
  súly: átlagos, alapanyag: acél, Idea: 0
  aktorok: vágóél-egyenes-átlagos,
           pengehegy-kard

vágóél-egyenes-átlagos (elsődleges)
  TÉ        3 hossz + 2 aktor + 1 pengés  =  6
  VÉ        3 hossz + 2 aktor + 1 pengés  =  6
  SP        3 hossz + 1 aktor + 1 pengés  = +5
  Átütés                                  =  0
  Sebesség  6 hossz + 1 fejdarab          =  7

pengehegy-kard (másodlagos, szúró)
  TÉ        3 hossz + 0 aktor + 1 pengés  =  4
  VÉ        3 hossz + 0 aktor + 1 pengés  =  4
  SP        3 hossz + 2 aktor + 1 pengés  = +6
  Átütés    1 aktor                       =  1
  Sebesség  6 hossz + 1 fejdarab          =  7

GAME
  elsődleges: vágóél-egyenes-átlagos (vágó-egyenes)
    TÉ:6, VÉ:6, SP:+5, Átütés:0, Sebesség:7
  másodlagos: pengehegy-kard (szúró)
    TÉ:4, VÉ:4, SP:+6, Átütés:1, Sebesség:7
```

Vágj a páncéltalanra, szúrj a láncingesre, lemez ellen válts fegyvert.

### ⚡ Kés

```
WORK
  hossz: 0, fejdarab: 1, pengés: 1, súly: könnyű
  erőbónusz-limit: 2
  aktorok: vágóél-íves-rövid, pengehegy-apró

GAME
  elsődleges: vágóél-íves-rövid (vágó-íves)
    TÉ:1, VÉ:1, SP:+1, Átütés:0, Sebesség:5
  másodlagos: pengehegy-apró (szúró)
    TÉ:1, VÉ:1, SP:+1, Átütés:0, Sebesség:5
```

A könnyű súly gyorsítja, de a vágómód `SP`-jét `-1`-gyel csökkenti. Páncéltalanra veszélyes, vértre alig.

### ⚡ Alabárd

```
WORK
  hossz: 9, fejdarab: 2, pengés: 1, súly: nehéz
  nyél: fanyelű, akadály: 2
  aktorok: vágóél-íves-nagy,
           lándzsahegy-rövid-átlagos,
           buzogányfej-tompa

GAME
  elsődleges: vágóél-íves-nagy (vágó-íves)
    TÉ:8, VÉ:10, SP:+10, Átütés:0, Sebesség:12
  másodlagos: lándzsahegy-rövid-átlagos (szúró)
    TÉ:8, VÉ:10, SP:+9, Átütés:2, Sebesség:11
  másodlagos: buzogányfej-tompa (zúzó)
    TÉ:8, VÉ:8, SP:+9, Átütés:0, Sebesség:11
  Extrák: Beszorítható (hossz 9),
          fanyél fegyvertörése könnyebb
```

Minden vért ellen van jó módja, de a 2 fejdarab miatt pontatlanabb, lassú, nehéz és nehezen cipelhető: a sokoldalúság stratégiai előny, nem taktikai.

### ⚡ Mara-sequor (Idea és legendás anyag)

```
WORK
  hossz: 5, fejdarab: 1, pengés: 1
  Idea: +3, alapanyag: feketeacél
  aktorok: vágóél-íves-átlagos

GAME
  2 kézzel: vágóél-íves-átlagos (vágó-íves)
    TÉ:8, VÉ:8, SP:+11, Átütés:0, Sebesség:7
  1 kézzel: vágóél-íves-átlagos (vágó-íves)
    TÉ:6, VÉ:6, SP:+11, Átütés:0, Sebesség:7
    Erőbónusz-limit: 2
```

Az Idea `+3` és a feketeacél kiemelkedő `SP`-t ad, és az íves él lassúságát is ellensúlyozza (Sebesség: 6 + 1 + 1 - 1 = 7). Lemez ellen viszont `-4`: egy legendás penge is szituáció-függő.

<br />

---
## Extrák és ellenőrzés

Ami nem fejezhető ki számokkal (beakadás, különleges felkészítés, páncéltalan célon nagyobb sebzés, stb), az [Extraként](068_01_03_fegyver_extrak.md) kerül a fegyverre. A hossz, a láncos/hajlékony fej és a fanyél a saját extráját automatikusan hozza.

Kész fegyvernél vesd össze az értékeit egy hasonló táblázatbeli fegyverrel
- [Közelharci](068_02_kozelharci_fegyverek.md)
- [Kardvívó](068_03_kardvivo_fegyverek.md)
- [Lándzsavívó](068_04_landzsavivo_fegyverek.md)
- [Romboló](068_05_rombolo_fegyverek.md)
- [Ostorharc](068_06_ostorharc_fegyverek.md)

### Ökölszabályok

- Ha mindenben jobb egy meglévőnél, akkor hiányzik a fonákja.
- Ha a többlet csak Ideából vagy legendás anyagból jön, az OK - ilyenkor az Ár és a ritkaság adja a fonákot.

---

🔗 [Páncélok](069_00_vertek_pancelok.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
