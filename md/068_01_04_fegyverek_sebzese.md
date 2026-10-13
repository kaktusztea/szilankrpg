# Fegyverek sebzése

## ⚜️ Típus szerint

- [Elsődleges](064_02_05_fegyver_sebzes_jellege_tipusa.md#sebzéstípus-elsődleges)
- [Másodlagos](064_02_05_fegyver_sebzes_jellege_tipusa.md#sebzéstípus-másodlagos)
- [Alkalmatlan](064_02_05_fegyver_sebzes_jellege_tipusa.md#sebzéstípus-alkalmatlan)

## ⚜️ Jelleg szerint

A sebzésjelleg (Zúzó, Szúró, Vágó-egyenes, Vágó-íves) a megtámadott [páncél típusától](069_02_SFE.md) függően módosítja a Sebzést (`SP`) a támadó oldalán.

```
              csupasz  puha  bőr  lánc  pikkely/lemez
Zúzó                0     0   +1    +3    +3
Szúró              +2    +3   +1     0    -3
Vágó-egyenes       +1    +1    0    -2    -4
Vágó-íves          +3    +2    0    -2    -4
```

🔆 Zúzó: fémen erős

🔆 Szúró fedetlen ellen kiváló, lemez ellen nem ideális

🔆 Vágó-egyenes: fedetlen ellen jó, fémen rossz

🔆 Vágó-íves: fedetlen ellen legjobb, fémen a legrosszabb

---

🔗 [Puszta kéz](068_01_05_puszta_kez.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)