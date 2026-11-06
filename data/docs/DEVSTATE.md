# Szilánk RPG - Fejlesztési állapot

> Konvenciók, build, irányelvek → **AGENTS.md**
> Kódtérkép, fájl-felelősségek → **MAP.md**
> Engine formulák → **engine_spec.md** (§1-§42)
> UI viselkedés → **gui_spec.md**

## Tartalom

- [Nyitott tételek (áttekintés)](#nyitott-tételek-áttekintés)
- [Egységes effekt-modell: maradék](#egységes-effekt-modell-maradék-) 🚧
- [Fegyverek: hangolás és utómunka](#fegyverek-hangolás-és-utómunka-) 🚧
- [Webapp teljes refaktor: terv](#webapp-teljes-refaktor-terv-) 🚧
- [Good to have](#good-to-have-) 💡
- [Fontos adatmodell összefoglaló](#fontos-adatmodell-összefoglaló)
- [Szabálykönyv (md/) konvenciók, tanulságok](#szabálykönyv-md-konvenciók-tanulságok)

---
## Nyitott tételek (áttekintés)

- **Egységes effekt-modell: maradék** (§42) - 2 gyűjtőn kívüli kódút (VÉ-csökkentés, távharci CÉ), böngészős ellenőrzés: Playwright végigkattintás
- **Fegyverek: hangolás és utómunka** - paraméter-hangolási javaslat (jóváhagyásra vár), `raw`→`final`, custom fegyver
- **Webapp teljes refaktor: terv** - 1. (halott kód) kész, döntések megvannak; 0. (ESLint + knip) kész, `any` és `engine/` rétegsértés 0; következő: 6a maradék (`as unknown as`), 2 (fül → fül), 3, 6b, 4, 5, 7 (+8 Python)
- **Good to have** 💡 - Harc alakzatban (§28), Méreggenerátor (§39), ellenfél statblokk nézet (nem sürgős)

---
## Egységes effekt-modell: maradék 🚧

Spec: `engine_spec.md` §42.1-§42.7, kód: `engine/effekt.ts`, naplók: `refactorlog/2026-10-16.md`, `2026-10-18.md`.
Az adat-migráció és a közös gyűjtő + 42.3 motor kész (§42.5); a `calcFortelyMods` / `calcTaktikaMods` burkolók. Nyitott:

- [ ] **VÉ-csökkentés a gyűjtőre**: `harc/ve-csokkentes-calc.ts` `taktikaVéCsökkentésÁllapot` - a fortély `vé_csökkentés` flat-ok saját ciklussal + saját feltétel-ellenőrzéssel, a taktika bázis / szorzó a `hatások` közvetlen szűrésével (§42.6).
- [ ] **Távharci CÉ a gyűjtőre**: `tavharc/helpers.ts` - a helyzet `CÉ` flat és a taktika `módosítók.CÉ` saját ciklusból (§42.6).
- [ ] **Böngészős ellenőrzés**: a §42 szeletek (kocka-hatások, Érzék-választó, támadás-korlát, SP-bontás) egyszer sem voltak végigkattintva. Módszer: **Böngészős (Playwright) tesztelés** (Build scriptek alatt); csak jóváhagyással.
- Tudatos szűkítések (ma nem tüzelnek, új adatnál felülvizsgálandó): §42.6 lista (távharci feltétel-kiértékelő, extra feltétel-kontextus, szorzó-keverék).

---
## Fegyverek: hangolás és utómunka 🚧

Utómunka (a v2 bevezetés lezárult):
- [ ] Balansz `raw` → `final`: mind a 67 fegyver `state: raw` (a `fegyverek.yaml` `state` mezője a mérőszám). Eszközök: `code/fegyvergenerator/` szimulátor + taktikai AI, l. wiki `STUDY.fegyvergenerator_harcszimulacio`.
- [ ] Custom (egyedi, generált) fegyver a karakterben: `fegyverek[].custom` séma-mező + build-time vagy runtime kiértékelés (nyitott döntés) - wiki `STUDY.fegyvergenerator_v2` 4a.

### Bemenő paraméterek hangolása (javaslat, jóváhagyásra vár)

Forrás: `data/sources/fegyverek/fegyverek.yaml` (WORK paraméterek). Szempontok: középkori fegyverismeret + más fantasy RPG-k konvenciói, a Szilánk Fegyvergenerátor modelljén belül (`code/fegyvergenerator/modell.py` `modok()`), a Fegyver extrák (`extrak.yaml`) és a Felszerelés pont (`max(hossz-pont, súly-pont)`, `md/010_03_06`) figyelembevételével.

Az értékek Erő=0 bázisértékek, a generátorral kiszámolva (előtte → utána).

#### A) Ellentmondások (javítás javasolt)

1. **Szigony, egykezes: `hossz` 5 → 3.** A neve egykezes, de a hossz 5 másfélkezes forgatást ad (+ fölösleges "1 kézzel" mód).
```
előtte  másfélkezes  TÉ5 VÉ5 SP+8 Seb7 (+ 1 kézzel)
utána   egykezes     TÉ3 VÉ3 SP+7 Seb7
```
2. **Csatabárd, kétkezes: `hossz` 5 → 7, `akadály` 2 → 1.** Most másfélkezes, "1 kézzel" móddal. A dán bárd / bárdis 1,5 m fölötti, kétkezes kategória (a hossz 7 a Beszorítható extrát is hozza).
```
előtte  másfélkezes  TÉ5 VÉ5 SP+7 Át2 Seb10 (+ 1 kézzel)
utána   kétkezes     TÉ7 VÉ7 SP+8 Át2 Seb11
```
3. **Harci kalapács: ma azonos a Buzogány, kétkezes-sel.** A harci kalapácsnak (bec de corbin, lucerni kalapács) tüskés hátoldala is van: második aktor `lándzsahegy-rövid-keskeny`, `akadály` 2 → 1.
```
utána  zúzó   TÉ7 VÉ5 SP+9 Át0 Seb10  (elsődleges, változatlan)
       szúró  TÉ7 VÉ7 SP+7 Át4 Seb10  (másodlagos, páncéltörő)
```
4. **Tőr, páncélszúró: Átütés 0.** A rondel / misericorde a páncél réseinek áttörésére készült: aktor `pengehegy-tőr` → `pengehegy-kard`. Opcionálisan + `pontos` extra (Precíz támadás).
```
előtte  TÉ3 VÉ3 SP+4 Át0  →  utána  TÉ3 VÉ3 SP+5 Át1
```
5. **Akadály egységesítése.** A hossz 7 körül vegyesen 1 és 2 szerepel. A 2 ("csak szekéren szállítható") az alabárdra / pikára illik, a kétkezes kardot vállon hordták: Kard, kétkezes 2 → 1 (Csatabárd, kétkezes és Harci kalapács: fent). Alabárd, Pika marad 2.

#### B) Realisztikusabbá tétel

6. **Csatacsákány: `súly` nehéz, `akadály` 1 → 0, második aktor `buzogányfej-tompa`.** Az egykezes harci csákány nehéz fejű, jellemzően kalapácshátú; az akadály 1 a schema szerint a lándzsa jellegűeké.
```
utána  szúró  TÉ3 VÉ3 SP+5 Át4 Seb8  (elsődleges)
       zúzó   TÉ3 VÉ1 SP+6 Át0 Seb8
       Felsz. 0→1, Erő-követelmény 2
```
7. **Buzogány, láncos: `súly` átlagos → nehéz.** Ugyanaz a buzogányfej láncon - nem lehet könnyebb az egykezes (nehéz) buzogánynál.
```
előtte  SP+6 Seb8, Felsz. 0  →  utána  SP+7 Seb9, Felsz. 1, Erő-köv. 2
```
8. **Kard, rapír: második aktor `vágóél-egyenes-átlagos` → `-rövid`, + `pontos`, + `zuzo_ellen_rosszabb`.** A rapír éle gyenge, ma mégis a vágómód adja a jobb `TÉ`/`VÉ`-t; precíziós szúrófegyver (mint a Tőrkard), a vékony penge rossz nehéz ütés hárítására.
```
vágómód  előtte TÉ6 VÉ6 SP+5  →  utána TÉ5 VÉ5 SP+4
```
9. **Szigony (egykezes, kétkezes): + `beakadas_kockazat`.** A szakállas hegy pontosan erre való.

#### C) Döntésre vár (nem módosítandó jóváhagyás nélkül)

10. **Ostor, Ostorkard: `hossz` 9 → kétkezes forgatás, Felsz. 2.** Mindkettő egykezes fegyver. Modell-korlát: a forgatás a hosszból jön, nincs "hosszú, de egykezes" kategória. A hossz 5 `TÉ`:-4 veszteség + fölösleges "1 kézzel" mód. Lehetőségek: marad / hossz 5 / felülírható `forgatás` mező (`konstansok.yaml` + séma bővítés).
11. **Erőbónusz-limit 0: Dzsambia, Rövid bot.** Hasonló fegyvereknél 2 (Kés, Furkós bot); bunkónál, ívelt tőrnél az erőnek számítania kell → mindkettő 2. A Béltépő 0-ja marad (a Pocsék védekező extrával tudatos csomag).
12. **Gyanús limitek (csak jelezve):** Kard, kígyó: 1; Kard, szablya: 4; Buzogány, egykezes és tollas: 4. A régi táblából jönnek; ha nincs mögöttük setting-indok, inkább 99 vagy 3.

#### Szándékosan érintetlen

Szilánk-specifikus fegyverek (Slan, Mara-sequor, Pugoss, Ramiera, Emrelin, Meneth), a teszt-minták (Naginata, Wakizashi), a `state` mező (marad `raw`).

#### Végrehajtáskor

- `fegyverek.yaml` módosítás → az `update_fegyvertablazat.yml` workflow (önteszt-kapu + `md_fegyvertablak_sync.py`) újragenerálja a `md/068_0x` táblákat; lokálisan is futtatható.
- Változik a `data/tables/fegyverek_v2.json` → `npm run build` (vitest is); az érintett fegyverekre épülő golden tesztek frissítendők.
- A balansz-önteszt regressziós elvárásait (`teszt.elvart`) egyik javaslat sem érinti.

---
## Webapp teljes refaktor: terv 🚧

Állapot: **0. és 1. fázis kész, döntések megvannak; a 2-9. fázis jóváhagyásra vár** (terv: 2026-11-06, HEAD `d984f69b`). Scope: `web/karakter/src`, opcionálisan
`data/gen`. Nem scope: `md/`, `code/fegyvergenerator/`, viselkedés-változás, új feature.

**Mi ez az egész, egy mondatban?** A program már jól működik; a refaktor nem változtat azon, MIT csinál, csak azon,
hogyan van megírva - hogy könnyebb legyen benne eligazodni, kevesebb helyen kelljen ugyanazt átírni, és kisebb
legyen az esélye a csendes hibáknak.

### Kiinduló mérés

| Mérőszám | Érték | Mit jelent? |
|---|---|---|
| Prod kód / teszt | ~24 100 / ~28 000 sor (92 tesztfájl) | erős a tesztháló, van mire támaszkodni |
| Szó szerinti duplikáció (jscpd) | 0,35% (10 klón, 114 sor) | a copy-paste már elfogyott (2026-10-17-i refaktor) |
| `engine/` → `components/` import | 6 | a "motor" a "kijelzőből" vesz kódot - fordított függés |
| Fül → fül import | 18 irány | a fülek egymás belsejébe nyúlnak |
| Lineáris `find` entitás-keresés | 150+ (fegyver 76) + 28 kézi kisbetűs névösszevetés | mindenki máshogy keres ugyanabban az adatban |
| `any` / `as unknown as` | 34 / 10 | itt a típusellenőrző "be van kötve a szeme" |
| Nem hivatkozott CSS osztály / halott export | 26 / 2 (+4 csak tesztből) | jelöltlista, egyenként ellenőrizendő |
| Lint | nincs ESLint | csak a `tsc` strict őrzi a kódot |

### Alapelvek (minden lépésre)

- **Viselkedés nem változik.** Előbb regressziós háló (minta: `effekt.regresszio` - a régi kóddal rögzített snapshot),
  utána az átírás. *Dummies:* előbb lefényképezzük, mit számol ma a program, és az átírás után összevetjük - ha egy
  szám is eltér, megállunk.
- **Egy szelet = egy commit**, minden szelet után `npm run build`. *Dummies:* kis lépések, mindegyik után "működik
  még?" - így egy hiba mindig egy kis változtatásra vezethető vissza.
- Törlés előbb, mint új absztrakció; új közös helper csak legalább 3 hívóval.
- Fázisonként `refactorlog` napló + `MAP.md`; böngészős ellenőrzés csak jóváhagyással.

### Ajánlott sorrend

Szempont: (1) ami a többit előkészíti, az előbb; (2) azonos helyzetben a kisebb kockázatú előbb. A fázisszámok
azonosítók (a lenti szekciókra mutatnak), nem sorrendet jelentenek.

| # | Lépés | Kockázat | Miért itt? |
|---|---|---|---|
| ✅ | 1. Halott kód | kicsi | kész (2026-11-06) |
| ✅ | Döntési pontok | - | eldöntve (2026-11-06), l. lent |
| ✅ | 0. Tooling: ESLint + knip | kicsi | kész (2026-11-06) |
| 2 | **6a. Típusosság:** ~~`any`~~ (kész) / `as unknown as` / `eslint-disable` (a session-toggle séma nélkül) | kicsi | minden későbbi átírásnál a `tsc` a fő háló - előbb vegyük le a vakfoltokat |
| 3 | **2. Rétegek és modulhatárok** (az `engine/` rész kész; maradt: fül → fül) | közepes (gépies, a `tsc` fogja) | a 3-5. fázis új kódja ide kerül (`engine/`); előbb legyen meg a hely és a szabály |
| 4 | **3. Lookup-réteg** | közepes | a 4. és 5. fázis már az indexet használja - különben kétszer írnánk át ugyanazt |
| 5 | **6b. Típusfájlok bontása + session-toggle tipizált mező** | kicsi-közepes (localStorage invalidálódik) | a 2. fázis utánra, amikor a fájlhelyek már véglegesek |
| 6 | **4. Párhuzamos kódutak** (benne: "Egységes effekt-modell: maradék" fent) | közepes | kell hozzá a 2. (hova), a 3. (lookup) és a 2. döntési pont |
| 7 | **5. Nagy komponensek szétbontása** | közepes-magas | a legkockázatosabb; addigra a logika már a helyén van, a komponensben csak az állapot és a megjelenítés marad. Böngészős háló kell |
| 8 | **7. CSS** | kicsi, de teszt nem védi | az 5. fázis után, mert az 5. a popupokat szétszedi - különben a stílusokat kétszer mozgatnánk |
| - | **8. Python pipeline** | kicsi | független, bármikor beilleszthető (döntés: benne van) |
| 9 | **9. Lezárás** | nincs | fázisonként részlegesen (MAP / refactorlog), a végén összesítve |

*Dummies:* mint egy lakásfelújításnál - előbb eldöntjük, mi hova kerül (döntések), megjavítjuk a mérőműszert
(típusok), kijelöljük a szobákat (rétegek) és felcímkézzük a dobozokat (lookup); a bútorokat (komponensek) csak
utána rendezzük át, a festés (CSS) pedig a legvégére marad, hogy ne kelljen kétszer festeni.

### Fázisok

**0. Tooling: ESLint + knip** - **KÉSZ (2026-11-06)**, napló: `refactorlog/2026-11-06.md` (2. rész)
`eslint` 10.13.0 + `typescript-eslint` 8.72.0 + `eslint-plugin-react-hooks` 7.1.1 + `knip` 6.42.1 (pontos verzió);
`web/karakter/eslint.config.js`, `knip.json`; `npm run lint` (eslint + knip), a `build` a HIBA szintű ESLint-jelzésen áll meg.
Rétegszabály: a beépített `no-restricted-imports` (`engine/**` → `components/**` tiltva; a 6 ismert sértés `effekt.ts` /
`ketkezes.ts`-ben figyelmeztetésre engedve - a 2. fázis törli a kivételt). Közben: `useHarcComputed` → `calcHarcComputed`
(`harc-computed.ts`; nem hook volt, csak a neve), 28 nem használt barrel / re-export törölve.
Alapszint (figyelmeztetés): 50 `no-explicit-any` (37 prod / 13 teszt, → 6a. fázis), 17 `exhaustive-deps` (→ 5. fázis,
egyenként: szándékos-e), 6 rétegsértés (→ 2. fázis). A 3 szándékosan szűk deps-lista indoklást kapott.

*Dummies:* eddig egyetlen automata ellenőr volt (a `tsc`, ami a típusokat nézi). Most kettő érkezik mellé: az
**ESLint** a "házirendet" figyeli (pl. "a motor nem nyúlhat a képernyőkhöz"), a **knip** pedig rendszeresen megkeresi
a senki által nem használt kódot - amit az 1. fázisban kézzel, scripttel kerestünk.

*Háttér (webes fogalmak):* a **devDependency** csak fejlesztéshez kell, a böngészőbe letöltött appba nem kerül bele
(a bundle nem nő). Az **ESLint** a JavaScript/TypeScript világ szabványos kódellenőrzője: szabályokból áll, mindegyik
hiba vagy figyelmeztetés szintű. A `react-hooks` szabályai a React hookok két buktatóját fogják meg: hook csak a
komponens tetején hívható (feltételben nem), és a deps-listából ne maradjon ki változó. A **knip** a teljes import-gráfot
bejárja (mint az 1. fázis saját scriptje, csak teljesebben), és listázza a nem használt fájlokat, exportokat, függőségeket.
Csapda: az első futás sok jelzést ad - ezért szűk szabálykészlettel indulunk, és a meglévő sértéseket előbb listázzuk,
nem egyszerre javítjuk.

**1. Halott kód és üres indirekció** - **KÉSZ (2026-11-06)**, napló: `refactorlog/2026-11-06.md`
(6 törölt fájl: 5 prod + 1 teszt; 6 halott export, 20 export szűkítve, 18 CSS osztály; +37 / −241 sor, build zöld).

*Dummies:* kidobjuk, amit senki nem használ. A "re-export shim" egy üres fájl, ami csak annyit mond: "az igazi máshol
van" - felesleges kerülőút. Kevesebb kód = kevesebb, amit olvasni és karbantartani kell.

*Háttér (webes fogalmak):* egy TS/TSX fájl egy **modul**; amit `export`-tal kitesz, azt más fájl `import`-tal
használhatja (mint egy C-s header publikus függvényei). A **re-export** (`export { X } from '../X'`) csak továbbadja
egy másik fájl tartalmát - régen azért készült, hogy a régi útvonalon is működjön az import. A **CSS osztály** egy
névvel ellátott megjelenési szabály (`.extrak-badge { color: … }`), amit a HTML-elem `className`-je hivatkoz; ha
semmi nem hivatkozza, a böngésző feleslegesen tölti le. Csapda: a név néha futás közben áll össze
(`className={'extrak-badge-' + állapot}`), ezért a szövegkeresés "nem használtnak" láthatja - ezt kézzel kell kizárni.
A törlés biztonsági hálója a `tsc` (TypeScript fordító): ha valami mégis használta a törölt exportot, fordítási hibát ad.

**2. Rétegek és modulhatárok** - közepes kockázat, ~2 nap
- ✅ **`engine/` → `components/` rétegsértés: 0 (2026-11-06).** Az `extrak-effekt.ts` + `extrak-info-calc.ts` (+ tesztjeik)
  `engine/`-be költözött; `interpolateFokDef`, `ideaDelta`, `buildPajzsFegyverNév` → `engine/utils.ts`; `FegyverResultMód`,
  `UndoPatch` / `UndoEntry` → `engine/types.ts`. A szabály (`no-restricted-imports`) hiba szinten él, kivétel nélkül.
- [ ] Szabály a doksiba (`AGENTS.md`): `engine/` = tiszta számítás, React és `components/` import nélkül; fülek közti közös
  logika → `engine/`, közös UI → `components/common/`.
- [ ] A 18 fül → fül import feloldása (+1: `tavharc` → `tulajdonsagok/proba-common`, 1. fázis); `harc/index.ts` /
  `harcertekek/index.ts` barrel: rendes API vagy törlés.
- [ ] Őrző szabály a fül → fül importokra (`no-restricted-imports`, csak `components/common/` engedett) - a 18 irány feloldása után.
  (A `harc/shared.ts` `mf-utils` re-exportja és az `aktiv/AktivHelpers.ts` barrel is ide tartozik.)
- [ ] Mappaszerkezet (döntés): a csak egy fülhöz tartozó `*-calc.ts` a fül mellett marad; ami több fülön kell, `engine/`-be megy.

*Dummies:* a motor (szabályszámítás) ne függjön a műszerfaltól (képernyők). Ma a motor néhány alkatrészt a
Harc fül fiókjából vesz elő - ha valaki a Harc fület átrendezi, a motor eltörik. Rendrakás: minden közös alkatrész
a motorba kerül, a fülek csak onnan vesznek, egymás fiókjába nem nyúlnak.

*Háttér (webes fogalmak):* a webapp két fő része: az `engine/` sima TypeScript függvények (bemenet → kimenet,
nincs képernyő), a `components/` pedig **React komponensek** - függvények, amik az adatból a képernyő egy darabját
(HTML-t) állítják elő. Ez a klasszikus "üzleti logika vs. megjelenítés" (MVC-szerű) szétválasztás. A jó irány:
a komponens hívja a motort, fordítva soha - így a motor képernyő nélkül, egységtesztben is futtatható, és egy
képernyő átírása nem érinti a számítást. A **barrel** (`index.ts`, ami több fájl exportjait egybegyűjti) kényelmes
"bejárat" egy mappához; ha félig van kitöltve, csak megtéveszt. Az **őrző teszt** egy kis automata, ami minden
buildnél végigolvassa az `engine/` fájlok `import` sorait, és hibát jelez, ha valaki `components/`-ből importál.

**3. Lookup-réteg a GameData-ra** - közepes kockázat, 1-2 nap
- [ ] `engine/lookup.ts`: a `data-loader` EGYSZER épít indexet (id és kanonikus név szerint) fegyverre, fortélyra,
  képzettségre, taktikára, helyzetre, státuszra, manőverre, extrára.
- [ ] A 150+ `find` és 28 kisbetűs összevetés átállítása; ismeretlen névre a viselkedés marad (`undefined`, nem dob) - teszttel.

*Dummies:* ma a program minden alkalommal végiglapozza az egész "fegyverkönyvet", hogy megtaláljon egy fegyvert,
és mindenhol kicsit másképp (hol kisbetűsítve, hol nem). Helyette egyszer készül egy tárgymutató, és mindenki abból
keres - gyorsabb, és nem lehet "elnézni" egy nevet.

*Háttér (webes fogalmak):* a játékadat (fegyverek, fortélyok, …) induláskor JSON-fájlokból töltődik be a böngészőbe,
egy nagy `GameData` objektumba, benne tömbökkel (listákkal). A `tömb.find(x => x.név === keresett)` elejétől
végéig végignézi a listát (O(n)). A **`Map`** a JavaScript beépített hash-táblája (mint a Python `dict`): kulcs
alapján azonnal ad értéket. A "kanonikus név" azt jelenti, hogy a kulcsot egyszer, egységesen normalizáljuk
(pl. kisbetűre), és utána mindenki ugyanazzal a kulccsal keres. A sebességnyereség itt kicsi (pár száz elem), a fő
haszon az egységesség: ma 28 helyen kézzel `toLowerCase()`-szel hasonlít a kód, és ha egy helyen kimarad, az
csendes hiba (a fegyver "nem található", hibaüzenet nélkül).

**4. Párhuzamos kódutak egyesítése** - közepes kockázat, ~2 nap
- [ ] §42 maradék (l. "Egységes effekt-modell: maradék" fent): VÉ-csökkentés, távharci CÉ, `collectTaktikaLetiltások`.
- [ ] Közös `feltételKontextus(k, session, data, fegyver?)` helper a 14 kézi `buildAktívFeltételek` / `createFeltételEvaluator`
  összerakás helyett (2 `ponytail:` szűkítést is megold).
- [ ] `rules.json` képletek TS-másolatai (`manover-dobas-calc.ts` `manőverPontKéplet`, `felszereles.ts` páncél-lefedettség)
  → közös `evalRule(data.rules, id, inputok)` az `engine/reactive.ts`-ben (`evalFormula` fölött; a `data.rules` már a
  GameData-ban van). A két másolat és a `rules-tukor` teszt törlődik (döntés: (b)).
- [ ] Kis klónok: `AkadalySection`↔`FelszerelesSection`, `ProbaHub`↔`TulajdonsagokScreen`, `AktivHelyzetek`↔`AktivTaktikak`,
  `TamadoDobasPopup`↔`CelzoDobasPopup`, `ImportOptionsPopup`.

*Dummies:* ez a "rejtett duplikáció": a kód nem szó szerint ismétlődik, de ugyanazt a szabályt két helyen, kétféleképp
számolja ki. Ha a szabály változik, és csak az egyik helyen javítják, a két hely csendben mást mond. Cél: minden
szabály EGY helyen éljen.

*Háttér (webes fogalmak):* a karakter értékeit (TÉ, VÉ, SP, …) a `data/rules.json` képletei számolják egy saját
**reactive engine**-nel: mint egy táblázatkezelő, ha egy cella (pl. Erő) változik, a rá épülő cellák automatikusan
újraszámolódnak. Néhány felugró ablak (popup) viszont nem ezt a motort hívja, hanem a képlet egy kézzel írt TS
másolatát - ez a "TS-másolat". Ma egy teszt (`rules-tukor`) ellenőrzi, hogy a kettő egyezik; a (b) opció a másolatot
törölné, és a popup is a motort kérdezné meg. A **feltétel-kontextus** az a "pillanatkép", ami alapján egy feltételes
hatás eldől (pl. "csak ha Belharcban vagy"): melyik helyzet, taktika, fegyver aktív. Ma ezt 14 helyen külön rakja össze
a kód - és ahol egy elem kimarad, ott a feltétel csendben hamis lesz.

**5. Nagy, állapotgazdag komponensek szétbontása** - közepes-magas kockázat, ~3 nap
- [ ] `ManoverDobasPopup` (458 sor, 14 `useState`) + `manover-dobas-calc` (482), `KepzettsegProbaPopup` (382, 16),
  `HarcScreen` (333, 15), `SebzesPopup` / `TamadoDobasPopup` / `CelzoDobasPopup` közös váz, `App` + `AppOverlays`.
- [ ] Minta (2026-10-17 próba-modul): tiszta `*-calc.ts` + `use*` állapot-hook (useReducer) + `*Reszek.tsx` megjelenítő részek.
- [ ] A szándékosan szűk deps-listák (`useSérültStátusz`, `useAkadalyStatusz`) NEM javítandók. Böngészős ellenőrzés javasolt.

*Dummies:* néhány képernyő-darab "mindenes": egyszerre számol, emlékszik 15 dologra és rajzol. Szétszedjük három
szerepre: számoló (tesztelhető), emlékező (állapot) és rajzoló (megjelenés). Külön-külön mindegyik érthető.

*Háttér (webes fogalmak):* a React komponens minden változáskor újra lefut, és újrarajzolja a képernyő-darabját.
Ami két futás között megmarad (pl. "melyik kocka van kiválasztva", "nyitva van-e az al-ablak"), az **állapot**, és a
`useState()` hívással kérhető - minden `useState` egy külön változó. 15 ilyen egy komponensben azt jelenti, hogy
15 egymásra ható változót kell fejben tartani. A **hook** (`use…` nevű függvény) egy komponensből kiemelt, újra
felhasználható állapot + logika csomag. A **`useReducer`** az összetartozó állapotokat egy objektumba gyűjti, és
csak megnevezett "műveletekkel" engedi módosítani (`{ type: 'kockaVálasztás', … }`) - mint egy kis állapotgép,
így nem kerülhet ellentmondásos állapotba. A **deps-lista** (`useEffect(…, [a, b])`) mondja meg, mikor fusson újra
egy mellékhatás; a "szándékosan szűk" lista azt jelenti, hogy tudatosan NEM fut újra minden változásra (különben
felülírná a játékos kézi választását) - ezt a refaktor nem "javíthatja ki". Mivel a komponens-viselkedésre kevés
automata teszt van, itt a **Playwright** (programból vezérelt böngésző, ami végigkattintja a felületet) adja a hálót.

**6. Típusosság** - kis kockázat, ~1 nap
- ✅ **`any`: 0 (2026-11-06)**, a `no-explicit-any` hiba szinten (6a). Közben: `getExtraFokok` típusos + a duplikált
  fok-extrapoláció helperbe vonva; 3 elavult teszt-fixture javítva (l. refactorlog).
- [ ] 10 `as unknown as` (pl. session-toggle fortély) → tipizált mező / type guard (nincs backward-compat).
- [ ] `data-types.ts` (399) + `types.ts` (333) domainenkénti bontása; a 4 `eslint-disable` felülvizsgálata.

*Dummies:* a TypeScript egy helyesírás-ellenőrző a kódhoz. Az `any` és az `as unknown as` azt mondja neki: "itt ne
nézd". Ezeket a vakfoltokat szüntetjük meg, hogy az elírásokat a fordító fogja meg, ne a játékos.

*Háttér (webes fogalmak):* a **TypeScript** a JavaScript típusos változata; a böngésző csak JavaScriptet ért, a
típusok a fordításkor (`tsc`) ellenőrződnek, és utána eltűnnek. Az `any` típus kikapcsolja az ellenőrzést az adott
értékre; az `as unknown as X` pedig "kényszerített típuskonverzió" (mint C-ben egy `void*` cast): a fordító elhiszi,
hogy az érték X, akkor is, ha nem az. A **type guard** egy kis függvény, ami futás közben ellenőrzi az alakot, és
utána a fordító is tudja a pontos típust. A nagy típusfájlok (`types.ts`, `data-types.ts`) bontása csak rendezés:
a karakter, a session (harc közbeni állapot) és a játékadat típusai külön fájlba kerülnek. Az **eslint-disable**
egy kódellenőrző figyelmeztetés kézi elnémítása - mind a 4-et újra kell nézni, indokolt-e még.

**7. CSS** - kis kockázat, ~1 nap
- [ ] `HarcScreen.css` (1361 sor): fülön kívül is használt szabályok → `styles/common.css`, popup-stílus a komponens mellé.
- [ ] Ismétlődő szín / térköz / radius → CSS változók. Vizuális előtte / utána screenshot (jóváhagyással).

*Dummies:* a megjelenés szabályai rendet kapnak: ami közös, egy helyre; a gyakran ismétlődő színek nevet kapnak,
így egy szín cseréje egy sor, nem húsz.

*Háttér (webes fogalmak):* a **CSS** írja le, hogyan néz ki egy HTML-elem (szín, méret, elrendezés). A CSS
szabályok globálisak: egy `HarcScreen.css`-ben definiált osztály a Tulajdonságok fülön is hat, ha ott is ugyanazt
a nevet használják - ezért egy fül fájljában "elrejtett" közös szabály törékeny (a fül CSS-ének takarításakor
máshol is eltörhet a kinézet). A **CSS változó** (`--szín-kiemelés: #c33;`, használat: `color: var(--szín-kiemelés)`)
egy névvel ellátott érték, mint egy konstans a kódban; a sötét/világos téma is ezen keresztül kapcsolható. Mivel a CSS
hibáit semmilyen teszt nem fogja meg, a háló itt **screenshot-összevetés**: előtte és utána ugyanarról a képernyőről
kép, és a kettőnek egyeznie kell.

**8. Python pipeline (`data/gen`)** - kis kockázat, ~0,5 nap (döntés: benne van)
- [ ] `validators.py` ismétlődő hibaüzenet- / ciklusmintái, `generate_tables.py` orchestration. Minden gate-re negatív teszt.

*Dummies:* a YAML → JSON "fordító" kis takarítása. Kicsi (1500 sor), alacsony nyereség.

*Háttér:* a játékadat ember által szerkesztett YAML-ben él (`data/sources/`), a webapp viszont JSON-t tölt be.
A `generate_tables.py` buildkor átalakítja, közben **build-gate**-ekkel ellenőriz (séma, elnevezés, hivatkozások):
hibás adatnál a build megáll. A **negatív teszt** azt nézi meg, hogy egy szándékosan elrontott adatra a gate
tényleg bukik-e - különben egy rossz útvonal miatt csendben "mindent rendben" mondhatna.

**9. Lezárás**
- [ ] `MAP.md`, `AGENTS.md` (rétegszabály, lookup-konvenció), `engine_spec` §42.6, DEVSTATE sync, összesítő refactorlog
  (sor- és bundle-mérleg; 2026-10-17-i bundle: 781 kB).

*Dummies / háttér:* a térkép (`MAP.md`: mi melyik fájlban van) és a szabályok (`AGENTS.md`: hogyan írunk kódot)
frissítése, hogy a következő fejlesztő (ember vagy AI) az új rendet találja, ne a régit. A **bundle** az a pár
JavaScript-fájl, amit a `vite build` az összes forrásból összecsomagol, és a böngésző letölt; a mérete jó "mérleg":
a refaktor után nem nőhet érdemben. A **refactorlog** a projekt naplója: mit, miért, milyen csapdába futottunk.

### Döntési pontok

Eldöntve (2026-11-06):

1. **Tooling: ESLint + knip** devDependency-ként → új 0. fázis.
2. **`rules.json` TS-másolatok: (b) `evalRule`** helper, a másolatok és a tükörteszt törlődnek (4. fázis).
3. **Mappaszerkezet: fül mellett, közös → `engine/`** (2. fázis).
4. **8. fázis (Python): benne van.**
5. Ütemezés: fázisonként külön jóváhagyással (a steering szerint is).

---
## Good to have 💡

Nem sürgős, ma nem okoz hibás értéket; nagyobb vagy jóváhagyást igénylő tételek.

### Harc alakzatban

Előfeltétel: `md/065_04_harc_alakzatban.md` véglegesítése. Engine spec: §28 (TERV).

Összefoglaló: min 3 – max 20 fő; Támadó/Védekezőszint = MIN(csapat Alakzatharc) + Vezető×2 + MIN(fortély fok)×2. Alakzat TÉ/VÉ = AVG(tagok) + harcmodor_bónusz(szint). Már implementált: Alakzatharc képzettség (max_HM-be számít).

TODO:
- [ ] Alakzat típusok spec_lista bővítés
- [ ] NJK Alakzat kalkulátor (KM eszköz overlay)
- [ ] "Alakzat ellen" helyzet (VÉ csökk mérséklés -2, taktika tiltások)
- [ ] Taktika megkötések: Fárasztó/Kezdeményező/Kiváró/Visszafogott tiltott alakzat ellen

### Méreggenerátor

Forrás: `md/141_meregkeveres_szabalyai.md`. Engine spec: §39 (TERV).

Összefoglaló: Komplexitás = Erősség + Súlyosság + Elállás/Hatóidő + Speciális. Min Mk = MAX(CEIL(Kompl/2), param küszöb). 4 típus (étel/légi/kontakt/fegyver).

Nyitott kérdések: wiki `TODO.meregrendszer` (Alvás kategória, másodlagos hatás, alapanyag köv., érzékelés célszám).

TODO:
- [ ] Konstansok YAML: méreg paraméter táblák
- [ ] Méreggenerátor overlay (KM eszköz)
- [ ] Preset mérgek (144_peldamergek.md)

### Ellenfél statblokk nézet

Egy KM-nézet, ahol megadható az ellenfél statblokkja (páncélosztály, SFÉ, VÉ, aktuális harci helyzete), hogy a ma KM-re bízott, ellenfél-függő effektek (sebzésjelleg×páncél mátrix, `cél_páncél` és `ellenfél_harci_helyzet:*` feltételek) ténylegesen kiértékelődjenek. Ma csak részei léteznek: a Sebzés popup „Ellenfél páncél" választója pontszerű input, a `hiányzóInfósExtrák` (`extrak-effekt.ts`) pedig KM-warning badge-ként jelzi a nem-eldönthető hatásokat. Új feature - UX-tervezés + gui_spec szekció + jóváhagyás kell (hol él az állapot, harc idejére/NJK-ból, milyen részletes).

---
## Fontos adatmodell összefoglaló

### Karakter séma (v2)
- Egyetlen JSON (`karakter + session`), NEM tartalmaz számított értékeket. Séma: `data/schemas/karakter.yaml`, típus: `engine/types.ts`
- `session`: runtime harc state (vé_csökkenés, aktív_taktikák, fegyverfogás, stb.)
- `előtörténet`: biográfiai mezők (`{ származás_helye, szociális_érzék, külső, előtörténet }`) - Előtörténet overlay (🪪)
- `felszerelés`: kézi tárgyak (`tárgyak[]`, `méret`) + `kizárt_auto` (pajzs/páncél); a fegyver a saját `felszerelésben` flagjét használja (→ engine_spec §15)
- `napló[]`, `jegyzetek`: kaland-bejegyzések, szabad jegyzet (Verziók/Napló/Jegyzetek overlay)
- `checkpoints[]`: kiemelt karakter verziók (snapshot-alapú, → engine_spec §31b)
- Multi-slot localStorage: `szilank_char_{uid}`, max 16 slot, ebből max 10 NJK (`ui-constants.ts`: `MAX_KARAKTER_DB`, `MAX_NJK_DB`)
- Template / teszt karakterek: `data/karakter/` (`empty_karakter.json`, `test_karakter2.json` = single source of truth, `test_karakter3.json`)

### Képzettségek
- `többszörös`: `[]`=egyszeri, `["X","Y"]`=fix lista, `["*"]`=freetext
- Harci → Harcértékek fül; Misztikus → Misztikus fül; többi → Tul/Képz

### Fortélyok
- Tárolás (séma v3): `{ id, elem, fok, kiérdemelt? }` - `id` = a fortély yaml `id`-je, `elem` = többszörös példány; a név csak megjelenítés (`engine/azonosito.ts`)
- Locked (a Harcértékek fülről kezelt): Mesterfegyver, Pajzshasználat, Merevvértviselet
- Effekt-módok (`konstansok.yaml` → `effekt_módok`, build-validált, §42.2): `flat`, `szorzó`, `scaled`, `override`, `max_limit`, `előny`, `hátrány`, `enyhít`, `letilt`, `szöveges`
- Részletek → engine_spec §16, §16.1, §24, §25, §42

### Fegyver v2 adatmodell
- Runtime táblák (a webapp ezeket olvassa): `data/tables/fegyverek_v2.json` (72 közelharci fegyver + 3 pajzs), `data/tables/tavfegyverek_v2.json` (28 távfegyver), `sebzesjelleg_pancel_matrix.json`, `fegyver_extrak.json`. Generátor: `data/gen/fegyverek_v2.py` (build-gate).
- Források: `data/sources/fegyverek/` - `fegyverek.yaml` (WORK paraméterek, a generátor modellen át), `fegyverek_fixed.json` (kézzel írt kivételek: Garott, hárítók, Kopják, pajzsok - `aktor: "kivétel"`), `tavfegyverek_fixed.json`, `extrak.yaml`, `konstansok.yaml`, mátrix.
- Egy fegyvernek EGY rekordja van (nincs külön 1K/2K entry). `FegyverAlap`: név, kategória, fegyverhossz, akadály, súly, övön_hordható, ár (ár-modell: §43.2; a generált fegyvereknek példány-független alapár, a `fegyverek_fixed.json` kivételeké `null`), idea_default, erő_követelmény, extrák, `módok[]`. Mesterfegyver fok és Idea a karakter-példányon.
- `FegyverMod` (aktoronként egy): aktor, jelleg (`zúzó` / `szúró` / `vágó-egyenes` / `vágó-íves`), sebzéstípus (`elsődleges` = 1. aktor / `másodlagos` = a többi), TÉ, VÉ, SP, Átütés, Sebesség, Forgatás, Erőlimit, FP. A másfélkezes fegyver minden aktorához egy `másfélkezes · 1 kézzel` mód is tartozik (max 4 mód / fegyver).
- Fegyverhossz-kategória: egész skála `0`-`12` (generált fegyverek: 0, 1, 2, 3, 5, 7, 9, 12); a fixed rétegben `-1` = speciális (Garott) és `4` (Kopják).
- Kétkezes harc limitek (`konstansok.yaml`): `kétkezes_harc_max_egy_fegyver: 3` (per-fegyver fegyverhossz plafon) + `kétkezes_harc_max_fegyverméret: 6` (két fegyver össz fegyverhossza) + `kétkezes_harc_fegyverlevonás_osztó: 2` (harckeret-levonás = `floor(összFegyverhossz / 2)`). Motor: `engine/ketkezes.ts`.
- Fegyverviszony küszöb: Fegyverelőny/Fegyverhátrány 2 fegyverhossz-kategória különbségnél áll be (Fegyverazonosság a semleges eset).
- A régi v1 (`data/patterns/*_pattern.json`, `fegyverek.json`, `pajzsok.json`, `tavfegyverek.json`) KIVEZETVE, archiválva (`archive/data_fegyverek_v1/`).
- Részletek → engine_spec §5-§13, §17, §26-§27

### Taktikák / Helyzetek
- Taktika (`taktikak.yaml`, 19 db): kombó (`kombó_mód` + `kombó_lista`), `megkötések`, `hatások` (`{mód, cél, érték, feltétel?}`, pl. `vé_csökkentés`; §42.3 precedencia), fokozatos taktikák (`fokozatos` + `fokok`)
- Harci helyzet (`harci_helyzetek.yaml`, 39 db): `kizár_helyzetek` (id), `tiltott_fegyverfogások`, `tiltja_taktikákat`, `tiltások[]` (nevesített, fegyverenként kiértékelve, `tiltás:<id>`), `fegyver_override` (alapérték-csere, alcél `felszerelés:fegyver`; pl. Belharc: a túl hosszú fegyver alap `TÉ`/`VÉ` = 0), `hatások` (`{mód, cél, érték, alcél?}`, §42)
- Részletek → engine_spec §21

### Reactive Engine
- 57 szabály `data/rules.json`
- Maradék TS: Fájdalomtűrés, Kétkezes harc, Fortély mods, Taktika mods
- Részletek → engine_spec §41

### Build pipeline
- `generate_tables.py`: belépési pont (CLI + freshness + sorrend), a generátorok a `data/gen/` csomagban (Vite buildStart + prebuild)
  - `gen/common.py` (útvonalak, YAML/JSON I/O, magyar rendezés) · `gen/cache.py` (hash-alapú skip) · `gen/schema.py` (séma validáció) · `gen/{konstansok,kepzettsegek,fortelyok,fajok,aktiv_ful,fegyverek_v2}.py` · `gen/validators.py` (referenciális ellenőrzések) · `gen/naming_lint.py` (YAML naming build-gate) · `gen/kiterjesztes_check.py` (képzettség md ↔ kiterjesztesek.json szinkron build-gate, 2026-10-28)
  - **Séma validáció**: minden source entitás kulcshalmazát a `schemas/*.yaml`-hoz méri (ismeretlen kulcs / hiányzó kötelező mező → build hiba). Kötelezőség a séma megjegyzéseiből: `# opcionális` → elhagyható, `# generált` → a generátor adja hozzá
  - Hash-alapú skip: ha a YAML source-ok nem változtak, automatikusan kihagy (`tables/.sources_hash`)
  - Marker fájl: `tables/.generated_marker` - Vite plugin ezt nézi freshness check-hez
  - `--force` flag: kényszerített újragenerálás (`python3 generate_tables.py --force`)
- `vitest run`: unit tesztek (build előtt fut)
- Deploy: GitHub Pages, auto-deploy push master
- Metadata: `ÉV.ÉVNAPJA.napibuild` - a `public/metadata.json` és a bundle `__APP_VERSION__` ugyanabból a fájlból jön (egy build = egy verzió)

### Cache / friss verzió (GitHub Pages)

A Pages `Cache-Control: max-age=600`-at ad az `index.html`-re, és **nem** engedi headert állítani. Két védelem:
1. **Adat cache-busting**: minden runtime JSON kérés `?v={APP_VERSION}`-nel megy (`data-loader.ts`) → deploy után sosem jön régi tábla új bundle-hez.
2. **Verzió-ellenőrzés indításkor** (`engine/version-check.ts`, `main.tsx`): `metadata.json` `no-store` kéréssel; ha a szerver verziója ≠ a bundle verziója, a böngésző elavult HTML-t szolgált ki → egyszeri, `?v=`-vel cache-kerülő újratöltés, a `#hash` (megosztott karakter) megőrzésével. Loop védelem: sessionStorage (`szilank_reload_version`), 1s timeout, hibánál csendben tovább. A `?v=` utána `replaceState`-tel eltűnik a címsorból.

Korlát: a 2. pont kódja az ÚJ bundle-ben él, tehát egy már beragadt (elavult HTML-t futtató) klienst nem gyógyít meg visszamenőleg - ott egyszeri hard refresh kell. A HTML cache teljes kikapcsolásához CDN kell a Pages előtt.

### Build scriptek

A natív Linux fájlrendszeren (`/repo/github/szilank.code/`) a teljes build ~30s, ezért **mindig `npm run build`-et használunk** (nincs szükség inkrementális variánsokra).

| Script | Mikor használd | Idő |
|--------|---------------|-----|
| `npm run build` | **Mindig ezt használd** - teljes: test + typecheck + bundle | ~30s |
| `npm run build:fast` | Elérhető, de nem használjuk (tesztek nélkül) | ~8s |
| `npm run build:changed` | Elérhető, de nem használjuk (git-based teszt szűrés) | ~10s |
| `npm run test` | Csak tesztek futtatása (build nélkül) | ~5s |
| `npm run test:changed` | Elérhető, de nem használjuk | ~2s |
| `npm run generate` | YAML→JSON generálás (skip ha nincs változás) | ~0.5s / ~3s |

Inkrementális működés:
- **TypeScript**: `incremental: true` + `tsBuildInfoFile` → változatlan fájlok skip
- **generate_tables.py**: MD5 hash az összes YAML source + a teljes generátor kód (`generate_tables.py` + `gen/*.py`) alapján
- **Vite plugin**: `tables/.generated_marker` mtime vs a source YAML-ok ÉS a generátor `.py` fájlok mtime-ja
- **vitest --changed**: git diff-ből határozza meg az érintett teszteket

### Böngészős (Playwright) tesztelés (módszer)

Mikor érdemes: ha az egységtesztek + regressziós snapshotok (`statusz-proba.regresszio`, `combat-roll-info.regresszio`, `effekt.regresszio`, `karakter.regresszio`) szerint az ÉRTÉKEK helyesek, de a **megjelenítést vagy a kattintási folyamatot** (popup-sorrend, chip-feliratok, állapot-átmenetek) kell élőben ellenőrizni - amit a unit teszt nem fog meg. Tipikus kiváltó ok: dobás-popup / effekt-UI átalakítás, új picker, státusz-megjelenítés.

Alapszabály: **költséges, ezért előbb MINDIG kérdezz rá** (l. steering `workflow.md` → Böngészős tesztelés). Alapértelmezés: build + unit tesztek; böngésző csak jóváhagyással.

Setup (ha jóváhagyott): telepítés `/tmp/szilank-pw` (pinned playwright) + `~/.cache/ms-playwright`, a repóba NEM kerül. `npm run dev` (localhost:5173), mobil viewport (pl. 390×844) + egy asztali. Teszt karakter: `data/karakter/test_karakter2.json` (Kard, lovag + Tőr, közepes pajzs, Erő 3); a fortélyok / státuszok / taktikák az app UI-ján vehetők fel. A teszt-eset az aktuális munkához igazodik; a lenti minták újrahasználható ellenőrző-receptek (effekt-/dobás-UI jellegű munkához).

Ellenőrző-minták (effekt / dobás-UI jellegű változáshoz - bővíthető):
- **Képzettségpróba, Érzékvesztés** (`statusz-proba.ts`, `KepzettsegProbaPopup.tsx`): `Érzékvesztés: Látás (2)` → Észlelés próba: felirat nélküli érzék chip-sor (Látás ⚠ / Hallás / Szaglás / Tapintás / Ízlelés, egy sorban, kitöltve), alapból Látás kiválasztva → Hátrány−2, a bontásban `Érzékvesztés: Látás (Részleges): -2`; Hallás → nincs Hátrány; újrakattintás (egyik sem) → nincs Hátrány. `(1)` → −1, `(3)` → „automatikus kudarc", nincs Dobás gomb. Etikett / Lexikum próbán NINCS chip-sor. Két alkategória (Látás + Hallás) egyszerre → mindkettő ⚠. Nem-alkategóriás státusz: `Félelem (1)` → Befolyásolás Hátrány, Lexikum nem.
- **Lövéskitérés** (Távharc fül, `loveskiteres-calc.ts`): Akrobatika+Gyorsaság érték „Lövéskitérés fejlesztése" fortéllyal +2-vel több, nélküle nem.
- **Alkalmi tárgy** (Távharc fül, `tavharc/helpers.ts`): „Alkalmatlan tárgyak hajítása" 1. fok → kártya Osztó 1, 2. fok → Osztó 2 (és a lövéskitérés-kategória ennek megfelelő).
- **Támadó dobás popup** (Harc fül, `combat-roll-info.ts`): Visszafogott taktika → a Sebzésnél Hátrány−2 forrással; Orgyilkos fortély + Orvtámadás helyzet → Sebzés Előny; Helyhez kötve fejlesztése (2) + Helyhez kötve helyzet → TÉ dobás enyhít; Erő-követelmény (nehéz fegyver, alacsony Erő) → TÉ Hátrány-1 „(Erő hiány)". Az E/H címke és a kocka-picker előre beállított szintje egyezik a forrás-összeggel (clamp ±2). Kézi „Statikus bónuszok" gomb → a végösszegbe és a részlet-sorba kerül. Extrák gomb elérhető (minden dobásnál).
- **Sebzés popup „Statikus bónuszok"** (`fegyverSpBónuszok` + `spBónuszok`): Erőbónusz (min(Erő, mód Erőlimit)); „Mesterfegyver - <fegyver>" csak a megjelölt fegyverrel a kézben; Pajzshasználat csak pajzzsal; Roham / (Lég)Lovas roham taktika SP-je; Támadás erőből magas fok SP-je „Támadás erőből (N)" felirattal; Orgyilkos SP Orvtámadásban. Mód-váltás másodlagosra → az Erőbónusz a másodlagos mód Erőlimitje szerint. **Kulcs-ellenőrzés: az összesített SP (alap + bónuszok) = a fegyvertábla SP-je** (+ taktika SP), a bontás csak szétosztja. Kétkezes harcnál a jobb kéz MF-je.
- **CÉ dobás popup** (Távharc): Alkalmatlan tárgyak / fegyver hajítása + a megfelelő helyzet → CÉ / Sebzés enyhít; Kitartott célzás megjegyzés csak illő harcmodorú távfegyverrel. Kézi „Statikus bónuszok" gomb mint a Támadó dobásnál.
- **Manőver dobás popup** (Aktív fül): a TÉ E/H szint a taktika / helyzet / státusz / fortély hatásokból, mint a Támadó popupban. Fázis-tudatos fejléc-chip: V/E fázisban `TÉ: <nyers> (+<Végrehajtás-bónusz>)` bontva, Megakasztás (M) fázisban és passzív módban `VÉ`; a bontott fejléc-TÉ + a bónusz = a Végrehajtás-fázis TÉ-chip értéke. Kézi „Statikus bónuszok" a Végrehajtás fázisban; Extrák gomb a manőver-módhoz igazított kontextussal.
- **VÉ plafon**: Teljes Védekezés + Védő (3) → a fejléc VÉ-eltolása +10-re szorul (a taktika-gyűjtő „Taktika VÉ-plafon" korrekciós sora).

---
## Szabálykönyv (md/) konvenciók, tanulságok

### Emoji headingek és anchor-linkek (⚠️ fontos buktató)

A szabálykönyv headingjei dekoratív emojikat használnak (pl. `⚜️`, `🗡️`, `🅿️`, `✴️`). Ezek anchor-képzése trükkös:

- **A `⚜️` (és sok más dísz-emoji) két kódpont**: a glyph (pl. `⚜` U+269C) + egy variation selector (U+FE0F). A FE0F adja az **emoji-megjelenést**; nélküle a glyph text-stílusú ("csúnya", fekete-fehér, néha dobozos) lesz az editorban.
- **A github-slugger a FE0F-et BENNHAGYJA a slugban** → az `## ⚜️ Valami` heading anchorja `#️-valami` (van egy LÁTHATATLAN U+FE0F a `#` és a `-` között), NEM a sima `#-valami`.
- **Következmény**: a rá mutató linknek is a FE0F-es anchort kell használnia (`...md#️-valami`). A sima `#-valami` **404** a linkspectorban. Ezek a linkek vizuálisan nem gépelhetők - másolni kell őket (a láthatatlan karakter miatt).
- **A repo konvenciója: FE0F-es (szép emoji) headingek + `#️-...` anchorok.** NE "egyszerűsítsd" sima `#-`-re a FE0F eltávolításával: a `⚜` text-stílusú (csúnya) lesz. (2026-10: egy teljes-repo FE0F-törlő kísérlet pont emiatt lett visszavonva.)
- **Keycap emojik** (`1️⃣`/`2️⃣` = szám + U+FE0F + U+20E3) külön óvatosságot kérnek: a FE0F önmagában való törlése szétzilálja a keycap-et (marad a csonka U+20E3).

**Gyakorlat emoji-heading felvételekor / anchor-link írásakor:**
1. Új emoji-heading után a rá mutató link anchorját a tényleges slug alapján add meg (github-slugger: a FE0F-es emojiknál `#️-...`).
2. Anchor-ellenőrzés mindig `npx @umbrelladocs/linkspector check -c .linkspector.yml` a módosítás végén (a 404 a FE0F-eltérést is kiszűri).
3. Variation-selector nélküli, egykódpontos emojik (pl. `🟡`, `🔆`) tiszta `#-...` slugot adnak - ha egyszerű anchor kell, azok jobbak.
