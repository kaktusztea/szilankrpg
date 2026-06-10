# Engine Spec — Szilánk RPG Karakteralkotó kalkulációk

Ez a dokumentum leírja a webes karakteralkotó engine összes számítását.
Minden formulánál megadjuk az inputokat (honnan jönnek), a képletet, és az outputot.

---

## 1. KP (Karakteralkotó Pontok)

### 1.1 Összes KP

```
input:  karakter.tsz, karakter.tulajdonságok.intelligencia
source: konstansok.yaml → kp.perszint
formula: KP = tsz × (kp.perszint + intelligencia)
output: összes_kp
```

### 1.2 Szekunder KP

```
input:  karakter.tsz, karakter.tulajdonságok.emlékezet
source: konstansok.yaml → kp.szekunder_perszint
formula: szekunder_KP = tsz × (kp.szekunder_perszint + emlékezet)
output: összes_szekunder_kp
```

### 1.3 Elköltött KP

```
input:  karakter.képzettségek[].szint, karakter.fortélyok[].fok, karakter.HM_TÉ, karakter.HM_VÉ, karakter.CM
source: tables/kepzettseg_kp.json, schemas/kepzettseg.yaml (primer flag),
        konstansok.yaml → kp.fortélyfok, kp.hm, kp.cm

formula:
  kp_képzettségek = SUM( lookup(képzettség.szint → kepzettseg_kp.json) )
  kp_fortélyok    = SUM( fortély.fok ) × kp.fortélyfok
                    // kivéve: kiérdemelt fortélyok (kiérdemelt=true → 0 KP)
                    // kivéve: szabad fortélyok ingyenes kerete (első TSz db → 0 KP)
                    // kivéve: ingyenes_perszint > 0 fortélyok (Kultúrkör, Helyismeret → 0 KP)
                    // szabad fortélyok keret feletti KP: szekunder KP-ból fizetendő (nem primer)
  kp_hm           = (HM_TÉ + HM_VÉ) × kp.hm
  kp_cm           = CM × kp.cm
  elköltött_kp    = kp_képzettségek + kp_fortélyok + kp_hm + kp_cm

  // Szekunder ismeretekre költött KP (szekunder képzettségek + nem-harci/nem-misztikus fortélyok)
  kp_szekunder_költött = SUM( szekunder képzettségek KP-ja )
                       + SUM( szekunder fortélyok fok × kp.fortélyfok )

  maradék_kp = (összes_kp + spec_kp + összes_szekunder_kp) - elköltött_kp

output: elköltött_kp, maradék_kp
validate:
  primer_limit = összes_kp + spec_kp                         // primer célra CSAK ebből költhető
  primer_költés = SUM( primer képzettségek KP-ja )
                + SUM( primer fortélyok fok × kp.fortélyfok )
                + kp_hm + kp_cm
  maradék_kp ≥ 0
  primer_költés ≤ primer_limit                               // primer költés nem lépi túl

note: Primer képzettség matching: exact név VAGY prefix match ("Tradíció: ..." → primer, mert "Tradíció" primer).

UI kijelzés (KP sáv, szerkesztő módban):
  Bal fél:  "Maradt KP: {maradék_kp}"           // piros háttér ha < 0
  Jobb fél: "Primer keret: {primer_limit - primer_költés}"  // piros háttér ha < 0
```

### 1.4 Speciális KP bónusz

```
input:  karakter.fortélyok_speciális
source: konstansok.yaml → kp_bónusz

formula:
  spec_kp = 0
  if analfabéta:       spec_kp += kp_bónusz.analfabéta
  if apró_méretű_lény: spec_kp += kp_bónusz.apró_méretű_lény
  if süketség:         spec_kp += kp_bónusz.süketség
  if vakság:           spec_kp += kp_bónusz.vakság
  spec_kp += tartós_sérülés_fok × kp_bónusz.tartós_sérülés_per_fok

output: spec_kp (hozzáadódik az összes_kp-hoz)
```

---

## 2. Tulajdonság pontok

```
input:  karakter.tulajdonságok (mind a 8), karakter.tsz
source: konstansok.yaml → tulajdonság_pontok, arányok.tulajdonság_pont_alap, arányok.tulajdonság_pont_tsz_bónusz

formula:
  keret = tulajdonság_pont_alap + FLOOR(tsz / 2)
  elköltött = SUM( lookup(tulajdonság_érték → tulajdonság_pontok) )  // mind a 8-ra
  maradék = keret - elköltött

output: tulajdonság_pont_keret, elköltött_tulajdonság_pont, maradék_tulajdonság_pont
note: 6 (26 pont) és 7 (33 pont) értékek csak faji/mágikus módosítóval érhetőek el
```

---

## 3. Életerő Pont (ÉP)

```
input:  karakter.tulajdonságok.edzettség
formula: ÉP = 28 + (edzettség × 4)
output: ÉP
```

### 3.1 Sebesülés kategóriák (S1–S4 határok)

```
input:  ÉP
formula:
  S1_max = ÉP / 4
  S2_max = ÉP / 2
  S3_max = ÉP × 3 / 4
  S4_max = ÉP

output: [S1_max, S2_max, S3_max, S4_max]
note: JK-nál ÉP mindig 4-gyel osztható. NJK-nál maradék balról jobbra osztandó.
      TÉ levonások → konstansok.yaml → egészség_kategória_levonás
```

---

## 4. Kezdeményező Érték (KÉ)

```
input:  karakter.tulajdonságok.gyorsaság, karakter.tulajdonságok.intelligencia, karakter.tsz
source: konstansok.yaml → harcérték_alap.KÉ

formula:
  KÉ = harcérték_alap.KÉ + gyorsaság + intelligencia + tsz
     + fortély_módosítók(cél="KÉ", feltétel="")

output: KÉ
```

---

## 5. Támadó Érték (TÉ) — fegyverenként

```
note: Másfélkezes (MK) fegyverek: a fegyverek.json-ban két entry van (1K és 2K variáns, 
      eltérő harcértékekkel). A karakter példányban 1 fegyver példány (az 1K nevet tárolja),
      de a Harc fülön mindkét variáns megjelenik. Az MK_pár mező azonosítja a párt.
      Az Alapnév mező a suffix nélküli display név (pl. "Kard, másfélkezes").
      
      Fegyver kategória → harcmodor képzettség mapping:
        közelharci → Közelharc
        kardvívó → Kardvívás
        romboló → Rombolás
        lándzsavívó → Lándzsavívás
        ostorharc → Ostorharc
```

```
input:  karakter.tulajdonságok.erő, karakter.tulajdonságok.ügyesség,
        karakter.tulajdonságok.gyorsaság,
        karakter.HM_TÉ,
        harcmodor_szint (a fegyver kategóriájához tartozó harcmodor),
        fegyver.TÉ (választott fegyver),
        mesterfegyver_fok (adott fegyverre)
source: konstansok.yaml → harcérték_alap.TÉ, mesterfegyver_bónuszok
        tables/harcmodor_kepzettsegek_bonuszok.json

formula:  // ismételve minden egyes fegyverre
  TÉ_alap = harcérték_alap.TÉ + erő + ügyesség + gyorsaság + HM_TÉ
  TÉ_harcmodor = lookup(harcmodor_szint → harcmodor_kepzettsegek_bonuszok.json).TÉ
  TÉ_fegyver = fegyver.TÉ
  TÉ_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).TÉ
  TÉ_fortély = SUM( fortély_módosítók(cél="TÉ", feltétel="") )

  TÉ = TÉ_alap + TÉ_harcmodor + TÉ_fegyver + TÉ_mesterfegyver + TÉ_fortély

output: TÉ (per fegyver)
```

---

## 6. Védő Érték (VÉ) — fegyverenként

```
input:  karakter.tulajdonságok.gyorsaság, karakter.tulajdonságok.ügyesség,
        karakter.HM_VÉ,
        harcmodor_szint (a fegyver kategóriájához tartozó harcmodor),
        fegyver.VÉ,
        mesterfegyver_fok (adott fegyverre)
source: konstansok.yaml → harcérték_alap.VÉ, mesterfegyver_bónuszok
        tables/harcmodor_kepzettsegek_bonuszok.json

formula:  // ismételve minden egyes fegyverre
  VÉ_alap = harcérték_alap.VÉ + gyorsaság + ügyesség + HM_VÉ
  VÉ_harcmodor = lookup(harcmodor_szint → harcmodor_kepzettsegek_bonuszok.json).VÉ
  VÉ_fegyver = fegyver.VÉ
  VÉ_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).VÉ
  VÉ_fortély = SUM( fortély_módosítók(cél="VÉ", feltétel="") )

  VÉ = VÉ_alap + VÉ_harcmodor + VÉ_fegyver + VÉ_mesterfegyver + VÉ_fortély

output: VÉ (per fegyver)
note: A végső VÉ-hez hozzáadódik a pajzs VÉ bónusz (lásd §13) ha van pajzs és van szabad kéz.
      A Teljes harcértékek táblázatban a VÉ = fegyver VÉ + pajzs VÉ (ha aktív).
```

---

## 7. Célzó Érték (CÉ) — fegyverenként

```
input:  karakter.tulajdonságok.önuralom,
        karakter.CM,
        táv_harcmodor_szint (a távfegyver kategóriájához tartozó),
        távfegyver.CÉ,
        mesterfegyver_fok (adott fegyverre)
source: konstansok.yaml → harcérték_alap.CÉ, mesterfegyver_bónuszok
        tables/harcmodor_kepzettsegek_bonuszok.json

formula:
  CÉ_alap = harcérték_alap.CÉ + önuralom + CM
  CÉ_harcmodor = lookup(táv_harcmodor_szint → harcmodor_kepzettsegek_bonuszok.json).CÉ
  CÉ_fegyver = távfegyver.CÉ
  CÉ_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).TÉ  // távfegyverre: Mf ugyanúgy +1/+2/+3 CÉ-t ad
  CÉ_fortély = SUM( fortély_módosítók(cél="CÉ", feltétel="") )

  CÉ = CÉ_alap + CÉ_harcmodor + CÉ_fegyver + CÉ_mesterfegyver + CÉ_fortély

output: CÉ (per távfegyver)
```

---

## 8. Sebzés Pont (SP) — fegyverenként

```
input:  fegyver.SP, mesterfegyver_fok (adott fegyverre),
        karakter.tulajdonságok.erő, fegyver.erőbónusz_limit
source: konstansok.yaml → mesterfegyver_bónuszok

formula:  // ismételve minden egyes fegyverre
  erőbónusz = MIN(erő, fegyver.erőbónusz_limit)  // negatív erő is számít, limit csak pozitívra
  SP_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).SP
  SP_fortély = SUM( fortély_módosítók(cél="SP", feltétel="") )

  SP = fegyver.SP + erőbónusz + SP_mesterfegyver + SP_fortély

output: SP (per fegyver)
note: sebzésmód (S/V/Z) a fegyverből jön, nem számítás
```

---

## 9. Harckeret (támadások száma) — fegyverenként

```
input:  fegyver.sebesség, harcmodor_szint (a fegyver kategóriájához tartozó),
        karakter.tulajdonságok.gyorsaság, MGT (páncél + felszerelés)
source: konstansok.yaml → kétkezes_harc_bónuszok (ha kétkezes harc aktív)

formula:  // ismételve minden egyes fegyverre
  harckeret = harcmodor_szint + gyorsaság - páncél_MGT - felszerelés_mgt
  harckeret += SUM( fortély_módosítók(cél="harckeret", feltétel="") )
  harckeret = MAX(0, harckeret)

  plusz_támadások = FLOOR(harckeret / fegyver.sebesség)
  össz_támadás = 1 + plusz_támadások

output: össz_támadás (támadások száma / kör)
note: Ha össz_támadás >= 2, minden támadásra TÉ:-3 levonás jár (az elsőre is).
impl: páncél_MGT a reactive engine `páncél_MGT` szabályából jön.
      A `fegyver_harckeret` reactive rule használja inputként.
      Harc fül Tám cella: kattintásra info popup (fegyver név, sebesség, harckeret).
```

---

## 10. Páncél SFÉ

```
input:  páncél.alap (struktúra), páncél.fémalapanyag, páncél.idea, páncél.rongálódás
source: konstansok.yaml → páncél_struktúrák, páncél_fémalapanyagok

formula:
  struktúra = lookup(páncél.alap → páncél_struktúrák)
  alapanyag = lookup(páncél.fémalapanyag → páncél_fémalapanyagok)  // üres ha nem fém

  sfé_fizikai = struktúra.sfé_fizikai + alapanyag.sfé_bónusz + páncél.idea - páncél.rongálódás
  sfé_energia = struktúra.sfé_energia + alapanyag.sfé_bónusz + páncél.idea - páncél.rongálódás

output: sfé_fizikai, sfé_energia

reactive rules.json:
  sfé_fizikai: páncél_struktúra_sfé_fizikai + páncél_alapanyag_sfé_bónusz + páncél_idea - páncél_rongálódás
  sfé_energia: páncél_struktúra_sfé_energia + páncél_alapanyag_sfé_bónusz + páncél_idea - páncél_rongálódás

impl: A struktúra és alapanyag értékek string-keyed lookup szabályokból jönnek (rules.json).
      A HarcScreen közvetlenül a karakter adatokból építi a context-et + lookup táblákat.
      Ha nincs struktúra kiválasztva → minden 0, lefedettség = 0%.
```

---

## 11. Páncél MGT

```
input:  páncél.alap, páncél.fémalapanyag, páncél.kidolgozottság,
        páncél.végtagvédettség, páncél.sisak, páncél.méret_illeszkedés,
        karakter.tulajdonságok.erő
source: konstansok.yaml → páncél_struktúrák, páncél_fémalapanyagok, páncél_csatolt_tag_mgt

formula:
  struktúra = lookup(páncél.alap → páncél_struktúrák)
  alapanyag_mgt = lookup(páncél.fémalapanyag → páncél_fémalapanyagok).mgt  // 0 ha nem fém

  // csatolt tagok MGT meghatározása (struktúra típus alapján)
  if struktúra.merev:
    tag_mgt_per_db = páncél_csatolt_tag_mgt.merevvért_fém[kidolgozottság]
  elif struktúra.fém:
    tag_mgt_per_db = páncél_csatolt_tag_mgt.hajlékonyvért_fém[kidolgozottság]
  else:
    tag_mgt_per_db = páncél_csatolt_tag_mgt.hajlékonyvért_nem_fém[kidolgozottság]

  csatolt_db = végtagvédettség + (1 if sisak else 0)
  csatolt_mgt = csatolt_db × tag_mgt_per_db

  méret_mgt = { "passzol": 0, "nem passzol": 3, "borzalmas": 6 }[méret_illeszkedés]

  MGT = struktúra.mgt + alapanyag_mgt + csatolt_mgt + méret_mgt - erő
  MGT = MAX(0, MGT)  // nem lehet negatív

output: MGT

reactive rules.json:
  páncél_MGT: max(0, struktúra_mgt + alapanyag_mgt + csatolt_db * if(merev, lookup(merev_tábla,...), if(fém, lookup(fém_tábla,...), lookup(nemfém_tábla,...))) + méret_mgt - erő)

impl: A raw inputok (struktúra_mgt, alapanyag_mgt, csatolt_db, méret_mgt, merev, fém) lookup szabályokból jönnek.
      A feltételes lookup (kidolgozottság → tag_mgt_per_db) a rules.json-ban van nested if() + lookup() + StringContext-tel.
      A 3 csatolt_mgt tábla (merev/fém/nemfém) ArrayContext-ben.
```

---

## 12. Merevvért TÉ büntetés

```
input:  MGT (§11 outputja, ha merev páncél), merevvértviselet fortély fok
source: konstansok.yaml → merevvértviselet_bónuszok

formula:
  if struktúra.merev:
    TÉ_büntetés_nyers = MGT
    csökkentés = lookup(merevvértviselet_fok → merevvértviselet_bónuszok).TÉ_büntetés_csökkentés
    TÉ_büntetés = MAX(0, TÉ_büntetés_nyers - csökkentés)
  else:
    TÉ_büntetés = 0

output: merevvért_TÉ_büntetés (levonandó a végső TÉ-ből)

reactive rules.json:
  merevvért_TÉ_büntetés: if(páncél_merev, max(0, páncél_MGT - merevvért_csökkentés), 0)

impl: páncél_merev (0/1) és merevvért_csökkentés lookup szabályokból jönnek (struktúrák tábla + merevvért_tábla).
```

---

## 13. Pajzs bónuszok és büntetések

```
input:  karakter.pajzs.méret (kis/közepes/nagy/""),
        karakter.pajzs.pajzshasználat_fok (0-3)
source: konstansok.yaml → pajzshasználat_TÉ_büntetés, tables/pajzsok.json

formula:
  if pajzs.méret == "": nincs pajzs → VÉ_pajzs = 0, TÉ_büntetés_pajzs = 0

  pajzs_data = lookup(pajzs.méret → pajzsok.json)  // "kis" → "Kis Pajzs", stb.
  VÉ_pajzs = pajzs_data.VÉ
  if pajzshasználat_fok == 0:
    VÉ_pajzs = FLOOR(VÉ_pajzs / 2)            // 0.fok: csak VÉ fele aktív
  elif pajzshasználat_fok == 3:
    VÉ_pajzs += 2                             // 3.fok: +2 VÉ extra minden pajzshoz
  TÉ_büntetés_pajzs = lookup(pajzs.méret → pajzshasználat_TÉ_büntetés).fokok[pajzshasználat_fok]

output: VÉ_pajzs, TÉ_büntetés_pajzs
note: 0.fok esetén a pajzs VÉ-je felére csökken.
      Pajzs csak ha van szabad kéz (egykezes fegyver mellett). Kétkezes fegyverrel vagy kétkezes harcban nem használható.
      A pajzs "kézben" állapotot a session.aktív_pajzs toggle vezérli (Aktív fül).
      Pajzshasználat fortély szinkronizálva: karakter.pajzs.pajzshasználat_fok ↔ fortélyok[Pajzshasználat].fok
```

---

## 14. Manőver Alap / Manőver Pont

```
input:  közelharci harcmodor szintek (közelharc, kardvívás, rombolás, lándzsavívás, ostorharc),
        karakter.tsz

formula:
  harcmodor_összeg = SUM(közelharc, kardvívás, rombolás, lándzsavívás, ostorharc)
  manőver_pont = CEIL(harcmodor_összeg × 2 / tsz)

output: manőver_pont
note: Értéke [0; 10] tartományban mozog. Egy harci jelenet alatt használható fel, VÉ regenerálódáskor visszatöltődik.
```

---

## 15. Felszerelés MGT

```
input:  karakter.felszerelés.nagy_tárgyak[].MGT, karakter.tulajdonságok.erő

formula:
  felszerelés_keret = 2 + erő
  felszerelés_terhelés = SUM(nagy_tárgyak[].MGT)     // közepes=1, nagy=2 pontonként
  felszerelés_mgt = MAX(0, felszerelés_terhelés - felszerelés_keret)

output: felszerelés_mgt
note: Hatása pontonként: -1 TÉ, -1 Harckeret. A viselt páncél NEM számít bele.
```

---

## 16. Fortély módosítók alkalmazása

```
input:  karakter.fortélyok[], data/sources/fortelyok/**/*.yaml
logic:
  FOR EACH karakter.fortélyok as kf:
    fortély_def = lookup(kf.név → fortelyok/**/*.yaml)
    aktív_fok = fortély_def.fokok[kf.fok]

    FOR EACH aktív_fok.módosítók as mod:
      if mod.feltétel == "":  // MINDIG aktív
        if mod.mód == "flat":
          harcérték[mod.cél] += mod.érték
        elif mod.mód == "scaled":
          forrás_érték = lookup(mod.forrás → képzettség szint vagy egyéb)
          harcérték[mod.cél] += FLOOR(forrás_érték × mod.arány)
        elif mod.mód == "override":
          harcérték[mod.cél] = mod.érték      // felülírja az alapértéket

output: módosított harcértékek
note: feltétel == "" → mindig aktív (karakterlap számolja).
      feltétel == "prefix:érték" → feltételesen aktív (UI toggle / automatikus).
      Prefixek (lásd konstansok.yaml → feltétel_prefixek):
        szituáció, harci_helyzet, taktika, fegyver, fegyver_kategória, manőver, státusz
      Speciális feltétel esetek:
        - "fegyver:" (üres érték) → Mesterfegyver fortély: aktív ha az adott spec_elem fegyver van kiválasztva
        - "fegyver:puszta kéz" → csak puszta kéz harccal aktív
impl: A fokok tömbben a fok értéke NEM feltétlenül egyezik a tömb indexével.
      Sok fortélynál nincs fok:0 (alapeset), csak fok:1-től indul.
      A lookup tehát: fortély_def.fokok.find(f → f.fok == kf.fok), NEM fokok[kf.fok].
      Scaled mód — `forrás` lehetséges értékei:
        - Képzettség név (kisbetű): pl. "akrobatika" → a karakter képzettség szintje
        - Számított érték: pl. "erőbónusz" → min(erő, fegyver.erőbónusz_limit)
        - A forrás-értéket `floor(érték × arány)` adja a bónuszt.
      Követelmények logika:
        - A követelmények lista elemei ÉS kapcsolatban vannak (mindegyiknek teljesülnie kell).
        - Ha egy elem "név" mezője lista (pl. ["közelharc", "kardvívás"]), az VAGY kapcsolat: bármelyik teljesíti.
      Többszörös fortélyok (karakter séma v2):
        - kf.név = mindig az alapnév (megegyezik a fortely yaml "név" mezőjével)
        - kf.spec_típus = megegyezik fortély_def.többszörösség.spec_típus-ával ("" ha nem többszörös)
        - kf.spec_elem = a konkrét választott példány (pl. "erv", "kard, lovag")
        - Lookup: kf.név alapján (nem kf.spec_elem!)
```

---

## 17. Távharc Védő Érték kalkulátor

```
input:  távolság (m), távfegyver.osztó,
        célpont_mozgás, lövész_mozgás, célpont_méret,
        észlelhetőség, szél
source: tables/tavharc_szorzok.json

formula:
  // 1. Cella kiszámítása (felfelé kerekítés)
  cella = CEIL(távolság / távfegyver.osztó)

  // 2. Szorzó kiszámítása (összetevők összege)
  szorzó = célpont_mozgás.szorzó
          + lövész_mozgás.szorzó
          + célpont_méret.szorzó
          + észlelhetőség.szorzó
          + szél.szorzó

  // 3. Célpont Védő Érték
  if szorzó >= 1:
    cél_VÉ = szorzó × cella
  else:
    cél_VÉ = cella - ABS(szorzó)    // szorzó 0 vagy negatív: kivonás (VÉ csökken)

output: cél_VÉ
note: Találati esély = CÉ + k20 >= cél_VÉ
      Százalékban: MAX(0, MIN(100, ((21 - (cél_VÉ - CÉ)) / 20) × 100))
```

---

## 18. HM / CM limitek

```
input:  karakter.HM_TÉ, karakter.HM_VÉ, karakter.CM, karakter.tsz,
        harci_fortély_fokok, harcmodor_szintek
source: konstansok.yaml → arányok

formula:
  max_HM = SUM(harci_fortély_fokok, Mesterfegyver nélkül) + SUM(5_közelharci_harcmodor_szint + alakzatharc_szint)
  max_CM = tsz × arányok.max_cm_perszint

  // HM elosztás: 1 HM → VAGY 1 TÉ, VAGY 1 VÉ (nem mindkettő!)
  // HM_TÉ + HM_VÉ = HM (összesen)
  // TÉ/VÉ aszimmetria limit:
  max_HM_aszimmetria = FLOOR(tsz / 2)
  validate: ABS(HM_TÉ - HM_VÉ) ≤ max_HM_aszimmetria

output: max_HM, max_CM, max_HM_aszimmetria

reactive rules.json:
  max_HM: sum_where(harci_fortélyok, fok, is_mesterfegyver, 0) + harcmodor_összeg + alakzatharc_szint
  max_HM_aszimmetria: floor(tsz / 2)
  max_CM: tsz * konstansok.arányok.max_cm_perszint

note: A Mesterfegyver fortély fokai NEM számítanak a max_HM-be.
      A harci_fortélyok ArrayContext-ben {fok, is_mesterfegyver} record-ok vannak.
```

---

## 19. Képzettség limitek

```
input:  karakter.tsz, képzettség.primer
source: konstansok.yaml → arányok.képzettség_nemprimer_max_szint_plusz, arányok.képzettség_max_szint

formula:
  if primer:
    max_szint = MIN(arányok.képzettség_max_szint, tsz)
  else:
    max_szint = MIN(arányok.képzettség_max_szint, tsz + arányok.képzettség_nemprimer_max_szint_plusz)

output: max_képzettség_szint
note: Abszolút maximum: 15.szint. Szintlépésenként max 2 szinttel növelhető egy képzettség.
```

### 19b. Nyelvismeret pont keret (UI validáció, nem rules.json)

```
input:  Nyelvtanulás képzettség szint, karakter.fortélyok[] (Nyelvismeret entries)
formula:
  nyelv_pont_keret = MAX(0, (nyelvtanulás_szint - 3) × 3)
  nyelv_összfok = SUM( nem-kiérdemelt Nyelvismeret fortélyok foka )
                + SUM( kiérdemelt Nyelvismeret fortélyok: max(0, fok - 1) )  // első fok ingyenes
  túllépés = MAX(0, nyelv_összfok - nyelv_pont_keret)

validate: nyelv_összfok ≤ nyelv_pont_keret
UI: túllépés > 0 → utolsó N fizetős Nyelvismeret sor pirosra vált (incl. kiérdemelt ha fok>1), dropdown disabled
note: Nem rules.json szabály — inline számítás a FortelyokScreen-ben.
      Nyelvismeret kp_perfok: 0 (nem KP-ból, hanem Nyelvtanulás pontokból vehető fel).
      Kiérdemelt Nyelvismeret: anyanyelv választásból szinkronizálva (Közös Alap + anyanyelv Alap).
      Fok emelhető (Alap→Udvari), az extra fok fizetős pontból.
      UI: "Alap" / "Udvari" label (nem szám), 🎁 / 🎁➕ jelölés.
```


---

## 20. Faj háttér és tulajdonság keretek

```
input:  karakter.hátterek.faj, data/sources/fajok/*.yaml
source: schemas/faj.yaml

kapcsolat:
  karakter.hátterek.faj → lookup(faj.név → data/sources/fajok/*.yaml) → faj_def

validáció:
  // Tulajdonság keretek: minden tulajdonság a faj által megengedett [min; max] tartományban
  FOR EACH tulajdonság in karakter.tulajdonságok:
    faj_def.tulajdonság_keretek[tulajdonság].min ≤ érték ≤ faj_def.tulajdonság_keretek[tulajdonság].max

  // Érzék fortélyok: csak a faj által engedélyezettek vehetők fel, max fokig
  FOR EACH éf in karakter érzék-fortélyai:
    éf.név MUST BE IN faj_def.érzék_fortélyok[].név
    éf.fok ≤ faj_def.érzék_fortélyok[].max_fok

  // Kötelező fortélyok: a karakter MUST HAVE mindegyiket
  FOR EACH kf in faj_def.kötelező_fortélyok:
    kf MUST BE IN karakter.fortélyok[].név OR karakter.fortélyok_speciális

  // Tiltások
  FOR EACH tk in faj_def.tiltott_képzettségek:
    tk MUST NOT BE IN karakter.képzettségek[].név
  FOR EACH tf in faj_def.tiltott_fortélyok:
    tf MUST NOT BE IN karakter.fortélyok[].név

output: validációs eredmény (pass/fail + hibák listája)
note: A faj_misztérium mező megmondja, melyik Faj Misztérium képzettséget veheti fel a karakter.
```
