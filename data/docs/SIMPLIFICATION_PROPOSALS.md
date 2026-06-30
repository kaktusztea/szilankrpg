# Szilánk RPG — Egyszerűsítő javaslatok (engine_spec alapján)

A szabályrendszer (md/) és a webapp data layer/kód közötti logikai párhuzamosságot megőrizve.
Ha a szabályrendszer tartalmaz egy "büntetés + fortély mérséklés" mechanikát, azt nem egyszerűsítjük el a webapp-ban önkényesen — a kettőnek tükröznie kell egymást.

Az alábbiak vagy **mindkét oldalon** egyszerűsíthetők (szabályrendszer + webapp együtt), vagy pusztán **data layer / implementációs** szinten tömörítenek anélkül, hogy a szabályrendszer logikája változna.

---
## 1. Pajzshasználat — data layer tömörítés (szabályrendszer változatlan)

**Probléma:** A szabályrendszer logikája: "pajzs TÉ büntetés → Pajzshasználat fortély mérsékli" — ez önmagában rendben van, ez a játékmechanika. A webapp-implementáció viszont 3 rétegen vezeti át (konstans tábla + fortély yaml módosító + MIN kalkuláció), ami feleslegesen szétszórt.

**Javaslat:** A data layer-ben egyetlen `pajzs_hatások` lookup tábla váltsa ki a szétszórt kalkulációt:

```yaml
# konstansok.yaml
pajzs_hatások:
  kis:     [{ fok: 0, VÉ: 3, TÉ: -3 }, { fok: 1, VÉ: 3, TÉ: 0 }, { fok: 2, VÉ: 3, TÉ: 0 }, { fok: 3, VÉ: 5, TÉ: 0 }]
  közepes: [{ fok: 0, VÉ: 10, TÉ: -6 }, { fok: 1, VÉ: 10, TÉ: -3 }, { fok: 2, VÉ: 10, TÉ: 0 }, { fok: 3, VÉ: 12, TÉ: 0 }]
  nagy:    [{ fok: 0, VÉ: 16, TÉ: -9 }, { fok: 1, VÉ: 16, TÉ: -6 }, { fok: 2, VÉ: 16, TÉ: -3 }, { fok: 3, VÉ: 18, TÉ: 0 }]
```

A szabályrendszer markdown továbbra is leírhatja: "A pajzs TÉ büntetése méretenként -3/-6/-9, a Pajzshasználat fortély fokonként +3-mal mérsékli, 3.fokon +2 VÉ extra." A tábla ugyanezt tartalmazza — csak előre kiszámolva, nem runtime kalkulálva.

**Megszűnik:**
- `konstansok.pajzs_TÉ_büntetés` + fortély yaml `pajzs_TÉ_mérséklés` cél + `MIN(0, ...)` logika
- A fortély yaml 3 fok × `feltétel: fegyverfogás:fegyver_pajzs` módosítók

**Szabályrendszer hatás:** Nincs. A tábla a szabályrendszer szövegének előre kifejtett formája.

---
## 2. Kétkezes harc — egyetlen centralizált tábla (implementációs egyszerűsítés)

**Probléma:** A szabályrendszer egy fokozatos mechanikát ír le (0-3 fok → TÉ/VÉ/harckeret/MF). A webapp ezt 4 külön mechanizmuson vezeti át (konstansok 0.fok + fortély yaml harckeret + kalkulált feltétel Kétkezesség + hardcoded MF logika).

**Javaslat:** A `konstansok.yaml` `kétkezes_harc_bónuszok` tábláját bővítsük ki, hogy **minden fokozat minden értéke** egy helyen legyen:

```yaml
kétkezes_harc_fokok:
  - fok: 0
    TÉ: -3
    VÉ: -3
    harckeret: 1
    mindkét_fegyver: false
    mf: "nincs"
  - fok: 1
    TÉ: 0
    VÉ: 0
    harckeret: 2
    mindkét_fegyver: true
    mf: "nincs"
  - fok: 2
    TÉ: 0
    VÉ: 0
    harckeret: 3
    mindkét_fegyver: true
    mf: "nagyobb"
  - fok: 3
    TÉ: 0
    VÉ: 0
    harckeret: 4
    mindkét_fegyver: true
    mf: "mindkettő"

kétkezesség_harckeret_bónusz: 1  # Kétkezesség fortély megléte: +1 harckeret
```

A `ketkezes.ts` egyetlen tábla-lookup-ból dolgozik. A fortély yaml `Kétkezes harc` nem tartalmaz harckeret módosítókat — azok itt élnek.

**Megszűnik:**
- Kétkezes harc fortély yaml: `fegyverfogás:kétkezes` feltételes harckeret módosítók (redundáns a táblával)
- Kétkezesség fortély: strukturált feltétel `[{forrás: "kétkezes_harc", op: "==", érték: true}]` — helyette egyszerű boolean lookup a ketkezes.ts-ben
- Két párhuzamos feltétel-rendszer (string prefix + kalkulált) ugyanarra a dologra

**Szabályrendszer hatás:** Nincs. A md/ továbbra is leírja a fokozatokat szövegesen; a tábla ugyanazt tartalmazza.

---
## 3. Csatolt tag MGT — 3 tábla → 1 mátrix (data layer tömörítés)

**Probléma:** 3 ArrayContext lookup tábla + nested if/lookup a reactive rule-ban. A szabályrendszer egyetlen táblázatot mutat (struktúra típus × kidolgozottság → MGT/tag).

**Javaslat:**

```yaml
# konstansok.yaml
csatolt_tag_mgt:
  merev_fém:       { átlagos: 3, mestermunka: 2, műremek: 1 }
  hajlékony_fém:   { átlagos: 2, mestermunka: 1, műremek: 0 }
  nem_fém:         { átlagos: 1, mestermunka: 0, műremek: 0 }
```

Reactive rule: egyetlen 2D lookup (vagy if-chain a 3 típusra + stringCtx kidolgozottság kulcs).

**Megszűnik:**
- 3 külön ArrayContext tömb (`csatolt_mgt_merev/fém/nemfém`)
- A `buildArrayContext` 3 tábla-feltöltő blokk

**Szabályrendszer hatás:** Nincs. A md/ táblázat pont ezt írja le.

---
## 4. Természetes fegyver — fegyver-szintű override (implementációs egyszerűsítés)

**Probléma:** A generikus `mód: "override"` + `feltétel: "fegyver:puszta kéz"` rendszert egyetlen fegyverre használjuk, és a `fegyver-calc.ts`-ben speciális pre-loop logika kezeli.

**Javaslat:** A Puszta kéz fegyver definíciójában (fegyverek.json / process_fegyverek.py) legyen explicit:

```json
{
  "Fegyver": "Puszta kéz",
  "SP": 0,
  "SP_override": { "fortély": "Természetes fegyver", "SP": 4 }
}
```

A `fegyver-calc.ts` ellenőrzi: "van SP_override a fegyveren? van a fortély? → SP = override.SP + erőbónusz + MF."

**Megszűnik:**
- A generikus fortély-módosító override scan (ami amúgy is csak erre az 1 esetre fut)
- A fortély yaml `mód: "override"` + `feltétel: "fegyver:puszta kéz"` entry

**Szabályrendszer hatás:** Nincs. A md/ azt mondja: "Természetes fegyver fortéllyal a puszta kéz SP = X." A webapp ugyanezt teszi — csak a fegyver definícióból olvassa, nem a fortély módosítóból.

---
## 5. Fárasztás — maradjon taktika, de a nem-kalkulált rész legyen tisztán informatív

**Probléma:** A Fárasztás taktika tényleges hatása (VÉ csökk: 2/kör) nem kalkulált — a webapp csak informatív szöveget mutat. Mégis teljes taktika entry-ként él (kombó szabályok, megkötések, fortély_bővítés).

**Javaslat:** Maradjon taktika (a szabályrendszer így definiálja), de a yaml-ban legyen explicit jelölve, hogy a módosítói nem harcértékre vonatkoznak:

```yaml
- név: "Fárasztás"
  id: "fárasztás"
  fokozatos: false
  módosítók: {}           # üres — nincs TÉ/VÉ/KÉ/SP módosító
  informatív: "VÉ csökk: 2/kör (+fortély +pengeelőny). Nem támad."
  tiltja_taktikákat: false
  kombó_mód: "whitelist"
  kombó_lista: []         # semmivel nem kombinálható
  megkötések:
    - { típus: "harci_helyzet", mód: "tiltott", érték: "pengehátrány" }
    - { típus: "harci_helyzet", mód: "tiltott", érték: "láthatatlanul_hallhatóan" }
    - { típus: "harci_helyzet", mód: "tiltott", érték: "láthatatlanul_csendesen" }
```

A `taktika-calc.ts`-ben: ha `módosítók` üres → nem ad semmit a taktikaMods-hoz. A Hatás pool-ban az `informatív` szöveg jelenik meg.

**Megszűnik:**
- Fárasztás fortély `fortély_bővítés` mechanizmus a taktikán (ami amúgy is csak a VÉ csökk szöveget módosítja)
- A taktikaMods logika üres ciklusfutása erre

**Szabályrendszer hatás:** Nincs. A Fárasztás marad taktika (mert az), csak a webapp nem próbálja kalkulálni a nem-kalkulálhatót.

---
## 6. Merevvértviselet Alapeset — törlés (implementációs)

**Probléma:** A Merevvértviselet fortély 0.fok Alapeset entry-je (§16.1) azt jelzi: "ha nincs fortélyod és merev páncélt viselsz, büntetés van." De a `merevvért_TÉ_büntetés` reactive rule **mindig kiszámítja ezt** — az Alapeset csak a Hatás pool-ban duplikálja az információt.

**Javaslat:** Töröld a fortély yaml 0.fok entry-jét. A Hatás pool "Merevvért TÉ büntetés" információ jelenjen meg közvetlenül a reactive rule eredményéből (`computed.merevvért_TÉ_büntetés > 0` esetén).

**Megszűnik:**
- A fortély yaml 0.fok entry (feltétel: `páncél_viselés`)
- Az `evaluateAlapesetek()` kiértékelése erre

**Marad:**
- A reactive rule (`merevvért_TÉ_büntetés`) — ez adja a tényleges hatást
- A `merevvért_tábla` lookup (fok → csökkentés) — ez a szabályrendszer logikáját tükrözi

**Szabályrendszer hatás:** Nincs. A md/ ugyanazt mondja: "Merev páncél MGT = TÉ büntetés, Merevvértviselet csökkenti." A webapp számítja — az Alapeset nem ad hozzá semmit.

---
## Összefoglaló

| #   | Eset                         | Típus                | Szabályrendszer módosul? |
| --- | ---------------------------- | -------------------- | ------------------------ |
| 1   | Pajzshasználat tábla         | Data layer tömörítés | ❌ Nem                    |
| 2   | Kétkezes harc tábla          | Data layer tömörítés | ❌ Nem                    |
| 3   | Csatolt tag MGT              | Data layer tömörítés | ❌ Nem                    |
| 4   | Természetes fegyver override | Implementáció        | ❌ Nem                    |
| 5   | Fárasztás informatív jelölés | Data layer tisztítás | ❌ Nem                    |
| 6   | Merevvértviselet Alapeset    | Implementáció        | ❌ Nem                    |
