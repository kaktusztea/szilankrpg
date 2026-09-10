# Harcszimuláció Spec — AI tesztharc futtatáshoz

> **Cél**: egyetlen önhordó dokumentum, amiből egy AI **külső forrás olvasása nélkül**
> futtatható, hiteles közelharci szimulátort tud írni a Szilánk RPG szabályaihoz.
> Minden numerikus érték inline, minden döntési pont egyértelműsítve.
>
> **NEM cél**: a webapp UI-jának, a távharcnak, a mágiának, a manőverek ellenpróbáinak
> és az alakzatharcnak a modellezése. Ezek a §14 "Kívül eső hatókör" alatt fel vannak sorolva.

**Verzió**: 2026-09-10 · Forrásállapot: `konstansok.yaml` version + `golden.test.ts` (227 unit teszt zöld)

---

## §0 Használati szerződés

Egy szimulátornak ezt a 6 lépést kell megvalósítania, ebben a sorrendben:

1. **Statblokk felépítése** (§2) — minden harcosra egyszer, harc előtt. Statikus.
2. **Kör eleji regeneráció** (§6.1)
3. **Kezdeményezés** (§6.2)
4. **Akciók feloldása sorrendben** (§6.3–§6.5)
5. **Kör végi állapotellenőrzés** (§6.6)
6. **Terminálási feltétel** (§6.7)

### Kötelező tervezési szabályok

| Szabály | Miért |
|---|---|
| A `VÉ` csökkenést **két külön könyvelésben** tartsd: `vé_fáradás` és `vé_seb` | A regeneráció csak a fáradást adja vissza (§5.4). Egy összevont számláló CSENDBEN hibás eredményt ad. |
| A `Pengeelőny/Pengehátrány` **páronkénti** állapot, nem harcosonkénti | 1:N felállásban minden támadó–védő párra külön kell számolni (§5.2) |
| A `TÉ` levonás a sebesülésből **minden támadásra újraszámolandó** | A kategóriaváltás körön belül is megtörténhet |
| A `k20T` forrásáról hozz explicit döntést (§13.1) | A szabály nem mondja meg; a két olvasat 2,4× különbséget ad a VÉ csökkentésben |
| Minden dobás `k20`, kivéve a manőver ellenpróbát (`k10`) és a tulajdonságpróbát (`k6`) | §4 |

---

## §1 Adatforrások (single source of truth)

Ha a specben szereplő szám és a data layer ütközik, **a data layer nyer** — és a spec hibás, jelezd.

| Tartalom | Fájl |
|---|---|
| Konstansok (harcérték alap, MF bónusz, MGT táblák, FT enyhítés) | `data/tables/konstansok.json` |
| Fegyverek (83 db) | `data/tables/fegyverek.json` |
| Pajzsok | `data/tables/pajzsok.json` |
| Harcmodor szint → TÉ/VÉ/CÉ bónusz | `data/tables/harcmodor_kepzettsegek_bonuszok.json` |
| Taktikák (19 db) | `data/tables/taktikak.json` |
| Harci helyzetek (39 db) | `data/tables/harci_helyzetek.json` |
| Státuszok (19 db, 50 fok) | `data/tables/statuszok.json` |
| Fortélyok (177 db) | `data/tables/fortelyok.json` |
| Kalkulációs szabályok (53) | `data/rules.json` |
| Referencia karakter | `data/karakter/test_karakter2.json` |
| Hitelesített golden értékek | `web/karakter/src/__tests__/golden.test.ts` |

### Szabálykönyv fejezetek (ha egy éles szöveg kell)

| Téma | md fájl |
|---|---|
| Kör felépítése, akciók | `md/063_01_harci_kor.md` |
| Kezdeményezés | `md/064_02_01_kezdemenyezes.md` |
| Támadó dobás | `md/064_02_02_tamado_dobas.md` |
| VÉ csökkentés | `md/064_02_03_vedo_ertek_csokkentese.md` |
| Találat, túldobás | `md/064_02_04_talalat.md` |
| Sebzés jelleg/típus, Átütés | `md/064_02_05_fegyver_sebzes_jellege_tipusa.md` |
| Sebzésdobás | `md/064_02_07_sebzes.md` |
| Sebződés hatása | `md/064_02_08_sebzodes_hatasa.md` |
| VÉ regeneráció | `md/064_02_09_ve_regeneralodas.md` |
| Sebesülés, S1–S4, haldoklás | `md/061_03_sebesules.md` |
| Fájdalomtűrés TÉ levonás | `md/061_04_fajdalomtures_sebesuleskor.md` |
| FP | `md/061_02_faradtsag_pont.md` |
| Fegyverméret helyzetek | `md/065_01_04_fegyver_harci_helyzetek.md` |
| Taktikák | `md/065_02_harci_taktikak.md` |
| Teljes példaharc | `md/064_03_peldaharc.md` |

---

## §2 Harcos statblokk

A szimulátor bemenete. A `származtatott` blokk a §3 formuláiból jön, egyszer, harc előtt.

```yaml
harcos:
  # --- azonosítás ---
  név: string
  oldal: int                    # csapat index; azonos oldal nem támadja egymást

  # --- karakterlap bemenetek ---
  tsz: int
  tulajdonságok: { erő, edzettség, ügyesség, gyorsaság, intelligencia, emlékezet, önuralom, érzékenység }
  HM_TÉ: int
  HM_VÉ: int
  képzettségek: { <név>: szint }          # ebből kell: harcmodorok + Fájdalomtűrés + Akrobatika
  fortélyok: [{ név, fok, spec_elem }]

  # --- felszerelés ---
  fegyver:                                # az AKTÍV fegyver (fegyverek.json egy sora)
    { Fegyver, TÉ, VÉ, SP, Sebesség, "Sebzés módja", Pengehossz,
      "Erőbónusz limit", Átütés, Íves, Kategória }
  fegyver_idea: -5..+5                    # §3.10b — a webapp NEM számol vele!
  fegyverfogás: egyfegyveres | fegyver_pajzs | fegyver_hárító | kétkezes
  bal_fegyver: <fegyver vagy null>        # kétkezes / hárító fogáshoz
  pajzs_méret: "" | kis | közepes | nagy
  páncél: { alap, fémalapanyag, kidolgozottság, idea, rongálódás,
            sisak: bool, végtagvédettség: 0..4, méret_illeszkedés }
  felszerelés_terhelés: int               # nagy tárgyak + FEGYVER + PAJZS (§3.6)

  # --- származtatott (§3) ---
  származtatott:
    ÉP: int
    KÉ: int
    TÉ: int                               # fegyverenkénti, sebesülés-levonás NÉLKÜL
    VÉ: int                               # pajzs/hárító bónusz NÉLKÜL
    SP: int                               # a k20 nélküli fix rész
    támadások: int
    harckeret: int
    SFÉ_fizikai: int
    SFÉ_energia: int
    páncél_MGT: int
    manőver_alap: int
    manőver_pont: int
    FT_enyhítés: int
    oszlopméret: int                      # ÉP / 4

  # --- futásidejű állapot (kör közben változik) ---
  állapot:
    ép_használt: int                      # bejelölt rubrikák száma (ÉP + FP együtt)
    fp_rubrikák: int                      # ezekből mennyi FP
    vé_fáradás: int                       # REGENERÁLHATÓ VÉ csökkenés
    vé_seb: int                           # sebből származó, NEM regenerálható
    él: bool
    haldoklik: bool
    stabilizált: bool
    mp_használt: int
    aktív_taktikák: [{ név, fok }]
    aktív_helyzetek: [string]
    aktív_státuszok: [string]             # "Név (fok)" formátum
    roham_elhasznált: bool
    öngyilkos_roham_elhasznált: bool
    kaszabolás_használt_körben: bool
```

---

## §3 Származtatott értékek — formulák

Sorrend kötött: a `páncél_MGT` kell a `harckeret`hez, a `harckeret` a `támadások`hoz.

### 3.1 ÉP és sebesülés kategóriák

```
ÉP        = 28 + edzettség × 4
oszlopméret = ÉP / 4                      # JK-nál ÉP mindig 4-gyel osztható
S-kategória(ép_használt):
    ép_használt == 0        → 0  (sértetlen)
    else                    → MIN(4, CEIL(ép_használt / oszlopméret))
```

### 3.2 KÉ

```
KÉ = 0 + gyorsaság + intelligencia + tsz + fortély_KÉ + taktika_KÉ
```

⚠ **Csapda**: a `rules.json` KÉ szabálya körkörös függőség miatt **NEM** tartalmazza a
fortély módosítókat — azokat a `HarcScreen` utólag adja hozzá. A `golden.test.ts`
`KÉ = 14` állítása a fortély-mentes köztes érték. A tényleges KÉ a referencia
karakternél **19** (14 + Gyors kezdeményezés 2.fok +4 + Harckeret növelés 1.fok +1).

### 3.3 TÉ (fegyverenként)

```
TÉ_alap       = 10 + erő + ügyesség + gyorsaság + HM_TÉ
TÉ_harcmodor  = harcmodor_bónusz[harcmodor_szint].TÉ          # §3.9 tábla
TÉ            = TÉ_alap + TÉ_harcmodor + fegyver.TÉ
                + mesterfegyver[fok].TÉ + fortély_TÉ
                - merevvért_TÉ_büntetés
```

A harcmodor a fegyver kategóriájából jön (§3.8 mapping).

### 3.4 VÉ (fegyverenként)

```
VÉ_alap       = 30 + gyorsaság + ügyesség + HM_VÉ
VÉ            = VÉ_alap + harcmodor_bónusz[szint].VÉ + fegyver.VÉ
                + mesterfegyver[fok].VÉ + fortély_VÉ
```

A pajzs/hárító bónusz **nem** része — az a harc közben adódik hozzá (§3.7).

### 3.5 SP (a k20 nélküli fix rész)

```
erőbónusz = MIN(erő, fegyver."Erőbónusz limit")     # "" vagy 99 → korlátlan; 0 → nincs erőbónusz
SP        = fegyver.SP + erőbónusz + mesterfegyver[fok].SP + fortély_SP
```

Negatív `erő` esetén levonódik (nincs alsó clamp).

### 3.6 Páncél SFÉ / MGT / merevvért büntetés

```
str = páncél_struktúrák[páncél.alap]                # tábla §3.10
alp = páncél_fémalapanyagok[páncél.fémalapanyag]    # 0 ha nem fém struktúra

SFÉ_fizikai = str.sfé_fizikai + alp.sfé_bónusz + páncél.idea - páncél.rongálódás
SFÉ_energia = str.sfé_energia + alp.sfé_bónusz + páncél.idea - páncél.rongálódás

tag_mgt = ha str.merev:  páncél_csatolt_tag_mgt.merevvért_fém[kidolgozottság]
          ha str.fém:    páncél_csatolt_tag_mgt.hajlékonyvért_fém[kidolgozottság]
          egyébként:     páncél_csatolt_tag_mgt.hajlékonyvért_nem_fém[kidolgozottság]
csatolt_db  = végtagvédettség + (sisak ? 1 : 0)
méret_mgt   = { passzol: 0, "nem passzol": 3, borzalmas: 6 }[méret_illeszkedés]

páncél_MGT  = MAX(0, str.mgt + alp.mgt + csatolt_db × tag_mgt + méret_mgt - erő)

merevvért_TÉ_büntetés = str.merev
    ? MAX(0, páncél_MGT - merevvértviselet_bónuszok[fok].TÉ_büntetés_csökkentés)
    : 0
felszerelés_keret = 2 + erő
felszerelés_mgt   = MAX(0, felszerelés_terhelés - felszerelés_keret)
```

⚠ A `felszerelés_terhelés`-be **a kézben tartott fegyver és pajzs is beleszámít**
(`md/068_01_13`, `md/082_statuszok.md` → „Fegyver/Pajzs akadályoztatása"):

```
1 pont:  közepes tárgy · másfélkezes kard · közepes pajzs
2 pont:  nagy tárgy · kétkezes kard · nagy pajzs
```

Fegyverekre **nem** a páncél MGT pontrendszere érvényes — a fegyver kizárólag ezen a
felszerelés-terhelésen keresztül hat (ami `-1 TÉ` és `-1 harckeret` pontonként, ha
túllépi a keretet).

### 3.7 Harckeret és támadások száma

```
# egyfegyveres / fegyver_pajzs / fegyver_hárító:
harckeret  = MAX(0, harcmodor_szint + gyorsaság - páncél_MGT - felszerelés_mgt + fortély_harckeret)
támadások  = 1 + FLOOR(harckeret / fegyver.Sebesség)

# kétkezes: §3.11
```

`fortély_harckeret` forrásai: `Harckeret növelés` +1/+2/+3 (mindig aktív),
`Kétkezes harc` +2/+3/+4 (csak `fegyverfogás == kétkezes`), `Kétkezesség` +1 (ua.).

⚠ Ha `támadások >= 2`, **minden** támadásra `TÉ: -3` jár (az elsőre is), NEM additív (§5.1).

### 3.8 Fegyver kategória → harcmodor képzettség

```
közelharci → Közelharc      kardvívó → Kardvívás      romboló → Rombolás
lándzsavívó → Lándzsavívás  ostorharc → Ostorharc     pajzs → Közelharc
```

### 3.9 Harcmodor szint → TÉ/VÉ/CÉ bónusz (mindhárom azonos)

| szint | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bónusz | -9 | -6 | -3 | 0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 |

`szint < 3` → automatikusan **Képzetlen fegyverhasználat** helyzet (informatív, a büntetés
már a táblában van).

### 3.10 Páncél struktúrák

| struktúra | fém | merev | MGT | SFÉ fiz | SFÉ ener | idea ± |
|---|---|---|---|---|---|---|
| posztó | – | – | 2 | 2 | 4 | 0 |
| fegyverkabát | – | – | 3 | 3 | 5 | 0 |
| bőr | – | – | 5 | 7 | 10 | 1 |
| lánc/sodrony | ✔ | – | 8 | 10 | 10 | 1 |
| pikkely | ✔ | ✔ | 8 | 15 | 10 | 2 |
| lemez | ✔ | ✔ | 10 | 20 | 8 | 3 |

Fémalapanyagok: acél `SFÉ+0/MGT+0` · bronz `-5/+2` · abbitacél `+5/-2` · mithrill `+10/-4` · lunír `+10..20/-6`

Csatolt tag MGT / db: `hajlékony nem-fém` pocsék 1 / átlagos 0,5 / mestermunka 0 ·
`hajlékony fém` 2 / 1 / 0,25 · `merevvért fém` 3 / 2 / 1

Merevvértviselet fortély TÉ-büntetés csökkentés: fok 1 → 5, fok 2 → 10, fok 3 → 15

Mesterfegyver bónusz: fok 1 → TÉ/VÉ/CÉ/SP +1 · fok 2 → +2 · fok 3 → +3

### 3.10b Fegyver Idea (minőség) — `[-5; +5]`

Forrás: `md/068_01_14`. A karakter séma tartalmazza: `fegyverek[].idea`.

| Idea | TÉ / CÉ | VÉ | SP |
|---|---|---|---|
| -5 | -3 | -2 | -5 |
| -4 | -2 | -2 | -4 |
| -3 | -2 | -1 | -3 |
| -2 | -1 | -1 | -2 |
| -1 | -1 | 0 | -1 |
| **0** | — | — | — |
| +1 | +1 | 0 | +1 |
| +2 | +1 | +1 | +2 |
| +3 | +2 | +1 | +3 |
| +4 | +2 | +2 | +4 |
| +5 | +3 | +2 | +5 |

⚠ **A webapp ezt NEM implementálja** (§16/8). A mező szerializálódik (`url-share.ts`),
de sem a `rules.json`, sem a `fegyver-calc.ts` nem használja. A `golden.test.ts` értékei
`idea: 0`-s fegyverekkel készültek, tehát az egyezés nem bizonyítja a hiányt.
Szimulátorban **implementálni kell**, ha nem-0 Ideájú fegyverrel tesztelsz.

### 3.10c Másfélkezes fegyver egy kézzel (MK) — NE alkalmazd kétszer

`md/068_01_06`: MK fegyver 1 kézzel forgatva `TÉ-2, VÉ-2`, Átütés megszűnik,
Erőbónusz limit ~2-re csökken.

⚠ Ez a büntetés **már be van építve** a `fegyverek.json` `(1K)` sorába — a `(1K)` és `(2K)`
két külön entry, az `MK_pár` mező kapcsolja őket. Használd a megfelelő sort, és NE vonj le
újra semmit.

Adat-állapot (§16/10): `Kard, másfélkezes` és `Kard, mesterkard` követi a szabályt;
`Kard, Slan` (ΔVÉ csak -1, Átütés megmarad) és `Mara-sequor` (ΔTÉ/ΔVÉ csak -1) eltér.

### 3.11 Kétkezes harc

```
nagyobb = a nagyobb Pengehossz-ú fegyver (egyenlőségnél a jobb kéz)
harcmodor = a NAGYOBB fegyver kategóriájából
összpenge = jobb.Pengehossz + bal.Pengehossz
HA összpenge > 2.0  →  a fegyverek harcértéke 0 (nem használható együtt)

fok = "Kétkezes harc" fortély foka (0 = nincs fortély)
fok 0 → csak a nagyobb fegyver TÉ/VÉ, plusz TÉ:-3 / VÉ:-3, harckeret +1, MF: nincs
fok 1 → mindkét fegyver TÉ/VÉ összeadódik, TÉ/VÉ ±0, harckeret +2, MF: nincs
fok 2 → ua., harckeret +3, MF: a nagyobb fegyveré
fok 3 → ua., harckeret +4, MF: mindkettőé összeadva

pengelevonás = FLOOR(összpenge / 0.5)
harckeret    = harcmodor_szint + gyorsaság + fortély_harckeret + fok0_bónusz - pengelevonás
támadások    = 1 + FLOOR(harckeret / nagyobb.Sebesség)
SP           = a JOBB kéz (ügyesebb) fegyveréből számolva
```

Hárítófegyverrel kétkezes harc **nem** végezhető. Puszta kézzel sem.

### 3.12 Pajzs és hárítófegyver (harc közbeni VÉ bónusz)

`fegyverfogás == fegyver_pajzs` esetén, a `Pajzshasználat` fortély foka szerint:

| méret | fok 0 | fok 1 | fok 2 | fok 3 |
|---|---|---|---|---|
| kis | VÉ+3 / TÉ-3 | VÉ+3 / TÉ 0 | VÉ+3 / TÉ 0 | VÉ+5 / TÉ 0 |
| közepes | VÉ+10 / TÉ-6 | VÉ+10 / TÉ-3 | VÉ+10 / TÉ 0 | VÉ+12 / TÉ 0 |
| nagy | VÉ+16 / TÉ-9 | VÉ+16 / TÉ-6 | VÉ+16 / TÉ-3 | VÉ+18 / TÉ 0 |

`fegyverfogás == fegyver_hárító`: `VÉ += bal_fegyver.VÉ + mesterfegyver[fok].VÉ`,
csak ha a karakternek van `Hárítófegyver használat` fortélya ÉS `bal_fegyver.Hárító == "1"`.
TÉ büntetés nincs. Hárítófegyverrel **nem lehet támadni**.

⚠ `Hátulról támadás` helyzetben a **pajzs VÉ nem számít** (a hárító igen).

### 3.13 Manőver Alap / Manőver Pont / Fájdalomtűrés

```
manőver_alap = CEIL((HM_TÉ + HM_VÉ) / 10)              # statikus
harcmodor_összeg = Σ(Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc szintek)
manőver_pont = CEIL(harcmodor_összeg × 2 / tsz)        # [0;10]; max 4 MP/támadás, 2 MP/védés

FT_enyhítés = a legnagyobb küszöb, amit a Fájdalomtűrés szint elér:
  szint  4→1  6→2  8→3  10→4  11→5  12→6  13→7  14→8  15→9
```

---

## §4 Kockaprimitívek

```
k20()            → egyenletes 1..20
k10()            → egyenletes 1..10
k6()             → egyenletes 1..6

k20T(r)          → r // 10        # "k20 tízes része":  1-9→0,  10-19→1,  20→2
                                  #  E[k20T] = 0.6  ha r egyenletes
```

### Előny / Hátrány (§37, `engine/dice.ts`)

```
előnyHátrányDobás(szint, oldalak):
    db = |szint| + 1
    dobások = db × dobás(oldalak)
    return  szint < 0  ?  MIN(dobások)  :  MAX(dobások)
```

- `Előny+1` = 2 kocka, a nagyobb · `Előny+2` = 3 kocka, a legnagyobb
- `Hátrány-1` = 2 kocka, a kisebb · `Hátrány-2` = 3 kocka, a legkisebb
- `szint == 0` = egyetlen kocka

### Nettó Előny/Hátrány szint összegzése

```
netÉH(hatások):
    szint = 0
    minden h:  előny  → szint += |h.érték|
               hátrány → szint -= |h.érték|
               enyhít  → szint += |h.érték|
    return CLAMP(szint, -2, +2)          # KÖTELEZŐ clamp!
```

⚠ A clamp `[-2, +2]` a webapp `netElőnySzint()`-jének viselkedése. Az `enyhít` operátor
ugyanúgy **pozitív** irányba tol, mint az `előny` — ez a fortélyok hatásmérséklése.

### Származtatott előny: a Támadó dobás k20-a a Sebzésdobásra

```
sebzésElőny(té_k20):
    té_k20 == 20        → +2
    té_k20 >= 16        → +1
    egyébként           →  0
```

Ez **hozzáadódik** a Sebzésdobásra egyébként érvényes hatásokhoz, és a végösszeg együtt
kap clampet `[-2, +2]`.

---

## §5 A VÉ csökkentés rendszere — a harcrendszer motorja

Ez a legfontosabb és leggyakrabban félreértett alrendszer. A harc **nem** attól dől el,
hogy elfogy az ÉP, hanem attól, hogy összeomlik a VÉ, és a túldobás miatt a sebzés
exponenciálisan felszalad.

### 5.1 Aktuális harcértékek harc közben

```
TÉ_aktuális(támadó) =
      származtatott.TÉ
    + sebesülés_TÉ_levonás(támadó)                    # §5.5, ≤ 0
    + taktika_TÉ(támadó)                              # §7
    + fogás_TÉ(támadó)                                # pajzs büntetés, §3.12, ≤ 0
    + (támadások >= 2  ?  -3  :  0)                   # több támadás levonás

VÉ_aktuális(védő) =
      MAX(0,  származtatott.VÉ
            + fogás_VÉ(védő)                          # pajzs / hárító, §3.12
            + helyzet_VÉ(védő)                         # pl. Takarásban +5
            + taktika_VÉ(védő)                         # §7, CLAMP ±10
            - állapot.vé_fáradás
            - állapot.vé_seb )
```

⚠ A taktikák összesített `VÉ` eltolása **`±10`-re clampelt** (`taktika_vé_eltolás_limit`).
Ez azt jelenti: `Öngyilkos roham` (VÉ-10) egyedül a limitet éri el; kombinációk nem tudnak
ennél mélyebbre menni.

### 5.2 Pengeméret-viszony (páronkénti!)

```
pengeviszony(támadó, védő):
    d = támadó.fegyver.Pengehossz - védő.fegyver.Pengehossz
    d >= 1   → "pengeelőny"        # a támadó előnyben
    d <= -1  → "pengehátrány"
    egyébként → "alappenge"
```

- A `Pengehossz` mező már "pengék" egységben van: `0, 0.5, 1, 1.5, 2, 3, 4, 5`
- `< 0.5` hosszú fegyver 0-nak számít
- `Közrefogás` helyzet a védőn: a támadó `pengeelőny`-e → `alappenge`-re csökken
- `Lovas harc` / `Léglovas harc` fortély 1+ fok: a saját fegyver `Pengehossz +1`
- Kétkezesnél a **nagyobb** fegyver pengehossza számít

### 5.3 Sikertelen támadás → VÉ csökkentés

```
sikertelen_támadás_VÉ_csökkentés(támadó, védő):
    alap = { pengehátrány: 0 + k20T,
             alappenge:    1 + k20T,
             pengeelőny:   2 + k20T }[pengeviszony(támadó, védő)]

    alap += méretkülönbség_bónusz(támadó, védő)       # +1 / lénykategória-különbség
    alap += helyzet_vé_csökkentés_bónusz(támadó)      # §8 tábla (Meglepetés +2, stb.)

    HA támadó taktikája Roham VAGY Öngyilkos roham (első oda-vissza csapás):
        alap × 2
    HA védőn "VÉ veszteség duplázódik" hatás aktív:  # Földön fekve, Helyhez kötve,
        alap × 2                                     # VÉ kiterjesztés, Fizikai(2)/(3) státusz

    védő.állapot.vé_fáradás += alap                   # ← FÁRADÁS könyvelés
```

**Lénykategória skála** (méretkülönbség bónusz): 1 Bögöly · 2 Erdőpille · 3 Goblin/Gnóm ·
4 Ember/Törpe/Ork · 5 Ogár · 6 Wyvern · 7 Sárkány. Kategóriánként `+1 VÉ csökkentés`
a nagyobb lény javára.

### 5.4 Találat → VÉ csökkentés, és a regeneráció

```
találat_VÉ_csökkentés(védő):
    védő.állapot.vé_seb += 3        # ← SEB könyvelés, akkor is ha az SFÉ mindent felfogott
```

#### ⚠ NE „javítsd" a 3-at — szándékosan konzervatív

Kísértő megfigyelés: a `3` kisebb, mint amit egy Alakzat tévesztése ad (`3..5`), és épp
annyi, mint az egyén Fárasztása (`3..5`). Ez **nem hiba**, két okból:

1. **Egyénnél a `3` a sáv teteje, garantáltan.** Az Alappenge tévesztés `1 + k20T`, azaz
   `1` (45 %) / `2` (50 %) / `3` (5 %), átlag `1,6`. A találat tehát átlagban `1,9×` annyi
   eróziót ad, mint egy tévesztés — a magasabb tévesztési értékek a szerencsés farok, nem
   a tipikus eset. Fix számot NE hasonlíts sávmaximumhoz.
2. **A találat már hordozza a sebzést.** Ha maximális eróziót IS adna, végzetes spirál
   indulna: találat → nagy VÉ-esés → könnyebb következő találat → nagyobb túldobás
   (`+3 SP / 5`, felső limit nélkül) → nagyobb sebzés. A `3` szándékosan hagy esélyt
   az áldozatnak: egy sebesülés ne legyen rögtön végzetes.

Ebből következik, hogy az **Alakzat találata is `-3`**, nem a fix pengeméret-érték —
noha így az Alakzat VÉ-eróziója lassul, ahogy elkezd betalálni (`5 → 3`). Ez a
szándékolt fék, nem önfékezési hiba: közben a sebzés veszi át a hajtóerőt (a túldobás
miatt meredeken), tehát a halálozási ütem gyorsul.

(KM döntés, 2026-09-10. Korábbi verzió ezt hibaként azonosította és a fix érték
átvezetését javasolta — az elemzés téves volt, lásd az 1. pontot.)

```
kör_eleji_regeneráció(harcos):
    r = harcos_elme_fok(harcos)              # 1.fok → 1,  2.fok → 2
    ha 3.fok ÉS folyamatos Teljes Védekezés:
        r = 2 + (az előző körben elvesztett teljes vé_fáradás)
    harcos.állapot.vé_fáradás = MAX(0, harcos.állapot.vé_fáradás - r)
    # a vé_seb SOHA nem regenerálódik harc közben
```

Egyéb VÉ visszanyerés:

| Forrás | Hatás |
|---|---|
| **Győzelmi szabály** | Hasonló vagy erősebb ellenfél legyőzésekor `vé_fáradás -= 3` |
| Harcos elme 1/2/3 | kör elején 1 / 2 / 2+előző kör vesztesége |
| Élőholt | minden kör elején `vé_fáradás = 0` (a `vé_seb` megmarad) |
| Szörny 2. kategória | ua. mint élőholt |
| Szörny 3. kategória (pl. vámpír) | `vé_seb` is regenerálódik a regenerált ÉP arányában |
| Teljes pihenés (1 kör, fenyegetésmentes) | teljes VÉ visszaáll |

### 5.5 Sebesülésből származó TÉ levonás

```
sebesülés_TÉ_levonás(harcos):
    kat = S-kategória(harcos.állapot.ép_használt)      # §3.1
    alap = { 0: 0, 1: 0, 2: -3, 3: -6, 4: -9 }[kat]
    HA alap == 0: return 0
    return MIN(0, alap + FT_enyhítés)
```

⚠ Az `S1` kategória **nem** ad levonást. A `MIN(0, ...)` kell: a Fájdalomtűrés nem
fordíthatja pozitívba.

**Kivétel**: `Öngyilkos roham` taktika alatt a sebesülésből származó TÉ büntetés
**nem érvényesül**.

### 5.6 Egyéb azonnali VÉ csökkenések

| Forrás | Hatás |
|---|---|
| `Plusz támadás` taktika | a választás pillanatában `vé_fáradás += 3` |
| `Teljes Védekezés` taktikát alkalmazó **maga szenved el** | `1 + k20T` az ellenfelei minden támadásától, pengeméret-viszonytól **függetlenül** (a Fárasztó taktika bónuszuk megmarad) — §13.9 |
| Sikertelen manőver | ugyanannyi, mint egy sima sikertelen támadás — **akkor is, ha a manővernek nincs Végrehajtás fázisa**, tehát nem volt támadódobás (§13.1) |
| Sikertelen **Megakasztás** (M fázis, az ellenfél extra támadása) | ❗ **NEM** okoz VÉ csökkentést (explicit kivétel, `md/066_04`) |
| `Precíz támadás` manőverrel végzett támadás | VÉ csökkentést **NEM** okoz |

---

## §6 Kör feloldási algoritmus

```
harc(csapatok, max_kör = 40):
    kör = 0
    while kör < max_kör:
        kör += 1

        # --- 1. kör eleji fázis ---
        minden élő h:
            kör_eleji_regeneráció(h)                  # §5.4
            h.állapot.kaszabolás_használt_körben = false
            taktika_választás(h)                      # §6.4 döntési politika

        # --- 2. kezdeményezés ---
        sorrend = élők rendezve csökkenő  (KÉ_aktuális(h) + KÉ_dobás(h))  szerint
            KÉ_dobás(h) = előnyHátrányDobás(netÉH(h ké_dobás hatásai), 20)
            KÉ_aktuális(h) = származtatott.KÉ + taktika_KÉ(h)
            # holtverseny: egyidejű csapás — mindkettő végrehajtódik,
            #              a halál NEM akadályozza meg a másik csapását

        # --- 3. támadási körök (támadásindex szerint, NEM harcosonként egyben) ---
        max_tám = MAX(támadások(h)  minden élő h-ra)
        for i in 1..max_tám:
            for h in sorrend:
                ha nem h.él: continue
                ha i > támadások(h): continue
                ha harcképtelen(h): continue           # §9 letiltott harci_képesség
                cél = célválasztás(h)
                ha cél == null: continue
                akció_feloldás(h, cél, i)              # §6.5

        # --- 4. kör végi fázis ---
        minden h: vérzés_és_folyamatos_sebzés(h)        # Tűz ruhán, vérzés státuszok
        minden h: státusz_automatika(h)                 # §9.3 Sérült
        roham_lejár(minden h)                           # Roham/Ö.roham csak 1. oda-vissza

        # --- 5. terminálás ---
        ha csak egy oldalon van cselekvőképes harcos: return győztes
    return döntetlen
```

### 6.4 Taktikaválasztás — érvényességi szabályok

Egy körben több taktika is aktív lehet, ha a kombó szabályok engedik:

```
kombinálható(t_új, aktívak):
    minden t in aktívak:
        HA t.kombó_mód == "whitelist"  ÉS  t_új.név NOT IN t.kombó_lista → false
        HA t.kombó_mód == "blacklist"  ÉS  t_új.név IN t.kombó_lista     → false
        (és fordítva is, t_új szempontjából)
    return true
```

Plusz megkötések (`megkötések[]`):
- `{típus: harci_helyzet, mód: tiltott, érték: X}` → tilos, ha X aktív a harcoson
- `{típus: harci_helyzet, mód: szükséges, érték: [X,Y]}` → csak ha X vagy Y aktív
- `{típus: támadások, mód: min, érték: 2}` → csak ha ≥2 támadás van
- Ha bármely aktív helyzet `tiltja_taktikákat == true` (jelenleg: **Orvtámadás**) →
  **egyetlen** taktika sem választható

Skálázható taktikák (`Támadó`, `Védő`, `Kezdeményező`, `Támadás erőből`) max foka:

```
max_fok = MAX(3, legmagasabb küszöb ahol harcmodor_szint >= küszöb)
    küszöbök:  szint 6 → 4,  szint 9 → 5,  szint 12 → 6
extra fokok módosítói: lineáris extrapoláció az utolsó definiált fokból
    pl. Támadó 4.fok = TÉ+4/VÉ-8,  5.fok = TÉ+5/VÉ-10
```

### 6.5 Egy akció feloldása

```
akció_feloldás(támadó, védő, tám_index):

    # --- A) nem-támadó akciók ---
    HA "Fárasztás" aktív a támadón:
        v = 3                                          # a taktika alapértéke (2026-09-10: 2 → 3)
        HA támadónak van "Fárasztás" fortélya:  v += 1
        HA pengeviszony(támadó, védő) == "pengeelőny":  v += 1
        védő.állapot.vé_fáradás += v
        return                                         # NINCS támadódobás, NINCS sebzés

    HA "Teljes Védekezés" aktív a támadón:
        return                                         # nem támad (a VÉ+8 passzívan hat)

    # --- B) Támadó dobás ---
    éh   = netÉH(té_dobás hatások: helyzetek + státuszok + taktikák + fortélyok)
    k20  = előnyHátrányDobás(éh, 20)
    tá   = TÉ_aktuális(támadó) + k20
    vé   = VÉ_aktuális(védő)
    HA "Hátulról támadás" aktív a támadón:  vé -= fogás_VÉ_pajzs_rész(védő)

    HA tá < vé:
        sikertelen_támadás_VÉ_csökkentés(támadó, védő)     # §5.3
        return

    # --- C) Találat: túldobás → SP bónusz ---
    túldobás  = tá - vé
    túl_bónusz = 3 × FLOOR(túldobás / 5)                   # NINCS felső limit

    # --- D) Sebzésdobás ---
    seb_éh = CLAMP( sebzésElőny(k20) + netÉH(sebzésdobás hatások), -2, +2 )
    seb_k20 = előnyHátrányDobás(seb_éh, 20)

    sp = seb_k20
       + származtatott.SP                                  # fegyver + erőbónusz + MF + fortély
       + taktika_SP(támadó)                                # Roham +5, Ö.roham +7, Tám.erőből +1..+3
       + túl_bónusz
       + jelleg_bónusz(támadó.fegyver, védő.páncél)        # §6.5.1
       + íves_bónusz(támadó.fegyver, védő.páncél)          # §6.5.1

    HA "Érintő" taktika aktív:  sp = 0                      # csak megérintés
    HA "Visszafogott" + Taktikafókusz fortély: sp = fegyver alapsebzése, nincs k20

    # --- E) SFÉ ---
    sfé = MAX(0, védő.származtatott.SFÉ_fizikai - támadó.fegyver.Átütés)
    HA sikeres Precíz támadás manőver fedetlen területre:  sfé = 0
    végső_sp = MAX(0, sp - sfé)

    # --- F) Alkalmazás ---
    sebzés_alkalmazása(védő, végső_sp, típus)              # §6.6
    találat_VÉ_csökkentés(védő)                            # -3, akkor is ha végső_sp == 0

    # --- G) Kaszabolás fortély ---
    HA védő harcképtelenné vált ÉS támadónak van Kaszabolás fortélya
       ÉS nem használta még ebben a körben:
        +1 soron kívüli bónusz támadás egy közeli ellenfélre
        támadó.állapot.kaszabolás_használt_körben = true
    HA védő meghalt ÉS hasonló/erősebb volt:
        támadó.állapot.vé_fáradás = MAX(0, ... - 3)        # Győzelmi szabály
```

#### 6.5.1 Sebzés jelleg és íves bónusz

A fegyver `Sebzés módja` mező: `Z` zúzó, `S` szúró, `V` vágó, `V/S` = elsődleges V,
másodlagos S.

```
jelleg_bónusz(fegyver, páncél):
    Z (zúzó)   → +3 SP  ha a páncél struktúra fém (lánc/sodrony, pikkely, lemez)
    S (szúró)  → +3 SP  ha a páncél láncing vagy annál gyengébb
                        (posztó, fegyverkabát, bőr, lánc/sodrony)
    V (vágó)   → +1 SP  ha nincs páncél VAGY bőrpáncél vagy annál gyengébb
íves_bónusz: fegyver.Íves == 1 → +2 SP páncélozatlan ellenfél ellen
```

Sebzéstípus választás (`V/S` fegyvernél):
- **elsődleges** (az első betű): sima dobás
- **másodlagos** (a második betű): `Hátrány-1` a Sebzésdobásra
- **alkalmatlan** (a mezőben nem szereplő jelleg): `Hátrány-2`

### 6.6 Sebzés alkalmazása — rubrika könyvelés

Az ÉP tábla egy `ÉP` hosszú rubrikasor, 4 egyenlő oszlopban (`S1..S4`).
Sebesülés balról jobbra tölt.

```
sebzés_alkalmazása(védő, sp, típus):     # típus: S | V | Z | FP
    HA típus != FP:
        # valós seb ELŐSZÖR az FP rubrikákat írja át
        átírt = MIN(sp, védő.állapot.fp_rubrikák)
        védő.állapot.fp_rubrikák -= átírt
        sp_maradék = sp - átírt
        védő.állapot.ép_használt += sp_maradék
    egyébként:
        védő.állapot.ép_használt += sp
        védő.állapot.fp_rubrikák += sp

    HA védő.állapot.ép_használt >= ÉP:
        védő.állapot.ép_használt = ÉP
        HA már haldoklott →  MEGHALT
        egyébként         →  haldoklik = true, harcképtelen
```

**FP-specifikus szabályok**:
- Puszta kéz sebzése alapból `FP` (kivéve egyes harcművész stílusok)
- Bunyóban: minden `5. FP` okoz `1 ÉP` valós sebet — **sebzésenként** számolva,
  azaz `9 FP` → `8 FP + 1 ÉP` (9 rubrika)
- `Elpusztíthatatlan` fortély: 1.fok → 1 ÉP, 2.fok → 2 ÉP fordítható FP-vé sebesüléskor

**Haldoklás**: `ÉP == 0` → `Sérült (3) — Haldoklás` státusz, harcképtelen. 2 percenként
`Edzettség` tulajdonságpróba `Átlagos (5)` ellen; kudarc → halál. Stabilizálás:
`Sebgyógyítás`/`Gyógyítás` képzettségpróba `9` ellen. Stabilizált karaktert bármely
további sebzés azonnal megöl.

**S4 belépéskor** egyszeri `(Fájdalomtűrés + Edzettség)` képzettségpróba `Nehéz (12)`
ellen; kudarc → elájul (`Eszmélet (3)`). Sikernél csak a következő sebesüléskor kell újra.
`Harci láz` képzettség bizonyos fokai felett a próba szükségtelen.

---

## §7 Taktikák — gépi tábla

Forrás: `data/tables/taktikak.json`. `📶` = skálázható (§6.4).

### Közelharci taktikák

| Taktika | Módosítók | Extra mechanika | Kombó |
|---|---|---|---|
| **1 támadás** | TÉ +3 | Csak ha ≥2 támadás van. A `-3` több-tám levonást gyakorlatilag kioltja | ❌ Roham, Ö.roham, Plusz tám, Teljes Véd, Fárasztás, Tettetés |
| **Érintő** | TÉ +3 | **Sebzés = 0** | ✅ Támadó, Védő, Kezdeményező, Kiváró, 1 tám, Plusz tám |
| **Fárasztás** | — | Nincs támadódobás, nincs sebzés. `VÉ csökk = 3 (+1 fortély) (+1 pengeelőny)` | ❌ minden más |
| **Kezdeményező** 📶 | fok n: KÉ +n, VÉ −n | — | ✅ Támadó, Érintő, Visszafogott, 1 tám |
| **Kiváró** | TÉ +3 | Átengedett KÉ (utolsó helyre sorolódik). A TÉ+3 csak az **első visszatámadásra**, és csak ha nem kapott sebet. Több ellenfél ellen ❌ | ✅ Támadó, Érintő, Visszafogott, Tám.erőből, 1 tám, Tettetés |
| **Öngyilkos roham** | TÉ +5, VÉ −10, SP +7 | Max 1×/küzdelem. Csak az 1. oda-vissza csapás. **VÉ csökk ×2 mindkét félnek.** Sebesülés TÉ büntetés nem érvényesül. Ostorharcban ❌. Ha betalál: VÉ büntetése megszűnik és a visszatámadó nem kap +7 SP-t | ❌ minden más |
| **Plusz támadás** | — | `+1` támadás a körben, **azonnal `VÉ −3` csökkenés** | ✅ Támadó, Érintő, Tám.erőből |
| **Roham** | TÉ +4, VÉ −8, SP +5 | Csak az 1. oda-vissza csapás. **VÉ csökk ×2 mindkét félnek.** Min 5–10 m nekifutás. Ostorharcban ❌. Ha betalál: VÉ büntetése megszűnik, visszatámadó nem kap +5 SP-t. A körön belüli további támadások normál értékkel | ❌ minden más |
| **Támadás erőből** 📶 | fok n: TÉ −n, SP +n | — | ✅ Kiváró, Plusz tám, 1 tám |
| **Támadó** 📶 | fok n: TÉ +n, VÉ −2n | Orvtámadás helyzetben ❌ | ✅ Kezdeményező, Kiváró, Érintő, Plusz tám, 1 tám |
| **Védő** 📶 | fok n: VÉ +n, TÉ −2n | Meglepetés/Orvtámadás helyzetben ❌ | ✅ Érintő, 1 tám |
| **Teljes Védekezés** | VÉ **+8** | Nem támad, nem varázsol, folyamatosan hátrál. **Az ellenfelei által rajta okozott** VÉ csökkentés `1 + k20T` (a Fárasztó taktika bónuszuk megmarad) — lásd §13.9 az értelmezésről. Ha nem tud hátrálni, a KM `VÉ+3`-ig csökkentheti | ❌ minden más |
| **Visszafogott** | TÉ −10 | `Hátrány-2` a Sebzésdobásra | ✅ Kezdeményező, Kiváró, 1 tám, Tettetés |
| **Tettetés** | — | Informatív. `Harcmodor + Ügyesség` próba `15` ellen | ✅ Kiváró, Visszafogott |
| **(Lég)Lovas roham** | TÉ +6, SP +10 | 1 oda-vissza csapás. **VÉ büntetés NINCS.** `Lovaglás` próba `12`. Csak lovas/léglovas helyzetben | ❌ minden más |
| **(Lég)Lovas támadás galoppból** | TÉ +3, SP +5 | 1 oda-vissza csapás. VÉ büntetés NINCS. `Lovaglás` próba `9`. Csak lovas/léglovas helyzetben | ❌ minden más |

Távharci taktikák (a közelharci szimulációban nem használatosak):
`Kitartott célzás` CÉ+3 · `Lövéskitérés` (Akrobatika próba) · `Páros kétkezes hajítás` (2 dobás Hátrány-1)

⚠ **Taktika VÉ clamp**: az összes aktív taktika `VÉ` módosítójának összege `CLAMP(±10)`.

---

## §8 Harci helyzetek — gépi tábla

Forrás: `data/tables/harci_helyzetek.json` (39 db). Csak a közelharcra hatók.

### Dobásokra hatók

| Helyzet | Csoport | Hatás |
|---|---|---|
| Beszorított ellenfél | pozitív | Előny+1 té_dobás |
| Hátulról támadás | pozitív | Előny+1 té_dobás; **védő pajzs VÉ nem számít** |
| Magasabbról | pozitív | Előny+1 té_dobás (lovas harcban NEM jár) |
| Levegőből támadás | pozitív | Előny+2 té_dobás; Roham pluszban; Fárasztó OK |
| Meglepetés | pozitív | Előny+1 té_dobás; **VÉ csökkentés +2**; automatikusan nyert kezdeményezés |
| Orvtámadás | pozitív | Előny+2 té_dobás; áldozat VÉ-je = puszta kezes Közelharc érték; **tiltja minden taktikát**; kizárja: Hátulról, Meglepetés |
| Láthatatlan – részlegesen | pozitív | Előny+1 té_dobás; VÉ csökk +1; VÉ +5; **Fárasztás tiltott** |
| Láthatatlan – teljesen | pozitív | Előny+2 té_dobás; VÉ csökk +2; VÉ +10; **Fárasztás tiltott** |
| Takarásban harcolás | semleges | Hátrány-1 té_dobás; **VÉ +5** |
| Csúszós talaj | negatív | Hátrány-1 té_dobás |
| Elvesztett egyensúly | negatív | Hátrány-1 té_dobás; többszörös támadás elvesztése; mozgás feleződik. `Akrobatika` próba `12` megoldja |
| Földön fekve | negatív | Hátrány-2 té_dobás; **VÉ veszteség ×2** |
| Helyhez kötve | negatív | Hátrány-1 té_dobás; **VÉ veszteség ×2** |
| Gyengébb kéz | negatív | Hátrány-1 té_dobás (`Kétkezesség` fortély kioltja) |
| Vakharc – félhomályban | negatív | Hátrány-1 té_dobás |
| Vakharc – sötétben | negatív | Hátrány-2 té_dobás |
| Tűz ruhán – ég | negatív | Hátrány-1 té_dobás; `(-5 + k20)` SP / kör. Eloltás: 1 kör |
| Tűz ruhán – lángol | negatív | Hátrány-2 té_dobás; `(0 + k20)` SP / kör. Harcban elolthatatlan |
| Vér elvakít | negatív | Hátrány-1 té_dobás; Hátrány-1 Érzék(Látás). 1 akció: kitörlés |
| Védő Érték kiterjesztése másra | semleges | Többszörös támadás elvesztése; **VÉ veszteség ×2** (`Testőr` fortély mérsékli) |
| Lények méret különbsége | negatív | `+1 VÉ csökkentés` / lénykategória-különbség a nagyobb javára |

### Harcértékeket módosítók (fortélyon keresztül)

| Helyzet | Hatás |
|---|---|
| Belharci helyzet | `Belharcos` fortély: 1.fok KÉ+1/TÉ+2/VÉ+2 · 2.fok KÉ+2/TÉ+4/VÉ+4. Csak Közelharc harcmodorral és max 0 pengehosszú fegyverrel. Nagyobb fegyverek `TÉ = 0, VÉ = 0` (fegyver_override). Puszta kéz belharcban: TÉ/VÉ/SP = 0 |
| Közrefogás | Semlegesíti az ellenfél Pengeelőnyét → Alappenge |
| Fegyverrántás váratlanul | `Fegyverrántás` fortély: KÉ+5 / +10 |
| Lovas harc / Léglovas harc | Fortély nélkül (**0.fok alapeset**): `TÉ −9, VÉ −9`. Fortély 1/2/3.fok: `TÉ/VÉ +3/+6/+9` és `Pengehossz +1` |
| Harci szekér | `Harci kocsihajtás`: TÉ/VÉ +8 / +12 |
| Páros harc | `Páros harc` fortély: TÉ/VÉ +2/+4/+6, KÉ +1 |
| Közönség előtt | `Gladiátor közönsége`: TÉ +3 |
| Szörnyeteg elleni harc | `Gladiátor bestiái`: VÉ +3 |
| Pusztakezes harc | *rejtett, automatikus*: puszta kéz harcértékei `KÉ/TÉ/VÉ: −3` (már a fegyvertáblában) |
| Képzetlen fegyverhasználat | *rejtett, automatikus*: harcmodor < 3 (a büntetés a §3.9 táblában) |
| Pengeelőny / Pengehátrány | *rejtett, levezetett*: §5.2 |

**Kölcsönösen kizáró csoportok**: `Vakharc-*`, `Tűz ruhán-*`, `Láthatatlan-*`, `Hajítás-*`.
`Földön fekve` kizárja: Lovas, Léglovas, Harci szekér, Magasabbról, Levegőből, Helyhez kötve,
VÉ kiterjesztés, Közrefogás.

---

## §9 Státuszok — a közelharcra hatók

Forrás: `data/tables/statuszok.json`. Formátum: `"Név (fok)"`.

| Státusz (fok) | Alcím | Harci hatás |
|---|---|---|
| Bénultság (1) | Cselekvőképtelenség | ❌ harci_képesség, ❌ mozgás |
| Bénultság (2) | Paralízis | ❌ harci_képesség, ❌ mozgás, ❌ beszéd |
| Blokkolt (1) | Közepesen | Hátrány-1 té_dobás; mozgás ×0,5 |
| Blokkolt (2) | Erősen | Hátrány-2 té_dobás; mozgás ×0,5 |
| Eszmélet (1) | Bódultság | Hátrány-1: ké_dobás, té_dobás, manőver_ellenpróba; −1 támadás (min 1) |
| Eszmélet (2) | Kábultság | Hátrány-2: ké_dobás, té_dobás, manőver_ellenpróba; **max 1 támadás**; ❌ varázslás |
| Eszmélet (3) | Ájulás | ❌ harci_képesség, ❌ mozgás |
| Eszmélet (4) | Kóma | ❌ harci_képesség, ❌ mozgás |
| Félelem (1) | Szorongás | *szöveges* harci_képesség (KM ítéli meg) |
| Félelem (2) | Rettegés | **max 1 támadás**; *szöveges* harci_képesség |
| Félelem (3) | Bénító félelem | ❌ mozgás, ❌ harci_képesség |
| Fizikai (1) | Fáradtság | Hátrány-1 ké_dobás |
| Fizikai (2) | Kimerültség | **VÉ veszteség ×2**; Hátrány-1 ké_dobás |
| Fizikai (3) | Elcsigázottság | Hátrány-2 ké_dobás; **max 1 támadás**; **VÉ veszteség ×2**; mozgás ×0,5 |
| Indulat (1..3) | Harag/Gyűlölet/Őrjöngés | *szöveges* harci_képesség |
| Rosszullét (1) | Közepes | Hátrány-1 ké_dobás, té_dobás |
| Rosszullét (2) | Erős | Hátrány-2 ké_dobás, té_dobás |
| **Sérült (1)** | S3 | Hátrány-1 tulajdonság-/képzettségpróba (harcértékre nem hat) |
| **Sérült (2)** | S4 | Hátrány-2 tulajdonság-/képzettségpróba |
| **Sérült (3)** | Haldoklás | ❌ harci_képesség, ❌ mozgás |
| Zavar (1) | Kizökkent | **max 1 támadás**; Hátrány-1 ké_dobás |
| Zavar (2) | Megrendült | Hátrány-2 ké_dobás; **max 1 támadás**; ❌ mozgás |
| Zavar (3) | Sokk | ❌ harci_képesség, ❌ mozgás |

A többi státusz (Áldott/Átkozott *, Érzékvesztés, Hangulat, Késztetés, Szellemi, Trauma)
csak próbákra hat — a közelharci szimulációban elhagyható.

### 9.1 Hatás operátorok szemantikája

| Operátor | Jelentés |
|---|---|
| `előny` / `hátrány` | Kocka reroll, `netÉH()` összegzés, clamp `±2` |
| `arányos` | Szorzó (pl. 0,5 = feleződik) |
| `duplázás` | Szorzó 2 |
| `letilt` | Boolean képességvesztés / automatikus kudarc |
| `max_limit` | Felső korlát (pl. max 1 támadás/kör) |
| `szöveges` | Nem kumulálható, informatív — a KM/szimulátor ítéli meg |
| `enyhít` | Csökkenti egy másik hatás fokát (csak fortélyokból) |

### 9.2 Harcképtelenség kiértékelése

```
harcképtelen(h) = bármely aktív státusz vagy helyzet
                  'letilt' hatást ad a 'harci_képesség' célra
```

### 9.3 Sérült státusz automatika (kötelező, minden kör végén)

```
inS3 = ép_használt > 2 × oszlopméret
inS4 = ép_használt > 3 × oszlopméret
cél_fok = inS4 ? 2 : inS3 ? 1 : 0
haldoklik → cél_fok = 3
→ aktív_státuszok-ban a "Sérült (X)" bejegyzés ehhez igazítása
```

### 9.4 Támadásszám korlátozás összegzése

```
támadások_effektív(h):
    n = származtatott.támadások
    HA "Plusz támadás" taktika aktív:  n += 1
    HA bármely hatás 'max_limit 1' a 'támadások_száma' célra:  n = MIN(n, 1)
    HA bármely hatás '−1 támadás' (szöveges) :  n = MAX(1, n - 1)
    return n
```

---

## §10 Fortélyok — mi gépi és mi nem

### 10.1 Gépi (numerikus módosító, a data layerben)

| Fortély | Módosító | Feltétel |
|---|---|---|
| Mesterfegyver | TÉ/VÉ/CÉ/SP +1/+2/+3 | adott fegyverre (`spec_elem`) |
| Gyors kezdeményezés | KÉ +2/+4/+6 | mindig |
| Harckeret növelés | harckeret +1/+2/+3, KÉ +1/+2/+3 | mindig |
| Kétkezes harc | harckeret +2/+3/+4 | `fegyverfogás == kétkezes` |
| Kétkezesség | harckeret +1 | kétkezes harc; kioltja a `Gyengébb kéz` Hátrány-1-et |
| Merevvértviselet | MGT_TÉ_büntetés −5/−10/−15 · 3.fok: VÉ +3 | merev páncél + lefedettség ≥ 70% |
| Pajzshasználat | TÉ/VÉ/SP +1/+2/+3 a pajzsra mint fegyverre; **és** a §3.12 tábla foka | `fegyver_kategória: pajzs` |
| Természetes páncél | SFÉ +3/+6/+9 | mindig (páncélviselettől független) |
| Harci akrobatika | 3.fok: TÉ/VÉ +3 | MGT ≤ 5 |
| Belharcos | KÉ/TÉ/VÉ +1/+2/+2 · +2/+4/+4 | belharci helyzet + Közelharc + penge ≤ 0 |
| Páros harc | TÉ/VÉ +2/+4/+6, KÉ +1 | `harci_helyzet: páros_harc` |
| Lovas / Léglovas harc | **0.fok: TÉ/VÉ −9** · 1-3.fok: +3/+6/+9 és Pengehossz +1 | lovas/léglovas helyzet |
| Harci kocsihajtás | TÉ/VÉ +8/+12 | harci szekér |
| Gladiátor bestiái / közönsége | VÉ +3 / TÉ +3 | szörny elleni / közönség előtt |
| Fegyverrántás | KÉ +5/+10 | fegyverrántás helyzet |
| Orgyilkos | SP +1/+2/+3 és Előny+1/+1/+2 sebzésdobás | orvtámadás |
| Taktikafókusz: Roham | KÉ +5 | `taktika: roham` |
| Taktikafókusz: Visszafogott | `letilt` a taktika TÉ-jére; `enyhít 2` a sebzés-hátrányon; sebzés = fix alapsebzés | `taktika: visszafogott` |
| Helyhez kötve fejlesztése | `enyhít 1` vé_veszteség (1.fok) / té_dobás (2.fok) | helyhez kötve |
| Testőr | 0.fok: vé_veszteség ×2 · 1-2.fok: `enyhít 1` | VÉ kiterjesztés |
| Harci anatómia / Manőverfókuszok | manőver ellenpróba bónuszok | adott manőverre |

⚠ **0. fok = "Alapeset"**: néhány fortélynak van `fok: 0` bejegyzése, ami a **fortély
NEM birtoklásának** büntetését írja le (pl. `Lovas harc 0.fok: TÉ/VÉ −9`). Ezt akkor kell
alkalmazni, ha a harcosnak **nincs** meg a fortély, de a helyzet aktív. Ez a legkönnyebben
kihagyható szabály — ellenőrizd.

### 10.2 NEM gépi (kézi/narratív, nincs `módosítók` blokkja) — de a szimulációhoz kell

| Fortély | Hatás | Szimulációs teendő |
|---|---|---|
| **Harcos elme** | 1.fok: kör elején +1 VÉ · 2.fok: +2 VÉ · 3.fok: +2 és az előző körben elvesztett teljes VÉ (folyamatos Teljes Védekezés mellett). Sebből származó VÉ csökkenésre nem hat | §5.4 regeneráció |
| **Fárasztás** | Fárasztó taktikánál `+1` extra VÉ csökkentés. ❌ Zúzásban. Közelharc harcmodorban csak szintén Közelharcban küzdő ellenfél ellen | §6.5 A) ág |
| **Kaszabolás** | 1.fok: harcképtelenné tett ellenfél után +1 soron kívüli támadás közeli ellenfélre, max 1×/kör | §6.5 G) ág |
| **Elpusztíthatatlan** | 1.fok: 1 ÉP · 2.fok: 2 ÉP fordítható FP-vé sebesüléskor | §6.6 |
| **Hárítófegyver használat** | A hárítófegyver VÉ-je csak ezzel a fortéllyal érvényesül | §3.12 |

---

## §11 Referencia statblokkok (hitelesített)

### 11.1 REF-A — "Teszt karakter", 10. TSz (`test_karakter2.json`)

Ez a projekt egyetlen hitelesített teszt karaktere. A számok a `golden.test.ts`-ből
származnak, és a §3 formuláival kézzel visszaellenőrizve.

```
tsz 10
tulajdonságok: erő 3, edzettség 3, ügyesség 3, gyorsaság 3,
               intelligencia 1, emlékezet 0, önuralom 2, érzékenység 0
HM_TÉ 15, HM_VÉ 13, CM 1
képzettségek (harci): Kardvívás 8, Közelharc 6, Rombolás 4,
                      Fájdalomtűrés 7, Akrobatika 3
fortélyok: Mesterfegyver(2, "kard, lovag"), Mesterfegyver(1, "tőr"),
           Merevvértviselet 3, Harcos elme 1, Gyors kezdeményezés 2,
           Pajzshasználat 2, Harckeret növelés 1, Elpusztíthatatlan 1,
           Kaszabolás 2, Fárasztás 1
fegyverek: "Kard, lovag" (TÉ 6, VÉ 4, SP +6, Sebesség 8, V/S, Ph 1, Átütés 1, kardvívó)
           "Tőr"         (TÉ 2, VÉ 1, SP +1, Sebesség 6, S/V, Ph 0, közelharci)
páncél: lánc/sodrony, bronz, átlagos, idea 3, rongálódás 3, sisak igen,
        végtagvédettség 3, méret_illeszkedés "nem passzol"
pajzs: közepes
```

**Származtatott (levezetéssel):**

| Érték | Levezetés | Eredmény |
|---|---|---|
| ÉP | 28 + 3×4 | **40** |
| oszlopméret | 40 / 4 | **10** (S1: 1–10, S2: 11–20, S3: 21–30, S4: 31–40) |
| S-kat TÉ levonás | FT 7 → enyhítés 2 | S1 **0** · S2 **−1** · S3 **−4** · S4 **−7** |
| KÉ (rules.json köztes) | 0 + 3 + 1 + 10 | **14** |
| KÉ (tényleges) | 14 + GyKezd2 (+4) + Harckeret növ.1 (+1) | **19** |
| TÉ_alap | 10 + 3 + 3 + 3 + 15 | **34** |
| VÉ_alap | 30 + 3 + 3 + 13 | **49** |
| páncél_MGT | MAX(0, 8 + 2 + 4×1 + 3 − 3) | **14** |
| SFÉ_fizikai | 10 − 5 + 3 − 3 | **5** |
| SFÉ_energia | 10 − 5 + 3 − 3 | **5** |
| merevvért_TÉ_büntetés | lánc nem merev | **0** |
| páncél_lefedettség | torzó 50 + sisak 10 + 3×10 | **90 %** |
| manőver_alap | CEIL((15+13)/10) | **3** |
| manőver_pont | CEIL((8+6+4)×2 / 10) | **4** |

**Fegyverenkénti harcértékek** (egyfegyveres, pajzs nélkül, taktika nélkül):

| Fegyver | TÉ | VÉ | SP (fix) | harckeret | támadások |
|---|---|---|---|---|---|
| Kard, lovag | 34 + 5 + 6 + 2 = **47** | 49 + 5 + 4 + 2 = **60** | 6 + 3 + 2 = **11** | MAX(0, 8+3−14+1) = **0** | **1** |
| Tőr | 34 + 3 + 2 + 1 = **40** | 49 + 3 + 1 + 1 = **54** | 1 + 3 + 1 = **5** | **0** | **1** |

*(A Tőr harcmodora Közelharc 6 → +3, MF fok 1 → +1.)*

**Variánsok** (ugyanez a karakter más fogásban):

| Felállás | TÉ | VÉ | SP | támadások |
|---|---|---|---|---|
| Kard, lovag — egyfegyveres | 47 | 60 | 11 | 1 |
| Kard, lovag + közepes pajzs (Pajzshaszn. 2 → VÉ+10 / TÉ 0) | 47 | **70** | 11 | 1 |
| Kétkezes: Kard, lovag + Tőr (fortély nélkül, 0.fok) | **49** | **61** | 11 | 1 |

*A kétkezes 0.fok: csak a nagyobb fegyver (kard) TÉ/VÉ + `−3/−3`, de a `mindkét_fegyver_értékei`
false; a golden érték TÉ 49 / VÉ 61 (összpenge 1 → pengelevonás 2).*

### 11.2 REF-B — Szimmetrikus hangolási alapeset

Hangolási tesztekhez ez a javasolt neutrális beállítás:

```
2 db REF-A klón, "Kard, lovag", egyfegyveres, páncél aktív, pajzs nélkül
→ mindkettő: TÉ 47, VÉ 60, SP+11, SFÉ 5, ÉP 40, KÉ 19, 1 támadás/kör
→ Alappenge (azonos fegyver)  →  sikertelen támadás VÉ csökk = 1 + k20T
→ Harcos elme 1 aktív  →  kör elején +1 VÉ (csak fáradásból)
→ nincs taktika, nincs harci helyzet, nincs státusz
```

Ellenőrző jellemzők ehhez a felálláshoz (20 000 futás, ±0,5 % tolerancia):

| Metrika | Elvárt |
|---|---|
| Találati esély az 1. körben (VÉ 60 vs TÉ 47) | k20 ≥ 13 → **40 %** |
| Átlagos sebzés találatonként (SFÉ 5, túldobás nélkül) | 10,5 + 11 − 5 ≈ **16,5 ÉP** |
| 1:1 harc hossza | **≈ 3,9 kör** |
| 1:1 győzelmi arány | **50 / 50 %** |
| 1:2 — a magányos győzelmi aránya | **≈ 2 %**, ≈ 2,7 kör |
| 1:3 — a magányos győzelmi aránya | **≈ 0 %**, ≈ 1,8 kör |

### 11.3 REF-C — "Tank" (hosszú harc kikényszerítése)

```
REF-A alap, de: páncél = lemez / acél / mestermunka, idea 0, rongálódás 0,
                méret_illeszkedés = "passzol", sisak igen, végtagvédettség 3
→ SFÉ_fizikai = 20 + 0 + 0 − 0 = 20
→ páncél_MGT  = MAX(0, 10 + 0 + 4×1 + 0 − 3) = 11
→ merevvért_TÉ_büntetés = MAX(0, 11 − 15) = 0   (Merevvértviselet 3.fok)
→ Merevvértviselet 3.fok VÉ+3 aktív (merev + lefedettség 90 % ≥ 70)
→ TÉ 47,  VÉ 63,  harckeret = MAX(0, 8+3−11+1) = 1  →  támadások 1
```

Ez a felállás 8–10 körös harcokat ad, ahol a VÉ-csökkentő mechanikák tényleges súlyt kapnak.

### 11.4 REF-D — "Pribék" (~5. TSz zsoldos), aszimmetrikus teszthez

Túlerő-forgatókönyvekhez kell egy olyan harcos, aki a REF-A hőst **nem tudja eltalálni**.
Ez a szabály által leírt eset („a pribékek kifáraszthatják a vadat, míg vezetőjük felkészül").

```
tsz 5 · erő 2, edzettség 1, ügyesség 1, gyorsaság 1, intelligencia 0
HM_TÉ 7, HM_VÉ 6 · Kardvívás 5 (bónusz +2) · Fájdalomtűrés 0 (enyhítés 0)
fegyver: "Kard, hosszú" (TÉ 4, VÉ 4, SP +4, Sebesség 7, Ph 1, Átütés 0)
páncél: bőr, nem fém, átlagos, idea 0, rongálódás 0, passzol, sisak nincs, végtagvédettség 0
fortélyok: nincs
```

| Érték | Levezetés | Eredmény |
|---|---|---|
| ÉP | 28 + 1×4 | **32** (oszlopméret 8) |
| KÉ | 0 + 1 + 0 + 5 | **6** |
| TÉ | (10+2+1+1+7) + 2 + 4 | **27** |
| VÉ | (30+1+1+6) + 2 + 4 | **44** |
| SP | 4 + 2 | **6** |
| páncél_MGT | MAX(0, 5 + 0 + 0 + 0 − 2) | **3** |
| SFÉ_fizikai | 7 + 0 + 0 − 0 | **7** |
| harckeret / támadások | MAX(0, 5+1−3) = 3 → 1 + FLOOR(3/7) | **3 / 1** |
| S-kat TÉ levonás | FT 0 → enyhítés 0 | S2 **−3** · S3 **−6** · S4 **−9** |

**A kritikus tulajdonság**: `TÉ 27 + max k20 (20) = 47 < REF-A VÉ 60`.
A pribék a harc elején **fizikailag nem tudja eltalálni** a hőst. A hős VÉ-jének 13 pontot
kell esnie, hogy egyáltalán (csak 20-ason) találjon. Ezért a pribék támadásának teljes
hozama `1 + k20T` VÉ csökkentés és **nulla sebzés**.

---

## §12 Célválasztás és felállás-kezelés

```
célválasztás(támadó):
    ellenfelek = [h : h.oldal != támadó.oldal, h.él, nem harcképtelen]
    ha üres → null
    politika (a szimuláció paramétere, dokumentálni kell):
      - "random"          → egyenletes választás   ← DEFAULT hangolási tesztekhez
      - "leggyengébb"     → min ép_hátralévő
      - "legsebezhetőbb"  → min VÉ_aktuális
      - "fókusz"          → az első cél, amíg él
```

⚠ A `random` politika a hangolási tesztek default-ja, mert nem visz be taktikai bias-t.
Bármely más politika **rövidíti** a harcot, tehát a modellek közti különbséget csökkenti.

**Túlerő-kezelés**: a szabályrendszer 1:N esetén **nem** ad külön büntetést a bekerítettnek.
A túlerő hatása pontosan az, hogy több támadás csökkenti a VÉ-t körönként — ez a rendszer
szándékolt terve (`md/064_02_03`). Ne adj hozzá kitalált bekerítési büntetést.
Ami legitim: `Hátulról támadás` / `Mögékerülés` manőver / `Közrefogás` a túlerőben lévő
oldalnak, ha a narratíva indokolja — de ezt jelöld a teszt paramétereként.

### 12.1 ⚠ MÓDSZERTANI CSAPDA: azonos klónok félrevezetnek

Minden olyan mechanika hangolásánál, aminek az értéke a **találati esélytől** függ,
az azonos klónokkal végzett teszt **szisztematikusan alulértékeli** a mechanikát.

Konkrét eset (Fárasztás taktika, 2026-09-10):

| Felállás | Fárasztás a puszta támadáshoz képest |
|---|---|
| 1:3, három azonos REF-A klón | **dominált** — a fárasztó csapat rosszabbul jár (97,7 % vs 100 %) |
| 1:3, REF-A vezető + 2 REF-D pribék | **jobb** — a fárasztó csapat jobban jár (88,9 % vs 82,6 %) |

Az ok: a REF-A klón támadása `1,95–2,16` VÉ-t **és** ~8 ÉP-t hoz, tehát a Fárasztásra
váltás nagy sebzésveszteség. A REF-D pribék viszont **nem tudja eltalálni** a hőst, tehát
a támadása `1,6` VÉ-t és `0` ÉP-t hoz — nincs mit feláldozni.

**Szabály**: ha egy taktika/fortély értéke azon fordul, hogy a használó tud-e sebezni,
a hangolási tesztnek **tartalmaznia kell aszimmetrikus felállást is**. Az azonos klónos
teszt önmagában nem elégséges bizonyíték.

---

## §13 Ambiguitás-regiszter — ahol a szabály nem dönt

Ezek a pontok a szabálykönyvből **nem** dönthetők el egyértelműen. Minden szimulációnak
explicit döntést kell hoznia, és a döntést jelentenie kell az eredménnyel együtt.

### 13.1 A `k20T` forrása sikertelen támadásnál ⚠ NYITOTT

A `1 + k20T` VÉ csökkentésnél nincs kimondva, hogy a `k20T` **a már eldobott támadó
dobás** k20-ából jön-e, vagy külön dobás.

| Olvasat | E[VÉ csökk] Alappengén, 40 % találatnál | Megjegyzés |
|---|---|---|
| **közös kocka** (a támadódobás k20-a) | `1 + 0,25` = **1,25** | Asztalnál ez a természetes: már dobtál |
| **független kocka** | `1 + 0,6` = **1,60** | A képlet szó szerinti olvasata |

A webapp **nem** implementálja (a KM a `-1 / -2 / -3` gombokkal kézzel visz be), tehát
nincs döntőbíró a kódban sem.

#### A közös kocka olvasat szerkezeti következménye

Közös kocka mellett a `k20T` a tévesztésre **feltételes**, azaz lefelé torzított, és a
torzítás mértéke a találati eséllyel változik:

```
E[k20T | nem talált],  ha a találathoz k20 >= t kell:
    t <= 10   →  0,000     # csak 1-9-re lehet téveszteni, annak tízes része 0
    t = 13    →  0,250
    t = 16    →  0,400
    t = 20    →  0,526
    t >= 21   →  0,600     # eltalálhatatlan cél: minden dobás tévesztés
```

Ebből következik: **ha a védő VÉ-je ≤ TÉ + 10, a `k20T` mindig pontosan 0.** Ekkor a
sikertelen támadás VÉ csökkentése **teljesen deterministikus** lesz: Pengehátrány `0`,
Alappenge `1`, Pengeelőny `2` — kivétel nélkül.

Pontosítás: a pengeviszonyok közti **differenciálás megmarad** (a `0 / 1 / 2` eltolás
sértetlen). Ami elhal, az a `k20T` kockatag, és ennek két következménye van:

1. **A fáradásos erózió átlaga lecsökken** (Alappengén `1,60` → `1,00`), és épp ott,
   ahol a legtöbbet érne — a harc második felében, összeomlott VÉ mellett.
2. **A mechanika lassul, ahogy a harc előrehalad**, szemben a `md/064_02_03` kimondott
   szándékával („a csökkenő VÉ rövidebb harcokat eredményez"). A két olvasat közti rés
   a legnagyobb alacsony VÉ-nél: `+60 %` VÉ 54-nél, `+9 %` VÉ 66-nál.

#### Érv a független kocka mellett: támadódobás nélküli VÉ csökkentés

`md/066_04`: *„A sikertelen Manőver ugyanúgy és ugyanakkora VÉ csökkentést okoz, mintha
egy sima sikertelen támadás történt volna."*

38 manőverből **12-nek nincs Végrehajtás (V) fázisa** — tehát nincs benne k20 támadódobás.
Tisztán Ellenpróba (`k10`) alapú: `Mögékerülés`, `Terelés`, `Lánccsapdából szabadítás`,
`Rávetődés hátulról`. Ha ezek buknak, a szabály VÉ csökkentést ír elő, de **nincs k20**,
amiből a `k20T`-t venni lehetne. Közös kocka olvasattal ez definiálatlan.

Másodlagos érv: a `V,E` fázisú manővereknél (26 db) a Végrehajtás **sikerülhet**, miközben
az Ellenpróba bukik. Ilyenkor a manőver sikertelen → VÉ csökkentést okoz, de a támadódobás
k20-a **magasra** volt torzítva (elérte a célszámot), így közös kocka mellett a bukott
manőver szisztematikusan **több** VÉ-t vonna le, mint egy sima tévesztés — ellentmondva az
„ugyanakkora" kikötésnek.

#### Amit NEM lehet érvként használni

A `Teljes Védekezés` taktika `„Ellenfél VÉ csökkentés: (1 + k20T)"` sora **nem** bizonyíték.
A `bónuszuk` birtokos alak alapján ez az **ellenfelek által a Teljes Védekezőn okozott**
csökkentés, tehát ott van támadódobás. (Korábbi verzió ezt fordítva értelmezte.)

#### Státusz

**Nyitott.** A javasolt default a **független kocka** (a manőver-érv és a formula szó
szerinti olvasata alapján), de ez nem lezárt szabálydöntés. Minden hangolási futáshoz
jelentsd, melyik olvasattal ment, és nagy VÉ-érzékenységű vizsgálatnál futtasd mindkettőt.
A teljes harcra vetített hatás kicsi: `0,03–0,12 kör` és `0,1–0,5 százalékpont` a REF-B
felállásokban.

### 13.2 Kezdeményezés holtversenye

`md/064_02_01`: azonos KÉ esetén "egyszerre támadnak, csapásuk egyszerre érkezik".
→ **Döntés**: mindkét csapás végrehajtódik; ha az egyik meghal, a csapása **akkor is** üt.

### 13.3 "Hasonló tudású vagy erősebb ellenfél" a Győzelmi szabályhoz

Nincs mérőszám. **Javasolt proxy**: `ellenfél.tsz >= saját.tsz − 1`.

### 13.4 Kiváró taktika átengedett kezdeményezése

"Átengedett KÉ" + "TÉ+3 az első visszatámadásra, ha nem kapott sebet". A "visszatámadás"
körön belüli vagy következő körös, nincs kimondva.
→ **Javasolt**: a harcos a kezdeményezési sor végére kerül; ha a sorára érve nem kapott
sebet ebben a körben, `TÉ +3` az első támadására.

### 13.5 Roham / Öngyilkos roham "első oda-vissza csapás" hatóköre

→ **Javasolt**: a rohamozó 1. támadása + a célpont válaszcsapása. Utána a taktika lejár
(`roham_elhasznált = true`), a körön belüli további támadások normál értékkel.

### 13.6 Sebzéstípus választása

A `V/S` fegyvernél a támadó dönt. Hangolási tesztekben legyen **elsődleges** (nincs
Hátrány), kivéve ha kifejezetten a másodlagos sebzést vizsgálod.

### 13.7 Vérzés ütemezése

`md/064_02_08`: "a szituációtól és a KM szavától függ". Vérzés státuszok:
gyenge 1 ÉP/10 perc, közepes 1 ÉP/2 kör, erős 1 ÉP/kör.
→ Hangolási tesztekben **kikapcsolva**, hacsak nem tárgya a vizsgálatnak.

### 13.8 Manőverek

A manőverek ellenpróba-alapúak (`Manőver Alap + MP + k10` vs `Nehézség + ellenfél
Manőver Alap`), MP költséggel, max 1/kör. Egy hangolási szimulációban **hagyd ki**,
kivéve ha a manőver a vizsgálat tárgya — a variancia amit bevisz nagyobb, mint a
legtöbb hangolási különbség.

### 13.9 Teljes Védekezés: mit jelent az `1 + k20T`?

`md/065_02` Teljes Védekezés:

```
VÉ:+8, folyamatos hátrálás
Nem támadhatsz, nem varázsolhatsz
Ellenfél VÉ csökkentés: (1 + k20T)
  + "Fárasztó taktika" bónuszuk megmarad
```

**Az irány tisztázott**: a `bónuszuk` birtokos alak és a 317. sor jegyzete alapján ez az
**ellenfelek által a Teljes Védekezőn okozott** VÉ csökkentés, nem fordítva.

**Ami nyitott**: miért van egyáltalán kimondva, ha ez amúgy is a normál Alappenge érték?
A legvalószínűbb értelmezés: a Teljes Védekezés **normalizálja** a rajta okozott VÉ
csökkentést Alappenge szintre, azaz **semlegesíti az ellenfél Pengeelőnyét** (a
`2 + k20T`-t is `1 + k20T`-re fogja) — hasonlóan ahhoz, ahogy a `Közrefogás` helyzet teszi.
A méretkülönbség módosító a 317. sor szerint továbbra is hozzáadódik/levonódik.

→ **Javasolt szimulációs kezelés**: `pengeviszony` felülírása `alappenge`-re a Teljes
Védekezőt támadó minden ellenfélre; méretkülönbség és Fárasztás bónusz továbbra is hat.
Ez nem lezárt szabálydöntés — ha a Teljes Védekezés nem semlegesíti a Pengeelőnyt, akkor
a sor puszta emlékeztető, és el lehet hagyni.

---

## §14 Kívül eső hatókör

Ez a spec **nem** modellezi (tudatosan):

- **Távharc** (CÉ, Osztó, hatótáv, lövedékek) → `engine_spec.md §17`
- **Mágia**, Aura, Mágiaellenállás → `engine_spec.md §34`, `md/100_magiarendszer.md`
- **Harc alakzatban** → `engine_spec.md §28` (NEM IMPLEMENTÁLT, terv)
- **Manőverek** teljes ellenpróba-rendszere → `engine_spec.md §21.4`
- **Méreg**, betegség → `engine_spec.md §39` (terv)
- Mozgás, távolságok, terep, nekifutás geometriája
- Képzettség- és tulajdonságpróbák (kivéve az S4 ájulás- és haldoklás-próbát)
- Karakteralkotás, KP, HM/CM limitek

---

## §15 Önteszt — futtatható állítások

Egy szimulátor akkor tekinthető hitelesnek, ha **mind a 16 állítás** teljesül.
Ezek a `golden.test.ts` értékeivel és a §3 formuláival vannak összehangolva.

**Futtatható referencia-implementáció**: `code/harcszimulacio_selftest.py`
(a data layerből olvassa a táblákat, nem hardcode-olja — ha egy YAML változik, a teszt bukik).

```bash
cd /repo/github/szilank.code && python3 code/harcszimulacio_selftest.py
```

### Statikus (deterministic)

```
A1   ÉP(edzettség=3)                                  == 40
A2   S-kategória(ép_használt=10, oszlopméret=10)      == 1
A3   S-kategória(ép_használt=11, oszlopméret=10)      == 2
A4   sebesülés_TÉ_levonás(kat=3, FT_enyhítés=2)       == -4
A5   REF-A "Kard, lovag": TÉ==47, VÉ==60, SP==11, támadások==1
A6   REF-A "Tőr":         TÉ==40, VÉ==54, SP==5
A7   REF-A páncél_MGT==14, SFÉ_fizikai==5, merevvért_TÉ_büntetés==0
A8   k20T(5)==0 és k20T(16)==1 és k20T(20)==2
A9   sebzésElőny(15)==0, sebzésElőny(16)==1, sebzésElőny(20)==2
A10  netÉH([előny+2, előny+2])                        == 2      # clamp!
A11  túl_bónusz(túldobás=11)                          == 6      # 3 × FLOOR(11/5)
A12  computeVÉ(base=10, bónusz=0, taktika=-5, csökk=50) == 0    # alsó clamp
```

### Statisztikai (20 000 futás, ±0,5 % / ±0,1 kör)

```
B1   REF-B 1:1, mindkettő támad   →  győzelem 50/50 %,  hossz ≈ 3,9 kör
B2   REF-B 1:3, mindenki támad    →  a magányos ≈ 0 %,  hossz ≈ 1,8 kör
B3   E[sebzés | találat, SFÉ 5, túldobás 0]            ≈ 16,5
B4   P(találat | VÉ 60, TÉ 47, éh 0)                   == 0,40 pontosan
```

### Regressziós csapdák — amit ezek fognak el

| Állítás | Amit elkap |
|---|---|
| A2 / A3 | Off-by-one az S-kategória határon (`>` vs `>=`) |
| A4 | A Fájdalomtűrés pozitívba fordítja a levonást (hiányzó `MIN(0,...)`) |
| A5 | Elmaradt Mesterfegyver vagy harcmodor bónusz |
| A10 | Hiányzó Előny/Hátrány clamp → túl sok kocka |
| A11 | A túldobás bónusz limitálása (nincs felső limit!) |
| A12 | Negatív VÉ (a `MAX(0, ...)` elhagyása) |
| B1 | Asszimetria szimmetrikus felállásban → sorrend- vagy könyvelési hiba |
| B3 | Az SFÉ kimaradt, vagy kétszer vonódott le |

---

## §16 A szabályrendszerben talált következetlenségek

Ezeket a spec írása közben találtam. **Nem javítottam** semmit — ha valamelyiket
javítani kell, kérj rá külön döntést.

| # | Hely | Probléma |
|---|---|---|
| 1 | ~~`data/sources/taktikak.yaml:37`~~ | ✅ **JAVÍTVA 2026-09-10.** A megjegyzés azt írta: *„Csak Pengeelőnyben lehet"* — de a `md/065_02` szerint Alappenge és Pengeelőny is jó, csak a Pengehátrány tiltott. Új szöveg: *„Pengehátrányból nem alkalmazható."* |
| 2 | `data/sources/taktikak.yaml` — Fárasztás | ⚠ **NYITOTT.** A `3 VÉ` érték továbbra sem a data layerben van, csak a `megjegyzés` prózában (`módosítók: {}`). Sérti az AGENTS.md data-layer elsőbbségét. Megoldás: séma-bővítés (`vé_csökkentés` mező vagy strukturált `hatások`) + a webapp számolja. |
| 3 | ~~`engine_spec.md §21.1` tábla~~ | ⚠ **RÉSZBEN.** A Fárasztás sora frissítve (3), de a `Teljes Védekezés VÉ:+6` továbbra is elavult — a `taktikak.yaml` és a `md/065_02` egyaránt **`+8`**. |
| 4 | `engine_spec.md §13` | `pajzs_TÉ_büntetés` és `pajzs_TÉ_mérséklés` konstansokra hivatkozik, amelyek **nem léteznek** a `konstansok.json`-ban. A tényleges implementáció a `pajzs_hatások[méret][fok]` táblát használja (`pancel-calc.ts → calcFogas`). |
| 5 | `golden.test.ts` | A "Kard, lovag" teszt **címe** `VÉ=61`, az `expect` viszont `60`. A cím elavult. |
| 6 | Szabálykönyv-szintű | A `k20T` forrása sikertelen támadásnál nincs meghatározva (§13.1). |
| 7 | Szabálykönyv-szintű | A Teljes Védekezés `1 + k20T` sorának jelentése nem egyértelmű (§13.9). |
| 8 | **Webapp hiba** | **A fegyver Ideája (`fegyverek[].idea`, `[-5;+5]`) nincs implementálva.** A `md/068_01_14` szerint `TÉ/CÉ`, `VÉ`, `SP` módosítót ad (max `+3/+2/+5`), a mező a karakter sémában létezik és az `url-share.ts` szerializálja is — de sem a `rules.json`, sem a `fegyver-calc.ts` nem használja. A felhasználó beállíthatja, és semmi nem történik. A `golden.test.ts` nem fogja el, mert a teszt karakter fegyverei `idea: 0`. |
| 9 | Data layer hiány | A `md/082_statuszok.md` két státuszt definiál, amik **nincsenek** a `statuszok.yaml`-ban: `Fegyver/Pajzs akadályoztatása (1,2)` (:255) és `Páncél akadályoztatása (1 MGT, ♾️ MGT)` (:532). A `062_03` és `068_01_13` hivatkozik rájuk. Közelharci szimulációt nem érint (próbákra hatnak), de a 4 rétegű státusz-modell (§22) inkomplett. |
| 10 | Adat-inkonzisztencia | Az MK szabály (`md/068_01_06`: 1 kézzel `TÉ-2/VÉ-2`, Átütés megszűnik) a `fegyverek.json` `(1K)/(2K)` sorpárjaiba van beépítve. `Kard, másfélkezes` és `Kard, mesterkard` követi; `Kard, Slan` (ΔVÉ csak `-1`, Átütés `2` marad) és `Mara-sequor` (ΔTÉ/ΔVÉ csak `-1`) eltér. Lehet szándékos (legendás fegyverek), de nincs jelölve. |

---

## §17 Változásnapló

| Dátum | Változás |
|---|---|
| 2026-09-10 | **Fárasztó taktika hangolás: `2 VÉ` → `3 VÉ`.** Indok: aszimmetrikus túlerőben (REF-A vezető + 2 REF-D pribék egy REF-A hős ellen) a `2`-es érték a pribéknek csak `+0,40 VÉ/kör`-t ad a hasztalan támadáshoz képest (`1,60`), a `3`-as `+1,40`-et. A hangolás után a taktika szimmetrikus felállásban továbbra is dominált (nincs degenerált dominancia), aszimmetrikus túlerőben viszont `+6,4` százalékponttal jobb a puszta támadásnál. Érintett: `md/065_02:175`, `md/064_01:169`, `md/065_03:266` (alakzat fix érték), `taktikak.yaml`, `engine_spec §21.1` + `§28.9`, jelen spec §6.5 + §7. |
| 2026-09-10 | Első verzió. Forrás: `engine_spec.md §3–§27`, `md/060–069`, `md/081–082`, `data/tables/*.json`, `golden.test.ts`, `combat-roll-info.ts`, `fegyver-calc.ts`, `pancel-calc.ts`, `taktika-calc.ts`, `dice.ts`, `shared.ts`, `ep-logic.ts`. |
