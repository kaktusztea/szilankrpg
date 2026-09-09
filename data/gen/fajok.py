"""fajok/*.yaml → fajok.json, faj_tulajdonsag_keretek.json"""

import os

from .common import SOURCES_DIR, hu_sort_key, load_yaml, write_json
from .schema import validate_schema


def generate_fajok():
    """fajok/*.yaml → fajok.json (nevek) + faj_tulajdonsag_keretek.json"""
    fdir = os.path.join(SOURCES_DIR, 'fajok')
    names = []
    keretek = {}
    errors = []
    required_tul = {'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység'}
    for f in sorted(os.listdir(fdir)):
        if not f.endswith('.yaml'):
            continue
        data = load_yaml(os.path.join(fdir, f))
        ctx = f"fajok/{f}"
        validate_schema('faj', [data], ctx)
        if not data.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        tk = data.get('tulajdonság_keretek', {})
        if not tk: errors.append(f"{ctx}: hiányzó 'tulajdonság_keretek'")
        else:
            missing = required_tul - set(tk.keys())
            if missing: errors.append(f"{ctx}: hiányzó tulajdonság keretek: {missing}")
        names.append(data['név'])
        keretek[data['név']] = tk
    if errors:
        print("  ❌ Faj validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)
    write_json('fajok.json', names)
    write_json('faj_tulajdonsag_keretek.json', keretek)
