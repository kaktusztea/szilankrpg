## Fegyverstatisztikák

A **Fegyverstatisztika** egy fegyver kiszámolt, végleges harcértéke a fegyver alapértelmezett Ideáján (`default_idea`). Ezek az értékek jelennek meg a fegyvertáblázatokban, soronként egy sebzésmódra (Aktorra) bontva.

### Mezők

- **Aktorok**: a fegyver sebzésmódjai (pl. pengehegy, vágóél, buzogányfej). Egy több-módú fegyver (pl. kard szúr és vág) több sorban szerepel, Aktoronként.
- **Sebzésjelleg**: a sebzés jellege - szúró / vágó / zúzó. A `· FP` jelölés puha ütőfelületet jelent (pl. ököl): FP-sebzést okoz ÉP helyett, a sebzésből minden 5. pont ÉP, a többi FP.
- **Sebzéstípus**: a sebzésmód rangja. `elsődleges` = alap mód (nincs büntetés); `másodlagos` = bejelentés után `Hátrány-1 Sebzésdobásra` (lehet több is). Lásd: [Fegyver sebzésének jellege, típusa](064_02_05_fegyver_sebzes_jellege_tipusa.md).
- **TÉ / VÉ**: a fegyver Támadó- és Védő Érték módosítója.
- **SP**: a fegyver Sebzés Pontja (a `+`/`-` előjellel).
- **Erőlimit** (Erőbónusz limit): a sebzésbe (SP) fordítható Erő felső plafonja; `99` = nincs plafon. Lásd: [Erőbónusz, Erőlimit](064_02_06_erobonusz_erolimit.md#er%C5%91b%C3%B3nusz-limit).
- **Átütés**: a megtámadott páncél `SFÉ`-jéből levonandó érték (`Aktuális SFÉ = Páncél SFÉ - Átütés`). A legtöbb fegyvernél `0`; az átütő fegyverek kis területre koncentrálnak nagy erőt (⚡ példa: Csákány).
- **Sebesség**: a fegyver forgatási sebessége (magasabb érték = lassabb fegyver).
- **Forgatás**: a fegyver forgatás-kategóriája (egykezes / másfélkezes / kétkezes).
- **Hossz**: a fegyver [fegyverhossz-kategóriája](#fegyverhossz-kategóriák) (lásd lentebb).
- **Felsz.pont** (Felszerelés pont): a fegyver [Felszerelés keretet](010_03_06_felszereles.md) terhelő pontja. Fegyverekre **nem** a páncélok [MGT](069_03_MGT.md) pontrendszere vonatkozik - egyes fegyverek a Felszerelés keretet csökkentik.
- **Extrák**: a bázisra jövő, feltételhez kötött hatások (saját + a fegyverhossz-kategóriától örökölt). A táblázat a felkészítetlen bázist mutatja; ezek szituációsan jönnek rá. Lásd: [Fegyver Extrák](068_01_03_fegyver_extrak.md).

---

### Fegyverhossz kategóriák

A fegyverek mérete **fegyverhossz-kategóriákba** sorolható (`0`-`12`, a kategóriaszám nő a fegyver méretével). Ez a kategória-szám (nem fizikai hosszmérték) adja meg a [Fegyverviszony](064_02_03_vedo_ertek_csokkentese.md) (Fegyverelőny/Fegyverhátrány/Fegyverazonosság) kiszámításának alapját.

```
0. kategória
- Kemény, tompa tárgy (Kő)
- Kés

1. kategória
- Tőr
- Furkósbot

2. kategória
- Romboló fegyverek
- Rövid kard
- Buzogány
- Csatabárd
- Csatacsákány

3. kategória
- Hosszú kard
- Rapír
- Fokos
- Bot, közepes

5. kategória
- Másfélkezes kard

7. kategória
- Kétkezes kard

9. kategória
- Lándzsa (kétkezes)
- Alabárd (kétkezes)

12. kategória
- Lándzsa-hosszú / Pika (kétkezes)
- Hosszú bot
```

#### Speciális kategória

- Puszta kéz
- Kopja
- Ostromfegyverek (pika, stb.)

---

🔗 [Fegyver Idea](068_01_02_fegyver_idea.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
