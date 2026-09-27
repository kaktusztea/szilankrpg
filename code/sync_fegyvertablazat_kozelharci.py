#!/usr/bin/env python3
"""Fegyvergenerátor → éles md fegyvertáblázat-fejezet szinkronizálása.

A `data/sources/fegyverek/fegyverek.yaml` "közelharci" kategóriájú rekordjait a
fegyvergenerátor (`code/balance/fegyvergenerator_balansz.py`) modelljével harcértékekre
számolja, PLUSZ a `data/sources/fegyverek/fegyverek_fixed.json` "közelharci" rekordjait
(Garott, Hárító: Alkarvédő, Hárító: Tonfa — már végleges módok[] JSON, nem WORK-paraméter,
nem megy át a generátor modellen), és a kimenő markdown táblát beírja az éles
`md/068_02_kozelharci_fegyverek.md` fájlba, a `<!-- tag: md_table_fegyver_start -->` /
`_end -->` tag-pár közé — a fájl többi része (leíró szöveg, lábjegyzet-szekciók,
footer-linkek) érintetlen marad.

A generátor **saját formátumát** használja (nincs backward compatibility a régi flat
séma oszlopaival) — a régi `Pengehossz`/`MK`/`KF`/`Íves` oszlopok helyett a `módok[]`
struktúra (Aktor, Jelleg, Sebzéstípus) jelenik meg, egy fegyver több sorban, módonként.

Futtatás:  python3 code/sync_fegyvertablazat_kozelharci.py
Csak akkor ír, ha a táblázat tartalma valóban változott (git diff-barát, "no-op ha nincs
változás" elv, l. AGENTS.md).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "balance"))
import fegyvergenerator_balansz as bal  # noqa: E402

F = bal.Fegyver

MD_PATH = Path(__file__).resolve().parent.parent / "md" / "068_02_kozelharci_fegyverek.md"
FIXED_PATH = Path(__file__).resolve().parent.parent / "data" / "sources" / "fegyverek" / "fegyverek_fixed.json"
TAG_START = "<!-- tag: md_table_fegyver_start -->"
TAG_END = "<!-- tag: md_table_fegyver_end -->"
KATEGORIA = "közelharci"

FEJLEC = ["Fegyver", "Mód (Aktor)", "Jelleg", "Sebzéstípus", "TÉ", "VÉ", "SP", "Erőlimit", "Átütés", "Seb.", "Forgatás", "Fh", "FSZ", "Extrák", "Megj."]
JOBBRA_OSZLOPNEVEK = {"TÉ", "VÉ", "SP", "Erőlimit", "Átütés", "Seb.", "Fh", "FSZ"}
JOBBRA = {FEJLEC.index(nev) for nev in JOBBRA_OSZLOPNEVEK}

_EXTRAK = {m["id"]: m for m in bal._load("extrak.yaml")["extrak"]}


def _extra_cimke(mid):
    return _EXTRAK.get(mid, {}).get("név", mid)


def _megj(r):
    return r.get("megjegyzés", "")


def _extrak(r):
    fv = r["fegyver"]
    ids = list(r.get("extrak", []))
    ids += list(bal.FEGYVERHOSSZ[fv["hossz"]].get("extrak", []))
    ids += list(bal.SZALFEGYVER_NYELANYAG[fv.get("szálfegyver_nyélanyag", "sima")].get("extrak", []))
    ids += list(bal.HAJLEKONY[fv.get("hajlékony", 0)].get("extrak", []))
    ids += list(bal.LANCOS[fv.get("láncos", 0)].get("extrak", []))
    cimkek = [_extra_cimke(mid) for mid in ids]
    felszerelés_pont = bal.FEGYVERHOSSZ[fv["hossz"]].get("felszerelés_pont", 0)
    if felszerelés_pont:
        cimkek.append(f"Felszerelés: {felszerelés_pont}")
    akadaly = fv.get("akadály", 0)
    if akadaly:
        cimkek.append(f"Akadály: {akadaly}")
    if bal.FEGYVERHOSSZ[fv["hossz"]].get("övön_hordható"):
        cimkek.append("Övön hordható")
    return "; ".join(cimkek)


def _fixed_sorok():
    """`fegyverek_fixed.json` (Garott, hárítófegyverek, Kopják) — már végleges módok[] JSON,
    nem a fegyverek.yaml WORK-formátum, ezért nem megy át a F(...).modok(ero=0) hívásán."""
    rows = []
    data = json.loads(FIXED_PATH.read_text(encoding="utf-8"))
    for r in data:
        if r.get("kategória") != KATEGORIA:
            continue
        megj = r.get("megjegyzés", "")
        for i, m in enumerate(r.get("módok", [])):
            n = r["név"] if i == 0 else ""
            mm = megj if i == 0 else ""
            rows.append([n, m["aktor"], (m["jelleg"] + " · FP" if m.get("FP") else m["jelleg"]), m["sebzéstípus"],
                         str(m["TÉ"]), str(m["VÉ"]), f"{m['SP']:+d}", str(m["Erőlimit"]), str(m["Átütés"]),
                         str(m["Sebesség"]) if m["Sebesség"] is not None else "-", m["Forgatás"],
                         str(r["fegyverhossz"]), str(0), "; ".join(r.get("extrák", [])), mm])
    return rows


def sorok():
    rows = []
    for r in bal._load("fegyverek.yaml"):
        if r.get("kategória") != KATEGORIA:
            continue
        f = F(név=r["név"], **r["fegyver"])
        megj, extrak = _megj(r), _extrak(r)
        for i, m in enumerate(f.modok(ero=0)):
            n = r["név"] if i == 0 else ""
            mm = megj if i == 0 else ""
            ex = extrak if i == 0 else ""
            rows.append([n, m["aktor"], (m["tipus"] + " · FP" if m.get("puha") else m["tipus"]), m["sebzestipus"],
                         str(m["TE"]), str(m["VE"]),
                         f"{m['SP']:+d}", str(m["erőbónusz_limit"]), str(m["AT"]), str(m["SEB"]), m["forgatás"],
                         str(f.hossz), str(m.get("felszerelés_pont", 0)), ex, mm])
    rows += _fixed_sorok()
    return rows


def render_tabla(rows):
    w = [len(h) for h in FEJLEC]
    for r in rows:
        for c, val in enumerate(r):
            w[c] = max(w[c], len(val))
    cell = lambda val, c: (val.rjust(w[c]) if c in JOBBRA else val.ljust(w[c]))
    sep = lambda c: (("-" * (w[c] - 1) + ":") if c in JOBBRA else "-" * w[c])
    lines = ["| " + " | ".join(cell(FEJLEC[c], c) for c in range(len(FEJLEC))) + " |",
             "| " + " | ".join(sep(c) for c in range(len(FEJLEC))) + " |"]
    for r in rows:
        lines.append("| " + " | ".join(cell(r[c], c) for c in range(len(FEJLEC))) + " |")
    return "\n".join(lines)


def main():
    text = MD_PATH.read_text(encoding="utf-8")
    start = text.find(TAG_START)
    end = text.find(TAG_END)
    if start == -1 or end == -1 or end < start:
        print(f"ERROR: tag pár nem található: {MD_PATH}", file=sys.stderr)
        return 2

    table = render_tabla(sorok())
    new_text = text[:start + len(TAG_START)] + "\n\n" + table + "\n\n" + text[end:]

    if new_text == text:
        print("Nincs változás — fájl érintetlen.")
        return 0

    MD_PATH.write_text(new_text, encoding="utf-8")
    print(f"Frissítve: {MD_PATH} ({len(sorok())} sor)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
