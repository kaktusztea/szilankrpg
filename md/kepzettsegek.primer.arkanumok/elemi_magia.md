## Elemi mágia arkánum

Az **Anyag** szféra alá tartozó arkánum.

| **Képzettség** | **Követelmény** | **Bónusz, Megjegyzés**                                                                                                                      |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.szint        | Önuralom: 0     | 1-2.szintig csak elméleti ismeret.                                                                                                          |
| 3.szint        | ⭕???           | **Már varázsolhat Elemi mágia mozaikokból a tanuló.**                                                                                       |
| 6.szint        | ⭕???           | A varázsló már idézhet elementált.                                                                                                          |
| 9.szint        | ⭕???           | A varázsló képes kommunikálni egy választott sík lényeivel.\*<br>→ Külön fortély felvehető: „Elemi sík nyelve” (plusz választott nyelv) |
| 12.szint       | ⭕???           | A varázsló megpróbálhat síkurat idézni                                                                                                      |
| 15.szint       | ⭕???           | ???                                                                                                                                         |

### Kísérőjelenségek

⭕TODO

Tűzvarázslat előtt lehül a levegő (a hőt kivonja a környezetből) 


### Formulák

⭕TODO: Bevezető

#### Őselem idézése

##### Erősség

Ez is képzettségpróba.

| Erősség | Sebzés: `k20+` |
| :-----: | :------------: |
|   `1`   |      `-5`      |
|   `2`   |      `-4`      |
|   `3`   |      `-3`      |
|   `4`   |      `-2`      |
|   `5`   |      `-1`      |
|   `6`   |      `0`       |
|   `7`   |      `+1`      |
|   `8`   |      `+2`      |
|   `9`   |      `+3`      |
|  `10`   |      `+4`      |
|  `11`   |      `+5`      |
|  `12`   |      `+6`      |
|  `13`   |      `+7`      |
|  `14`   |      `+8`      |
|  `15`   |      `+9`      |
|  `16`   |     `+10`      |
|  `17`   |     `+11`      |
|  `18`   |     `+12`      |
|  `19`   |     `+13`      |
|  `20`   |     `+14`      |
|  `21`   |     `+15`      |

##### Időtartam

`1` kör. Kitolása Erősség növelésével.
⭕TODO⭕: hivatkozás mágiaelmélet oldalra.

##### Komplexitás

| **Formák**                                             |                                                   **+Komplexitás**                                                   |
| ------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------: |
| Alapvető formák<br>(gömb, nyíl, kitörés, szőnyeg, fal) |                                                          4                                                           |
| Haladó formák<br>(aura, sátor, zápor, csóva, kard)     |                                                          6                                                           |
| Szabad formák                                          |                                            8 <br>⭕(lehet h túl szigorú?)⭕                                            |
| Forma szétválasztása több részre                       |                                                       +3/rész                                                        |
| Méret átmérő növelés                                   | Pl. "gömb" méter átmérő a varázslat Erősséget növelje minden méter átmérő növeléssel.<br>Ettől a sebzés nem csökken. |

<br />

| **Irányítás  <br>**(ahol a forma szerint értelmezhető) |              **+Komplexitás**               | **Támadó érték**<br>(ha az idézett forma közelharcba kezd az áldozattal)<br>(alap VÉ számít, ha nem mágikus a fegyver) |
| ------------------------------------------------------ | :-----------------------------------------: | :--------------------------------------------------------------------------------------------------------------------: |
| Lassú mozgatás,<br>Kocogó ember sebessége              |                     +3                      |                                                     TÉ=15;VÉ:40\*                                                      |
| Átlagos mozgatás,<br>Sprintelő ember sebessége         |                     +6                      |                                                     TÉ=25;VÉ:50\*                                                      |
| Gyors mozgatás,<br>Mágikus lövedék I.                  |                     +9                      |                                                     TÉ=35;VÉ:60\*                                                      |
| Nagyon gyors mozgatás,<br>Mágikus lövedék II.          |                     +12                     |                                                     TÉ=45;VÉ:70\*                                                      |
| Nagyon gyors mozgatás,<br>Mágikus lövedék III.         |                     +15                     |                                                     TÉ=55\;VÉ:80*                                                      |
|                                                        | ⭕Összpontosítás próba<br />nehézsége is nő⭕ |                                                                                                                        |

🔆Fontos: az idézett forma TÉ/VÉ-je nem lehet nagyobb a varázsló harcértékeinél - kivéve, ha mentálisan összeköt egy képzettebb harcost a varázslattal. Az ilyesmi már igazán magas szintű mágiának számít.


⭕TODO: Link [Mágia célzására](https://github.com/kaktusztea/szilankrpg/wiki/STUDY.magia.celzasa), ha bekerül a fő doksiba.

⭕TODO: Méret módosító: ez is link a Mágia alaptörvényeire - ha kész lesz.

##### Formák mérete és erőssége

Ha ez értelmezhető, akkor a formák méreténél a legnagyobb átmérőre vonatkoztatunk. Maximálisan annyi méter lehet a legnagyobb átmérő, mint amekkora a mozaik _Erőssége_. Viszont, ha növeljük az átmérőt, akkor az erősség is megoszlik a területen.

⚡**Példa**: egy `3` méter magas tűzfalat hoz létre `6E`-vel a varázsló. A tűzfal hatása ekkor `2E`-nek felel meg.

##### Hatás-eloszlás
⭕(a Manamentes modellhez)⭕
A fenti példánál az ez `3`, mert annyira „nyújtja ki” a varázsló.

##### Sebződés

⭕Ez is kérdéses még, nem könnyű eldönteni, hogy random is legyen, de közben meg sok se legyen. Az alap sebzés a sebző elemmel való 2 szegmenses érintkezést jelenti kivéve a nyíl és a kitörés formát, ahol a sebzés egyben, azonnal történik. Ha a 2 szegmensnél tovább tartózkodik valaki az elemmel érintkezésben, akkor a többszörös idő többszörös sebzést okoz. 1 kör például már 5x-ös sebzést! Viszont nem fog senki egy tűzgolyóban álldogálni valószínűleg.⭕

---
##### ⚡Példavarázslatok ⭕k20

###### Gyors tűzgolyó

- **Komplexitás**: `6 + 0 (gömb) + 3 (gyors) = 9`
- **TÉ**=`100`

###### Veszedelmes 2 fejű tűzsárkány

- **Komplexitás**: `6 + 6 (szabad forma) + 3 (két fej = 2 rész) + 3 (gyors) = 18`
  - +1 fej még +3-al emelné a Komplexitást
  - A sárkány irányításához **Összpontosítás** próba is dobatható (KM határozza meg a célszámot)
- **TÉ**=`100`

###### Lecsapó tűzkígyó

- **Komplexitás**: `6 + 6 (szabad forma) + 8 (villámgyors) = 20`
- **TÉ**=`150`

---
#### Elementál idézése
| **Elementál** | **Erősség** | **Komplexitás** |     | **Körülmény** | **+Komplexitás** |
| ------------- | ----------- | ------------ | --- | ------------- | ------------- |
| Szolga        | `10`        | `10`         |     |               |               |
| Harcos        | `14`        | `14`         |     |               |               |
| Fejedelem     | `17`        | `17`         |     |               |               |
| Síkúr         | `20`        | `20`         |     |               |               |

A megidézett elementálokra mentálisan, vagy asztrálisan hatni a következő követelményekkel lehet:
- Elemi mágia – `9.szint`  
- Mentál/Asztrálmágia – `9.szint`

---
#### Elementál űzése

- Mana: lénytől függ
- Komplexitás: lénytől függ
- Időtartam: ⭕???⭕
  
| **Elementál** | **Erősség** | **Komplexitás** |     | **Körülmény**          | **+Komplexitás** |
| ------------- | ----------- | ------------ | --- | ---------------------- | ------------- |
| Szolga        | `12`        | `12`         |     | Elementál maradni akar | `+3`          |
| Harcos        | `16`        | `16`         |     | Elementál menni akar   | `+0`          |
| Fejedelem     | `18`        | `19`         |     |                        |               |
| Síkúr         | `22`        | `22`         |     |                        |               |

---
#### Őselem megkötése anyagban

⭕TODO⭕

Magas szinten ennél jönne elő pl. a tűzalak, vízalak, földalak, légies alak

⭕(ez azért jó, mert pl. a Vulgármágiában van sima tűzalak, ami könnyebb is, de célvarázslat, míg itt sokkal szabadabb a varázsló, de nagyobb a varázslat költsége.)
