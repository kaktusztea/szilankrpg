#!/usr/bin/env python3
"""A data/fegyvergenerator/extrak.yaml validálása az extrak.schema.yaml alapján.

Az egységes effekt-modell (engine_spec.md §42) vokabulárját ellenőrzi:
  - rekord: kötelező/ismeretlen mezők, csoport enum
  - feltétel[]: minden elem {típus, ...} REFERENCIA, a típus a feltetel_tipus_enum-ból
  - hatás[]: mód a mod_enum-ból; cél string; entitás-cél ("prefix:érték") prefixe a cel_prefix_enum-ból;
    al-feltétel ("prefix:érték") prefixe az alfeltetel_prefix_enum-ból

A vokabulár a SÉMÁBÓL jön — a szkriptben NINCS beégetett adat.

Futtatás:  python3 code/balance/extrak_validator.py     (0 = OK, 1 = hiba)
Bekötve:   a fegyvergenerator_balansz.py a tesztek ELŐTT lefuttatja.
"""
import pathlib
import sys

import yaml

DATA = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "fegyvergenerator"


def _load(nev):
    with open(DATA / nev, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _prefix_ok(ertek, enum, cimke, hibak, prefix_kotelezo):
    """'prefix:érték' string prefix-ellenőrzés. Ha nincs ':' és nem kötelező a prefix → OK (csupasz érték)."""
    if ":" not in ertek:
        if prefix_kotelezo:
            hibak.append(f"{cimke}: hiányzó prefix ({ertek!r}) — várt egy: {sorted(enum)}")
        return
    prefix = ertek.split(":", 1)[0]
    if prefix not in enum:
        hibak.append(f"{cimke}: ismeretlen prefix {prefix!r} ({ertek!r}) — megengedett: {sorted(enum)}")


def validate():
    s = _load("extrak.schema.yaml")
    csoport_enum = set(s["csoport_enum"])
    mod_enum = set(s["mod_enum"])
    feltetel_tipus = set(s["feltetel_tipus_enum"])
    cel_prefix = set(s["cel_prefix_enum"])
    alfeltetel_prefix = set(s["alfeltetel_prefix_enum"])
    alcel_prefix = set(s.get("alcel_prefix_enum", []))
    feltetel_ertek = s.get("feltetel_ertek_enum", {})   # típus -> megengedett értékek (csak fix készletűekre)
    kotelezo = {m for m, spec in s["rekord"].items() if spec.get("kötelező")}
    ismert = set(s["rekord"])

    doc = _load("extrak.yaml")
    hibak = []
    if not isinstance(doc, dict) or not isinstance(doc.get("extrak"), list):
        return ["extrak.yaml: hiányzó vagy hibás top-level 'extrak' lista"]

    for e in doc["extrak"]:
        eid = e.get("id", "???") if isinstance(e, dict) else "???"
        c = f"[{eid}]"
        if not isinstance(e, dict):
            hibak.append(f"{c}: nem map ({e!r})")
            continue
        for k in e:
            if k not in ismert:
                hibak.append(f"{c}: ismeretlen mező {k!r}")
        for k in kotelezo:
            if k not in e:
                hibak.append(f"{c}: hiányzó kötelező mező {k!r}")
        if "csoport" in e and e["csoport"] not in csoport_enum:
            hibak.append(f"{c}.csoport: érvénytelen {e['csoport']!r} — megengedett: {sorted(csoport_enum)}")

        for f in e.get("feltétel", []) or []:
            if not isinstance(f, dict) or "típus" not in f:
                hibak.append(f"{c}.feltétel: elem nem {{típus, ...}} REFERENCIA ({f!r})")
                continue
            if f["típus"] not in feltetel_tipus:
                hibak.append(f"{c}.feltétel.típus: érvénytelen {f['típus']!r} — megengedett: {sorted(feltetel_tipus)}")
            elif f["típus"] in feltetel_ertek and f.get("érték") not in feltetel_ertek[f["típus"]]:
                hibak.append(f"{c}.feltétel[{f['típus']}]: érvénytelen érték {f.get('érték')!r} — megengedett: {feltetel_ertek[f['típus']]}")

        for h in e.get("hatás", []) or []:
            if not isinstance(h, dict):
                hibak.append(f"{c}.hatás: elem nem map ({h!r})")
                continue
            if not isinstance(h.get("cél"), str):
                hibak.append(f"{c}.hatás.cél: kötelező string (kapott {h.get('cél')!r})")
            else:
                _prefix_ok(h["cél"], cel_prefix, f"{c}.hatás.cél", hibak, prefix_kotelezo=False)
            if h.get("mód") not in mod_enum:
                hibak.append(f"{c}.hatás.mód: érvénytelen {h.get('mód')!r} — megengedett: {sorted(mod_enum)}")
            if "alcél" in h:
                if not isinstance(h["alcél"], str):
                    hibak.append(f"{c}.hatás.alcél: string kell ({h['alcél']!r})")
                else:
                    _prefix_ok(h["alcél"], alcel_prefix, f"{c}.hatás.alcél", hibak, prefix_kotelezo=True)
            if "feltétel" in h:
                if not isinstance(h["feltétel"], str):
                    hibak.append(f"{c}.hatás.feltétel: string kell ({h['feltétel']!r})")
                else:
                    _prefix_ok(h["feltétel"], alfeltetel_prefix, f"{c}.hatás.feltétel", hibak, prefix_kotelezo=True)
    return hibak


def run():
    hibak = validate()
    if hibak:
        print(f"❌ extrak.yaml VALIDÁCIÓ: {len(hibak)} hiba")
        for h in hibak:
            print("   -", h)
        return False
    print("✅ extrak.yaml VALIDÁCIÓ: OK (megfelel az egységes effekt-modellnek, §42)")
    return True


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
