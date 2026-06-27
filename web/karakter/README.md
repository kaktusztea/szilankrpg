# Szilánk RPG - Karakteralkotó Webapp

Webes karakteralkotó és harckezelő alkalmazás a Szilánk RPG szabályrendszerhez. Mobilra és Desktopra is optimalizált.

Kliens mód kizárólag, nincs szerver komponens, könnyen hosztolható egyénileg is például github.io alá.

---
## Módok

Az app két módban használható (fejléc jobb oldalán a 🔧/🎮 gombbal váltható):

- **Szerkesztő mód** (🔧): karakter létrehozás és módosítás - minden mező szerkeszthető
- **Game mód** (🎮): játék közben - csak a harc- és session-kezelés aktív, a karakter adatai írásvédettek

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
- **Harc fül**: fegyverenkénti TÉ/VÉ/SP/Támadás tábla, KÉ, SFÉ, VÉ csökkenés +/- gombok, MP kezelés
- **ÉP táblázat**: S1-S4 rubrikák, sebesülés típussal (S/V/Z/FP), gyógyulás, TÉ levonás automatika
- **Távharc**: CÉ + célpont VÉ kalkulátor szorzó-pickerekkel (mozgás, méret, szél stb.)

### Aktív fül

- **Fortély bónuszok**: harci fortélyok emlékeztetői (lila szín)
- **Alapesetek** (alapból becsukva): fortélyok 0. fokának büntetései, ha nem rendelkezel a fortéllyal (pl. Lovas harc nélkül: TÉ/VÉ: -9)
- **Taktikák**: módosítók zöld ✔ jellel (beszámított jelzés)
- **Harci helyzetek**: infó szöveg + kapcsolódó fortély bónuszok
- **Státuszok**: fokozatonkénti hatások (Előny/Hátrány, letilt, szorzó stb.)

---
## Rejtett funkciók

### Karakter URL megosztás
A Karakterek overlay-ben (⚙️ → 📂 Karakterek) minden slot sorában a 🔗 gombbal egyetlen URL-be tömörítheted a karaktert és vágólapra másolhatod. Az URL megnyitásakor az app automatikusan importálja a karaktert.

### VÉ csökkenés történet

A Harc fülön a **VÉ csökkenés** label-re vagy értékre koppintva megjelenik a VÉ változások története (pl. "-3; -2; +1"). Mellé koppintás bezárja.

### Támadás szám info panel

A Harc fül fegyver táblázatában a **Tám** (Támadások száma) cellára koppintva egy info popup ugrik fel: fegyver neve, Sebesség értéke, és a számított Harckeret. 

### Szilánk pont (fejléc)
A fejlécben a "Szilánk RPG" szöveg mellett lévő keretes számra koppintva 0–3 közötti értéket választhatsz.


### Undo (Visszavonás)
A ⚙️ menüben "↩ Visszavonás" - max 6 lépés visszavonható. Minden szerkesztési művelet (tulajdonság, képzettség, fortély, harcérték, fegyver, taktika, VÉ csökkenés, sebzés stb.) visszaállítható.

### Verzió infó

A "Szilánk RPG" szövegre duplán koppintva 5 másodpercre megjelenik a build verzió.

---
## Karaktertár

- Max 10 karakter tárolható a böngésző localStorage-ában
- ⚙️ → 📂 Karakterek: slot lista (aktív ●, többi ○), relatív idő kijelzéssel
- Mentés fájlba: egyedi karakter JSON vagy összes backup
- Betöltés: fájlból (JSON) vagy URL-ből
- Duplikálás: ⚙️ → 📋 Duplikál

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
