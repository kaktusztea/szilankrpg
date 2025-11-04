## Sebzés jellege

```
Szúró, Vágó és Zúzó sebzés
```

⭕TODO: átfogalmazás, átstruktúrálás⭕

Támadáskor fontos paraméter a csapás jellegének, valamint az ellenfél vértjének aktuális **Sebzés Felfogó Értéke**, az `SFÉ`, amely mérsékelheti a sebesülést. Ez utóbbi (`SFÉ`) nem egy konkrét érték, pont a támadás jellegétől és a fegyver esetleges átütéséből adódik.

A harcban használt fegyverek igen sokszínűek, a `Szilánk` rendszere különbséget tesz az általuk okozott sebzés jellege szerint:

- **⚜️Szúró (`S`)
- ⚜️Vágó (`V`)
- ⚜️**Zúzó** (`Z`)
- ⚜️**Energia** (`E`)

### Fegyverek többféle sebzés típussal

Egyes fegyverek többféle sebzési formát is lehetővé tesznek, gondoljunk csak a jól ismert Hosszú kardra, amellyel szúrni is, vágni is lehet.

```
Jelölése "/" jellel

Példa: "V/S"
```

A Harcrendszer végén található [fegyvertáblázatokban](068_00_fegyverek.md#k%C3%B6zelharci-fegyverek) minden fegyver sebzés jellegei megtalálhatóak.

<br />

---
## Sebzés típusok

A fent 

### [Sebzéstípus: elsődleges](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-els%C5%91dleges)

Ez egy **Harci helyzet** (státusz).

Minden fegyver rendelkezik egy **elsődleges sebzési típussal**, pl. "szúrás". Ha emellett más jelegű támadásra is alkalmas, akkor van másodlagos sebzéstípusa is (lásd lenn). Ha a karakter nem jelenti be, hogy milyen típusú támadást akar leadni, akkor mindig az elsődleges sebzési típust vesszük megtörténtnek.

Például a "Hosszú kard: vágás/szúrás (`V/S`)". Ekkor az alapértelmezett az elsődleges sebzési jellege, azaz a "vágás". 

---
### [Sebzéstípus: másodlagos](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-m%C3%A1sodlagos)

```
Hátrány-1 Sebzésdobásra
```

Ez egy Harci helyzet (státusz).

Ha a karakter bejelnti, hogy fegyverének másodlagos sebzési típus

A karakter bejelenti, hogy Hosszú kardjával **Szúrni** szeretne. Ez fegyverének másodlagos sebzési típusa, így némi büntető módosítóval teheti meg.

---
### [Sebzéstípus: alkalmatlan](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-alkalmatlan)

```
Hátrány-2 Sebzésdobásra
```

Ez egy Harci helyzet (státusz).

Ha a karakter olyan sebzési típussal szeretne betalálni, amire fegyvere nem lett kialakítva (nem elsődleges, nem egyjogú, nem másodlagos) akkor, ha a KM engedi – azt további büntető módosítóval teheti meg.

<br />

---
## Átütés

```
Aktuális SFÉ =
  Vért SFÉ - Átütés
```

Fontos szerep jut még azoknak a fegyvereknek, amelyek rendelkeznek Átütés értékkel (a legtöbb fegyver `Átütés értéke: 0`), mivel a támadott vért megfelelő `SFÉ`-jének kiválasztása után annak értékéből még le kell vonni az **Átütést** is, így kapjuk meg a vért végleges aktuális `SFÉ`-jét.

Átütéssel olyan fegyverek rendelkeznek, amelyek kifejezetten alkalmasak vértek átlyukasztására legtöbbször azon okból, hogy kis területre koncentrálnak nagy erőt.\
Például: Csákány.

---
## Mágikus fegyverek sebzése

Lásd [Rúnamágiával felruházott tárgyak](130_varazstargyak.md#r%C3%BAnam%C3%A1gi%C3%A1val-felruh%C3%A1zott-t%C3%A1rgyak) fejezete.

---

🔗 [Sebzés](064_02_07_sebzes.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
