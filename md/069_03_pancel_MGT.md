## Páncél MGT

Harc és mozgás során a páncélok korlátozhatják a karakterek mozgását. Ennek szimulálására használjuk a **Mozgásgátló Tényezőt**. Ez az oldal a kimondottan a páncélok MGT értékeivel foglalkozik. Az általános MGT összefoglaló oldalt lásd: [Mozgásgátló Tényező (MGT)](062_03_MGT_99.md).

---
## Páncél MGT hatása

```
Hajlékonyvértek
  1 MGT == -1 Harckeret

Merevvértek
  1 MGT == -1 Harckeret
           -1 TÉ

TÉ büntetést csökkenti
  Merevvértviselet fortély
  Erő Tulajdonság 1:1
```

🔆 [Páncél akadályoztatása](082_statuszok.md#%EF%B8%8F-p%C3%A1nc%C3%A9l-akad%C3%A1lyoztat%C3%A1sa-1-mgt-%EF%B8%8F-mgt) **Státusz**: az `MGT` ennek formájában fejti ki hatását

🔆 [Merevvértviselet](fortelyok.harci/merevvertviselet.md) fortély: a **merevvértek** `TÉ-büntetés` hatását csökkenti

<br />

---
## Páncél MGT számítása

```
Σ MGT =
 + Alap: Páncél Torzó struktúra MGT
 ± Alapanyag MGT
 + Csatolt MGT
   (Kidolgozottság × tagok száma)
 + Rossz méretű páncél MGT
 - Erő Tulajdonság
```

<br />

---
## ⚜️ MGT Alap: Páncél Torzó struktúra

Az egyes páncél struktúráknak eltérő alap `MGT` értéke van.

```
Hajlékonyvért, nem fém
  2: Posztó
  3: Fegyverkabát
  5: Bőr

Hajlékonyvért, fém
  8: Lánc/Sodrony

Merevvért, fém
  8: Pikkely
 10: Lemez
```

<br />

## ⚜️ MGT módosító: Alapanyag MGT ±

A különböző fém ötvözetek alapanyagai változtathatnak az `MGT` értékén. Csak fém struktúráknál releváns.

```
Alapanyag MGT
 +0: Acél
 +2: Bronz
 -2: Abbitacél
 -4: Mithrill
 -6: Lunír
```

<br />

## ⚜️ MGT módosító: Csatolt MGT

```
Csatolt MGT =
 + 1.tag MGT
 + 2.tag MGT
 ...
```

A torzó mellé pluszban csatolt tagok illesztéseinek minősége (**Kidolgozottság**) határozza meg, hogy egy-egy plusz tag mennyi `MGT`-t ad a páncélhoz.

A páncél tagok kapcsolódásainak jó **Kidolgozottsága** alapvető fontosságú a gördülékeny mozgáshoz. Egy rossz illesztékekkel készített vértezet rettenetesen nehezíti a mozgást viselője számára, nem minden a nagy `SFÉ`. Kiváló alapanyagból is lehet hitványul megformált munkát készíteni, fontos tehát a jó készítő mester is. Ha jó a **Kidolgozottság**, a plusz tagok `MGT` értéke is alacsonyabb. Ha rossz, nyilván magasabb.

```
Kidolgozottság kategóriái
  Pocsék
  Átlagos
  Mestermunka
```

```
Max 5 csatolható tag
→ felkar-tagok
→ alkar-tagok
→ comb-tagok
→ lábszár-tagok
→ sisak
```

A páros tagok a számolásban `1` darab tagnak számítanak - aki csak fél párat visel, az is "teljes árat fizet", nem bonyolítunk.

```
Csatolt tag darab MGT
(Kidolgozottság szerint)

Hajlékonyvért, nem fém
  1:    Pocsék
  0.5:  Átlagos
  0:    Mestermunka

Hajlékonyvért, fém
  2:    Pocsék
  1:    Átlagos
  0.25: Mestermunka

Merevvért, fém
  3:    Pocsék
  2:    Átlagos
  1:    Mestermunka
```

```
⚡ Példa: merevvért torzó mellé
  +3: felkar-tagok (pocsék)
  +1: lábszár-tagok (mestermunka)
```

<br />

## ⚜️ MGT módosító: Rossz méretű páncél

```
+0: passzol
+3: nem passzol
+6: borzalmas
```

<br />

## ⚜️ MGT módosító: Erő Tulajdonság

```
Erő Tulajdonság
  Növeli/csökkenti az MGT értékét
```

Aki erősebb, azt kevésbé korlátozza egy nehezebb páncél.

<br />

---
## ⚡ Példa Páncél MGT

```
Lord Gustav full páncél MGT: 12
  Lefedettség: 100% (+5 tag)

  +10: Torzó (Lemez, merevvért, fém)
   +0: Alapanyag (Acél)
   +5: Csatolt MGT
       5 tag × 1 (Mestermunka, merevvért fém)
   +0: Méret (passzol)
   -3: Erő
```

<br />

---
## Sérült páncél javítása

Ha megsérül a páncél, azt javítani kell és ez bizony nem olcsó mulatság fém páncélok esetén.

Az elszenvedett csapások alapján a KM meghatároz egy az **egész vértre** vonatkoztatott sérülést:

```
Páncél sérülése: x %
```

```
Javítás ára:
  Páncél teljes ára  x  Páncél sérülés %
```

## Sérült páncél MGT módosító hatása (opcionális)

Ha megsérül a páncél, az bizony előbb-utóbb akadályozni fog a mozgásban.

```
MGT növekedés:
  az eredeti MGT annyi %-kal nő,
  amennyi a 'Páncél sérülés' jellemzője ↓
```

## Felszerelés MGT

A páncél MGT mellett kapcsolódó érték a [Felszerelés MGT](010_03_06_felszereles.md), amely szintén harcot korlátozó tényező lehet.

Az ott leírt **Felszerelés keretből** (`Erő+2`) levon pár pontot, ha páncélod legalább `50%`-ban fed - az alábbiak szerint:
```
1 pont: Könnyűvért 50%+ fedésben
2 pont: Merevvért 50%+ fedésben
        (pikkely, lemez)
```

A túlcsorduló Felszerelés pont további MGT hatást okozhat. Bővebben [lásd ott](010_03_06_felszereles.md).

---
## Hosszútávú viselet, barangolás páncélban

Egy páncél viselete rövidtávon nem okoz problémát, de hosszútávú gyaloglás és viselet esetén már igen kimerítő és ez a csapat haladását is befolyásolhatja. Az ilyen felszerelés hosszútávú szállításához kíséret, fegyverhordozó, málhásállatok, szekér szükséges. A leírtak alacsony MGT értékkel kitűnő, magas minőségű vértekre is vonatkoznak!

### `1.` Félvért, közepes pajzs tartós viselete, cipelése

Testen, kézben, háton hordva `1 nap` után az alábbi hatások érnek.

```
+ Státusz: Fizikai (1)
+ 1/2 távot tudsz megtenni naponta
  Ez hátráltatja a csapatot.
```

### `2.` Teljes vért, Nagy pajzs

```
+ Státusz: Fizikai (2)
+ 1/4 távot tudsz megtenni naponta.
  Ez hátráltatja a csapatot.
```

Magasabb szinteken előfordulhatnak mágikus könnyítések, mint kisebb tárgyakká alakuló varázsfegyverek, páncélok.

---

🔗 [Védett terület](069_04_vedett_terulet.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
