## Bónuszok alkalmazásának sorrendje

A lenti bónuszok meghatározott sorrendben kerülnek kiértékelésre. A [Szilánk webapp](010_02_szilank_webapp.md) is e szerint számolja az értékeket.

```
  1. Felülírás        (override)
   → az alapértéket cseréli
   → Ha több van: az utolsó a forrás-sorrendben
  2. Sima + Skálázott (flat + scaled)
  3. Szorzó           (legnagyobb számít)
  4. Maximum limit    (max_limit)
  5. Előny/Hátrány    
  6. Letiltás         (letilt)
```

---

## 🔆 Ökölszabály: Szorzó hatások

Egy karakterre ható több szorzó kombinációja esetén CSAK a legnagyobb számít.\
Természetesen ez a másik karakter oldalán is igaz, így szélsőséges esetben lehetséges, hogy a támadó és védő szorzói erősítik egymás hatását ("összeszorzódnak").

## 🔆 Ökölszabály: Védő Érték eltolás

**Védő Értékedet** legfeljebb `-10/+10` értékkel tolhatod el (taktikák kombinálása esetén is).

## 🔆 Ökölszabály: Előny/Hátrány korlátok

```
MIN,MAX: [-2, +2]
```

Sem az `Előny`, sem a `Hátrány` dobások nem mehetnek `-2` alá és `+2` fölé semmilyen bónusz/büntetés halmozással.

## 🔆 Ökölszabály: Próba-kategóriák

A **Státuszok** Hatásai gyakran egy próba-kategóriára vonatkoznak. Hogy egy próba fizikai vagy szellemi, azt a dobáshoz használt **Tulajdonság** dönti el (a Képzettségpróbánál a KM választja, lásd [Képzettségpróba](030_06_01_kepzettsegproba.md#próbadobás)).

- **Fizikai próba**: [Erő](010_05_01_01_ero.md), [Edzettség](010_05_01_02_edzettseg.md), [Ügyesség](010_05_01_03_ugyesseg.md) vagy [Gyorsaság](010_05_01_04_gyorsasag.md) Tulajdonsággal dobott Tulajdonságpróba vagy Képzettségpróba
- **Szellemi próba**: [Intelligencia](010_05_01_05_intelligencia.md), [Emlékezet](010_05_01_06_emlekezet.md), [Önuralom](010_05_01_07_onuralom.md) vagy [Érzékenység](010_05_01_08_erzekenyseg.md) Tulajdonsággal dobott Tulajdonságpróba vagy Képzettségpróba
- **Szociális képzettségpróba**: [Befolyásolás](kepzettsegek.primer/altalanos/befolyasolas.md), [Etikett](kepzettsegek.szekunder/etikett.md), [Emberismeret](kepzettsegek.primer/altalanos/emberismeret.md)
- **Nem-harci képzettségpróba**: minden Képzettségpróba, kivéve a [Harci képzettségeket](030_01_kepzettseglista.md#harci-képzettségek-️)
- **Kreatív / koncentrációt igénylő** tevékenység: a KM dönti el, szituációtól függően

🔆 Egy próba több kategóriába is tartozhat (pl. Intelligenciával dobott Etikett: szellemi és szociális is). Ilyenkor minden érintett Hatás érvényes, a [korlátokon](#-ökölszabály-előnyhátrány-korlátok) belül.

🔆 A [Csoportos képzettségpróba](030_06_02_csoportos_kepzettsegproba.md) fizikai / szellemi típusa más fogalom: az együttműködés módját jelöli.

---

🔗 [Szilánk](010_06_szilank.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#1-karakteralkotás)
