#!/usr/bin/env python3
"""Generate tables/*.json from YAML source files.

A generátorok a `gen/` csomagban élnek (egy modul = egy adatterület), ez a fájl
csak a CLI-t, a freshness ellenőrzést és a sorrendet tartja.

Run from repo root or from data/ directory.
Usage: python3 data/generate_tables.py
       python3 data/generate_tables.py --force   # skip freshness check
"""

import json, os, sys

# A gen/ csomag importálható legyen bármelyik munkakönyvtárból indítva
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen.common import TABLES_DIR, load_yaml  # noqa: E402
from gen.cache import sources_unchanged, write_hash, write_marker  # noqa: E402
from gen.konstansok import generate_konstansok  # noqa: E402
from gen.kepzettsegek import generate_kepzettsegek  # noqa: E402
from gen.fortelyok import generate_fortelyok, generate_kiterjesztesek, generate_primer_fortelyok  # noqa: E402
from gen.fajok import generate_fajok  # noqa: E402
from gen.aktiv_ful import generate_aktiv_ful  # noqa: E402
from gen.fegyverek_v2 import generate_fegyverek_v2, generate_sebzesjelleg_pancel_matrix, generate_fegyver_extrak, generate_fegyver_idea_tabla, generate_tavfegyverek_v2  # noqa: E402
from gen.naming_lint import lint as lint_naming  # noqa: E402

# Generálási sorrend: a későbbiek az előzők kimenetére építhetnek
GENERATORS = [
    generate_konstansok,
    generate_kepzettsegek,
    generate_fortelyok,
    generate_kiterjesztesek,
    generate_primer_fortelyok,
    generate_fajok,
    generate_aktiv_ful,
    generate_fegyverek_v2,
    generate_sebzesjelleg_pancel_matrix,
    generate_fegyver_extrak,
    generate_fegyver_idea_tabla,
    generate_tavfegyverek_v2,
]


def validate_fortely_manover_refs():
    """Post-hoc: a fortély módosítók `manőver:<id>` céljai létező manővert jelölnek-e.

    Csak generálás UTÁN futtatható, mert mindkét tábla kimenetét használja.
    """
    with open(os.path.join(TABLES_DIR, 'manoverek.json'), encoding='utf-8') as f:
        manover_ids = {m['id'] for m in json.load(f)}
    with open(os.path.join(TABLES_DIR, 'fortelyok.json'), encoding='utf-8') as f:
        fortelyok = json.load(f)

    errors = []
    for fort in fortelyok:
        for fok in fort.get('fokok', []):
            for mod in (fok.get('módosítók') or []):
                if isinstance(mod, dict) and isinstance(mod.get('cél'), str) and mod['cél'].startswith('manőver:'):
                    mid = mod['cél'].split(':', 1)[1]
                    if mid not in manover_ids:
                        errors.append(f"{fort['név']} fok {fok['fok']}: ismeretlen manőver id: '{mid}'")
    if errors:
        print("  ❌ Fortély → manőver referenciális hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_nev_hivatkozasok():
    """Post-hoc build-gate: a név szerinti hivatkozások létező fortély / képzettség `név` mezőjére mutatnak
    (PONTOS egyezés). Hatókör: fortély `követelmények` (képzettség / fortély / tiltó_fortély), faj-listák
    (érzék / kötelező / faji / ajánlott / tiltott fortélyok, ajánlott / tiltott képzettségek, faj misztérium).
    A harcmodorok a `Harcmodor` többszörös képzettség elemei → a `konstansok.harcmodorok` nagy kezdőbetűvel.
    """
    def load(n):
        with open(os.path.join(TABLES_DIR, n), encoding='utf-8') as f:
            return json.load(f)
    fortely = {f['név'] for f in load('fortelyok.json')}
    hm = load('konstansok.json')['harcmodorok']
    kepz = {k['név'] for k in load('kepzettsegek.json')} | {h[:1].upper() + h[1:] for h in hm['közelharci'] + hm['távolsági']}
    errors = []
    def check(ctx, nev, halmaz, mi):
        for n in (nev if isinstance(nev, list) else [nev]):
            if n not in halmaz: errors.append(f"{ctx}: ismeretlen {mi}: '{n}'")
    for fort in load('fortelyok.json'):
        for fok in fort.get('fokok', []):
            for k in fok.get('követelmények') or []:
                ctx = f"fortély {fort['név']} fok {fok['fok']} követelmény"
                if k.get('típus') == 'képzettség': check(ctx, k['név'], kepz, 'képzettség')
                elif k.get('típus') in ('fortély', 'tiltó_fortély'): check(ctx, k['név'], fortely, 'fortély')
    fdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sources', 'fajok')
    for fn in sorted(os.listdir(fdir)):
        if not fn.endswith('.yaml'): continue
        d = load_yaml(os.path.join(fdir, fn)); ctx = f"fajok/{fn}"
        for key in ('érzék_fortélyok', 'ajánlott_fortélyok'):
            for e in d.get(key) or []: check(f"{ctx} {key}", e.get('név', ''), fortely, 'fortély')
        for key in ('kötelező_fortélyok', 'faji_fortélyok', 'tiltott_fortélyok'):
            for n in d.get(key) or []: check(f"{ctx} {key}", n, fortely, 'fortély')
        for key in ('ajánlott_képzettségek', 'tiltott_képzettségek'):
            for n in d.get(key) or []: check(f"{ctx} {key}", n, kepz, 'képzettség')
        if d.get('faj_misztérium'): check(f"{ctx} faj_misztérium", f"Faj misztérium: {d['faj_misztérium']}", kepz, 'képzettség')
    if errors:
        print("  ❌ Név-hivatkozási hibák (pontos `név` egyezés kell):")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_naming_convention():
    """Build-gate: egységes YAML naming-convention (nem-mozaikszó kulcs/érték = csupa kisbetű).

    A data/sources (pipeline, a fegyvergenerátor `fegyverek/` almappáját is beleértve) fájljait ellenőrzi.
    """
    data_dir = os.path.dirname(os.path.abspath(__file__))
    dirs = [os.path.join(data_dir, 'sources')]
    errors = lint_naming(dirs)
    if errors:
        print("  ❌ YAML naming-convention hibák (nem-mozaikszó nagybetűs kulcs/érték):")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def main():
    force = '--force' in sys.argv

    # Naming-convention build-gate: MINDIG fut (a freshness-skip előtt is)
    validate_naming_convention()

    if not force and sources_unchanged():
        print("Tables up-to-date, skipping generation.")
        return

    print("Generating tables...")
    for generate in GENERATORS:
        generate()

    validate_fortely_manover_refs()
    validate_nev_hivatkozasok()
    write_marker()   # Vite plugin freshness detection
    write_hash()     # a következő futás skip-ellenőrzéséhez
    print("Done.")


if __name__ == '__main__':
    main()
