"""data/sources/fegyverek/fegyverek.yaml (+ fegyverek_fixed.json) → tables/fegyverek_v2.json

A Fegyvergenerátor v2 (`code/balance/fegyvergenerator_balansz.py`) modelljével leszármaztatott
mainstream fegyverek JSON-exportja — build-gate-be kötve (l. STUDY.fegyvergenerator_v2 wiki,
"Migrációs terv" 3a pont). A kimenet EGY fegyver = EGY elem, `módok` tömbbel (fegyvermódonként,
aktoronként) — NEM a régi flat `data/tables/fegyverek.json` sémája.

Szándékosan ÚJ, KÜLÖN fájlba ír (`fegyverek_v2.json`) — a régi `data/tables/fegyverek.json`-t
a webapp jelenleg is olvassa (`engine/data-loader.ts`), ennek átállítása külön lépés (3b),
amíg az nem kész, a két fájl egymás mellett él, nincs felülírás/duplikáció a kimeneten.
"""

import os
import sys

from .common import DATA_DIR, load_yaml, write_json

_BALANCE_DIR = os.path.join(DATA_DIR, '..', 'code', 'balance')


def generate_sebzesjelleg_pancel_matrix():
    """sebzesjelleg_pancel_matrix.yaml → sebzesjelleg_pancel_matrix.json.

    A mátrix a szituációs SP-balansz adatforrása (sebzésjelleg × páncélosztály → SP delta)
    ÉS a `struktúra_osztály` leképezés (páncél_struktúra → 5 páncélosztály egyike). A webapp
    Sebzés popup „Ellenfél páncél" választója ezt olvassa (l. STUDY.fegyvergenerator_v2 3g).
    A YAML teljes egészében data layer marad — a TS csak a lookup-ot végzi.
    """
    src = os.path.join(DATA_DIR, 'sources', 'fegyverek', 'sebzesjelleg_pancel_matrix.yaml')
    data = load_yaml(src)
    write_json('sebzesjelleg_pancel_matrix.json', data)


def generate_fegyverek_v2():
    """fegyverek.yaml → fegyverek_v2.json (a fegyvergenerátor natural módok[] modellje).

    Séma-hiba esetén (extrak.yaml / fegyverek.yaml) a build-gate hibával áll — ugyanazt a
    validációt futtatja, amit a `code/balance/fegyvergenerator_json.py` CLI-módban is.
    """
    if _BALANCE_DIR not in sys.path:
        sys.path.insert(0, _BALANCE_DIR)
    import extrak_validator  # noqa: E402
    import fegyverek_validator  # noqa: E402
    import fegyvergenerator_json as fgj  # noqa: E402

    # A validátorok print()-je STDOUT-ra menne (elszennyezné a build-log-ot) — STDERR-re irányítva.
    _stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        ok = extrak_validator.run() and fegyverek_validator.run()
    finally:
        sys.stdout = _stdout
    if not ok:
        raise SystemExit("fegyvergenerátor séma-hiba — javítsd a fentieket, a fegyverek_v2.json nem generálódott.")

    write_json('fegyverek_v2.json', fgj.build())
