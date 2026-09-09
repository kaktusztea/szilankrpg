"""fortelyok/*.yaml → fortelyok.json, kiterjesztesek.json, primer_fortelyok.json"""

import os

from .common import SOURCES_DIR, TABLES_DIR, hu_sort_key, load_yaml, write_json
from .schema import validate_schema


def generate_fortelyok():
    """fortelyok/**/*.yaml → fortelyok.json"""
    fdir = os.path.join(SOURCES_DIR, 'fortelyok')
    result = []
    errors = []
    valid_csoportok = {'harci', 'általános', 'érzékek', 'szabad', 'kiemelt', 'misztikus'}
    for root, dirs, files in os.walk(fdir):
        dirs.sort()
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            ctx = f"fortelyok/{os.path.relpath(os.path.join(root, f), fdir)}"
            validate_schema('fortely', [data], ctx)
            if not data.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
            if data.get('csoport', '') not in valid_csoportok: errors.append(f"{ctx}: 'csoport' invalid: '{data.get('csoport')}'")
            if not isinstance(data.get('maxfok', 1), int): errors.append(f"{ctx}: 'maxfok' nem szám")
            if not isinstance(data.get('kp_perfok', 6), int): errors.append(f"{ctx}: 'kp_perfok' nem szám")
            fokok_summary = []
            for fok in (data.get('fokok') or []):
                hatás = [h['text'] for h in (fok.get('hatástext') or []) if h.get('text')]
                köv_raw = fok.get('követelménytext', '')
                if isinstance(köv_raw, list):
                    köv = [item['text'] for item in köv_raw if item.get('text')]
                else:
                    köv = [köv_raw] if köv_raw else []
                mods = fok.get('módosítók') or []
                if mods == '':
                    mods = []
                követelmények = fok.get('követelmények') or []
                if követelmények == '': követelmények = []
                próba_e = fok.get('próba_enyhítések') or []
                if próba_e == '': próba_e = []
                fokok_summary.append({'fok': fok['fok'], 'hatás': hatás, 'követelmény': köv, 'követelmények': követelmények, 'módosítók': mods, 'próba_enyhítések': próba_e})
            leírás = ' '.join([l['text'] for l in (data.get('leírások') or []) if l.get('text')])
            leírás = leírás.replace('**', '').replace('`', '')
            kiterjeszti = data.get('kiterjeszti', {})
            kit_norm = kiterjeszti.get('normál', []) if kiterjeszti else []
            kit_eros = kiterjeszti.get('erős', []) if kiterjeszti else []
            tobbszorosseg = data.get('többszörösség', {})
            # md_fájl: fortelyok.{alcsoport}/{fájlnév}.md
            alcsoport = os.path.relpath(root, fdir).replace(os.sep, '/')
            md_fajl = f"fortelyok.{alcsoport}/{f.replace('.yaml', '.md')}"
            result.append({
                'név': data['név'],
                'csoport': data.get('csoport', ''),
                'alcsoport': alcsoport,
                'maxfok': data.get('maxfok', 1),
                'session_toggle': data.get('session_toggle', False),
                'emlékeztető': data.get('emlékeztető', False),
                'kiérdemelhető': data.get('kiérdemelhető', False),
                'kp_perfok': data.get('kp_perfok', 6),
                'ingyenes_perszint': data.get('ingyenes_perszint', 0),
                'többszörös_típus': tobbszorosseg.get('spec_típus', '') if tobbszorosseg else '',
                'többszörös_lista': tobbszorosseg.get('spec_lista', []) if tobbszorosseg else [],
                'leírás': leírás,
                'kiterjeszti_normál': kit_norm,
                'kiterjeszti_erős': kit_eros,
                'fokok': fokok_summary,
                'md_fájl': md_fajl,
            })
    if errors:
        print("  ❌ Fortély validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)
    # Kiterjesztett képzettségek referenciális validáció
    kep_dir = os.path.join(SOURCES_DIR, 'kepzettsegek')
    valid_kep_nevek = set()
    for root, dirs, files in os.walk(kep_dir):
        for kf in files:
            if kf.endswith('.yaml'):
                kd = load_yaml(os.path.join(root, kf))
                valid_kep_nevek.add(kd['név'])
    kit_errors = []
    for fort in result:
        for kn in fort.get('kiterjeszti_normál', []):
            if kn not in valid_kep_nevek:
                kit_errors.append(f"{fort['név']}: kiterjeszti_normál ismeretlen képzettség: '{kn}'")
        for ke in fort.get('kiterjeszti_erős', []):
            if ke not in valid_kep_nevek:
                kit_errors.append(f"{fort['név']}: kiterjeszti_erős ismeretlen képzettség: '{ke}'")
    if kit_errors:
        print("  ❌ Fortély kiterjesztés referenciális hibák:")
        for e in kit_errors:
            print(f"     {e}")
        raise SystemExit(1)
    # Feltétel prefix validáció
    konstansok = load_yaml(os.path.join(SOURCES_DIR, 'konstansok.yaml'))
    valid_prefixek = set(konstansok.get('feltétel_prefixek', []))
    felt_errors = []
    for root, dirs, files in os.walk(fdir):
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            ctx = f"fortelyok/{os.path.relpath(os.path.join(root, f), fdir)}"
            validate_schema('fortely', [data], ctx)
            for fok in (data.get('fokok') or []):
                for mod in (fok.get('módosítók') or []):
                    if isinstance(mod, str) or not mod:
                        continue
                    felt = mod.get('feltétel', '')
                    if not felt or not isinstance(felt, str):
                        continue
                    if ':' in felt:
                        prefix = felt.split(':', 1)[0]
                        if prefix and prefix not in valid_prefixek:
                            felt_errors.append(f"{ctx} fok {fok.get('fok')}: ismeretlen feltétel prefix '{prefix}' (értéke: '{felt}')")
    if felt_errors:
        print("  ❌ Fortély feltétel prefix hibák:")
        for e in felt_errors:
            print(f"     {e}")
        raise SystemExit(1)
    write_json('fortelyok.json', result)


def generate_kiterjesztesek():
    """fortelyok/**/*.yaml kiterjeszti → kiterjesztesek.json (inverz mapping)"""
    fdir = os.path.join(SOURCES_DIR, 'fortelyok')
    mapping = {}
    for root, dirs, files in os.walk(fdir):
        for f in files:
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            nev = data.get('név', '')
            maxfok = data.get('maxfok', 1)
            kit = data.get('kiterjeszti', {})
            if not kit:
                continue
            for kep in (kit.get('normál') or []):
                mapping.setdefault(kep, []).append({'fortély': nev, 'típus': 'normál', 'maxfok': maxfok})
            for kep in (kit.get('erős') or []):
                mapping.setdefault(kep, []).append({'fortély': nev, 'típus': 'erős', 'maxfok': maxfok})
    # Sort keys and value lists for deterministic output
    sorted_mapping = {}
    for key in sorted(mapping.keys()):
        sorted_mapping[key] = sorted(mapping[key], key=lambda x: x['fortély'])
    write_json('kiterjesztesek.json', sorted_mapping)


def generate_primer_fortelyok():
    """fortelyok/**/*.yaml → primer_fortelyok.json (harci+misztikus nevek)"""
    fdir = os.path.join(SOURCES_DIR, 'fortelyok')
    primer_names = []
    for root, dirs, files in os.walk(fdir):
        for f in files:
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            if data.get('csoport', '') in ('harci', 'misztikus'):
                primer_names.append(data['név'])
    primer_names.sort()
    write_json('primer_fortelyok.json', primer_names)
