#!/usr/bin/env python3
"""Régi (`data/tables/fegyverek.json`, webapp runtime) vs ÚJ (v2 fegyvergenerátor,
`data/fegyvergenerator/fegyverek.generated.json`) harcérték-összehasonlítás.

A két forrás STRUKTÚRÁJA eltér:
  RÉGI: flat lista, egy fegyver = egy rekord, TÉ/VÉ/SP egyetlen szám (stringként).
        (1K)/(2K) párok külön rekord (`Alapnév`/`MK_pár` mezővel összekapcsolva).
        Van benne 4 "Hárító: ..." és 3 pajzs rekord, amik NEM fegyverek — kizárva.
  ÚJ:   fegyverenkénti `módok[]` lista (elsődleges/másodlagos aktor-variánsok saját
        TÉ/VÉ/SP-vel). Az ELSŐDLEGES módot (`sebzéstípus: "elsődleges"`) vesszük az
        összevetéshez, mert ez felel meg a régi egyetlen flat sornak.

Névpárosítás: NEM egyezik automatikusan minden esetben (pl. "Predoci egyeneskard" (régi)
vs "Kard, predoci egyeneskard" (új), "Alabárd S+V"/"Alabárd Z" (régi, 2 sor) vs "Alabárd"
(új, 1 sor)) — kézi alias-tábla + "nincs pár" listázás mindkét irányban.

Futtatás:  python3 code/balance/fegyverek_regi_uj_osszehasonlitas.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OLD_PATH = ROOT / "data" / "tables" / "fegyverek.json"
NEW_PATH = ROOT / "data" / "fegyvergenerator" / "fegyverek.generated.json"

NEM_FEGYVER_PREFIX = ("Hárító:", "Kis Pajzs", "Közepes Pajzs", "Nagy Pajzs")

# Kézi alias: régi rekordnév → új fegyver név. Csak ott kell, ahol a puszta string NEM egyezik.
ALIAS_REGI_UJ = {
    "Predoci egyeneskard": "Kard, predoci egyeneskard",
    "Kard, Pugoss": "Pugoss",
    "Puszta kéz Belharcban": "Puszta kéz, belharcban",
    "Alabárd S+V": "Alabárd",
    "Alabárd Z": "Alabárd",   # a régiben 2 sor (S+V és Z mód), az újban 1 (a módok[] fedi le mindkettőt)
    "Kard, másfélkezes (1K)": "Kard, másfélkezes",
    "Kard, másfélkezes (2K)": "Kard, másfélkezes",
    "Kard, mesterkard (1K)": "Kard, mesterkard",
    "Kard, mesterkard (2K)": "Kard, mesterkard",
    "Kard, Slan 1K": "Kard, Slan",
    "Kard, Slan 2K": "Kard, Slan",
    "Mara-sequor 1K": "Mara-sequor",
    "Mara-sequor 2K": "Mara-sequor",
    "Tőr, hárító": None,   # nincs új megfelelője (hárítófegyver-specifikus régi sor)
    "Garott": None,        # nincs az új katalógusban
    "Kard, fejvadász": None,
    "Kard, Lagoss": None,
    "Kopja, harci": None,
    "Kopja, torna": None,
}


def _safe_int(v, default=0):
    try:
        return int(v)
    except (ValueError, TypeError):
        return default


def load_old():
    raw = json.loads(OLD_PATH.read_text(encoding="utf-8"))
    out = []
    for r in raw:
        nev = r["Fegyver"]
        if any(nev.startswith(p) for p in NEM_FEGYVER_PREFIX):
            continue
        out.append(dict(
            nev=nev,
            te=_safe_int(r["TÉ"]), ve=_safe_int(r["VÉ"]), sp=r["SP"], sebesseg=_safe_int(r["Sebesség"]),
            pengehossz=r["Pengehossz"], kategoria=r["Kategória"], atutes=_safe_int(r["Átütés"]),
            forgatas=r["Forgatás módja"],
        ))
    return out


def load_new():
    raw = json.loads(NEW_PATH.read_text(encoding="utf-8"))
    out = {}
    for r in raw:
        elsodleges = next((m for m in r["módok"] if m["sebzéstípus"] == "elsődleges"), r["módok"][0])
        out[r["név"]] = dict(
            nev=r["név"], te=elsodleges["TÉ"], ve=elsodleges["VÉ"], sp=elsodleges["SP"],
            sebesseg=elsodleges["Sebesség"], pengehossz=r["fegyverhossz"],
            kategoria=r["kategória"], atutes=elsodleges["Átütés"], forgatas=elsodleges["Forgatás"],
        )
    return out


def sp_szam(sp_str):
    """A régi SP mező '+4' formátumú string → int."""
    if isinstance(sp_str, (int, float)):
        return int(sp_str)
    m = re.match(r"([+-]?\d+)", str(sp_str).strip())
    return int(m.group(1)) if m else 0


def main():
    old = load_old()
    new = load_new()

    sorok = []
    nincs_uj_par = []
    for o in old:
        cel_nev = ALIAS_REGI_UJ.get(o["nev"], o["nev"])
        if cel_nev is None:
            nincs_uj_par.append(o["nev"])
            continue
        n = new.get(cel_nev)
        if n is None:
            nincs_uj_par.append(f"{o['nev']} (alias célja '{cel_nev}' sem található az újban)")
            continue
        sorok.append(dict(
            regi_nev=o["nev"], uj_nev=n["nev"],
            te_regi=o["te"], te_uj=n["te"], te_delta=n["te"] - o["te"],
            ve_regi=o["ve"], ve_uj=n["ve"], ve_delta=n["ve"] - o["ve"],
            sp_regi=sp_szam(o["sp"]), sp_uj=n["sp"], sp_delta=n["sp"] - sp_szam(o["sp"]),
            seb_regi=o["sebesseg"], seb_uj=n["sebesseg"], seb_delta=n["sebesseg"] - o["sebesseg"],
            at_regi=o["atutes"], at_uj=n["atutes"], at_delta=n["atutes"] - o["atutes"],
            kategoria=o["kategoria"],
        ))

    uj_nevek_lefedve = {s["uj_nev"] for s in sorok}
    uj_csak_ujban = sorted(set(new.keys()) - uj_nevek_lefedve)

    return sorok, nincs_uj_par, uj_csak_ujban


def md_riport(sorok, nincs_uj_par, uj_csak_ujban):
    from collections import defaultdict
    from statistics import mean

    sorok_rendezve = sorted(sorok, key=lambda x: (x["kategoria"], x["regi_nev"]))

    def fmt_delta(v):
        return f"{v:+d}" if v != 0 else "±0"

    sorok_md = []
    sorok_md.append("# Fegyverek — régi vs v2 generátor összehasonlítás\n")
    sorok_md.append(
        "Forrás: `data/tables/fegyverek.json` (régi, webapp runtime) vs "
        "`data/fegyvergenerator/fegyverek.generated.json` (v2 generátor, elsődleges mód).\n"
    )
    sorok_md.append(
        "A Δ oszlopok az **új − régi** különbséget mutatják (pozitív = az új verzióban nagyobb).\n"
    )

    kategoriak = sorted(set(s["kategoria"] for s in sorok))
    for kat in kategoriak:
        kat_sorok = [s for s in sorok_rendezve if s["kategoria"] == kat]
        sorok_md.append(f"\n## {kat.capitalize()} ({len(kat_sorok)} db)\n")
        sorok_md.append(
            "| Fegyver (régi név) | TÉ régi | TÉ új | TÉ Δ | VÉ régi | VÉ új | VÉ Δ | "
            "SP régi | SP új | SP Δ | Seb. régi | Seb. új | Seb. Δ | Átütés Δ |"
        )
        sorok_md.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        for s in kat_sorok:
            sorok_md.append(
                f"| {s['regi_nev']} | {s['te_regi']} | {s['te_uj']} | {fmt_delta(s['te_delta'])} | "
                f"{s['ve_regi']} | {s['ve_uj']} | {fmt_delta(s['ve_delta'])} | "
                f"{s['sp_regi']} | {s['sp_uj']} | {fmt_delta(s['sp_delta'])} | "
                f"{s['seb_regi']} | {s['seb_uj']} | {fmt_delta(s['seb_delta'])} | "
                f"{fmt_delta(s['at_delta'])} |"
            )

    sorok_md.append("\n## Kategóriánkénti átlag delta\n")
    sorok_md.append("| Kategória | db | TÉ Δ átlag | VÉ Δ átlag | SP Δ átlag |")
    sorok_md.append("|---|---|---|---|---|")
    kat_agg = defaultdict(lambda: dict(te=[], ve=[], sp=[]))
    for s in sorok:
        kat_agg[s["kategoria"]]["te"].append(s["te_delta"])
        kat_agg[s["kategoria"]]["ve"].append(s["ve_delta"])
        kat_agg[s["kategoria"]]["sp"].append(s["sp_delta"])
    for k, d in sorted(kat_agg.items()):
        sorok_md.append(f"| {k} | {len(d['te'])} | {mean(d['te']):+.1f} | {mean(d['ve']):+.1f} | {mean(d['sp']):+.1f} |")

    sorok_md.append("\n## Régi rekordoknak nincs új megfelelője\n")
    for n in nincs_uj_par:
        sorok_md.append(f"- {n}")

    sorok_md.append("\n## Új fegyvereknek nincs régi megfelelője\n")
    for n in uj_csak_ujban:
        sorok_md.append(f"- {n}")

    return "\n".join(sorok_md) + "\n"


if __name__ == "__main__":
    sorok, nincs_uj_par, uj_csak_ujban = main()

    print(f"=== Párosítva: {len(sorok)} fegyver ===\n")
    hdr = f"{'régi/új név':<32s} {'kat.':<12s} {'TÉ Δ':>6s} {'VÉ Δ':>6s} {'SP Δ':>6s} {'Seb Δ':>6s} {'Átütés Δ':>9s}"
    print(hdr)
    for s in sorted(sorok, key=lambda x: (x["kategoria"], x["regi_nev"])):
        print(f"{s['regi_nev']:<32s} {s['kategoria']:<12s} "
              f"{s['te_delta']:>+6d} {s['ve_delta']:>+6d} {s['sp_delta']:>+6d} "
              f"{s['seb_delta']:>+6d} {s['at_delta']:>+9d}")

    print(f"\n=== NAGY delta (|TÉ|+|VÉ|+|SP| > 5) — leginkább megváltozott fegyverek ===")
    for s in sorted(sorok, key=lambda x: -(abs(x["te_delta"]) + abs(x["ve_delta"]) + abs(x["sp_delta"]))):
        osszeg = abs(s["te_delta"]) + abs(s["ve_delta"]) + abs(s["sp_delta"])
        if osszeg > 5:
            print(f"  {s['regi_nev']:<32s} TÉ {s['te_regi']:>3d}→{s['te_uj']:<3d} ({s['te_delta']:+d})  "
                  f"VÉ {s['ve_regi']:>3d}→{s['ve_uj']:<3d} ({s['ve_delta']:+d})  "
                  f"SP {s['sp_regi']:>3d}→{s['sp_uj']:<3d} ({s['sp_delta']:+d})")

    print(f"\n=== Régi rekordoknak NINCS új megfelelője ({len(nincs_uj_par)}) ===")
    for n in nincs_uj_par:
        print(f"  {n}")

    print(f"\n=== Új fegyvereknek NINCS régi megfelelője ({len(uj_csak_ujban)}) ===")
    for n in uj_csak_ujban:
        print(f"  {n}")

    print(f"\n=== Kategóriánkénti átlag delta ===")
    from collections import defaultdict
    from statistics import mean
    kat = defaultdict(lambda: dict(te=[], ve=[], sp=[]))
    for s in sorok:
        kat[s["kategoria"]]["te"].append(s["te_delta"])
        kat[s["kategoria"]]["ve"].append(s["ve_delta"])
        kat[s["kategoria"]]["sp"].append(s["sp_delta"])
    for k, d in kat.items():
        print(f"  {k:<14s} TÉ átlag {mean(d['te']):+.1f}  VÉ átlag {mean(d['ve']):+.1f}  SP átlag {mean(d['sp']):+.1f}  (n={len(d['te'])})")

    md_path = pathlib.Path("/mnt/c/repo/szilank.wiki/STUDY.fegyvergenerator_osszahasonlitas.md")
    md_path.write_text(md_riport(sorok, nincs_uj_par, uj_csak_ujban), encoding="utf-8")
    print(f"\nMarkdown riport kiírva: {md_path}")
