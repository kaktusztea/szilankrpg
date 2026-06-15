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
                    // kivéve: kiérdemelt fortélyok (kiérdemelt=true → 0 KP)
                    // kivéve: szabad fortélyok ingyenes kerete (első TSz db → 0 KP)
                    // kivéve: ingyenes_perszint > 0 fortélyok (Kultúrkör, Helyismeret → 0 KP)
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
        szituáció, harci_helyzet, taktika, fegyver, fegyver_kategória, manőver, státusz
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
    cél_VÉ = szorzó x cella
  else:
    cél_VÉ = cella - ABS(szorzó)    // szorzó 0 vagy negatív: kivonás (VÉ csökken)

output: cél_VÉ
note: Találati esély = CÉ + k20 >= cél_VÉ
      Százalékban: MAX(0, MIN(100, ((21 - (cél_VÉ - CÉ)) / 20) x 100))
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

## 21. Aktív fül — Taktikák, Manőverek, Helyzetek, Szituációk

Az Aktív fülön választható elemek és módosítóik összefoglalása.
UI szekció sorrend: Taktikák → Manőver → Harci helyzetek → Státuszok → Szituációk → Narratív.
A feltételes fortély módosítók (§16) ezekhez kötődnek: `feltétel: "taktika:roham"` stb.

### Implementációs illeszkedés

Adatforrások (YAML → JSON generálás: `generate_tables.py` → `generate_aktiv_ful()`):
- `data/sources/taktikak.yaml` → `tables/taktikak.json` (14 taktika: módosítók, fokok, kombó szabályok)
- `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (29 helyzet: id, infó, hatások)
- `data/sources/szituaciok.yaml` → `tables/szituaciok.json` (7 szituáció: id, infó)
- `data/sources/manoverek.yaml` → `tables/manoverek.json` (34 manőver: id, nehézség, fázisok, hatás)

ID és feltétel_kulcs konvenció:
- YAML-ban: csak `id` mező (snake_case, ékezetes, source of truth)
- JSON-ban: `id` + `feltétel_kulcs` (generált: `"{prefix}:{id}"`)
- Prefixek: taktika → `"taktika:{id}"`, harci_helyzet → `"harci_helyzet:{id}"`, szituáció → `"szituáció:{id}"`
- Manőverek: `id` mező (referencia fortély módosítók `manőver:{id}` céljához)
- Validáció: id egyediség + fortély `manőver:X` → manőver id referenciális ellenőrzés (build-time)

Taktika kombó logika (`kombó_mód` + `kombó_lista`):
- `"whitelist"` + lista: CSAK ezekkel kombinálható (üres = semmivel)
- `"blacklist"` + lista: mindennel KIVÉVE ezeket

Fokozatos taktikák: `fokozatos: true` → `fokok[]` tömb (pl. Támadó fok:1..3, mindegyik más TÉ/VÉ)

Session state bővítés (types.ts Session interface):
- `aktív_taktikák: { név: string, fok?: number }[]` (több kombó, fokozatos taktikáknál fok)
- `aktív_helyzetek: string[]` (több helyzet egyszerre)
- `aktív_szituációk: string[]` (új mező)
- `aktív_manőver: string` (max 1, marad)

Kalkuláció két rétege:
1. **Taktika módosítók** — direkt numerikus: TÉ/VÉ/KÉ/SP módosítók a Harc fülön számolva
   (hasonlóan a fortélyMod_* context mezőkhöz, pl. `taktikaMod_TÉ`, `taktikaMod_VÉ`)
2. **§16 feltételes fortély módosítók** — a HarcScreen fortély loop-jában a `mod.feltétel` check:
   `feltétel.split(':')` → prefix (taktika/harci_helyzet/szituáció/fegyver) → session tömbben keresés

Harci helyzetek: NEM kalkuláltak (komplex hatások) — informatív jelzés (infó mező) + §16 feltétel dispatch.
Manőverek: NEM adnak statikus módosítókat — informatív (nehézség, fázisok, hatás megjelenítés).

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
| Támadás erőből | TÉ:-1..-2, SP:+1..+2 | Kiváró, Plusz tám, 1 tám | más |
| Támadó | TÉ:+1..+3, VÉ:-2..-6 | Kezdeményező, Kiváró, Érintő, Plusz tám, 1 tám | más |
| Védő | VÉ:+1..+4, TÉ:-2..-8 | Érintő, 1 tám | más |
| Teljes Védekezés | VÉ:+6, nem támad, hátrál | — | más |
| Visszafogott | TÉ:-3/-6/-9, Hátrány-1/-2/— sebzésdobás | Kezdeményező, Kiváró, 1 tám | más |
| Tettetés | — (informatív) | — | más |

note: "Választható" értékek (pl. Támadó TÉ:+1..+3) → a játékos az Aktív fülön megadja a fokozatot.
      Roham/Ö.roham: csak az első oda-vissza csapásra érvényes.
      Fárasztás: nem támadás, nem kombinálható mással.

### 21.2 Harci Helyzetek

Harci helyzetek speciális Státuszok, amelyek Hatásokat okoznak (080_hatasok_es_statuszok.md).
Feltétel kulcs: `harci_helyzet:név`. Az Aktív fülön kiválaszthatók (toggle lista).

A helyzetek NEM egyszerű numerikus módosítók — komplex hatáscsomagok (Előny/Hátrány dobásra,
támadás elvesztés, VÉ csökkentés, pajzs feltételek, stb.). Részletes leírás: 065_01_*.md.

| Helyzet | feltétel kulcs | Hivatkozott szabály |
|---------|---------------|---------------------|
| Belharci szituáció | `harci_helyzet:belharci_szituáció` | 065_01_01 |
| Fegyverrántás váratlanul | `harci_helyzet:fegyverrántás` | 065_01_02 |
| Meglepetés | `harci_helyzet:meglepetés` | 065_01_03 |
| Készületlenség | `harci_helyzet:készületlenség` | 065_01_03 |
| Beszorított helyzet | `harci_helyzet:beszorított` | 065_01_03 |
| Orvtámadás | `harci_helyzet:orvtámadás` | 065_01_03 |
| Hátulról támadás | `harci_helyzet:hátulról` | 065_01_03 |
| Közrefogás | `harci_helyzet:közrefogás` | 065_01_03 |
| Levegőből támadás | `harci_helyzet:levegőből` | 065_01_03 |
| Magasabbról | `harci_helyzet:magasabbról` | 065_01_03 |
| Védekező takarásban | `harci_helyzet:takarásban` | 065_01_03 |
| Védő Érték kiterjesztése másra | `harci_helyzet:vé_kiterjesztés` | 065_01_03 |
| Pengeelőny | `harci_helyzet:pengeelőny` | 065_01_04 |
| Pengehátrány | `harci_helyzet:pengehátrány` | 065_01_04 |
| Hajítás alkalmatlan fegyverrel | `harci_helyzet:hajítás_alkalmatlan_fegyverrel` | 065_01_04 |
| Hajítás nem dobásra készített tárgyakkal | `harci_helyzet:hajítás_nem_dobásra_készített` | 065_01_04 |
| Képzetlen fegyverhasználat | `harci_helyzet:képzetlen_fegyverhasználat` | 065_01_04 (automatikus: harcmodor<3) |
| Pusztakezes harc | `harci_helyzet:pusztakezes_harc` | 065_01_04 (automatikus: fegyver=puszta kéz) |
| Rosszabbik kézben tartott fegyver | `harci_helyzet:rosszabbik_kéz` | 065_01_04 |
| Csúszós talaj | `harci_helyzet:csúszós_talaj` | 065_01_05 |
| Elvesztett egyensúly | `harci_helyzet:elvesztett_egyensúly` | 065_01_05 |
| Földön fekve | `harci_helyzet:földön_fekve` | 065_01_05 |
| Helyhez kötve | `harci_helyzet:helyhez_kötve` | 065_01_05 |
| Láthatatlanul | `harci_helyzet:láthatatlanul` | 065_01_05 |
| Tűz ruhán | `harci_helyzet:tűz_ruhán` | 065_01_05 |
| Sötétben | `harci_helyzet:sötétben` | 065_01_05 |
| Vér elvakít | `harci_helyzet:vér_elvakít` | 065_01_05 |
| Lények méret különbsége | `harci_helyzet:méret_különbség` | 065_01_05 (paraméteres: 0-6 fokozat) |
| Vadállatok elleni harc | `harci_helyzet:vadállatok` | 065_01_05 (informatív) |

note: A webapp Aktív fülön ezek toggle-ök. A pontos hatásaikat a karakterlap NEM kalkulálja
      automatikusan (túl komplex: Előny/Hátrány dobásra, támadás elvesztés, stb.).
      Funkciójuk az Aktív fülön: feltételes fortély módosítók dispatch-éhez (§16) + informatív jelzés.
      Kategóriák: Harci pozíciók (065_01_03), Fegyver helyzetek (065_01_04), Fizikai/környezeti (065_01_05).
      Nem toggle-ök (automatikus/levezetett): Képzetlen fegyverhasználat, Pusztakezes harc.
      Nem az Aktív fülre (Sebzéstípusok, Fegyverméret): csak a Pengeelőny/Pengehátrány releváns, a többi szabály.
      Fokozatos helyzetek (alszekciók a doksiban): Láthatatlanul (hallható/csendes), Sötétben (félhomály/teljes+zaj/teljes+csend), Tűz ruhán (ég/lángol).

### 21.3 Szituációk

Általános szituációk amik a harc kontextusát adják.

| Szituáció              | feltétel kulcs                     | Megjegyzés            |
| ---------------------- | ---------------------------------- | --------------------- |
| Lovas harc             | `szituáció:lovas_harc`             | lóhátról              |
| Léglovas harc          | `szituáció:léglovas_harc`          | repülő hátasról       |
| Harci szekér           | `szituáció:harci_szekér`           | szekérről             |
| Páros harc             | `szituáció:páros_harc`             | koordinált 2 fős harc |
| Közönség előtt         | `szituáció:közönség_előtt`         | gladiátor             |
| Szörnyeteg elleni harc | `szituáció:szörnyeteg_elleni_harc` | bestia                |
| Célzás                 | `szituáció:célzás`                 | távharc               |

note: "Kétkezes harc" és "Merevvért 70%" eltávolítva a szituáció dropdown-ból — automatikusan kezeltek
      (session.kétkezes_harc toggle ill. kalkulált feltétel a fortély módosítóban).

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
| Belharcba kerülés       | 9 (háttal:5)    | M,E     | Közelharc, belharcos fegyver | Belharci szituáció         |
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
      Belharcos manőverek: Belharci szituáció szükséges (kivéve Belharcba kerülés).

---

## §22 Státuszok és Hatások

Forrás: md/080_hatasok_es_statuszok.md, md/081_hatasok.md, md/082_statuszok.md

### 22.1 Modell (3 réteg)

| Réteg | Fájl | Leírás |
|-------|------|--------|
| **Hatás operátorok** | `hatasok.yaml` | A hatás mechanika típusai (8 db) |
| **Események/Célpontok** | `esemenyek.yaml` | Amire hatások vonatkozhatnak (21 db) |
| **Státuszok** | `statuszok.yaml` | Állapotok fokozatokkal, strukturált hatáslistával (19 db) |

A Státuszok hatásai strukturáltak és gépileg kumulálhatók a Hatás poolba.
A webapp feladata: informatív kijelzés + Hatás pool aggregálás (implementálva: AktivScreen).

### 22.2 Hatás operátorok (hatasok.yaml)

```yaml
hatás_operátorok:
  - id: "előny"         # mód: előny_hátrány — kocka reroll
  - id: "hátrány"       # mód: előny_hátrány — kocka reroll
  - id: "arányos"       # mód: szorzó — pl. 0.5 = feleződik
  - id: "duplázás"      # mód: szorzó — pl. 2 = duplázódik
  - id: "letilt"        # mód: letilt — boolean (képesség elvesztés, aut. kudarc)
  - id: "max_limit"     # mód: max_limit — felső korlát (pl. max 1 támadás)
  - id: "szöveges"      # mód: szöveges — nem kumulálható, csak informatív
  - id: "enyhít"        # mód: enyhít — csökkenti másik hatás fokát (fortélyokból)
```

### 22.3 Események/Célpontok (esemenyek.yaml)

```yaml
események:
  # harci: ké_dobás, té_dobás, cé_dobás, manőver_ellenpróba, sebzésdobás, támadások_száma, vé_veszteség
  # próba: tulajdonságpróba, képzettségpróba, szociális_próba, szellemi_próba, fizikai_próba, érzék_próba, mágiaellenállás, mágia_akarata
  # fizikai: mozgás, beszéd
  # képesség: harci_képesség, varázslás, pszi, antyssjárás
```

### 22.4 Státusz struktúra (statuszok.yaml)

```yaml
státuszok:
  - név: "Blokkolt"
    kategória: "mágikus"          # fizikai | szellemi | mágikus
    fokok:
      - fok: 1
        alcím: "Közepesen"
        hatások:                   # strukturált lista: operátor + érték + cél
          - { hatás: "hátrány", érték: -1, cél: "té_dobás" }
          - { hatás: "arányos", érték: 0.5, cél: "mozgás" }
      - fok: 2
        alcím: "Erősen"
        hatások:
          - { hatás: "hátrány", érték: -2, cél: "té_dobás" }
          - { hatás: "arányos", érték: 0.5, cél: "mozgás" }
```

Hatás objektum mezői:
- `hatás`: operátor id (kötelező, hatasok.yaml-ból)
- `érték`: szám (opcionális, operátor-függő)
- `cél`: esemény id (kötelező, esemenyek.yaml-ból)
- `megjegyzés`: string (opcionális, kontextuális kiegészítés)

### 22.5 Session

`session.aktív_státuszok: string[]` — formátum: `"Státusznév (fok)"`, pl. `"Félelem (2)"`

### 22.6 Webapp megjelenítés

- Aktív fülön: dropdown-ból választható (státusz név + fok + alcím)
- Chip megjelenítés: "Félelem (2) - Rettegés" + ✕ törlés
- Koppintás (Game mód): hatások listája lenyílik (accordion)

### 22.7 Hatás pool (Aktív fül)

Az aktív státuszokból cél szerint kumulált hatás összesítő:
1. Összegyűjtjük az aktív státuszok fokainak `hatások[]` listáit
2. Cél (`esemény id`) szerint csoportosítunk
3. Kumulálás mód szerint:
   - `előny_hátrány`: összegez, clamp [-2, +2]
   - `szorzó` (arányos/duplázás): szorzók alkalmazása
   - `letilt`: boolean — ha egyszer aktív, aktív
   - `max_limit`: legkisebb max érvényesül
   - `szöveges`: csak informatív megjelenítés
4. A pool informatív — a KM alkalmazza

### 22.8 Validáció (build-time)

- `validate_hatasok()`: operátor id egyediség, kötelező mezők, mód enum
- `validate_esemenyek()`: esemény id egyediség, kötelező mezők, csoport enum
- `validate_statuszok()`: referenciális integritás (hatás → operátor id, cél → esemény id)

note: `státusz:` feltétel prefix → §16 feltételes fortély módosítók aktiválása (jövőbeli).


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
Az aktív taktikák/helyzetek/szituációk `feltétel_kulcs` értékéből épül az `aktívFeltételek` Set.

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
| Mesterfegyver | 1 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 4 | |
| Mesterfegyver | 2 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 8 | |
| Mesterfegyver | 3 | képzettség | [Közelharc, Kardvívás, Rombolás, Lándzsavívás, Ostorharc] | 12 | |
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

| Kétkezes harc fok | TÉ/VÉ | Mesterfegyver | Megjegyzés |
|---|---|---|---|
| Alapeset (0. fok) | Csak nagyobb fegyver értékei. Kisebb=0. Hátrány-1 TÉ dobásra | Nem számít | Harckeret: +1 |
| 1. fok | Mindkét fegyver TÉ/VÉ összeadódik | Nem számít | Harckeret: +2 |
| 2. fok | Mindkét fegyver TÉ/VÉ összeadódik | Csak nagyobb fegyveré | Harckeret: +3 |
| 3. fok | Mindkét fegyver TÉ/VÉ összeadódik | Mindkettőé | Harckeret: +4 |

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
  // Fortély bónusz
  kh_bónusz = Kétkezes_harc_fok + 1  // 0.fok: +1, 1.fok: +2, 2.fok: +3, 3.fok: +4
  if Kétkezesség fortély ÉS Kétkezes harc ≥ 1.fok:
    kh_bónusz += 1

  // Pengelevonás: a két fegyver tényleges pengehosszainak összege, osztva 0.5-tel
  sum_pengehossz = fegyver_jobb.pengehossz + fegyver_bal.pengehossz
  pengelevonás = FLOOR(sum_pengehossz / 0.5)

  kétkezes_harckeret = kh_bónusz - pengelevonás

note: A pengehossz a fegyverek.json-ból jön (0.5 egységekben, pl. tőr=0, rövidkard=0.5, szablya=1.5).
      "Rövid" fegyverek (penge < 0.5): 0-nak számítanak a pengeméret kalkulációhoz.
      A SUM Pengeméret (egész pengékben kerekítve) a Pengeelőny/hátrány rendszerhez kell — az más!
      Max SUM = 2 penge (ha összpenge > 2 → kétkezes harc nem végezhető az adott kombóval).
```

### 26.6 Sebzés

Mindig az ügyesebb kézben levő fegyver sebez (= jobb kéz fegyver, session.aktív_fegyver_index).
Kivétel: ha szándékosan a rosszabbik kézben lévővel támad (Hátrány-1 TÉ dobás Kétkezesség nélkül).

### 26.7 Session és UI

- `session.kétkezes_harc: boolean` — Aktív fül toggle (csak ha mindkét kézben fegyver ÉS összpenge ≤ limit)
- `session.aktív_fegyver_index` — jobb kéz fegyver
- `session.aktív_fegyver_bal_index` — bal kéz fegyver
- Aktív fül: toggle gomb, disabled+piros ha összpenge > limit. Fegyver dropdown-ok szűrik a túl nagy pengéjű opciókat.
- Aktív fül: mindkét kézben fegyver → "Pajzs kézben" disabled
- Harc fül: kétkezes harc aktív → összevont harcértékek megjelenítése (lila keret, normál sorok halványítva)
- Harc fül: Ph oszlop kétkezesnél: `x(y)` formátum (x=nagyobb fegyver penge, y=összpenge)

### 26.8 Fortély feltételek

A Kétkezes harc fortély módosítói (yaml) kalkulált feltétellel aktiválódnak:
```yaml
feltétel:
  - { forrás: "kétkezes_harc", operátor: "==", érték: true }
```

### 26.9 Kalkuláció összefoglalás

```
if session.kétkezes_harc:
  nagyobb_fegyver = fegyver[jobb] if fegyver[jobb].pengehossz >= fegyver[bal].pengehossz else fegyver[bal]
  kisebb_fegyver = a másik

  harcmodor_szint = lookup(nagyobb_fegyver.kategória → harcmodor képzettség szint)

  if kétkezes_harc_fok >= 1:
    TÉ = TÉ_alap + nagyobb_fegyver.TÉ + kisebb_fegyver.TÉ + harcmodor_bónusz.TÉ + HM_TÉ + MF_bónusz
    VÉ = VÉ_alap + nagyobb_fegyver.VÉ + kisebb_fegyver.VÉ + harcmodor_bónusz.VÉ + HM_VÉ + MF_bónusz
  else:
    TÉ = TÉ_alap + nagyobb_fegyver.TÉ + harcmodor_bónusz.TÉ + HM_TÉ  // kisebb=0, MF nem számít
    VÉ = VÉ_alap + nagyobb_fegyver.VÉ + harcmodor_bónusz.VÉ + HM_VÉ
    // + Hátrány-1 TÉ dobásra (Hatás pool)

  MF_bónusz (TÉ/VÉ/SP):
    if fok == 0: 0
    if fok == 1: 0 (MF nem számít)
    if fok == 2: lookup(MF_fok_nagyobb → mesterfegyver_bónuszok)  // TÉ+VÉ+SP
    if fok == 3: lookup(MF_fok_nagyobb) + lookup(MF_fok_kisebb)   // mindkettő TÉ+VÉ+SP

  SP = fegyver_jobb.SP + erőbónusz + MF_bónusz.SP  // az ügyesebb kéz (jobb) fegyvere sebez

  harckeret = alap_harckeret + kétkezes_harckeret  // lásd §26.5
  támadások = 1 + FLOOR(harckeret / nagyobb_fegyver.sebesség)  // nagyobb fegyver sebessége számít
```

## §27 Fegyverfogás (TERV)

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
  - Összpenge > konstansok.kétkezes_harc_max_pengeméret → "kétkezes" disabled

Bal kéz dropdown:
  - Csak "kétkezes" és "fegyver_hárító" fogásnál jelenik meg
  - "kétkezes": karakter fegyverek (pengelimit szűrt)
  - "fegyver_hárító": hárítófegyverek listája
```

### 27.3 Harcérték hatások fegyverfogásonként

```
Egyfegyveres:
  Standard kalkuláció (§7-§14). Nincs extra módosító.

Fegyver + pajzs:
  Már implementálva (§13): pajzsVÉ bónusz + TÉ büntetés (Pajzshasználat fok-függő).
  A pajzsVÉ a fegyver VÉ-jéhez adódik.

Fegyver + hárítófegyver (TODO):
  hárítóVÉ = hárítófegyver.VÉ (ha van "Hárítófegyver használat" fortély, else 0)
  hárítóMF_VÉ = MF_bónusz VÉ a hárítófegyverre (ha van MF a hárítóra)
  Fegyver VÉ += hárítóVÉ + hárítóMF_VÉ
  TÉ büntetés: nincs (a hárítófegyver nem TÉ büntetést ad, mint a pajzs)
  Támadások: nem növeli (hárítófegyverrel nem támadsz)

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

1. `session.fegyverfogás` mező hozzáadás (Session interface + DEFAULT_SESSION)
2. AktivScreen: Fegyverfogás picker (overlay popup, 4 opció, disabled logika)
3. AktivScreen: Bal kéz dropdown feltételes megjelenítés (csak kétkezes + hárító fogásnál)
4. AktivScreen: "2 kezes harc" és "Pajzs kézben" toggle gombok eltávolítás (beolvad a picker-be)
5. Fegyverek.json: `hárító: true` flag hárítófegyverekre (jelenleg nincsenek benne)
6. HarcScreen: Hárítófegyver VÉ bekötés (ha fegyverfogás == "fegyver_hárító")
7. karakter.yaml séma: `session.fegyverfogás` mező
8. validate_karakter.py: fegyverfogás enum validáció
