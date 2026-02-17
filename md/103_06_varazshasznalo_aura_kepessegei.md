# Varázshasználó Aura képességei

⭕TODO⭕ Ezek igazából az Aurahangolás-arkánum formulái. Link oda??


---
## Aurakiterjesztés

<<<<<<< Updated upstream
Lásd [Mágia akarata - Módosító: Aurakiterjesztés](103_04_magia_akarata.md#m%C3%B3dos%C3%ADt%C3%B3-aurakiterjeszt%C3%A9s) bekezdést.
=======
⭕TODO⭕ Átfogalmazni, formázás

⭕TODO⭕ Aurahangolás Komplexitás meghatározása kell? Valszeg nem, mert a levonás már korlátoz.

Az Auraérintéshez a varázsló kiterjeszti az Auráját **Szellemkézzel** vagy **Zónában** és úgy éri el a célpontot.

Ekkor az aktuális Aurája gyengül. Ennek léptékeit itt találhatjuk:

```
Érintés / szemkontaktus
  szellemkéz: 0
  zóna: 0
Szoba
  szellemkéz: 0
  zóna: -3
Terem
  szellemkéz: -3
  zóna: -6
Mező
  szellemkéz: -6
  zóna: -9
Csatatér
  szellemkéz: -9
  zóna: -15
```
>>>>>>> Stashed changes

<br />

---
## Aurabontás

- [Aurahangolás](kepzettsegek.primer.arkanumok/aurahangolas.md) Arkánum egy Formulája. Teljes leírását lásd ott.
- Komplexitás: `6`

⭕TODO⭕Itt csak tömören összefoglalni és hivatkozni rá. A kibontás az Aurahangolás Arkánumnál
- (⭕megcsinálni ott: "mint a `VÉ` csökkentés, de inkább magasabb szintű ellenfelek ellen érdemes"

🌟**Hatás**:

```
Lebontasz -2 Aura pontot
  célpontod Aurájából
```

### Elvesztett Aura pontok visszatérése az áldozatnál

```
Magától

1 / óra
 → mint 1 rekesz
 → mint 1 FP
```

#### 1 körös visszanyerés próba

```
Aurahangolás + ⭕Önuralom +k10
```

```
Komplexitás  Visszanyerés
9     →       +1
12    →       +3
15    →       +5
18    →       +7
21    →       +9
24    →       +11
27    →       +13
30    →       +15
```

```
Siker:
  visszanyersz választott mennyiségű Aurát

Rontás:
 → Elveszítesz további Aurát
 → Annyit, amennyit visszanyertél volna
 → Óránként 1x próbálkozhat
```

<br />

---
## Sötétben kinyúlás Aurával, másik Aura keresgélése

⭕TODO⭕Észlelés próba??

<br />

---
## Varázsló Auraérzete varázslatban

⭕TODO⭕ Auraérzet fogalom bevezetése az "Aura jellemzői" oldalon. Itt behivatkozni, hogy ez varázsláskor érezhető⭕

A varázsló személyiségétől, aurájától függően mást és mást érezhet az áldozat, ha a mágia aktiválódik rajta.

Ha a varázsló odafigyel ennek elrejtésére (lásd fenn: Aurarejtés), akkor az áldozat nem érzi ezt.


---

🔗 [Aura megkötése varázstárgyakban](103_07_aura_megkotese_varazstargyakban.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#10-mágiarendszer-)
