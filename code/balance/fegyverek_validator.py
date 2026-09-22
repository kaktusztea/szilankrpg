#!/usr/bin/env python3
"""A data/fegyvergenerator/fegyverek.yaml validálása a fegyverek.schema.yaml alapján.

Ellenőriz:
  - kötelező mezők megléte, ismeretlen mezők tiltása (top-level ÉS a `fegyver` blokk)
  - típusok (str/int/bool/list/map)
  - fix enumok (kategória, pengés, súly_delta_cél, …)
  - katalógus-alapú kereszthivatkozások: aktor/súly/idea/alapanyag/fejdarab/hossz a
    konstansok.yaml-ból, modosito-id-k a extrak.yaml-ból
  - elvart: az aktorok érvényesek és [TÉ, VÉ] két egész

A szabályok a sémából és a katalógusokból jönnek — a szkriptben NINCS beégetett adat.

Futtatás:  python3 code/balance/fegyverek_validator.py     (0 = OK, 1 = hiba)
Bekötve:   a fegyvergenerator_balansz.py a tesztek ELŐTT lefuttatja.
"""
import pathlib
import sys

import yaml

DATA = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "fegyvergenerator"


def _load(nev):
    with open(DATA / nev, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _forras_ertekek():
    """A katalógus-alapú enumok ÉLŐ értékei (konstansok.yaml / extrak.yaml)."""
    k = _load("konstansok.yaml")
    return {
        "fegyverhossz": {int(x) for x in k["fegyverhossz"]},
        "aktor":        set(k["aktor"]),
        "súly":         set(k["súly"]),
        "idea":         {int(x) for x in k["idea"]},
        "alapanyag":    set(k["alapanyag"]),
        "fejdarab":     {int(x) for x in k["fejdarab"]},
        "szálfegyver_nyélanyag": set(k["szálfegyver_nyélanyag"]),
        "extrak":    {m["id"] for m in _load("extrak.yaml")["extrak"]},
    }


_TIPUS = {
    "str":  lambda v: isinstance(v, str),
    "int":  lambda v: isinstance(v, int) and not isinstance(v, bool),
    "bool": lambda v: isinstance(v, bool),
    "list": lambda v: isinstance(v, list),
    "map":  lambda v: isinstance(v, dict),
}


def _mezo(cimke, ertek, spec, forras, hibak):
    t = spec.get("típus")
    if t and not _TIPUS[t](ertek):
        hibak.append(f"{cimke}: típushiba — várt {t}, kapott {type(ertek).__name__} ({ertek!r})")
        return
    if "enum" in spec and ertek not in spec["enum"]:
        hibak.append(f"{cimke}: érvénytelen érték {ertek!r} — megengedett: {spec['enum']}")
    if "forrás" in spec and ertek not in forras[spec["forrás"]]:
        hibak.append(f"{cimke}: ismeretlen {spec['forrás']} {ertek!r} (nincs a katalógusban)")
    if "elem_forrás" in spec and isinstance(ertek, list):
        for e in ertek:
            if e not in forras[spec["elem_forrás"]]:
                hibak.append(f"{cimke}: ismeretlen {spec['elem_forrás']} elem {e!r}")
    if "min" in spec and isinstance(ertek, list) and len(ertek) < spec["min"]:
        hibak.append(f"{cimke}: legalább {spec['min']} elem kell (kapott {len(ertek)})")


def _blokk(cimke, rekord, semak, forras, hibak):
    if not isinstance(rekord, dict):
        hibak.append(f"{cimke}: nem map ({rekord!r})")
        return
    for kulcs in rekord:
        if kulcs not in semak:
            hibak.append(f"{cimke}: ismeretlen mező {kulcs!r}")
    for mezo, spec in semak.items():
        if mezo in rekord:
            _mezo(f"{cimke}.{mezo}", rekord[mezo], spec, forras, hibak)
        elif spec.get("kötelező"):
            hibak.append(f"{cimke}: hiányzó kötelező mező {mezo!r}")


def validate():
    schema = _load("fegyverek.schema.yaml")
    rekord_sema, fegyver_sema, teszt_sema = schema["rekord"], schema["fegyver"], schema["teszt"]
    forras = _forras_ertekek()
    recs = _load("fegyverek.yaml")
    hibak = []
    if not isinstance(recs, list):
        return ["fegyverek.yaml: a gyökér nem lista"]
    for r in recs:
        nev = r.get("név", "???") if isinstance(r, dict) else "???"
        cimke = f"[{nev}]"
        _blokk(cimke, r, rekord_sema, forras, hibak)
        if isinstance(r, dict):
            if isinstance(r.get("fegyver"), dict):
                _blokk(f"{cimke}.fegyver", r["fegyver"], fegyver_sema, forras, hibak)
            teszt = r.get("teszt")
            if isinstance(teszt, dict):
                _blokk(f"{cimke}.teszt", teszt, teszt_sema, forras, hibak)
                # elvart / elvart_1kez_kétkezes mélyebb ellenőrzés: aktor érvényes + [TÉ, VÉ] két egész
                for mezo in ("elvart", "elvart_1kez_kétkezes"):
                    if isinstance(teszt.get(mezo), dict):
                        for aktor, val in teszt[mezo].items():
                            if aktor not in forras["aktor"]:
                                hibak.append(f"{cimke}.teszt.{mezo}: ismeretlen aktor {aktor!r}")
                            if not (isinstance(val, list) and len(val) == 2
                                    and all(isinstance(x, int) and not isinstance(x, bool) for x in val)):
                                hibak.append(f"{cimke}.teszt.{mezo}[{aktor}]: [TÉ, VÉ] két egész kell, kapott {val!r}")
    return hibak


def run():
    hibak = validate()
    if hibak:
        print(f"❌ fegyverek.yaml VALIDÁCIÓ: {len(hibak)} hiba")
        for h in hibak:
            print("   -", h)
        return False
    print("✅ fegyverek.yaml VALIDÁCIÓ: OK (minden rekord megfelel a sémának)")
    return True


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
