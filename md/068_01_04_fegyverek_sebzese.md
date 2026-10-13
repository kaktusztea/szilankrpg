# Fegyverek sebzése

## ⚜️ Sebzésjelleg

```
→ Szúró
→ Vágó-egyenes
→ Vágó-íves
→ Zúzó
```

Egyes fegyverek többféle sebzésjelleggel is rendelkeznek - például a **Hosszú kard szúr is, vág is**. A [fegyvertáblázatokban](068_00_fegyverek.md#k%C3%B6zelharci-fegyverek) soronként egy jelleg szerepel - Aktoronként.

## ⚜️ Sebzésjelleg szerinti sebzésmódosító

A sebzésjelleg a megtámadott [páncél típusától](069_02_SFE.md) függően módosítja a Sebzést (`SP`) a támadó oldalán.

```
              csupasz  puha  bőr  lánc  pikkely/lemez
Zúzó                0     0   +1    +3    +3
Szúró              +2    +3   +1     0    -3
Vágó-egyenes       +1    +1    0    -2    -4
Vágó-íves          +3    +2    0    -2    -4
```

🔆 Zúzó: fémen erős, puszta húson gyenge

🔆 Szúró: fedetlen ellen kiváló, lemezről lecsúszik

🔆 Vágó-egyenes: fedetlen ellen jó, fémen rossz

🔆 Vágó-íves: fedetlen ellen a legjobb, fémen a legrosszabb

<br />

---
## ⚜️ Sebzéstípusok

- [Elsődleges](065_03_04_fegyver_harci_helyzetek.md#-sebzéstípus-elsődleges): a fegyver alap sebzésjellege, nincs büntetés.
- [Másodlagos](065_03_04_fegyver_harci_helyzetek.md#-sebzéstípus-másodlagos): bejelentés után `Hátrány-1 Sebzésdobásra` (lehet több is).
- [Alkalmatlan](065_03_04_fegyver_harci_helyzetek.md#-sebzéstípus-alkalmatlan): a fegyver nem erre lett kialakítva; ha a KM engedi, `Hátrány-2 Sebzésdobásra`.

Ha egy fegyver többféle Sebzésjelleggel bír, akkor azok között rangsor van: `1 db` Elsődleges, a többi Másodlagos. Ha ez utóbbival támadsz, `Hátrány-1` jár Sebzésdobásodra.

A Sebzéstípusok [Harci helyzetként](065_03_04_fegyver_harci_helyzetek.md) kezelendőek. A karakter **még a támadó dobás előtt** bejelenti, melyik jelleggel akar sebezni; ha nem jelent be semmit, az **elsődleges** típus az alapértelmezett.

### ⚡ Példa: Hosszú kard

```
vágás / szúrás

→ elsődleges: vágás (vágó-egyenes)
→ másodlagos: szúrás (Hátrány-1 Sebzésdobásra)
```

Tehát ha hosszú karddal szúrni próbálsz vágás helyett, akkor sebzéskor `Hátrány-1` büntetés jár, mert szándékosan Másodlagos sebzésjelleget használtál.

<br />

---
## ⚜️ Mágikus fegyverek sebzése

Lásd [Rúnamágiával felruházott tárgyak](120_varazstargyak.md#r%C3%BAnam%C3%A1gi%C3%A1val-felruh%C3%A1zott-t%C3%A1rgyak) fejezete.

---

🔗 [Puszta kéz](068_01_05_puszta_kez.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
