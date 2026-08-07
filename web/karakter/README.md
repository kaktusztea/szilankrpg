# Szilánk Karakter webapp

Webes karakteralkotó és harckezelő alkalmazás a Szilánk RPG szabályrendszerhez. Mobilra és Desktopra is optimalizált.

Kliens mód kizárólag, tehát nincs szerver komponens, könnyen hosztolható egyénileg is például github.io alá.

---
## Módok

Az app két módban használható (fejléc jobb oldalán a 🔧/🎮 gombbal váltható):

- **Szerkesztő mód** (🔧): karakter létrehozás és módosítás - minden mező szerkeszthető
- **Game mód** (🎮): játék közben - csak a harc- és session-kezelés aktív, a karakter adatai írásvédettek

---
## Fejléc

A fejléc bal oldalán a **Szilánk pont** (keretes szám) látható, jobb oldalán a gombok:

| Gomb | Funkció |
| ---- | ------- |
| ↩    | Visszavonás (undo) - a szám a visszavonható lépéseket mutatja |
| ✏️   | Verziók, Napló, Jegyzetek ablak |
| 🧑   | Karakterek (karaktertár, mentés/betöltés) |
| 🔧/🎮 | Szerkesztő ⇄ Game mód váltás |

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
| ✳️   | Aktív                        | Fegyverfogás, taktikák, helyzetek, manőverek, státuszok  |

---
## Főbb funkciók

### Karakteralkotás (Szerkesztő mód)

- **Tulajdonságok**: koppintással popup-ból állíthatók (-5..+7), faj-korlátok ellenőrzésével
- **Képzettségek**: csoportokba rendezve, szint popup-pal (1-15), TSz limit jelzéssel
- **Fortélyok**: fok pöttyök (●/○), követelmény-ellenőrzés (piros jelzés nem teljesüléskor), többszörös fortélyok kezelése
- **Fegyverek**: példányonként Mesterfegyver fok, Idea, Anyag beállítás
- **Páncél**: struktúra, fémalapanyag, kidolgozottság, sisak, végtag, méret - SFÉ és MGT automatikus számítás
- **KP sáv**: a tab-bar felett folyamatosan mutatja a maradék KP-t és a primer keretet

### Harckezelés (Game mód)

- **Aktív fül**: fegyverfogás (Egyfegyveres / Fegyver+pajzs / Fegyver+hárító / Kétkezes), taktikák kombó-szabályokkal, harci helyzetek, manőverek, státuszok - minden választás azonnal hat a Harc fülre
- **Harc fül**: fegyverenkénti TÉ/VÉ/SP/Támadás tábla, KÉ, SFÉ, VÉ csökkenés +/- gombok, MP kezelés, harcérték részletek bontás (TÉ/VÉ/SP összetevők: fegyver alap, MF, taktika, fortély, páncél stb.)
- **ÉP táblázat**: S1-S4 rubrikák, sebesülés típussal (S/V/Z/FP), gyógyulás, TÉ levonás automatika
- **Távharc**: CÉ + célpont VÉ kalkulátor szorzó-pickerekkel (mozgás, méret, szél stb.)

### Aktív fül

- **Fortély bónuszok**: harci fortélyok emlékeztetői (lila szín)
- **Alapesetek** (alapból becsukva): fortélyok 0. fokának büntetései, ha nem rendelkezel a fortéllyal (pl. Lovas harc nélkül: TÉ/VÉ: -9)
- **Taktikák**: módosítók zöld ✔ jellel (beszámított jelzés)
- **Harci helyzetek**: infó szöveg + kapcsolódó fortély bónuszok
- **Státuszok**: fokozatonkénti hatások (Előny/Hátrány, letilt, szorzó stb.)

---
## Verziók, Napló, Jegyzetek (✏️)

A fejléc ✏️ gombjával nyíló ablak három részből áll:

- **Karakter verziók**: kiemelt pillanatképek (checkpoint) a karakterről. Bármikor létrehozhatsz egyet, megtekintheted vagy visszaállhatsz rá. Visszaállításnál választhatsz: az utána lévő verziók törlése, vagy új verzióként hozzáfűzés. Napló bejegyzés írásakor opcionálisan automatikusan is készül verzió.
- **Napló**: játék session bejegyzések (dátum, KM, kaland neve, események). Összecsukható lista, szerkeszthető.
- **Jegyzetek**: szabad szöveges jegyzetmező (mindig nyitva).

Alul összecsukható próba-segédlet: Tulajdonságpróba (k6) és Képzettségpróba (k10) célszámok - ez a Szilánk pont ablakban is elérhető.

## Előtörténet (🪪)

A Tulajdonságok fül fejlécében a 🪪 gombbal nyíló ablak a karakter biográfiai adatait fogja össze: Becenév, Név, Kor, Vallás, Származás helye, Szociális érzék, Külső, és egy hosszú Előtörténet szövegmező (max 5000 karakter).

---
## Rejtett funkciók

### Karakter URL megosztás
A Karakterek ablakban (🧑) minden slot sorában a 🔗 gombbal egyetlen URL-be tömörítheted a karaktert és vágólapra másolhatod. Az URL megnyitásakor az app automatikusan importálja a karaktert.

### VÉ csökkenés történet

A Harc fülön a **VÉ csökkenés** label-re vagy értékre koppintva megjelenik a VÉ változások története (pl. "-3; -2; +1"). Mellé koppintás bezárja.

### Képzettség info panel (Game mód)

A Tulajdonságok+Képzettségek, Harcértékek és Misztikus füleken game módban a képzettség sorra koppintva kinyílik egy info panel: Próba, Domináns tulajdonságok, Kiterjesztő fortélyok (zöld = megvan, piros = nincs meg), és 🔗 szabály link.

### Szabály linkek (🔗)

Fortélyoknál és képzettségeknél megjelenik egy 🔗 ikon, ami a GitHub-on lévő szabályrendszer releváns oldalára navigál.

### Támadás szám info panel

A Harc fül fegyver táblázatában a **Tám** (Támadások száma) cellára koppintva egy info popup ugrik fel: fegyver neve, Sebesség értéke, és a számított Harckeret.

### Mágia akarata segédlet

A Misztikus fülön a **Mágia akarata** kártyára koppintva egy négyfüles referencia-ablak nyílik: Aurakiterjesztés (hatótáv módosítók), Auraerősítés (komplexitás→bónusz tábla), Összhang (előny-hátrány módosítók), Képzettség+ (szint→bónusz tábla).

### Szilánk pont és gyors-elérés (fejléc)
A fejlécben a "Szilánk" felirat melletti keretes számra koppintva megnyílik a Szilánk pont ablak: 0–3 közötti érték választható, alatta a **Szabályrendszer** link (GitHub) és összecsukható próba-segédlet (Tulajdonság-/Képzettségpróba célszámok).


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
