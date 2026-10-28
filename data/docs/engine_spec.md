# Engine Spec - Szilánk RPG Karakteralkotó kalkulációk

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
  kiemelt_kp      = SUM( ingyenes keret FELETTI kiemelt fortélyok fizetős KP-ja )   // impl: §41
  elköltött_kp    = kp_képzettségek + kp_fortélyok + kp_hm + kp_cm + kiemelt_kp

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
input:  karakter.fortélyok[] (kiemelt, KP-adó fortélyok, negatív kp_perfok-kal)
source: fortelyok.json (fortély kp_perfok mező)

formula:
  // TELJESEN ADATVEZÉRELT: a KP-t ADÓ fortélyok azok, amelyeknek kp_perfok < 0 (negatív).
  // A bónusz nagysága magából a fortély-adatból jön, NEM hardcode névlistából és NEM külön konstansból.
  kp_bónusz_fortélyok = [ f IN karakter.fortélyok WHERE kp_perfok(f.név) < 0 ]
  spec_kp = SUM( f.fok x ABS(kp_perfok(f.név)) )  FOR f IN kp_bónusz_fortélyok

output: spec_kp (primer célra is fordítható, hozzáadódik az összes_kp-hoz)
note: Negatív kp_perfok-ú (KP-adó) kiemelt fortélyok: Analfabéta (-6), Süketség (-12),
      Vakság (-18), Apró méretű lény (-18), Tartós sérültség (-6, maxfok 3 → fokonként +6).
      MIND a karakter.fortélyok[] tömbből, a kp_bónusz_fortélyok aggregátumon át számol
      (a Tartós sérültség is: a fortély foka adja a fok×6 bónuszt). ÚJ ilyen fortély felvételekor
      a spec_kp automatikusan számol vele - nincs kód/spec módosítás.
      KIVEZETVE (holtkód-tisztítás, l. refactorlog 2026-10-02):
        - a konstansok.kp_bónusz blokk (redundáns volt a fortély |kp_perfok|-kal);
        - a karakter.fortélyok_speciális mező (a tartós_sérülés_fok-ra sosem volt UI-setter,
          a Tartós sérültség KP-ja mindig a fortélyok[] ágon jött).
impl: reactive.ts → buildArrayContext 'kp_bónusz_fortélyok' (perFok < 0 szűrés),
      rules.json → spec_kp = sum(kp_bónusz_fortélyok, bónusz_kp).
```

---

## 2. Tulajdonság pontok

```
input:  karakter.tulajdonságok (mind a 8), karakter.tsz
source: konstansok.yaml → tulajdonság_pontok, arányok.tulajdonság_pont_alap

formula:
  keret = tulajdonság_pont_alap + FLOOR(tsz / 2)
  elköltött = SUM( lookup(tulajdonság_érték → tulajdonság_pontok) )  // mind a 8-ra
  maradék = keret - elköltött

output: tulajdonság_pont_keret, elköltött_tulajdonság_pont, maradék_tulajdonság_pont
note: 6 (26 pont) és 7 (33 pont) értékek csak faji/mágikus módosítóval érhetőek el
note: A FLOOR(tsz / 2) a rules.json-ban rögzített; a konstansok.yaml → arányok.tulajdonság_pont_tsz_bónusz (0.5)
      dokumentációs érték, a szabály NEM olvassa.
note: Tapasztalati szint tartomány: [arányok.min_tsz, arányok.max_tsz] = [3, 21].
      A kalandozás a 3. szinten kezdődik (1-2. szint = előtörténet). Forrás: konstansok.yaml → arányok.min_tsz / arányok.max_tsz.
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
  S4_max = ÉP        // triviális: maga az ÉP, NINCS rá külön reactive szabály

output: [S1_max, S2_max, S3_max]   // + S4_max = ÉP (nem számított szabály)
note: JK-nál ÉP mindig 4-gyel osztható. NJK-nál maradék balról jobbra osztandó.
      TÉ levonások → konstansok.yaml → egészség_kategória_levonás
      Reactive: rules.json CSAK S1_max, S2_max, S3_max szabályt tartalmaz. Az S4 felső határa = ÉP,
      ezért nincs külön szabály. A Sérült fok automatika (§33) oszlopMéret = ÉP/4 alapon dolgozik.
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
      A useHarcComputed.ts utólag adja hozzá: computed.KÉ + taktikaMods.KÉ + fortelyMods.KÉ.
      A fortelyMods tartalmazza az alapeset (0.fok) módosítókat is (evaluateAlapesetek → flat mód, aktív feltétel).
```

---

## 5. Támadó Érték (TÉ) - fegyverenként

```
note: Fegyver = EGY rekord a fegyverek_v2.json-ban, `módok[]` listával (aktoronként egy mód; a
      másfélkezes fegyvernél aktoronként egy "másfélkezes · 1 kézzel" mód is). A karakter példányban
      1 fegyver példány, a Harc fülön a módok jelennek meg. Az 1 kezes szabály (TÉ-2/VÉ-2, Átütés 0,
      Erőlimit max 2) a v2 mód-értékekbe beépítve (generátor: konstansok.yaml → egykezes_forgatás).
      A per-fegyver kalkuláció minden módra külön fut (fegyver-calc.ts → calcFegyverResults).

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
              + SUM( alapeset_módosítók(cél="TÉ", aktív feltétel) )   // §16.1, pl. Lovas harc 0.fok: -9

  TÉ_idea = ideaDelta(példány.idea, fegyver.idea_default).TÉ   // §5.1; default példány → 0

  TÉ = TÉ_alap + TÉ_harcmodor + TÉ_fegyver + TÉ_mesterfegyver + TÉ_fortély - merevvért_TÉ_büntetés (§12) + TÉ_idea

output: TÉ (per fegyver, per mód)
impl: rules.json → fegyver_TÉ (a TÉ_idea-t a calcFegyverResults adja hozzá utólag)
```

### 5.1 Fegyver Idea (Modell 2)

```
source: tables/fegyver_idea_tabla.json (Idea szint → TÉ/VÉ/SP; generátor-forrás: fegyverek/konstansok.yaml → idea)
formula:
  ideaDelta(példány_idea, idea_default) = IDEA[példány_idea] - IDEA[idea_default]   // TÉ, VÉ, SP külön
note: A v2 harcértékek a fegyver idea_default-ját (gyári példány) MÁR tartalmazzák; a felvett példány
      idea_default-ról indul, és csak az ettől való eltérés hat (sérülés lefelé, áldás felfelé).
impl: harc/shared.ts → ideaDelta(); bekötve: calcFegyverResults (§5-§8), ketkezes.ts (§26.8),
      távharc CÉ (§17).
```

---

## 6. Védő Érték (VÉ) - fegyverenként

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
              + SUM( alapeset_módosítók(cél="VÉ", aktív feltétel) )   // §16.1, pl. Lovas harc 0.fok: -9

  VÉ_idea = ideaDelta(példány.idea, fegyver.idea_default).VÉ

  VÉ = VÉ_alap + VÉ_harcmodor + VÉ_fegyver + VÉ_mesterfegyver + VÉ_fortély + VÉ_idea

output: VÉ (per fegyver, per mód)
note: A végső VÉ-hez hozzáadódik a pajzs VÉ bónusz (lásd §13) ha session.aktív_pajzs = true.
      Pajzs VÉ: a konstansok.pajzs_hatások 2D táblából (méret × Pajzshasználat fok), lásd §13.
      Alap (fok 0) VÉ: kis 3, közepes 10, nagy 16.
      A Teljes harcértékek táblázatban a VÉ = fegyver VÉ + pajzs VÉ (ha aktív).
```

---

## 7. Célzó Érték (CÉ) - fegyverenként

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
note: Mágikus kategóriájú fegyverekre (Mágiatáv I–IV) eltérő formula - lásd §17.1.
      Távfegyver Idea: a per-fegyver karakter.távfegyverek[].idea delta a CÉ-be (§17).
```

---

## 8. Sebzés Pont (SP) - fegyverenként

```
input:  fegyver.SP, mesterfegyver_fok (adott fegyverre),
        karakter.tulajdonságok.erő, fegyver.erőbónusz_limit
source: konstansok.yaml → mesterfegyver_bónuszok

formula:  // ismételve minden egyes fegyverre
  erőbónusz = FLOOR( MIN(erő, fegyver.erőbónusz_limit) × (1 + fortelyMods.SP_erőbónusz_arány) )
              // limit=0 → nincs erőbónusz; 99 = korlátlan; az arány a `scaled` + `forrás: erőbónusz`
              // fortély-módosítókból (§16), pl. Taktikafókusz: Roham → ×2
  SP_mesterfegyver = lookup(mesterfegyver_fok → mesterfegyver_bónuszok).SP
  SP_fortély = SUM( fortély_módosítók(cél="SP", feltétel="") )

  SP_idea = ideaDelta(példány.idea, fegyver.idea_default).SP

  SP = fegyver.SP + erőbónusz + SP_mesterfegyver + SP_fortély + SP_idea

output: SP (per fegyver, per mód)
note: fegyver.SP és fegyver.erőbónusz_limit a mód `SP` / `Erőlimit` mezője (§5 módok[]).
      A sebzésjelleg (zúzó / szúró / vágó-egyenes / vágó-íves) a mód `jelleg` mezője, nem számítás.
      SP override: ha egy fortély `mód: "override"` + `cél: "SP"` + `feltétel: "fegyver:X"` módosítót tartalmaz,
        az felülírja az adott fegyver alap SP-jét (pl. Természetes fegyver → puszta kéz SP override).
        Implementáció: `fegyver-calc.ts → calcFegyverResults()` - pre-loop SP felülírás a reactive rule input előtt.

Sebzésjelleg × ellenfél páncél SP-delta (dobásonként, NEM statikus fegyver-SP):
  A fenti SP a statikus, ellenfél-független érték. A tényleges sebzésnél (Sebzés popup, Játék mód)
  az aktív mód sebzésjellege (`jelleg`) és a választott ellenfél páncélosztály
  (csupasz/puha/bőr/lánc/merev) egy 2D mátrixból ad SP-deltát:
    forrás: `data/tables/sebzesjelleg_pancel_matrix.json` (source: sebzesjelleg_pancel_matrix.yaml)
  Ezen felül a `cél_páncél` extrák SP-hatású ága ad delta-t (pl. `panceltalant_jobban_sebez`
  +3 SP vérttelen célon), forrás: `data/tables/fegyver_extrak.json`.
  Az "Ellenfél páncél" választó a Sebzés popupban KÖTELEZŐ (l. gui_spec). A cél_páncél
  VÉ/SFÉ-hatású ága (Meneth, Béltépő) az egységes "Extrák" gombon át jelenik meg
  (aktív/inaktív/KM státusz + hatás-összefoglaló, numerikus VÉ/SFÉ-alkalmazás nélkül - l. DEVSTATE §42).

Szabálykönyvi sebzés-mechanikák (md/064_02_07_sebzes.md):
  // Ezek a szabálykönyvben rögzített sebzés-kiegészítések. A statikus SP (fenti képlet) ezektől független.

  (a) Támadó dobás k20 → Sebzésdobás Előny:
        TÉ-dobás k20 értéke     Hatás a Sebzésdobásra
        1-15                    nincs extra
        16-19                   Előny+1
        20                      Előny+2
      A kimagasló Támadó dobás tehát a RÁKÖVETKEZŐ Sebzésdobásnak ad kocka-Előnyt.
      Engine-állapot: a `combat-roll-info.ts` jelenleg a helyzet/taktika/státusz/fortély eredetű
      Előny/Hátrányt gyűjti; a TÉ-dobás k20 → Sebzés Előny láncot a Sebzés popup kezeli manuális/auto
      k20 átvételekor (l. gui_spec Sebzés popup).

  (b) Sebzés bónuszok:
        Többszörös találat: +5 túldobás (a TÉ túllépi a VÉ-t ennyivel) → +3 SP
        Roham: +5 SP

  (c) Fegyver Erő-követelmény (md/064_02_06): ha a karakter Ereje < fegyver súly-kategóriájának
      erő_követelménye, Hátrány-N a Támadó (TÉ) dobásra. N = konstansok.yaml → fegyver_erő_követelmény_hátrány (= -1).
      Súlykategória → erő_követelmény: könnyű/átlagos → nincs; nehéz → Erő 2; súlyos → Erő 3.
      Impl: combat-roll-info.ts → collectDobásInfo (aktívFegyver.erő_követelmény ellenőrzés).
```

---

## 9. Harckeret (támadások száma) - fegyverenként

```
input:  fegyver.sebesség, harcmodor_szint (a fegyver kategóriájához tartozó),
        karakter.tulajdonságok.gyorsaság, páncél_MGT (§11; a Felszerelés NEM MGT, l. §15),
        fortély módosítók (cél: "harckeret")
source: rules.json (fegyver_harckeret, fegyver_támadások)

formula (egyfegyveres):
  harckeret = harcmodor_szint + gyorsaság - páncél_MGT + fortelyMods['harckeret']
  harckeret = MAX(0, harckeret)

  plusz_támadások = FLOOR(harckeret / fegyver.sebesség)
  össz_támadás = 1 + plusz_támadások

fortelyMods['harckeret'] összegzése (§16):
  Harckeret növelés fortély: +1/+2/+3 (mindig aktív)
  Kétkezes harc fortély: +2/+3/+4 (feltétel: fegyverfogás:kétkezes → egyfegyveresnél NEM számít)
  Kétkezesség fortély: +1 (feltétel: session.kétkezes_harc == true → egyfegyveresnél NEM számít)

formula (kétkezes harc):
  harckeret = harcmodor_szint + gyorsaság + fortelyMods['harckeret'] + kh_alap - fegyverlevonás
  kh_alap = konstansok.kétkezes_harc_bónuszok[0].harckeret (+1) HA nincs Kétkezes harc fortély, egyébként 0
  fegyverlevonás = FLOOR(sum_fegyverhossz / kétkezes_harc_fegyverlevonás_osztó)
  Részletek: §26.5

output: össz_támadás (támadások száma / kör)
note: Ha össz_támadás >= 2, minden támadásra TÉ:-3 levonás jár (az elsőre is).
impl: páncél_MGT a reactive engine `páncél_MGT` szabályából jön.
      A `fegyver_harckeret` reactive rule használja inputként (egyfegyveres).
      Kétkezes harc: saját kalkuláció (`engine/ketkezes.ts`, §26).
      Harc fül Tám cella: kattintásra info popup (fegyver név, sebesség, harckeret).
      Moduláris harc kalkuláció:
        - `harc/fegyver-calc.ts` - buildFegyverRows, calcFegyverResults, applyFegyverOverrides, calcKetkezes
        - `harc/taktika-calc.ts` - calcTaktikaMods
        - `harc/pancel-calc.ts` - buildPancelLookups, calcFogas, calcFtEnyhites
        - `harc/useHarcComputed.ts` - hook: context build + evaluate + feltétel dispatch
        - `harc/harc-reszletek-calc.ts` - calcReszletekData (aktív fegyver bontás adatok)
        - `engine/fortely-mods.ts` - calcFortelyMods (önálló engine modul)
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
      A useHarcComputed.ts (+ pancel-calc.ts → buildPancelLookups) a karakter adatokból építi a context-et + lookup táblákat.
      Ha nincs struktúra kiválasztva → minden 0, lefedettség = 0%.
      Végleges SFÉ a Harc fülön (useHarcComputed.ts): (session.aktív_páncél ? computed.sfé : 0) + fortelyMods['SFÉ']
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
        session.fegyverfogás (fegyver_pajzs mód) VAGY session.aktív_pajzs,
        fortélyok: Pajzshasználat fok (0-3),
        session.aktív_helyzetek (Belharci helyzet → méret-degradáció)
source: konstansok.yaml → pajzs_hatások (2D: méret × Pajzshasználat_fok → {VÉ, TÉ}),
        konstansok.yaml → belharc_pajzs_max_méret

formula:
  hasPajzs = (session.aktív_pajzs VAGY fegyverfogás == "fegyver_pajzs") ÉS pajzs.méret ≠ ""
  if NOT hasPajzs: → VÉ_pajzs = 0, TÉ_büntetés_pajzs = 0

  pajzs_fok = fortély_fok("Pajzshasználat")   // 0 ha nincs felvéve

  // Belharc degradáció (§13.2): belharcban a pajzs legfeljebb belharc_pajzs_max_méret (= "kis")
  méret = pajzs.méret
  if "Belharci helyzet" in session.aktív_helyzetek ÉS méretRang(méret) > méretRang(belharc_pajzs_max_méret):
    méret = belharc_pajzs_max_méret

  // EGYETLEN 2D lookup: méret × Pajzshasználat fok → {VÉ, TÉ}
  entry = lookup(pajzs_hatások[méret], fok == pajzs_fok)   // fallback: [0]. elem
  VÉ_pajzs = entry.VÉ
  TÉ_büntetés_pajzs = MIN(0, entry.TÉ)

output: VÉ_pajzs (fogásResult lila sorban), TÉ_büntetés_pajzs (fogásResult lila sorban)
note: Fegyver+pajzs mód automatikusan aktív_pajzs = true.
      Pajzs csak fegyver_pajzs fegyverfogásban használható (nem kétkezes, nem hárító).
      A VÉ és a TÉ büntetés EGYETLEN pajzs_hatások lookupból jön (méret × fok), NEM külön
      konstans + fortély-mérséklés. A Pajzshasználat fok a táblán belül csökkenti a TÉ büntetést
      és magasabb fokon (3) emeli a VÉ-t. Impl: pancel-calc.ts → calcFogas.
      pajzs_hatások tábla (konstansok.yaml):
        kis:     fok0 {VÉ 3, TÉ -3}  fok1 {3, 0}   fok2 {3, 0}   fok3 {VÉ 5, TÉ 0}
        közepes: fok0 {VÉ 10, TÉ -6} fok1 {10, -3} fok2 {10, 0}  fok3 {VÉ 12, TÉ 0}
        nagy:    fok0 {VÉ 16, TÉ -9} fok1 {16, -6} fok2 {16, -3} fok3 {VÉ 18, TÉ 0}
```

### 13.1 Pajzs fegyverként (csak pajzs harc)

Ha a karakter kizárólag a pajzzsal harcol (fegyver nélkül):
- Aktív fül: Ügyesebb kéz = pajzs (idx: -2), Fegyverfogás: Egyfegyveres
- Fegyvertáblában a pajzs fegyver harcértékei jelennek meg (`fegyverek_v2.json`, kategória: "pajzs")
- Harcmodor: Közelharc (`konstansok.fegyver_kategória_harcmodor.pajzs: "Közelharc"`)

Bónuszok: a Pajzshasználat fortély `fegyver_kategória:pajzs` feltételes módosítói (§16):
- 1.fok: TÉ:+1, VÉ:+1, SP:+1
- 2.fok: TÉ:+2, VÉ:+2, SP:+2
- 3.fok: TÉ:+3, VÉ:+3, SP:+3

Data layer: `pajzshasznalat.yaml` módosítók (feltétel: `"fegyver_kategória:pajzs"`, mód: flat).
useHarcComputed.ts: `aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`)` → fortély módosítók automatikusan aktiválódnak.
Pajzs adatok: a pajzs-entryk a `fegyverek_v2.json`-ban (kategória: "pajzs") + a `konstansok.pajzs_hatások`
2D tábla (méret × Pajzshasználat fok, §13). A régi v1 pajzs-pipeline (`pajzsok.json`) archiválva (`archive/data_fegyverek_v1/`).
Harcértékek fül: "pajzs" kategória kiszűrve a fegyver felvétel dropdown-ból.

### 13.2 Belharc pajzs degradáció

Belharci helyzetben (`session.aktív_helyzetek` tartalmazza a "Belharci helyzet"-et) a pajzs mérete a
`konstansok.belharc_pajzs_max_méret` (= "kis") maximumra degradálódik a `pajzs_hatások` lookup ELŐTT.
Testközelben a nagy/közepes pajzs használhatatlan, ezért belharcban minden pajzs legfeljebb Kis pajzsként
véd (VÉ:3, Pajzshasználat 3.fok esetén 5). Kód: `pancel-calc.ts` → `calcFogas` (méretRang klamp).

Szabály (md, KM-oldali kiegészítés a védekező ellenfélre): a Belharcba kerülés manőver Ellenpróbájának
nehézségét a védekező pajzsmérete növeli - Kis +2, Közepes +4, Nagy +6. Ezt az app nem automatizálja
(az ellenfél KM-oldali), csak a saját karakter pajzs-VÉ degradációja számítódik.

---

## 14. Manőver Alap / Manőver Pont

```
input:  karakter.HM_TÉ, karakter.HM_VÉ

formula:
  manőver_alap = CEIL((HM_TÉ + HM_VÉ) / 10)

output: manőver_alap
note: A felvett HM pontok tizede, felfelé kerekítve. Statikus (karakteralkotási időben
      számított) érték, harc közben nem változik. A Manőver Ellenpróba fázisában vesz részt
      (Manőver Alap + MP + k10 vs Nehézség + ellenfél Manőver Alap).
```

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

## 15. Felszerelés (próba-Hátrány)

```
Felszerelés keret = 2 + Erő

A cipelt közepes (-1) és nagy (-2) tárgyak, a Közepes/Nagy pajzs
és a Másfélkezes/Kétkezes (vagy nehéz/súlyos) fegyver csökkentik a keretet.
Ha a keret negatívba csúszik:
  -1 → Hátrány-1 a Fizikai Tulajdonság-/Képzettségpróbákra
  -2 → Hátrány-2
  -2 alatt → nem tud harcolni, a próbadobások automatikus kudarcok.
```

note:
  Szabálykönyv: md/010_03_06_felszereles.md.
  Pure logika: `engine/felszereles.ts` (`felszerelésMax`, `felszerelésTerhelés`,
  `felszerelésSorok`, `felszerelésHátrány`, `fizikaiTulajdonság`), konstans:
  `konstansok.yaml` → `felszerelés` (méret/súly/forgatás/pajzs/páncél pont-táblák,
  `páncél_fedés_min`, `hátrány_sáv`, `hátrány_tulajdonságok`). A fegyver pontja
  VAGY-VAGY: `max(hossz_pont, súly_pont)`. A hatás a próba-EH ágba megy (§33.1), NEM a
  harckeretbe - a régi `felszerelés_mgt` → harckeret reactive út KIVEZETVE.
  Fegyverenkénti „számít-e": `FegyverPeldany.felszerelésben` flag (Harcértékek fül chip);
  pajzs/páncél: `felszerelés.kizárt_auto`. UI: Felszerelés accordion (Verziók/Napló
  overlay). A hosszútávú viselet akadályát külön az Akadály fejezet írja le
  (md/010_03_07_akadaly.md).

---

## 16. Fortély módosítók alkalmazása

```
input:  karakter.fortélyok[], data/sources/fortelyok/**/*.yaml
logic:
  FOR EACH karakter.fortélyok as kf:
    fortély_def = lookup(kf.név → fortelyok/**/*.yaml)
    aktív_fok = fortély_def.fokok[kf.fok]

    FOR EACH aktív_fok.módosítók as mod:
      if NOT feltételTeljesül(mod.feltétel): continue     // "" = mindig aktív
      if fortély_def.session_toggle ÉS mod.cél IN (TÉ, VÉ) ÉS session[<fortély_név>] kikapcsolt: continue
      if mod.mód == "flat":
        mods[mod.cél] += mod.érték
      elif mod.mód == "scaled" ÉS mod.forrás == "erőbónusz" ÉS mod.cél == "SP":
        mods.SP_erőbónusz_arány += mod.arány          // a szorzás a fegyver_SP-ben (§8)
      elif mod.mód == "scaled":
        forrás_érték = karakter képzettség szintje (név == mod.forrás, kisbetűs)
        mods[mod.cél] += FLOOR(forrás_érték x mod.arány)
      // minden más mód (override, előny/hátrány, enyhít, szorzó, …) NEM itt kezelődik, l. lent

  + a 0.fok (Alapeset) flat módosítói (§16.1)

output: mods = { KÉ, TÉ, VÉ, SP, CÉ, harckeret, SFÉ, fegyverhossz, SP_erőbónusz_arány } (célokra összegzett bónuszok)
note: feltétel == "" → mindig aktív (karakterlap számolja).
      feltétel == "prefix:érték" → feltételesen aktív (UI toggle / automatikus).
      feltétel == [{forrás, operátor, érték}] → kalkulált feltétel (lásd §24).
      Prefixek (lásd konstansok.yaml → feltétel_prefixek):
        harci_helyzet, taktika, fegyver, fegyver_kategória, fegyverfogás, manőver, státusz, páncél
      Módok (konstansok.yaml → effekt_módok, build-validált; teljes nyelvtan: §42):
        flat, szorzó, scaled, override, max_limit, előny, hátrány, enyhít, letilt, szöveges
      Hol kezelődik:
        - "flat", "scaled": calcFortelyMods (fent)
        - "override": CSAK cél: "SP" + feltétel: "fegyver:X" → fegyver-calc.ts (§8 SP override)
        - "enyhít": Hatás pool-ban csökkenti a célra vonatkozó negatív hatás fokát (§22.7)
        - "előny" / "hátrány": kocka-reroll (combat-roll-info.ts, próba-calc). Célok: sebzésdobás,
          ké_dobás, té_dobás, cé_dobás, képzettségpróba_dobás, tulajdonságpróba_dobás
        - "szorzó": vé_csökkentés / vé_veszteség (ve-csokkentes-calc.ts, §21)
        - "szöveges": csak megjelenítés
      Terminológia:
        - "Támadó dobás" (szabálykönyvben) = té_dobás + cé_dobás (mindkét célra hat).
          Ha egy helyzet "Hátrány-X Támadó dobásra" ír, a YAML-ben mindkét cél külön szerepel.
      Opcionális mezők:
        - "alcél": konkrét tulajdonság/képzettség neve (pl. "Edzettség", "Zárnyitás", "Látás")
        - "megjegyzés": emberi olvasásra (kontextuális info)
      Speciális feltétel esetek:
        - "fegyver:" (üres érték) → Mesterfegyver fortély: aktív ha az adott spec_elem fegyver van kiválasztva
        - "fegyver:puszta kéz" → csak puszta kéz harccal aktív
impl: A fokok tömbben a fok értéke NEM feltétlenül egyezik a tömb indexével.
      Sok fortélynál nincs fok:0 (alapeset), csak fok:1-től indul.
      A lookup tehát: fortély_def.fokok.find(f → f.fok == kf.fok), NEM fokok[kf.fok].
      Modul: `engine/fortely-mods.ts` → `calcFortelyMods()` (self-contained, engine-szintű).
        Input: karakter, session, gameData, aktívFeltételek Set, feltételTeljesül callback.
        Output: Record<string, number> (célokra összegzett bónuszok: KÉ, TÉ, VÉ, SP, CÉ, harckeret, SFÉ, fegyverhossz,
        + SP_erőbónusz_arány).
        Hívó: harc/useHarcComputed.ts.
        Belsőleg meghívja: `evaluateAlapesetek()` (engine/alapeset.ts) a 0.fok módosítók beszámítására.
      Könyvtár struktúra: `fortelyok/{harci,tavharc,altalanos,erzekek,szabad,kiemelt,misztikus}/*.yaml`
      A `tavharc/` mappából jövők `alcsoport: "tavharc"` mezőt kapnak a JSON-ban (picker csoport: "🏹 Távharc").
      Scaled mód - `forrás` lehetséges értékei:
        - Képzettség név (kisbetű): pl. "akrobatika" → a karakter képzettség szintje
        - A forrás-értéket `floor(érték x arány)` adja a bónuszt.
        - `forrás: "erőbónusz"` (csak cél: SP): az erőbónusz fegyverfüggő (min(erő, mód Erőlimit)), ezért a
          calcFortelyMods csak az arányt gyűjti `mods.SP_erőbónusz_arány`-ba; a szorzást a fegyver_SP szabály
          végzi (§8). Pl. Taktikafókusz: Roham → Roham taktikánál "erőbónusz duplázódik" (arány 1).
      Követelmények logika (részletes tábla: §25):
        - A követelmények lista elemei ÉS kapcsolatban vannak (mindegyiknek teljesülnie kell).
        - A "név" mező HIVATKOZÁS (id, 2026-10-17): fortély-id, ill. képzettség-kulcs ("lexikum",
          "harcmodor/kardvívás"). Lista = VAGY kapcsolat (pl. ["harcmodor/közelharc", "harcmodor/kardvívás"]).
          Formátum: data/gen/hivatkozas.py; build-gate: generate_tables.validate_id_hivatkozasok.
        - Típusok: képzettség (szint ≥ érték), fortély (fok ≥ érték, többszörösnél bármelyik példány)
        - UI: nem teljesülő követelmény → piros jelzés (FortelyokScreen); pontos id/kulcs-egyezés, a felirat a feloldott név
      Karakter fortély / képzettség (séma v3, 2026-10-17):
        - kf = { id, elem, fok, kiérdemelt? }: id = fortély yaml `id`; elem = többszörösnél a választott példány
          (pl. "erv", "Kard, lovag"), egyedi fortélynál (id "egyedi") a neve; a spec-típus a definícióból jön.
        - kp = { id, elem, szint }: hivatkozási kulcs `<id>/<elem>` (harcmodor-elem = konstansok.harcmodorok,
          kisbetűs; Ősi nyelv / Tradíció: szabad szöveg) vagy `<id>`.
        - Lookup: id / kulcs alapján; megjelenítés: engine/azonosito.ts (fortélyNév, képzettségNév).
```

### 16.1 Alapeset (fok: 0) - IMPLEMENTÁLT

A fortély yaml `fokok[]` tartalmazhat `fok: 0` entry-t (Alapeset). Ez **akkor aktív, ha a karakter NEM rendelkezik az adott fortéllyal** (fok == 0 implicit). Ezzel a fortély hiányának mechanikus hatása is a data layer-ben tárolható.

#### Séma

A 0.fok ugyanolyan `fokok[]` elem, mint a többi; a feltétel MÓDOSÍTÓNKÉNT, a szokásos
`"prefix:érték"` stringként szerepel (§16, `konstansok.yaml → feltétel_prefixek`).
Lehet csak `hatástext` is (módosító nélkül) - ilyenkor emlékeztetőként mindig megjelenik.

```yaml
fokok:
  - fok: 0
    hatástext:
      - text: "Lovas harc fortély nélkül: TÉ:-9, VÉ:-9."
    módosítók:
      - cél: "TÉ"
        érték: -9
        mód: "flat"
        feltétel: "harci_helyzet:lovas_harc"
  - fok: 1
    ...
```

#### Kiértékelés logika

```
FOR EACH fortély_def in data.fortelySummaries:
  IF a karakter NEM vette fel a fortélyt:
    fok0 = fortély_def.fokok.find(f → f.fok == 0)
    IF fok0 nincs, VAGY se hatástext, se módosító: skip
    IF nincs módosító: → aktív (csak hatástext)
    ELSE:
      aktív_módosítók = fok0.módosítók WHERE
        feltétel == ""                                  → aktív
        aktívFeltételek megadva → aktívFeltételek.has(feltétel)
        egyébként              → utils.evaluateFeltétel(feltétel, session, karakter)
      IF aktív_módosítók nem üres: → aktív
  aktív → hatástext a Hatás poolba; a FLAT módosítók a calcFortelyMods-ba (§16)
```

#### GUI megjelenítés

- A 0.fok hatástext a **Hatás pool**-ban jelenik meg accordion (`<details>`) formában, alapból becsukva
- Fejléc: "Alapesetek (N) ▾" - szürke szín (mint "Státusz hatások")
- Elemek: fortély név bold fehér + hatástext fehér
- Csak akkor látható, ha a feltétel teljesül ÉS a karakter nem rendelkezik a fortéllyal

#### Implementáció

- Modul: `web/karakter/src/engine/alapeset.ts`
  - `evaluateAlapesetek(fortelyDefs, karakter, session, aktívFeltételek?)` → `AktívAlapeset[]`
  - Ha `aktívFeltételek` Set megadva → azzal ellenőrzi a feltételeket (hash lookup)
  - Ha nincs megadva → fallback: `engine/utils.ts → evaluateFeltétel()` (prefix:érték kiértékelés)
- Hívás helye:
  - `engine/fortely-mods.ts` → `calcFortelyMods` (useHarcComputed.ts-ből): a 0.fok flat módosítói a harcértékekbe (pl. Lovas/Léglovas harc 0.fok TÉ:-9 VÉ:-9)
  - `components/aktiv/aktiv-calc.ts` - Hatás pool kalkuláció (alapesetek, aktívFeltételek Set-tel)
- Hárítófegyver: a pancel-calc.ts → calcFogas `hasHárítóFortély` check - ha nincs "Hárítófegyver használat" fortély → hárítóVÉ = 0 (a 0.fok módosítója csak jelzés)
- Validáció: minden módosítónak kötelező a `mód` (hiányzó → build hiba), és a `konstansok.effekt_módok` eleme kell legyen
- Validáció: `data/gen/fortelyok.py` - feltétel prefix ellenőrzés `konstansok.yaml → feltétel_prefixek` alapján

#### Érintett fortélyok

```
Fortély                            0.fok módosító (feltétel)
────────────────────────────────────────────────────────────────────────────
Lovas harc                         TÉ:-9, VÉ:-9 (harci_helyzet:lovas_harc)
Léglovas harc                      TÉ:-9, VÉ:-9 (harci_helyzet:léglovas_harc)
Lövés hátasról                     CÉ:-3 (harci_helyzet:lovas_harc)
Lövés reflexből fejlesztése        CÉ:-7 (harci_helyzet:lövés_reflexből)
Testőr                             jelzés (harci_helyzet:vé_kiterjesztés) - a ×2-t maga a helyzet adja (harc/shared.ts)
Hárítófegyver használat            jelzés (fegyverfogás:fegyver_hárító) - hatás: calcFogas
Csak hatástext (emlékeztető):      Gyöngyhalász, Úszás, Infralátás, Helyhez kötve fejlesztése,
                                   Kétkezesség, Vakharc fejlesztése, Mozgó cél könnyítése
                                   (fegyveres / mágia), Lövés futás közben,
                                   Nyílpuska újratöltés fejlesztése, Taktikafókusz: Kitartott célzás
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
        tables/tavfegyverek_v2.json (harcmodor mező: "Hajítás"/"Íjászat"/"Lövészet"/"Mágikus célzás")

formula:
  CÉ_alap = konstansok.harcérték_alap.CÉ   // -15

  idea_delta = példány.idea - távfegyver.idea_default   // §5.1 Modell 2 (CÉ-be 1:1)

  if távfegyver.kategória == "mágikus":
    // Mágiatáv egyedi CÉ formula (076_tavharc_csatamagia_eseten.md)
    CÉ = CÉ_alap
       + TSz + Gyorsaság + Intelligencia    // Önuralom helyett
       + CM
       + harcmodor_CÉ_bónusz(harcmodor_szint)   // Mágikus célzás
       + távfegyver.CÉ                          // Mágiatáv I:+1, II:+2, III:+3, IV:+4
       + mesterfegyver_CÉ_bónusz(fok)
       // Idea NEM számít
  else:
    CÉ = CÉ_alap
       + Önuralom
       + CM
       + harcmodor_CÉ_bónusz(harcmodor_szint)
       + távfegyver.CÉ
       + mesterfegyver_CÉ_bónusz(fok)
       + idea_delta

output: CÉ (karakter összesített Célzó Értéke az adott fegyverrel)
impl: tavharc/helpers.ts → calcCÉBontás / calcCÉ (+ fortélyCÉ, §17.2); az idea_delta-t a hívó
      (TavharcFegyverCard / TavharcScreen) számolja.
```

### 17.1b Mágiatáv fegyverek

```
Mágiatáv I–IV: virtuális távfegyverek mágikus célzáshoz.
A "Mágiatáv növelés" fortély foka határozza meg, melyik fokozat használható:
  0 fok (nincs fortély): Mágiatáv I
  1.fok: Mágiatáv II
  2.fok: Mágiatáv III
  3.fok: Mágiatáv IV

Adatok (tavfegyverek_v2.json):
  kategória: "mágikus"
  harcmodor: "Mágikus célzás"
  CÉ: fokozat (1-4)
  Osztó: fokozat (1-4)
  SP/Sebesség/Hatótáv: varázslat-specifikus (webapp: nem kalkulált, "-" kijelzés)
  Erőbónusz: 0

Felvétel: kézi (karakter.távfegyverek[]-be, mint bármely távfegyver).
Mesterfegyver: felvehető (spec_elem: "Mágiatáv X").
Támadások/kör: nem kalkulálható (varázslás/kör szabály dönti el).

Generálás: `data/gen/fegyverek_v2.py → generate_tavfegyverek_v2` - a Mágiatáv I-IV a `tavfegyverek_fixed.json`-ban, a v2 táblába (`tavfegyverek_v2.json`) kerül.
```

### 17.2 CÉ módosítók (taktikák, helyzetek, fortélyok)

```
A CÉ-hez adódó módosítókat a getFortélyCÉ() függvény számolja (per fegyver).
Három forrásból:

1. Aktív harci helyzetek: hatások[].cél === 'CÉ' && operátor === 'flat'
   Pl. Hajítás alkalmatlan fegyverrel: Hátrány-2 CÉ

2. Aktív taktikák: taktika.módosítók.CÉ
   - szűrő_harcmodorok figyelembe vétele: bónusz csak akkor jár, ha az aktív
     távfegyver harcmodora szerepel a taktika szűrő_harcmodorok[] tömbjében.
   Pl. Kitartott célzás: +3 CÉ (csak Íjászat/Lövészet)
   // Íjnál a Kitartott célzás csak 1 körig tartható: 1 kör után nincs bónusz, sőt
   // körönként CÉ:-3 büntetés jár (md/071_tavharc_ce.md). KM/runtime-oldali korlát,
   // az app a statikus +3/+7 bónuszt számolja (a kör-számlálást nem).

3. Fortély módosítók: feltételes CÉ bónuszok (feltétel aktívFeltételek-ben)
   - Ha a feltétel taktika: prefixű, és az adott taktikának van szűrő_harcmodorok
     mezője, akkor a fegyver harcmodorát is ellenőrzi.
   Pl. Kitartott célzás fejlesztése: +4 CÉ (feltétel: taktika:kitartott_célzás)
       → összesen +7 CÉ kitartott célzás + fortély esetén

Lövés reflexből: Hátrány-1 CÉ dobásra (harci helyzet hatásként, alapesetben)
Lövés reflexből + "Lövés reflexből fejlesztése" fortély: kioltja a hátrányát

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
  // Osztó: fegyverenként egyedi, [1; 6] tartomány, méterben. A nagyobb jobb (lassabban nő
  // a távval a célpont VÉ-je). Mágikus/minőségi bónusznál az Osztót NE módosítsd, a fegyver
  // CÉ-jét igen (md/072_01).

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

Sebesség ≤ 0 (nyílpuskák: -1): támadások_száma = a fegyver alap címkéje (pl. "1/2 kör")
  "Nyílpuska újratöltés" helyzet aktív + "Nyílpuska újratöltés fejlesztése" fortély ≥1.fok: 1x
harckeret ≤ 0: 1x
impl: tavharc/helpers.ts → calcTámadásLabel, calcÚjratöltésEnyhítés
```

### 17.5 Hatótáv

```
max_hatótáv = távfegyver.hatótáv_bázis + Erő × távfegyver.hatótáv_erő_szorzó   (méter)
// "Nem hajításra alkalmas" tárgyak: hatótáv = Erő × Osztó (m)
// Hatótávon túl: lövés/hajítás lehetetlen
```

### 17.6 Sebzés

```
SP = fegyver.SP + Erőbónusz + MF.SP
  Erőbónusz = MAX(0, MIN(Erő, fegyver.erőbónusz_limit))      (md/064_02_06, md/068_07-08)
    Hajítófegyverek: a szokásos módon (limit a táblából, pl. Dárda 99, Hajítótőr 1, Parittya 2)
    Íjak: CSAK ha az íj az adott Erőre tervezett (md/068_08) → a Sebzés popupban kapcsolható sor,
          alapból BE („Erőbónusz: +N"; limit vágta → vonal az érték fölött), KI: „Erődre tervezett íj: nem";
          a kártya / kalkulátor SP-je az íj-Erőbónusz NÉLKÜL; extra: tavharc_ij_erobonusz_tervezett
    Nyílpuskák: nincs (limit 0)
  MF.SP: konstansok.mesterfegyver_bónuszok (a megjelölt távfegyverre)
  Fortély-SP: nincs (Orvtámadás távharcban nem végezhető; Pajzshasználat pajzs-kötött). Idea: csak CÉ (§17.7).
  SP_NINCS (-99) / mágikus: nyers érték, nincs kalkuláció.
Többszörös találat sebzésbónusz: NINCS távharcban
impl: tavharc/helpers.ts → calcTávSP (fegyverkártya, kalkulátor, Sebzés popup + „Statikus bónuszok" bontás)
```

### 17.7 Távharc fül - webapp

```
Karakter séma:
  karakter.távfegyverek: { alap: string; idea: number }[]   // távfegyver példányok (lookup kulcs → tavfegyverek_v2.json)
  session.aktív_távfegyver_index: number      // kiválasztott távfegyver indexe (-1 = nincs)

CÉ formula:
  CÉ = konstansok.harcérték_alap.CÉ + Önuralom + CM + harcmodor_CÉ_bónusz + fegyver.CÉ + MF.CÉ + idea_delta + fortélyCÉ

  if távfegyver.kategória == "mágikus":
    CÉ = konstansok.harcérték_alap.CÉ + (TSz + Gyorsaság + Intelligencia) + CM + harcmodor_CÉ_bónusz + fegyver.CÉ + MF.CÉ + fortélyCÉ
    // Önuralom NEM számít, helyette TSz + Gyo + Int. CM viszont igen (rulebook 076). Idea nem.

  fortélyCÉ: helyzet + taktika + fortély CÉ módosítók összege (per fegyver, szűrő_harcmodorok figyelembe vételével)
    Lásd §17.2 a részletekért.
    Csak "CÉ" célú módosítók, ahol feltétel ∈ aktívFeltételek (session.aktív_helyzetek → feltétel_kulcs).

Virtuális fegyverek (nem a távfegyverek[] tömben, fortélyból származtatottak):
  - "Alkalmatlan fegyver hajítása" fortély (spec_típus: "fegyver") → per spec_elem, "🔆 Nem dobásra" def
  - "Alkalmatlan tárgyak hajítása" fortély → "Alkalmi tárgy", "🔆 Nem dobásra" def (2.foknál Osztó=2)

CM szerkesztő: a Távharc fülön (szerkesztő módban), max = tsz × arányok.max_cm_perszint

Adatforrások:
  - tables/tavfegyverek_v2.json (név, kategória, harcmodor, CÉ, Osztó, SP [-99=nincs], Sebesség, sebzésjelleg, Átütés,
    forgatás, erőbónusz_limit, hatótáv_bázis + hatótáv_erő_szorzó, idea_default, extrák, megjegyzés)
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
  max_HM_aszimmetria = FLOOR(tsz / konstansok.hm_aszimmetria_osztó)
  validate: ABS(HM_TÉ - HM_VÉ) ≤ max_HM_aszimmetria

output: max_HM, max_CM, max_HM_aszimmetria

reactive rules.json:
  max_HM: sum_where(harci_fortélyok, fok, is_mesterfegyver, 0) + harcmodor_összeg + alakzatharc_szint
  max_HM_aszimmetria: floor(tsz / konstansok.hm_aszimmetria_osztó)   → TS: harcertekek/helpers.ts calcMaxAszimmetria
  max_CM: tsz * konstansok.arányok.max_cm_perszint

note: A Mesterfegyver fortély fokai NEM számítanak a max_HM-be.
      A harci_fortélyok ArrayContext-ben {fok, is_mesterfegyver} record-ok vannak.
      alakzatharc_szint: a KP/HM számításban (kp-calc.ts) a valós szint; a per-fegyver
      kalkulációban (fegyver-calc.ts) 0 - ott a max_HM nem kell.
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
note: Skála: [0, 15]. A 3. szint a "nullpont" (innen tűnnek el a súlyos levonások).
      Abszolút maximum: 15.szint.
      Hagyományos tanulással legfeljebb 13.szintig lehet fejlődni; a 14-15.szint csak speciális módon
      (nagyon ritka, titkos tudás megszerzésével) érhető el.
      Szintlépésenként max 2 szinttel növelhető egy képzettség - KIVÉVE 0-ról tanuláskor:
      ekkor egy lépésben max 3.szintre ugorhat.
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
note: Nem rules.json szabály - fortelyok/helpers.ts → calcNyelvPontKeret, calcNyelvTúllépés.
      Nyelvismeret kp_perfok: 0 (nem KP-ból, hanem Nyelvtanulás pontokból vehető fel).
      Kiérdemelt Nyelvismeret: anyanyelv választásból szinkronizálva (Közös Alap + anyanyelv Alap).
      Fok emelhető (Alap→Udvari), az extra fok fizetős pontból.
      UI: "Alap" / "Udvari" label (nem szám), ⭐ / ⭐➕ jelölés.
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

  // Faj-kötött fortélyok (`faj` követelmény-típus): a faj érzék- VAGY ajánlott fortélya, max fokig.
  // Adat: faj `ajánlott_fortélyok: [{név, max_fok}]` (md fok-jelölés, ennek hiányában a fortély maxfoka)
  // → generált `faj_fortelyok.json` (faj → {fortély: max_fok}, érzék + ajánlott összefésülve).
  // Webapp: `checkKövetelmények` (fortelyok/helpers.ts) - nem blokkol, hiány-jelzés a fortély-soron.

  // Kötelező fortélyok: a karakter MUST HAVE mindegyiket
  FOR EACH kf in faj_def.kötelező_fortélyok:
    kf MUST BE IN karakter.fortélyok[].név

  // Tiltások
  FOR EACH tk in faj_def.tiltott_képzettségek:
    tk MUST NOT BE IN karakter.képzettségek[].név
  FOR EACH tf in faj_def.tiltott_fortélyok:
    tf MUST NOT BE IN karakter.fortélyok[].név

output: validációs eredmény (pass/fail + hibák listája)
note: A faj_misztérium mező megmondja, melyik Faj Misztérium képzettséget veheti fel a karakter.
impl: CSAK a tulajdonság keretek: tables/faj_tulajdonsag_keretek.json → GameData.fajKeretek
      (TulajdonsagokHeader → TulajdonsagCell fajMin/fajMax). Az érzék-fortély, kötelező és tiltott
      ellenőrzések a webappban NEM implementáltak (a fajok.json csak a fajneveket adja).
```


---

## 21. Aktív fül - Taktikák, Manőverek, Helyzetek

Az Aktív fülön választható elemek és módosítóik összefoglalása.
UI szekció sorrend: Fegyver+Fogás → Fortély bónuszok/Alapesetek → Taktikák → Harci helyzetek → Manőver → Státuszok → Narratív Előny/Hátrányok.
A feltételes fortély módosítók (§16) ezekhez kötődnek: `feltétel: "taktika:roham"` stb.

### Implementációs illeszkedés

Adatforrások (YAML → JSON generálás: `generate_tables.py` → `generate_aktiv_ful()`):
- `data/sources/taktikak.yaml` → `tables/taktikak.json` (19 taktika: 16 közelharci + 3 távharci; módosítók, hatások, fokok, kombó szabályok, megkötések, skálázható flag)
- `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (40 helyzet: id, infó, hatások, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek, tiltott_fegyverfogások, fegyver_override)
- `data/sources/manoverek.yaml` → `tables/manoverek.json` (38 manőver: id, típus, nehézség, fázisok, `fázis_info` [opcionális map: fázis-betű → magyarázó szöveg], `fázis_cselekvő` [opcionális map: fázis-betű → "én"|"ellenfél"; default M→ellenfél, V/E→én - pl. Távoltartás/Hátas táncoltatása/Lovas megakasztása M→én], `ellenpróba_bünteti` [opcionális bool: az Ellenpróba nem buktató, rontásnál is sikeres a manőver, csak büntetés - Átsiklás, Kibontakozás], `hatás` [mondatonkénti lista; a `Sikertelen:` / `Kudarc:` / `Feltétel:` előtagú sorokat a sikeres-box kiszűri, a picker mind mutatja], `végrehajtás_té_módosító` [default 5, 0=nincs bónusz], `követelmények` [opcionális, Normál/Erős - lásd lentebb], `helyzetfüggő_módosítók` [opcionális, képzettség-minta táblák])

ID és feltétel_kulcs konvenció:
- YAML-ban: csak `id` mező (snake_case, ékezetes, source of truth)
- JSON-ban: `id` + `feltétel_kulcs` (generált: `"{prefix}:{id}"`)
- Prefixek: taktika → `"taktika:{id}"`, harci_helyzet → `"harci_helyzet:{id}"`.
- Manőverek: `id` mező (referencia fortély módosítók `manőver:{id}` céljához)
- Validáció: id egyediség + fortély `manőver:X` → manőver id referenciális ellenőrzés (build-time)

Taktika kombó logika (`kombó_mód` + `kombó_lista`):
- `"whitelist"` + lista: CSAK ezekkel kombinálható (üres = semmivel)
- `"blacklist"` + lista: mindennel KIVÉVE ezeket

Fokozatos taktikák: `fokozatos: true` → `fokok[]` tömb (pl. Támadó fok:1..3, mindegyik más TÉ/VÉ)

Session state bővítés (types.ts Session interface):
- `aktív_taktikák: { név: string, fok?: number }[]` (több kombó, fokozatos taktikáknál fok)
- `aktív_helyzetek: string[]` (több helyzet egyszerre; a helyzet NEVÉT tárolja)
- `aktív_manőver: string` (max 1, marad)

Kalkuláció két rétege:
1. **Taktika módosítók** - direkt numerikus: TÉ/VÉ/KÉ/SP módosítók a Harc fülön számolva
   (hasonlóan a fortélyMod_* context mezőkhöz, pl. `taktikaMod_TÉ`, `taktikaMod_VÉ`)
   VÉ eltolás ökölszabály: `taktikaMods['VÉ']` clamp `[-limit, +limit]` ahol limit = `konstansok.taktika_vé_eltolás_limit` (10)
2. **§16 feltételes fortély módosítók** - a calcFortelyMods `feltételTeljesül` callbackje (useHarcComputed.ts):
   string feltétel → aktívFeltételek Set keresés; strukturált feltétel → §24 kiértékelés

Harci helyzetek: NEM kalkuláltak (komplex hatások) - Hatás pool-ban az `infó` mező jelenik meg + §16 feltétel dispatch.
  Ha van fortély aminek feltétele `harci_helyzet:{id}` → alatta indentálva megjelenik: `→ Fortély (fok): hatástext ✔`
  Ha a fortély aktív (feltétel teljesül): zöld szín + ✔. Ha nem: szürke.
  Alapeset (0.fok) hatástext hozzáfűződik az infó szöveghez: `"infó; Alapeset: hatástext"`
Manőverek: NEM adnak statikus harcérték módosítókat a Harc fülre - informatív (nehézség, fázisok, hatás megjelenítés).
UI: Manőver szekció `aktiv-label` fejléccel (mint Taktikák/Helyzetek).
A Manőver dobás popup (§21.4) viszont interaktív dobás-módosítókat használ:
  - `helyzetfüggő_módosítók` → az Ellenpróba **dobásához** (`dobásÉrték = Manőver Alap + MP + belharc + szitModÖsszeg`), a Célszám fix (`nehézség`). A táblák `mód_oldal` mezője (default `aktív`) dönti el, melyik dobó-oldalhoz tartoznak: **aktív** módban az aktív-oldali táblák + a GLOBÁLIS módosítók, **passzív** módban a `mód_oldal: passzív` táblák (pl. fegyver-extrák, amelyek a fegyver birtokosát - a passzív félt - érintik: Lefegyverezés ellene könnyebb/nehezebb, Fegyvertörés-immunis). Passzív módban a módosító-gomb is látszik, és az összeg az ellenfél **célszámához** adódik (`célszám = Manőver Alap + nehézség + MP + belharc + szitModÖsszeg`; pozitív = a passzív félnek kedvez, mint a költött MP). A fegyver-extra sorok (`feltétel: fegyver_extra:<id>`) auto-bekapcsolnak, ha az extrát az aktív fegyver VAGY a használt pajzs (pajzs toggle / fegyver+pajzs fogás / pajzs mint fegyver) hordozza; a sor felirata ilyenkor a hordozó nevét is mutatja (`extraHordozóNév`). A manőverenkénti fegyver-extra tábla kategória-neve egységesen `Fegyver`. A képzettségpróba `calcSzitModÖsszeg`-ét használja üres enyhítés-listával. Szín-konvenció EGYSÉGES a képzettségpróbával: pozitív (könnyebb, nagyobb dobás) = zöld, negatív (nehezebb) = piros. (Korábban célszám-oldali volt fordított színnel; 2026-10 átállás a dobó-oldalra, l. refactorlog/2026-10-10.md + md/066_04.) Két KÜLÖNLEGES sentinel (nem dobásmódosító, nem adódik az összeghez):
    - `99` (`konstansok.yaml` → `manőver.sentinel_nem_kísérelhető`): „letilt" jelző - a Manőver az adott körülmények közt nem kísérelhető meg (aktív E fázis: a dobás-sor + a siker-gomb eltűnik).
    - `-99` (`manőver.sentinel_immunis`): passzív-oldali „immunis" jelző - a fegyver a manőverre immunis (Fegyvertörés-immunis) → a passzív félnek automatikus SIKER (passzív E fázis: a dobás-sor + a manőver-siker gomb eltűnik). Mindkettőt a `szitModSentinelLehetetlen` pure fn detektálja (a sentinel-érték paraméter). A passzív extra_ref sorokat a generátor (`aktiv_ful.py`) oldja fel az `extrak.yaml`-ból; a tábla `mód_oldal`-jának egyeznie kell az extra `állapot`-ával (különben build hiba), `letilt` módú hatásnál az érték a `-99` sentinel.
  - `végrehajtás_té_módosító` → a Végrehajtás fázis TÉ értékébe (`aktívTÉ + módosító`). Default 5 (`konstansok.yaml → manőver.végrehajtás_TÉ_standard`); `0` = nincs bónusz (Ellenfél elfogása, Precíz támadás, Csonkolás - a TÉ chip popupja külön jelzi). A Manőver popup fejléc-chipje a TÉ-t bontva mutatja: `TÉ: <nyers> (+<módosító>)`, hogy ne tűnjön ellentmondásosnak a Végrehajtás-fázis `aktívTÉ + módosító` értékével.
  - `követelmények` → a Manőver dobás popup **0. lépése** (a M/V/E fázisok előtt, CSAK aktív módban, ha van követelmény). Szabály: `md/066_04` „Manőver-követelmények: Normál és Erős" (a Képzettség-kiterjesztés mintája).
    - Erősség: 🟨 `normál` (hiány → Ellenpróba `Hátrány-2`, nem halmozódik) · 🟥 `erős` (hiány → auto-kudarc, nem dobható; dominál a Normál felett).
    - Ellenőrizhetőség: gépi (`típus: képzettség|fortély`, `név`+`érték` küszöb - a webapp auto-értékeli a karakterből; „Harcmodor" = bármely harcmodor-képzettség max szintje) · informatív (`típus: egyéb`, `leírás` - a játékos/KM dönt).
    - 0. lépés UI: minden követelmény listázva (gépieknél ✓/✗ auto-eredmény), 3 gomb: „Teljesül mind" (tiltva, ha gépi Normál hiány), „Normál hiány" (→ Hátrány-2), „Erős hiány" (→ auto-kudarc). Gépi Erős hiány → azonnali auto-kudarc, döntés nem választható.
Taktikák Hatás pool: módosítók zölddel + ✔ jel a végén (beszámított jelzés).

### 21.1 Harci Taktikák

Egy körben aktív harci taktika(ák). Feltétel kulcs: `taktika:név`.

| Taktika | Módosítók | Kombó ✅ | Kombó ❌ |
|---------|-----------|---------|---------|
| 1 támadás | TÉ:+3 (több-tám levonás nem érvényesül) | minden más | Roham, Ö.roham, Plusz tám, Teljes Véd, Fárasztás, (Lég)Lovas roham |
| Érintő | TÉ:+3, sebzés:0 | Védő, Kezdeményező, 1 tám, Plusz tám | más |
| Fárasztás | VÉ csökk: 3/kör (+fortély+fegyverelőny) | - | más |
| Kezdeményező 📶 | KÉ:+1..+3, VÉ:-1..-3 (alap max 3) | Támadó, Érintő, Visszafogott, 1 tám | más |
| Kiváró | KÉ:átengedett, TÉ:+3 (visszacsapás) | Támadó, Visszafogott, Tám.erőből, 1 tám, Tettetés | más |
| Öngyilkos roham | TÉ:+5, VÉ:-10, SP:+7, VÉcsökk 2x | - | más (max 1x/küzdelem) |
| Plusz támadás | +1 támadás, VÉ:-3 azonnal | Támadó, Érintő, Tám.erőből | más |
| Roham | TÉ:+4, VÉ:-8, SP:+5, VÉcsökk 2x | - | más |
| Támadás erőből 📶 | TÉ:-1..-3, SP:+1..+3 (alap max 3) | Kiváró, Plusz tám, 1 tám | más |
| Támadó 📶 | TÉ:+1..+3, VÉ:-2..-6 (alap max 3) | Kezdeményező, Kiváró, Plusz tám, 1 tám | más |
| Védő 📶 | VÉ:+1..+3, TÉ:-2..-6 (alap max 3) | Érintő, 1 tám | más |
| Teljes Védekezés | VÉ:+8, nem támad/varázsol, hátrál; saját VÉcsökk: 0; ellene fix 1+k20P (+Fárasztó bónusz) | - | más |
| Visszafogott | TÉ:-10, Hátrány-2 sebzésdobás | Kezdeményező, Kiváró, 1 tám, Tettetés | más |
| Tettetés | - (informatív) | Kiváró, Visszafogott, 1 tám | más |
| (Lég)Lovas roham | TÉ:+6, SP:+10 (szükséges: lovas_harc / léglovas_harc, §38) | - | más |
| (Lég)Lovas támadás galoppból | TÉ:+3, SP:+5 (szükséges: lovas_harc / léglovas_harc, §38) | 1 tám | más |

note: Forrás: tables/taktikak.json (kombó: `kombó_mód` + `kombó_lista`). A tábla a data layer kivonata.
      "Választható" értékek (pl. Támadó TÉ:+1..+3) → a játékos az Aktív fülön megadja a fokozatot.
      📶 Skálázható taktikák: Harcmodor szinttől függően a felső korlát nőhet (6.sz→max4, 9.sz→max5, 12.sz→max6).
      A "Támadás erőből" fortély megszűnt - a skálázható rendszer váltja ki.
      Roham/Ö.roham: csak az első oda-vissza csapásra érvényes.
      Fárasztás: nem támadás, nem kombinálható mással.
      Teljes Védekezés (md/065_02): a karakter maga NEM okoz VÉ-csökkentést (saját VÉcsökk: 0). Az ellene irányuló
        VÉ-csökkentés fix `1 + k20P` (NEM a fegyverviszony-tábla k20P/1+k20P/2+k20P), kiegészülve a Fárasztó taktika
        bónuszával. A lények méretkülönbség-módosítója továbbra is hozzáadódik/levonódik. (A webapp a data `megjegyzés`-ében
        hordozza + a TÉ-chip info popup jelzi; a saját-VÉcsökk tiltás és az 1+k20P nem kalkulált, informatív.)
      Körönként maximum 1 manőver alkalmazható.
      Visszafogott: nem-skálázható taktika. A `-10 TÉ` a `módosítók.TÉ`-ben, a Hátrány-2 sebzésdobás strukturált
      `hatások` listában (`hatás: hátrány, cél: sebzésdobás`). Nem-fokozatos taktika is hordozhat strukturált
      `hatások`-at (nem csak `módosítók` map-et) - a combat-roll-info és aktiv-calc a nem-fokozatos ágon is begyűjti.
      Taktikafókusz: Visszafogott fortély a Visszafogott büntetéseit AKTÍV taktika mellett semlegesíti:
        - TÉ-büntetés: `letilt` a taktika `TÉ`-jére (feltétel: `taktika:visszafogott`) - szám-független, NEM additív +10.
          A `calcTaktikaMods` a `letilt` módú, taktika-feltételes fortély-módosítót felismeri (`collectTaktikaLetiltások`),
          és az adott taktika érintett módosítóját (itt: TÉ) kihagyja az összegzésből.
        - Sebzés-hátrány: `enyhít` a sebzésdobásra (a Hátrány-2-t kioltja, netElőnySzint clamp kezeli).
        - Sebzés = fegyver alapsebzése, nincs dobás: `szöveges` hatás a sebzésdobásra (collectFortélyHatások átengedi).

#### Távharci taktikák

| Taktika | Módosítók | Megjegyzés |
|---------|-----------|------------|
| Kitartott célzás | CÉ:+3 | 1 kör célzás, mozdulatlan. Fortéllyal összesen +7 CÉ. szűrő_harcmodorok: [Íjászat, Lövészet] |
| Lövéskitérés | - | Akrobatika próba lövedék elkerülésére. Fortéllyal +2. Nem kombinálható: Kitartott célzás |
| Páros kétkezes hajítás | `hatások`: `cé_dobás` hátrány −1 | 2 db Célzó dobás Hátrány-1 büntetéssel (gépi: a Célzó popup alapszintje). Kétkezességgel a 2. dobást nem sújtja - szöveges (a popup egy dobást kezel). Nem kombinálható: Kitartott célzás, Lövéskitérés |

#### Taktika mezők (data layer)

- `csoport`: "távharc" (picker-ben külön szekció) vagy üres (közelharci)
- `szűrő_harcmodorok`: string[] - ha nem üres, a taktika CÉ módosítója csak akkor érvényes, ha az aktív távfegyver Harcmodor mezője szerepel a listában. A picker-ben a taktika nem jelenik meg ha a feltétel nem teljesül.
- `megkötések[].típus === 'távfegyver_kategória'` + `mód: 'szükséges'`: taktika disabled ha az aktív távfegyver Kategória mezője nem egyezik az értékkel.

### 21.1b Skálázható taktikák

A `skálázható: true` flag-gel jelölt taktikáknál (Támadó, Védő, Kezdeményező, Támadás erőből) a felső fok korlát
a karakter Harcmodor szintjétől függően nőhet.

Schema: `skálázható: true` + `konstansok.skálázható_taktika_max_fok[]`

Konstansok (konstansok.yaml):
```
skálázható_taktika_max_fok:
  - szint: 6, max_fok: 4
  - szint: 9, max_fok: 5
  - szint: 12, max_fok: 6
```

Kalkuláció:
```
alap_max_fok = def.fokok.length (yaml-ban definiált fokok: mindegyiknél 3)
harcmodor_szint = aktív fegyver harcmodorának szintje
max_fok = MAX(alap_max_fok, legmagasabb küszöb ahol harcmodor_szint >= szint)
```

Ha van `fortély_bővítés` IS (jelenleg nincs ilyen): előbb az fut, UTÁNA a skálázható cap truncál/extend.

Extra fokok módosítói: lineáris extrapoláció az utolsó definiált fok mintájából.
Pl. Támadó: alap 3 fok (TÉ:+1/VÉ:-2 … TÉ:+3/VÉ:-6), Harcmodor 9 → max 5 fok → 4.fok: TÉ:+4/VÉ:-8, 5.fok: TÉ:+5/VÉ:-10.

Implementáció:
- `taktika-helpers.ts` `getExtraFokok()`: harcmodor szint lookup → fokok extend/truncate
- `TaktikaFokPicker.tsx`: extra fokok kék ● jelölés (szín: `--color-kepzettseg`)
- `taktika-calc.ts` `calcTaktikaMods()`: `interpolateFokDef` with `hasBővítés = !!def.skálázható`
- `getTaktikaMods()`: ugyanígy, Aktív fül chip módosítók kijelzése

### 21.2 Harci Helyzetek

Harci helyzetek speciális Státuszok, amelyek Hatásokat okoznak (080_hatasok_es_statuszok.md).
Feltétel kulcs: `harci_helyzet:id`. Az Aktív fülön kiválaszthatók (picker overlay, csoportosítva).

Data layer: `data/sources/harci_helyzetek.yaml` → `tables/harci_helyzetek.json` (40 helyzet)
Schema mezők: név, id, infó, hatások[], csoport, rejtett, tiltja_taktikákat, kizár_helyzetek[], tiltott_fegyverfogások[], fegyver_override (opcionális)

Picker csoportok (csoport mező): "pozitív" (zöld `#4caf50`), "semleges" (narancs `#ff9800`), "negatív" (piros `#f44336`), "távharc"
Rejtett elemek (rejtett: true): nem jelennek meg a picker-ben (automatikus/levezetett).
A táblák a `harci_helyzetek.json` kivonatai (a hatás-szöveg az `infó` mező); a gépi hatások a `hatások[]`-ban.

#### Pozitív helyzetek (065_01_01)

| Helyzet | id | Infó (data: `infó`) |
|---------|-----|---------|
| Beszorított ellenfél | ellenfél_beszorított | Előny+1 TÉ dobásra. |
| Beszorított ellenfél - hosszú fegyverrel | ellenfél_beszorított_hosszú_fegyverrel | Előny+2 TÉ dobásra. |
| Hátulról támadás | hátulról | Előny+1 TÉ dobásra. Pajzs VÉ NEM számít. |
| Láthatatlan - részlegesen | láthatatlan_részlegesen | Előny+1 TÉ, VÉ csökkentés: +1, VÉ: +5. Ellened Fárasztó nem alkalmazható. |
| Láthatatlan - teljesen | láthatatlan_teljesen | Előny+2 TÉ, VÉ csökkentés: +2, VÉ: +10. Ellened Fárasztó nem alkalmazható. |
| Levegőből támadás | levegőből | Előny+2 TÉ dobásra. Roham pluszban. Fárasztó taktika OK. |
| Magasabbról | magasabbról | Előny+1 TÉ dobásra. |
| Meglepetés | meglepetés | Előny+1 TÉ; VÉ csökkentés: +2 |
| Orvtámadás | orvtámadás | Előny+2 TÉ;  Áldozat VÉ: Közelharc Puszta kézzel |
| Lovas harc | lovas_harc | Lóhátról harcolás. Lovas harc fortély bónuszok aktívak. |
| Léglovas harc | léglovas_harc | Repülő hátas hátáról harcolás. Léglovas harc fortély bónuszok aktívak. |
| Harci szekér | harci_szekér | Szekérről harcolás. Harci kocsihajtas fortély bónuszok aktívak. |
| Páros harc | páros_harc | Koordinált 2 fős harc. Páros harc fortély bónuszok aktívak. |
| Közönség előtt | közönség_előtt | Gladiátori harc közönség előtt. Gladiátor fortély bónuszok aktívak. |

#### Semleges helyzetek (065_01_02)

| Helyzet | id | Infó (data: `infó`) |
|---------|-----|---------|
| Belharci helyzet | belharci_helyzet | Közelharc harcmodor + max 1 fegyverhossz. Belharcos fortély bónuszok. Egyéb fegyver: fegyver TÉ/VÉ=0. |
| Fegyverrántás váratlanul | fegyverrántás | KÉ módosítók fegyverméret szerint. Fegyverrántás fortély skálázza. |
| Közrefogás | közrefogás | Semlegesíti ellenfél Fegyverelőnyét → Fegyverazonosság. |
| Vadállatok elleni harc | vadállatok | Informatív: Közelharc + Belharcos 2.fok bónuszai relevánsak. |
| Takarásban harcolás | takarásban | Hátrány-1 TÉ, VÉ: +5. |
| Védő Érték kiterjesztése másra | vé_kiterjesztés | Többszörös támadás elvesztése, VÉ veszteség duplázódik. Testőr fortély mérsékli. |
| Szörnyeteg elleni harc | szörnyeteg_elleni_harc | Bestia/szörny elleni küzdelem. Gladiátor fortély bónuszok aktívak. |

#### Negatív helyzetek (065_01_03)

| Helyzet | id | Infó (data: `infó`) |
|---------|-----|---------|
| Csúszós talaj | csúszós_talaj | Hátrány-1 Támadó dobásra. |
| Elvesztett egyensúly | elvesztett_egyensúly | Hátrány-1 Támadó dobásra, többsz. tám. elvesztés, mozgás feleződik. Akrobatika(12) megoldja. |
| Földön fekve | földön_fekve | Hátrány-2 TÉ dobásra, VÉ veszteség duplázódik. |
| Helyhez kötve | helyhez_kötve | Hátrány-1 TÉ dobásra, VÉ veszteség duplázódik. |
| Lények méret különbsége | méret_különbség | Méretkülönbség [0-6] fokozat: +1 VÉ csökkentés / különbség. |
| Gyengébb kéz | gyengébb_kéz | Hátrány-1 Támadó dobásra. Kétkezesség fortély kioltja. |
| Vakharc - félhomályban | vakharc_félhomály | Hátrány-1 TÉ dobásra. Vakharc fejlesztése/Infralátás/Ultralátás mérsékli. |
| Vakharc - sötétben | vakharc_sötétben | Hátrány-2 TÉ dobásra. Vakharc fejlesztése/Infralátás/Ultralátás mérsékli. |
| Tűz ruhán - ég | tűz_ruhán_1 | Hátrány-1 Támadó dobásra, (-5+k20) SP/kör. Eloltás: 1 kör. |
| Tűz ruhán - lángol | tűz_ruhán_2 | Hátrány-2 Támadó dobásra, (0+k20) SP/kör. Eloltás: harcban lehetetlen, kívül 2 kör + segítség. |
| Vér elvakít | vér_elvakít | Hátrány-1 Támadó dobásra, Hátrány-1 Érzék(Látás). 1 Akció: kitörlés. |

#### Távharci helyzetek

| Helyzet | id | Infó (data: `infó`) |
|---------|-----|---------|
| Hajítás alkalmatlan fegyverrel | hajítás_alkalmatlan_fegyverrel | Hátrány-2 Sebzésdobás, Hátrány-2 CÉ, Fegyver CÉ=0, SP: fegyver-5. Fortély mérsékli. |
| Hajítás nem dobásra készített tárgyakkal | hajítás_nem_dobásra_készített | Hátrány-1 Sebzésdobás, Hátrány-1 CÉ, Fegyver CÉ=0, SP:(-5+k20). Fortély mérsékli. |
| Lövés reflexből | lövés_reflexből | Váratlan lövés/hajítás. Hátrány-1 CÉ dobásra. Lövés reflexből fejlesztése fortély kioltja. |
| Nyílpuska újratöltés | nyílpuska_újratöltés | Nyílpuskával csak minden 2. körben lehetséges lőni. |

#### Rejtett (automatikus, nem picker-ben)

| Helyzet | id | Infó (data: `infó`) |
|---------|-----|---------|
| Képzetlen fegyverhasználat | képzetlen_fegyverhasználat | Harcmodor 3.szint alatti: lásd Harcmodor képzettség büntetések. |
| Fegyverelőny | fegyverelőny | VÉ csökkentés: 2+k20P. |
| Fegyverhátrány | fegyverhátrány | VÉ csökkentés: k20P. |
| Pusztakezes harc | pusztakezes_harc | Negatív fegyver harcértékek. Természetes fegyver fortély segít. |

#### Kombinálási/tiltási szabályok

Data layer mezők:
  tiltja_taktikákat: bool - ha true, ÖSSZES taktika disabled amíg ez a helyzet aktív.
    Implementált: Orvtámadás (true). Hozzáadáskor aktív taktikák automatikusan törlődnek.
  kizár_helyzetek: string[] - id-kat tartalmaz. Ezen helyzetek nem adhatók hozzá / eltávolítódnak hozzáadáskor.
    Pl. Orvtámadás → ["hátulról", "meglepetés", "lovas_harc", "léglovas_harc", "harci_szekér"]
    Többfokú helyzetek: kölcsönösen kizárják egymást (vakharc_félhomály/sötétben, tűz_ruhán_1/2,
    láthatatlan_részlegesen/teljesen, hajítás_*, ellenfél_beszorított / _hosszú_fegyverrel)
  Taktika megkötések (taktikak.yaml → megkötések[]):
    Fárasztás: harci_helyzet/tiltott/Fegyverhátrány,
              harci_helyzet/tiltott/Láthatatlan - részlegesen,
              harci_helyzet/tiltott/Láthatatlan - teljesen
    (Lég)Lovas roham, (Lég)Lovas támadás galoppból: harci_helyzet/szükséges/[lovas_harc, léglovas_harc]
    Roham, Öngyilkos roham: harcmodor/tiltott/Ostorharc + harci_helyzet/tiltott/Lovas harc, Léglovas harc
    Támadó: harci_helyzet/tiltott/Orvtámadás · Védő: …/Meglepetés, Orvtámadás · Támadás erőből: harcmodor/tiltott/Ostorharc
    1 támadás: támadások/min/2
    Kiértékelt típusok (taktika-megkotes.ts): harci_helyzet (tiltott/szükséges), harcmodor (tiltott), támadások (min),
    távfegyver_kategória (szükséges). Informatív (nem kiértékelt): többes_harc (Kiváró), per_küzdelem (Öngyilkos roham max 1).

### 21.4 Manőverek

Egy körben max 1 aktív manőver. MP költséggel hajtható végre. Nehézség [2;12].
Fázisok: M=Megakasztás, V=Végrehajtás, E=Ellenpróba.

#### Általános manőverek (066_05)

| Manőver | id | Nehézség | Fázisok |
|---------|-----|---------|---------|
| Átsiklás | átsiklás | 6 | E |
| Áttörés | áttörés | 5 | M,V,E |
| Csonkolás (kéz) | csonkolás_kéz | 8 | V,E |
| Csonkolás (láb) | csonkolás_láb | 10 | V,E |
| Ellenfél elfogása | ellenfél_elfogása | 10 | V,E |
| Fegyvertörés | fegyvertörés | 12 | V,E |
| Felállás földről | felállás_földről | 6 | M,E |
| Forgószél | forgószél | 7 | V,E |
| Földrevitel | földrevitel | 8 | V,E |
| Kibontakozás | kibontakozás | 5 | E |
| Lábkirántás szálfegyverrel | lábkirántás_szálfegyverrel | 6 | V,E |
| Lánccsapda | lánccsapda | 9 | V,E |
| Lánccsapdából szabadítás | lánccsapdából_szabadítás | 7 | E |
| Lefegyverzés | lefegyverzés | 10 | V,E |
| Leütés hátulról | leütés_hátulról | 6 | V,E |
| Mesterjel | mesterjel | 10 | V,E |
| Mögékerülés | mögékerülés | 8 | E |
| Pajzzsal felöklelés | pajzzsal_felöklelés | 7 | V,E |
| Piszkos trükk | piszkos_trükk | 7 | V,E |
| Precíz támadás | precíz_támadás | 6 | V,E |
| Rávetődés hátulról | rávetődés_hátulról | 6 | E |
| Távoltartás | távoltartás | 5 | M,E |
| Terelés | terelés | 8 | E |

#### Belharcos manőverek (066_06)

| Manőver | id | Nehézség | Fázisok |
|---------|-----|---------|---------|
| Átdobás | átdobás | 7 | V,E |
| Belharcba kerülés | belharcba_kerülés | 9 | M,E |
| Belharcból kibontakozás | belharcból_kibontakozás | 5 | M,E |
| Feszítés, Leszorítás | feszítés_leszorítás | 8 | V,E |
| Feszítésből kijövetel | feszítésből_kijövetel | 8 | V,E |
| Gáncsolás | gáncsolás | 7 | V,E |
| Kéztörés | kéztörés | 9 | V,E |
| Lábtörés | lábtörés | 10 | V,E |
| Lefejelés | lefejelés | 7 | V,E |
| Leforgatás/Irányítás | leforgatás_irányítás | 10 | V,E |
| Nyaktörés | nyaktörés | 12 | V,E |

#### Lovas manőverek (066_07, §38)

| Manőver | id | Nehézség | Fázisok |
|---------|-----|---------|---------|
| Hátas táncoltatása | hátas_táncoltatása | 0 | M |
| Lóhátról lerántás | lóhátról_lerántás | 6 | M,V,E |
| Lovas áttörés | lovas_áttörés | 4 | V,E |
| Lovas megakasztása | lovas_megakasztása | 4 | M,E |

A táblák a `manoverek.json` kivonatai (alap Nehézség). A követelmények (Normál/Erős), a helyzetfüggő
módosítók és a hatások a `manoverek.yaml`-ban és a szabálykönyvben (md/066_05 - 066_07) élnek.

note: A manőverek nem adnak statikus harcérték módosítókat - ellenpróba alapúak (Manőver Alap + MP + k10 vs Nehézség + ellenfél Manőver Alap).
      Kivétel: fortélyok amik manőver Ellenpróba bónuszt adnak (cél: `manőver:<id>`, mód: flat, +2):
        - Manőverfókusz: Fegyvertörés / Földrevitel / Lefegyverzés → az azonos nevű manőver
        - Manőverfókuszok: Szike → leütés_hátulról, precíz_támadás
        - Manőverfókuszok: Belharcmozgás (belharcba_kerülés, belharcból_kibontakozás),
          Helyezkedések (mögékerülés, terelés), Kitörés (áttörés, felállás_földről),
          Nyúlcipő (átsiklás, kibontakozás)
        (Build-validált: a `manőver:X` cél X-e létező manőver id.)
      UI: AktivScreen Hatás pool "Manőver bónuszok" szekció gyűjti ezeket.
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
    - Max 1 fegyverhosszú fegyver (tőr, kés, puszta kéz) - tiltás `belharc_fegyverhossz`
      Kivétel: a `pancelszuras_belharcban` extrás fegyver (Tőr, páncélszúró) - az extra feloldja a tiltást
    - Közelharc harcmodor - tiltás `belharc_harcmodor`
    - Puszta kéz harcértékei: TÉ=0, VÉ=0, SP=0, sebzés FP (1ÉP/5FP) - a Puszta kéz `puszta_kez_belharcban`
      extrája (feltétel: Belharci helyzet, hatás: TÉ/VÉ/SP override 0, alcél felszerelés:fegyver).
      Természetes fegyver fortéllyal az SP alap 1 marad (a fortély-SP override elsőbbsége, `calcSpOverride`).

  Nem belharcos (aki belekényszerül):
    - Saját harcmodor értékei maradnak (harcmodor bónusz jár)
    - Nem belharcos fegyverek (pl. kard): fegyver TÉ=0, VÉ=0 (testközelben nem forgatható)
    - Fegyver bármikor elejthető

  - Belharcos manőverek (Belharcba kerülés kivételével) mind előfeltételnek követelik a helyzetet

#### Fegyver override mechanizmus (harci helyzet → fegyver harcértékek nullázás)

Egyes harci helyzetek (`harci_helyzetek.yaml`) tartalmazhatnak `fegyver_override` mezőt, ami a fegyverek alapértékét cseréli (pl. Belharc: a túl hosszú fegyver TÉ/VÉ = 0). A kiértékelés **soronként** (kétkezesnél **kezenként**) történik: minden fegyver a SAJÁT hossza / harcmodora / extrái szerint - a feltétel a helyzet nevesített tiltására hivatkozik (§42.4 tiltás-keret).

```yaml
# harci_helyzetek.yaml példa:
- név: "Belharci helyzet"
  id: "belharci_helyzet"
  tiltások:
    - { id: "belharc_fegyverhossz", leírás: "Max 1 fegyverhossz-kategória",
        feltétel: [{ forrás: "fegyver.fegyverhossz", operátor: ">", érték: 1 }] }
    - { id: "belharc_harcmodor", leírás: "Közelharc harcmodor kötelező",
        feltétel: [{ forrás: "fegyver.harcmodor", operátor: "!=", érték: "Közelharc" }] }
  fegyver_override:
    feltétel:
      - { forrás: "tiltás:belharc_fegyverhossz", operátor: "==", érték: true }
    módosítók:
      - { cél: "TÉ", alcél: "felszerelés:fegyver", érték: 0, mód: "override" }
      - { cél: "VÉ", alcél: "felszerelés:fegyver", érték: 0, mód: "override" }
```

Kiértékelés (`engine/effekt.ts → tiltásokFegyverre / fegyverOverrideÉrtékek`; fogyasztók: `calcFegyverResults(…,
alapOverride)` soronként - az alapérték a reactive számítás ELŐTT cserélődik, utána a fortély-SP override -,
`calcKétkezesHarc({alapOverride})` kezenként; a sor tiltásait a `jelölFegyverTiltások` írja a `FegyverResult.tiltások`-ba):
```
FOR EACH fegyver (sor / kéz):
  tiltások = a helyzetek tiltásai, amelyek feltétele erre a fegyverre teljesül
             MÍNUSZ amit a fegyver extrája feloldott ({cél: "tiltás:<id>", mód: letilt}, teljesült extra-feltétellel)
  feltétel-halmaz = aktívFeltételek (globális tiltás-kulcsok nélkül) + "tiltás:<id>" a fegyver saját tiltásaira
  FOR EACH aktív helyzet, ahol feltételTeljesül(fegyver_override.feltétel):
    FOR EACH mod (mód override, alcél felszerelés:fegyver):   // §42.3 bázis-csere
      alap_<cél> → mod.érték
  FOR EACH a fegyver BIZTOSAN aktív extrájának hatása (mód override, alcél felszerelés:fegyver, al-feltétel nélkül):
      alap_<cél> → hatás.érték   // pl. Puszta kéz belharcban: TÉ/VÉ/SP 0 (több override: az utolsó)
  fegyver_alap_TÉ/VÉ/SP = a csere utáni alap → reactive fegyver_TÉ/VÉ/SP; Puszta kéz SP: Természetes fegyver felülír
  sor.tiltások = a fegyver aktív tiltás-id-i (fegyvertábla ⚠ jelzés)
```

Data layer (`data-types.ts → HarciHelyzetEntry`):
```typescript
fegyver_override?: {
  feltétel: { forrás: string; operátor: string; érték: unknown }[];
  módosítók: { cél: string; érték: number; mód: string }[];
};
```

note: A Kétkezes harc összesítő sorra is alkalmazódik (calcKetkezes → ugyanaz a loop).

#### Fegyver-járulék post-szorzó (Beszorítva, md/065_03_03)

A `fegyver_override`-tól eltérő, rokon mechanika. A „fegyver TÉ/VÉ feleződik / nullázódik" büntetés
(Beszorítva harci helyzet) NEM a teljes TÉ/VÉ-re hat, hanem csak a **fegyver-járulékra**:

```
fegyver_járulék = fegyver alap hossz-járulék (alap_TÉ/VÉ) + Mesterfegyver + Idea
```

A karakter saját része (bázis, tulajdonság, harcmodor-szint, harci fortélyok) **érintetlen**.

```
FOR EACH cél ∈ {TÉ, VÉ}:
  rész = alap_<cél> + mf_<cél> + idea_<cél>          // a fegyver-járulék
  <cél> = <cél> - rész + alkalmazEffektek(rész, hatások)   // FLOOR (§42.3)
```

- Alcél: `fegyver_járulék` (`extrak.schema.yaml` `alcel_felszereles_enum`), szemben a `fegyver`
  bázis-csere alcéllel (az a reactive ELŐTT cseréli az alapot, ez UTÁNA szorozza a járulékot).
- Forrás: a `Beszorítható enyhén` (hossz 5 → járulék `szorzó 0.5`) / `Beszorítható nagyon`
  (hossz 7+ → járulék `override 0`) fegyver-extrák, `harci_helyzet:beszorítva` feltétellel.
  A Beszorítva helyzetnek magának nincs `hatások`-ja - a büntetés fegyverenként az extrákból jön.
- Kiértékelés: `fegyver-calc.ts` `járulékHatásSorra` (per-fegyver, kézenként), a hatás-precedencia
  az `extrak-effekt.ts` `alkalmazEffektek`-je (§42.3).

---

## §22 Státuszok és Hatások

Forrás: md/080_hatasok_es_statuszok.md, md/081_hatasok.md, md/082_statuszok.md

### 22.1 Modell (4 réteg)

| Réteg | Fájl / Forrás | Leírás |
|-------|------|--------|
| **Hatás mechanika** | `konstansok.yaml → effekt_módok` | Egységes effekt-módok (§42.2): flat, szorzó, override, max_limit, előny, hátrány, enyhít, letilt, szöveges, scaled |
| **Célpontok** | `esemenyek.yaml` | Amire a hatás mechanika vonatkozhat (23 db): dobások, képességek, fizikai |
| **Hatások** | `hatasok.yaml` (29 db, csak build-validáció, §22.4) | Elnevezett, magas szintű játékfogalmak: "Vérzés - erős", "Mozgás - képtelen", "VÉ veszteség duplázódik" stb. Minden Hatás = 1+ mechanika+cél kombináció. |
| **Státuszok** | `statuszok.yaml` (19 db) | Állapotok fokozatokkal, amelyek Hatás(oka)t okoznak. |
| **Harci helyzetek** | `harci_helyzetek.yaml` (40 db) | Speciális harci státuszok, amelyek szintén Hatás(oka)t okoznak. |

A lánc: **Státusz/Harci helyzet** → okoz **Hatás(oka)t** → minden Hatás leírható **mechanika+cél** párral.

#### Terminológia tisztázás

| Fogalom | Régi elnevezés (data) | Helyes jelentés |
|---------|----------------------|-----------------|
| Hatás mechanika típusok | `mód` (konstansok.yaml → effekt_módok) | Hogyan hat (kocka reroll, szorzó, letilt, max korlát) - a 2026-10-16 előtti `hatas_operatorok.yaml` réteg megszűnt (§42.7) |
| Célpontok | "események" (esemenyek.yaml) | Mire vonatkozik a mechanika (TÉ dobás, Mozgás, Varázslás képesség) |
| **Hatások** | `hatasok.yaml` (build-validációs katalógus) | Magas szintű, elnevezett hatáscsomagok a szabályrendszerből (081_hatasok.md). Pl. "Harcképtelenség" = letilt(harci_képesség) + minden támadás ellened automatikusan sebző. CSAK build-validáció olvassa, a runtime nem (l. §22.4). |
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

### 22.2 Hatás mechanika típusok (`mód`)

Minden hatás-forrás (helyzet, státusz, taktika, `hatasok.yaml`, fortély, extra) ugyanazt a `mód` kulcsot
használja, a `konstansok.yaml → effekt_módok` enumból (§42.2). A korábbi `hatas_operatorok.yaml` operátor-réteg
(`duplázás`/`arányos` → `szorzó`, `halmozás: legnagyobb`) 2026-10-16-án megszűnt: a duplázás `{mód: szorzó, érték: 2}`,
a felezés `{mód: szorzó, érték: 0.5}`; a halmozás globális szabály (§42.3). A megjelenítési név (Duplázás/Felezés)
a mód + érték párosból adódik.

### 22.3 Célpontok (esemenyek.yaml)

```yaml
célpontok:  # (yaml-ban: események - legacy elnevezés)
  # harci: ké_dobás, té_dobás, cé_dobás, manőver_ellenpróba, sebzésdobás, támadások_száma, vé_veszteség, vé_csökkentés
  # próba: tulajdonságpróba, képzettségpróba, szociális_próba, szellemi_próba, fizikai_próba, érzék_próba, mágiaellenállás, mágia_akarata
  # fizikai: mozgás, beszéd
  # képesség: harci_képesség, varázslás, pszi, antyssjárás
  # egyéb: általános
```

### 22.4 Hatások (hatasok.yaml)

Elnevezett, magas szintű hatáscsomagok (081_hatasok.md). Forrás: `data/sources/hatasok.yaml`.
Minden Hatás leírható mechanika+cél párokkal.

STÁTUSZ (fontos): a `hatasok.yaml` jelenleg CSAK build-validációs/dokumentációs réteg.
  - NEM generál JSON-t és a webapp NEM tölti be (`aktiv_ful.py` - csak a `validate_hatasok_katalogus`
    olvassa build-időben: minden hatás `mechanika`-ja érvényes `mód` (effekt_módok) + `esemenyek` id-re mutat).
  - A RUNTIME lánc NEM ezen megy át: a `statuszok.yaml`/`harci_helyzetek.yaml` KÖZVETLENÜL a
    `mód` (előny/hátrány/szorzó/…) + `esemenyek` (cél: té_dobás/…) értékeket hivatkozza,
    NEM a `hatasok.yaml` nevesített id-ket (előny_1, mozgás_feleződik, …). A köztes "nevesített hatás"
    réteg jelenleg nincs bekötve a futó rendszerbe.
  - A katalógus tartalma UP-TO-DATE a szabálykönyvvel (081_hatasok.md): 1:1 lefedés (29 hatás),
    nevek + mechanika-leírások egyeznek. A build-validáció tartja szinkronban.
  - Jövő: a nevesített hatás-réteg a §42 egységes effekt-modell runtime fogyasztójának van előkészítve
    (akkor válik a statusz→hatasok.yaml→mechanika lánc élővé).

| id | Hatás neve | Mechanika | Cél | Leírás |
|----|-----------|-----------|-----|--------|
| előny_1 | Előny+1 | előny +1 | (változó) | 2x dob, nagyobb számít |
| előny_2 | Előny+2 | előny +2 | (változó) | 3x dob, legnagyobb számít |
| hátrány_1 | Hátrány-1 | hátrány -1 | (változó) | 2x dob, kisebb számít |
| hátrány_2 | Hátrány-2 | hátrány -2 | (változó) | 3x dob, legkisebb számít |
| automatikus_kudarc | Automatikus kudarc | letilt | próbák | Nem dobhatsz, azonnali kudarc |
| automatikus_próba | Aut. próba | szöveges | - | Aut. siker → sima próba |
| beszéd_zavart | Beszéd - zavart | szöveges | beszéd | Nehézkes, mágiánál extra próba |
| beszéd_némult | Beszéd - némult | letilt | beszéd | Hangkiadás képtelen |
| érzék_zavart | Érzék - zavart | hátrány -1 | érzék_próba | Adott érzékre |
| érzék_részleges | Érzék - részleges | hátrány -2 | érzék_próba | Adott érzékre |
| érzék_kioltott | Érzék - kioltott | letilt | érzék_próba | Aut. kudarc érzékpróbára |
| antyssjárás_elvesztése | Antyssjárás elvesztése | letilt | antyssjárás | Nem lép be Antyss síkra |
| fp_s1 | FP S1 | szöveges | - | S1 rubrikák FP feltöltés |
| fp_s2 | FP S2 | szöveges | - | S1+S2 rubrikák FP feltöltés |
| harcképtelenség | Harcképtelenség | letilt | harci_képesség | Mozog, nem harcol |
| mozgás_feleződik | Mozgás - feleződik | arányos 0.5 | mozgás | Feleződik |
| mozgás_lecövekelt | Mozgás - lecövekelt | letilt | mozgás | Helyváltoztatás képtelen |
| mozgás_képtelen | Mozgás - képtelen | letilt | mozgás+harci | Nyaktól lefelé mozdulni sem |
| pszi_elvesztése | Pszi elvesztése | letilt | pszi | Diszciplínák használhatatlan |
| támadás_elvesztés_1 | 1 támadás elvesztése | szöveges | támadások_száma | -1 támadás (min 1) |
| támadás_elvesztés_többszörös | Többsz. tám. elvesztés | max_limit 1 | támadások_száma | Max 1 tám/kör |
| varázslás_elvesztése | Varázslás elvesztése | letilt | varázslás | Mágia végzése képtelen |
| vé_veszteség_duplázódik | VÉ veszteség dupl. | duplázás 2 | vé_veszteség | Elszenvedett VÉ veszt. ×2 |
| vé_csökkentés_bónusz | VÉ csökk bónusz | szöveges | vé_veszteség | +1..+2 bónusz |
| vé_csökkentés_fix | VÉ csökkentés: X | szöveges | vé_veszteség | Fix VÉ csökkentés |
| vérzés_gyenge | Vérzés - gyenge | szöveges | - | 1 ÉP / 10 perc |
| vérzés_közepes | Vérzés - közepes | szöveges | - | 1 ÉP / 2 kör |
| vérzés_erős | Vérzés - erős | szöveges | - | 1 ÉP / kör |

### 22.5 Státusz struktúra (statuszok.yaml)

```yaml
státuszok:
  - név: "Blokkolt"
    kategória: "mágikus"          # fizikai | szellemi | mágikus
    többszörös: false             # true = több példány egyszerre
    alkategóriák: []              # pl. Érzékvesztés: érzékenként
    fokok:
      - fok: 1
        alcím: "Közepesen"
        hatások:                   # strukturált lista: mechanika + érték + cél
          - { hatás: "hátrány", érték: -1, cél: "té_dobás" }
          - { hatás: "arányos", érték: 0.5, cél: "mozgás" }
      - fok: 2
        alcím: "Erősen"
        hatások:
          - { mód: "hátrány", érték: -2, cél: "té_dobás" }
          - { mód: "szorzó", érték: 0.5, cél: "mozgás" }
```

Hatás objektum mezői:
- `mód`: effekt-mód (kötelező, konstansok.yaml → effekt_módok)
- `érték`: szám (opcionális, mód-függő)
- `cél`: célpont id (kötelező, esemenyek.yaml-ból VAGY csupasz harcérték-cél: konstansok.yaml → harcérték_célok)
- `megjegyzés`: string (opcionális, kontextuális kiegészítés)

### 22.6 Session

`session.aktív_státuszok: string[]` - formátum: `"Státusznév (fok)"`, pl. `"Félelem (2)"`

### 22.7 Webapp megjelenítés

- Aktív fülön: dropdown-ból választható (státusz név + fok + alcím)
- Chip megjelenítés: "Félelem (2) - Rettegés" + ✕ törlés
- Koppintás (Játék mód): hatások listája lenyílik (accordion)

### 22.8 Hatás pool (Aktív fül) - "Státuszok" szekció

Per-státusz és per-taktika megjelenítés (nem aggregált):

Formátum:
- **Taktika neve (fok)** halvány kék (`#90caf9`) - alatta soronként a hatásai
- **Státusz név (fok) alcím** gesztenye/bordó (`#cd7c6f`) - alatta soronként a hatásai fehéren

Hatás sor formázás:
- `szöveges`: csak a `megjegyzés` szöveg (cél nem jelenik meg)
- `letilt`: "❌ Letiltva: {cél név}"
- `előny`/`hátrány`: "Előny+N: {cél név}" / "Hátrány-N: {cél név}"
- `duplázás`/`arányos`: "×N: {cél név}"
- `max_limit`: "max N: {cél név}"
- `enyhít`: "Enyhítés+N: {cél név}"

note: A pool informatív - a KM alkalmazza. Nincs aggregáció (minden státusz/taktika saját blokkban).

### 22.9 Validáció (build-time)

- `validate_hatasok()`: mechanika típus id egyediség, kötelező mezők, mód enum
- `validate_esemenyek()`: célpont id egyediség, kötelező mezők, csoport enum
- `validate_statuszok()`: referenciális integritás (hatás → mechanika id, cél → célpont id)

- `validate_hatasok_katalogus()`: a hatasok.yaml mechanikái érvényes operátor + célpont id-re mutatnak

note: `státusz:` feltétel prefix: a konstansok.feltétel_prefixek része, de a harc-oldali aktívFeltételek Set
      NEM tölti fel (a státuszok a próba-EH ágon és a vé_veszteség szorzóban hatnak) - jövőbeli.

### 22.10 Fortély módosítók és Hatás mechanika kapcsolata

Két párhuzamos rendszer - szándékosan elkülönített:

| Rendszer | Cél referencia típus | Mechanizmus | Példa |
|----------|---------------------|-------------|-------|
| Fortély `módosítók` (flat/scaled/előny) | Harcértékek: `TÉ`, `VÉ`, `KÉ`, `SP`, `harckeret`, képzettségnevek | Fix numerikus módosítók, reactive engine számol | Mesterfegyver: TÉ:+3 |
| Fortély `módosítók` (enyhít) | `esemenyek.yaml` id-k | Státusz/Helyzet Hatásainak csökkentése | Testőr: vé_veszteség enyhít |
| Státusz/Helyzet `hatások[]` | `esemenyek.yaml` id + `mód` (effekt_módok) | Előny/Hátrány kocka-reroll + letilt/szorzó | Félelem(2): hátrány -2 té_dobás |

A fortély `mód: "enyhít"` az egyetlen pont ahol a két rendszer találkozik:
- A fortély az `esemenyek.yaml` id-jével hivatkozik a célpontra
- A Státusz/Helyzet `hatások[]` ugyanazt az id-t célozzák
- Az enyhítés csökkenti a célra vonatkozó negatív hatás fokát

Cél referencia konvenció:
- Harcértékek (nagybetűs): `TÉ`, `VÉ`, `KÉ`, `CÉ`, `SP`, `SFÉ` → fortély flat/scaled módosítók céljai
- Dobások/képességek (snake_case): `té_dobás`, `vé_veszteség`, `mozgás` → esemenyek.yaml id-k (Hatás mechanika + enyhít)
- Speciális engine változók: `harckeret`, `fegyverhossz`, `MGT_TÉ_büntetés` → csak fortély flat
  (a `fegyverhossz` a Lovas/Léglovas harc fortély "Fegyverméretre +2" bónusza, l. lovas_harc.md;
  az `MGT_TÉ_büntetés` a Merevvértviselet merevvért-TÉ-büntetés csökkentése).
  A pajzs TÉ büntetés NEM fortély-cél, hanem a pajzs_hatások 2D tábla (§13).
- Manőver célok: `manőver:{id}` → fortély bónuszok manőverekhez


---

## §23 Több támadás TÉ levonás

Ha egy fegyverrel >1 támadás lehetséges (harckeret/sebesség alapján), minden támadásra fix TÉ levonás jár.

```
konstansok.több_támadás_TÉ_levonás: -3
```

Alkalmazás: `fegyver_támadások > 1` → TÉ + több_támadás_TÉ_levonás (megjelenítési rétegben: HarcFegyverTable
→ computeTÉ, HarcScreen, harc-reszletek-calc; NEM a fegyver_TÉ reactive szabályban).
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

Érintett fortélyok (fortelyok.json, strukturált feltételű módosítók):
- Merevvértviselet fok 3 (VÉ): `páncél_merev == true` ÉS `páncél_lefedettség >= 70`
- Kétkezesség fok 1 (harckeret): `kétkezes_harc == true`
- Belharcos fok 1-2 (KÉ/TÉ/VÉ): `harci_helyzet:belharci_helyzet == true` ÉS `tiltás:belharc_harcmodor == false`
  ÉS `tiltás:belharc_fegyverhossz == false`. A TÉ/VÉ/SP/harckeret fortély-módosítók SORONKÉNT értékelődnek ki
  (`useHarcComputed` → `calcFegyverResults(…, fortélyModsSorra)`): a `fegyver_kategória:` és `tiltás:` kulcsok a sor
  fegyverére vonatkoznak (Belharcos: csak a nem tiltott sor; Pajzshasználat `fegyver_kategória:pajzs`: csak a pajzs sora).
  A KÉ és a kétkezes eredmény a kézben lévő fegyver(ek) kulcsaival (kétkezesnél bármelyik kéz tiltása elég, §42.4)

### Session toggle fortélyok

Fortély yaml-ban `session_toggle: true` → Aktív fülön toggle gomb jelenik meg.
A fortély TÉ/VÉ módosítói csak akkor aktívak, ha a session toggle be van kapcsolva.
A manőver bónusz módosítók mindig aktívak (toggle-től független).

Session kulcs: `fortély_név.toLowerCase().replace(/ /g, '_')` (pl. `harci_akrobatika`).

Jelenlegi session_toggle fortélyok:
- Harci akrobatika → `session.harci_akrobatika` (TÉ/VÉ flat +1/+2/+3 fokonként). A toggle a fortély AKTUÁLIS fokának fegyver v2 követelményeiből (fok-függő) tilt: `páncél_hajlékonyság` (1-2. fok: nem_fém, 3. fok: nem_merev), `max_effektív_mgt` (1-2. fok: 5, 3. fok: 10, Erő-korrigált MGT-n), `max_össz_fegyverméret` (3). Hiányzó feltétel → hint (SessionToggles.tsx). Lásd §25.

### Feltétel kiértékelés implementáció (engine/feltetel-eval.ts)

A centralizált feltétel-kiértékelő: `engine/feltetel-eval.ts → createFeltételEvaluator(aktívFeltételek, session,
computed, ctx, stringCtx)`, hívója a `harc/useHarcComputed.ts`:

```typescript
// getFeltételÉrték: érték lookup sorrend
function getFeltételÉrték(forrás: string): number | boolean | string | undefined {
  1. aktívFeltételek Set (taktikák, helyzetek, fegyverfogás, fegyver_kategória kulcsok)
  2. session mezők (kétkezes_harc, aktív_pajzs, stb.)
  3. computed (reactive engine eredmények: páncél_merev, páncél_lefedettség, stb.)
  4. ctx (buildContext input értékek)
  5. stringCtx (páncél_alap, páncél_kidolgozottság, aktív_fegyver_harcmodor)
  6. prefix:érték format → false (ha nincs a Set-ben)
}

// feltételTeljesül: string vagy strukturált feltétel
function feltételTeljesül(feltétel: unknown): boolean {
  - üres/"" → true (mindig aktív)
  - string → aktívFeltételek.has(feltétel)
  - lista [{forrás, operátor, érték}] → mindegyik ÉS: getFeltételÉrték(forrás) OP érték
}
```

Az `aktívFeltételek` Set tartalma (`engine/feltetelek.ts → buildAktívFeltételek`):
- `fegyverfogás:{session.fegyverfogás}`
- per aktív taktika: `taktika_def.feltétel_kulcs` (pl. `"taktika:támadó"`)
- per aktív helyzet: `helyzet_def.feltétel_kulcs` (pl. `"harci_helyzet:lovas_harc"`)
- `fegyver_kategória:{aktívFegyverKat}` (useHarcComputed-ban hozzáadva)

## §25 Fortély követelmények

Source of truth a fortélyok yaml `követelmények` mezőjéhez.

Generálás: `generate_tables.py` → `fortelyok.json` (fokok[].követelmények lista átpasszolva).
UI validáció: `fortelyok/helpers.ts → checkKövetelmények` (FortelyRow; runtime ellenőrzés karakter adatok ellen).
A nem gépi feltételek (faj háttér, leíró háttér, társ) a `követelménytext`-ben élnek, nem a `követelmények`-ben.

Szöveges-only build-gate (`data/gen/fortelyok.py`, 2026-10-18): ha egy fok `követelménytext`-je nem üres, de gépi
`követelmények`-e nincs, a fok `követelmény_text_only: true` jelölése kötelező (tudatos döntés: használati feltétel,
körönkénti próba, KM-mérlegelés - Kínokozás 1-2, Körkörös harc 1, Éneklés 1); jelölés nélkül build hiba. A jelölés gépi
követelmény mellett vagy szöveg nélkül szintén hiba (elavult jelölés). A jelölés nem kerül a JSON-ba (az app nem olvassa).

Típusok (felvételi gate):
- `képzettség` - karakter képzettség szintje ≥ érték (név lista → VAGY)
- `fortély` - karakter felvett fortély fokszáma ≥ érték (többszörös fortélynál bármely példány teljesítheti, pl. Nyelvismeret)
- `tiltó_fortély` - a megnevezett fortély megléte (fok ≥ érték) KIZÁRÓ ok
- `faj` - a karakter faja ajánlja a fortélyt legalább `érték` fokig (`{név: "faj", érték: <fok>, típus: "faj"}`, §20)

Név-hivatkozás build-gate (`generate_tables.py → validate_nev_hivatkozasok`): a követelmények és a faj-listák nevei PONTOSAN egy létező fortély / képzettség `név`-ére mutatnak (harcmodor: a `konstansok.harcmodorok` nagy kezdőbetűvel).

Fegyver v2 követelmény-típusok (session-függő, harc-fül kontextus - nem a FortelyokScreen felvételi gate-je):
- `min_fegyverméret` - az aktív fegyver fegyverhossza ≥ érték; `feltétel` mezővel harci helyzethez kötve (pl. `harci_helyzet:lovas_harc`). Webapp: **warning-only** (getMinFegyverhosszWarning), NEM blokkol - a KM/játékos döntése.
- `max_össz_fegyverméret` - a forgatott fegyverek össz fegyverhossza (jobb+bal) ≤ érték.
- `max_effektív_mgt` - az Erő-korrigált páncél MGT ≤ érték.
- `páncél_hajlékonyság` - a viselt páncél struktúra-kategóriája: `nem_fém` (posztó/fegyverkabát/bőr) vagy `nem_merev` (bármely Hajlékony, azaz nem pikkely/lemez).
  A `max_össz_fegyverméret` / `max_effektív_mgt` / `páncél_hajlékonyság` a Harci akrobatika session-toggle-nél **tiltó**: a fortély AKTUÁLIS fokának követelményeiből (fok-függő) letiltja a togglet, a hiányzó feltételeket hint-ben kiírja (SessionToggles.tsx).

Ellenőrzés logika:
- `képzettség`: `karakter.képzettségek.some(k => k.név == név && k.szint >= érték)` - lista típusnál bármelyik egyezés elég (OR)
- `fortély`: `karakter.fortélyok.some(f => f.név == név && f.fok >= érték)` - többszörös fortélynál (pl. Nyelvismeret) bármely példány teljesítheti

**Mesterfegyver követelmény - fegyver-specifikus harcmodor szűkítés:**

A Mesterfegyver fortély yaml-ban a követelmény OR listában az összes közelharci harcmodor szerepel.
A fegyverenkénti ellenőrzés (`harcertekek/helpers.ts → mfKövetelményHiba`, `tavharc/mesterfegyver-calc.ts →
mfKövetelményHiba/Text`) azonban **nem az egész OR listát** vizsgálja, hanem **kizárólag az adott fegyverhez
tartozó harcmodort** (a Fortélyok fül FortelyRow-ja csak a hiány-címkében nevezi meg a fegyver harcmodorát):
- Közelharci fegyver: `fegyver.kategória` → `konstansok.fegyver_kategória_harcmodor[kategória]` lookup
- Távfegyver: `távfegyver.harcmodor` mező közvetlenül (pl. Íjászat, Hajítás, Lövészet)

Tehát: "Kard, hosszú" (kardvívó kategória) MF → csak Kardvívás ≥ X vizsgálat;
"Hosszú íj" (Harcmodor: Íjászat) MF → csak Íjászat ≥ X vizsgálat.
Fallback (ha a fegyver harcmodorja nem határozható meg): az egész OR lista érvényes.

### Követelmények fortélyonként

A `fortelyok.json` kivonata (csak a gépi `követelmények`; "Harcmodor" = bármely közelharci harcmodor:
Közelharc/Kardvívás/Rombolás/Lándzsavívás/Ostorharc, Mesterfegyvernél a fegyver saját harcmodora).

#### Általános fortélyok

| Fortély | Fok | Követelmények |
|---------|-----|---------------|
| Biztos kezű mászó | 1 | Mászás ≥ 6 |
| Gyöngyhalász | 0 | Úszás fortély ≥ 1 |
| Gyöngyhalász | 1 | Úszás fortély ≥ 2 |
| Keresés/rejtés | 1 | Észlelés ≥ 3 |
| Keresés/rejtés | 2 | Észlelés ≥ 3 |
| Kocsihajtás | 1 | Lovaglás/Léglovaglás ≥ 3 |
| Kézműves: Fegyverkovács | 1 | Kovács fortély ≥ 1 |
| Kézműves: Fegyverkovács | 2 | Kovács fortély ≥ 1 |
| Kézműves: Páncélkovács | 1 | Kovács fortély ≥ 1 |
| Kézműves: Páncélkovács | 2 | Kovács fortély ≥ 1 |
| Műhelymester | 1 | Kézművesség ≥ 9 |
| Pók | 1 | Mászás ≥ 6 |
| Suhanó árnyék | 1 | Lopakodás/rejtőzés ≥ 6 |
| Szájról olvasás | 1 | Nyelvismeret fortély ≥ 2 |
| Százarcú | 1 | Álcázás/Álruha ≥ 4 |
| Százarcú | 2 | Álcázás/Álruha ≥ 8 |
| Vezető: Bölcsészprofesszor | 1 | Lexikum ≥ 6 |
| Vezető: Bölcsészprofesszor | 2 | Lexikum ≥ 9 |
| Vezető: Hajóskapitány | 1 | Hajózás ≥ 6 |
| Vezető: Hajóskapitány | 2 | Hajózás ≥ 9 |
| Vezető: Nyomozó | 1 | Nyomozás ≥ 6 |
| Vezető: Nyomozó | 2 | Nyomozás ≥ 9 |
| Vezető: Orvosprofesszor | 1 | Orvoslás ≥ 6 |
| Vezető: Orvosprofesszor | 2 | Orvoslás ≥ 9 |
| Vezető: Rendező | 1 | Előadóművészet ≥ 6 |
| Vezető: Rendező | 2 | Előadóművészet ≥ 9 |
| Vezető: Tudósprofesszor | 1 | Kvantikum ≥ 6 |
| Vezető: Tudósprofesszor | 2 | Kvantikum ≥ 9 |
| Villámgyors keresés/rejtés | 1 | Észlelés ≥ 3; Keresés/rejtés fortély ≥ 1 |
| Zártörő | 1 | Zárnyitás ≥ 6 |

#### Szabad fortélyok

| Fortély | Fok | Követelmények |
|---------|-----|---------------|
| Irodalom | 1 | Kultúrkör fortély ≥ 1; Nyelvismeret fortély ≥ 2 |
| Jogismeret | 1 | NEM: Analfabéta fortély |
| Kalligráfia | 1 | NEM: Analfabéta fortély |
| Különleges faj boncolása | 1 | Élettan fortély ≥ 1 |
| Tánc: speciális/belső stílus | 1 | Etikett ≥ 9; Előadóművészet ≥ 6; Kultúrkör fortély ≥ 1; Tánc fortély ≥ 1 |

#### Harci fortélyok (benne a távharci alcsoport)

| Fortély | Fok | Követelmények |
|---------|-----|---------------|
| Alakzat: támadó | 1 | Harcmodor ≥ 6 |
| Alakzat: támadó | 2 | Harcmodor ≥ 9 |
| Alakzat: védekező | 1 | Harcmodor ≥ 6 |
| Alakzat: védekező | 2 | Harcmodor ≥ 9 |
| Alkalmatlan fegyver hajítása | 1 | Harcmodor ≥ 6; Hajítás ≥ 3 |
| Alkalmatlan fegyver hajítása | 2 | Harcmodor ≥ 9; Hajítás ≥ 6 |
| Alkalmatlan tárgyak hajítása | 1 | Hajítás ≥ 6 |
| Alkalmatlan tárgyak hajítása | 2 | Hajítás ≥ 9 |
| Belharcos | 1 | Közelharc ≥ 6 |
| Belharcos | 2 | Közelharc ≥ 9 |
| Elpusztíthatatlan | 1 | Fájdalomtűrés ≥ 7 |
| Elpusztíthatatlan | 2 | Fájdalomtűrés ≥ 10 |
| Fegyverrántás | 1 | Harcmodor ≥ 4 |
| Fegyverrántás | 2 | Harcmodor ≥ 8 |
| Fárasztás | 1 | Harcmodor ≥ 6 |
| Gladiátor bestiái | 1 | Harcmodor ≥ 6 |
| Gladiátor közönsége | 1 | Harcmodor ≥ 6 |
| Gyors hajítás | 1 | Hajítás ≥ 5 |
| Gyors lövés | 1 | Íjászat ≥ 5 |
| Harci akrobatika | 1 | Akrobatika ≥ 6; páncél: nem_fém; effektív MGT ≤ 5; össz fegyverhossz ≤ 3 |
| Harci akrobatika | 2 | Akrobatika ≥ 9; páncél: nem_fém; effektív MGT ≤ 5; össz fegyverhossz ≤ 3 |
| Harci akrobatika | 3 | Akrobatika ≥ 12; páncél: nem_merev; effektív MGT ≤ 10; össz fegyverhossz ≤ 3 |
| Harci kocsihajtás | 1 | Kocsihajtás fortély ≥ 1; Lovaglás/Léglovaglás ≥ 6 |
| Harci kocsihajtás | 2 | Kocsihajtás fortély ≥ 1; Lovaglás/Léglovaglás ≥ 9 |
| Harckeret növelés | 1 | Harcmodor ≥ 6 |
| Harckeret növelés | 2 | Harcmodor ≥ 9 |
| Harckeret növelés | 3 | Harcmodor ≥ 12 |
| Harcos elme | 1 | Harcmodor ≥ 6 |
| Harcos elme | 2 | Harcmodor ≥ 9 |
| Harcos elme | 3 | Harcmodor ≥ 12 |
| Helyhez kötve fejlesztése | 1 | Harcmodor ≥ 3 |
| Helyhez kötve fejlesztése | 2 | Harcmodor ≥ 6 |
| Kaszabolás | 1 | közelharc/kardvívás/rombolás/lándzsavívás/ostorharc ≥ 4 |
| Kaszabolás | 2 | Harcmodor ≥ 8 |
| Lovas harc | 1 | Harcmodor ≥ 6; Lovaglás ≥ 6; fegyverhossz ≥ 3 (harci_helyzet:lovas_harc) |
| Lovas harc | 2 | Harcmodor ≥ 9; Lovaglás ≥ 9; fegyverhossz ≥ 3 (harci_helyzet:lovas_harc) |
| Lovas harc | 3 | Harcmodor ≥ 12; Lovaglás ≥ 12; fegyverhossz ≥ 3 (harci_helyzet:lovas_harc) |
| Léglovas harc | 1 | Léglovaglás ≥ 3; fegyverhossz ≥ 3 (harci_helyzet:léglovas_harc) |
| Léglovas harc | 2 | Léglovaglás ≥ 6; fegyverhossz ≥ 3 (harci_helyzet:léglovas_harc) |
| Léglovas harc | 3 | Léglovaglás ≥ 9; fegyverhossz ≥ 3 (harci_helyzet:léglovas_harc) |
| Lövés futás közben | 1 | Íjászat/Lövészet/Hajítás ≥ 5 |
| Lövés hátasról | 1 | Lovaglás/Léglovaglás ≥ 6; Íjászat/Lövészet/Hajítás ≥ 6 |
| Lövés hátasról | 2 | Lovaglás/Léglovaglás ≥ 9; Íjászat/Lövészet/Hajítás ≥ 9 |
| Lövés reflexből fejlesztése | 1 | Íjászat/Lövészet/Hajítás ≥ 5 |
| Manőverfókusz: Fegyvertörés | 1 | Közelharc/Kardvívás/Rombolás/Lándzsavívás ≥ 9; Mesterfegyver fortély ≥ 1 |
| Manőverfókusz: Földrevitel | 1 | Harcmodor ≥ 6 |
| Manőverfókusz: Lefegyverzés | 1 | Kardvívás/Lándzsavívás/Ostorharc ≥ 9; Mesterfegyver fortély ≥ 1 |
| Manőverfókuszok: Szike | 1 | Harcmodor ≥ 6; Élettan fortély ≥ 1 |
| Manőverfókuszok: Belharcmozgás | 1 | Harcmodor ≥ 6 |
| Merevvértviselet | 1 | Kardvívás/Rombolás/Lándzsavívás ≥ 3 |
| Merevvértviselet | 2 | Kardvívás/Rombolás/Lándzsavívás ≥ 3 |
| Merevvértviselet | 3 | Kardvívás/Rombolás/Lándzsavívás ≥ 3 |
| Mesterfegyver | 1 | Harcmodor ≥ 4 |
| Mesterfegyver | 2 | Harcmodor ≥ 8 |
| Mesterfegyver | 3 | Harcmodor ≥ 12 |
| Mesterlövész | 1 | Lövészet ≥ 5 |
| Mozgó cél könnyítése (fegyveres) | 1 | Íjászat/Lövészet/Hajítás ≥ 5 |
| Nyílpuska újratöltés fejlesztése | 1 | Lövészet ≥ 6 |
| Nyílpuska újratöltés fejlesztése | 2 | Lövészet ≥ 9 |
| Orgyilkos | 1 | Harcmodor ≥ 6 |
| Orgyilkos | 2 | Harcmodor ≥ 9 |
| Orgyilkos | 3 | Harcmodor ≥ 9 |
| Pajzshasználat | 1 | Harcmodor ≥ 3 |
| Pajzshasználat | 2 | Harcmodor ≥ 5 |
| Pajzshasználat | 3 | Harcmodor ≥ 8 |
| Páros harc | 1 | Harcmodor ≥ 3 |
| Páros harc | 2 | Harcmodor ≥ 6 |
| Páros harc | 3 | Harcmodor ≥ 9 |
| Taktikafókusz: Kitartott célzás | 1 | Íjászat/Lövészet ≥ 5 |
| Taktikafókusz: Roham | 1 | Közelharc/Kardvívás/Rombolás/Lándzsavívás ≥ 4 |
| Taktikafókusz: Visszafogott | 1 | Közelharc/Kardvívás/Rombolás/Lándzsavívás ≥ 6 |
| Testőr | 1 | Harcmodor ≥ 6 |
| Testőr | 2 | Harcmodor ≥ 9 |
| Vezető: Alakzatparancsnok | 1 | Alakzatharc ≥ 6; Befolyásolás ≥ 3 |
| Vezető: Alakzatparancsnok | 2 | Alakzatharc ≥ 9; Befolyásolás ≥ 3 |
| Vezető: Fejvadász strategis | 1 | Lopakodás/rejtőzés ≥ 6 |
| Vezető: Fejvadász strategis | 2 | Lopakodás/rejtőzés ≥ 9 |
| Vezető: Lovaskapitány | 1 | Lovaglás ≥ 6; Befolyásolás ≥ 3 |
| Vezető: Lovaskapitány | 2 | Lovaglás ≥ 9; Befolyásolás ≥ 3 |
| Vezető: Léglovaskapitány | 1 | Léglovaglás ≥ 6; Befolyásolás ≥ 3 |
| Vezető: Léglovaskapitány | 2 | Léglovaglás ≥ 9; Befolyásolás ≥ 3 |
| Vezető: Testőrparancsnok | 1 | közelharc/kardvívás/rombolás/lándzsavívás/ostorharc ≥ 6; Észlelés ≥ 6 |
| Vezető: Testőrparancsnok | 2 | közelharc/kardvívás/rombolás/lándzsavívás/ostorharc ≥ 6; Észlelés ≥ 9 |
| Vezető: Íjászparancsnok | 1 | Íjászat/Lövészet/Ostromlövészet ≥ 6 |
| Vezető: Íjászparancsnok | 2 | Íjászat/Lövészet/Ostromlövészet ≥ 9 |

---

## §26 Kétkezes harc

**Kétkezes harc fortély követelményei** (2026-10-17): fokonként két `képzettség` követelmény `név: harcmodor`,
`feltétel: fegyverfogás:kétkezes`, `alcél: felszerelés:nagyobb_fegyver` / `felszerelés:kisebb_fegyver` (6/3, 9/6, 9/9).
Nagyobb = hosszabb fegyver (azonos hossznál az ügyesebb kéz). Fortélyok fül (felvétel, a fegyverpár még nem ismert):
bármely közelharci harcmodor legmagasabb szintje mér mindkét sorra. Harc fül, kétkezes fogásnál: a kézben lévő pár
fegyverenkénti harcmodor-szintje (`engine/ketkezes.ts → kétkezesKövetelményHiány`) - ⚠ sáv a fegyver-szekció alatt, nem tilt.

Forrás: md/065_05_ketkezes_harc.md, fortelyok.harci/ketkezes_harc.md, fortelyok.harci/ketkezesseg.md

### 26.1 Alapfogalmak

Kétkezes harc = mindkét kézben fegyver (session.kétkezes_harc = true).
A "nagyobb fegyver" az, amelyiknek nagyobb a fegyverhossza. Egyenlő fegyverhossz esetén bármelyik.

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

### 26.4 Fegyverhossz korlát

```
Két külön limit (mindkettőnek teljesülnie kell, egyébként a fegyverek nem foghatók párban - a
calcKétkezesHarc null-t ad, a Fegyverfogás pickerben a "Kétkezes harc" disabled):
  (a) Per-fegyver: egyik fegyver fegyverhossza sem lehet nagyobb, mint
      konstansok.kétkezes_harc_max_egy_fegyver (jelenleg: 3).
      (A nagyobb, kétkezes fegyverek nem foghatók párban.)
  (b) Össz:        a két fegyver össz fegyverhossza max
      konstansok.kétkezes_harc_max_fegyverméret (jelenleg: 6).
Fegyverhossz értékek: fegyverek_v2.json fegyverhossz mező (egész, fegyverhossz-kategória skálán).
```

### 26.5 Harckeret módosítás

```
input: Kétkezes harc fok, Kétkezesség fortély, fegyverek fegyverhossza (egész)
formula:
  // Harckeret bónusz forrása:
  //   0. fok (nincs fortély): konstansok.kétkezes_harc_bónuszok[0].harckeret (= +1)
  //   1-3. fok: fortély yaml módosítók (feltételes, kétkezes_harc==true) → fortelyMods['harckeret']
  //   Kétkezesség: +1 (fortély yaml, feltételes)

  if fok == 0:
    kh_harckeret_bónusz = konstansok.kétkezes_harc_bónuszok[0].harckeret  // +1
  else:
    kh_harckeret_bónusz = 0  // fortélyMods['harckeret']-ben már benne van

  // Fegyverlevonás: a két fegyver fegyverhosszainak összege, osztva az osztóval (floor)
  sum_fegyverhossz = fegyver_jobb.fegyverhossz + fegyver_bal.fegyverhossz
  fegyverlevonás = FLOOR(sum_fegyverhossz / konstansok.kétkezes_harc_fegyverlevonás_osztó)

  harckeret = harcmodorSzint + gyorsaság + fortelyMods['harckeret'] + kh_harckeret_bónusz - fegyverlevonás

note: A fegyverhossz a fegyverek_v2.json-ból jön (egész, fegyverhossz-kategória skálán).
      Két limit vonatkozik a párban foghatóságra (§26.4): per-fegyver
      konstansok.kétkezes_harc_max_egy_fegyver és össz konstansok.kétkezes_harc_max_fegyverméret.
      A fegyverlevonás osztója: konstansok.kétkezes_harc_fegyverlevonás_osztó (jelenleg: 2).
```

### 26.6 Sebzés

Mindig az ügyesebb kézben levő fegyver sebez (= jobb kéz fegyver, session.aktív_fegyver_index).
Kivétel: ha szándékosan a rosszabbik kézben lévővel támad (Hátrány-1 TÉ dobás Kétkezesség nélkül).

```
formula (ketkezes.ts):
  jobbElsődleges = jobb kéz fegyver elsődleges módja (vagy módok[0])
  erőbónusz = FLOOR(MIN(tulajdonságok.erő, jobbElsődleges.Erőlimit) × (1 + fortelyMods.SP_erőbónusz_arány))   // a JOBB kéz fegyverének erőbónusz-limitje
  SP = jobbElsődleges.SP + erőbónusz + mf_SP + fortelyMods['SP'] + idea_SP

note: Az SP KIZÁRÓLAG a jobb (ügyesebb) kéz fegyveréből jön - a bal kéz fegyvere SP-t nem ad,
      még `mindkét_fegyver_értékei` fok esetén sem (az csak TÉ/VÉ-re vonatkozik, l. 26.3 és 26.8).
      A mesterfegyver-SP (mf_SP) a 26.3 mf-ága szerint: 0.fok "nincs", 2.fok "nagyobb" (nagyobb fegyveré),
      3.fok "mindkettő" (mindkét fegyver MF-SP-je összeadódik).
```

### 26.7 Session és UI

- `session.kétkezes_harc: boolean` - a Fegyverfogás picker állítja be ("Kétkezes harc" opció)
- `session.fegyverfogás: "kétkezes"` - a Fegyverfogás explicit mező (§27)
- `session.aktív_fegyver_index` - ügyesebb kéz fegyver
- `session.aktív_fegyver_bal_index` - gyengébb kéz fegyver (csak kétkezes fogásnál)

### 26.8 Példány-Idea delta (Modell 2)

A fegyverpéldányok egyedi Ideája (fegyverpéldány.idea) TÉ/VÉ/SP deltát ad a fegyver alap-Ideájához
(idea_default) képest. Forrás: fegyver_idea_tabla.json (idea szint → {TÉ, VÉ, SP} delta).

```
formula (ketkezes.ts, ideaDelta):
  nagyobbIdea = ideaDelta(nagyobbFp.idea, nagyobb.idea_default, tábla)
  kisebbIdea  = ideaDelta(kisebbFp.idea,  kisebb.idea_default,  tábla)
  jobbIdea    = ideaDelta(jobbFp.idea,    jobbDef.idea_default,  tábla)

  idea_TÉ = nagyobbIdea.TÉ + (mindkét_fegyver_értékei ? kisebbIdea.TÉ : 0)
  idea_VÉ = nagyobbIdea.VÉ + (mindkét_fegyver_értékei ? kisebbIdea.VÉ : 0)
  idea_SP = jobbIdea.SP     // SP mindig a JOBB (sebző) kéz fegyveréből

note: Idea-delta szimmetria a 26.3 TÉ/VÉ-logikával:
      - TÉ/VÉ Idea-delta: a NAGYOBB fegyveré mindig számít; a kisebbé CSAK `mindkét_fegyver_értékei`
        fok esetén (1-3. fok). 0. fok (alapeset): csak a nagyobb fegyver Idea-TÉ/VÉ-je.
      - SP Idea-delta: KIZÁRÓLAG a jobb kéz fegyveréből (összhangban a 26.6 sebzés-logikával).
      Fontos: a "nagyobb/kisebb" fegyvermegkülönböztetés fegyverhossz szerinti, a "jobb/bal" pedig
      kéz (aktív_fegyver_index / aktív_fegyver_bal_index) szerinti - a kettő nem feltétlenül esik egybe,
      ezért a jobbIdea külön számítódik a nagyobbIdea/kisebbIdea mellett.
```
- Aktív fül: Fegyverfogás picker (§27), "Kétkezes harc" disabled ha össz fegyverhossz > limit, valamelyik fegyver fegyverhossza > per-fegyver limit, vagy nincs nem-hárító fegyver
- Harc fül: kétkezes harc aktív → összevont harcértékek megjelenítése (lila keret, normál sorok halványítva)
- Harc fül: Fh oszlop kétkezesnél: `x(y)` formátum (x=nagyobb fegyver fegyverhossza, y=össz fegyverhossz)

### 26.9 Fortély feltételek

A harckeret bónuszok forrásai kétkezes fogásnál:

| Fortély | Bónusz | Feltétel (yaml) | Megjegyzés |
|---------|--------|-----------------|------------|
| Kétkezes harc 1.fok | harckeret: +2 | `fegyverfogás:kétkezes` | yaml string prefix feltétel |
| Kétkezes harc 2.fok | harckeret: +3 | `fegyverfogás:kétkezes` | |
| Kétkezes harc 3.fok | harckeret: +4 | `fegyverfogás:kétkezes` | |
| Kétkezesség 1.fok | harckeret: +1 | `[{forrás: "kétkezes_harc", op: "==", érték: true}]` | kalkulált feltétel |
| Harckeret növelés | harckeret: +1/+2/+3 | (nincs) | mindig aktív |
| Alapeset (0.fok, nincs fortély) | harckeret: +1 | - | konstansok.kétkezes_harc_bónuszok[0].harckeret |

A `fegyverfogás:kétkezes` és `session.kétkezes_harc == true` mindketten azt jelzik, hogy kétkezes fogás aktív.
- `fegyverfogás:kétkezes`: string prefix feltétel → `session.fegyverfogás === 'kétkezes'`
- `kétkezes_harc == true`: kalkulált feltétel → `session.kétkezes_harc === true`
- A két feltétel ekvivalens (mindkettő csak kétkezes fogásnál igaz).

### 26.10 Kalkuláció összefoglalás

```
if session.kétkezes_harc:
  nagyobb_fegyver = fegyver[jobb] if fegyver[jobb].fegyverhossz >= fegyver[bal].fegyverhossz else fegyver[bal]
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

  MF_bónusz (TÉ/VÉ/SP) - data-driven: khFokEntry.mf
    if mf == "nincs": 0
    if mf == "nagyobb": lookup(MF_fok_nagyobb → mesterfegyver_bónuszok)
    if mf == "mindkettő": lookup(MF_fok_nagyobb) + lookup(MF_fok_kisebb)

  SP = fegyver_jobb.SP + erőbónusz + MF_bónusz.SP + fortelyMods['SP'] + idea_SP   // §26.6, §26.8
  // TÉ/VÉ-hez + idea_TÉ / idea_VÉ (§26.8) és - merevvért_TÉ_büntetés (TÉ)

  harckeret = harcmodorSzint + gyorsaság + fortelyMods['harckeret'] + khFokBónusz.harckeret - fegyverlevonás
  fegyverlevonás = FLOOR(sum_fegyverhossz / konstansok.kétkezes_harc_fegyverlevonás_osztó)
  támadások = 1 + FLOOR(harckeret / nagyobb_fegyver.sebesség)

impl: engine/ketkezes.ts → calcKétkezesHarc (hívó: harc/fegyver-calc.ts → calcKetkezes, + fegyver_override).
```

## §27 Fegyverfogás

Forrás: md/065_01_fegyverfogas.md

### 27.1 Koncepció

A Fegyverfogás meghatározza a karakter kéz-konfigurációját a harcban. Négy lehetőség:
- **Egyfegyveres** (alap) - egy fegyver, másik kéz üres (vagy kétkezes/másfélkezes fegyver)
- **Fegyver + pajzs** - fő fegyver + pajzs a gyengébb kézben
- **Fegyver + hárítófegyver** - fő fegyver + hárítófegyver a gyengébb kézben
- **Kétkezes harc** - két külön fegyver (§26)

### 27.2 Data layer

```
Session mező:
  session.fegyverfogás: "egyfegyveres" | "fegyver_pajzs" | "fegyver_hárító" | "kétkezes"

A fegyverfogás EXPLICIT session mező - a felhasználó a Fegyverfogás picker-rel választja.
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
  - Össz fegyverhossz > konstansok.kétkezes_harc_max_fegyverméret, valamelyik fegyver fegyverhossza > konstansok.kétkezes_harc_max_egy_fegyver, VAGY nincs nem-hárító fegyver bal kézhez → "kétkezes" disabled

Bal kéz dropdown:
  - Csak "kétkezes" és "fegyver_hárító" fogásnál jelenik meg
  - "kétkezes": karakter fegyverek (fegyverhossz-limit szűrt, hárítófegyverek kiszűrve, pajzs kiszűrve, puszta kéz kiszűrve)
  - "fegyver_hárító": hárítófegyverek listája
```

### 27.3 Harcérték hatások fegyverfogásonként

```
Egyfegyveres:
  Standard kalkuláció (§7-§14). Nincs extra módosító.

Fegyver + pajzs:
  Implementálva (§13): pajzsVÉ bónusz + TÉ büntetés (Pajzshasználat fok-függő).
  VÉ és TÉ büntetés EGYETLEN pajzs_hatások[méret][fok] lookupból (konstansok.yaml, §13) - NEM külön
  konstans + fortély-mérséklés. A Pajzshasználat fok a táblán belül csökkenti a TÉ büntetést és
  3. fokon emeli a VÉ-t (szabálykönyv: pajzshasznalat.md mátrix).
  A pajzsVÉ és TÉ büntetés CSAK a lila összesítő sorban jelenik meg (normál sorokból kiszűrve).

Fegyver + hárítófegyver (IMPLEMENTÁLVA):
  hárítóVÉ = hárítófegyver elsődleges módjának VÉ-je (fegyverek_v2.json, `Hárító: …` rekordok a
             fegyverek_fixed.json-ból, aktor: "kivétel"), ha van "Hárítófegyver használat" fortély, else 0
  hárítóMF_VÉ = MF_bónusz VÉ a hárítófegyverre (ha van MF a hárítóra → mesterfegyver_bónuszok lookup)
  Fegyver VÉ += hárítóVÉ + hárítóMF_VÉ
  TÉ büntetés: nincs (a hárítófegyver nem TÉ büntetést ad, mint a pajzs)
  Támadások: nem növeli (hárítófegyverrel nem támadsz)
  Kétkezes harc: hárítófegyverrel nem végezhető (szűrve picker-ben és dropdown-ban)
  impl: `pancel-calc.ts → calcFogas()` - hárítóVÉ + hárítóMF_VÉ kalkuláció integrálva.

Kétkezes harc:
  Lásd §26 (teljes implementáció).
```

### 27.4 Inkompatibilitás mátrix

```
                    Egyfegyveres  Fegyver+pajzs  Fegyver+hárító  Kétkezes
Egyfegyveres           ✓              -              -             -
Fegyver+pajzs          -              ✓              -             -
Fegyver+hárító         -              -              ✓             -
Kétkezes               -              -              -             ✓

Kétkezes fegyver (lándzsa, stb.) → kizárólag "Egyfegyveres" fogás.
```

### 27.5 Implementációs lépések

1. ✅ `session.fegyverfogás` mező hozzáadás (Session interface + DEFAULT_SESSION)
2. ✅ AktivScreen: Fegyverfogás picker (overlay popup, 4 opció, disabled logika)
3. ✅ AktivScreen: Bal kéz dropdown feltételes megjelenítés (kétkezes + hárító fogásnál)
4. ✅ AktivScreen: "2 kezes harc" és "Pajzs kézben" toggle gombok eltávolítás (beolvad a picker-be)
5. ✅ fegyverek_v2.json: hárítófegyver rekordok (`Hárító: …`, fegyverek_fixed.json)
6. ✅ Harc fül: Hárítófegyver VÉ bekötés (ha fegyverfogás == "fegyver_hárító") + lila sor (pancel-calc.ts → calcFogas)
7. ✅ karakter.yaml séma: `session.fegyverfogás` mező (enum a séma kommentjében)
8. ✅ Hárítófegyver MF VÉ bónusz (ha van Mesterfegyver a hárítóra)

---

## §28 Harc alakzatban (TERV - NEM IMPLEMENTÁLT)

Forrás: md/065_04_harc_alakzatban.md

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
3 VÉ: Alakzat Fegyverhátrányban vagy Fegyverazonosságnál
4 VÉ: Alakzat Fegyverelőnyben

Túlerő módosító:
  +0: 3 fő (legkisebb alakzat)
  +1: 5+ fő

Legrosszabb eset az egyén számára sebző támadásnál: -5 VÉ/kör
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
  Fárasztó:  +1 VÉ EXTRA csökkentés (a §28.7 fegyverhossz-alapértékre adódik)

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
Fárasztó taktika: +1 VÉ EXTRA csökkentés (ua. mint egyén ellen - §28.9)
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
- Minden undo-wrapped setter hívás egy tranzakció (`hooks/useUndo.ts`, `useUndoWrappedSetters`):
  - `UndoEntry = { timestamp, leírás, patches: UndoPatch[] }` push a stack-re
  - A `leírás` automatikusan generált (pl. "Taktika hozzáadva: Támadó (2)", "VÉ csökkenés: -3", "Fegyver váltás: Tőr")
- Patch-alapú (NEM teljes snapshot): minimális inverz műveletek a karakter mezőire
  (skalár: `{field, prev}`; tömb: `{field, op: add|remove|update, index?, item?, prev?}`). A session a
  karakter `session` mezőjeként patch-elődik.
- Összevonás (coalesce): egymást követő, azonos mezőre irányuló léptetések (pl. +/- gombok) egy bejegyzésbe
  olvadnak; session-re csak explicit `ckey`-jel (pl. toggle-ök). Noop (visszaléptetett) bejegyzés eldobódik.
- Visszaállítás: a kiválasztott pontig az összes későbbi tranzakció inverz patch-ei visszafelé alkalmazódnak

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
- Kattintás/tap: kiválasztja a pontot (● jelöli, a felette lévők is jelölve - ezek törlődnek)
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

#### KIVÉTELEK - NEM vonódnak vissza:

| Mező | Oka |
|------|-----|
| `karakter.jegyzetek` | Szöveges napló, mindig a legfrissebb állapot marad |
| `karakter.napló` | Játékeseménytörténet, kronológiailag nem visszavonható |

Implementáció: az `undoTo()` visszaállításnál a `jegyzetek` és `napló` mezőket az aktuális
(visszaállítás előtti) értékükkel felülírjuk a visszaállított karakter objektumon.

### 29.5 Megjegyzések

- A stack localStorage-ban perzisztens (a `szilank_char_{uid}` karakter JSON `_undo` mezőjében) - page reload után megmarad
- Játék módban és Szerkesztő módban egyaránt működik
- A `pushUndo()` hívást minden session/karakter módosító függvénybe be kell kötni
  - KIVÉVE: `jegyzetek` és `napló` módosítások (ezek nem generálnak undo entry-t)
- Teljesítmény: patch-alapú, a bejegyzések kicsik (nem teljes karakter-másolatok)
- A `pushUndo()` a módosítás ELŐTT hívandó (az aktuális állapotot menti, nem az újat)
- `pushUndo()` mellékhatásai: `isDirty=true` + `testMode=false` (ha teszt módban módosítás történik → kilép teszt módból, karakter mentődik)
- "Új karakter" és "Karakter betöltés" reseteli a stack-et + törli localStorage-ból


---

## §30 Local Storage Cache

Az aktuális karakter állapot és undo stack automatikusan localStorage-ba mentődik (multi-slot rendszer, §31).

### 30.1 Kulcsok

| Key | Tartalom |
|-----|----------|
| `szilank_slots` | Slot lista: `{ uid, id_leíró, név, becenév?, tsz, mentés_dátum, jk? }[]` (max 16, ebből max 10 NJK) |
| `szilank_char_{uid}` | Karakter JSON + `_undo` mező (undo stack integrálva) |
| `szilank_active` | Aktív karakter uid-ja |

Migráció (backwards compat): ha `szilank_karakter` (régi single key) létezik → automatikus import az első slot-ba, a régi `szilank_karakter` / `szilank_undo` kulcsok törlődnek (`useGameDataLoader.ts`).

### 30.2 Mentés

- Minden `karakter` vagy `undoStack` változáskor: `szilank_char_{uid}` felülíródik (`useEffect`)
- `szilank_slots` frissül (uid, id_leíró, név, tsz, mentés_dátum)
- `_undo` a karakter JSON-ba integrálva (nem külön key)
- Nincs debounce - minden módosítás azonnal ment
- Guard: `if (!karakter || testMode || !isDirty) return`
- Quota exceeded: `try/catch` - silent fail (nem crashel ha localStorage tele)

### 30.3 Betöltés (init)

- App mount-kor: `szilank_active` → uid → `szilank_char_{uid}` → parse → betölt
- Ha nincs aktív: `emptyKarakter` + uid generálás
- `_undo` mező → undo stack inicializálás

**Karakter sémaverzió** (2026-10-17): `engine/validate.ts` → `KARAKTER_SÉMA_VERZIÓ` (jelenleg 3). Eltérő (szám)
verziójú karakter NEM tölthető be, konverzió nincs (később lehet - a `sémaVerzióHiba` hívóinál kell bekötni).
Egy üzenet minden betöltési úton (aktív slot induláskor, karakterlista, NJK switcher, fájl / backup import,
URL-link, vágólap / QR), a „Betöltési hiba" overlay-ben:

```
Betöltendő karakter séma verzió: vX
Aktuális verzió: vY
Elavult verzió, kreáld újra a karaktert.
```
Induláskor (elavult aktív slot) az app nem blokkol: üres karakterrel indul, a régi slot a listában marad.
Hiányzó / nem szám verzió = sérült adat → a szokásos érvénytelen-karakter ág.

### 30.4 Törlés / Reset

- "Új karakter": új uid, új slot (régi megmarad a listában)
- Slot törlés: `szilank_char_{uid}` eltávolítás + slots frissítés (UI: SlotDeleteOverlay, §31.6)
- Fájlba exportálás: `_undo` is belekerül a JSON-ba

### 30.5 Böngésző cache - friss app verzió kikényszerítése

Probléma: a GitHub Pages `Cache-Control: max-age=600`-at ad az `index.html`-re (headert nem
lehet állítani). Egy már megnyitott URL (pl. megosztott karakter link) újbóli megnyitásakor a
böngésző a cache-elt HTML-t szolgálja ki, ami a RÉGI hash-elt JS bundle-re hivatkozik.

| Védelem | Hol | Mit ér el |
|---|---|---|
| `?v={APP_VERSION}` minden runtime JSON kérésen | `engine/data-loader.ts` | nincs „új bundle + régi tábla" kombináció |
| Indulási verzió-ellenőrzés (`metadata.json`, `cache: 'no-store'`) | `engine/version-check.ts` → `main.tsx` | elavult HTML esetén egyszeri, `?v=`-vel cache-kerülő újratöltés |

Az újratöltés a `#hash`-t (a megosztott karaktert) megőrzi, és a mount ELŐTT fut, különben az
URL-es import kétszer futna le (két slot). Loop védelem: `sessionStorage.szilank_reload_version`
tárolja, melyik verzióra töltöttünk már újra. Timeout 1s → offline/lassú hálón nem blokkol.

Korlát: az ellenőrzés kódja az új bundle-ben van, tehát egy már elavult HTML-t futtató kliens
nem gyógyul meg magától - ott egyszeri hard refresh kell (Ctrl+Shift+R).


---

## §30b Karakter Schema verziókezelés

A karakter JSON `schema_version` mezője határozza meg a struktúra verzióját. A jelenlegi stabil verzió: **v2** (`schema_version: 2`).

### Elvek

- A validáció **strict**: minden mező kötelező (top-level + session). Hiányzó mező = invalid karakter, betöltés megtagadva, hibaüzenet a hiányzó mezők listájával.
- **Régi (v2 előtti) karakterek** érvénytelenek - nincs backward compatibility migráció.
- **Jövőbeli verzióváltás** (TERV, v2→v3, stb.): új mezők hozzáadásakor a `schema_version` emelkedik, és egy kontrollált migrációs lépés fut betöltéskor, amely kipótolja az új mezőket default értékekkel. Jelenleg nincs migrációs kód (a projekt elve: backward compatibility nem szükséges).

### Validáció (`engine/validate.ts`)

- `validateKarakter(obj)` → `{ valid: true }` vagy `{ valid: false, missing: string[] }`
- `isValidKarakter(obj)` → type guard (boolean)
- Ellenőrzött mezők: `REQUIRED_TOP_FIELDS` + `REQUIRED_SESSION_FIELDS`
- `validateKarakterData(k, data)` → referenciális integritás a betöltött táblák ellen (ismeretlen faj, anyanyelv, fortély, képzettség, …) → hibaüzenet vagy null
- Fájl betöltés és localStorage betöltés egyaránt strict validációt futtat.

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
- A `test_karakter2.json`-ban fix uid (UUID formátum)
- Betöltéskor: ha hiányzik a `uid`, generálódik (backwards compatibility)
- Schema: `karakter.uid: string`, `karakter.id_leíró: string` (kötelező, top-level mezők)

### 31.2 localStorage struktúra

| Key | Tartalom |
|-----|----------|
| `szilank_slots` | JSON tömb: `SlotEntry` (`hooks/slot-utils.ts`: uid, id_leíró, név, becenév?, tsz, mentés_dátum, jk?) - max 16 entry (max 10 NJK), rendezve utolsó módosítás szerint |
| `szilank_char_{uid}` | Teljes karakter JSON (az adott slot-hoz), benne az undo stack |
| `szilank_active` | Az aktív karakter `uid`-ja (amelyik épp szerkesztés alatt van) |

Slot lista megjelenítés: `{név} ({tsz}sz)` + relatív idő. Hosszú név több sorba tördelődik (`.slot-row-top` `overflow-wrap: break-word` - szóhatáron, túl hosszú szót szó közben), a TSz suffix (`.slot-tsz`) egyben marad.

Az undo stack a karakter JSON részévé válik:
```json
{
  "uid": "a1b2c3d4-...",
  "név": "von Agabor",
  "session": { ... },
  "_undo": [
    { "timestamp": 1719000000, "leírás": "erő: 3 → 2", "patches": [ { "field": "tulajdonságok", "prev": {...} } ] },
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
- Nincs manuális "Mentés" gomb - minden módosítás azonnali

### 31.4 Új karakter

1. `crypto.randomUUID()` → `uid` generálás
2. `id_leíró` generálás (üres névből: `"új-karakter-3tsz"`)
3. `emptyKarakter` + uid + id_leíró → localStorage slot foglalás
4. Ha 16 slot (vagy 10 NJK) betelt: figyelmeztetés ("Töröld egy régit, vagy mentsd fájlba")
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
└─────────────────────────────────┘
```

- Rendezés: utolsó módosítás szerint (legfrissebb felül)
- Aktív karakter jelölve (●), többi (○)
- Megjelenítés: `{név} ({tsz}sz)` + relatív idő + akció chipek: 💾 mentés, ⧉ duplikálás, ✕ törlés (`SlotRow.tsx`)
- Tap: betöltés (aktív karakter váltás)
- "Fájlból betöltés": a jelenlegi fájl-import működés (JSON fájl kiválasztás)
- Relatív idő kijelzés ("2 perce", "3 napja", "1 hete")

### 31.6 Karakter törlés

- ✕ chip → megerősítő popup: "Törlöd: {név}?" (SlotDeleteOverlay)
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
**Összes karakter (backup)**: unified backup JSON - az összes localStorage slot egy fájlban:

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
│  [📤 Megosztás]             │  ← navigator.share() - mobil share sheet
│  [💾 Helyi mentés]          │  ← download (ahogy eddig)
└─────────────────────────────┘
```

- **Megosztás**: `navigator.share({ files: [file] })` - ha a böngésző támogatja (mobil). Ha nem támogatja → gomb rejtve/disabled.
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
2. Ha az `uid` már létezik a slot listában → ImportConfirmOverlay:
   - Felülírás → a meglévő slot felülírása
   - Új példány → importálás új uid-dal
   - Mégse → nem importál
3. Ha nem létezik → új slot hozzáadás
4. Betöltés aktív karakterként

#### Unified backup import

1. Iteráció a `karakterek[]` tömbön
2. Egyenként:
   - Validáció - ha hibás: warning popup ("Hibás entry: {index}. Kihagyva."), folytatás a következővel
   - Ha `uid` létezik → megerősítő popup: "Felülírod: {név}({tsz})?"
   - Ha nem létezik → új slot hozzáadás
3. Nem szakítja meg az importot egy-egy hiba
4. Importálás végén: az utolsó sikeresen importált karakter lesz az aktív (vagy marad az eddigi ha volt)
5. Összesítő: "{N} karakter importálva, {M} kihagyva"

### 31.9 Implementációs megjegyzések

- `crypto.randomUUID()`: modern böngészők (HTTPS/localhost) támogatják
- Fallback uid generálás: `Date.now().toString(36) + Math.random().toString(36).slice(2)`
- `id_leíró` generálás: `"{név-slug}-{tsz}tsz"` (slug: kisbetű, szóköz→kötőjel)
- localStorage limit: ~5MB böngészőnként. Egy karakter ~12KB, de a checkpointok (max 20, mindegyik közel teljes karakter-snapshot ~10KB) miatt worst case ~210KB/karakter → 16 karakter worst case ~3.4MB. Tipikus használatnál (kevés checkpoint) ~200-500KB.
- Kvóta betelése: az autosave `setItem` hibáját elkapja, és számlálót növel (`useAutoSave` visszatérési érték) → App piros toast ("megtelt a böngésző tárhelye"). NEM néma adatvesztés.
- Migrálás: ha `szilank_karakter` (régi single key) létezik → automatikus import az első slot-ba, uid generálás
- `navigator.share()`: csak HTTPS + mobil böngésző; desktop-on fallback = csak "Helyi mentés"

---

## §31b Karakter verziók (checkpoint)

Snapshot-alapú verziókövetés a karakteren belül. UI: Szilánk picker → Napló/Verziók overlay (lásd gui_spec 6b). Logika: `engine/checkpoint-utils.ts`.

### Adatmodell
- `karakter.checkpoints[]`: `{ id, név, dátum, snapshot }` - a karakter JSON része (mentődik, URL exportból kizárva)
- `id`: 8 karakteres random azonosító; `név`: max 20 karakter; `dátum`: ISO string
- Rendezés: legújabb elöl; max `MAX_CHECKPOINTS` darab (`ui-constants.ts`)

### Snapshot
- `createSnapshot(karakter)`: a karakter mezők mély másolata (`structuredClone`), KIVÉVE a runtime/meta mezőket: `uid`, `id_leíró`, `session`, `checkpoints`, `mentés_dátum`, `schema_version`
- Tehát a snapshot a teljes karakterállapot (tulajdonságok, képzettségek, fortélyok, felszerelés, jegyzetek, napló, előtörténet stb.), de nem tartalmaz beágyazott checkpointokat és runtime harc state-et

### Létrehozás
- `createCheckpoint(karakter, név)`: új checkpoint az aktuális állapotból, a lista elejére; `MAX_CHECKPOINTS`-ra vágva
- Napló bejegyzés hozzáadásakor opcionálisan (checkbox) automatikusan is létrejön; auto-név: `autoCheckpointName()` = `"{YYYY-MM-DD} auto mentés"`

### Visszaállítás (két mód)
- `restoreTruncate(karakter, id)`: a kiválasztott checkpointra áll vissza, ÉS töröl minden nála újabb checkpointot (a lista a kiválasztottól lefelé marad)
- `restoreAppend(karakter, id)`: a kiválasztott snapshotot új, legfrissebb bejegyzésként duplikálja (`← {név}` névvel), a többi checkpoint megmarad
- Mindkettő: a snapshot visszaíródik a karakterre, `session` DEFAULT_SESSION-re reset, `uid`/`id_leíró`/`schema_version`/`mentés_dátum` megőrizve
- Megtekintés (view): a checkpoint állapot csak olvasásra betöltve - a mód toggle disabled (`viewingCheckpoint`)

### Törlés
- `deleteCheckpoint(checkpoints, id)`: id alapján kiszűri a checkpointot

---

## §32 Screen hibahatár (ScreenErrorBoundary)

```
Minden tab screen renderelést `ScreenErrorBoundary` React class component burkolja.
Ha egy screen renderelés közben runtime hiba keletkezik (pl. hiányzó karakter mező):
- A screen helyén piros hibaüzenet jelenik meg a hiba szövegével
- "Újrapróbálás" gomb reseteli az error state-et
- A többi tab és a fejléc továbbra is működik
- Console-ba kerül a részletes stack trace

Implementáció: `components/ScreenErrorBoundary.tsx`; App.tsx - `<ScreenErrorBoundary>` wrapper a `<TabContent />` körül.
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

impl: harc/ep-logic.ts → calcSérültFok (pure)
side effect (HarcScreen.tsx useEffect):
  Ha targetFok változik → session.aktív_státuszok frissítés:
    targetFok = 0: "Sérült (X)" eltávolítása
    targetFok > 0: "Sérült ({targetFok})" hozzáadása/frissítése

UI (AktivScreen):
  - "Sérült" státusz chip: locked (nincs ✕ gomb, fok nem kattintható)
  - Státusz picker: "Sérült (auto)" névvel jelenik meg, szürkítve, nem kattintható
```

### §33.1 Felszerelés → Fizikai próba Hátrány

```
Pure: engine/felszereles.ts; konstans: konstansok.yaml `felszerelés`.

Háttér: a `Páncél akadályoztatása` / `Fegyver/Pajzs akadályoztatása` státuszok MEGSZŰNTEK.
  Az egységes modell a Felszerelés keretből számol, a hatás a PRÓBÁKRA megy (NEM harckeret).
  A régi `felszerelés_mgt`→harckeret reactive út kivezetve (§15, refactorlog/2026-10-09.md).

Számítás (md/010_03_06_felszereles.md):
  keret     = 2 + Erő                                         [felszerelésMax]
  terhelés  = Σ (a "számító" források pontja)                 [felszerelésTerhelés]
    fegyver: max(hossz_pont, súly_pont), ha felszerelésben=true
    pajzs:   méret→pont, ha nincs kizárt_auto-ban
    páncél:  struktúra (hajlékony:1/merev:2), ha aktív és lefedettség ≥ páncél_fedés_min, nincs kizárva
    kézi:    tárgy méret→pont
  túllépés  = terhelés - keret                                [felszerelésHátrány]
    ≤0 → nincs; 1 → Hátrány-1; 2 → Hátrány-2; >2 → auto kudarc + nem harcol

Integráció:
  - Képzettségpróba (fizikai csoport): KepzettsegProbaPopup EH-jába (`felszEH` prop,
    a KepzettsegCsoport `csoport === 'fizikai'` ágán). nemHarcol → tiltott (auto kudarc).
  - Tulajdonságpróba: TulajdonsagProbaPopup `ehSzint` kezdőérték (`felszEH`), a Fizikai
    tulajdonságoknál (`konstansok.felszerelés.hátrány_tulajdonságok`:
    erő/edzettség/ügyesség/gyorsaság/érzékenység). A KM a pickerrel felülírhatja.
  - KM-mérlegeléses: a jelzés figyelmeztet (warning + alap-EH), nem blokkol harci akciót.

Adatmodell:
  - FegyverPeldany.felszerelésben (bool) - Harcértékek fül „Felszerelésben" chip (5b),
    a Harc fül fegyverválasztóiban kiszürkül ha false; aktív fegyver → Puszta kéz fallback
    (useFegyverInvalidation).
  - felszerelés.tárgyak[] (kézi), felszerelés.kizárt_auto ("pajzs"/"páncél").
  - UI: FelszerelesSection accordion (Verziók/Napló/Jegyzetek overlay legfelső eleme).

A hosszútávú viselet Akadály-fejezete (md/010_03_07) külön, KM-mérlegeléses, nem próba-EH.
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

reactive rules.json:
  Aura: 2 * (tsz + tulajdonságok.önuralom)

impl: Misztikus fül (`MisztikusScreen.tsx`) jeleníti meg az Aura, ME, és Mágia akarata értékeket.
      A Mágiaellenállás (§34.1) = Aura + konstansok.aura.mágiaellenállás_konstans (inline számítás).
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

## §35 Misztikus fül - webapp

```
Képzettség szekciók (misztikus csoport átkerült a Tul/Képz fülről):
  1. Tradíció - max 1 db, kétlépéses picker (tradiciok.json, altípus ha van pl. Szakrális→istenség)
  2. Arkánumok - több felvehető (kepzettsegDefs: "Arkánum:*"), picker disabled ha nincs Tradíció
     Tradíció nélkül: nevek piros, picker "⚠ Tradíció szükséges"
  3. Faj misztérium - 1 db, automatikusan a karakter faj nevéhez kötött, nem törölhető, min szint: 0
  4. Ősi nyelv ismerete - többször felvehető, free-text popup (név megadás)
  5. Misztikus fortélyok - a Fortélyok fülről ide áthelyezve (csoport "misztikus")
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

Játék módban: csak azok a szekciók látszanak amikben van felvett elem (szint > 0)
```

## §35b Fortély schema mezők

```
Fortély yaml séma (data/schemas/fortely.yaml) - releváns generált mezők a fortelyok.json-ban:
  név, csoport, alcsoport, maxfok, session_toggle, emlékeztető, kiérdemelhető,
  kp_perfok, ingyenes_perszint, többszörös_típus, többszörös_lista,
  leírás, kiterjeszti_normál, kiterjeszti_erős, fokok[], md_fájl

  kiérdemelhető: boolean - ha true, a felvételi wizard-ban választható a "⭐ Kiérdemelt" opció
    true: szabad (mind), kiemelt (mind), misztikus: Mentálfonál
    false: harci, távharc, általános, érzékek, misztikus (többi)

  md_fájl: string - relatív path az md/ könyvtáron belül (pl. "fortelyok.harci/mesterfegyver.md")
    Generálás: `generate_tables.py` - `fortelyok.{alcsoport}/{fájlnév}.md` formátumban
    Webapp: `MdLink` komponens használja (🔗 ikon → GitHub szabályrendszer link)

  todo mező: TÖRÖLVE a schemából (2 fortélynál maradt nem-üres: alakzatharc, antissjaras)
```

## §36 Harci képzettségek - Harcértékek fül

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

**Paraméterek a data layerben** (2026-10-17): `konstansok.yaml → próba` - típusonként (`tulajdonság` / `képzettség`)
kocka, célszám-lista (`nehézségek`, `nehézségek_extra`), `kiemelt_különbség`, `másodlagos_levonás`; közös:
`előny_hátrány_max`, `összetett_max_másodlagos`, `vállalás {max, kocka}`, `helyettesítés {min_szint, osztó, max}`.
A két popup közös logikája: `tulajdonsagok/proba-common.ts` (pure), `useProbaDobas.ts` (dobás-állapot),
`ProbaReszek.tsx` (UI-részek). Az E/H skála a kocka-rétegben (`engine/dice.ts EH_SZINT_MAX`) szinkron másolat,
az egyezést teszt őrzi.

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
Előny/Hátrány: [-2; +2] skála (Státuszok + Felszerelés §33.1; clampEHSzint)
Lehetetlen: tulajdonság + 6 < célszám → nem dobható
Biztos siker: tulajdonság + 1 >= célszám → dobás nélkül sikeres

Előny/Hátrány dobás (k6):
  Előny+N: (N+1) db k6, legnagyobb számít
  Hátrány-N: (|N|+1) db k6, legkisebb számít
  Sima (0): 1 db k6
```

Webapp implementáció: `TulajdonsagProbaPopup.tsx` (Játék mód, Tulajdonság box kattintás).
Helperek: `tulProbaLehetetlen` / `tulProbaBiztosSiker` (a popupban, a közös `proba-common.ts →
probaLehetetlen / probaBiztosSiker` köré).
Dice: `engine/dice.ts → rollElőnyHátrányK6(szint)`.

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
Előny/Hátrány: [-2; +2] skála (Státuszok `statusz-proba.ts → calcStátuszPróbaEH` + kiterjesztés §37.7
  + Felszerelés §33.1 fizikai csoportnál; clampEHSzint)
Helyzetfüggő módosítók: a képzettség yaml táblái (dobó-oldali pontok, enyhítéssel - kepzettseg-proba-calc.ts)
Lehetetlen: tulajdonság + szint + 10 < célszám → nem dobható
Biztos siker: tulajdonság + szint + 1 >= célszám → dobás nélkül sikeres
```

Webapp: `KepzettsegProbaPopup.tsx`.
Pure helperek (`tulajdonsagok/kepzettseg-proba-calc.ts`): `probaLehetetlen(tulÉrték, szint, célszám)`, `probaBiztosSiker(tulÉrték, szint, célszám)`.

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

Dobások száma: KM döntés (feladat hossza alapján)
```

### 37.6 Helyettesítés (képzettségpróba)

```
Helyettesítő képzettség szint / 3  (lefelé kerekítve)
Max helyettesítő érték: 5
Nem adódik hozzá - kiváltja az elsődleges képzettséget.
```

### 37.7 Képzettség-kiterjesztés Előny/Hátrány (fortély foka szerint)

Forrás: md/030_08_01_kepzettsegek_fortelyok_kapcsolata.md

Egy fortély Normál vagy Erős kiterjesztésben kapcsolódhat egy képzettséghez (`tables/kiterjesztesek.json`).
A képzettségpróba Előny/Hátrány szintje a kiterjesztő fortély **felvett fokából** adódik:

```
típus    fok            hatás
──────────────────────────────────────
Normál   0 (nincs)      Hátrány-2
Normál   1              sima (0)
Normál   2              Előny+1
Normál   3              Előny+2
Erős     0 (nincs)      nem dobható (auto kudarc)
Erős     1              sima (0)
Erős     2              Előny+1
Erős     3              Előny+2
```

Általánosan (fok ≥ 1): `szint = min(fok - 1, 2)`. Erős 0.fok esetén a próba tiltott.

Előny/Hátrány dobás (webapp): `engine/dice.ts → rollElőnyHátrány(szint)`:
- `szint > 0` (Előny+N): `N+1` db k10, a legnagyobb számít
- `szint < 0` (Hátrány-N): `|N|+1` db k10, a legkisebb számít
- `szint == 0`: egyetlen k10

Implementáció: `KepzettsegProbaPopup.tsx` (Játék mód, képzettség accordion 🎲).
Pure helperek (teszteltek, `kepzettseg-proba-calc.ts`; `előnyHátrányLabel` a `dice.ts`-ben): `kiterjesztésElőnyHátrány(típus, fok)`, `buildFortélyFokok(fortélyok)`, `előnyHátrányLabel(szint)`, `probaSiker(tul, szint, k10, célszám)`.
A UI egy kiterjesztést kezel egyszerre (picker); a több-fortélyes eset (md/030_08_01 speciális szakasz) a KM döntése.

---

## §38 Lovas harc rendszer

Forrás: md/067_00_harc_hatasrol.md, md/067_01_lovas_harc_szabalyai.md, md/067_02_lovas_leglovas_fortelyok.md, md/067_03_lovas_harci_taktikak.md, md/067_04_lovas_manoverek.md

### 38.1 Alapszabályok

Lovas harc aktiválás: a játékos az Aktív fülön a "Lovas harc" (id: `lovas_harc`) vagy "Léglovas harc" (id: `léglovas_harc`) harci helyzetet választja.

```
Fortély nélkül (0.fok, Alapeset):
  TÉ: -9
  VÉ: -9
  Lenti bónuszok NEM járnak

Fortéllyal (1-3.fok):
  TÉ: +3 / +6 / +9 (Lovas harc fortély fokonként)
  VÉ: +3 / +6 / +9
  Fegyverhossz: +2 kategória bónusz (hátas miatti magaslat, fok-független)
  Követelmény: min_fegyverméret 3 (a `követelmények` tömbben, feltétel: `harci_helyzet:(lég)lovas_harc`) - webapp warning-only, nem blokkol

❌ "Magasabbról" harci helyzet NEM aktiválható lovas/léglovas harc közben
```

### 38.2 Fortélyok (meglévő data layer)

| Fortély | Fok | TÉ/VÉ | Feltétel | Állapot |
|---------|-----|--------|----------|---------|
| Lovas harc | 0 (alapeset) | -9/-9 | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Lovas harc | 1 | +3/+3 | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Lovas harc | 2 | +6/+6 | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Lovas harc | 3 | +9/+9 | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Léglovas harc | 0 (alapeset) | -9/-9 | `harci_helyzet:léglovas_harc` | ✅ yaml kész |
| Léglovas harc | 1 | +3/+3 | `harci_helyzet:léglovas_harc` | ✅ yaml kész |
| Léglovas harc | 2 | +6/+6 | `harci_helyzet:léglovas_harc` | ✅ yaml kész |
| Léglovas harc | 3 | +9/+9 | `harci_helyzet:léglovas_harc` | ✅ yaml kész |
| Harci kocsihajtás | 0 | - | `harci_helyzet:harci_szekér` | - (nincs Alapeset büntetés) |
| Harci kocsihajtás | 1 | +8/+8 | `harci_helyzet:harci_szekér` | ✅ yaml kész |
| Harci kocsihajtás | 2 | +12/+12 | `harci_helyzet:harci_szekér` | ✅ yaml kész |
| Lövés hátasról | 0 (alapeset) | CÉ:-3 (léptetés; ügetés -7, vágta -13 csak szöveg) | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Lövés hátasról | 1 | CÉ:-3 ügetés / -7 vágta | `harci_helyzet:lovas_harc` | ✅ yaml kész |
| Lövés hátasról | 2 | CÉ:-3 vágta | `harci_helyzet:lovas_harc` | ✅ yaml kész |

note: A "Lövés hátasról" CÉ levonása függ a hátas tempójától (léptetés/ügetés/vágta).
      A webapp nem modellezi a tempót automatikusan - a KM/játékos választja a megfelelő fokot.
      A 0.fok (léptetésnél CÉ:-3) mindig aktív a `lovas_harc` helyzetnél (Alapeset mechanizmus, §16.1).
      A fokozatok a "legrosszabb aktív tempó" CÉ-jét adják meg narratívan.

### 38.3 Fegyverhossz +2 kategória bónusz

```
if "lovas_harc" ∈ aktív_helyzetek OR "léglovas_harc" ∈ aktív_helyzetek:
  AND karakter fortélyok tartalmaz Lovas harc (fok ≥ 1) VAGY Léglovas harc (fok ≥ 1):
    effektív_fegyverhossz = fegyver.fegyverhossz + 2

Hatás: a Fegyverelőny/Fegyverhátrány meghatározásnál az effektív fegyverhosszal számol.
Követelmény (nem hatás): min_fegyverméret 3 - a fortély `követelmények` tömbjében, típus
"min_fegyverméret", feltétel `harci_helyzet:(lég)lovas_harc". Webapp: warning-only
(getMinFegyverhosszWarning), nem blokkol.
```

Implementáció:
- A Fegyverelőny/Fegyverhátrány rejtett helyzetek; a Fegyverviszonyt a játékos a VÉ csökkentés popupban választja (ve-csokkentes-calc.ts), az effektív fegyverhosszt a webapp nem veti össze automatikusan az ellenféllel
- A +2 kategória bónusz a Harc fül "Fh" oszlopában (HarcFegyverTable, `ph-bonus` szín) és a Részletes értékekben (HarcReszletek) jelenik meg
- Data-driven: fortély yaml `fegyverhossz` cél módosító (flat, feltétel: `harci_helyzet:X`), a calcFortelyMods generikusan gyűjti `fortelyMods['fegyverhossz']`-ba
- Min fegyverhossz: fortély yaml `min_fegyverméret` követelmény (a `követelmények` tömbben), AktivScreen figyelmeztetésként jeleníti meg (piros `⚠`) a harci helyzet info sávban ha aktív fegyver nem éri el (warning-only, nem blokkol)
- ✅ IMPLEMENTÁLVA

### 38.4 Harci helyzet kizárások és fegyverfogás tiltás

#### Kizárások (harci_helyzetek.yaml `kizár_helyzetek`)

A Lovas/Léglovas harc helyzet aktiválásakor a kizárt helyzetek automatikusan eltávolítódnak (meglévő logika).

| Helyzet | kizár_helyzetek |
|---------|----------------|
| Lovas harc | magasabbról, léglovas_harc, harci_szekér, belharci_helyzet, földön_fekve, helyhez_kötve, levegőből, orvtámadás, takarásban |
| Léglovas harc | magasabbról, lovas_harc, harci_szekér, belharci_helyzet, földön_fekve, helyhez_kötve, csúszós_talaj, orvtámadás, takarásban |
| Magasabbról | lovas_harc, léglovas_harc, földön_fekve, levegőből, belharci_helyzet, elvesztett_egyensúly, harci_szekér |

#### Fegyverfogás tiltás (harci_helyzetek.yaml `tiltott_fegyverfogások`)

Új mező - data-driven. Ha egy aktív helyzet tartalmazza a fogás id-ját, az a Fegyverfogás picker-ben disabled.
Ha a helyzet hozzáadásakor a karakter tiltott fogásban van → automatikusan visszaáll "Egyfegyveres"-re.

| Helyzet | tiltott_fegyverfogások |
|---------|----------------------|
| Lovas harc | fegyver_hárító, kétkezes |
| Léglovas harc | fegyver_hárító, kétkezes |

### 38.5 Lovas taktikák

Két új taktika a `taktikak.yaml`-ba:

```yaml
- név: "(Lég)Lovas roham"
  fokozatos: false
  módosítók:
    TÉ: 6
    SP: 10
  megjegyzés: "1 oda-vissza csapás. VÉ büntetés NINCS. Lovaglás próba: 12."
  megkötések:
  - típus: "harci_helyzet"
    mód: "szükséges"
    érték: ["lovas_harc", "léglovas_harc"]
  kombó_mód: "whitelist"
  kombó_lista: []
  fortély_bővítés: null
  id: "lovas_roham"

- név: "(Lég)Lovas támadás galoppból"
  fokozatos: false
  módosítók:
    TÉ: 3
    SP: 5
  megjegyzés: "1 oda-vissza csapás. VÉ büntetés NINCS. Lovaglás próba: 9."
  megkötések:
  - típus: "harci_helyzet"
    mód: "szükséges"
    érték: ["lovas_harc", "léglovas_harc"]
  kombó_mód: "whitelist"
  kombó_lista: []
  fortély_bővítés: null
  id: "lovas_támadás_galoppból"
```

Fontos: A "(Lég)Lovas roham" kiváltja a gyalogos "Roham"-ot és "Öngyilkos roham"-ot.
Megkötés: `harci_helyzet/szükséges` - **új megkötés típus** (eddig csak `tiltott` létezik).
Ha a szükséges harci helyzet NEM aktív → a taktika disabled a picker-ben.

A megkötés új `mód: "szükséges"` logika:
```typescript
if (mk.típus === 'harci_helyzet' && mk.mód === 'szükséges') {
  const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték];
  if (!session.aktív_helyzetek.some(h => {
    const hDef = data.harciHelyzetek.find(d => d.név === h);
    return hDef && szükséges.includes(hDef.id);
  })) return false;
}
```
note: `aktív_helyzetek` neveket tárol, `szükséges` értékek id-k → lookup szükséges.

A gyalogos "Roham" / "Öngyilkos roham" vs Lovas taktikák viszonya:
- Szabály: ha lovas_harc/léglovas_harc aktív, "Roham" és "Öngyilkos roham" disabled
- Implementáció: "Roham" + "Öngyilkos roham" → megkötés: `harci_helyzet/tiltott/"Lovas harc"` és `"Léglovas harc"` (helyzet névvel, mint a többi tiltott megkötés)

### 38.6 Lovas manőverek (data layer)

Három meglévő manőver bővítés + 1 placeholder kiegészítés a `manoverek.yaml`-ban:

```yaml
- név: "Hátas táncoltatása"
  típus: "lovas"
  nehézség: 0
  fázisok: "M"
  hatás: "Soron kívüli Megakasztás minden harcérintkezésben lévő ellenfél ellen. Távharc VÉ: Kiszámíthatatlan (6x)."
  id: "hátas_táncoltatása"

- név: "Lovas áttörés"
  típus: "lovas"
  nehézség: "4-10"
  fázisok: "V,E"
  hatás: "Áttörés ellenfél sorain. Sikernél ellenfelek szétszóródnak, hátrány a következő körben."
  id: "lovas_áttörés"

- név: "Lovas megakasztása"
  típus: "lovas"
  nehézség: 4
  fázisok: "M,E"
  hatás: "GYALOGOS végzi lovas ellen. Szúró szálfegyver + Fegyverelőny szükséges. Sebző dobás a lovasra."
  id: "lovas_megakasztása"

- név: "Lóhátról lerántás"
  típus: "lovas"
  nehézség: "6-12"
  fázisok: "M,V,E"
  hatás: "GYALOGOS végzi. Sikernél a lovas földre kerül."
  id: "lóhátról_lerántás"
```

A meglévő `"Lovas megakasztása"` (korábbi név: "Lovas akasztása") típus: "lovas", hatás szöveg frissítve.

Az Aktív fül manőver picker-ben: új "Lovas" kategória csoport megjelenik (mint "Általános"/"Belharcos" mellett).

### 38.7 Leesés szituáció (informatív, nem kalkulált)

A leesés mechanika (sebesüléskor Lovaglás próba, Akrobatika próba) a KM kezeli narratívan.
A webapp nem kalkulálja automatikusan - informatív szövegként a "Lovas harc" helyzet infó mezőjében hivatkozik rá.

```
Sebesüléskor leesés veszélye:
  6-10 ÉP seb → Lovaglás próba: 9
  11-15 ÉP seb → Lovaglás próba: 12
  15+ ÉP seb → Lovaglás próba: 15

Leesés → Akrobatika próba:
  Áll/Lassú: Nehézség 9, SP: k20+0
  Üget: Nehézség 15, SP: k20+5
  Vágta: Nehézség 18, SP: k20+15
```

### 38.8 Idomítatlan hátas (informatív)

```
TÉ: nem támadhatsz
VÉ: -10
Lovaglás/Léglovaglás képzettségpróba körönként (Nehézség: 12-15)
```

A webapp nem modellezi külön - informatív szöveg, KM kezeli.

### 38.9 Implementációs státusz

#### I. Data layer módosítások - ✅ KÉSZ

1. ✅ `lovas_harc.yaml`: 0.fok hozzáadva (TÉ:-9, VÉ:-9)
2. ✅ `leglovas_harc.yaml`: 0.fok hozzáadva (TÉ:-9, VÉ:-9)
3. ✅ `harci_helyzetek.yaml`: teljes kizárás mátrix (Lovas↔Léglovas↔Magasabbról↔Belharc↔Földön↔Helyhez kötve↔Orvtámadás↔Takarásban↔stb.) + `tiltott_fegyverfogások` mező
4. ✅ `taktikak.yaml`: "(Lég)Lovas roham" + "(Lég)Lovas támadás galoppból" + Roham/Öngyilkos roham `harci_helyzet/tiltott` megkötés
5. ✅ `manoverek.yaml`: "Lovas megakasztása" (típus: "lovas") + "Hátas táncoltatása", "Lovas áttörés", "Lóhátról lerántás"
6. ✅ `generate_tables.py`: "lovas" manőver típus validáció

#### II. Engine / Webapp módosítások - ✅ KÉSZ

7. ✅ AktivScreen - Taktika picker: `harci_helyzet/szükséges` megkötés logika
8. ✅ AktivScreen - Taktika picker: Roham/Öngyilkos roham disabled ha lovas helyzet aktív
9. ✅ AktivScreen - Manőver picker: "Lovas" kategória csoport
10. ✅ AktivScreen - Fegyverfogás picker: data-driven `tiltott_fegyverfogások` (hárító+kétkezes disabled)
11. ✅ AktivScreen - Helyzet hozzáadás: fogás auto-reset ha tiltott
12. ✅ data-types.ts: `HarciHelyzetEntry` interface bővítés (id, csoport, rejtett, tiltja_taktikákat, kizár_helyzetek, tiltott_fegyverfogások)
13. ✅ Harc fül - Fh oszlop: +2 fegyverhossz-kategória kijelzés (HarcFegyverTable `ph-bonus`)

#### III. Tesztelés

14. Feature teszt: lovas helyzet aktiválás → fortély TÉ/VÉ módosítók érvényesülnek
15. Feature teszt: kizárás mátrix (N>2 helyzet) működik
16. Feature teszt: Lovas taktikák csak lovas helyzetnél elérhetőek
17. Feature teszt: 0.fok büntetés (-9/-9) érvényesül ha nincs fortély
18. Feature teszt: Fegyverfogás disabled + auto-reset


---

## §39 Méreggenerátor (TERV - NEM IMPLEMENTÁLT)

Forrás: md/141_mereggenerator.md, md/143_mereg_tulajdonsagai.md, md/144_meregellenallas_proba.md, md/145_meregerzekeles.md, md/146_meregazonositas.md, md/148_peldamergek.md

KM eszköz (szabályszint): méreg összeállítása paraméterekből → Komplexitás és jellemzők kiszámítása. A méreg kikeverése Mérgek + Intelligencia képzettségpróbához kötött, amelynek Nehézsége a Komplexitással egyenlő. A dobás rejtett.

### 39.1 Méreg jelleg csoportok (hordozó közeg)

```
- Étel és italmérgek
- Légimérgek
- Kontaktmérgek
- Fegyvermérgek
```

### 39.2 Összetevő csoportok

```
- Állati
- Növényi
- Ásványi (szervetlen)
```

### 39.3 Komplexitás formula

```
Komplexitás =
  + (1) Erősség
  + (2) Súlyosság
  + (3) Hatáskezdet
  + (4) Hatástartam
  + (5) Bomlási idő
  + (6) Kimutatási idő
  + (7) Elállás
  + (8) Speciális

Mérgek képzettségpróba: Intelligencia + Mérgek szint + k10 vs Komplexitás
  (Komplexitás = a próba Nehézsége)
```

A Komplexitás szándékosan mehet a 21-es "Emberfeletti", sőt a 30-as maximum próbacélszám fölé is - az ilyen mérgek legendás vállalkozások (lásd Múló évszakok, Komplexitás 33).

Minimum szükséges Mérgek szint: nincs külön képlet. A korlátot az egyes tengelyek "biztos tudás" (Mk) küszöbei adják (Hatáskezdet, Bomlási idő, Kimutatási idő) - a méreg Mk követelménye a benne szereplő legmagasabb tengely-küszöb.

### 39.4 (1) Méreg Erőssége (1-10)

```
Skála: 1 (leggyengébb) - 10 (legerősebb)
Méregellenállás próba célszáma = Erősség (NEM a Komplexitás, NEM a Súlyosság)
Az Erősség nem egyenlő a romboló hatással (létezik erős altató is).
```

Adag (KM dönt, Erősség el is térhet):

```
 0: Normál adag
-1: Kis adag   → Méregérzékelés próba: -1 büntetés
+1: Nagy adag  → Méregérzékelés próba: +1 bónusz
```

### 39.5 (2) Hatás súlyossága (1-5)

| Érték | Hatás | Fájdalom → Státusz |
|-------|-------|--------------------|
| 1 | Enyhe rosszullét, hányás | Fájdalom(9) → Fizikai(1) Fáradtság |
| 2 | Bódultság státusz, Görcs | Fájdalom(12) → Fizikai(2) Kimerültség |
| 3 | Kábultság státusz, Részleges bénulás | Fájdalom(15) → Fizikai(2) Kimerültség |
| 4 | Életveszély, Alvás, Teljes bénulás | Fájdalom(18) → Fizikai(2) Kimerültség |
| 5 | Halál | Fájdalom(21) → Fizikai(3) Elcsigázottság |

Másodlagos hatás (sikeres Méregellenállás próba esetén is érvényesül, Komplexitást emel):

```
+0: nincs másodlagos hatás
+2: 2 fokkal enyhébb Súlyosság
+4: 1 fokkal enyhébb Súlyosság
```

### 39.6 (3) Hatáskezdet

Bevitel után mennyi idő múlva hat. Mk = Mérgek biztos tudás küszöb.

```
+2: harc végén         Mk 5
+4: következő körben    Mk 7
+5: azonnal            Mk 9

+1: 1 jelenet után (harcon kívül)
+0: néhány óra múlva
+1: 1 napon belül
+2: 1 héten belül       Mk 5
+3: 1 holdfordulón belül Mk 7
+4: hónapok múlva       Mk 9
+5: évek múlva          Mk 12
```

### 39.7 (4) Hatástartam

Az aktiválódás után meddig tart a hatás.

```
+0: 1 kör
+1: 2 kör
+2: harc végéig; rövid jelenet (harcon kívül)
+3: pár óra (harcon kívül)
+5: hónapok (Kimutatási idő egyezzen)
```

### 39.8 (5) Bomlási idő

Meddig áll el szabad levegőn / folyadékban / pengén kibontás után.

| Érték | Időtartam | Min. Mk |
|-------|-----------|---------|
| 0 | Pár másodperc | - |
| 1 | 1 perc | - |
| 2 | 10 perc | - |
| 3 | 1 óra | - |
| 4 | 1 nap | 6 |
| 5 | 1 hónap | 9 |
| 6 | Örökké | 12 |

Több komponensű méreg minimum-korlát: ha a komponenseket időben elnyújtva kell beadni (lásd 39.11 Speciális), akkor

```
Bomlási idő >= (utolsó és első komponens beadása közti idő) + Hatáskezdet
```

Indok: a korábban beadott komponenseknek ki kell tartaniuk a szervezetben/hordozóban, amíg a méreg összeáll és hatni kezd - különben lebomlanak. Így a drága Bomlási időt nem lehet egy gyorsan ható utolsó komponensre terhelve megspórolni. Ez akkor is igaz, ha a komponensek egyenként ártalmatlanok, és csak együtt hatnak.

### 39.9 (6) Kimutatási idő

Eddig kimutatható a szer a Hatástartam lejárta után.

| Érték | Időtartam | Min. Mk |
|-------|-----------|---------|
| 0 | 1 nap | - |
| 2 | fél nap | - |
| 3 | 1 óra | 6 |
| 4 | hatás lejárta után nem | 9 |

### 39.10 (7) Elállás

Lezárt állapotban (fiolában, tablettában) eddig áll el.

```
0: 1 holdfordulón belül
2: 1-2 év
4: örökké
```

### 39.11 (8) Speciális módosítók

| Módosító | Leírás |
|----------|--------|
| +3 | Plusz 1 hordozó közeg (étel/ital, légnemű, véráram): a csatornák egyenként ártalmatlanok, csak együtt, a szervezetben összeállva hatnak (bináris méreg) |
| +2 | Sűrű: kis mennyiség is elég 1 adaghoz |
| +3 | Színtelen |
| +3 | Szagtalan/ízetlen (egyben értendő) |
| +3 | Félrevezető tünetek 3 (ennyivel nő az azonosítás nehézsége) |
| +6 | Félrevezető tünetek 6 (ennyivel nő az azonosítás nehézsége) |
| +0 | Szabadban sem eloszló légméreg (nem nehezebb, de speciális fizikai közvetítő kell, pl. füstöt okádó labdacs, folyamatos utánpótlással) |

### 39.12 Kikeverési próba módosítói és narratív bónuszok

A Mérgek képzettségpróbát (kikeverés) befolyásoló helyzetfüggő módosítók (md/kepzettsegek.primer/altalanos/mergek.md):

```
Felszerelés:  -3 szegényes / +0 normál / +3 jól felszerelt labor
Komponensek:  -3 hiányzó de helyettesíthető / 0 mind megvan
Élettan fortély: +2 (minden próbára)
Vállalás: +1..+3 (legfeljebb a Mérgek szint; kritikus hiba kockázattal)
```

Rendkívül magas Komplexitású mérgeknél narratív bónuszok is indokoltak lehetnek (mágikus/szakrális rituálék, együttállások, varázstárgyak, ereklyék, szimpatikus mágiával a célpont vére/haja) - ezek Helyzetfüggő módosító bónuszt adhatnak; részletezésük a mágiarendszerre / KM-re marad.

Elvi maximum kikeverési dobás (minden kedvező tényezővel): 15 (szint) + 5 (tulajdonság) + 10 (k10) + 3 (vállalás) + 2 (Élettan) + 3 (labor) = 38 (narratív/misztikus bónuszok ezen felül).

### 39.13 Méregellenállás próba

```
(Edzettség + k6) vs Méreg Erőssége     (NEM a Komplexitás, NEM a Súlyosság)

Fortély: Méregálló bónuszt ad
Kiemelt siker: az esetleges Másodlagos hatás sem érvényesül
Sikertelen: elsődleges hatás érvényesül
Sikeres: csak a másodlagos hatás (ha van), egyébként semmi
```

### 39.14 Méregérzékelés

Két típusú próba dobható egymás után; ha bármelyik sikeres, a karakter kiszúrta a mérget.

```
1. Képzettségpróba: Mérgek + Érzékenység (csak ha Mérgek >= 3.szint)
   Nehézség: 12
   Helyzetfüggő: -3 Színtelen, -3 Szagtalan

2. Tulajdonságpróba: Érzékenység
   Célszám: 4 (Átlagos)
   Helyzetfüggő: 0 Normál adag, -1 Kis adag, +1 Nagy adag,
                 -1 Sűrű, -1 Színtelen, -1 Szagtalan
```

### 39.15 Méregazonosítás

A méreg beazonosítása (Méregérzékelés után, vagy fennálló gyanú esetén; minta szükséges).

```
Nehézség: 9

Helyzetfüggő módosítók (a méreg tulajdonságai nehezítik):
-3: Plusz 1 hordozó közeg (bináris: a csatornák csak együtt hatnak)
-3: Szagtalan/ízetlen
-3: Félrevezető tünetek 3
-6: Félrevezető tünetek 6
```

### 39.16 Alapanyag követelmény és adagszám

```
(Alkímia + Vajákosság) követelmény az elkészítéshez.
Ha az alapanyagok nem rendkívül ritkák/egyediek, tetszőleges adag készíthető (KM dönt).
Ritka faj elleni méreghez: Szabad Fortély "Különleges faj boncolása" (fajra felvéve).
```


---

## §40 Karakter URL Export (megosztás)

Cél: teljes karakter állapotát egyetlen URL-ben átadni, szerver nélkül, lehető legrövidebb formában.

### 40.1 Kihagyott mezők

Az URL exportból kihagyandó mezők (nem szükségesek a karakter reprodukálásához, vagy runtime-specifikusak):

```
Kihagyott (nem kerül bele az URL payload-ba):
  - uid                   (generált, betöltéskor új keletkezik)
  - id_leíró              (származtatott)
  - mentés_dátum          (irreleváns megosztásnál)
  - jegyzetek             (szabad szöveg, lehet nagy)
  - napló[]               (kaland bejegyzések, lehet nagy)
  - session               (teljes session objektum - runtime állapot)
  - checkpoints[]         (verziók, §31b - importkor üres)
  - _undo                 (undo stack, §29)
  - kiterjesztés_negálva  (képzettség-kiterjesztés kézi felülbírálás, importkor üres)

Részlegesen szerializált:
  - előtörténet           CSAK a származás_helye mező megy át (sh kulcs, §40.2); a többi
                          (szociális_érzék, külső, előtörténet szöveg) kimarad, importkor üres (default).
```

### 40.2 Kompakt JSON formátum

A karakter a következő rövidített kulcsú, tömörített struktúrában kerül kódolásra.
A cél: minimalizálni a JSON méretet tömörítés előtt.

```
{
  "sv": schema_version,                     // number (2)
  "n":  név,                                // string
  "bn": becenév,                            // string (kihagyható ha üres)
  "j":  játékos,                            // string (kihagyható ha üres)
  "jk": JK-e,                               // boolean (csak ha false = NJK; default true → kihagyva)
  "t":  tsz,                                // number
  "l":  leírás,                             // string (kihagyható ha üres)
  "k":  kor,                                // number
  "an": anyanyelv,                          // string
  "v":  vallás,                             // string (kihagyható ha üres)
  "tu": [erő, edz, ügy, gyo, int, eml, önu, érz],  // number[8] - fix sorrend
  "hm": [HM_TÉ, HM_VÉ],                   // number[2]
  "cm": CM,                                 // number
  "kp": [[név, szint], ...],               // képzettségek - [string, number][]
  "fo": fortélyok tömörítve (lásd 40.3),   // mixed[][]
  "ht": hátterek tömörítve (lásd 40.4),    // array
  "fg": fegyverek tömörítve (lásd 40.5),   // array
  "tf": távfegyverek (lásd 40.6),          // (string | [string, number])[]
  "pa": páncél (csak non-default mezők),   // object (kihagyható ha üres)
  "pj": pajzs méret,                       // string (kihagyható ha üres)
  "fl": felszerelés (lásd 40.7),           // object (kihagyható ha üres)
  "sh": előtörténet.származás_helye        // string (kihagyható ha üres)
}
```

Szabály: ha egy opcionálisnak jelölt mező értéke üres string, üres tömb, üres objektum, `0`, vagy megegyezik a sémabeli default-tal → **ki kell hagyni** a kompakt JSON-ből (csökkenti a méretet).

### 40.3 Fortélyok tömörítése

Minden fortély egy tömb:

```
Alap eset (nem többszörös, nincs kiérdemelt):
  [id, fok]

Többszörös (elem nem üres; a 3. pozíció üres helyőrző - a pozíciós formátum megmaradt):
  [id, fok, "", elem]

Kiérdemelt flag (kiérdemelt=true):
  utolsó elemként: 1
  Példa: ["nyelvismeret", 1, "", "Toroni", 1]
(Séma-verzió: `KARAKTER_SÉMA_VERZIÓ`, eltérésnél a §30.3 „Karakter sémaverzió" üzenete.)
```

Példák:
```json
["Merevvértviselet", 3]
["Mesterfegyver", 2, "fegyver", "tőr"]
["Kultúrkör", 1, "kultúrkör", "dw00n"]
["Nyelvismeret", 1, "nyelv", "Közös (pyarroni)", 1]
```

### 40.4 Hátterek tömörítése

```
Mindig: [faj]
Ha van leíró: [faj, leíró_tömb]
Ha van karma is: [faj, leíró_tömb, karma_tömb]

Példa: ["Ember (Északi)"]
Példa: ["Elf", ["Nemesi származás", "Kétéletű"]]
Példa: ["Ember (Déli)", [], ["Hatalmas önuralom"]]
```

### 40.5 Fegyverek tömörítése

Minden fegyver egy tömb. A trailing default értékek elhagyhatók.

```
Sorrend: [alap, név, anyag, idea]
Default-ok: név="", anyag="acél", idea=0

Példák:
  ["kard, lovag"]                         // minden default
  ["tőr"]                                 // minden default
  ["kard, hosszú", "Vérvörös Penge"]      // egyedi név, anyag/idea default
  ["buzogány, nehéz", "", "mithrill", 2]  // egyedi anyag és idea
```

### 40.6 Távfegyverek tömörítése

```
String (idea 0) vagy [alap, idea] pár:
  ["Rövid íj", ["Könnyű nyílpuska", 2]]
```

### 40.7 Felszerelés tömörítése

```
Ha üres (nincs kézi tárgy, kizárás, felszerelésben=false fegyver): kihagyható.
Különben "fl": { t?: [[név, méret], ...], kiz?: ["pajzs"|"páncél", ...], fkiz?: [fegyver index, ...] }
  t    = felszerelés.tárgyak (méret: kicsi/közepes/nagy)
  kiz  = felszerelés.kizárt_auto
  fkiz = azon fegyverek indexei, ahol felszerelésben === false (default true, nem kerül át)

Példa: {"fl": {"t": [["Hátizsák", "közepes"]], "fkiz": [2]}}
```

### 40.8 Páncél tömörítése

Csak a nem-default mezők kerülnek be. Default értékek (kihagyhatók):
```
név: ""
fémalapanyag: ""
idea: 0
kidolgozottság: "átlagos"
sisak: false
végtagvédettség: 0
méret_illeszkedés: "passzol"
rongálódás: 0
```

Ha `alap` is üres → a teljes `pa` kulcs kihagyható.

Példa (bőr páncél, default minden más):
```json
{"alap": "bőr"}
```

Példa (teljes láncing):
```json
{"alap": "sodrony, teljes", "fémalapanyag": "acél", "sisak": true, "végtagvédettség": 3}
```

### 40.9 Encode pipeline

```
input:  karakter objektum (teljes, app state-ből)

1. Kihagyás:  uid, id_leíró, mentés_dátum, jegyzetek, napló, session, checkpoints, _undo törlése
2. Kompaktálás: kulcsok rövidítése, tömbösítés, default-ok elhagyása (40.2–40.8 szerint)
3. Szerializálás: JSON.stringify(compact, null, 0)   // minified, separators: (',',':')
4. Tömörítés: pako.deflate(jsonString, {level: 9})   // Uint8Array
5. Kódolás: base64url encode (RFC 4648 §5, padding nélkül)
              A-Z a-z 0-9 - _ karakterek (URL-safe, nem kell urlencode)
6. URL összeállítás: `${location.origin}${location.pathname}#${base64urlString}`   (engine/url-share.ts)

output: URL string (~1000-1700 karakter egy átlagos karakterre)
```

### 40.10 Decode pipeline

```
input:  URL hash fragment (a '#' utáni rész)

1. base64url decode → Uint8Array
   (padding visszaállítása: length % 4 szerinti '=' hozzáfűzés)
2. pako.inflate → JSON string (UTF-8)
3. JSON.parse → compact objektum
4. Dekompaktálás:
   - "tu" → tulajdonságok objektum (fix sorrend: erő, edz, ügy, gyo, int, eml, önu, érz)
   - "hm" → HM_TÉ, HM_VÉ
   - "kp" → képzettségek[{id, elem, szint}]   (tömb: [id, elem, szint])
   - "fo" → fortélyok[{id, elem, fok, kiérdemelt?}]
   - "ht" → hátterek{faj, leíró[], karma[]}
   - "fg" → fegyverek[{alap, név, anyag, idea}]  (default-ok visszaállítása)
   - "tf" → távfegyverek[{alap, idea}]  (string = idea 0, [alap, idea] egyébként)
   - "pa" → páncél (default-ok visszaállítása)
   - "pj" → pajzs{méret}
   - "fl" → felszerelés{tárgyak[] (t), kizárt_auto (kiz)} + fegyverek[i].felszerelésben=false (fkiz indexek)
   - "sh" → előtörténet.származás_helye
   - Hiányzó opcionális kulcsok → schema default-ok
5. Kiegészítés runtime mezőkkel:
   - uid: új UUID generálás
   - id_leíró: név + tsz-ből generálás
   - mentés_dátum: aktuális időpont
   - jegyzetek: ""
   - napló: [], checkpoints: []
   - session: empty_karakter.json session default-jai
6. Schema version ellenőrzés: compact.sv === CURRENT_SCHEMA_VERSION
   Ha nem egyezik → hibaüzenet ("Elavult karakter link, nem importálható")

output: teljes karakter objektum (betölthető az app state-be)
```

### 40.11 Dependency

```
package: pako (^2.1.0)
  - pako.deflate(input, {level: 9}) → Uint8Array
  - pako.inflate(input) → Uint8Array
  - ~26 KB gzipped, zero dependency, jól karbantartott
  - https://github.com/nodeca/pako (zlib JS port)

base64url: saját utility (nem kell külső lib)
  function toBase64Url(bytes: Uint8Array): string
  function fromBase64Url(str: string): Uint8Array
```

### 40.12 URL formátum

```
Fragment-based (implementált):
  https://kaktusztea.github.io/szilankrpg/#eNqNVM1O4zAQfp...

Előnyök:
  - Fragment nem küldődik a szervernek → privacy, statikus hosting kompatibilis
  - Nem számít bele a szerver-oldali URL limit-be
  - Böngésző címsor: ~65 000 karakter (Chrome), ~2 MB (Firefox)
  - Megosztáskor (chat, email) a teljes URL másolódik

Alternatíva (ha fragment nem megfelelő):
  https://szilank.app/k?d=eNqNVM1O4zAQfp...
  Hátrány: query string szerver-oldali limitek (8 KB tipikusan), de még bőven elég.
```

### 40.13 Méret becslések

```
Referencia karakter: von Agabor (8 TSz, 16 képzettség, 35 fortély)
  - Kompakt JSON: ~1550 byte
  - deflate + base64url: ~980 karakter
  - Teljes URL: ~1005 karakter

Becslés nagy karakterre (15 TSz, 30 képzettség, 60 fortély):
  - ~1700 karakter (bőven URL limitek alatt)

Böngésző/szerver limitek:
  - Chrome címsor: ~65 000 char
  - Firefox címsor: ~2 MB
  - Szerver-oldali (query string): 8 KB tipikus (CDN, nginx)
  - → Minden reális karakter elfér
```

### 40.14 UI integráció

#### Export (Karaktertár overlay-ből)

```
Hely: Karakterek overlay - minden slot sor végén egy 🔗 (link/másolás) ikon gomb.
Viselkedés:
  1. Kattintás → encode pipeline (§40.9) futtatása az adott slot karakterére
  2. navigator.clipboard.writeText(url) → vágólapra másolás
  3. Toast üzenet: "Karakter link vágólapra másolva!"
  4. Ha clipboard API nem elérhető → fallback: prompt() ablak az URL-lel

Ikon: kis lánc/link ikon (🔗) vagy másolás ikon (📋).
Pozíció: slot sorban, a ✕ törlés gomb ELŐTT (jobb oldalon, a műveleti gombok között).
```

#### Import (URL megnyitásakor)

```
Trigger: App induláskor (mount), ha window.location.hash nem üres és '#' után 
         legalább 20 karakter van (rövid fragment-ek ignorálva).

Flow:
  1. Hash fragment kiolvasása: window.location.hash.slice(1)
  2. Decode pipeline (§40.10) futtatása
  3. Ha decode SIKERTELEN (corrupt, inflate hiba, JSON parse hiba):
     → Toast: "Érvénytelen karakter link"
     → hash törlése (history.replaceState)
     → STOP
  4. Ha decode SIKERES:
     a. uid kiolvasása a dekódolt karakterből (ha volt az eredetiben - de §40.1 szerint nincs!)
        → Új uid generálás az importált karakternek
     b. Ütközés vizsgálat: VAN-E már a Karaktertárban (szilank_slots) azonos 
        NÉV + TSZ kombóval rendelkező karakter?
        - Ha NINCS ütközés:
          → Karakter hozzáadása a Karaktertárhoz (új slot)
          → Aktív karakterré válik
          → Toast: "Karakter importálva: {név} ({tsz}sz)"
        - Ha VAN ütközés (azonos név+tsz):
          → Confirm dialog: "'{név} ({tsz}sz)' már létezik. Felülírod?"
          → "Felülírás": meglévő slot felülírása az importált adatokkal (uid marad a régi)
          → "Új példány": új uid-val hozzáadás (mint duplikátum)
          → "Mégse": importálás elvetése
     c. hash törlése: history.replaceState(null, '', window.location.pathname)
     d. Undo stack reset az importált karakteren (üres _undo)

Note: Az uid kihagyásra kerül az URL-ből (§40.1), ezért az ütközés-vizsgálat
      NÉV + TSZ alapú (nem uid alapú). Ez szándékos: ugyanazt a karaktert
      többször megosztva ne duplikálódjon véletlenül.
```

### 40.15 Edge case-ek

```
- Üres karakter: ~200 char URL (minimális, működik)
- Schema verzió eltérés: import elutasítása hibaüzenettel
- Corrupt base64 / inflate hiba: try-catch, felhasználóbarát hibaüzenet
- Túl hosszú URL (elméletben nem fordul elő): encode után méret check, 
  figyelmeztetés ha > 4000 char (régebbi böngészők/proxy-k)
- Speciális karakterek a nevekben (ékezetek, vessző): 
  UTF-8 kódolás → deflate kezeli, base64url output clean
```


---

## §41 Reactive Engine implementáció

Forrás: `web/karakter/src/engine/reactive.ts`, `data/rules.json`

### 41.1 Architektúra

A webapp **minden numerikus kalkulációja** deklaratív szabályokból áll (`rules.json`, 57 szabály).
Nincs hardcoded TS kalkuláció - a TypeScript kód csak context-et épít és `evaluate()`-ot hív.

Kivétel (maradék TS inline logika):
- Fájdalomtűrés enyhítés: küszöb-tábla lookup (`pancel-calc.ts → calcFtEnyhites`)
- Kétkezes harc összesítő: multi-fegyver kompozíció (`engine/ketkezes.ts`)
- Fortély módosítók iteráció: feltételes aktiválás (`engine/fortely-mods.ts`)
- Taktika módosítók: fokozatos extrapoláció (`harc/taktika-calc.ts`)

### 41.2 Rule struktúra

```json
{
  "id": "fegyver_TÉ",
  "formula": "konstansok.harcérték_alap.TÉ + tulajdonságok.erő + ...",
  "inputs": ["konstansok.harcérték_alap.TÉ", "tulajdonságok.erő", ...]
}
```

- `id`: egyedi azonosító, egyben az output változó neve
- `formula`: kiértékelhető kifejezés (aritmetika + függvényhívások)
- `inputs`: dependency lista (topológiai rendezéshez)

### 41.3 Kiértékelés (`evaluate`)

```
input:  rules: Rule[], ctx: Context, arrays?: ArrayContext, stringCtx?: StringContext
output: Map<string, number> (minden rule id → kiszámított érték)

algoritmus:
  pending = [...rules]
  WHILE pending nem üres:
    FIND first rule whose ALL inputs are resolved (ctx ∪ results ∪ arrays ∪ stringCtx)
    evalFormula(rule.formula) → number
    results[rule.id] = value
    ctx[rule.id] = value  // elérhetővé teszi függő szabályoknak
  RETURN results
```

Topológiai rendezés implicit: az `inputs` mező alapján, iteratív feloldás.
Ha egy rule inputja nincs kielégítve → kihagyva (marad pending-ben, legközelebb újrapróbálja).
Max iteráció limit: `rules.length * 2` (végtelen ciklus védelem).

### 41.4 Context típusok

| Típus | Tartalom | Építés |
|-------|----------|--------|
| **Context** (`Map<string, number>`) | Skaláris értékek: tulajdonságok, tsz, konstansok, HM, CM, páncél inputok, fegyver inputok | `buildContext()` |
| **ArrayContext** (`Map<string, Record<string, number|string>[]>`) | Tömbök: képzettségek, fortélyok, kp_tábla, harci_fortélyok, lookup táblák | `buildArrayContext()` + manuális `lookupArrays.set()` |
| **StringContext** (`Map<string, string>`) | String-keyed lookup kulcsok: páncél_alap, páncél_fémalapanyag, páncél_kidolgozottság, páncél_méret_illeszkedés, aktív_fegyver_harcmodor | Manuális `.set()` |

### 41.5 buildContext - skaláris context

Automatikusan bejárja:
- `tulajdonságok.*` (8 db) → `"tulajdonságok.erő"`, `"tulajdonságok.ügyesség"`, stb.
- `konstansok.harcérték_alap.*` → `"konstansok.harcérték_alap.KÉ"`, stb.
- `konstansok.kp.*` → `"konstansok.kp.perszint"`, stb.
- `konstansok.arányok.*` → `"konstansok.arányok.max_cm_perszint"`, stb.
- **top-level skalár konstansok** → `"konstansok.hm_aszimmetria_osztó"`, `"konstansok.több_támadás_TÉ_levonás"`, stb. (minden szám típusú konstans elérhető formulában, hardcode nélkül)
- `tsz` → egyetlen érték
- `extras` → tetszőleges kulcs-érték párok (HM_TÉ, HM_VÉ, CM, páncél mezők, fegyver mezők, stb.)

### 41.6 buildArrayContext - tömb context

| Tömb neve | Tartalom | Felhasználás |
|-----------|----------|-------------|
| `képzettségek` | `[{szint}]` | `kp_képzettségek` sum_lookup |
| `fortélyok` | `[{fok}]` - KP-t költő, nem kiérdemelt, nem ingyenes | `kp_fortélyok` sum |
| `kp_bónusz_fortélyok` | `[{bónusz_kp}]` - negatív kp_perfok-úak | `spec_kp` sum |
| `kp_tábla` | `[{szint, kp}]` | sum_lookup tábla |
| `harci_fortélyok` | `[{fok, is_mesterfegyver}]` | `max_HM` sum_where |
| `kiemelt_fortélyok` | `[{fizetős_kp}]` - ingyenes keret feletti | `kiemelt_kp` sum |
| `primer_képzettségek` | `[{szint}]` - primer flag-gel | `kp_primer_képzettségek` sum_lookup |
| `primer_fortélyok` | `[{kp}]` - fok×kp_perfok | `kp_primer_fortélyok` sum |
| `struktúrák` | `[{név, mgt, sfé_fizikai, sfé_energia, merev, fém}]` | páncél lookup |
| `fémalapanyagok` | `[{anyag, mgt, sfé_bónusz}]` | páncél lookup |
| `méret_tábla` | `[{név, érték}]` | páncél méret MGT lookup |
| `merevvért_tábla` | `[{fok, csökkentés}]` | merevvért lookup |
| `csatolt_mgt_merev/fém/nemfém` | `[{név, érték}]` | csatolt tag MGT lookup |

### 41.7 Formula nyelv

Támogatott operátorok és függvények:

| Elem | Szintaxis | Példa |
|------|-----------|-------|
| Aritmetika | `+`, `-`, `*`, `/` | `tsz * 4 + 28` |
| `floor()` | `floor(expr)` | `floor(tsz / 2)` |
| `ceil()` | `ceil(expr)` | `ceil(harcmodor_összeg * 2 / tsz)` |
| `min()` | `min(a, b)` | `min(erő, limit)` |
| `max()` | `max(a, b)` | `max(0, érték)` |
| `abs()` | `abs(expr)` | `abs(diff)` |
| `if()` | `if(cond, then, else)` | `if(páncél_merev, MGT, 0)` |
| `sum()` | `sum(tömb, mező)` | `sum(fortélyok, fok)` |
| `sum_lookup()` | `sum_lookup(tömb, mező, tábla, kulcs, érték)` | `sum_lookup(képzettségek, szint, kp_tábla, szint, kp)` |
| `sum_where()` | `sum_where(tömb, összegMező, szűrőMező, szűrőÉrték)` | `sum_where(harci_fortélyok, fok, is_mesterfegyver, 0)` |
| `count()` | `count(tömb)` | `count(képzettségek)` |
| `lookup()` | `lookup(tömb, kulcsMező, kulcsÉrték, értékMező)` | `lookup(struktúrák, név, páncél_alap, mgt)` |

A `lookup()` kulcsérték-feloldás sorrendje:
1. `ctx` / `results` (numerikus) - ha a kulcsérték egy context változónév
2. `stringCtx` (string) - string-keyed lookup (páncél struktúra név, kidolgozottság)
3. `Number(literal)` - szám literál fallback

A `if()` ternary-re fordul: `if(a, b, c)` → `((a) ? (b) : (c))`.
Végső kiértékelés: `new Function(...)` - biztonságos (nincs user input a formulákban).

### 41.8 Hívási helyek

| Hívó | Mit épít | Mire használja |
|------|----------|---------------|
| `components/kp-calc.ts` (calcKpDetails, App.tsx-ből) | Teljes buildContext + buildArrayContext (összes tömb) | KP, primer keret, tulajdonság pont keret, max_HM, max_CM, ÉP |
| `harc/useHarcComputed.ts` | buildContext + páncél lookupArrays + stringCtx | Páncél SFÉ/MGT, merevvért, lefedettség, KÉ, manőver alap/pont |
| `harc/fegyver-calc.ts` | Per-fegyver × per-mód buildContext (fegyver-specifikus extras) | TÉ, VÉ, SP, harckeret, támadások |
| `harcertekek/helpers.ts` (calcMaxAszimmetria) | Alap context (tsz) | max_HM_aszimmetria |
| `harcertekek/HarcertekekPancelSection.tsx` | Páncél context + lookupArrays + stringCtx | páncél SFÉ/MGT kijelzés |
| `tulajdonsagok/kepzettseg-limit.ts` | Alap context | képzettség max szint (§19) |
| `hooks/njk-slots.ts` | Alap context (NJK switcher stat) | ÉP, KÉ |
| `misztikus/MisztikusScreen.tsx` | Alap context | Aura |

note: A távharc cella / cél_VÉ NEM reactive szabály - tavharc/helpers.ts (calcVÉ, calcSzorzóÖsszeg).

### 41.9 Teljes szabálylista (57 db)

| ID | Típus | Bemenet összefoglaló |
|----|-------|---------------------|
| ÉP | képlet | edzettség |
| S1_max, S2_max, S3_max | képlet | ÉP |
| KÉ | képlet | gyorsaság, intelligencia, tsz |
| TÉ_alap | képlet | erő, ügyesség, gyorsaság, HM_TÉ |
| VÉ_alap | képlet | gyorsaság, ügyesség, HM_VÉ |
| CÉ_alap | képlet | önuralom, CM |
| összes_kp | képlet | tsz, intelligencia |
| összes_szekunder_kp | képlet | tsz, emlékezet |
| tulajdonság_pont_keret | képlet | tsz |
| manőver_alap | képlet | HM_TÉ, HM_VÉ |
| manőver_pont | képlet | harcmodor_összeg, tsz |
| max_CM | képlet | tsz |
| max_HM | sum_where | harci_fortélyok, harcmodor_összeg, alakzatharc |
| max_HM_aszimmetria | képlet | tsz, konstansok.hm_aszimmetria_osztó |
| kp_képzettségek | sum_lookup | képzettségek, kp_tábla |
| kp_fortélyok | sum | fortélyok fok |
| kp_hm | képlet | HM_TÉ, HM_VÉ |
| kp_cm | képlet | CM |
| spec_kp | sum | kp_bónusz_fortélyok (negatív kp_perfok, Tartós sérültség is) |
| kiemelt_kp | sum | kiemelt_fortélyok |
| kp_primer_képzettségek | sum_lookup | primer_képzettségek, kp_tábla |
| kp_primer_fortélyok | sum | primer_fortélyok |
| primer_költés | képlet | primer_kp + hm + cm |
| primer_keret | képlet | összes_kp + spec_kp - primer_költés |
| elköltött_kp | képlet | kp_képzettségek + fortélyok + hm + cm + kiemelt |
| maradék_kp | képlet | összes - elköltött |
| sfé_fizikai | képlet | struktúra + alapanyag + idea - rongálódás |
| sfé_energia | képlet | struktúra + alapanyag + idea - rongálódás |
| páncél_struktúra_mgt | lookup | struktúrák tábla |
| páncél_struktúra_sfé_fizikai | lookup | struktúrák tábla |
| páncél_struktúra_sfé_energia | lookup | struktúrák tábla |
| páncél_merev | lookup | struktúrák tábla |
| páncél_fém | lookup | struktúrák tábla |
| páncél_alapanyag_mgt | lookup | fémalapanyagok tábla |
| páncél_alapanyag_sfé_bónusz | lookup | fémalapanyagok tábla |
| páncél_méret_mgt | lookup | méret_tábla |
| merevvért_csökkentés | lookup | merevvért_tábla |
| páncél_csatolt_db | képlet | végtagvédettség + sisak |
| páncél_lefedettség | if | páncél_van, végtagvédettség, sisak |
| páncél_MGT | képlet + nested if/lookup | struktúra + alapanyag + csatolt + méret - erő |
| merevvért_TÉ_büntetés | if | páncél_merev, MGT, csökkentés |
| páncél_struktúra_ár | lookup | struktúrák tábla → struktúra_ár (§43.1) |
| páncél_alapanyag_ár | if + lookup | páncél_fém → alapanyag_ár tábla (nem-fém: 1) (§43.1) |
| páncél_kidolgozottság_ár | lookup | kidolgozottság_ár tábla (§43.1) |
| páncél_idea_ár | lookup | idea_ár tábla (§43.1) |
| páncél_torzó_ár | képlet | struktúra_ár × alapanyag_ár × idea_ár (§43.1) |
| páncél_ár | if + képlet | páncél_van → torzó_ár + csatolt_db × (torzó_ár/5 × kidolgozottság_ár) (§43.1) |
| képzettség_max_szint_primer | képlet | max_szint, tsz |
| képzettség_max_szint_szekunder | képlet | max_szint, tsz + plusz |
| fegyver_TÉ | képlet | alap + tulajdonságok + HM + harcmodor + fegyver + MF + fortély - merevvért_TÉ_büntetés |
| fegyver_VÉ | képlet | alap + tulajdonságok + HM + harcmodor + fegyver + MF + fortély |
| fegyver_SP | képlet | fegyver + floor(min(erő, limit) × (1 + erőbónusz-arány)) + MF + fortély |
| fegyver_harckeret | képlet | harcmodor + gyorsaság - MGT + fortély |
| fegyver_támadások | képlet | 1 + floor(harckeret / sebesség) |
| Aura | képlet | tsz, önuralom |

### 41.10 Szabály hozzáadás workflow

Új reactive rule hozzáadásakor:
1. `data/rules.json` - rule entry (id, formula, inputs)
2. Hívó komponens - `extras` vagy `arrayContext` bővítés a szükséges inputokkal
3. Eredmény kiolvasás: `computed.get('rule_id')` → UI megjelenítés
4. engine_spec frissítés - formula dokumentálás a releváns szekcióban


---

## §42 Egységes effekt-modell (részben implementált)

Két effekt-rendszer él párhuzamosan, részben átfedő, részben szétosztott mód-készlettel:

- **Fortély módosítók** (§16, `fortely-mods.ts`): a karakter build-jéből (fortélyok) folyamatosan
  számított, additív harcérték-módosítók. Mód: `flat | scaled | override | előny | hátrány | enyhít`.
- **Hatás-operátorok** (§22, a 2026-10-16-ig élt `hatas_operatorok.yaml`; azóta `mód`): státuszok / harci helyzetek okozta, nevesített
  szituációs hatások. Mód: `előny_hátrány | szorzó | letilt | max_limit | szöveges | enyhít`.

**Átfedés**: az „előny/hátrány", `szöveges`, `enyhít` fogalom MINDKÉT rendszerben szerepel (duplikáció).
**Szétosztás**: a `szorzó` csak a hatás-operátornál, a `flat`/`override`/`scaled` csak a fortély-módosítónál.
Egy új effekt-forrás (pl. `data/sources/fegyverek/extrak.yaml`) emiatt kénytelen MINDKETTŐBŐL meríteni.

**Cél**: EGY közös effekt-nyelvtan (alak + mód-enum + precedencia), amit minden forrás használ (fortély,
státusz, harci helyzet, extra). A KÓD egyesítése (egyetlen kiértékelő) a reactive engine runtime
effekt-fázisára halasztva (§41) - addig ez vokabulár-szabvány + fokozatos adat-migráció. (YAGNI: a
`calcFortelyMods` működik és tesztelt, big-bang összeolvasztás most csak regressziós kockázat.)

### 42.1 Közös effekt-alak

```
effekt = {cél, mód, érték, feltétel?}
  cél    : HARCÉRTÉK csupasz string (TÉ/VÉ/SP/SFÉ/CÉ/KÉ/harckeret/fegyverhossz/pajzs-VÉ/vé_veszteség …)
           VAGY entitás prefix-string ("manőver:<id>", "fortély:<név>", "képzettség:<név>")
  mód    : lásd 42.2
  érték  : numerikus (flat/szorzó/scaled/override/max_limit/előny/hátrány/enyhít) - vagy nincs (letilt/szöveges)
  feltétel? : opcionális "prefix:érték" string (mint §16/§24) - al-feltétel ERRE az effektre
```

Az ELŐFELTÉTELEK (a teljes effekt-blokk aktiválása) továbbra is a strukturált `{típus, név, érték}`
REFERENCIA-listát használják (a `manoverek.yaml` `követelmények`-je; pilot: `extrak.yaml → feltétel`).

### 42.2 Egyesített mód-enum

| mód | kategória | szemantika | érték | eredet |
|-----|-----------|-----------|-------|--------|
| `flat` | érték-transzf. | cél += érték | int | fortély-módosító |
| `szorzó` | érték-transzf. | cél ×= érték | 0.5=felez, 2=dupláz | hatás-operátor |
| `scaled` | érték-transzf. | cél += FLOOR(forrás × arány) | arány + `forrás` | fortély-módosító |
| `override` | érték-transzf. | cél = érték | int | fortély-módosító |
| `max_limit` | korlát | cél = MIN(cél, érték) | int | hatás-operátor |
| `előny` | kocka | a cél dobására Előny (kategória: `előny_hátrány`) | +1..+2 | egyesített |
| `hátrány` | kocka | a cél dobására Hátrány (kategória: `előny_hátrány`) | -2..-1 | egyesített |
| `enyhít` | státusz | a cél negatív hatás-fokát csökkenti (§22.7) | int | mindkettő |
| `letilt` | boolean | a cél letiltása (auto-kudarc / képesség-vesztés) | - | hatás-operátor |
| `szöveges` | informatív | nem kumulálható, csak megjelenítés | - | mindkettő |

**Két réteg (B döntés):** a fenti a `mód`/`operátor` érték az effekt-ADATBAN. A `előny`/`hátrány` a
`előny_hátrány` MÓD-KATEGÓRIA két operátor-neve (a 2026-10-16-ig élt `hatas_operatorok.yaml` osztályozása) - az adat a
`előny`/`hátrány` nevet írja előjeles értékkel, a `előny_hátrány` a mechanika-osztály.

### 42.3 Alkalmazási precedencia (MEGERŐSÍTVE, 2026-09-20; override: 2026-10-16)

Egy célra több effekt is hathat; a sorrend definiált (különben `szorzó`/`override`/`max_limit` ütközik).
Best practice (GURPS / Pathfinder / CRPG stat-pipeline): **additív előbb, multiplikatív utána**.
A sorrendet a MÓD adja, nem az elem helye a listában.

```
1. override        → a BÁZIST cseréli (több override: az utolsó); a többi réteg erre rakódik
2. flat + scaled   → additív réteg összegződik
3. szorzó          → a szumma szorzása (egy félen belül a legnagyobb, l. lent; kerekítés: FLOOR)
4. max_limit       → felső korlát
5. előny/hátrány   → a VÉGSŐ érték dobására (kocka-dimenzió, clamp [-2,+2]; mód-kategória: előny_hátrány)
6. letilt          → ha aktív, a cél semmis / auto-kudarc
   szöveges        → nem számol, csak listáz
```

Kerekítés: minden nem-egész köztes érték (pl. `szorzó` ×0.5) LEFELÉ kerekül (`FLOOR`) - egyezik a webapp
`scaled` (`Math.floor`) konvenciójával.

Több szorzó (DÖNTÉS 2026-10-16, "keverék" szabály; md/081 "Szorzó hatások ökölszabály"). A tengely a FORRÁS
(melyik félnél keletkezik a szorzó), NEM a cél (kinek az értékére hat):
- **Egy félen belül** (egy fél forrásai - helyzet, státusz, taktika, fegyver-extra - egy célra): a LEGNAGYOBB
  szorzó számít, nem kumulál (globális szabály; a korábbi `duplázás.halmozás: legnagyobb` operátor-mező megszűnt). Kicsinyítő szorzóknál
  (<1) a legkisebb számít; ha nagyító és kicsinyítő is van, a kettő szorzódik (ma nincs ilyen ütközés az adatban).
- **A két fél között**: a szorzók összeszorzódnak - pl. A Roham ×2 · B Helyhez kötve ×2 = ×4 B VÉ-veszteségére.
  Gyakorlati plafon: ×4. A támadó fegyver-extrái (pl. `pajzs_ve_felezes` ×0.5 B pajzs-VÉ-jére) A-oldali szorzók.
  A két fél appja egymástól függetlenül alkalmazza a saját oldali szorzót (a támadó popup a duplázott értéket adja,
  a védő `changeVé` a sajátjával szoroz) - külön koordináció nem kell.
- **Alcél**: az `alcél`-os szorzó CSAK a cél adott komponensére hat (pl. `pajzs_megkerules` ×0 →
  `alcél: felszerelés:pajzs` = a túloldal pajzs-VÉ-je nullázódik, a VÉ többi része nem).
  A motor (`extrak-effekt.ts`) cél+alcél pontos egyezéssel szűr.

### 42.4 Cél-fajták (prefix-vokabulár)

- **Csupasz** (harcérték / esemény-cél): `TÉ VÉ SP SFÉ CÉ KÉ harckeret fegyverhossz pajzs-VÉ vé_veszteség manőver_ellenpróba …` (esemény-célok: `esemenyek.yaml`)
- **Entitás cél-prefix**: `fortély:<név>`, `képzettség:<név>`.
- **Al-feltétel prefix** (per-hatás `feltétel`): `manőver:<id>` (a konkrét manőver, `manoverek.yaml` id) - a manőver-effektek célja `manőver_ellenpróba`, a KONKRÉT manővert al-feltétel adja.
- A prefix-készletet a `konstansok.yaml → feltétel_prefixek`-kel kell összehangolni (közös vokabulár a
  cél- és a feltétel-oldalon).
- **Alcél - felszerelés-komponens** (`alcél: "felszerelés:<komponens>"`, 2026-10-16): a harcérték melyik
  felszerelés-részére hat a hatás. Komponensek (`extrak.schema.yaml → alcel_felszereles_enum`): `fegyver` (a fegyver
  alap TÉ/VÉ/SP-je), `pajzs` (a pajzs VÉ-komponense), `páncél` (a páncél SFÉ-je). Harcérték-célú (`harcérték_célok`)
  **override-hoz kötelező** (build-gate: `extrak_validator.py`, `validate_aktiv_ful` a `fegyver_override`-ra): az
  override a megnevezett komponens bázisát cseréli (§42.3), a többi tag (harcérték-alap, tulajdonság, HM, harcmodor,
  MF, fortély, taktika, helyzet) additív hozzájárulásként marad. Alcél nélküli harcérték-override nem megengedett.
  Példa: Belharc `{cél: TÉ, alcél: felszerelés:fegyver, mód: override, érték: 0}`; Láncos `{cél: VÉ, alcél:
  felszerelés:pajzs, mód: szorzó, érték: 0.5}`.
- **Tiltás-keret** (`tiltás:<id>`, 2026-10-16): egy harci helyzet nevesített `tiltások[]`-a `{id, leírás, feltétel[]}`;
  a feltétel FEGYVERENKÉNT értékelődik ki (forrás: `fegyver.fegyverhossz`, `fegyver.harcmodor`). Hivatkozás: feltételben
  `{forrás: "tiltás:<id>", operátor: "==", érték: true|false}` (pl. Belharc `fegyver_override`, Belharcos fortély).
  Feloldás: a fegyver extrája `{cél: "tiltás:<id>", mód: letilt}` hatással (pl. `pancelszuras_belharcban`). UI: a fegyver
  aktív tiltásai a fegyvertábla ⚠ jelzése, a kézben lévőké az Aktív fül helyzet-chipjén (`getTiltásWarnings`).
  Build-gate: tiltás-szerkezet + engedett forrás (`validate_aktiv_ful`), minden `tiltás:`/`ellenfél_harci_helyzet:`
  hivatkozás létező célra mutat (`validate_effekt_hivatkozasok`, `fortelyok.py`). Kód: `engine/effekt.ts`.
- **Ellenfél-al-feltétel** (`feltétel: "ellenfél_harci_helyzet:<id>"`): a hatás csak az ELLENFÉL adott helyzetében él;
  az app nem tudja eldönteni → KM (az Extrák felirat megnevezi), numerikusan nem alkalmazódik.
- **Alcél - próba-scope** (2026-10-16): fortély-módosító / státusz-hatás próba-célja szűkítve, ugyanúgy `prefix:név`
  alakban: `képzettségpróba` → `képzettség:<képzettség név>`, `tulajdonságpróba` → `tulajdonság:<karakter-séma kulcs>`
  (kisbetűs, pl. `tulajdonság:edzettség`), `érzék_próba` → `érzék:<Érzék-státusz alkategória>` (pl. `érzék:Látás`).
  Build-gate (`validators.proba_alcel_hibak`, fortély + státusz): a prefix illik a célhoz, a név létezik. Fogyasztó:
  `engine/statusz-proba.ts` (képzettség-egyezés). Alkategóriás státusz (`"Érzékvesztés: Látás (2)"`): a gyűjtő `alkategória`
  mezője szűkít - csak a próbához választott érzékre hat (Képzettségpróba popup „Érzék:" sora, 2026-10-18). Így az alcél MINDEN forrásban `prefix:érték` (felszerelés / próba-scope).

### 42.5 Fázisolt migrációs terv

1. **Szabvány** (kész): ez a szekció + a pilot `extrak.yaml` (már megfelel az alaknak/mód-enumnak).
2. **Adat-migráció** (RÉSZBEN: az `extrak.yaml`-re kész - "Extrák" gomb `extrak-info-calc.ts` + a 42.3
   precedencia-motor `harc/extrak-effekt.ts → alkalmazEffektek / aktívHatásokCélra`; numerikusan csak teljes
   korrelációnál, pl. Sebzés popup SP-delta. HÁTRA: fortély `módosítók` + `hatasok.yaml`) (EGYLÉPÉSES - user döntése; nincs backward-compat, a localStorage invalidálható):
   a fortély `módosítók` és a `hatasok.yaml` átállítása a közös alakra. A `előny`/`hátrány` NEM lesz
   átnevezve (B döntés): a `előny_hátrány` a mód-kategória, a data a `előny`/`hátrány` operátor-neveket
   használja előjeles értékkel - ez már konzisztens. A `szöveges`/`enyhít` egyetlen definícióra vonása.
3. **Kód** (a runtime effekt-fázisnál, §41): EGY kiértékelő a 42.3 precedenciával, a `calcFortelyMods` és
   a hatás-operátor-feldolgozás beolvasztásával. Előfeltétel: regressziós védőháló (meglévő fortély-mods
   tesztek + új precedencia-tesztek).

### 42.6 Jelenlegi kódutak (mód → hol kezelődik MA)

A módok jelenleg KÜLÖN kódutakon élnek - ez az egyesítés kiindulópontja és egyben indoka:

| mód | jelenlegi kezelő | § |
|-----|------------------|---|
| `flat` | `engine/effekt.ts` gyűjtő (fortély/alapeset/taktika; `calcFortelyMods` / `calcTaktikaMods` burkolók) + `harc/combat-roll-info.ts` (dobás-bónusz) + `engine/effekt.ts` `gyűjtHelyzetEffektek` (helyzet: `VÉ` → `helyzetMods`, `vé_csökkentés` → VÉ-csökkentés popup, `(bázis + k20P + flat) × szorzó`; a Fárasztás override-jára is ráadódik - általános szabály, 2026-10-16) | §16, §21 |
| `scaled` | `engine/effekt.ts` `gyűjtFortélyEffektek` (képzettség-forrás FLOOR; `erőbónusz` → arány) | §16 |
| `override` | `harc/fegyver-calc.ts` (SP override, fegyver_override) + `harc/extrak-effekt.ts` (extrák) | §5–8, §21 |
| `előny` / `hátrány` | `engine/dice.ts` (rollElőnyHátrányDie) + `engine/statusz-proba.ts` (a `gyűjtStátuszEffektek`-ből, 2026-10-18) / harc-popupok (`harc/combat-roll-info.ts`: a `gyűjt*Effektek` szűrése dobás-célokra; nettó szint: `kockaSzint`, 2026-10-18) | §22 |
| `enyhít` | `engine/statusz-proba.ts` / Hatás pool | §22.7 |
| `letilt` | `harc/taktika-calc.ts` (feltételes TÉ semlegesítés) | §21 |
| `szöveges` | `formatters.tsx` / `harc/HatasokInfo.tsx` (megjelenítés) | §22 |
| `szorzó` | `harc/ve-csokkentes-calc.ts` (taktika vé_csökkentés ×2) + `harc/shared.ts` `véVesztésSzorzó` (vé_veszteség - a `gyűjtHelyzetEffektek` + `gyűjtStátuszEffektek` effektjeiből) + `harc/extrak-effekt.ts` | §21, §22 |
| `max_limit` | `harc/extrak-effekt.ts` motor; `useHarcComputed`: helyzet/státusz `támadások_száma` (pl. Félelem (2): max 1) a fegyversorok + kétkezes `támadások`-ára (2026-10-16) | §42.3 |

Megjegyzés: a `calcFortelyMods` ténylegesen CSAK `flat`+`scaled`-et implementál; a többi mód a fenti EGYÉB kódutakon kezelődik. A `harc/extrak-effekt.ts` a 42.3 precedenciát már implementálja, de csak az extrákra. A 3. FÁZIS (42.5) ezt a szórást vonja egyetlen kiértékelő alá a 42.3 precedenciával.

### 42.7 Rögzített döntések (2026-09-20)

- **Kocka-mechanika (KÉT réteg - B döntés, 2026-09-20)**: a MÓD-KATEGÓRIA `előny_hátrány`
  (osztályozás). Az effekt-ADAT a `előny`/`hátrány` mód-neveket használja
  ELŐJELES értékkel (`+1/+2` = Előny, `-1/-2` = Hátrány). NINCS tömeges átnevezés: a data/kód már
  konzisztens (minden `hátrány` negatív, `előny` pozitív - auditálva). A `előny`/`hátrány` = a
  `előny_hátrány` kategória két olvasható operátor-neve.
- **Precedencia** (42.3): override (bázis-csere) → additív → szorzó → max_limit → előny_hátrány → letilt; kerekítés FLOOR.
  Az override 2026-10-16-ig „mindent felülír" volt; a futó adat (Fárasztás `override 3` + `flat +1` = 4, Belharc
  `fegyver_override`: a fegyver alap TÉ/VÉ 0, a harcmodor/MF/fortély megmarad) bázis-cserét használt, ezért a szabály
  ehhez igazodott. Az override-extrák (`beszorithato`, `pikas_kozrefogasa`, `pocsek_vedekezo`) szintén bázis-csere:
  a fegyver alapértéke nullázódik, a harcos képzettsége marad. Végső nullázásra: `letilt` vagy `max_limit 0`.
- **Cél-vokabulár: explicit alcél (2026-10-16)**: a `fegyver_TÉ`/`fegyver_VÉ` effekt-cél megszűnt → `TÉ`/`VÉ` +
  `alcél: felszerelés:fegyver`. A pajzs-komponens `fegyverfogás:fegyver_pajzs` → `felszerelés:pajzs`. Az alcél a
  rejtett bázis-szabály helyett az adatban nevezi meg a komponenst (§42.4). A `rules.json` `fegyver_TÉ` stb.
  azonosítói a fegyversor KIMENET-nevei, nem effekt-célok - érintetlenek.
- **Forrás-specifikus korlát (B döntés, 2026-10-16)**: egyetlen ilyen van, a taktika VÉ-eltolás ±10
  (`konstansok.taktika_vé_eltolás_limit`, md/065_02 ökölszabály). A taktika-forrás additív VÉ-összegét szorítja,
  NEM a végső VÉ-t - ezért nem `max_limit` effekt. A gyűjtőben nevesített taktika-ág kezeli (nincs általános
  `forrás_korlát` struktúra - YAGNI; második ilyen esetnél általánosítandó). A taktika-feltételes fortély-módosító
  a fortély-csoportba tartozik, a plafonon kívül.
- **Prefix-vokabulár**: a `konstansok.yaml → feltétel_prefixek` tartalmazza a `fortély`, `képzettség`,
  `manőver_állapot`, `ellenfél_fegyver_sebzésjelleg` prefixeket is.
- **Backward-compat**: nincs; a régi localStorage invalidálható.
- **Migráció**: EGYLÉPÉSES (nem fokozatos) - a Fázis-2 egy menetben állítja át a fortély `módosítók` +
  `hatasok.yaml` teljes készletét.
- **Fortély `mód` build-enforce (KÉSZ, 2026-09-20)**: `konstansok.yaml → effekt_módok` kanonikus lista +
  `data/gen/fortelyok.py` validálja ellene (eddig csak a hatás-operátor `validate_hatasok` és a taktika
  `validate_aktiv_ful` volt enforce-olva; a fortély `mód` nem). Az egységes mód-enum így a fortélynál is
  „valódi" (ismeretlen mód → build hiba).
- **Operátor-réteg megszűnt, mindenhol `mód` (A döntés, 2026-10-16)**: a helyzet / státusz / `hatasok.yaml`
  `operátor:` és a taktika `hatás:` kulcsa → `mód:`; `duplázás` → `{mód: szorzó, érték: 2}`, `arányos` →
  `{mód: szorzó, érték: 0.5}`. A `hatas_operatorok.yaml` (+ séma + JSON) törölve: a mód-katalógus egyetlen
  forrása a `konstansok.yaml → effekt_módok`; a `halmozás` mező a globális §42.3 szabályba olvadt. Build-gate:
  `validate_statuszok` / `validate_harci_helyzet_hatasok` / `validate_hatasok_katalogus` / taktika → effekt_módok.
  (A feltétel-predikátumok `{forrás, operátor: ">", érték}` operátora összehasonlító reláció, NEM effekt - marad.)

---
## §43 Fegyver és páncél ár-modell

Az ár egy arány-szorzó (egymáshoz viszonyított érték), nem valuta. Szabálykönyv:
`md/068_01_05_fegyverek_ara.md` (fegyver), `md/069_06_pancel_ara.md` (páncél).

### §43.1 Páncél ár (reactive, rules.json)

```
páncél_torzó_ár = struktúra_ár × alapanyag_ár × idea_ár
páncél_ár = páncél_torzó_ár + csatolt_tag_db × (páncél_torzó_ár / 5 × kidolgozottság_ár)
```

- Lookup-táblák: `konstansok.yaml` → `páncél_struktúrák[].struktúra_ár`, `alapanyag_ár`,
  `idea_ár`, `kidolgozottság_ár`.
- `alapanyag_ár`: csak fém struktúránál (`páncél_fém`); nem-pozitív / hiányzó → 1 (semleges).
- Nincs páncél (`páncél_van = 0`) → ár 0.
- Szabályok: `rules.json` `páncél_struktúra_ár`, `páncél_alapanyag_ár`, `páncél_idea_ár`,
  `páncél_kidolgozottság_ár`, `páncél_torzó_ár`, `páncél_ár`.

### §43.2 Fegyver ár (generátor + fegyver-ar-calc.ts, NEM reactive)

```
fegyver_ár = ár_alap × alapanyag_ár_szorzó[anyag] × ár_szorzó_idea[idea]
```

- `ár_alap`: a fegyver fix felépítésének alapára (hossz-szorzó × ár-osztály × fejdarab),
  amit a generátor számol a `fegyverek_v2.json`-ba. Hossz-szorzó: 0.5× (0-2), 1× (3-6),
  2× (7+). A webapp NEM ismeri az ár-osztály/fejdarab logikát.
- A webapp (`fegyver-ar-calc.ts`) csak a hangolható tengelyeket teszi rá: `anyag`
  (`konstansok.yaml → alapanyag_ár_szorzó`, pl. Fa 0.1×, Bronz 0.5×, Acél 1×, Abbitacél 10×,
  Mithrill 100×, Lunír 100000×) és `idea` (`ár_szorzó_idea`).
- `ár_alap = null` (fixed fegyver, nincs ár-modell: Garott, hárítók, Kopják, pajzsok) → ár null
  (a chip nem jelenít árat). Ismeretlen anyag/idea → 1 (trust boundary: localStorage elavult lehet).
- Az alapanyag ár-szorzók azonosak a páncél alapanyag-szorzóival + a "Fa" alapanyaggal.
