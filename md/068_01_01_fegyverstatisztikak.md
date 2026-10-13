# Fegyverstatisztikák

Kiszámolt, végleges fegyver harcértékek és tulajdonságok a fegyver alapértelmezett Idea fokozatán (`default_idea`). Ezek az értékek jelennek meg a fegyvertáblázatokban, soronként egy sebzésmódra (Aktorra) bontva.

Néhány kivételtől eltekintve a fegyverek értékei a Szilánk [Fegyvergenerátorral](068_10_fegyvergenerator.md) készültek.

## ⚜️ Fegyverhossz kategóriák

```
0, 1, 2, 3, 5, 7, 9, 12
```

A **Hossz** mező a fegyver fegyverhossz-kategóriája. A fegyverek mérete **fegyverhossz-kategóriákba** sorolható (`0`-`12`, a kategóriaszám nő a fegyver méretével). Ez a kategória-szám (nem fizikai hosszmérték) adja meg a [Fegyverviszony](064_02_03_vedo_ertek_csokkentese.md) (Fegyverelőny/Fegyverhátrány/Fegyverazonosság) kiszámításának alapját.

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

## ⚜️ Aktorok

```
Zúzó felületek
  → botvég
  → buzogányfej-tompa
  → buzogányfej-szöges
  → ököl
  → ököl-belharc
  → vasököl

Szúró felületek
  → pengehegy-apró
  → pengehegy-tőr
  → pengehegy-kard
  → pengehegy-rejtett

Lándzsahegyek
  → lándzsahegy-rövid-átlagos
  → lándzsahegy-rövid-széles
  → lándzsahegy-rövid-keskeny
  → lándzsahegy-tőrhossz
  → lándzsahegy-rövidkardhossz
  → lándzsahegy-hosszúkardhossz

Vágóélek (egyenes)
  → vágóél-egyenes-rövid
  → vágóél-egyenes-átlagos
  → vágóél-egyenes-nagy

Vágóélek (íves)
  → vágóél-íves-rövid
  → vágóél-íves-átlagos
  → vágóél-íves-nagy

Egyéb
  → kampós
```

A fegyver sebzésmódjai (pl. pengehegy, vágóél, buzogányfej). Egy több-módú fegyver (pl. kard szúr és vág) több sorban szerepel, Aktoronként.

## ⚜️ Sebzésjelleg

```
→ szúró
→ vágó
→ zúzó
```

```
FP (speciális)
 → Puha ütőfelület jellemzője (pl. Ököl)
 → A sebzés FP (ÉP helyett)
 → Minden 5. pont ÉP seb
```

## ⚜️ Sebzéstípus

```
→ elsődleges
→ másodlagos (Hátrány-1 Sebzésdobásra)
```

A sebzésmód rangja. `elsődleges` = alap mód (nincs büntetés); `másodlagos` = bejelentés után `Hátrány-1 Sebzésdobásra` (lehet több is). Lásd: [Fegyver sebzésének jellege, típusa](064_02_05_fegyver_sebzes_jellege_tipusa.md).

## ⚜️ TÉ / VÉ

A fegyver Támadó- és Védő Értéke.

## ⚜️ SP

A fegyver Sebzése (`k20 + X`).

## ⚜️ Erőbónusz limit

A sebzésbe (`SP`) extrán fordítható Erő felső plafonja. Lásd: [Erőbónusz, Erőlimit](064_02_06_erobonusz_erolimit.md#er%C5%91b%C3%B3nusz-limit).

 `99 = nincs plafon`

## ⚜️ Átütés

```
Aktuális SFÉ = Páncél SFÉ - Átütés
```

A megtámadott páncél `SFÉ`-jéből levonandó érték. A legtöbb fegyvernél ez `0`.\
Jellemzően a kis területre nagy erőt koncentráló fegyverek jellemzője (⚡ példa: Csákány).

## ⚜️ Sebesség

```
5..12 érték

99: speciális, legfeljebb
    1 tám/kört tesz lehetővé
```

A fegyver forgatási Sebessége, ami a [támadások számára](063_04_tamadasok_szama_fegyverrel.md) van hatással (magasabb érték = lassabb fegyver).

## ⚜️ Forgatás

```
→ egykezes
→ másfélkezes
→ kétkezes
```

A fegyver forgatás-kategóriája.

## ⚜️ Felszerelés pont

A fegyver [Felszerelés keretet](010_03_06_felszereles.md) terhelő pontja.

## ⚜️ Extrák

Speciális, feltételekhez kötött tulajdonságok, hatások. Leírásukat lásd: [Fegyver Extrák](068_01_03_fegyver_extrak.md).

---

🔗 [Fegyver Idea](068_01_02_fegyver_idea.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
