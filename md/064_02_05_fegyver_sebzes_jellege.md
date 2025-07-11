## Fegyver sebzés jellege

Számos paraméter befolyásolja az éppen forgatott fegyver aktuális sebzését.

### Erőbónusz, Erőhiány, Erőbónusz limit

```
Az Erő tulajdonság 1:1-ben
hozzáadódik az SP értékhez.

Ha az Erő értéke negatív,
akkor pedig levonódik.
```

Egyes fegyverek forgatása esetén a karakter fizikai ereje megnöveli az okozott sebzés. Tipikusan azok a fegyverek ezek, amelyek használata során a plusz erő használata felgyorsítja azt, jól kivezethető ívű csapások végezhetők vele. Továbbá számos fegyver van, melynek forgatása **Erő** követelményhez kötött, azaz csak megfelelő fizikumú karakter használhatja. Erről az egyes fegyverek egyéni leírásában találhatunk részleteket, de általánosságban a fenti szabályok az irányadóak.

[Erőbónusz limit](068_01_fegyverek_altalanos_szabalyai.md#er%C5%91b%C3%B3nusz-limit): egyes fegyvereknél hiába a magas **Erő** Tulajdonság egy bizonyos értéknél több **Erőbónuszt** nem alkalmazhat a karakter. Ezek az egyedi limitek is szerepelnek a fegyvertáblázatokban, valamint a [Karakteralkotó](start.md#karakteralkot%C3%B3) is kalkulál vele a Sebzés `SP` értékének meghatározásánál.

---
### Sebzés jellege, páncél SFÉ jellege

```
Szúró, Vágó és Zúzó sebzés
```

Támadáskor fontos momentum annak jellegének meghatározása, valamint az ellenfél vértjének aktuális **Sebzés Felfogó Értéke**, az **SFÉ**, amely mérsékelheti a sebesülést. Ez utóbbi (SFÉ) nem egy konkrét érték, pont a támadás jellegétől és a fegyver esetleges átütéséből adódik.

A harcban használt fegyverek igen sokszínűek, a `Szilánk` rendszere különbséget tesz az általuk okozott sebzés jellege szerint: **⚜️Szúró, ⚜️Vágó és ⚜️Zúzó** támadás.

Egyes fegyverek többféle sebzési formát is lehetővé tesznek, gondoljunk csak a jól ismert hosszú kardra, amellyel szúrni is, vágni is lehet.

```
Jelölése "/" jellel: például "V/S"
V: Vágás;  S: Szúrás;  Z: Zúzás
```

A Harcrendszer végén található [fegyvertáblázatokban](068_00_fegyverek.md#k%C3%B6zelharci-fegyverek) minden fegyver sebzési típusai megtalálhatóak.

<br />

---
### [Sebzéstípus: elsődleges](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-els%C5%91dleges)

Ez egy Harci helyzet (státusz).\
Majdnem minden fegyver rendelkezik egy **elsődleges sebzési típussal**, pl. szúrás. Ha emellett más típusú támadásra is alkalmas, az legtöbbször másodlagos lehet (kivételeket lásd lejjebb az "Egyenjogú sebzési típus" bekezdésben). Ha a karakter nem jelenti be, hogy milyen típusú támadást akar leadni, akkor mindig az elsődleges sebzési típust vesszük megtörténtnek.

Például a "Hosszú kard: vágás/szúrás (`V/S`)". Ekkor az alapértelmezett, elsődleges sebzési típus a **Vágás**. 

---
### [Sebzéstípus: egyenjogú](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-egyenjog%C3%BA)

```
Jelölése "+" jel: például "S+V"

Nincs levonás egyik sebzés típusnál sem
```

Ez egy Harci helyzet (státusz).\
Egyes fegyverekkel többféle sebzési típust lehet használni anélkül, hogy a forgató hátrányba kerülne és levonást szenvedne el a TÉ-ből. Ilyen fegyvereknél az egyes sebzési típusokat "+" jellel választjuk el.

---
### [Sebzéstípus: másodlagos](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-egyenjog%C3%BA)

```
Hátrány-1 Sebzésdobásra
```

Ez egy Harci helyzet (státusz).\
Ha a karakter bejelenti, hogy Hosszú kardjával **Szúrni** szeretne. Ez fegyverének másodlagos sebzési típusa, így némi büntető módosítóval teheti meg.

---
### [Sebzéstípus: alkalmatlan](065_01_harci_helyzetek.md#sebz%C3%A9st%C3%ADpus-alkalmatlan)

```
Hátrány-2 Sebzésdobásra
```

Ez egy Harci helyzet (státusz).\
Ha a karakter olyan sebzési típussal szeretne betalálni, amire fegyvere nem lett kialakítva (nem elsődleges, nem egyjogú, nem másodlagos) akkor, ha a KM engedi – azt további büntető módosítóval teheti meg.

<br />

---
#### Átütés

```
Aktuális SFÉ = Vért SFÉ - Átütés
```

Fontos szerep jut még azoknak a fegyvereknek, amelyek rendelkeznek Átütés értékkel (a legtöbb fegyver `Átütés értéke: 0`), mivel a támadott vért megfelelő SFÉ-jének kiválasztása után annak értékéből még le kell vonni az **Átütést** is, így kapjuk meg a vért végleges aktuális SFÉ-jét.

Átütéssel olyan fegyverek rendelkeznek, amelyek kifejezetten alkalmasak vértek átlyukasztására legtöbbször azon okból, hogy kis területre koncentrálnak nagy erőt.\
Például: Csákány.

---

🔗 [Sebzés](064_02_06_sebzes.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
