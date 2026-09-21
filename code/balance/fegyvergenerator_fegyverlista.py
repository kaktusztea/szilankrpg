#!/usr/bin/env python3
"""Teljes mainstream közelharci fegyverlista generálása a v2 (mátrix) modellel.

Az éles 068_0x fegyvertáblák mainstream közelharci fegyvereit képezi le a
fegyvergenerátor paramétereire, és markdown táblát emittál (Erő=0 bázisértékek,
mint a v2 'Konkrét fegyverek' szekció).

Leképezés: pengehossz→fegyverhossz (0→0/1, 0.5→2, 1→3, 1.5→5, 2→7, 3/4→9, 5→12),
sebzés módja→Aktor (S→pengehegy, V-egyenes→vágóél-egyenes, V-íves→vágóél-íves, Z→botvég/buzogányfej),
súly az Erő-követelményből. Kihagyva: hárítófegyverek, puszta kéz, exotikus-speciális, pajzs, távharc.

Futtatás:  python3 code/balance/fegyvergenerator_fegyverlista.py > STUDY.fegyvergenerator_v2_fegyverlista.md

─────────────────────────────────────────────────────────────────────────────
Eredet: szilank.wiki/STUDY.fegyvergenerator_v2_fegyverlista.gen.py — migrálva 2026-09-10.
A migrációnál a `STUDY.` prefixes fájlnév miatti importlib-hack helyére sima
import került (a modulnév most már valid Python azonosító).

FIGYELEM: tervezői eszköz, nem a data pipeline része. A kimenetét NE írd rá
automatikusan az éles `md/068_0x_*.md` fegyvertáblákra — azok kézzel hangoltak.
─────────────────────────────────────────────────────────────────────────────
"""
import datetime

import fegyvergenerator_balansz as bal

F = bal.Fegyver
FEGYVERHOSSZ = bal.FEGYVERHOSSZ

# (kategória, megjelenített név, Fegyver, megjegyzés)
# WORK paraméterek: data/fegyvergenerator/fegyverek.yaml (a `kat` mezővel bíró rekordok)
_EXTRAK = {m["id"]: m for m in bal._load("extrak.yaml")["extrak"]}


def _extra_cimke(mid):
    return _EXTRAK.get(mid, {}).get("név", mid)


def _megj(r):
    """Megj. cella: KIZÁRÓLAG a szabad szöveges megjegyzés (az extrák a külön 'Extrák' oszlopban)."""
    return r.get("megj", "")


def _extrak(r):
    """Extrák cella: az extrák NEVE (saját + a fegyverhossz-kategória örökölt), ';' jellel elválasztva."""
    ids = list(r.get("extrak", [])) + list(bal.FEGYVERHOSSZ[r["fegyver"]["hossz"]].get("extrak", []))
    return "; ".join(_extra_cimke(mid) for mid in ids)


W = [(r["kat"], r["név"], F(név=r["név"], **r["fegyver"]), _megj(r), _extrak(r))
     for r in bal._load("fegyverek.yaml") if "kat" in r]


FEJLEC = ["Fegyver", "Mód (Aktor)", "Jelleg", "Sebzéstípus", "TÉ", "VÉ", "SP", "Erőlimit", "Átütés", "Seb.", "Forgatás", "Fh", "Extrák", "Megj."]
JOBBRA = {4, 5, 6, 7, 8, 9, 11}  # jobbra igazított (numerikus) oszlopok


def sorok_kategoriankent():
    out = {}
    for kat, nev, f, megj, extrak in W:
        rows = out.setdefault(kat, [])
        for i, m in enumerate(f.modok(ero=0)):
            n = nev if i == 0 else ""
            mm = megj if i == 0 else ""
            ex = extrak if i == 0 else ""
            rows.append([n, m["aktor"], m["tipus"], m["sebzestipus"],
                         str(m["TE"]), str(m["VE"]),
                         f"{m['SP']:+d}", str(m["erőbónusz_limit"]), str(m["AT"]), str(m["SEB"]), m["forgatás"],
                         str(f.hossz), ex, mm])
    return out


def emit_tabla(rows):
    w = [len(h) for h in FEJLEC]
    for r in rows:
        for c, val in enumerate(r):
            w[c] = max(w[c], len(val))
    cell = lambda val, c: (val.rjust(w[c]) if c in JOBBRA else val.ljust(w[c]))
    sep = lambda c: (("-" * (w[c] - 1) + ":") if c in JOBBRA else "-" * w[c])
    print("| " + " | ".join(cell(FEJLEC[c], c) for c in range(len(FEJLEC))) + " |")
    print("| " + " | ".join(sep(c) for c in range(len(FEJLEC))) + " |")
    for r in rows:
        print("| " + " | ".join(cell(r[c], c) for c in range(len(FEJLEC))) + " |")


GEN_CMD = "python3 code/balance/fegyvergenerator_fegyverlista.py > STUDY.fegyvergenerator_v2_fegyverlista.md"

INTRO = """> ⚠️ **AUTOMATIKUSAN GENERÁLT OLDAL — kézzel NE szerkeszd.**
>
> Generálva: `{datum}` · Forrás: `data/fegyvergenerator/*.yaml`
>
> Előállító parancs (a `szilank.code` repóból, a kimenetet ebbe a fájlba irányítva): `{cmd}`

# Fegyvergenerátor → v2 mainstream fegyverlista

Az éles `068_0x` közelharci fegyvertáblák **mainstream** fegyverei a jelenlegi (v2) generátorral
leszármaztatva, **harcmodoronként külön táblázatban** (mint az éles doksiban).
Forrás/terv: [STUDY.fegyvergenerator_v2](STUDY.fegyvergenerator_v2).

- **Generátor:** `szilank.code/code/balance/fegyvergenerator_fegyverlista.py` (a `fegyvergenerator_balansz.py` modellt használja) → a táblák **reprodukálhatók**.
- **Értékek:** Erő=0 bázis (a játékban az Erőbónusz hozzáadódik az SP-hez). A sebzésjelleg×páncél módosító NEM ezekben van, hanem harc közben a páncél fajtájától függ.
- **Nem cél a régi éles fegyvertábla reprodukálása** → a generátor a mérvadó.

## Hogyan olvasd

- **Harcmodoronként külön tábla:** Közelharci, Kardvívó, Lándzsavívó, Romboló, Ostorharc.
- **Több mód:** a többféle sebzésű fegyverek (pl. kard `V/S`) több sorban szerepelnek, Aktoronként.
- **Jelleg / Sebzéstípus:** a `Jelleg` a sebzés jellege (szúró / vágó / zúzó); a `Sebzéstípus` a rang: `elsődleges` = alap sebzésmód (nincs büntetés), `másodlagos` = bejelentés után `Hátrány-1 Sebzésdobásra` (lehet több is). Az `alkalmatlan` nincs a táblában (KM: `Hátrány-2`). Éles: `064_02_05`.
- **Fh** = Fegyverhossz kategória. **Seb.** = Sebesség (magasabb = lassabb).
- **Erőlimit** = Erőbónusz limit: a sebzésbe (SP) fordítható Erő felső plafonja; `99` = nincs plafon (egyedi per-fegyver érték, `064_02_06`).
- **Beszorítható** = Beszorított(2) tag (kat. 7 és 9, hosszú fegyver): ha az ellenfél bejut, `TÉ:0` ÉS `VÉ:0` (szituációs harci helyzet, nem a bázisérték). Kat. 12 NEM.
- **Extrák** (külön oszlop, `extrak.yaml`): a bázisra jövő, feltételhez kötött hatások NEVE, `;` jellel elválasztva (saját + a fegyverhossz-kategória örökölt); a **Különleges felkészítés** (KF) kiképzés-függő bónusz. A tábla a **felkészítetlen** bázist mutatja; ezek szituációsan jönnek rá.
- **Megj.**: szabad szöveges mechanika-jegyzet (a strukturált hatások az Extrák oszlopban vannak).
- **(spec)** = egyedi mechanika, amit a generátor nem modellez (szöveges szabály az éles anyagban).

## Scope

Tartalmazza: közelharci (tőr-osztály), kardvívó, lándzsavívó, romboló, ostorharc mainstream fegyverek.
Kihagyva (más alrendszer / egyedi mechanika): hárítófegyverek, Puszta kéz, Garott, Méregfog, Béltépő, Kopja (lovas), pajzsok, hajító- és lőfegyverek.

---"""


def emit_intro():
    print(INTRO.format(datum=datetime.date.today().isoformat(), cmd=GEN_CMD))


emit_intro()
for kat, rows in sorok_kategoriankent().items():
    print(f"\n### {kat}\n")
    emit_tabla(rows)
