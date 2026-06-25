# Engine Spec — Szilánk RPG Karakteralkotó kalkulációk

Ez a dokumentum leírja a webes karakteralkotó engine összes számítását.
Minden formulánál megadjuk az inputokat (honnan jönnek), a képletet, és az outputot.

---

## 1. KP (Karakteralkotó Pontok)

### 1.1 Összes KP

```
input:  karakter.tsz, karakter.tulajdonságok.intelligencia
source: konstansok.yaml → kp.perszint
formula: KP = tsz x (kp.perszint + intelligencia)
output: összes_kp
```

### 1.2 Szekunder KP

```
input:  karakter.tsz, karakter.tulajdonságok.emlékezet
source: konstansok.yaml → kp.szekunder_perszint
formula: szekunder_KP = tsz x (kp.szekunder_perszint + emlékezet)
output: összes_szekunder_kp
```

### 1.3 Elköltött KP

```
input:  karakter.képzettségek[].szint, karakter.fortélyok[].fok, karakter.HM_TÉ, karakter.HM_VÉ, karakter.CM
source: tables/kepzettseg_kp.json, schemas/kepzettseg.yaml (primer flag),
        konstansok.yaml → kp.fortélyfok, kp.hm, kp.cm

formula:
  kp_képzettségek = SUM( lookup(képzettség.szint → kepzettseg_kp.json) )
  kp_fortélyok    = SUM( fortély.fok ) x kp.fortélyfok
                    // kivéve: kiérdemelt fortélyok (kiérdemelt=true → 0 KP, nem számít primer költésbe sem)
                    // kivéve: szabad fortélyok ingyenes kerete (első TSz db → 0 KP)
                    // kivéve: ingyenes_perszint > 0 fortélyok (Kultúrkör, Helyismeret → 0 KP)
                    //         kiérdemelt NEM foglalja az ingyenes keretet
                    // szabad fortélyok keret feletti KP: szekunder KP-ból fizetendő (nem primer)
  kp_hm           = (HM_TÉ + HM_VÉ) x kp.hm
  kp_cm           = CM x kp.cm
  elköltött_kp    = kp_képzettségek + kp_fortélyok + kp_hm + kp_cm

  // Szekunder ismeretekre költött KP (szekunder képzettségek + nem-harci/nem-misztikus fortélyok)
  kp_szekunder_költött = SUM( szekunder képzettségek KP-ja )
                       + SUM( szekunder fortélyok fok x kp.fortélyfok )

  maradék_kp = (összes_kp + spec_kp + összes_szekunder_kp) - elköltött_kp

output: elköltött_kp, maradék_kp
validate:
  primer_limit = összes_kp + spec_kp                         // primer célra CSAK ebből költhető
  primer_költés = SUM( primer képzettségek KP-ja )
                + SUM( primer fortélyok fok x kp.fortélyfok )
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
  spec_kp += tartós_sérülés_fok x kp_bónusz.tartós_sérülés_per_fok

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
formula: ÉP = 28 + (edzettség x 4)
output: ÉP
```

### 3.1 Sebesülés kategóriák (S1–S4 határok)

```
input:  ÉP
formula:
  S1_max = ÉP / 4
  S2_max = ÉP / 2
  S3_max = ÉP x 3 / 4
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
note: A rules.json KÉ képlete NEM tartalmazza a fortély módosítókat (körkörös függőség miatt).
      A HarcScreen utólag adja hozzá: computed.KÉ + taktikaMods.KÉ + fortelyMods.KÉ.
```

---

## 5. Támadó Érték (TÉ) — fegyverenként

```
note: Másfélkezes (MK) fegyverek: a fegyverek.json-ban két entry van (1K és 2K variáns,
      eltérő harcértékekkel). A karakter példányban 1 fegyver példány (az 1K nevet tárolja),
      de a Harc fülön mindkét variáns megjelenik. Az MK_pár mező azonosítja a párt.
      Az Alapnév mező a suffix nélküli display név (pl. "Kard, másfélkezes").

      Fegyver kategória → harcmodor képzettség mapping:
        source: konstansok.yaml → fegyver_kategória_harcmodor
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
note: A végső VÉ-hez hozzáadódik a pajzs VÉ bónusz (lásd §13) ha session.aktív_pajzs = true.
      Pajzs VÉ: lookup(pajzs.méret → tables/pajzsok.json).VÉ (kis:3, közepes:10, nagy:16).
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
  CÉ_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).CÉ
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
  erőbónusz = MIN(erő, fegyver.erőbónusz_limit)  // limit=0 → nincs erőbónusz; üres/"" → limit=99 (korlátlan)
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
        karakter.tulajdonságok.gyorsaság, MGT (páncél + felszerelés),
        fortély módosítók (cél: "harckeret")
source: rules.json (fegyver_harckeret, fegyver_támadások)

formula (egyfegyveres):
  harckeret = harcmodor_szint + gyorsaság - páncél_MGT - felszerelés_mgt + fortelyMods['harckeret']
  harckeret = MAX(0, harckeret)

  plusz_támadások = FLOOR(harckeret / fegyver.sebesség)
  össz_támadás = 1 + plusz_támadások

fortelyMods['harckeret'] összegzése (§16):
  Harckeret növelés fortély: +1/+2/+3 (mindig aktív)
  Kétkezes harc fortély: +2/+3/+4 (feltétel: fegyverfogás:kétkezes → egyfegyveresnél NEM számít)
  Kétkezesség fortély: +1 (feltétel: session.kétkezes_harc == true → egyfegyveresnél NEM számít)

formula (kétkezes harc):
  harckeret = harcmodor_szint + gyorsaság + fortelyMods['harckeret'] + kh_alap - pengelevonás
  kh_alap = konstansok.kétkezes_harc_bónuszok[0].harckeret (+1) HA nincs Kétkezes harc fortély, egyébként 0
  pengelevonás = FLOOR(sum_pengehossz / kétkezes_harc_pengelevonás_osztó)
  Részletek: §26.5

output: össz_támadás (támadások száma / kör)
note: Ha össz_támadás >= 2, minden támadásra TÉ:-3 levonás jár (az elsőre is).
impl: páncél_MGT a reactive engine `páncél_MGT` szabályából jön.
      A `fegyver_harckeret` reactive rule használja inputként (egyfegyveres).
      Kétkezes harc: saját kalkuláció a HarcScreen-ben (§26).
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
      Végleges SFÉ a Harc fülön: (session.aktív_páncél ? computed.sfé : 0) + fortelyMods['SFÉ']
      A fortély SFÉ (pl. Természetes páncél) mindig aktív, független a páncél viseléstől.
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
  csatolt_mgt = csatolt_db x tag_mgt_per_db

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
        session.fegyverfogás (fegyver_pajzs mód aktiválja),
        fortélyok: Pajzshasználat fok (0-3)
source: konstansok.yaml → pajzs_TÉ_büntetés, tables/pajzsok.json,
        fortelyok/harci/pajzshasznalat.yaml → módosítók (pajzs_TÉ_mérséklés, VÉ)

formula:
  if fegyverfogás ≠ "fegyver_pajzs" VAGY pajzs.méret == "": → VÉ_pajzs = 0, TÉ_büntetés_pajzs = 0

  pajzs_data = lookup(pajzs.méret → pajzsok.json)  // "kis" → "Kis Pajzs", stb.
  VÉ_pajzs = pajzs_data.VÉ

  // TÉ büntetés: egydimenziós konstans + fortély mérséklés
  alap_büntetés = lookup(konstansok.pajzs_TÉ_büntetés, méret, pajzs.méret, büntetés)
    // kis: -3, közepes: -6, nagy: -9
  mérséklés = fortelyMods['pajzs_TÉ_mérséklés']
    // Pajzshasználat fok 1: +3, fok 2: +6, fok 3: +9 (fortély yaml módosító, feltétel: fegyverfogás==fegyver_pajzs)
  TÉ_büntetés_pajzs = MIN(0, alap_büntetés + mérséklés)

  // VÉ bónusz: 3. fok +2 (fortély yaml módosító, feltétel: fegyverfogás==fegyver_pajzs)
  // Ez a fortelyMods['VÉ']-be kerül → fegyver_fortély_VÉ → reactive engine fegyver_VÉ

output: VÉ_pajzs (fogásResult lila sorban), TÉ_büntetés_pajzs (fogásResult lila sorban)
note: Fegyver+pajzs mód automatikusan aktív_pajzs = true.
      Pajzs csak fegyver_pajzs fegyverfogásban használható (nem kétkezes, nem hárító).
      Pajzshasználat fok 0: nincs mérséklés → teljes büntetés érvényesül.
      Pajzshasználat fok 3: VÉ+2 extra + teljes büntetés mérsékelve (TÉ: 0 minden pajzshoz).
```

### 13.1 Pajzs fegyverként (csak pajzs harc)

Ha a karakter kizárólag a pajzzsal harcol (fegyver nélkül):
- Aktív fül: Ügyesebb kéz = pajzs (idx: -2), Fegyverfogás: Egyfegyveres
- Fegyvertáblában a pajzs fegyver harcértékei jelennek meg (`fegyverek.json`, kategória: "pajzs")
- Harcmodor: Közelharc (`konstansok.fegyver_kategória_harcmodor.pajzs: "Közelharc"`)

Bónuszok: a Pajzshasználat fortély `fegyver_kategória:pajzs` feltételes módosítói (§16):
- 1.fok: TÉ:+1, VÉ:+1, SP:+1
- 2.fok: TÉ:+2, VÉ:+2, SP:+2
- 3.fok: TÉ:+3, VÉ:+3, SP:+3

Data layer: `pajzshasznalat.yaml` módosítók (feltétel: `"fegyver_kategória:pajzs"`, mód: flat).
HarcScreen: `aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`)` → fortély módosítók automatikusan aktiválódnak.
Pajzs adatok: `process_fegyverek.py` hozzáfűzi a `pajzsok.json` tartalmát `fegyverek.json`-hoz (kategória: "pajzs").
Harcértékek fül: "pajzs" kategória kiszűrve a fegyver felvétel dropdown-ból.

---

## 14. Manőver Alap / Manőver Pont

```
input:  közelharci harcmodor szintek (konstansok.fegyver_kategória_harcmodor values),
        karakter.tsz

formula:
  harcmodor_összeg = SUM(UNIQUE(konstansok.fegyver_kategória_harcmodor.values) → képzettség szintek)
  manőver_pont = CEIL(harcmodor_összeg x 2 / tsz)

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
          harcérték[mod.cél] += FLOOR(forrás_érték x mod.arány)
        elif mod.mód == "override":
          harcérték[mod.cél] = mod.érték      // felülírja az alapértéket

output: módosított harcértékek
note: feltétel == "" → mindig aktív (karakterlap számolja).
      feltétel == "prefix:érték" → feltételesen aktív (UI toggle / automatikus).
      feltétel == [{forrás, operátor, érték}] → kalkulált feltétel (lásd §24).
      Prefixek (lásd konstansok.yaml → feltétel_prefixek):
        harci_helyzet, taktika, fegyver, fegyver_kategória, fegyverfogás, manőver, státusz, páncél
      Módok: flat, scaled, override, enyhít, előny, hátrány
        - "flat": fix numerikus bónusz a célra
        - "scaled": forrás_érték × arány hozzáadás
        - "override": cél értékének felülírása
        - "enyhít": Hatás pool-ban csökkenti a célra vonatkozó negatív hatás fokát (§22.7)
        - "előny": kocka-reroll bónusz (Előny+érték a cél dobásra). Célok: sebzésdobás, ké_dobás, té_dobás, cé_dobás, képzettségpróba_dobás, tulajdonságpróba_dobás
        - "hátrány": kocka-reroll büntetés (Hátrány+érték). Ugyanazok a célok.
      Opcionális mezők:
        - "alcél": konkrét tulajdonság/képzettség neve (pl. "Edzettség", "Zárnyitás", "Látás")
        - "megjegyzés": emberi olvasásra (kontextuális info)
      Speciális feltétel esetek:
        - "fegyver:" (üres érték) → Mesterfegyver fortély: aktív ha az adott spec_elem fegyver van kiválasztva
        - "fegyver:puszta kéz" → csak puszta kéz harccal aktív
impl: A fokok tömbben a fok értéke NEM feltétlenül egyezik a tömb indexével.
      Sok fortélynál nincs fok:0 (alapeset), csak fok:1-től indul.
      A lookup tehát: fortély_def.fokok.find(f → f.fok == kf.fok), NEM fokok[kf.fok].
      Könyvtár struktúra: `fortelyok/{harci,tavharc,altalanos,erzekek,szabad,kiemelt,misztikus}/*.yaml`
      A `tavharc/` mappából jövők `alcsoport: "tavharc"` mezőt kapnak a JSON-ban (picker csoport: "🏹 Távharc").
      Scaled mód — `forrás` lehetséges értékei:
        - Képzettség név (kisbetű): pl. "akrobatika" → a karakter képzettség szintje
        - Számított érték: pl. "erőbónusz" → min(erő, fegyver.erőbónusz_limit)
        - A forrás-értéket `floor(érték x arány)` adja a bónuszt.
      Követelmények logika (részletes tábla: §25):
        - A követelmények lista elemei ÉS kapcsolatban vannak (mindegyiknek teljesülnie kell).
        - Ha egy elem "név" mezője lista (pl. ["Közelharc", "Kardvívás"]), az VAGY kapcsolat: bármelyik teljesíti.
        - Típusok: képzettség (szint ≥ érték), fortély (fok ≥ érték, többszörösnél bármelyik példány)
        - UI: nem teljesülő követelmény → piros jelzés (FortelyokScreen), case-insensitive
      Többszörös fortélyok (karakter séma v2):
        - kf.név = mindig az alapnév (megegyezik a fortely yaml "név" mezőjével)
        - kf.spec_típus = megegyezik fortély_def.többszörösség.spec_típus-ával ("" ha nem többszörös)
        - kf.spec_elem = a konkrét választott példány (pl. "erv", "kard, lovag")
        - Lookup: kf.név alapján (nem kf.spec_elem!)
```

### 16.1 Alapeset (fok: 0) — IMPLEMENTÁLT

A fortély yaml `fokok[]` tartalmazhat `fok: 0` entry-t (Alapeset). Ez **akkor aktív, ha a karakter NEM rendelkezik az adott fortéllyal** (fok == 0 implicit). Ezzel a fortély hiányának mechanikus hatása is a data layer-ben tárolható.

#### Séma

```yaml
fokok:
  - fok: 0
    feltétel:
      típus: "fegyverfogás"     # session/karakter mező neve
      érték: "fegyver_hárító"   # egyezés vizsgálat
    hatástext: "Hárítófegyver VÉ = 0"
    módosítók:
      - cél: "vé_hárító"
        típus: "override"
        érték: 0
  - fok: 1
    hatástext: "Hárítófegyver VÉ aktív"
    módosítók: [...]
```

#### Feltétel típusok

```
típus                  forrás                          érték (példák)
─────────────────────────────────────────────────────────────────────
fegyverfogás           session.fegyverfogás            "fegyver_hárító", "fegyver_pajzs", "kétkezes"
aktív_fegyver          karakter.fegyverek[session      "Puszta kéz", kategória név
                         .aktív_fegyver_index]
páncél_viselés         session.aktív_páncél            true (+ karakter.páncél.MGT > 0)
harci_helyzet          session.aktív_helyzetek[]       helyzet id (pl. "helyhez_kötve")
mindig                 —                               — (feltétel nélkül aktív)
```

#### Kiértékelés logika

```
FOR EACH fortély_def in data.fortelyok:
  IF karakter NEM rendelkezik a fortéllyal (nincs felvéve VAGY fok == 0):
    fok0 = fortély_def.fokok.find(f → f.fok == 0)
    IF fok0 létezik:
      IF fok0.feltétel:
        aktív = evaluate_feltétel(fok0.feltétel, session, karakter)
      ELSE:
        aktív = true  // "mindig" típus
      IF aktív:
        - módosítók[] alkalmazása (ugyanaz mint §16 fő logika)
        - hatástext megjelenítése a Hatás pool-ban (negatív/figyelmeztetés színnel)
```

#### evaluate_feltétel(feltétel, session, karakter)

```
SWITCH feltétel.típus:
  "fegyverfogás":
    RETURN session.fegyverfogás == feltétel.érték
  "aktív_fegyver":
    RETURN aktív_fegyver.név == feltétel.érték
           OR aktív_fegyver.kategória == feltétel.érték
  "páncél_viselés":
    RETURN session.aktív_páncél AND karakter.páncél.MGT > 0
  "harci_helyzet":
    RETURN session.aktív_helyzetek.includes(feltétel.érték)
  "mindig":
    RETURN true
```

#### GUI megjelenítés

- A 0.fok hatástext a **Hatás pool**-ban jelenik meg accordion (`<details>`) formában, alapból becsukva
- Fejléc: "Alapesetek (N) ▾" — szürke szín (mint "Státusz hatások")
- Elemek: fortély név bold fehér + hatástext fehér
- Csak akkor látható, ha a feltétel teljesül ÉS a karakter nem rendelkezik a fortéllyal

#### Implementáció

- Modul: `web/src/engine/alapeset.ts`
  - `evaluateAlapesetek(fortelyDefs, karakter, session)` → `AktívAlapeset[]`
  - `evaluateFeltétel(feltétel, session, karakter)` → boolean (prefix:érték kiértékelés)
- Hívás helye: `AktivScreen.tsx` — Hatás pool szekció (fortélyEmlékeztetők után)
- HarcScreen: `hasHárítóFortély` check — ha nincs "Hárítófegyver használat" fortély → hárítóVÉ = 0
- Validáció: `generate_tables.py` — feltétel prefix ellenőrzés `konstansok.yaml → feltétel_prefixek` alapján

#### Érintett fortélyok (kezdeti batch)

```
Fortély                         feltétel.típus      feltétel.érték
──────────────────────────────────────────────────────────────────
Hárítófegyver használat         fegyverfogás        "fegyver_hárító"
Pajzshasználat                  fegyverfogás        "fegyver_pajzs"
Merevvértviselet                páncél_viselés      true
Kétkezesség                     mindig              —
Természetes fegyver             aktív_fegyver       "Puszta kéz"
Vakharc                         harci_helyzet       "sötétben_teljes_csendben"
Harc helyhez kötve              harci_helyzet       "helyhez_kötve"
Testőr                          harci_helyzet       "vé_kiterjesztés"
Úszás                           mindig              —
Infralátás                      harci_helyzet       "sötétben_félhomály"
```

---

## 17. Távharc kalkulátor (CÉ + VÉ)

### 17.1 Célzó Érték (CÉ) számítása

```
input:  karakter.tulajdonságok.Önuralom, karakter.CM,
        harcmodor_szint (távfegyver.Harcmodor alnév → karakter képzettség szint),
        harcmodor_CÉ_bónusz, távfegyver.CÉ, mesterfegyver_fok
source: konstansok.yaml → mesterfegyver_bónuszok
        tables/harcmodor_kepzettsegek_bonuszok.json
        tables/tavfegyverek.json (Harcmodor mező: "Hajítás"/"Íjászat"/"Lövészet"/...)

formula:
  CÉ_alap = konstansok.harcérték_alap.CÉ   // -15

  CÉ = CÉ_alap
     + Önuralom
     + CM
     + harcmodor_CÉ_bónusz(harcmodor_szint)
     + távfegyver.CÉ
     + mesterfegyver_CÉ_bónusz(fok)   // +1/fok
     + Idea                            // fegyver minőség: [-5;+5]

output: CÉ (karakter összesített Célzó Értéke az adott fegyverrel)
```

### 17.2 CÉ módosítók (taktikák)

```
Célzás:         +3 CÉ (1 kör célzás után, nem additív)
Kitartott célzás: +7 CÉ (fortéllyal, 1 kör, nem additív, csak íj max 1 kör!)
Hirtelen lövés: -7 CÉ (alapesetben)
Hirtelen lövés + "Lövés reflexből" fortély: +0 CÉ (nincs büntetés)

note: Célzó dobás esetén NINCS -4 levonás az egy körön belül végzett
      újabb támadásokra (mint sima fegyveres harcnál). Minden dobás
      ugyanazzal az eredeti CÉ-vel történik.
```

### 17.3 Célpont Védő Érték (távolsági VÉ)

```
input:  távolság (m), távfegyver.Osztó,
        célpont_mozgás, lövész_mozgás, célpont_méret,
        észlelhetőség, szél
source: tables/tavharc_szorzok.json

formula:
  // 1. Cella kiszámítása (felfelé kerekítés)
  cella = CEIL(távolság / távfegyver.Osztó)

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

### 17.4 Távharc harckeret

```
harckeret = harcmodor_szint(távfegyver.Harcmodor) + Gyorsaság
támadások_száma = 1 + FLOOR(harckeret / fegyver_sebesség)

Sebesség = -1 (nyílpuskák): támadások_száma = "1/2 kör" (alapeset)
  "Gyors újratöltés" fortély ≥1.fok: támadások_száma = 1 (minden kör)
Sebesség = tartomány (pl. "6-9"): alsó határt használjuk
```

### 17.5 Hatótáv

```
max_hatótáv = távfegyver.hatótáv
// "Nem hajításra alkalmas" tárgyak: hatótáv = Erő × Osztó (m)
// Hatótávon túl: lövés/hajítás lehetetlen
```

### 17.6 Sebzés

```
Íjak: SP + Erőbónusz (ha fegyver megfelelő Erőre tervezett)
Nyílpuskák: SP (fix, nincs Erőbónusz)
Hajítófegyverek: SP (nincs Erőbónusz, kivéve speciális)
Többszörös találat sebzésbónusz: NINCS távharcban
```

### 17.7 Távharc fül — webapp

```
Karakter séma:
  karakter.távfegyverek: { alap: string }[]   // távfegyver nevei (lookup kulcs → tavfegyverek.json)
  session.aktív_távfegyver_index: number      // kiválasztott távfegyver indexe (-1 = nincs)

CÉ formula:
  CÉ = konstansok.harcérték_alap.CÉ + Önuralom + CM + harcmodor_CÉ_bónusz + fegyver.CÉ + MF.CÉ + Idea + fortélyCÉ

  fortélyCÉ: feltételes fortély CÉ bónusz (pl. "Célzás" harci helyzet aktív → "Kitartott célzás" 0.fok: +3, 1.fok: +7)
    Iteráció: összes fortély definíción, effektív fok = max(0, karakter felvett fok).
    Csak "CÉ" célú módosítók, ahol feltétel ∈ aktívFeltételek (session.aktív_helyzetek → feltétel_kulcs).

Virtuális fegyverek (nem a távfegyverek[] tömben, fortélyból származtatottak):
  - "Alkalmatlan fegyver hajítása" fortély (spec_típus: "fegyver") → per spec_elem, "🔆 Nem dobásra" def
  - "Alkalmatlan tárgyak hajítása" fortély → "Alkalmi tárgy", "🔆 Nem dobásra" def (2.foknál Osztó=2)

CM szerkesztő: a Távharc fülön (szerkesztő módban), max = tsz × arányok.max_cm_perszint

Adatforrások:
  - tables/tavfegyverek.json (Fegyver, CÉ, Osztó, SP, Sebesség, Hatótáv, Kategória, Erőbónusz, Harcmodor)
  - tables/tavharc_szorzok.json (5 kategória: célpont_mozgás, lövész_mozgás, célpont_méret, észlelhetőség, szél)
  - tables/harcmodor_kepzettsegek_bonuszok.json (CÉ oszlop)
  - konstansok.yaml → mesterfegyver_bónuszok (CÉ mező)
```

---

## 18. HM / CM limitek

```
input:  karakter.HM_TÉ, karakter.HM_VÉ, karakter.CM, karakter.tsz,
        harci_fortély_fokok, harcmodor_szintek
source: konstansok.yaml → arányok

formula:
  max_HM = SUM(harci_fortély_fokok, Mesterfegyver nélkül) + SUM(5_közelharci_harcmodor_szint + alakzatharc_szint)
  max_CM = tsz x arányok.max_cm_perszint

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
      HM szerkesztés: Harcértékek fülön (enforce: HM_TÉ+HM_VÉ ≤ max_HM).
      CM szerkesztés: Távharc fülön (enforce: CM ≤ max_CM).
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
  nyelv_pont_keret = MAX(0, (nyelvtanulás_szint - 3) x 3)
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


---

## 21. Aktív fül — Taktikák, Manőverek, Helyzetek

Az Aktív fülön választható elemek és módosítóik összefoglalása.
UI szekció sorrend: Fegyver+Fogás → Fortély bónuszok/Alapesetek → Taktikák → Harci helyzetek → Manőver → Státuszok → Narratív Előny/Hátrányok.
A feltételes fortély módosítók (§16) ezekhez kötődnek: `feltétel: "taktika:roham"` stb.

### Implementációs illeszkedés

Adatforrások (YAML → JSON generálás: `generate_tables.py` → `generate_aktiv_ful()`):
- `data/sources/taktikak.yaml` → `tables/taktikak.json` (14 taktika: módosítók, fokok, kombó szabályok)
- `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (32 helyzet: id, infó, hatások, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek)
- `data/sources/szituaciok.yaml` TÖRÖLVE — 7 elem beolvadt `harci_helyzetek.yaml`-ba (pozitív/semleges csoportba)
- `data/sources/manoverek.yaml` → `tables/manoverek.json` (34 manőver: id, nehézség, fázisok, hatás)

ID és feltétel_kulcs konvenció:
- YAML-ban: csak `id` mező (snake_case, ékezetes, source of truth)
- JSON-ban: `id` + `feltétel_kulcs` (generált: `"{prefix}:{id}"`)
- Prefixek: taktika → `"taktika:{id}"`, harci_helyzet → `"harci_helyzet:{id}"`. `szituáció:` prefix backward-compat.
- Manőverek: `id` mező (referencia fortély módosítók `manőver:{id}` céljához)
- Validáció: id egyediség + fortély `manőver:X` → manőver id referenciális ellenőrzés (build-time)

Taktika kombó logika (`kombó_mód` + `kombó_lista`):
- `"whitelist"` + lista: CSAK ezekkel kombinálható (üres = semmivel)
- `"blacklist"` + lista: mindennel KIVÉVE ezeket

Fokozatos taktikák: `fokozatos: true` → `fokok[]` tömb (pl. Támadó fok:1..3, mindegyik más TÉ/VÉ)

Session state bővítés (types.ts Session interface):
- `aktív_taktikák: { név: string, fok?: number }[]` (több kombó, fokozatos taktikáknál fok)
- `aktív_helyzetek: string[]` (több helyzet egyszerre)
- `aktív_szituációk` mező TÖRÖLVE — helyzetek az `aktív_helyzetek[]`-ben
- `aktív_manőver: string` (max 1, marad)

Kalkuláció két rétege:
1. **Taktika módosítók** — direkt numerikus: TÉ/VÉ/KÉ/SP módosítók a Harc fülön számolva
   (hasonlóan a fortélyMod_* context mezőkhöz, pl. `taktikaMod_TÉ`, `taktikaMod_VÉ`)
   VÉ eltolás ökölszabály: `taktikaMods['VÉ']` clamp `[-limit, +limit]` ahol limit = `konstansok.taktika_vé_eltolás_limit` (10)
2. **§16 feltételes fortély módosítók** — a HarcScreen fortély loop-jában a `mod.feltétel` check:
   `feltétel.split(':')` → prefix (taktika/harci_helyzet/fegyverfogás/fegyver) → aktívFeltételek Set keresés

Harci helyzetek: NEM kalkuláltak (komplex hatások) — Hatás pool-ban az `infó` mező jelenik meg + §16 feltétel dispatch.
  Ha van fortély aminek feltétele `harci_helyzet:{id}` → alatta indentálva megjelenik: `→ Fortély (fok): hatástext ✔`
  Ha a fortély aktív (feltétel teljesül): zöld szín + ✔. Ha nem: szürke.
  Alapeset (0.fok) hatástext hozzáfűződik az infó szöveghez: `"infó; Alapeset: hatástext"`
Manőverek: NEM adnak statikus módosítókat — informatív (nehézség, fázisok, hatás megjelenítés).
UI: Manőver szekció `aktiv-label` fejléccel (mint Taktikák/Helyzetek).
Taktikák Hatás pool: módosítók zölddel + ✔ jel a végén (beszámított jelzés).

### 21.1 Harci Taktikák

Egy körben aktív harci taktika(ák). Feltétel kulcs: `taktika:név`.

| Taktika | Módosítók | Kombó ✅ | Kombó ❌ |
|---------|-----------|---------|---------|
| 1 támadás | TÉ:+3 (több-tám levonás nem érvényesül) | minden más | Roham, Ö.roham, Plusz tám, Teljes Véd, Fárasztás |
| Érintő | TÉ:+3, sebzés:0 | Támadó, Védő, Kezdeményező, Kiváró, 1 tám, Plusz tám | más |
| Fárasztás | VÉ csökk: 2/kör (+fortély+pengeelőny) | — | más |
| Kezdeményező | KÉ:+1..+5, VÉ:-1..-5 | Támadó, Érintő, Visszafogott, 1 tám | más |
| Kiváró | KÉ:átengedett, TÉ:+2 (visszacsapás) | Támadó, Érintő, Visszafogott, Tám.erőből, 1 tám | más |
| Öngyilkos roham | TÉ:+5, VÉ:-10, SP:+7, VÉcsökk 2x | — | más (max 1x/küzdelem) |
| Plusz támadás | +1 támadás, VÉ:-3 azonnal | Támadó, Érintő, Tám.erőből | más |
| Roham | TÉ:+4, VÉ:-8, SP:+5, VÉcsökk 2x | — | más |
| Támadás erőből | TÉ:-1..-2, SP:+1..+2 (fortéllyal: max -6/+6) | Kiváró, Plusz tám, 1 tám | más |
| Támadó | TÉ:+1..+3, VÉ:-2..-6 | Kezdeményező, Kiváró, Érintő, Plusz tám, 1 tám | más |
| Védő | VÉ:+1..+4, TÉ:-2..-8 | Érintő, 1 tám | más |
| Teljes Védekezés | VÉ:+6, nem támad, hátrál | — | más |
| Visszafogott | TÉ:-3/-6/-9, Hátrány-1/-2/— sebzésdobás | Kezdeményező, Kiváró, 1 tám | más |
| Tettetés | — (informatív) | — | más |

note: "Választható" értékek (pl. Támadó TÉ:+1..+3) → a játékos az Aktív fülön megadja a fokozatot.
      Roham/Ö.roham: csak az első oda-vissza csapásra érvényes.
      Fárasztás: nem támadás, nem kombinálható mással.

### 21.1b Taktika fortély_bővítés

Fokozatos taktikáknál a `fortély_bővítés` yaml mező lehetővé teszi, hogy egy fortély extra fokokat
engedélyezzen a taktika picker-ben.

Schema: `fortély_bővítés: { fortély: string, extra_fokok_per_fok: number } | null`

Kalkuláció:
```
alap_max_fok = def.fokok.length (yaml-ban definiált fokok)
fortély_fok = karakter.fortélyok[fortély_bővítés.fortély].fok ?? 0
max_fok = alap_max_fok + fortély_fok * extra_fokok_per_fok
```

Extra fokok módosítói: lineáris extrapoláció az utolsó definiált fok mintájából.
Pl. Támadás erőből: alap 2 fok (SP:+1/TÉ:-1, SP:+2/TÉ:-2), `extra_fokok_per_fok: 2`
- Fortély 1.fok → max 4 fok (SP:+4, TÉ:-4)
- Fortély 2.fok → max 6 fok (SP:+6, TÉ:-6)

Implementáció:
- AktivScreen fok picker: dinamikusan generálja az extra fokokat, lila ● jelölés
- HarcScreen taktikaMods: extrapoláció ha `fokDef` nem található a def.fokok-ban
- AktivScreen chip: extrapolált módosítók megjelenítése
- App.tsx useEffect: taktika invalidáció ha fortély törlés után az aktív fok > megengedett max

### 21.2 Harci Helyzetek

Harci helyzetek speciális Státuszok, amelyek Hatásokat okoznak (080_hatasok_es_statuszok.md).
Feltétel kulcs: `harci_helyzet:id`. Az Aktív fülön kiválaszthatók (picker overlay, csoportosítva).

Data layer: `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json`
Schema mezők: név, id, infó, hatások[], csoport, rejtett, tiltja_taktikákat, kizár_helyzetek[]

Picker csoportok (csoport mező): "pozitív" (zöld), "semleges" (narancs), "negatív" (piros)
Rejtett elemek (rejtett: true): nem jelennek meg a picker-ben (automatikus/levezetett).

#### Pozitív helyzetek (065_01_01)

| Helyzet | id | Hatások |
|---------|-----|---------|
| Meglepetés | meglepetés | Előny+1 TÉ, VÉ csökkentés: +2. Készületlenség = Meglepetés. |
| Orvtámadás | orvtámadás | Előny+2 TÉ dobásra. Áldozat VÉ: Közelharc Puszta kézzel. Tiltja: taktikák, Hátulról, Meglepetés. |
| Hátulról támadás | hátulról | Előny+1 TÉ dobásra. Pajzs VÉ NEM számít. |
| Magasabbról | magasabbról | Előny+1 TÉ dobásra. Lovas harcban NEM jár. |
| Levegőből támadás | levegőből | Előny+2 TÉ dobásra. Roham pluszban. Fárasztó taktika OK. |
| Beszorított ellenfél | ellenfél_beszorított | Előny+1 TÉ dobásra. |
| Láthatatlanul harcolás - hallhatóan | láthatatlanul_hallhatóan | Előny+1 TÉ, VÉ csökk:+1, VÉ:+5. Fárasztó tiltott. |
| Láthatatlanul harcolás - csendesen | láthatatlanul_csendesen | Előny+2 TÉ, VÉ csökk:+2, VÉ:+10. Fárasztó tiltott. |

#### Semleges helyzetek (065_01_02)

| Helyzet | id | Hatások |
|---------|-----|---------|
| Belharci helyzet | belharci_helyzet | Közelharc harcmodor + max 0 pengehossz feltétel. Belharcos fortély bónuszok. |
| Fegyverrántás váratlanul | fegyverrántás | KÉ módosítók fegyverméret szerint. Fortély: Fegyverrántás skála. |
| Közrefogás | közrefogás | Semlegesíti ellenfél Pengeelőnyét → Alappenge. |
| Takarásban harcolás | takarásban | Hátrány-1 TÉ, VÉ: +5. |
| Védő Érték kiterjesztése másra | vé_kiterjesztés | Többsz. tám. elvesztés, VÉ veszteség duplázódik. Testőr fortély mérsékli. |
| Vadállatok elleni harc | vadállatok | Informatív: Közelharc + Belharcos 2.fok bónuszai relevánsak. |

#### Negatív helyzetek (065_01_03)

| Helyzet | id | Hatások |
|---------|-----|---------|
| Csúszós talaj | csúszós_talaj | Hátrány-1 TÉ dobásra. |
| Elvesztett egyensúly | elvesztett_egyensúly | Hátrány-1 TÉ, többsz. tám. elvesztés, mozgás feleződik. Akrobatika(12) megoldja. |
| Földön fekve | földön_fekve | Hátrány-2 TÉ dobásra, VÉ veszteség duplázódik. |
| Hajítás alkalmatlan fegyverrel | hajítás_alkalmatlan_fegyverrel | Hátrány-2 Sebzésdobás, Hátrány-2 CÉ, Fegyver CÉ=0, SP: fegyver-5. Fortély mérsékli. |
| Hajítás nem dobásra készített | hajítás_nem_dobásra_készített | Hátrány-1 Sebzésdobás, Hátrány-1 CÉ, Fegyver CÉ=0, SP:(-5+k20). Fortély mérsékli. |
| Helyhez kötve | helyhez_kötve | Hátrány-1 TÉ dobásra, VÉ veszteség duplázódik. |
| Lények méret különbsége | méret_különbség | Nagyobb lény: +1 VÉ csökkentés bónusz / kategória különbség. Skála: 1-7. |
| Rosszabbik kézben tartott fegyver | rosszabbik_kéz | Hátrány-1 TÉ dobásra. Kétkezesség fortély kioltja. |
| Sötétben - félhomály | sötétben_1 | Hátrány-1 TÉ. Vakharc/Infra/Ultra mérsékli. |
| Sötétben - teljes, zajokkal | sötétben_2 | Hátrány-1 TÉ. Érzék(látás) kioltott. Vakharc/Infra/Ultra mérsékli. |
| Sötétben - teljes, csendben | sötétben_3 | Hátrány-2 TÉ. Érzék(látás) kioltott. Vakharc/Infra/Ultra mérsékli. |
| Tűz ruhán - ég | tűz_ruhán_1 | Hátrány-1 TÉ, (-5+k20)SP/kör. Eloltás: 1 kör. |
| Tűz ruhán - lángol | tűz_ruhán_2 | Hátrány-2 TÉ, (0+k20)SP/kör. Harcban elolthatatlan. |
| Vér elvakít | vér_elvakít | Hátrány-1 TÉ, Hátrány-1 Érzék(Látás). 1 Akció: kitörlés. |

#### Rejtett (automatikus, nem picker-ben)

| Helyzet | id | Megjegyzés |
|---------|-----|------------|
| Pengeelőny | pengeelőny | Fegyverméretből levezetett. VÉ csökk: 2+k20T. |
| Pengehátrány | pengehátrány | Fegyverméretből levezetett. VÉ csökk: k20T. |
| Pusztakezes harc | pusztakezes_harc | Automatikus: fegyver=puszta kéz. KÉ/TÉ/VÉ: -3. |
| Képzetlen fegyverhasználat | képzetlen_fegyverhasználat | Automatikus: harcmodor<3. |

#### Kombinálási/tiltási szabályok

Data layer mezők:
  tiltja_taktikákat: bool — ha true, ÖSSZES taktika disabled amíg ez a helyzet aktív.
    Implementált: Orvtámadás (true). Hozzáadáskor aktív taktikák automatikusan törlődnek.
  kizár_helyzetek: string[] — id-kat tartalmaz. Ezen helyzetek nem adhatók hozzá / eltávolítódnak hozzáadáskor.
    Implementált: Orvtámadás → ["hátulról", "meglepetés"]
    Többfokú helyzetek: kölcsönösen kizárják egymást (sötétben_1/2/3, tűz_ruhán_1/2, láthatatlanul_*/*, hajítás_*)
  Taktika megkötések (taktikak.yaml → megkötések[]):
    Fárasztás: harci_helyzet/tiltott/Pengehátrány,
              harci_helyzet/tiltott/Láthatatlanul harcolás - hallhatóan,
              harci_helyzet/tiltott/Láthatatlanul harcolás - csendesen

### 21.3 Körülmények (korábban: Szituációk)

Ezek az elemek a harci helyzetek pozitív/semleges csoportjába tartoznak (a "körülmény" alcsoport megszűnt).
A picker 3 csoporttal jeleníti meg: Pozitív (`#4caf50`) / Semleges (`#ff9800`) / Negatív (`#f44336`).

| Helyzet                | feltétel kulcs                         | Csoport    |
| ---------------------- | -------------------------------------- | ---------- |
| Lovas harc             | `harci_helyzet:lovas_harc`             | pozitív    |
| Léglovas harc          | `harci_helyzet:léglovas_harc`          | pozitív    |
| Harci szekér           | `harci_helyzet:harci_szekér`           | pozitív    |
| Páros harc             | `harci_helyzet:páros_harc`             | pozitív    |
| Közönség előtt         | `harci_helyzet:közönség_előtt`         | pozitív    |
| Célzás                 | `harci_helyzet:célzás`                 | pozitív    |
| Szörnyeteg elleni harc | `harci_helyzet:szörnyeteg_elleni_harc` | semleges   |

note: `szituaciok.yaml` törölve, minden elem a `harci_helyzetek.yaml`-ban él.
      `session.aktív_szituációk` mező törölve — helyzetek az `aktív_helyzetek[]`-ben.
      Fortély feltételek: `harci_helyzet:X` prefix (backward-compat: `szituáció:X` is működik az `alapeset.ts`-ben).

---

### 21.3b Szituáció → Harci helyzet beolvasztás — IMPLEMENTÁLT

A szituációk külön rendszere megszűnik. Minden szituáció harci helyzetté válik.
A "körülmény" alcsoport is megszűnt (2026-06-21): elemei beolvadtak pozitív/semleges csoportba.

#### Motiváció

- Egy egységes picker + egy `session.aktív_helyzetek[]` tömb (nincs külön szituáció state)
- A Hatás pool "Harci helyzetek" szekciójában automatikusan megjelennek (infó mezővel)
- A fortély bónuszok a szokásos feltétel-rendszeren keresztül aktiválódnak — láthatóan

#### Érintett elemek végleges csoportja

| Helyzet                | id                       | Csoport    |
| ---------------------- | ----------------------   | ---------- |
| Lovas harc             | `lovas_harc`             | pozitív    |
| Léglovas harc          | `léglovas_harc`          | pozitív    |
| Harci szekér           | `harci_szekér`           | pozitív    |
| Páros harc             | `páros_harc`             | pozitív    |
| Közönség előtt         | `közönség_előtt`         | pozitív    |
| Célzás                 | `célzás`                 | pozitív    |
| Szörnyeteg elleni harc | `szörnyeteg_elleni_harc` | semleges   |

#### Lépések

**1. Data layer (harci_helyzetek.yaml):**
- 7 entry (pozitív/semleges csoportban)
- Mezők: `név, id, infó, hatások: [], csoport, rejtett: false, tiltja_taktikákat: false, kizár_helyzetek: []`
- `infó`: rövid szöveg ami a Hatás pool-ban megjelenik (pl. "Lovas harc fortély bónuszok aktívak")
- `szituaciok.yaml` fájl törlése

**2. Fortély feltételek migrálás:**
- Minden fortély yaml-ban `feltétel: "szituáció:X"` → `feltétel: "harci_helyzet:X"`
- `konstansok.yaml → feltétel_prefixek`: `szituáció` marad (backward-compat)

**3. Session state + engine (types.ts, alapeset.ts):**
- `aktív_szituációk: string[]` törlése a `Session` interface-ből + `DEFAULT_SESSION`-ből
- Minden `session.aktív_szituációk` hivatkozás → `session.aktív_helyzetek`
- `alapeset.ts → evaluateFeltétel`: `szituáció:` case = `session.aktív_helyzetek.includes(érték)` (backward-compat, azonos logika mint `harci_helyzet:`)

**4. generate_tables.py + data-loader.ts:**
- `generate_szituaciok()` törlése, `szituaciok.json` nem generálódik
- `validate_aktiv_ful()`: szituáció validáció beolvad harci_helyzet validációba
- `feltétel_kulcs` generálás: szituáció entries → `harci_helyzet:{id}`
- `data-loader.ts`: `szituaciok` mező törlése `GameData`-ból, fetch eltávolítása

**5. AktivScreen.tsx:**
- Szituáció picker szekció + chip szekció törlése
- Helyzet picker: 3 csoport (Pozitív `#4caf50` / Semleges `#ff9800` / Negatív `#f44336`)
- ABC rendezés csoporton belül
- Hatás pool "Harci helyzetek" szekció: szituáció-helyzetek `infó`-ja is megjelenik (azonos logika, szín: `#42a5f5`)

**6. Szabályrendszer (md/):**
- `md/150_szituaciok.md` tartalom beolvasztása harci helyzetek fejezetbe
- `szabalyrendszer.md` ToC frissítés
- Link audit: `grep -rn "150_szituaciok\|szituáció" md/` → javítás
- Linkspector futtatás

**7. Spec fájlok frissítés:**
- engine_spec §21 cím → "Taktikák, Manőverek, Helyzetek", §21.3 beolvasztás §21.2-be
- gui_spec: szituáció szekció → helyzet picker 3 csoport (pozitív/semleges/negatív)
- DEVSTATE: migrálás bejegyzés

### 21.4 Manőverek

Egy körben max 1 aktív manőver. MP költséggel hajtható végre. Nehézség [2;12].
Fázisok: M=Megakasztás, V=Végrehajtás, E=Ellenpróba.

#### Általános manőverek

| Manőver                     | Nehézség                        | Fázisok      | Követelmények                                     | Hatás                                      |
| --------------------------- | ------------------------------- | ------------ | ------------------------------------------------- | ------------------------------------------ |
| Átsiklás                    | 6 (±2)                          | E (M*)       | —                                                 | Átsiklás harcolók között                   |
| Áttörés                     | 5 (±erő)                        | M,V,E        | —                                                 | Átlökés egy ellenfélen                     |
| Csonkolás                   | 8(kéz)/10(láb)                  | V,E          | Precíz támadás                                    | Végtaglevágás (ÉP/3↑ ill. ÉP/2↑ sebzés)    |
| Ellenfél elfogása           | 10                              | V,E          | —                                                 | Kiszolgáltatott pozícióba kényszerítés     |
| Felállás földről            | 6 (-akro/3)                     | M,E          | —                                                 | Felkelés földről                           |
| Forgószél támadás           | 7+ellenfél                      | V,E          | —                                                 | Köríves támadás több ellenfélre            |
| Kibontakozás                | 5 (±2/penge, +2/extra ellenfél) | E (M*)       | —                                                 | Kilépés a harcból                          |
| Kiegészítő támadás          | 7                               | V,E          | Közelharc 4, MF 1                                 | Alattomos ütés (k20+0 SP)                  |
| Lábkirántás szálfegyverrel  | 6                               | V,E          | Lándzsavívás 6, szálfegyver                       | Ellenfél földre kerül                      |
| Lábsöprés / Felöklelés      | 8 (±erő)                        | V,E          | Harcmodor 5                                       | Ellenfél földre kerül                      |
| Lánccsapda                  | 9                               | V,E          | MF 1, láncos fegyver                              | Ellenfél fegyverének foglyul ejtése        |
| Lánccsapdából szabadítás    | 7                               | E            | —                                                 | Fegyver kiszabadítás                       |
| Lefegyverzés / Fegyvertörés | 10 (±2)                         | V,E          | Harcmodor 5                                       | Fegyver kiesik/eltörik                     |
| Leütés hátulról             | 6 (-2/Harci anat. fok)          | V,E          | Orvtámadás+Hátulról, zúzó/puszta kéz              | Ájulás (ÉP/4↓ sebzésnél)                   |
| Lovas akasztása             | —                               | —            | Lásd lovas manőverek                              | —                                          |
| Mesterjel                   | 10-12                           | V,E          | MF 2, hegyes szúrófegyver                         | Jel belekarcolása (1 ÉP)                   |
| Mögékerülés                 | 8/6/4 (túlerő)                  | E            | —                                                 | Hátulról támadás pozíció                   |
| Pajzzsal felöklelés         | 7 (±erő)                        | V,E          | Harcmodor 5, Pajzshasználat 2, közepes/nagy pajzs | Ellenfél földre kerül                      |
| Pajzsrongálás               | 6                               | V,E          | Harcmodor 6, Erő+1, zúzó/kétkezes                 | Pajzs VÉ csökkentés (SP/2 zúzó, SP/4 vágó) |
| Precíz támadás              | 1-12 (terület)                  | V,E          | Harcmodor 6                                       | Adott területre támadás                    |
| Rávetődés hátulról          | 6                               | E (vagy V,E) | Orvtámadás+Hátulról                               | Rácsimpaszkodás → belharc                  |
| Távoltartás                 | 5                               | M*,E         | Pengeelőny, Harcmodor 5                           | Ellenfél támadás elvesztése                |
| Terelés                     | 8                               | E            | Harcmodor 6                                       | Ellenfél terelése                          |

#### Belharcos manőverek

| Manőver                 | Nehézség        | Fázisok | Követelmények                | Hatás                      |
| ----------------------- | --------------- | ------- | ---------------------------- | -------------------------- |
| Belharcba kerülés       | 9 (háttal:5)    | M,E     | Közelharc, belharcos fegyver | Belharci helyzet           |
| Belharcból kibontakozás | 5               | M,E     | —                            | Kilépés belharcból         |
| Átdobás                 | 7               | V,E     | —                            | Ellenfél földre kerül      |
| Feszítés, Leszorítás    | 8               | V,E     | —                            | TÉ/VÉ:-7, KÉ elvesztés     |
| Feszítésből kijövetel   | 8               | V,E     | —                            | Kilépés feszítésből        |
| Gáncsolás               | 7               | V,E     | Közelharc 5                  | Ellenfél földre kerül      |
| Kéztörés                | 9               | V,E     | —                            | 7 ÉP sebzés                |
| Lábtörés                | 10              | V,E     | —                            | 9 ÉP sebzés                |
| Lefejelés               | 7               | V,E     | —                            | 5 ÉP sebzés                |
| Leforgatás/Irányítás    | 10 (feszítve:6) | V,E     | —                            | Ellenfél terelése (max 5m) |
| Nyaktörés               | 12              | V,E     | Megelőző Feszítés            | Azonnali halál             |

note: A manőverek nem adnak statikus harcérték módosítókat — ellenpróba alapúak (Manőver Alap + MP + k10 vs Nehézség + ellenfél Manőver Alap).
      Kivétel: fortélyok amik manőver Ellenpróba bónuszt adnak (cél: `manőver:név`, mód: flat):
        - Harci akrobatika → `manőver:kibontakozás` +1/+3
        - Harci anatómia → `manőver:leütés_hátulról` +2/+4/+6, `manőver:precíz_támadás` +2/+4/+6
      UI: AktivScreen Hatás pool "Manőver bónuszok" szekció gyűjti ezeket.
      Visszafogott taktika TÉ csökkentés (Harci anatómia): `cél: TÉ, feltétel: "taktika:visszafogott"`, +3/+6/+9.
      Belharcos manőverek: Belharci helyzet szükséges (kivéve Belharcba kerülés).

#### Belharc rendszer összefoglaló

A Belharci helyzet egy semleges harci helyzet amelyet az Aktív fül picker-ből lehet aktiválni.
Aktiváláskor:
  - A Belharcos fortély feltételes módosítói (`feltétel: "harci_helyzet:belharci_helyzet"`) érvényesülnek:
    1.fok: KÉ+1, TÉ+2, VÉ+2; 2.fok: KÉ+2, TÉ+4, VÉ+4
  - Ha a karakter NEM rendelkezik Belharcos fortéllyal: a fenti bónuszok nem járnak,
    de a helyzet aktiválható (pl. "belekényszerítik")

  Belharcos (aki aktiválja):
    - Közelharc harcmodor kötelező (a fortély bónuszaihoz)
    - Max 0 pengehosszú fegyver (tőr, puszta kéz)
    - Puszta kéz harcértékei: TÉ=0, VÉ=0, SP=0, sebzés FP (1ÉP/5FP)

  Nem belharcos (aki belekényszerül):
    - Saját harcmodor értékei maradnak (harcmodor bónusz jár)
    - Nem belharcos fegyverek (pl. kard): fegyver TÉ=0, VÉ=0 (testközelben nem forgatható)
    - Fegyver bármikor elejthető

  - Belharcos manőverek (Belharcba kerülés kivételével) mind előfeltételnek követelik a helyzetet

---

## §22 Státuszok és Hatások

Forrás: md/080_hatasok_es_statuszok.md, md/081_hatasok.md, md/082_statuszok.md

### 22.1 Modell (4 réteg)

| Réteg | Fájl / Forrás | Leírás |
|-------|------|--------|
| **Hatás mechanika** | `hatas_operatorok.yaml` | Hatás típusok/operátorok (8 db): előny, hátrány, arányos, letilt, stb. |
| **Célpontok** | `esemenyek.yaml` | Amire a hatás mechanika vonatkozhat (23 db): dobások, képességek, fizikai |
| **Hatások** | `081_hatasok.md` (TODO: yaml) | Elnevezett, magas szintű játékfogalmak: "Vérzés - erős", "Mozgás - képtelen", "VÉ veszteség duplázódik" stb. Minden Hatás = 1+ mechanika+cél kombináció. |
| **Státuszok** | `statuszok.yaml` | Állapotok fokozatokkal, amelyek Hatás(oka)t okoznak. |
| **Harci helyzetek** | `harci_helyzetek.yaml` | Speciális harci státuszok, amelyek szintén Hatás(oka)t okoznak. |

A lánc: **Státusz/Harci helyzet** → okoz **Hatás(oka)t** → minden Hatás leírható **mechanika+cél** párral.

#### Terminológia tisztázás

| Fogalom | Régi elnevezés (data) | Helyes jelentés |
|---------|----------------------|-----------------|
| Hatás mechanika típusok | "hatás operátorok" (hatas_operatorok.yaml) | Alacsonyszintű operátorok: hogyan hat (kocka reroll, szorzó, letilt, max korlát) |
| Célpontok | "események" (esemenyek.yaml) | Mire vonatkozik a mechanika (TÉ dobás, Mozgás, Varázslás képesség) |
| **Hatások** | — (eddig nem volt yaml) | Magas szintű, elnevezett hatáscsomagok a szabályrendszerből (081_hatasok.md). Pl. "Harcképtelenség" = letilt(harci_képesség) + speciális VÉ. |
| Státuszok | statuszok.yaml | Állapotok, amelyek Hatásokat okoznak (082_statuszok.md) |
| Harci helyzetek | harci_helyzetek.yaml | Harci státuszok, amelyek Hatásokat okoznak (065_01_*.md) |

#### Enyhítés szcenárió (fortély → hatás csökkentés)

```
Státusz: "Blokkolt (2)" → Hatás: "Hátrány-2 TÉ dobásra" + "Mozgás feleződik"
Fortély: "Harcos Elme 2.fok" → enyhít: Hátrány TÉ dobásra (-1 fokkal)
Eredmény: effektív Hátrány-1 TÉ dobásra (a fortély részben semlegesítette)
```

Ez a §16 feltételes fortély módosítók `enyhít` operátorával (már létező mechanika) valósul meg.
A fortély yaml `módosítók` listájában `mód: "enyhít"` + `cél` + `érték` határozza meg,
melyik hatás mechanikát/célt csökkenti.

### 22.2 Hatás mechanika típusok (hatas_operatorok.yaml)

(Fájlnév megtartva kompatibilitás miatt, de a fogalom: "hatás mechanika típusok")

```yaml
hatás_mechanika:  # (yaml-ban: hatás_operátorok — legacy elnevezés)
  - id: "előny"         # mód: előny_hátrány — kocka reroll (2x/3x dob, jobb számít)
  - id: "hátrány"       # mód: előny_hátrány — kocka reroll (2x/3x dob, rosszabb számít)
  - id: "arányos"       # mód: szorzó — pl. 0.5 = feleződik
  - id: "duplázás"      # mód: szorzó — pl. 2 = duplázódik
  - id: "letilt"        # mód: letilt — boolean (képesség elvesztés, aut. kudarc)
  - id: "max_limit"     # mód: max_limit — felső korlát (pl. max 1 támadás)
  - id: "szöveges"      # mód: szöveges — nem kumulálható, csak informatív
  - id: "enyhít"        # mód: enyhít — csökkenti másik hatás fokát (fortélyokból)
```

### 22.3 Célpontok (esemenyek.yaml)

```yaml
célpontok:  # (yaml-ban: események — legacy elnevezés)
  # harci: ké_dobás, té_dobás, cé_dobás, manőver_ellenpróba, sebzésdobás, támadások_száma, vé_veszteség
  # próba: tulajdonságpróba, képzettségpróba, szociális_próba, szellemi_próba, fizikai_próba, érzék_próba, mágiaellenállás, mágia_akarata
  # fizikai: mozgás, beszéd
  # képesség: harci_képesség, varázslás, pszi, antyssjárás
```

### 22.4 Hatások (hatasok.yaml)

Elnevezett, magas szintű hatáscsomagok (081_hatasok.md). Forrás: `data/sources/hatasok.yaml`.
Státuszok és Harci helyzetek ezeket okozzák. Minden Hatás leírható mechanika+cél párokkal.

| id | Hatás neve | Mechanika | Cél | Leírás |
|----|-----------|-----------|-----|--------|
| előny_1 | Előny+1 | előny +1 | (változó) | 2x dob, nagyobb számít |
| előny_2 | Előny+2 | előny +2 | (változó) | 3x dob, legnagyobb számít |
| hátrány_1 | Hátrány-1 | hátrány -1 | (változó) | 2x dob, kisebb számít |
| hátrány_2 | Hátrány-2 | hátrány -2 | (változó) | 3x dob, legkisebb számít |
| automatikus_kudarc | Automatikus kudarc | letilt | próbák | Nem dobhatsz, azonnali kudarc |
| automatikus_próba | Aut. próba | szöveges | — | Aut. siker → sima próba |
| beszéd_zavart | Beszéd - zavart | szöveges | beszéd | Nehézkes, mágiánál extra próba |
| beszéd_némult | Beszéd - némult | letilt | beszéd | Hangkiadás képtelen |
| érzék_zavart | Érzék - zavart | hátrány -1 | érzék_próba | Adott érzékre |
| érzék_részleges | Érzék - részleges | hátrány -2 | érzék_próba | Adott érzékre |
| érzék_kioltott | Érzék - kioltott | letilt | érzék_próba | Aut. kudarc érzékpróbára |
| antyssjárás_elvesztése | Antyssjárás elvesztése | letilt | antyssjárás | Nem lép be Antyss síkra |
| fp_s1 | FP S1 | szöveges | — | S1 rubrikák FP feltöltés |
| fp_s2 | FP S2 | szöveges | — | S1+S2 rubrikák FP feltöltés |
| harcképtelenség | Harcképtelenség | letilt | harci_képesség | Mozog, nem harcol |
| mozgás_feleződik | Mozgás - feleződik | arányos 0.5 | mozgás | Feleződik |
| mozgás_lecövekelt | Mozgás - lecövekelt | letilt | mozgás | Helyváltoztatás képtelen |
| mozgás_képtelen | Mozgás - képtelen | letilt | mozgás+harci | Nyaktól lefelé mozdulni sem |
| pszi_elvesztése | Pszi elvesztése | letilt | pszi | Diszciplínák használhatatlan |
| sebzés_csökkentett | Sebzés csökkentett | szöveges | sebzésdobás | 0 + k20 SP |
| támadás_elvesztés_1 | 1 támadás elvesztése | szöveges | támadások_száma | -1 támadás (min 1) |
| támadás_elvesztés_többszörös | Többsz. tám. elvesztés | max_limit 1 | támadások_száma | Max 1 tám/kör |
| varázslás_elvesztése | Varázslás elvesztése | letilt | varázslás | Mágia végzése képtelen |
| vé_veszteség_duplázódik | VÉ veszteség dupl. | duplázás 2 | vé_veszteség | Elszenvedett VÉ veszt. ×2 |
| vé_csökkentés_bónusz | VÉ csökk bónusz | szöveges | vé_veszteség | +1..+2 bónusz |
| vé_csökkentés_fix | VÉ csökkentés: X | szöveges | vé_veszteség | Fix VÉ csökkentés |
| vérzés_gyenge | Vérzés - gyenge | szöveges | — | 1 ÉP / 10 perc |
| vérzés_közepes | Vérzés - közepes | szöveges | — | 1 ÉP / 2 kör |
| vérzés_erős | Vérzés - erős | szöveges | — | 1 ÉP / kör |

### 22.5 Státusz struktúra (statuszok.yaml)

```yaml
státuszok:
  - név: "Blokkolt"
    kategória: "mágikus"          # fizikai | szellemi | mágikus
    fokok:
      - fok: 1
        alcím: "Közepesen"
        hatások:                   # strukturált lista: mechanika + érték + cél
          - { hatás: "hátrány", érték: -1, cél: "té_dobás" }
          - { hatás: "arányos", érték: 0.5, cél: "mozgás" }
      - fok: 2
        alcím: "Erősen"
        hatások:
          - { hatás: "hátrány", érték: -2, cél: "té_dobás" }
          - { hatás: "arányos", érték: 0.5, cél: "mozgás" }
```

Hatás objektum mezői:
- `hatás`: mechanika típus id (kötelező, hatas_operatorok.yaml-ból)
- `érték`: szám (opcionális, mechanika-függő)
- `cél`: célpont id (kötelező, esemenyek.yaml-ból)
- `megjegyzés`: string (opcionális, kontextuális kiegészítés)

### 22.6 Session

`session.aktív_státuszok: string[]` — formátum: `"Státusznév (fok)"`, pl. `"Félelem (2)"`

### 22.7 Webapp megjelenítés

- Aktív fülön: dropdown-ból választható (státusz név + fok + alcím)
- Chip megjelenítés: "Félelem (2) - Rettegés" + ✕ törlés
- Koppintás (Game mód): hatások listája lenyílik (accordion)

### 22.8 Hatás pool (Aktív fül) — "Státuszok" szekció

Per-státusz és per-taktika megjelenítés (nem aggregált):

Formátum:
- **Taktika neve (fok)** halvány kék (`#90caf9`) — alatta soronként a hatásai
- **Státusz név (fok) alcím** gesztenye/bordó (`#cd7c6f`) — alatta soronként a hatásai fehéren

Hatás sor formázás:
- `szöveges`: csak a `megjegyzés` szöveg (cél nem jelenik meg)
- `letilt`: "❌ Letiltva: {cél név}"
- `előny`/`hátrány`: "Előny+N: {cél név}" / "Hátrány-N: {cél név}"
- `duplázás`/`arányos`: "×N: {cél név}"
- `max_limit`: "max N: {cél név}"
- `enyhít`: "Enyhítés+N: {cél név}"

note: A pool informatív — a KM alkalmazza. Nincs aggregáció (minden státusz/taktika saját blokkban).

### 22.9 Validáció (build-time)

- `validate_hatasok()`: mechanika típus id egyediség, kötelező mezők, mód enum
- `validate_esemenyek()`: célpont id egyediség, kötelező mezők, csoport enum
- `validate_statuszok()`: referenciális integritás (hatás → mechanika id, cél → célpont id)

note: `státusz:` feltétel prefix → §16 feltételes fortély módosítók aktiválása (jövőbeli).

### 22.10 Fortély módosítók és Hatás mechanika kapcsolata

Két párhuzamos rendszer — szándékosan elkülönített:

| Rendszer | Cél referencia típus | Mechanizmus | Példa |
|----------|---------------------|-------------|-------|
| Fortély `módosítók` (flat/scaled/előny) | Harcértékek: `TÉ`, `VÉ`, `KÉ`, `SP`, `harckeret`, képzettségnevek | Fix numerikus módosítók, reactive engine számol | Mesterfegyver: TÉ:+3 |
| Fortély `módosítók` (enyhít) | `esemenyek.yaml` id-k | Státusz/Helyzet Hatásainak csökkentése | Testőr: vé_veszteség enyhít |
| Státusz/Helyzet `hatások[]` | `esemenyek.yaml` id + `hatas_operatorok.yaml` operátor | Előny/Hátrány kocka-reroll + letilt/szorzó | Félelem(2): hátrány -2 té_dobás |

A fortély `mód: "enyhít"` az egyetlen pont ahol a két rendszer találkozik:
- A fortély az `esemenyek.yaml` id-jével hivatkozik a célpontra
- A Státusz/Helyzet `hatások[]` ugyanazt az id-t célozzák
- Az enyhítés csökkenti a célra vonatkozó negatív hatás fokát

Cél referencia konvenció:
- Harcértékek (nagybetűs): `TÉ`, `VÉ`, `KÉ`, `CÉ`, `SP`, `SFÉ` → fortély flat/scaled módosítók céljai
- Dobások/képességek (snake_case): `té_dobás`, `vé_veszteség`, `mozgás` → esemenyek.yaml id-k (Hatás mechanika + enyhít)
- Speciális engine változók: `harckeret`, `pajzs_TÉ_mérséklés`, `MGT_TÉ_büntetés` → csak fortély flat
- Manőver célok: `manőver:{id}` → fortély bónuszok manőverekhez


---

## §23 Több támadás TÉ levonás

Ha egy fegyverrel >1 támadás lehetséges (harckeret/sebesség alapján), minden támadásra fix TÉ levonás jár.

```
konstansok.több_támadás_TÉ_levonás: -3
```

Alkalmazás: `fegyver_támadások > 1` → TÉ + több_támadás_TÉ_levonás.
Az "1 támadás" taktika `TÉ: +3` módosítója generikusan kioltja (taktikaMods-on keresztül).

---

## §24 Kalkulált feltételek (fortély módosítókban)

A fortély módosítók `feltétel` mezője kétféle lehet:

### String feltétel (session dispatch)
```yaml
feltétel: "taktika:roham"
```
Az aktív taktikák/helyzetek `feltétel_kulcs` értékéből + a `fegyverfogás:{session.fegyverfogás}` értékből épül az `aktívFeltételek` Set.

### Strukturált feltétel (kalkulált)
```yaml
feltétel:
  - { forrás: "páncél_merev", operátor: "==", érték: true }
  - { forrás: "páncél_lefedettség", operátor: ">=", érték: 70 }
```
Lista elemek ÉS kapcsolatban. Forrás lookup sorrend:
1. `session` mezők (kétkezes_harc, aktív_pajzs, stb.)
2. `computed` (reactive engine eredmények: páncél_merev, páncél_lefedettség, stb.)
3. `ctx` (buildContext input értékek)

Operátorok: `==`, `!=`, `>=`, `<=`, `>`, `<`
Boolean↔number normalizálás: `true` = 1, `false` = 0 (reactive engine number-ként számol).

Érintett fortélyok:
- Merevvértviselet fok 3: `páncél_merev == true` ÉS `páncél_lefedettség >= 70`
- Kétkezes harc 1-3: `kétkezes_harc == true`
- Kétkezesség 1: `kétkezes_harc == true`

### Session toggle fortélyok

Fortély yaml-ban `session_toggle: true` → Aktív fülön toggle gomb jelenik meg.
A fortély TÉ/VÉ módosítói csak akkor aktívak, ha a session toggle be van kapcsolva.
A manőver bónusz módosítók mindig aktívak (toggle-től független).

Session kulcs: `fortély_név.toLowerCase().replace(/ /g, '_')` (pl. `harci_akrobatika`).

Jelenlegi session_toggle fortélyok:
- Harci akrobatika → `session.harci_akrobatika` (TÉ/VÉ: Akrobatika képzettség × arány)

## §25 Fortély követelmények

Source of truth a fortélyok yaml `követelmények` mezőjéhez.

Generálás: `generate_tables.py` → `fortelyok.json` (fokok[].követelmények lista átpasszolva).
UI validáció: `FortelyokScreen.tsx` → `FortelyRow` komponens (runtime ellenőrzés karakter adatok ellen).

Típusok:
- `képzettség` — karakter képzettség szintje ≥ érték
- `fortély` — karakter felvett fortély fokszáma ≥ érték (többszörös fortélynál bármely példány teljesítheti, pl. Nyelvismeret)
- `faj_háttér` — karakter faj háttere engedélyezi (szöveges, nem gépi)
- `tulajdonság` — karakter tulajdonság ≥ érték
- `háttér` — karakter leíró háttere tartalmazza (szöveges)
- `szöveges` — nem gépileg ellenőrizhető (infó)

Ellenőrzés logika:
- `képzettség`: `karakter.képzettségek.some(k => k.név == név && k.szint >= érték)` — lista típusnál bármelyik egyezés elég (OR)
- `fortély`: `karakter.fortélyok.some(f => f.név == név && f.fok >= érték)` — többszörös fortélynál (pl. Nyelvismeret) bármely példány teljesítheti

**Mesterfegyver követelmény — fegyver-specifikus harcmodor szűkítés:**

A Mesterfegyver fortély yaml-ban a követelmény OR listában az összes közelharci harcmodor szerepel.
Az UI ellenőrzés (`HarcertekekScreen`, `TavharcScreen`) azonban **nem az egész OR listát** vizsgálja,
hanem **kizárólag az adott fegyverhez tartozó harcmodort**:
- Közelharci fegyver: `fegyver.Kategória` → `konstansok.fegyver_kategória_harcmodor[kategória]` lookup
- Távfegyver: `távfegyver.Harcmodor` mező közvetlenül (pl. Íjászat, Hajítás, Lövészet)

Tehát: "Kard, hosszú" (kardvívó kategória) MF → csak Kardvívás ≥ X vizsgálat;
"Hosszú íj" (Harcmodor: Íjászat) MF → csak Íjászat ≥ X vizsgálat.
Fallback (ha a fegyver harcmodorja nem határozható meg): az egész OR lista érvényes.

### Általános fortélyok

| Fortély | Fok | Típus | Név | Érték |
|---------|-----|-------|-----|-------|
| Biztos kezű mászó | 1 | képzettség | Mászás | 6 |
| Gyöngyhalász | 0 | fortély | Úszás | 1 |
| Gyöngyhalász | 1 | fortély | Úszás | 2 |
| Hangutánzás | 2 | fortély | Nyelvismeret | 1 |
| Keresés/rejtés | 1 | képzettség | Észlelés | 3 |
| Keresés/rejtés | 2 | képzettség | Észlelés | 3 |
| Kocsihajtás | 1 | képzettség | Lovaglás/Léglovaglás | 3 |
| Műhelymester | 1 | képzettség | Kézművesség | 9 |
| Pók | 1 | képzettség | Mászás | 6 |
| Suhanó árnyék | 1 | képzettség | Lopakodás/rejtőzés | 6 |
| Szájról olvasás | 1 | fortély | Nyelvismeret | 2 |
| Százarcú | 1 | képzettség | Álcázás/Álruha | 4 |
| Százarcú | 2 | képzettség | Álcázás/Álruha | 8 |
| Vezető: Bölcsészprofesszor | 1 | képzettség | Lexikum | 6 |
| Vezető: Bölcsészprofesszor | 2 | képzettség | Lexikum | 9 |
| Vezető: Hajóskapitány | 1 | képzettség | Hajózás | 6 |
| Vezető: Hajóskapitány | 2 | képzettség | Hajózás | 9 |
| Vezető: Nyomozó | 1 | képzettség | Nyomozás | 6 |
| Vezető: Nyomozó | 2 | képzettség | Nyomozás | 9 |
| Vezető: Orvosprofesszor | 1 | képzettség | Orvoslás | 6 |
| Vezető: Orvosprofesszor | 2 | képzettség | Orvoslás | 9 |
| Vezető: Rendező | 1 | képzettség | Előadóművészet | 6 |
| Vezető: Rendező | 2 | képzettség | Előadóművészet | 9 |
| Vezető: Tudósprofesszor | 1 | képzettség | Kvantikum | 6 |
| Vezető: Tudósprofesszor | 2 | képzettség | Kvantikum | 9 |
| Villámgyors keresés/rejtés | 1 | képzettség | Észlelés | 3 |
| Villámgyors keresés/rejtés | 1 | fortély | Keresés/rejtés | 1 |
| Zártörő | 1 | képzettség | Zárnyitás | 6 |

### Érzék fortélyok

| Fortély | Fok | Típus | Név | Érték |
|---------|-----|-------|-----|-------|
| Emberentúli hallás | 1 | faj_háttér | — | — |
| Emberentúli látás | 1 | faj_háttér | — | — |
| Emberentúli szaglás | 1 | faj_háttér | — | — |
| Infralátás | 1 | faj_háttér | — | — |
| Infralátás | 2 | faj_háttér | — | — |
| Irányérzék | 1 | faj_háttér | — | — |
| Ultralátás | 1 | faj_háttér | — | — |
| Ultralátás | 2 | faj_háttér | — | — |
| Ultralátás | 3 | faj_háttér | — | — |

### Harci fortélyok

| Fortély | Fok | Típus | Név | Érték | Megjegyzés |
|---------|-----|-------|-----|-------|------------|
| Alakzat: támadó | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Alakzat: támadó | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | |
| Alakzat: védekező | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Alakzat: védekező | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | |
| Alkalmatlan fegyver hajítása | 1 | képzettség | [adott fegyver harcmodora] | 6 | + Hajítás ≥ 3 |
| Alkalmatlan fegyver hajítása | 2 | képzettség | [adott fegyver harcmodora] | 9 | + Hajítás ≥ 6 |
| Alkalmatlan tárgyak hajítása | 1 | képzettség | Hajítás | 6 | |
| Alkalmatlan tárgyak hajítása | 2 | képzettség | Hajítás | 9 | |
| Belharc | 1 | képzettség | Közelharc | 6 | |
| Belharc | 2 | képzettség | Közelharc | 9 | |
| Elpusztíthatatlan | 1 | képzettség | Fájdalomtűrés | 7 | |
| Elpusztíthatatlan | 2 | képzettség | Fájdalomtűrés | 10 | |
| Elsöprő roham | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás] | 4 | + Roham taktika |
| Fárasztás | 1 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 6 | |
| Fegyverrántás | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 4 | |
| Fegyverrántás | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 8 | |
| Gladiátor bestiái | 1 | háttér | Gladiátor | — | + Harcmodor ≥ 6 |
| Gladiátor közönsége | 1 | háttér | Gladiátor | — | + Harcmodor ≥ 6 |
| Harc helyhez kötve | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 3 | |
| Harc helyhez kötve | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Harci akrobatika | 1 | képzettség | Akrobatika | 6 | Csak hajlékony vértben, MGT ≤ 10 |
| Harci akrobatika | 2 | képzettség | Akrobatika | 9 | Csak hajlékony vértben, MGT ≤ 10 |
| Harci akrobatika | 3 | képzettség | Akrobatika | 12 | Csak hajlékony vértben, MGT ≤ 10 |
| Harci anatómia | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Harci anatómia | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | + Élettan fortély ≥ 1 |
| Harci anatómia | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 12 | + Élettan fortély ≥ 1 |
| Harci kocsihajtás | 1 | fortély | Kocsihajtás | 1 | + Lovaglás ≥ 6 |
| Harci kocsihajtás | 2 | fortély | Kocsihajtás | 1 | + Lovaglás ≥ 9 |
| Harckeret növelés | 1 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 6 | |
| Harckeret növelés | 2 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 9 | |
| Harckeret növelés | 3 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 12 | |
| Harcos elme | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Harcos elme | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | |
| Harcos elme | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 12 | + Teljes Védekezés taktika |
| Kaszabolás | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 8 | |
| Kétkezes harc | 1 | képzettség | [nagyobb fegyver harcmodora] | 6 | + kisebb fegyver harcmodora ≥ 3 |
| Kétkezes harc | 2 | képzettség | [nagyobb fegyver harcmodora] | 9 | + kisebb fegyver harcmodora ≥ 6 |
| Kétkezes harc | 3 | képzettség | [nagyobb fegyver harcmodora] | 9 | + kisebb fegyver harcmodora ≥ 9 |
| Léglovas harc | 1 | képzettség | Léglovaglás | 3 | |
| Léglovas harc | 2 | képzettség | Léglovaglás | 6 | |
| Léglovas harc | 3 | képzettség | Léglovaglás | 9 | |
| Lovas harc | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | + Lovaglás ≥ 6 |
| Lovas harc | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | + Lovaglás ≥ 9 |
| Lovas harc | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 12 | + Lovaglás ≥ 12 |
| Merevvértviselet | 1 | képzettség | [Kardvívás, Rombolás, Lándzsavívás] | 3 | |
| Merevvértviselet | 2 | képzettség | [Kardvívás, Rombolás, Lándzsavívás] | 3 | |
| Merevvértviselet | 3 | képzettség | [Kardvívás, Rombolás, Lándzsavívás] | 3 | |
| Mesterfegyver | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 4 | Fegyver-specifikus: csak az adott fegyver harcmodorát vizsgálja (→ §25 szűkítés) |
| Mesterfegyver | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 8 | Fegyver-specifikus: csak az adott fegyver harcmodorát vizsgálja (→ §25 szűkítés) |
| Mesterfegyver | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 12 | Fegyver-specifikus: csak az adott fegyver harcmodorát vizsgálja (→ §25 szűkítés) |
| Orgyilkos | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | |
| Orgyilkos | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | |
| Pajzshasználat | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 3 | |
| Pajzshasználat | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 5 | |
| Pajzshasználat | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 8 | |
| Páros harc | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 3 | Összeszokott társ |
| Páros harc | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 6 | Összeszokott társ |
| Páros harc | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 9 | Egypetéjű ikrek |
| Támadás erőből | 1 | képzettség | [Kardvívás, Lándzsavívás, Rombolás] | 3 | |
| Támadás erőből | 2 | képzettség | [Kardvívás, Lándzsavívás, Rombolás] | 6 | |
| Természetes fegyver | 1 | faj_háttér | — | — | |
| Természetes páncél | 1 | faj_háttér | — | — | |
| Természetes páncél | 2 | faj_háttér | — | — | |
| Természetes páncél | 3 | faj_háttér | — | — | |
| Testőr | 1 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 6 | |
| Testőr | 2 | képzettség | [Közelharc, Kardvívás, Lándzsavívás, Rombolás, Ostorharc] | 9 | |
| Vezető: Alakzatparancsnok | 1 | képzettség | Alakzatharc | 6 | + Befolyásolás ≥ 3 |
| Vezető: Alakzatparancsnok | 2 | képzettség | Alakzatharc | 9 | + Befolyásolás ≥ 3 |
| Vezető: Fejvadász strategis | 1 | képzettség | Lopakodás/rejtőzés | 6 | + Fejvadász háttér |
| Vezető: Fejvadász strategis | 2 | képzettség | Lopakodás/rejtőzés | 9 | + Fejvadász háttér |
| Vezető: Íjászparancsnok | 1 | képzettség | [Íjászat, Lövészet] | 6 | |
| Vezető: Íjászparancsnok | 2 | képzettség | [Íjászat, Lövészet] | 9 | |
| Vezető: Léglovaskapitány | 1 | képzettség | Léglovaglás | 6 | + Befolyásolás ≥ 3 |
| Vezető: Léglovaskapitány | 2 | képzettség | Léglovaglás | 9 | + Befolyásolás ≥ 3 |
| Vezető: Lovaskapitány | 1 | képzettség | Lovaglás | 6 | + Befolyásolás ≥ 3 |
| Vezető: Lovaskapitány | 2 | képzettség | Lovaglás | 9 | + Befolyásolás ≥ 3 |

### Távharc fortélyok

| Fortély | Fok | Típus | Név | Érték | Megjegyzés |
|---------|-----|-------|-----|-------|------------|
| Gyors hajítás | 1 | képzettség | Hajítás | 5 | Csak hajítófegyverekkel |
| Gyors lövés | 1 | képzettség | Íjászat | 5 | Csak íjjal |
| Gyors újratöltés | 1 | képzettség | Lövészet | 6 | |
| Gyors újratöltés | 2 | képzettség | Lövészet | 9 | |
| Kitartott célzás | 1 | képzettség | [Íjászat, Lövészet] | 5 | |
| Lövés futás közben | 1 | képzettség | [Íjászat, Lövészet, Hajítás] | 5 | |
| Lövés hátasról | 1 | képzettség | [Íjászat, Lövészet, Hajítás] | 5 | + Lovaglás ≥ 6, Mesterfegyver ≥ 1, Lovas harc ≥ 2 |
| Lövés hátasról | 2 | képzettség | [Íjászat, Lövészet, Hajítás] | 9 | + Lovaglás ≥ 9, Mesterfegyver ≥ 2, Lovas harc ≥ 3 |
| Lövés reflexből | 1 | tulajdonság | Gyorsaság | 1 | + Távolsági harcmodor ≥ 5 |
| Mesterlövész | 1 | képzettség | Lövészet | 5 | |
| Mozgó cél mestere fegyverrel | 1 | képzettség | [Íjászat, Lövészet, Hajítás] | 5 | |

---

## §26 Kétkezes harc

Forrás: md/065_04_04_ketkezes_harc.md, fortelyok.harci/ketkezes_harc.md, fortelyok.harci/ketkezesseg.md

### 26.1 Alapfogalmak

Kétkezes harc = mindkét kézben fegyver (session.kétkezes_harc = true).
A "nagyobb fegyver" az, amelyiknek nagyobb a pengehossza. Egyenlő penge esetén bármelyik.

### 26.2 Használt harcmodor

A **nagyobb fegyver** harcmodora számít (képzettség szint lookup).

### 26.3 Harcértékek

| Kétkezes harc fok | TÉ/VÉ | Mesterfegyver | Harckeret bónusz |
|---|---|---|---|
| Alapeset (0. fok, nincs fortély) | Csak nagyobb fegyver értékei. TÉ/VÉ: -3/-3 | mf: "nincs" | +1 (konstans) |
| 1. fok | Mindkét fegyver TÉ/VÉ összeadódik | mf: "nincs" | +2 (yaml feltételes) |
| 2. fok | Mindkét fegyver TÉ/VÉ összeadódik | mf: "nagyobb" | +3 (yaml feltételes) |
| 3. fok | Mindkét fegyver TÉ/VÉ összeadódik | mf: "mindkettő" | +4 (yaml feltételes) |

+ Kétkezesség fortély: +1 harckeret (feltételes, session.kétkezes_harc == true)

### 26.4 Pengeméret korlát

```
A két fegyver összpengehossza: max konstansok.kétkezes_harc_max_pengeméret (jelenleg: 2.0).
Ha SUM pengehossz > limit → fegyverek harcértéke: 0 (nem használható együtt kétkezes harcban).
"Rövid" fegyverek (penge < 0.5): pengehossz 0-nak számít.
Pengehossz értékek: fegyverek.json Pengehossz mező (0, 0.5, 1, 1.5, 2 egységekben).
```

### 26.5 Harckeret módosítás

```
input: Kétkezes harc fok, Kétkezesség fortély, fegyverek pengehossza (0.5 egységben)
formula:
  // Harckeret bónusz forrása:
  //   0. fok (nincs fortély): konstansok.kétkezes_harc_bónuszok[0].harckeret (= +1)
  //   1-3. fok: fortély yaml módosítók (feltételes, kétkezes_harc==true) → fortelyMods['harckeret']
  //   Kétkezesség: +1 (fortély yaml, feltételes)

  if fok == 0:
    kh_harckeret_bónusz = konstansok.kétkezes_harc_bónuszok[0].harckeret  // +1
  else:
    kh_harckeret_bónusz = 0  // fortélyMods['harckeret']-ben már benne van

  // Pengelevonás: a két fegyver tényleges pengehosszainak összege, osztva 0.5-tel
  sum_pengehossz = fegyver_jobb.pengehossz + fegyver_bal.pengehossz
  pengelevonás = FLOOR(sum_pengehossz / konstansok.kétkezes_harc_pengelevonás_osztó)

  harckeret = harcmodorSzint + gyorsaság + fortelyMods['harckeret'] + kh_harckeret_bónusz - pengelevonás

note: A pengehossz a fegyverek.json-ból jön (0.5 egységekben, pl. tőr=0, rövidkard=0.5, szablya=1.5).
      "Rövid" fegyverek (penge < 0.5): 0-nak számítanak a pengeméret kalkulációhoz.
      A SUM Pengeméret (egész pengékben kerekítve) a Pengeelőny/hátrány rendszerhez kell — az más!
      Max SUM = konstansok.kétkezes_harc_max_pengeméret (ha összpenge > limit → nem végezhető).
```

### 26.6 Sebzés

Mindig az ügyesebb kézben levő fegyver sebez (= jobb kéz fegyver, session.aktív_fegyver_index).
Kivétel: ha szándékosan a rosszabbik kézben lévővel támad (Hátrány-1 TÉ dobás Kétkezesség nélkül).

### 26.7 Session és UI

- `session.kétkezes_harc: boolean` — a Fegyverfogás picker állítja be ("Kétkezes harc" opció)
- `session.fegyverfogás: "kétkezes"` — a Fegyverfogás explicit mező (§27)
- `session.aktív_fegyver_index` — ügyesebb kéz fegyver
- `session.aktív_fegyver_bal_index` — gyengébb kéz fegyver (csak kétkezes fogásnál)
- Aktív fül: Fegyverfogás picker (§27), "Kétkezes harc" disabled ha összpenge > limit vagy nincs nem-hárító fegyver
- Harc fül: kétkezes harc aktív → összevont harcértékek megjelenítése (lila keret, normál sorok halványítva)
- Harc fül: Ph oszlop kétkezesnél: `x(y)` formátum (x=nagyobb fegyver penge, y=összpenge)

### 26.8 Fortély feltételek

A harckeret bónuszok forrásai kétkezes fogásnál:

| Fortély | Bónusz | Feltétel (yaml) | Megjegyzés |
|---------|--------|-----------------|------------|
| Kétkezes harc 1.fok | harckeret: +2 | `fegyverfogás:kétkezes` | yaml string prefix feltétel |
| Kétkezes harc 2.fok | harckeret: +3 | `fegyverfogás:kétkezes` | |
| Kétkezes harc 3.fok | harckeret: +4 | `fegyverfogás:kétkezes` | |
| Kétkezesség 1.fok | harckeret: +1 | `[{forrás: "kétkezes_harc", op: "==", érték: true}]` | kalkulált feltétel |
| Harckeret növelés | harckeret: +1/+2/+3 | (nincs) | mindig aktív |
| Alapeset (0.fok, nincs fortély) | harckeret: +1 | — | konstansok.kétkezes_harc_bónuszok[0].harckeret |

A `fegyverfogás:kétkezes` és `session.kétkezes_harc == true` mindketten azt jelzik, hogy kétkezes fogás aktív.
- `fegyverfogás:kétkezes`: string prefix feltétel → `session.fegyverfogás === 'kétkezes'`
- `kétkezes_harc == true`: kalkulált feltétel → `session.kétkezes_harc === true`
- A két feltétel ekvivalens (mindkettő csak kétkezes fogásnál igaz).

### 26.9 Kalkuláció összefoglalás

```
if session.kétkezes_harc:
  nagyobb_fegyver = fegyver[jobb] if fegyver[jobb].pengehossz >= fegyver[bal].pengehossz else fegyver[bal]
  kisebb_fegyver = a másik

  harcmodor_szint = lookup(nagyobb_fegyver.kategória → harcmodor képzettség szint)

  khFokEntry = konstansok.kétkezes_harc_bónuszok[fok]

  if khFokEntry.mindkét_fegyver_értékei:
    TÉ = TÉ_alap + nagyobb.TÉ + kisebb.TÉ + harcmodor_bónusz.TÉ + HM_TÉ + MF_bónusz + fortelyMods['TÉ'] + khFokBónusz.TÉ
    VÉ = VÉ_alap + nagyobb.VÉ + kisebb.VÉ + harcmodor_bónusz.VÉ + HM_VÉ + MF_bónusz + fortelyMods['VÉ'] + khFokBónusz.VÉ
  else:
    TÉ = TÉ_alap + nagyobb.TÉ + harcmodor_bónusz.TÉ + HM_TÉ + fortelyMods['TÉ'] + khFokBónusz.TÉ
    VÉ = VÉ_alap + nagyobb.VÉ + harcmodor_bónusz.VÉ + HM_VÉ + fortelyMods['VÉ'] + khFokBónusz.VÉ

  // khFokBónusz: 0.fok → konstansokból (TÉ:-3, VÉ:-3), fok>=1 → {TÉ:0, VÉ:0} (yaml-ból fortelyMods-ban)

  MF_bónusz (TÉ/VÉ/SP) — data-driven: khFokEntry.mf
    if mf == "nincs": 0
    if mf == "nagyobb": lookup(MF_fok_nagyobb → mesterfegyver_bónuszok)
    if mf == "mindkettő": lookup(MF_fok_nagyobb) + lookup(MF_fok_kisebb)

  SP = fegyver_jobb.SP + erőbónusz + MF_bónusz.SP + fortelyMods['SP']

  harckeret = harcmodorSzint + gyorsaság + fortelyMods['harckeret'] + khFokBónusz.harckeret - pengelevonás
  pengelevonás = FLOOR(sum_pengehossz / konstansok.kétkezes_harc_pengelevonás_osztó)
  támadások = 1 + FLOOR(harckeret / nagyobb_fegyver.sebesség)
```

## §27 Fegyverfogás

Forrás: md/065_04_00_fegyverfogas.md

### 27.1 Koncepció

A Fegyverfogás meghatározza a karakter kéz-konfigurációját a harcban. Négy lehetőség:
- **Egyfegyveres** (alap) — egy fegyver, másik kéz üres (vagy kétkezes/másfélkezes fegyver)
- **Fegyver + pajzs** — fő fegyver + pajzs a gyengébb kézben
- **Fegyver + hárítófegyver** — fő fegyver + hárítófegyver a gyengébb kézben
- **Kétkezes harc** — két külön fegyver (§26)

### 27.2 Data layer terv

```
Új session mező:
  session.fegyverfogás: "egyfegyveres" | "fegyver_pajzs" | "fegyver_hárító" | "kétkezes"

A fegyverfogás EXPLICIT session mező — a felhasználó a Fegyverfogás picker-rel választja.
A választás beállítja a kapcsolódó session mezőket is:
  "egyfegyveres"   → kétkezes_harc: false, aktív_pajzs: false, bal kéz: -1
  "fegyver_pajzs"  → kétkezes_harc: false, aktív_pajzs: true, bal kéz: -1
  "fegyver_hárító" → kétkezes_harc: false, aktív_pajzs: false, bal kéz: hárítófegyver index
  "kétkezes"       → kétkezes_harc: true, aktív_pajzs: false, bal kéz: fegyver index

Picker elérhetőség:
  - Puszta kéz jobb kézben → picker disabled, fix "egyfegyveres"
  - Kétkezes fegyver jobb kézben → csak "egyfegyveres" aktív, többi disabled
  - Nincs pajzs a karakteren → "fegyver_pajzs" disabled
  - Nincs hárítófegyver / nincs "Hárítófegyver használat" fortély → "fegyver_hárító" disabled
  - Összpenge > konstansok.kétkezes_harc_max_pengeméret VAGY nincs nem-hárító fegyver bal kézhez → "kétkezes" disabled

Bal kéz dropdown:
  - Csak "kétkezes" és "fegyver_hárító" fogásnál jelenik meg
  - "kétkezes": karakter fegyverek (pengelimit szűrt, hárítófegyverek kiszűrve)
  - "fegyver_hárító": hárítófegyverek listája
```

### 27.3 Harcérték hatások fegyverfogásonként

```
Egyfegyveres:
  Standard kalkuláció (§7-§14). Nincs extra módosító.

Fegyver + pajzs:
  Implementálva (§13): pajzsVÉ bónusz + TÉ büntetés (Pajzshasználat fok-függő).
  TÉ büntetés = konstansok.pajzs_TÉ_büntetés[méret] + fortelyMods['pajzs_TÉ_mérséklés'] (min 0).
  VÉ +2 (3. fok): fortély yaml módosító → fortelyMods['VÉ'] → fegyver_fortély_VÉ.
  A pajzsVÉ és TÉ büntetés CSAK a lila összesítő sorban jelenik meg (normál sorokból kiszűrve).

Fegyver + hárítófegyver (RÉSZBEN IMPLEMENTÁLVA):
  hárítóVÉ = hárítófegyver.VÉ (fegyverek.json Hárító flag, ha van "Hárítófegyver használat" fortély, else 0)
  hárítóMF_VÉ = MF_bónusz VÉ a hárítófegyverre (TODO: ha van MF a hárítóra)
  Fegyver VÉ += hárítóVÉ + hárítóMF_VÉ
  TÉ büntetés: nincs (a hárítófegyver nem TÉ büntetést ad, mint a pajzs)
  Támadások: nem növeli (hárítófegyverrel nem támadsz)
  Kétkezes harc: hárítófegyverrel nem végezhető (szűrve picker-ben és dropdown-ban)

Kétkezes harc:
  Lásd §26 (teljes implementáció).
```

### 27.4 Inkompatibilitás mátrix

```
                    Egyfegyveres  Fegyver+pajzs  Fegyver+hárító  Kétkezes
Egyfegyveres           ✓              —              —             —
Fegyver+pajzs          —              ✓              —             —
Fegyver+hárító         —              —              ✓             —
Kétkezes               —              —              —             ✓

Kétkezes fegyver (lándzsa, stb.) → kizárólag "Egyfegyveres" fogás.
```

### 27.5 Implementációs lépések

1. ✅ `session.fegyverfogás` mező hozzáadás (Session interface + DEFAULT_SESSION)
2. ✅ AktivScreen: Fegyverfogás picker (overlay popup, 4 opció, disabled logika)
3. ✅ AktivScreen: Bal kéz dropdown feltételes megjelenítés (kétkezes + hárító fogásnál)
4. ✅ AktivScreen: "2 kezes harc" és "Pajzs kézben" toggle gombok eltávolítás (beolvad a picker-be)
5. ✅ Fegyverek.json: `Hárító` flag hárítófegyverekre (process_fegyverek.py, beolvasztva)
6. ✅ HarcScreen: Hárítófegyver VÉ bekötés (ha fegyverfogás == "fegyver_hárító") + lila sor
7. ✅ karakter.yaml séma: `session.fegyverfogás` mező
8. ✅ validate_karakter.py: fegyverfogás enum validáció
9. TODO: Hárítófegyver MF VÉ bónusz (ha van Mesterfegyver a hárítóra)

---

## §28 Harc alakzatban (TERV — NEM IMPLEMENTÁLT)

Forrás: md/065_03_harc_alakzatban.md

### 28.1 Alapfogalmak

- Alakzat: minimum 3 fő összehangolt csapat, max 20 fő (alakzat vs alakzat modellezéshez)
- Alakzatharc képzettség: primer/harci, szintje beleszámít max_HM-be (már implementálva)
- Vezető fortélyok: Alakzatparancsnok, Íjászparancsnok, Lovaskapitány, Léglovaskapitány

### 28.2 Támadószint és Védekezőszint

```
Támadószint = MIN(csapat Alakzatharc szintek) + Vezető_bónusz + MIN(csapat Támadó-alakzat fok) x 2
Védekezőszint = MIN(csapat Alakzatharc szintek) + Vezető_bónusz + MIN(csapat Védekező-alakzat fok) x 2

Vezető_bónusz = Vezető fortély fok x 2
```

### 28.3 Alakzat harcértékek

```
Alakzat_TÉ = AVG(tagok fegyveres TÉ) + harcmodor_bónusz(Támadószint).TÉ
Alakzat_VÉ = AVG(tagok fegyveres VÉ) + harcmodor_bónusz(Védekezőszint).VÉ + MIN(tagok_száma, 10)
Alakzat_CÉ = AVG(tagok fegyveres CÉ) + harcmodor_bónusz(Támadószint).TÉ  // íjász/lövész alakzatnál

note: A harcmodor_bónusz lookup ugyanaz a tábla mint a normál harcmodor szint bónuszok (062_02).
      Személyek száma VÉ: +1/fő, max +10.
```

### 28.4 Kezdeményezés

Az alakzat mindig nyeri a kezdeményezést egyének ellen.

### 28.5 Támadások száma

```
Az alakzat 1 támadást kap minden egyéni ellenfélre (max = alakzat létszáma).
```

### 28.6 VÉ csökkentés alakzat ellen

```
Az alakzat ellen elszenvedett VÉ csökkentésből levonás:
  -2: normál helyzetben
  -3: ha az Alakzat Teljes Védekezés taktikában van
```

### 28.7 VÉ csökkentés alakzat által (fix értékek)

```
3 VÉ: Alakzat Pengehátrányban vagy Alappengénél
4 VÉ: Alakzat Pengeelőnyben

Túlerő módosító:
  +0: 3 fő (legkisebb alakzat)
  +1: 5+ fő
```

### 28.8 Alakzat ÉP

```
Összesített ÉP = tagok_száma x 28 (vagy lényfüggő, pl. ork: 40)
Minden 28 ÉP veszteségnél: -1 fő → újraszámolás (VÉ, létszám bónusz)
```

### 28.9 Alakzat taktikái

```
Engedélyezett taktikák (fix értékek):
  Támadó:   TÉ: +3, VÉ: -6
  Védő:     VÉ: +4, TÉ: -8
  Roham:    TÉ: +4, VÉ: -8
  Fárasztó:  +2 VÉ csökkentés

Manőverek: NEM használhatók alakzatban.
```

### 28.10 Tiltott taktikák alakzat ellen

```
Nem használható egyén által alakzat ellen:
  - Fárasztó taktika
  - Kezdeményező taktika
  - Kiváró taktika
  - Visszafogott taktika
```

### 28.11 Alakzat vs Alakzat

```
Mindkét alakzat: 1 támadás/kör
VÉ csökkentés/kör: 2
Túlerő: +1 VÉ csökkentés / +3 ember (max +5)
Max létszám modellezéshez: 20 fő / alakzat
```

### 28.12 Implementációs terv

```
Webapp scope: NJK alakzat kalkulátor (KM eszköz):
  - Input: tagok száma, min Alakzatharc szint, Vezető fok, Támadó/Védekező fok, fegyveres TÉ/VÉ átlag
  - Output: Alakzat TÉ, VÉ, VÉ csökkentés értékek, engedélyezett taktikák

Nem játékos karakter kalkulátor → egyszerűsített (nem per-tag, hanem átlag alapú).
A játékos karakter Alakzatharc szintje max_HM-be már beleszámít (rules.json: sum harcmodor_összeg + alakzatharc_szint).
```


---

## §29 Undo Stack

Session állapot visszavonás mechanizmus.

### 29.1 Modell

- Stack mélység: **6 művelet** (ha betelt, a legrégebbi kiesik)
- Minden `setSession()` és `setKarakter()` hívás egy tranzakció:
  - `{ timestamp, leírás, előző_állapot }` push a stack-re
  - A `leírás` automatikusan generált (pl. "Taktika hozzáadva: Támadó (2)", "VÉ csökkenés: -3", "Fegyver váltás: Tőr")
- Snapshot típus: session + karakter teljes objektum másolat (deep clone)
- Visszaállítás: a kiválasztott pontig az összes későbbi tranzakció törlődik és az állapot visszaáll

### 29.2 UI

**Menüpont:**
- ⚙️ Beállítások menü legfelső eleme: "↩ Visszavonás (N)"
- Disabled ha a stack üres (szürke, nem kattintható)
- N = stack mérete (1-6)

**Overlay popup (gombra kattintva):**
```
┌─────────────────────────────┐
│  Visszavonás                │
├─────────────────────────────┤
│  ● VÉ csökkenés: -3        │  ← legutóbbi (felül)
│  ○ Taktika: Támadó (2)     │
│  ○ Helyzet: Meglepetés      │
│  ○ Fegyver váltás: Tőr     │
│  ○ Státusz: Félelem (1)    │
│  ○ Páncél viselve: Igen    │  ← legrégebbi (alul)
├─────────────────────────────┤
│  [Visszaállítás ide]        │  ← gomb, disabled amíg nincs kiválasztva
└─────────────────────────────┘
```

- Legutóbbi tranzakció felül, legrégebbi alul
- Kattintás/tap: kiválasztja a pontot (● jelöli, a felette lévők is jelölve — ezek törlődnek)
- A kiválasztott pont FÖLÖTTI elemek vizuálisan kiemeltek (pl. piros háttér = ezek visszavonódnak)
- "Visszaállítás ide" gomb: csak kiválasztás után aktív, kattintásra jóváhagyó popup ("Visszavonod X műveletet?")
- Jóváhagyás után: azonnali visszaállítás + overlay bezárul
- Overlay mellé kattintás: bezár (nem von vissza semmit)

### 29.3 Tranzakció leírás generálás

#### Visszavonható műveletek:

**TulajdonsagokScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| Név szerkesztés | "Név: {régi} → {új}" |
| TSz változtatás | "TSz: {régi} → {új}" |
| Kor változtatás | "Kor: {régi} → {új}" |
| Játékos szerkesztés | "Játékos: {régi} → {új}" |
| Tulajdonság +/- | "{tulajdonság}: {régi} → {új}" |
| Képzettség felvétel | "Képzettség+: {név}" |
| Képzettség törlés | "Képzettség−: {név}" |
| Képzettség szint | "Képzettség: {név} {régi}→{új}" |

**FortelyokScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| Fortély felvétel | "Fortély+: {név}" |
| Fortély törlés | "Fortély−: {név}" |
| Fortély fok változtatás | "Fortély: {név} fok {régi}→{új}" |

**HarcertekekScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| HM TÉ/VÉ változtatás | "HM TÉ: {±1}" / "HM VÉ: {±1}" |
| CM változtatás | "CM: {±1}" |
| Fegyver hozzáadás/törlés | "Fegyver+: {név}" / "Fegyver−: {név}" |
| MF fok | "MF: {fegyver} fok {régi}→{új}" |
| Fegyver Idea/Anyag | "Fegyver: {név} {mező} → {új}" |
| Páncél struktúra | "Páncél: {mező} → {új}" |
| Pajzs méret/fok | "Pajzs: {mező} → {új}" |

**HatterekScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| Háttér toggle | "Háttér: {név} {+/−}" |

**AktivScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| Taktika hozzáadás/törlés | "Taktika: {név} ({fok})" |
| Helyzet hozzáadás/törlés | "Helyzet: {név}" |
| Státusz hozzáadás/törlés | "Státusz: {név} ({fok})" |
| Szituáció hozzáadás/törlés | "Szituáció: {név}" |
| Manőver váltás | "Manőver: {név}" |
| Fegyver váltás | "Fegyver: {név}" |
| Fegyverfogás | "Fogás: {fogás}" |
| Páncél/pajzs toggle | "{mező}: {érték}" |
| Narratív módosító +/- | "Narratív: {szöveg}" |

**HarcScreen:**
| Forrás | Leírás pattern |
|--------|---------------|
| VÉ csökkenés +/- | "VÉ csökkenés: {±érték}" |
| VÉ reset | "VÉ reset" |
| MP használat | "MP: −1" / "MP: reset" |
| Sebzés jelölés | "Sebzés: {SP} ({sáv})" |

#### KIVÉTELEK — NEM vonódnak vissza:

| Mező | Oka |
|------|-----|
| `karakter.jegyzetek` | Szöveges napló, mindig a legfrissebb állapot marad |
| `karakter.napló` | Játékeseménytörténet, kronológiailag nem visszavonható |

Implementáció: az `undoTo()` visszaállításnál a `jegyzetek` és `napló` mezőket az aktuális
(visszaállítás előtti) értékükkel felülírjuk a visszaállított karakter objektumon.

### 29.5 Megjegyzések

- A stack localStorage-ban perzisztens (`szilank_undo` key) — page reload után megmarad
- Game módban és Szerkesztő módban egyaránt működik
- A `pushUndo()` hívást minden session/karakter módosító függvénybe be kell kötni
  - KIVÉVE: `jegyzetek` és `napló` módosítások (ezek nem generálnak undo entry-t)
- Teljesítmény: 6× deep clone max ~50KB adat (karakter+session) — elhanyagolható
- A `pushUndo()` a módosítás ELŐTT hívandó (az aktuális állapotot menti, nem az újat)
- `pushUndo()` mellékhatásai: `isDirty=true` + `testMode=false` (ha teszt módban módosítás történik → kilép teszt módból, karakter mentődik)
- "Új karakter" és "Karakter betöltés" reseteli a stack-et + törli localStorage-ból


---

## §30 Local Storage Cache

Az aktuális karakter állapot és undo stack automatikusan localStorage-ba mentődik (multi-slot rendszer, §31).

### 30.1 Kulcsok

| Key | Tartalom |
|-----|----------|
| `szilank_slots` | Slot lista: `{ uid, id_leíró, név, tsz, mentés_dátum }[]` (max 10) |
| `szilank_char_{uid}` | Karakter JSON + `_undo` mező (undo stack integrálva) |
| `szilank_active` | Aktív karakter uid-ja |

Migráció (backwards compat): ha `szilank_karakter` (régi single key) létezik → automatikus import az első slot-ba, régi kulcsok törlődnek.

### 30.2 Mentés

- Minden `karakter` vagy `undoStack` változáskor: `szilank_char_{uid}` felülíródik (`useEffect`)
- `szilank_slots` frissül (uid, id_leíró, név, tsz, mentés_dátum)
- `_undo` a karakter JSON-ba integrálva (nem külön key)
- Nincs debounce — minden módosítás azonnal ment
- Guard: `if (!karakter || testMode || !isDirty) return`
- Quota exceeded: `try/catch` — silent fail (nem crashel ha localStorage tele)

### 30.3 Betöltés (init)

- App mount-kor: `szilank_active` → uid → `szilank_char_{uid}` → parse → betölt
- Ha nincs aktív: `emptyKarakter` + uid generálás
- `_undo` mező → undo stack inicializálás

### 30.4 Törlés / Reset

- "Új karakter": új uid, új slot (régi megmarad a listában)
- Slot törlés: `szilank_char_{uid}` eltávolítás + slots frissítés (TODO: UI)
- Fájlba exportálás: `_undo` is belekerül a JSON-ba


---

## §31 Multi-karakter mentés

### 31.1 Karakter ID-k

Minden karakter két azonosítót kap:

| Mező | Formátum | Cél |
|------|----------|-----|
| `uid` | `crypto.randomUUID()` (pl. `"a1b2c3d4-..."`) | Egyedi azonosító, localStorage kulcs, soha nem változik |
| `id_leíró` | `"{név-slug}-{tsz}tsz"` (pl. `"von-agabor-8tsz"`) | Ember által olvasható, karakter lista megjelenítéshez |

- `uid`: "Új karakter" indításkor generálódik, soha nem módosul
- `id_leíró`: automatikusan frissül név/TSz változáskor (slug: kisbetű, szóköz→kötőjel, ékezet marad)
- A `test_karakter.json`-ban fix uid (pl. `"test-von-agabor-001"`)
- Betöltéskor: ha hiányzik a `uid`, generálódik (backwards compatibility)
- Schema: `karakter.uid: string`, `karakter.id_leíró: string` (kötelező, top-level mezők)

### 31.2 localStorage struktúra

| Key | Tartalom |
|-----|----------|
| `szilank_slots` | JSON tömb: `{ uid, id_leíró, név, mentés_dátum }[]` — max 10 entry, rendezve utolsó módosítás szerint |
| `szilank_char_{uid}` | Teljes karakter JSON (az adott slot-hoz), benne az undo stack |
| `szilank_active` | Az aktív karakter `uid`-ja (amelyik épp szerkesztés alatt van) |

Slot lista megjelenítés: `{név} ({tsz}sz)` + relatív idő. Név max 15 karakter, utána `..`, verzió suffix (`v2`) megtartva.

Az undo stack a karakter JSON részévé válik:
```json
{
  "id": "abc-123",
  "név": "von Agabor",
  "session": { ... },
  "_undo": [
    { "timestamp": 1719000000, "leírás": "erő: 3 → 2", "session": {...}, "karakter": {...} },
    ...
  ],
  ...
}
```

- `_undo` mező: prefix underscore jelzi, hogy nem szabályrendszer adat (meta)
- Max 6 entry (UNDO_MAX)
- Fájlba exportálásnál az `_undo` mező opcionálisan elhagyható (clean export) vagy benne maradhat
- Betöltéskor: ha van `_undo` → undo stack inicializálás; ha nincs → üres stack

### 31.3 Auto save

- Minden karakter módosításkor: `szilank_char_{uid}` felülíródik
- `szilank_slots` frissül: `mentés_dátum` = now, sorrend újrarendezés
- Az `id_leíró` automatikusan frissül név/TSz változáskor
- Nincs manuális "Mentés" gomb — minden módosítás azonnali

### 31.4 Új karakter

1. `crypto.randomUUID()` → `uid` generálás
2. `id_leíró` generálás (üres névből: `"új-karakter-3tsz"`)
3. `emptyKarakter` + uid + id_leíró → localStorage slot foglalás
4. Ha 10 slot betelt: figyelmeztetés ("Töröld egy régit, vagy mentsd fájlba")
5. Aktív karakter váltás az új slot-ra
6. Undo stack reset
7. `isDirty = false` → nem mentődik amíg a user nem módosít

### 31.4b Duplikálás

Beállítások menü → "📋 Duplikál":
1. Aktuális karakter deep clone (teszt karakter is duplikálható)
2. Új `uid` generálás
3. Név suffix: `"von Agabor"` → `"von Agabor:2"` (ha már `:2` → `:3`)
4. `id_leíró` újragenerálás az új névből
5. Undo stack reset, testMode kikapcsol, isDirty=true
6. Karakterek ablak megnyílik (100ms késleltetéssel, hogy az autosave lefusson)

### 31.5 Karakter lista UI ("Karakterek" menüpont)

```
┌─────────────────────────────────┐
│  Karakter betöltése             │
├─────────────────────────────────┤
│  ● von Agabor (8sz)     2 perce │  ← aktív (kiemelve)
│  ○ Tetves (5sz)         3 napja │
│  ○ Sárkánytűz         1 hete  │
│                                 │
│  [+ Új karakter]                │
│  [📁 Fájlból betöltés...]      │
├─────────────────────────────────┤
│  Törlés: hosszú nyomás a sorra │
└─────────────────────────────────┘
```

- Rendezés: utolsó módosítás szerint (legfrissebb felül)
- Aktív karakter jelölve (●), többi (○)
- Megjelenítés: `{név} ({tsz}sz)` + relatív idő + piros ✕ törlés gomb
- Tap: betöltés (aktív karakter váltás)
- Long press: törlés megerősítéssel
- "Fájlból betöltés": a jelenlegi fájl-import működés (JSON fájl kiválasztás)
- Relatív idő kijelzés ("2 perce", "3 napja", "1 hete")

### 31.6 Karakter törlés

- Long press → megerősítő popup: "Törlöd: {név}?"
- `szilank_char_{uid}` eltávolítás
- `szilank_slots` frissítés
- Ha az aktív karakter törlődik: automatikusan a legfrissebb másik lesz aktív
- Ha nincs más: "Új karakter" indul

### 31.7 Fájlba mentés (export)

"Karakter mentése" gomb → overlay popup:

```
┌─────────────────────────────┐
│  Mentés                     │
├─────────────────────────────┤
│  ○ Aktuális karakter        │
│  ○ Összes karakter (backup) │
├─────────────────────────────┤
│  [Tovább]                   │
└─────────────────────────────┘
```

**Aktuális karakter**: egyedi karakter JSON (uid, id_leíró, _undo benne)
**Összes karakter (backup)**: unified backup JSON — az összes localStorage slot egy fájlban:

```json
{
  "szilánk_backup": true,
  "verzió": 1,
  "dátum": "2026-06-19T15:30:00.000Z",
  "karakterek": [ {...karakter1...}, {...karakter2...}, ... ]
}
```

A `szilánk_backup: true` property jelzi, hogy ez unified backup (nem egyedi karakter).

A fájl elkészülte után → második overlay popup:

```
┌─────────────────────────────┐
│  Fájl kész                  │
├─────────────────────────────┤
│  [📤 Megosztás]             │  ← navigator.share() — mobil share sheet
│  [💾 Helyi mentés]          │  ← download (ahogy eddig)
└─────────────────────────────┘
```

- **Megosztás**: `navigator.share({ files: [file] })` — ha a böngésző támogatja (mobil). Ha nem támogatja → gomb rejtve/disabled.
- **Helyi mentés**: a jelenlegi Blob+download mechanizmus.

Fájlnév konvenció:
- Egyedi: `{név_slug}_{tsz}tsz.json`
- Backup: `szilank_backup_{dátum}.json`

### 31.8 Fájlból betöltés (import)

"Karakter betöltése" → "Fájlból..." gomb → fájlválasztó.

Automatikus felismerés a JSON tartalma alapján:
- Ha `szilánk_backup === true` → **unified backup import**
- Egyébként → **egyedi karakter import**

#### Egyedi karakter import

1. Validáció (`validateKarakter`)
2. Ha az `uid` már létezik a slot listában → megerősítő popup: "Felülírod: {név}({tsz})?"
   - Igen → felülírás
   - Nem → kihagyás (nem importál)
3. Ha nem létezik → új slot hozzáadás
4. Betöltés aktív karakterként

#### Unified backup import

1. Iteráció a `karakterek[]` tömbön
2. Egyenként:
   - Validáció — ha hibás: warning popup ("Hibás entry: {index}. Kihagyva."), folytatás a következővel
   - Ha `uid` létezik → megerősítő popup: "Felülírod: {név}({tsz})?"
   - Ha nem létezik → új slot hozzáadás
3. Nem szakítja meg az importot egy-egy hiba
4. Importálás végén: az utolsó sikeresen importált karakter lesz az aktív (vagy marad az eddigi ha volt)
5. Összesítő: "{N} karakter importálva, {M} kihagyva"

### 31.9 Implementációs megjegyzések

- `crypto.randomUUID()`: modern böngészők (HTTPS/localhost) támogatják
- Fallback uid generálás: `Date.now().toString(36) + Math.random().toString(36).slice(2)`
- `id_leíró` generálás: `"{név-slug}-{tsz}tsz"` (slug: kisbetű, szóköz→kötőjel)
- localStorage limit: ~5MB böngészőnként — 10 karakter × ~15KB = ~150KB, bőven belefér
- Migrálás: ha `szilank_karakter` (régi single key) létezik → automatikus import az első slot-ba, uid generálás
- `navigator.share()`: csak HTTPS + mobil böngésző; desktop-on fallback = csak "Helyi mentés"

---

## §32 ScreenErrorBoundary

```
Minden tab screen renderelést `ScreenErrorBoundary` React class component burkolja.
Ha egy screen renderelés közben runtime hiba keletkezik (pl. hiányzó karakter mező):
- A screen helyén piros hibaüzenet jelenik meg a hiba szövegével
- "Újrapróbálás" gomb reseteli az error state-et
- A többi tab és a fejléc továbbra is működik
- Console-ba kerül a részletes stack trace

Implementáció: App.tsx — `<ScreenErrorBoundary>` wrapper a `<TabContent />` körül.
```

---

## §33 Sérült státusz automatika

```
input:  session.sebzések.length (sebCount), ÉP, sebesülés_kategóriák_száma (4)
source: konstansok.yaml

formula:
  oszlopMéret = ÉP / sebesülés_kategóriák_száma
  inS3 = sebCount > 2 × oszlopMéret
  inS4 = sebCount > 3 × oszlopMéret
  targetFok = inS4 ? 2 : inS3 ? 1 : 0

side effect (HarcScreen useEffect):
  Ha targetFok változik → session.aktív_státuszok frissítés:
    targetFok = 0: "Sérült (X)" eltávolítása
    targetFok > 0: "Sérült ({targetFok})" hozzáadása/frissítése

UI (AktivScreen):
  - "Sérült" státusz chip: locked (nincs ✕ gomb, fok nem kattintható)
  - Státusz picker: "Sérült (auto)" névvel jelenik meg, szürkítve, nem kattintható
```

---

## §34 Aura

```
input:  karakter.tsz, karakter.tulajdonságok.önuralom
source: 103_01_aura_jellemzoi.md

formula:
  Aura = 2 × (tsz + önuralom)

output: Aura (mágiaellenállás alap, mágikus akarat)

note: Az Aura leengedhető akarattal (tetszőleges mértékben, kényszer nélkül).
      0 értékű Aura → Zavar (1) Kizökkent státusz + Hátrány-2 Emberismeret próbára.
      Speciális Aurák (tradíció-függő) a §34 keretein kívül esnek (nem implementált).
```

### §34.1 Mágiaellenállás (ME)

```
source: 103_03_magiaellenallas.md

formula:
  ME = Aura + 10 + módosítók

módosítók (szituációtól függő, nem gépesített):
  + Amulett, varázstárgy, ereklye (szituációs, +1..+3 tipikusan)
  + Litániák, versek mormolása (fortély: Asztrál/Mentál/Fizikai mantra, +1..+3)
  + Képzettségek másodlagos hatásai (+1 per 3 szint, max +5)

note: Nem gépesített a webapp-ban (szituációs módosítók KM döntés).
      Konstans +10 a konstansok.yaml-ban → aura.mágiaellenállás_konstans
```

### §34.2 Mágia akarata

```
source: 103_04_magia_akarata.md

formula:
  Mágia_akarata = Aura + k20 + módosítók

módosítók:
  + Aurakiterjesztés távolság levonás (0 / -3 / -6 / -9 / -15)
  + Auraerősítés formula bónusz (+1..+15, Aurahangolás próba, Komplexitás-függő)
  + Metódus 3. foka: +2
  + Szituáció/összhang (Előny-Hátrány skála)
  + Képzettségek másodlagos hatásai (+1 per 3 szint, max +5)

note: Nem gépesített a webapp-ban (harci/varázslási szituáció, dobás).
```

### §34.3 Aurapárbaj

```
source: 103_05_auraparbaj.md

formula:
  Mágia_akarata (dobás) >= ME (célpont) → varázslat átjut

Auraerősítés rontás:
  Aktuális Aura -= bónusz_érték (amit próbált)
  Regeneráció: 1 Aura pont / óra

Aurabontás (Aurahangolás formula):
  -2 Aura pont / sikeres alkalmazás
  Visszanyerés: 1 / óra (magától) VAGY Aurahangolás próba (kockázatos)

note: Nem gépesített (dobás-alapú, harci szituáció).
```

---

## §35 Misztikus fül — webapp

```
Képzettség szekciók (misztikus csoport átkerült a Tul/Képz fülről):
  1. Tradíció — max 1 db, kétlépéses picker (tradiciok.json, altípus ha van pl. Szakrális→istenség)
  2. Arkánumok — több felvehető (kepzettsegDefs: "Arkánum:*"), picker disabled ha nincs Tradíció
     Tradíció nélkül: nevek piros, picker "⚠ Tradíció szükséges"
  3. Faj misztérium — 1 db, automatikusan a karakter faj nevéhez kötött, nem törölhető, min szint: 0
  4. Ősi nyelv ismerete — többször felvehető, free-text popup (név megadás)
  5. Misztikus fortélyok — a Fortélyok fülről ide áthelyezve (csoport "misztikus")
     Felvétel: közös FortélyFelvétel wizard (FortelyFelvetel.tsx)
     - Többszörös + fix lista (Belső/Külső síkok): lista picker → közvetlen felvétel
     - Többszörös + free-text (Mentálfonál): free-text input → Kiérdemelt ha kiérdemelhető=true
     - Nem többszörös: közvetlen felvétel + fok picker (ha maxfok > 1)
     Fok módosítás: koppintás a sorra → fok popup (ha maxfok > 1), egyébként "1 fok a maximum" hint
     Pöttyök: 3 pozíció (balról töltve, mint Fortélyok fülön)
     ABC rendezés (hu locale)

Kijelzett értékek (felső sor):
  Mágiaellenállás = Aura + konstansok.aura.mágiaellenállás_konstans (10)
  Mágia akarata = Aura + k20 (kijelzés: "{Aura} + k20")
  Aura = reactive engine (§34)

Szint választó: overlay popup (0/1-15 grid), mint Tul/Képz fülön
Szint limit: primer max = tsz (piros jelzés ha túllépés)

Game módban: csak azok a szekciók látszanak amikben van felvett elem (szint > 0)
```

## §35b Fortély schema mezők

```
Fortély yaml séma (data/schemas/fortely.yaml) — releváns generált mezők a fortelyok.json-ban:
  név, csoport, maxfok, session_toggle, emlékeztető, kiérdemelhető,
  kp_perfok, ingyenes_perszint, többszörös_típus, többszörös_lista,
  leírás, kiterjeszti_normál, kiterjeszti_erős, fokok[]

  kiérdemelhető: boolean — ha true, a felvételi wizard-ban választható a "⭐ Kiérdemelt" opció
    true: szabad (mind), kiemelt (mind), misztikus: Mentálfonál
    false: harci, távharc, általános, érzékek, misztikus (többi)

  todo mező: TÖRÖLVE a schemából (2 fortélynál maradt nem-üres: alakzatharc, antissjaras)
```

## §36 Harci képzettségek — Harcértékek fül

```
A "Harcmodorok" read-only szekció helyett szerkeszthető "Harci képzettségek" szekció.
Képzettség lista: kepzettsegDefs csoport="harci" többszörös altípusokkal kibontva.
  Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc (Harcmodor többszörös)
  Hajítás, Íjászat, Lövészet, Ostromlövészet, Mágikus célzás (Távolsági harcmodor többszörös)
  Alakzatharc, Harci láz (önálló)

UI: név (flex:1) + szint (kep-szint class, limit jelzés) + −/+ gombok + ✕ (megerősítő popup)
  Min szint: 1 (−gomb disabled), Max: 15 (+gomb disabled)
  Szint > tsz: piros (kep-over)
  Dropdown: "+ Harci képzettség..." (nem felvettek)

Átkerült a Tul/Képz fülről: "harci" csoport kiszűrve a CSOPORT_SORREND-ből.
```

---

## §37 Próbadobások és Célszámok

Forrás: md/010_05_04_tulajdonsagproba.md, md/030_06_01_kepzettsegproba.md

### 37.1 Tulajdonságpróba

```
Tulajdonság + k6  vs  Célszám

Célszámok:
  3: Könnyű
  4: Átlagos
  5: Nehéz
  6: Nagyon nehéz
  7: Rendkívül nehéz
  8: Emberfeletti

Siker/Kudarc mérték: ±3 különbség = kiemelt eredmény
Előny/Hátrány: [-2; +2] skála (Státuszokból)
```

### 37.2 Képzettségpróba

```
Tulajdonság + Képzettség szint + k10  vs  Célszám

Célszámok:
   6: Könnyű
   9: Átlagos
  12: Nehéz
  15: Nagyon nehéz
  18: Rendkívül nehéz
  21: Emberfeletti
  30: Maximum

Lépésköz: 3 (fokozatonként)
Siker/Kudarc mérték: ±6 különbség (2 fokozat) = kiemelt eredmény
Előny/Hátrány: [-2; +2] skála (Státuszokból)
```

### 37.3 Próba képzetlenül

```
Célszám emelés: +3 (ha képzettség szint = 0)
Fizikai képzettségeknél: nincs büntetés
```

### 37.4 Vállalás (képzettségpróba)

```
Bónusz a próbára: +1..+3 (játékos választ)
Kritikus hiba próba: k6 vs vállalás_érték
  Ha dobás ≤ vállalás_érték → Kritikus hiba

Megkötés: vállalás ≤ képzettség szint
Összetett próbánál nem alkalmazható.
```

### 37.5 Összetett próba (mindkét típus)

```
Elsődleges: maximális nehézség célszám
Másodlagos: 1 fokozattal alacsonyabb (Tulajdonság: -1, Képzettség: -3)
Lépcsőzetes: max 2 fokozattal alacsonyabb is dobatható

Dobások száma: KM döntés (feladat hossza alapján)
```

### 37.6 Helyettesítés (képzettségpróba)

```
Helyettesítő képzettség szint / 3  (lefelé kerekítve)
Max helyettesítő érték: 5
Nem adódik hozzá — kiváltja az elsődleges képzettséget.
```
