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

---

🔗 [Szilánk](010_06_szilank.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#1-karakteralkotás)
