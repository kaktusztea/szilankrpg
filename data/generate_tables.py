#!/usr/bin/env python3
"""Generate tables/*.json from YAML source files.

A generátorok a `gen/` csomagban élnek (egy modul = egy adatterület), ez a fájl
csak a CLI-t, a freshness ellenőrzést és a sorrendet tartja.

Run from repo root or from data/ directory.
Usage: python3 data/generate_tables.py
       python3 data/generate_tables.py --force   # skip freshness check
"""

import os, sys

# A gen/ csomag importálható legyen bármelyik munkakönyvtárból indítva
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen.common import SOURCES_DIR, hibak_kilep  # noqa: E402
from gen.cache import sources_unchanged, write_hash, write_marker  # noqa: E402
from gen.konstansok import generate_konstansok  # noqa: E402
from gen.kepzettsegek import generate_kepzettsegek  # noqa: E402
from gen.fortelyok import generate_fortelyok, generate_kiterjesztesek, generate_primer_fortelyok  # noqa: E402
from gen.fajok import generate_fajok  # noqa: E402
from gen.aktiv_ful import generate_aktiv_ful  # noqa: E402
from gen.fegyverek_v2 import generate_fegyverek_v2, generate_sebzesjelleg_pancel_matrix, generate_fegyver_extrak, generate_fegyver_idea_tabla, generate_tavfegyverek_v2  # noqa: E402
from gen.naming_lint import lint as lint_naming  # noqa: E402
from gen.kiterjesztes_check import kiterjesztes_sync_hibak  # noqa: E402
from gen.hivatkozas import id_hivatkozasi_hibak, manover_ref_hibak  # noqa: E402

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


def main():
    force = '--force' in sys.argv

    # Naming-convention build-gate: MINDIG fut (a freshness-skip előtt is)
    hibak_kilep("YAML naming-convention hibák (nem-mozaikszó nagybetűs kulcs/érték)", lint_naming([SOURCES_DIR]))

    if not force and sources_unchanged():
        print("Tables up-to-date, skipping generation.")
        return

    print("Generating tables...")
    for generate in GENERATORS:
        generate()

    # Post-hoc build-gate-ek (a generált táblákat / forrásokat olvassák)
    hibak_kilep("Fortély → manőver referenciális hibák", manover_ref_hibak())
    hibak_kilep("Fortély / képzettség id-hivatkozási hibák", id_hivatkozasi_hibak())
    hibak_kilep("Kiterjesztés md ↔ data layer eltérések (a képzettség md a source of truth)", kiterjesztes_sync_hibak())
    write_marker()   # Vite plugin freshness detection
    write_hash()     # a következő futás skip-ellenőrzéséhez
    print("Done.")


if __name__ == '__main__':
    main()
