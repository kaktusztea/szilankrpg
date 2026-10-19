#!/usr/bin/env python3
"""Fegyver ár-számítás önteszt (md/068_01_05_fegyverek_ara.md).

A fegyvergenerator_json.ar_alap / fegyver_ar függvényeit ellenőrzi a data layer ÉLŐ
konstansaival (nincs beégetett érték a tesztben a bemeneten kívül). Futtatás:
    python3 code/balance/fegyver_ar_selftest.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import fegyvergenerator_json as fgj  # noqa: E402


def _case(név, fv, idea, várt_alap, várt_ár):
    alap = fgj.ar_alap(fv)
    ár = fgj.fegyver_ar(fv, idea)
    assert abs(alap - várt_alap) < 1e-6, f"{név}: ár_alap {alap} != {várt_alap}"
    assert abs(ár - várt_ár) < 1e-6, f"{név}: ár {ár} != {várt_ár}"


def run():
    # hosszúkard: fém osztály (1), fejdarab 1, hossz 3 (×1), acél, idea 0 → kalibrációs 1x
    _case("hosszúkard", {"hossz": 3, "fejdarab": 1, "alapanyag": "acél"}, 0, 1.0, 1.0)
    # lándzsa: fém-hegyű (0.2), fejdarab 1, hossz 9 (×2) → alap 0.4; acél → 0.4
    _case("lándzsa", {"hossz": 9, "fejdarab": 1, "szálfegyver_nyélanyag": "fanyelű"}, 0, 0.4, 0.4)
    # alabárd: fém-hegyű, fejdarab 2, hossz 9 (×2) → alap 0.8
    _case("alabárd", {"hossz": 9, "fejdarab": 2, "szálfegyver_nyélanyag": "fanyelű"}, 0, 0.8, 0.8)
    # hosszú bot: fa (1), fejdarab_rész 1, hossz 7 (×2) → alap 2; fa anyag (0.1) → 0.2
    _case("hosszú bot", {"hossz": 7, "fejdarab": 0, "alapanyag": "fa", "szálfegyver_nyélanyag": "fanyelű"}, 0, 2.0, 0.2)
    # Kő: fém osztály, fejdarab 1, hossz 0 (×0.5) → alap 0.5; kő anyag (0.1) → 0.05 → round 0.1... valójában 0.05
    _case("Kő", {"hossz": 0, "fejdarab": 1, "alapanyag": "kő"}, 0, 0.5, 0.1)
    # Mara-sequor: fém, fejdarab 1, hossz 5 (×1) → alap 1; feketeacél (100) × idea 3 (7) → 700
    _case("Mara-sequor", {"hossz": 5, "fejdarab": 1, "alapanyag": "feketeacél"}, 3, 1.0, 700.0)
    # ököl: fém, fejdarab 0 → alap 0 → ár 0 (nem vásárolható)
    _case("ököl", {"hossz": 0, "fejdarab": 0}, 0, 0.0, 0.0)
    print("fegyver_ar_selftest: OK")


if __name__ == "__main__":
    run()
