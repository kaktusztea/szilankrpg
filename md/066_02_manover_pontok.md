## Manőver Pontok

A Manőverek [Ellenpróba](066_04_manover_vegbevitele.md#%EF%B8%8F3-ellenpr%C3%B3ba-e) fázisánál használhatjuk fel - opcionálisan - ezeket a pontokat, amelyek mennyisége leginkább a "harctéri", általános harci tapasztalatból nyert trükkök ismeretét szimulálja. Számítása karakteralkotási időben történik.

```
Manőver Pontok =
 2x ( Közelharc
    + Kardvívás
    + Rombolás
    + Lándzsavívás
    + Ostorharc )
     / TSz  ↑
```

Egy karakter [harcmodor](kepzettsegek.primer.harci/harcmodor.md) képzettség-szintjeinek összegét osztjuk el a **Tapasztalati Szinttel** (felfelé ↑ kerekítve), majd szorozzuk `2`-vel.

Ez adja a **Manőver Pontok** mennyiségét. Látható, hogy a pontok értékének fenntartásához - a Tapasztalati Szint növekedésével - folyamatosan kell növelni a harcmodor képzettségeket. A Manőver pontok értéke így mindig `[0-10]` tartományban mozog.

---
### Felhasználása, Hatása

```
1 Manőver Pont:
   +1 módosítót ad a Manőver
   "Ellenpróba" fázisánál
   mindkét oldalon
```

A fenti pont keretet `1` harci jelenet során használhatja fel a karakter - megtámogatva egyes elvégzett Manővereit. A [Védő Érték regenerálódásakor](064_02_09_ve_regeneralodas.md) ez a keret is "visszatöltődik". A Manőver Pontokat a Manőver dobásainak megkezdése **előtt** kell beletenni, így megvan a rizikója, hogy kudarc esetén elvesznek.

Egy manőver során legfeljebb `4 MP` használható fel. Bővebben lásd: Manőver [Ellenpróba](066_04_manover_vegbevitele.md#%EF%B8%8F3-ellenpr%C3%B3ba-e) fázisa.

---
### Ellenfelhasználás

```
Max 2 MP / manőver
```

Itt az angol nyelvű szerepjátékokban előforduló "counter" jellegű felhasználásra gondolunk.

Amennyiben a karakter szeretne egy ellene irányuló Manővert nehezebbé tenni, akkor ő is beletehet maximum `2 MP` bónuszt a dobás Nehézségébe.

**Fontos**: ezt a szándékát még a dobás **előtt** kell megtenni, így ha végül nem sikerül ellene a Manőver, akkor feleslegesen használta el a beáldozott pontot.

---
### NJK Manőver Pontok

```
NJK: 0 MP

Erős, Kalandozó, Őrszem NJK:
  annyi MP, mint egy JK
```

A **Nem Játékos Karakterek** alapból **nem kapnak** `MP` javadalmazást.

A komolyabb, kidolgozottabb Nem Játékos Karakter ellenfelek viszont egy különleges esetben ugyannyi `MP` mennyiséggel rendelkeznek, mint egy **Játékos Karakter**: mégpedig akkor, amennyiben ők is [**Kalandozók**](010_03_00_karakter_jellemzoi.md), vagy **[Őrszemek](010_03_02_orszem_karakterek.md)**.

---

🔗 [Manőver Szabályok](066_03_manover_szabalyok.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
