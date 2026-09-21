"""Egységes YAML naming-convention linter (build-gate).

SZABÁLY: minden mapping-KULCS és kanonikus azonosító-ÉRTÉK minden betű-futama
vagy csupa NAGY (mozaikszó: TÉ, VÉ, SP, KÉ, HM, SFÉ, MGT…) VAGY csupa kicsi.
Tiltott a "Nagybetűs-szó" futam (pl. `Sebesség`, `Átütés`, `Sp`) — a nem-mozaikszó
tokenek csupa kisbetűsek. Mozaikszó+szó összetétel megengedett (pl. `SP_override`,
`TÉ_büntetés_csökkentés`, `HM_TÉ`), mert minden futam külön csupa-nagy vagy csupa-kicsi.

KIVÉTELEK (proper entitás-nevek — jogosan Nagy-kezdőbetűsek, mint a fegyver-/faj-nevek):
  - NAME_KEYED_FILES : a TOP-LEVEL mapping-kulcsaik entitás-nevek (pl. szituacio_mapping.yaml
                       → képzettség-nevek). A gyökér szinten a kulcs-ellenőrzés kimarad.
  - NAME_VALUE_KEYS  : értékük entitás-név / megjelenítendő szöveg (kat, név…) → érték NEM ellenőrzött.
  - PREFIXED_VALUE_KEYS: 'prefix:név' referenciák (cél/feltétel) → csak a PREFIX-részt ellenőrizzük
                       (a név-rész entitásnév lehet, pl. "fortély:Mesterfegyver").

Használat: importáld a `lint(dirs)`-t, vagy futtasd önállóan:
    python3 data/gen/naming_lint.py
"""
import os
import re
import glob
import yaml

_RUN = re.compile(r"[^\W\d_]+", re.UNICODE)   # maximális betű-futamok (ékezet OK, _ és számjegy elválaszt)


def _runs_ok(s: str) -> bool:
    """Igaz, ha minden betű-futam csupa nagy (mozaikszó) VAGY csupa kicsi."""
    return all(run.isupper() or run.islower() for run in _RUN.findall(s))


# TOP-LEVEL kulcsaik entitás-nevek → a gyökér szintű kulcs-ellenőrzés kimarad
NAME_KEYED_FILES = {"szituacio_mapping.yaml"}

# Értékük entitás-név / megjelenítendő szöveg → az érték NEM ellenőrzött
NAME_VALUE_KEYS = {"név", "nev", "alapnév", "kat", "fájl", "spec_elem", "spec_típus"}

# Értékük kanonikus azonosító-token → ellenőrzött (a NAME_VALUE_KEYS kivételével)
ID_VALUE_KEYS = {"id", "cél", "mód", "típus", "forrás", "csoport",
                 "operátor", "prefix", "feltétel", "sebzésjelleg", "állapot", "aktor"}

# 'prefix:név' alakú érték — csak a prefix-részt ellenőrizzük (a név entitásnév lehet)
PREFIXED_VALUE_KEYS = {"cél", "feltétel"}


def _walk(node, fname, errors, name_keyed, top):
    if isinstance(node, dict):
        for k, v in node.items():
            if isinstance(k, str):
                if not (name_keyed and top) and not _runs_ok(k):
                    errors.append(f"{fname}: KULCS {k!r} — nem-mozaikszó nagybetűs "
                                  f"(csak csupa-kicsi vagy teljes mozaikszó engedett)")
                if k in ID_VALUE_KEYS and k not in NAME_VALUE_KEYS and isinstance(v, str):
                    token = v.split(":", 1)[0] if (k in PREFIXED_VALUE_KEYS and ":" in v) else v
                    if not _runs_ok(token):
                        errors.append(f"{fname}: {k}: {v!r} — nem-mozaikszó nagybetűs azonosító-érték")
            _walk(v, fname, errors, name_keyed, False)
    elif isinstance(node, list):
        for x in node:
            _walk(x, fname, errors, name_keyed, False)


def lint(dirs):
    """Visszaadja a konvenció-sértések listáját a megadott könyvtárak yaml fájljaiban."""
    errors = []
    for d in dirs:
        for f in sorted(glob.glob(os.path.join(d, "**", "*.yaml"), recursive=True)):
            try:
                data = yaml.safe_load(open(f, encoding="utf-8"))
            except Exception:
                continue   # a séma/parse hibát a saját validátorok jelzik
            _walk(data, os.path.relpath(f), errors, os.path.basename(f) in NAME_KEYED_FILES, True)
    return errors


if __name__ == "__main__":
    import sys
    _here = os.path.dirname(os.path.abspath(__file__))          # data/gen
    _data = os.path.dirname(_here)                              # data
    errs = lint([os.path.join(_data, "sources"), os.path.join(_data, "fegyvergenerator")])
    if errs:
        print(f"❌ {len(errs)} naming-convention hiba:")
        for e in errs:
            print(f"   {e}")
        sys.exit(1)
    print("✅ naming-convention: OK (data/sources + data/fegyvergenerator)")
