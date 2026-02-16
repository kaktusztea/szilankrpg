# Mágia akarata

⭕TODO: bevezető szöveg

```
Aura Alap  =  2x (TSz + Önuralom)
 + k20
 + Aurakiterjesztés (szellemkéz, zóna)
 + Auraerősítés formula bónusza
 + Metódus 3. foka
 + Szituáció, összhang
 + Képzettségek másodlagos hatásai 
```

---
## Módosító: Aurakiterjesztés

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

<br />

---
## Módosító: Auraerősítés formula bónusza

- **Arkánum**: Aurahangolás
- **Erősség**: `1`
- **Komplexitás**: választható

Ez egy opcionális, bármely varázsláskor ingyen alkalmazható formula, amely az alkalmazó által választott **Komplexitásra** végezhető - ő dönti el, mekkora rizikót vállal.

```
Próbadobás támadó
 varázsló oldalán (opcionális)
 
Aurahangolás + Önuralom +k10
```

```
Komplexitás  Bónusz
9     →       +1
12    →       +3
15    →       +5
18    →       +7
21    →       +9
24    →       +11
27    →       +13
30    →       +15
```

### Sikeres Auraerősítés próba

```
+ Aura bónusz a táblázatból
  az adott varázslatra (csak)
```

### Sikertelen Auraerősítés próba

```
→ Aura Alap levonás: -2
  azonnal érvényesül

→ Regeneráció: 1 / óra

→ NEM okoz automatikus
  varázslat kudarcot 
```

🔆 Az ideiglenes Aura Alap csökkenés a varázstárgyakban megkötött Aurát nem érinti.

<br />

---
## Módosító: Metódus 3. foka

```
Metódus 3.foka esetén
 +2 Mágikus Akaratra
```

Amennyiben az épp használt Metódus használatában `3.fokon` vagy járatos, akkor `+2` bóuszt kapsz Mágikus akaratodra.

<br />

---
## Szituáció, összhang

### Varázsló állapota

```
 Előny-Hátrány skálán eltolás (k10)

-2: Erős koncentrálás másra
    + Összpontosítás próba: 15

-1: Koncentrálás másra
    + Összpontosítás próba: 12
```

### Áldozat állapota

```
 Előny-Hátrány skálán eltolás (k10)

-2: Papi védő áldás II.
     (adott arkánum ellen)
    Isteni kegy

-1: Friss szerelmes érzelmét elorozni (nehezebb)
      (Asztrálmágia ellen)
    Áldozat kiégett érzelmileg (Asztrálmágia ellen)
    Harci láz (Asztrál/Mentálmágia ellen)
    Papi védő áldás I.
     (adott arkánum ellen)
    Védőszellem

+1: frissen összetört szívű fiatal
    ficsúrt asztrálmágiával elbájolni (könnyebb)

+2: Áldozat érzelmi sokkban
```

<br />

---
## Képzettségek másodlagos hatásai

⭕TODO: formázás, fogalmazás⭕



- Őrület varázslása viharos tengeren
- Védelem: a hajóskapitányra nyugodt tengeren nehezebb rá őrületet varázsolni

✅ Agóra:
Képzettségszinttől függ. Aura TÉ/VÉ

```
+1: 3.szint
...
+5: 15.szint
```

---
