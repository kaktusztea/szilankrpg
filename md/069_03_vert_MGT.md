## Vért MGT

Harc és mozgás során a vértek korlátozhatják a karakterek mozgását. Ennek szimulálására használjuk a **Mozgásgátló Tényezőt**. Ez az oldal a vértek és páncélok MGT értékeivel foglalkozik. Az MGT összefoglaló oldalát lásd: [Mozgásgátló Tényező (MGT)](062_03_MGT_99.md).

---
## Vért MGT hatása

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

🔆 [Merevvértviselet](fortelyok.harci/merevvertviselet.md) fortély: a merevvértek `TÉ-büntetés` hatását csökkenti

🔆 [Felszerelés keretedet](010_03_06_felszereles.md) ha túlléped, pontonként `+1 MGT` és `-1 TÉ` büntetést szenvedsz el

<br />

---
## Vért MGT számítása

```
Σ MGT =
 + Vért Torzó struktúra MGT
 ± Alapanyag MGT
 + Csatolt tagok MGT
   (Kidolgozottság × tagok száma)
 + Rossz méretű vért MGT
 - Erő Tulajdonság
 + Felszerelés túlsúly MGT
```

<br />

---
## MGT Alap: Vért Torzó struktúra

Az egyes vért struktúráknak eltérő alap `MGT` értéke van.

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

## MGT módosító: Alapanyag MGT ±

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

## MGT módosító: Kidolgozottság és Csatolt tagok száma

A torzó mellé pluszban csatolt tagok illesztéseinek minősége határozza meg, hogy egy-egy plusz tag mennyi `MGT`-t ad a vérthez.

A vért tagok kapcsolódásainak jó **Kidolgozottsága** alapvető fontosságú a gördülékeny mozgáshoz. Egy rossz illesztékekkel készített vértezet rettenetesen nehezíti a mozgást viselője számára, nem minden a nagy `SFÉ`. Kiváló alapanyagból is lehet hitványul megformált munkát készíteni, fontos tehát a jó készítő mester is. Ha jó a **Kidolgozottság**, a plusz tagok `MGT` értéke is alacsonyabb. Ha rossz, nyilván magasabb.

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
Csatolt MGT = tag MGT × tagok száma
```

```
⚡ Példa: merevvért torzó mellé
  +3: felkar-tagok (pocsék)
  +1: lábszár-tagok (mestermunka)
```

<br />

## MGT módosító: Rossz méretű vért

```
+0: passzol a méret
+3: közepesen más méret
+6: nagyon más méret
```

<br />

## MGT módosító: Erő Tulajdonság

```
Erő Tulajdonság
  Növeli/csökkenti az MGT értékét.
```

Aki erősebb, azt kevésbé korlátozza egy nehezebb páncél.

<br />

## MGT módosító: Felszerelés túlsúly

[Felszerelés keretedet](010_03_06_felszereles.md) ha túlléped, pontonként `+1 MGT` és `-1 TÉ` büntetést szenvedsz el

<br />

---
## ⚡ Példa Vért MGT

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
## Sérült vért javítása

Ha megsérül a vért, azt javítani kell és ez bizony nem olcsó mulatság fém vértek esetén.

Az elszenvedett csapások alapján a KM meghatároz egy az **egész vértre** vonatkoztatott sérülést:

```
Vért sérülése: x %
```

```
Javítás ára:
  Vért teljes ára  x  Vért sérülés %
```

## Sérült vért MGT módosító hatása (opcionális)

Ha megsérül a vért, az bizony előbb-utóbb akadályozni fog a mozgásban.

```
MGT növekedés:
  az eredeti MGT annyi %-kal nő,
  amennyi a 'Vért sérülés' jellemzője ↓
```

---

🔗 [Védett terület](069_04_vedett_terulet.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
