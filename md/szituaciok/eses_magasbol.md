## Esés magasból

```
→ Akrobatika képzettségpróba

Nehézségek magasság alapján:

 1 m: 5
 2 m: 6
 3 m: 8
 4 m: 9
 5 m: 11
 6 m: 12
 7 m: 15
 8 m: 16
 9 m: 17
10 m: 18
11 m: 19
12 m: 21
---
13 m: 23
14 m: 25
15 m: 27
```

```
Tulajdonságok:
- Ügyesség
- Edzettség
```

Ha például [Mászás](../kepzettsegek.szekunder/maszas.md) képzettség használata során (mint a [Mászás: összetett példa](maszas_osszetett_pelda.md)) a karakter nem képes megkapaszkodni és leesik, még mindig van esélye megúszni kisebb-nagyobb sérülésekkel a leérkezést.

Ilyenkor [Akrobatika](../kepzettsegek.primer.altalanos/akrobatika.md) képzettségpróbát kell dobnia, ahol a Nehézség magasság-arányos és a fenti táblázatból.

<br />

---
### Módosítók

```
Terep Nehézség: [-6; +3]
Páncélban: [+1; 6]
```

A talaj jellegétől függően kaphat a karakter a Nehézségre módosítókat.

Az alapállapot a döngölt földnek megfelelő minőségű talaj. Ennél lehet sokkal könnyebb a próba, ha például hóba esik (`-6`), vagy nehezebb, ha kövezett útra, erkélyre (`+3`) érkezik az érintett.

A páncél szintén nehezít, a merev vértek jobban, a KM a körülmények és a páncélok jellege, súlya alapján adjon egy plusz `Nehézség` értéket a próbára `[+1; 6]` intervallumban.

<br />

---
### ⚡Példa

Tetves elvéti Mászás képzettségpróbáját és a [mentődobást](../kepzettsegek.szekunder/maszas.md#rontott-m%C3%A1sz%C3%A1s-pr%C3%B3ba-ut%C3%A1n-ment%C5%91-k%C3%A9pzetts%C3%A9gpr%C3%B3ba) is, lehullik egy `4 méter` magas kiszögellésről. Szerencséjére egy füves susnyába érkezik (Nehézség módosító: `-3`).

Tetves könnyű bőrvértet visel, ezért a KM `+2` büntetést ad az esés során dobott Akrobatika próbára.

```
Nehézség:
  9 (magasság: 4 méter) 
- 3 (susnyásba)
+ 2 (könnyű bőrvért)
= 8
```
