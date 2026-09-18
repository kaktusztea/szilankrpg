#!/usr/bin/env python3
"""Teljes mainstream közelharci fegyverlista generálása a v2 (mátrix) modellel.

Az éles 068_0x fegyvertáblák mainstream közelharci fegyvereit képezi le a
fegyvergenerátor paramétereire, és markdown táblát emittál (Erő=0 bázisértékek,
mint a v2 'Konkrét fegyverek' szekció).

Leképezés: pengehossz→fegyverhossz (0→0/1, 0.5→2, 1→3, 1.5→5, 2→7, 3/4→9, 5→12),
sebzés módja→Aktor (S→pengehegy, V-egyenes→vágóél-egyenes, V-íves→vágóél-íves, Z→botvég/buzogányfej),
súly az Erő-követelményből. Kihagyva: hárítófegyverek, puszta kéz, exotikus-speciális, pajzs, távharc.

Futtatás:  python3 code/fegyvergenerator_fegyverlista.py > /tmp/fegyverlista.md

─────────────────────────────────────────────────────────────────────────────
Eredet: szilank.wiki/STUDY.fegyvergenerator_v2_fegyverlista.gen.py — migrálva 2026-09-10.
A migrációnál a `STUDY.` prefixes fájlnév miatti importlib-hack helyére sima
import került (a modulnév most már valid Python azonosító).

FIGYELEM: tervezői eszköz, nem a data pipeline része. A kimenetét NE írd rá
automatikusan az éles `md/068_0x_*.md` fegyvertáblákra — azok kézzel hangoltak.
─────────────────────────────────────────────────────────────────────────────
"""
import fegyvergenerator_balansz as bal

F = bal.Fegyver
FEGYVERHOSSZ = bal.FEGYVERHOSSZ

# (kategória, megjelenített név, Fegyver, megjegyzés)
# WORK paraméterek: data/fegyvergenerator/fegyverek.yaml (a `kat` mezővel bíró rekordok)
def _megj(r):
    """Megj. cella: a szöveges megj + a strukturált követelmény (ha van)."""
    m = r.get("megj", "")
    k = r.get("kovetelmeny")
    if k:
        kv = f"Köv.: {k['nev']} {k['tipus']} {k['ertek']}"
        m = f"{m}; {kv}" if m else kv
    return m


W = [(r["kat"], r["nev"], F(nev=r["nev"], **r["fegyver"]), _megj(r))
     for r in bal._load("fegyverek.yaml") if "kat" in r]


def forg(f):
    base = FEGYVERHOSSZ[f.hossz]["forg"]
    return base + (" (1 kézzel)" if f.egykezes_kenyszer else "")

FEJLEC = ["Fegyver", "Mód (Aktor)", "Jelleg", "Sebzéstípus", "TÉ", "VÉ", "SP", "Átütés", "Seb.", "Forgatás", "Fh", "Megj."]
JOBBRA = {4, 5, 6, 7, 8, 10}  # jobbra igazított (numerikus) oszlopok


def sorok_kategoriankent():
    out = {}
    for kat, nev, f, megj in W:
        rows = out.setdefault(kat, [])
        for i, m in enumerate(f.modok(ero=0)):
            n = nev if i == 0 else ""
            mm = megj if i == 0 else ""
            par = " ⚠️párbaj:VÉ0" if m["parbaj_alkalmatlan"] else ""
            rows.append([n, m["aktor"], m["tipus"], m["sebzestipus"],
                         str(m["TE"]), str(m["VE"]),
                         f"{m['SP']:+d}", str(m["AT"]), str(m["SEB"]), forg(f),
                         str(f.hossz), (mm + par).strip()])
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


for kat, rows in sorok_kategoriankent().items():
    print(f"\n### {kat}\n")
    emit_tabla(rows)
