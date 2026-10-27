## Példamérgek

### ⚡ **Lórúgás (brutálisan erős altató - italméreg)**

```
→ (1) Erősség:       10 (a legerősebb)
→ (2) Súlyosság:      1 (Alvás)
→ (3) Hatáskezdet:   +5 (Azonnal)
→ (4) Hatástartam:   +3 (pár óra)
→ (5) Bomlási idő:    4 (1 nap folyadékban)
→ (6) Kimutatási idő: 0 (1 nap)
→ (7) Elállás:        0 (1 holdfordulón belül)
→ (8) Speciális:     +0 (1 komponens, 1 hordozó közeg, nem-sűrű)
```

```
Komplexitás: 23
 → Biztos tudás: Mk 9
```

A méregellenállást `10` ellen (**méreg erőssége**) kell dobni, még egy kicsattanó egészségű, 120 kilós barbár is szinte biztos, hogy kidől tőle egy kis délutáni durmolásra.

🔆 Látható, hogy az azonnali hatás és a hosszú bomlási idő húzza fel a Komplexitást: egy fél óra alatt ható, rövidebb eltarthatóságú, ugyanilyen erős méreg jóval könnyebben kikeverhető lenne.

<br />

---
### ⚡ **Könnycsepp a pengén (halálos fegyverméreg)**

```
→ (1) Erősség:        6
→ (2) Súlyosság:      5 (Halál)
→ (3) Hatáskezdet:   +4 (Következő körben)
→ (4) Hatástartam:   +2 (harc végéig / rövid jelenet)
→ (5) Bomlási idő:    2 (10 perc a pengére locsolva)
→ (6) Kimutatási idő: 0 (1 nap)
→ (7) Elállás:        0 (1 holdfordulón belül)
→ (8) Speciális:     +0 (1 komponens, 1 hordozó közeg, nem-sűrű)
```

```
Komplexitás: 19
 → Biztos tudás: Mk 7
```

🔆 A fenti fegyverméreg erőssége az átlagosnál kicsit erősebbnek mondható, de egy magas Edzettséggel bíró áldozat jó eséllyel megússza az elsődleges hatását (halál) és "csak" lebénul, vagy erős bódulatba kerül.

Fontos, hogy amennyiben 10 percen belül nem kerül a pengéről véráramba, akkor nagyon gyorsan elveszíti hatóerejét.

<br />

---
### ⚡ **Múló évszakok (többkomponensű mesteri ital/légiméreg)**

```
→ (1) Erősség:         5
→ (2) Súlyosság:       5 (Halál)
→ (3) Hatáskezdet:    +1 (1 nappal eltolva)
→ (4) Hatástartam:    +5 (hónapok)
→ (5) Bomlási idő:     6  (Örökké)
     (9 hónapos "felépülési" idő miatt,
      lásd a több komponensű méreg szabályát)
→ (6) Kimutatási idő:  0 (1 nap)
→ (7) Elállás:         0  (1 holdfordulón belül)
→ (8) Speciális:     +11
     +4: 3 komponens (+2 +2)
     +3: 2 hordozó közeg (levegő, folyadék)
     +3: csak 1 komponensben van hatóanyag,
     +3: szagtalan/ízetlen
     (a nem-sűrű: +0)
```

```
Komplexitás: 33
 → Biztos tudás: Mk 12
```

Ez már tényleg művészet. Ha a méregkeverő irodalommal foglalkozna ilyen szinten, ünnepelt poéta vagy dalnok lehetne. Ez meg is látszik a rendkívül magas Komplexitáson és a biztos tudás követelményeken - egy ilyen mérget csak a legnagyobb méregkeverők képesek kikeverni.

⚜️ "Az öreg király rajongott az orchideákért. Tavaszra és nyárra is volt egy-egy különleges, ritka fajtája végtelen udvarának kertjében. Tavasszal leszakajtotta a legszebbet a narancsszínből, nyáron a bíborszínből. Mindkettő hálószobáját díszítette.

A nyári virág leszakajtása után az uralkodó este elfogyasztotta bőséges vacsoráját és borral öblítette le, mint mindig. Álma békés volt, olyannyira, hogy reggel már fel sem ébredt... "Öreg volt, szépen ment el" - mondták a szolgálók. Ételét átvizsgálva az udvari vajákosok és a varázsló semmit nem találtak. "Eljött az ideje." - mondták ők is.

Fia nem lévén, unokaöccse lépett helyébe, ki - úgy mondják - már nagyon türelmetlen volt. Aszott, vén tudósa Taba el Ibarából mindig mellette ólálkodott - azt mondják életelixírt készít a hercegnek..."

<br />

🔆 A fenti méreget `3` darab komponensre bontotta a déli vajákos: a király borába (ital hordozó) adagolta hetente egyszer az elmúlt 9 hónapban a szagtalan/ízetlen alapmérget, amely önmagában ártalmatlan, így nem is kimutatható, viszont stabilan felgyűlt a szervezetben. A maradék 2 komponens a 2 orchidea (légi hordozó) virágpora volt, melyet a király belélegzett - hisz mindet a hálószobájába tette. Az első leszakajtása után még nem történt semmi, a hatáshoz mind a kettőre (plusz a borban levő alapméregre) szükség volt.

A hatást a vajákos eltolta egy nappal, hogy éjszaka jöjjön a vég, így a gyanú sem ébredt fel senkiben. Az Erősséget (`5`) bőven elégnek vélte - a király Egészsége (`-1`) már amúgy is igen gyenge lábakon állt.

🔆 Figyeljük meg, hogy a **Bomlási idő** itt nem szabadon választott: mivel a komponenseket `9` hónapon át elnyújtva adagolták, a korábbi adagoknak végig stabilnak kellett maradniuk a szervezetben, amíg a méreg összeállt. Ezért a Bomlási időt ez a "felépülési idő" kényszeríti `6` értékre - lásd a [Bomlási idő](141_mereggenerator.md#5-bomlási-idő) több komponensű szabályát.

A vajákos a **Kimutatási idő** (`0`) és az **Elállás** (`0`) értékeivel "spórolt". Előbbivel némi kockázatot vállalt: nem számított a holttest alapos átvizsgálására, ezért `1 napig` még kimutatható lett volna a méreg. Az utolsó hatóanyag-komponens adagolása pedig gyorsan követte az előállítását (Elállás).

---

⚜️ [Nyitóoldal](szabalyrendszer.md#14-méregrendszer)
