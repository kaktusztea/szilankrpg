## Harc lóhátról

Mikor lóra szállsz, számos előnyhöz juthatsz, amennyiben képzett lovas vagy.

### Követelmény

Akinek csak **Lovaglás** képzettsége van, még nem képes lóról harcolni - sőt gyalogos harcértékeihez a **képzetlen harcmodor harcérték** levonásai is **pluszban** hozzáadódnak - a Lovaglás képzettség, mint "harcmodor" által.

Sok függ a [Lovaglás képzettség](kepzettsegek.szekunder/lovaglas.md) szintjétől és a [Lovas harc](fortelyok.harci/lovas_harc.md) fortély megtanult fokainak mértékétől.

---
### Lovas/Léglovas harcértékek kiszámítása

```
Harcértékek
  = gyalogos harcértékek
  +  harcmodor bónuszok
     Lovaglás/Léglovaglás képzettség
     után mintha harcmodor képezettség lenne
(Lovas harc fortély fokától függő mértékben)
```

A karakter által alapból használt gyalogos harcmodor harcértékei (pl. Kardvívás) számítanak és ehhez **hozzáadódnak** a [Lovaglás](kepzettsegek.szekunder/lovaglas.md) / [Léglovaglás](kepzettsegek.szekunder/leglovaglas.md) képzettségből - mint egy újabb harcmodorból - adódó bónuszok a [Lovas harc](fortelyok.harci/lovas_harc.md) fortélynál leírt mértékben.

Tehát `3.szintű` **Lovaglással** ugyanannyi a karakter harcértéke, mint ló nélkül, a `3.szint` alatt pedig járnak a képzetlenségből adódó levonások. A `4.szinttől` kezdve viszont jönnek a plusz harcérték módosítók.

🔆 A harcértékekhez **NEM** adódik hozzá pluszban a [Magasabbról](065_01_00_harci_helyzetek.md#magasabbról) harci helyzet módosítója!

🔆 A Kopja, mint lovas fegyver Lándzsavívás harcmodorban forgatandó.

<br />

---
### Fegyverméret megkötés

**Minumum fegyverméret**: lóról **minimum `1` pengés** fegyverrel lehet csak harcolni, annál kisebbel nem

### Fegyverméret-kategória bónusz

A hátas maga `plusz 1 pengényi` extra [fegyverméret-kategóriát](065_01_00_harci_helyzetek.md#fegyverméret---pengehátrány) ad a lovasnak a [Fegyverméret](064_02_03_vedo_ertek_csokkentese.md) harci helyzet megállapításánál.

<br />

---
### Sebesüléskor leesés kockázata

Ha sebet kap a lovas, akkor **Lovaglás** képzettségpróbát kell dobnia, hogy lássuk, leesik-e:

```
Seb       Nehézség
6-10 ÉP       9
11-15 ÉP     12
15+ ÉP       15
```

Ha sikertelen, leesik. Ekkor jön a **Lóról leesés** szituáció ↓

<br />

---
### Lóról leesés - Akrobatika próba és Sérülés

Ha leesel a lóról, [Akrobatika](kepzettsegek.primer.altalanos/akrobatika.md) képzettség próbát kell dobnod (**esésre**), melynek nehézségét a KM határozza meg a körülmények ismeretében.  Egy szénaboglya például sokat könnyíthet.

#### ⚜️Akrobatika képzettségpróba Nehézsége a ló mozgása alapján

```
Hátas      Nehézség
Áll,lassú     9
Üget         15
Vágtázik     18

Módosítók:
→ Terep Nehézség: [-6; +3]
→ Páncélban: [+1; 6]
```

#### ⚜️ Esés Akrobatika-próba sikertelen, esésből sebződés

Ha elvétetted az Akrobatika (esés) próbát, a hátas mozgásától függően kapsz zuhanásból adódó sebzést.

```
Hátas           SP
Áll, Lassú   k20 +0 SP
Üget         k20 +5 SP
Vágtázik     k20+15 SP
```

#### ⚜️ Esés Akrobatika-próba sikeres

Ha sikeres volt a próba, akkor is fennáll az esésből sebződés veszélye, de jelentősen kisebb mértékű:

```
k20-10 SP
```

---
### Félhátulról, hátulról jövő támadások

Itt a [Harci helyzetek](065_01_00_harci_helyzetek.md) fejezetben leírt módosítók érvényesek.

<br />

---
### Idomítatlan hátas

Ha olyan hátason próbálsz harcolni, amely nem lett erre kiképezve, legfeljebb küzdeni tudsz, hogy nehogy ledobjon. Ilyenkor [Idomítás](kepzettsegek.szekunder/idomitas.md) képzettségpróbát kell dobj, a KM által megszabott Nehézség ellen.

<br />

---

🔗 [Lovas fortélyok](067_02_lovas_leglovas_fortelyok.md) →

⚜️ [Nyitóoldal](start.md#6-harcrendszer-%EF%B8%8F)
