#!/usr/bin/env python3
"""Fegyvergenerátor — nagyszabású balansz-elemzés, MINDEN fegyver × TÖBB körülmény.

Cél: konklúziót levonni arról, mely fegyverek túl erősek / túl gyengék / jól hangoltak,
minél szélesebb körülmény-mátrixban (páncélosztály × döntési AI be/ki × létszámarány).
NEM egyetlen új mechanika validálása (ahhoz a `harcszimulacio_selftest.py` és a
`fegyvergenerator_harcszimulator.py`/`_taktikai_ai.py` self-testjei valók) — ez itt egy
FELMÉRÉS, aggregált statisztikával.

Metodológia (l. harcszimulacio.spec.md §12.1 — a klón-csapda):
  - Minden fegyvert egy FIX REFERENCIA fegyver ("Kard, hosszú") ellen mérünk 1:1-ben,
    5 páncélosztályban (csupasz/puha/bőr/lánc/merev), A/B teszttel: alap motor (AI nélkül)
    VS döntési AI-val (kuzdelem_ai) — ez adja a "mennyit nyer/veszít a taktikai réteg" képet.
  - Kiegészítő dimenzió: aszimmetrikus túlerő (1 hős a referenciafegyverrel vs 3 db azonos
    fegyveres, gyengébb "pribék" profil) — a §12.1 csapda miatt KÖTELEZŐ, nem hagyható ki,
    különben a tükör-teszt egyenletesen elfedi a találat-függő mechanikák hatását.
  - Minden mérési pont N=250 futás (a teljes mátrix 66 fegyver × 5 páncél × 2 AI-mód × 2
    (tükör+túlerő) ≈ 1320 mérési pont × 250 futás — ez már ~15-20 perc, ezért a futásszámot
    a script paraméterben tartjuk, gyors smoke-teszthez csökkenthető).

Kimenet: CSV (`code/balance/output/fegyverbalansz_matrix.csv`) + konzolos összesítő —
az összesítő a KONKLÚZIÓHOZ kell (túl erős / túl gyenge / jól hangolt lista), a CSV a
nyers adat, amiből bármilyen további szűrés/pivot elvégezhető.

Futtatás:  python3 code/balance/fegyvergenerator_balansz_elemzes.py [--n=250] [--gyors]
"""
import csv
import pathlib
import random
import sys
import time
from statistics import mean

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import fegyvergenerator_harcszimulator as S
import fegyvergenerator_taktikai_ai as AI

OUT_DIR = pathlib.Path(__file__).resolve().parent / "output"
OUT_DIR.mkdir(exist_ok=True)

REFERENCIA = "Kard, hosszú"
PANCEL_OSZTALYOK = ["csupasz", "puha", "bor", "lanc", "merev"]


def _profil_referencia(nev, **pm):
    return S._profil_referencia(nev, **pm)


def _profil_pribek(nev):
    return S._profil_pribek(nev)


def meres_tukor(fnev, mod, pancel_oszaly, n, ai, seed):
    """1:1, azonos profil, fnev vs REFERENCIA. Visszaad: (győz_arány, átlag_kör)."""
    random.seed(seed)
    pm = S.pancel_profil_mezok(pancel_oszaly)
    ref_mod = S.ALL_WEAPON_MODES[REFERENCIA][0]
    wins = 0
    hosszak = []
    for _ in range(n):
        a = S.Harcos(fnev, 0, _profil_referencia("A", **pm), mod)
        b = S.Harcos(REFERENCIA, 1, _profil_referencia("B", **pm), ref_mod)
        fn = AI.kuzdelem_ai if ai else S.kuzdelem
        gy, kor = fn([a, b], pancel_oszaly=pancel_oszaly)
        wins += gy == 0
        hosszak.append(kor)
    return wins / n, mean(hosszak)


def meres_tulero(fnev, mod, pancel_oszaly, n, ai, seed, letszam=3):
    """1 hős (fnev) vs `letszam` db azonos-fegyveres pribék. Visszaad: (hős győz_arány, átlag_kör)."""
    random.seed(seed)
    pm = S.pancel_profil_mezok(pancel_oszaly)
    wins = 0
    hosszak = []
    for _ in range(n):
        hos = S.Harcos("Hős", 0, _profil_referencia("Hős", **pm), mod)
        pribekek = [S.Harcos(f"P{i}", 1, _profil_pribek(f"P{i}"), mod) for i in range(letszam)]
        fn = AI.kuzdelem_ai if ai else S.kuzdelem
        gy, kor = fn([hos] + pribekek, pancel_oszaly=pancel_oszaly, max_kor=60)
        wins += gy == 0
        hosszak.append(kor)
    return wins / n, mean(hosszak)


def fut_matrix(n=250, gyors=False):
    fegyverek = list(S.ALL_WEAPON_MODES.items())
    if gyors:
        fegyverek = fegyverek[::4]   # minden 4. fegyver — smoke teszthez
        n = min(n, 80)

    sorok = []
    t0 = time.time()
    total = len(fegyverek) * len(PANCEL_OSZTALYOK) * 2
    done = 0
    for fnev, modok in fegyverek:
        mod = modok[0]
        for panc in PANCEL_OSZTALYOK:
            for ai in (False, True):
                seed = hash((fnev, panc, ai)) % 1_000_000
                tukor_arany, tukor_hossz = meres_tukor(fnev, mod, panc, n, ai, seed)
                tulero_arany, tulero_hossz = meres_tulero(fnev, mod, panc, n, ai, seed + 1)
                sorok.append(dict(
                    fegyver=fnev, kategoria=mod.kategoria, pengehossz=mod.pengehossz,
                    sp_fix=mod.sp, te=mod.te, ve=mod.ve, sebesseg=mod.sebesseg,
                    pancel=panc, ai="igen" if ai else "nem",
                    tukor_gyozelem=round(tukor_arany, 4), tukor_kor=round(tukor_hossz, 2),
                    tulero_1v3_gyozelem=round(tulero_arany, 4), tulero_1v3_kor=round(tulero_hossz, 2),
                ))
                done += 2
        elapsed = time.time() - t0
        print(f"  [{done}/{total}] {fnev:28s} kész ({elapsed:.0f}s)", flush=True)
    return sorok


def ir_csv(sorok, path):
    if not sorok:
        return
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(sorok[0].keys()))
        w.writeheader()
        w.writerows(sorok)


def konkluziok(sorok):
    """Fegyverenkénti aggregálás: átlag győzelmi arány AI-val, minden páncél/túlerő átlagolva."""
    per_fegyver = {}
    for r in sorok:
        if r["ai"] != "igen":
            continue
        key = r["fegyver"]
        per_fegyver.setdefault(key, dict(tukor=[], tulero=[], kategoria=r["kategoria"], pengehossz=r["pengehossz"]))
        per_fegyver[key]["tukor"].append(r["tukor_gyozelem"])
        per_fegyver[key]["tulero"].append(r["tulero_1v3_gyozelem"])

    agg = []
    for fnev, d in per_fegyver.items():
        agg.append(dict(
            fegyver=fnev, kategoria=d["kategoria"], pengehossz=d["pengehossz"],
            tukor_atlag=mean(d["tukor"]), tukor_min=min(d["tukor"]), tukor_max=max(d["tukor"]),
            tulero_atlag=mean(d["tulero"]),
        ))
    agg.sort(key=lambda x: -x["tukor_atlag"])

    print("\n=== KONKLÚZIÓ — fegyverek AI-val mért tükör-győzelmi átlaga (Kard, hosszú ellen, 5 páncélosztály) ===")
    print(f"  {'fegyver':<28s} {'kat.':<12s} {'Ph':>4s} {'tükör átlag':>12s} {'  min':>6s} {'  max':>6s} {'1v3 átlag':>10s}")
    for r in agg:
        print(f"  {r['fegyver']:<28s} {r['kategoria']:<12s} {r['pengehossz']:>4} "
              f"{r['tukor_atlag']:>11.1%} {r['tukor_min']:>6.1%} {r['tukor_max']:>6.1%} {r['tulero_atlag']:>9.1%}")

    print("\n=== GYANÚSAN ERŐS (tükör átlag > 65%, minden páncélban legalább 55%) ===")
    for r in agg:
        if r["tukor_atlag"] > 0.65 and r["tukor_min"] > 0.55:
            print(f"  ⚠ {r['fegyver']:<28s} tükör átlag {r['tukor_atlag']:.1%} (min {r['tukor_min']:.1%})")

    print("\n=== GYANÚSAN GYENGE (tükör átlag < 35%, minden páncélban legfeljebb 45%) ===")
    for r in agg:
        if r["tukor_atlag"] < 0.35 and r["tukor_max"] < 0.45:
            print(f"  ⚠ {r['fegyver']:<28s} tükör átlag {r['tukor_atlag']:.1%} (max {r['tukor_max']:.1%})")

    print("\n=== PÁNCÉLFÜGGŐ SZÉLSŐSÉG (max-min tükör szórás > 30pp — a fegyver páncélérzékeny) ===")
    for r in agg:
        if r["tukor_max"] - r["tukor_min"] > 0.30:
            print(f"  ⚠ {r['fegyver']:<28s} min {r['tukor_min']:.1%} → max {r['tukor_max']:.1%} (szórás {r['tukor_max']-r['tukor_min']:.1%})")

    print("\n=== KATEGÓRIA ÁTLAGOK (tükör győzelem, AI-val) ===")
    kat_agg = {}
    for r in agg:
        kat_agg.setdefault(r["kategoria"], []).append(r["tukor_atlag"])
    for kat, vals in sorted(kat_agg.items(), key=lambda x: -mean(x[1])):
        print(f"  {kat:<14s} átlag {mean(vals):.1%}  (n={len(vals)} fegyver)")

    return agg


if __name__ == "__main__":
    n = 250
    gyors = "--gyors" in sys.argv
    for arg in sys.argv[1:]:
        if arg.startswith("--n="):
            n = int(arg.split("=")[1])

    print(f"=== Fegyverbalansz mátrix futtatása (n={n}/pont, gyors={gyors}) ===")
    t0 = time.time()
    sorok = fut_matrix(n=n, gyors=gyors)
    print(f"\nMátrix kész, {len(sorok)} sor, {time.time()-t0:.0f}s alatt.")

    csv_path = OUT_DIR / "fegyverbalansz_matrix.csv"
    ir_csv(sorok, csv_path)
    print(f"CSV kiírva: {csv_path}")

    konkluziok(sorok)
