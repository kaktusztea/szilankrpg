"""kepzettsegek/*.yaml → kepzettsegek.json (+ szituáció mapping)"""

import os

from .common import SOURCES_DIR, hu_sort_key, load_yaml, write_json
from .schema import validate_schema


def generate_kepzettsegek():
    """kepzettsegek/**/*.yaml → kepzettsegek.json"""
    kdir = os.path.join(SOURCES_DIR, 'kepzettsegek')
    # Load szituáció mapping
    szit_path = os.path.join(SOURCES_DIR, 'szituacio_mapping.yaml')
    szit_mapping = load_yaml(szit_path) if os.path.exists(szit_path) else {}
    result = []
    errors = []
    for root, dirs, files in os.walk(kdir):
        dirs.sort()
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            ctx = f"kepzettsegek/{os.path.relpath(os.path.join(root, f), kdir)}"
            validate_schema('kepzettseg', [data], ctx)
            if not data.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
            if not data.get('csoport'): errors.append(f"{ctx}: hiányzó 'csoport'")
            if not isinstance(data.get('primer', False), bool): errors.append(f"{ctx}: 'primer' nem boolean")
            if not isinstance(data.get('többszörös', []), list): errors.append(f"{ctx}: 'többszörös' nem lista")
            if data.get('próba', 'nincs') not in ('nincs', 'dobható', 'ellenpróba', 'nem dobható'): errors.append(f"{ctx}: 'próba' invalid: '{data.get('próba')}'")
            # md_fájl: relatív path az md/ könyvtáron belül
            rel = os.path.relpath(os.path.join(root, f), kdir)  # pl. primer/altalanos/akrobatika.yaml
            parts = rel.replace('.yaml', '.md').replace(os.sep, '/')
            # kepzettsegek.primer/altalanos/x.md vagy kepzettsegek.szekunder/x.md
            md_parts = parts.split('/')
            if md_parts[0] == 'primer' and len(md_parts) >= 3:
                sub = md_parts[1].replace('_', '.')
                md_fajl = f"kepzettsegek.primer/{sub}/{md_parts[2]}"
            else:
                md_fajl = f"kepzettsegek.szekunder/{md_parts[-1]}"
            result.append({
                'név': data['név'],
                'csoport': data['csoport'],
                'primer': data.get('primer', False),
                'többszörös': data.get('többszörös', []),
                'próba': data.get('próba', 'nincs'),
                'domináns_tulajdonságok': data.get('domináns_tulajdonságok', []),
                'helyzetfüggő_módosítók': data.get('helyzetfüggő_módosítók', []),
                'dobás_komment': data.get('dobás_komment', []),
                'szerepjátékos_módosító': data.get('szerepjátékos_módosító', False),
                'kapcsolódó_szituációk': szit_mapping.get(data['név'], []),
                'md_fájl': md_fajl,
            })
    if errors:
        print("  ❌ Képzettség validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)
    result.sort(key=lambda x: hu_sort_key(x['név']))
    write_json('kepzettsegek.json', result)
