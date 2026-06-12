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
      Módok: flat, scaled, override, enyhít
        - "enyhít": Hatás pool-ban csökkenti a célra vonatkozó negatív hatás fokát (§22.7)
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

## 21. Aktív fül — Taktikák, Helyzetek, Szituációk, Manőverek

Az Aktív fülön választható elemek és módosítóik összefoglalása.
A feltételes fortély módosítók (§16) ezekhez kötődnek: `feltétel: "taktika:roham"` stb.

### Implementációs illeszkedés

Adatforrások (YAML → JSON generálás: `generate_tables.py` → `generate_aktiv_ful()`):
- `data/sources/taktikak.yaml` → `tables/taktikak.json` (13 taktika: módosítók, fokok, kombó szabályok)
- `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (13 helyzet: feltétel_kulcs, infó)
- `data/sources/szituaciok.yaml` → `tables/szituaciok.json` (9 szituáció: feltétel_kulcs, infó)
- `data/sources/manoverek.yaml` → `tables/manoverek.json` (34 manőver: nehézség, fázisok, hatás)

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
| 1 támadás | TÉ:+3 (több-tám levonás nem érvényesül) | minden más | Roham, Ö.roham, Plusz tám, Teljes Véd |
| Érintő | TÉ:+3, sebzés:0 | Támadó, Védő, Kezdeményező, Kiváró | más |
| Fárasztás | VÉ csökk: 2/kör (+fortély+pengeelőny) | — (nem támad) | más |
| Kezdeményező | KÉ:+1..+5, VÉ:-1..-5 | Támadó, Érintő, Visszafogott | más |
| Kiváró | KÉ:átengedett, TÉ:+2 (visszacsapás) | Támadó, Érintő, Visszafogott, Tám.erőből | más |
| Öngyilkos roham | TÉ:+5, VÉ:-10, SP:+7, VÉcsökk 2x | — | más (max 1x/küzdelem) |
| Plusz támadás | +1 támadás, VÉ:-3 azonnal | Támadó, Érintő, Tám.erőből | más |
| Roham | TÉ:+4, VÉ:-8, SP:+5, VÉcsökk 2x | — | más |
| Támadás erőből | TÉ:-1..-2, SP:+1..+2 | Kiváró | más |
| Támadó | TÉ:+1..+3, VÉ:-2..-6 | Kezdeményező, Kiváró | más |
| Védő | VÉ:+1..+4, TÉ:-2..-8 | — | más |
| Teljes Védekezés | VÉ:+6, nem támad, hátrál | — | más |
| Visszafogott | TÉ:-3/-6/-9, sebzéskocka: k10/k6/— | Kezdeményező, Kiváró | más |

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
| Készületlenség | `harci_helyzet:készületlenség` | 065_01_03 (= Meglepetés) |
| Beszorított helyzet | `harci_helyzet:beszorított` | 065_01_03 |
| Orvtámadás | `harci_helyzet:orvtámadás` | 065_01_03 |
| Hátulról támadás | `harci_helyzet:hátulról` | 065_01_03 |
| Közrefogás | `harci_helyzet:közrefogás` | 065_01_03 |
| Levegőből támadás | `harci_helyzet:levegőből` | 065_01_03 |
| Magasabbról | `harci_helyzet:magasabbról` | 065_01_03 |
| Védekező takarásban | `harci_helyzet:takarásban` | 065_01_03 |
| Pengeelőny | `harci_helyzet:pengeelőny` | 065_01_04 |
| Pengehátrány | `harci_helyzet:pengehátrány` | 065_01_04 |

note: A webapp Aktív fülön ezek toggle-ök. A pontos hatásaikat a karakterlap NEM kalkulálja
      automatikusan (túl komplex: Előny/Hátrány dobásra, támadás elvesztés, stb.).
      Funkciójuk az Aktív fülön: feltételes fortély módosítók dispatch-éhez (§16) + informatív jelzés.

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
| Célzás                 | `szituáció:célzás`                 | távharc               |

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
      Kivétel: fortélyok amik manőver bónuszt adnak (pl. Harci akrobatika → manőver:kibontakozás +1/+3).
      Belharcos manőverek: Belharci szituáció szükséges (kivéve Belharcba kerülés).

---

## §22 Státuszok és Hatások

Forrás: md/080_hatasok_es_statuszok.md, md/081_hatasok.md, md/082_statuszok.md

### 22.1 Modell (3 réteg)

| Réteg | Fájl | Leírás |
|-------|------|--------|
| **Hatás operátorok** | `hatasok.yaml` | A hatás mechanika típusai (7 db) |
| **Események/Célpontok** | `esemenyek.yaml` | Amire hatások vonatkozhatnak (21 db) |
| **Státuszok** | `statuszok.yaml` | Állapotok fokozatokkal, strukturált hatáslistával (19 db) |

A Státuszok hatásai strukturáltak és gépileg kumulálhatók a Hatás poolba.
A webapp feladata: informatív kijelzés + jövőbeli Hatás pool aggregálás.

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
