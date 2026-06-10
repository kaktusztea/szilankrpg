#!/usr/bin/env python3
"""Generate tables/*.json from YAML source files.

Run from repo root or from data/ directory.
Usage: python3 data/generate_tables.py
"""

import yaml, json, os, sys

# Resolve data directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = SCRIPT_DIR
SOURCES_DIR = os.path.join(DATA_DIR, 'sources')
TABLES_DIR = os.path.join(DATA_DIR, 'tables')

os.makedirs(TABLES_DIR, exist_ok=True)


def write_json(filename, data):
    path = os.path.join(TABLES_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {filename}")


def load_yaml(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)


def generate_konstansok():
    """konstansok.yaml → konstansok.json"""
    data = load_yaml(os.path.join(SOURCES_DIR, 'konstansok.yaml'))
    write_json('konstansok.json', data)


def generate_kepzettsegek():
    """kepzettsegek/*.yaml → kepzettsegek.json"""
    kdir = os.path.join(SOURCES_DIR, 'kepzettsegek')
    result = []
    for f in sorted(os.listdir(kdir)):
        if not f.endswith('.yaml'):
            continue
        data = load_yaml(os.path.join(kdir, f))
        result.append({
            'név': data['név'],
            'csoport': data['csoport'],
            'primer': data.get('primer', False),
            'többszörös': data.get('többszörös', []),
            'próba': data.get('próba', 'nincs'),
            'domináns_tulajdonságok': data.get('domináns_tulajdonságok', []),
        })
    write_json('kepzettsegek.json', result)


def generate_fortelyok():
    """fortelyok/**/*.yaml → fortelyok.json"""
    fdir = os.path.join(SOURCES_DIR, 'fortelyok')
    result = []
    for root, dirs, files in os.walk(fdir):
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            fokok_summary = []
            for fok in (data.get('fokok') or []):
                hatás = [h['text'] for h in (fok.get('hatástext') or []) if h.get('text')]
                köv = fok.get('követelménytext', '')
                mods = fok.get('módosítók') or []
                if mods == '':
                    mods = []
                fokok_summary.append({'fok': fok['fok'], 'hatás': hatás, 'követelmény': köv, 'módosítók': mods})
            leírás = ' '.join([l['text'] for l in (data.get('leírások') or []) if l.get('text')])
            leírás = leírás.replace('**', '').replace('`', '')
            kiterjeszti = data.get('kiterjeszti', {})
            kit_norm = kiterjeszti.get('normál', []) if kiterjeszti else []
            kit_eros = kiterjeszti.get('erős', []) if kiterjeszti else []
            tobbszorosseg = data.get('többszörösség', {})
            result.append({
                'név': data['név'],
                'csoport': data.get('csoport', ''),
                'maxfok': data.get('maxfok', 1),
                'kp_perfok': data.get('kp_perfok', 6),
                'ingyenes_perszint': data.get('ingyenes_perszint', 0),
                'többszörös_típus': tobbszorosseg.get('spec_típus', '') if tobbszorosseg else '',
                'többszörös_lista': tobbszorosseg.get('spec_lista', []) if tobbszorosseg else [],
                'leírás': leírás,
                'kiterjeszti_normál': kit_norm,
                'kiterjeszti_erős': kit_eros,
                'fokok': fokok_summary,
            })
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
            kit = data.get('kiterjeszti', {})
            if not kit:
                continue
            for kep in (kit.get('normál') or []):
                mapping.setdefault(kep, []).append({'fortély': nev, 'típus': 'normál'})
            for kep in (kit.get('erős') or []):
                mapping.setdefault(kep, []).append({'fortély': nev, 'típus': 'erős'})
    write_json('kiterjesztesek.json', mapping)


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


def generate_fajok():
    """fajok/*.yaml → fajok.json (nevek) + faj_tulajdonsag_keretek.json"""
    fdir = os.path.join(SOURCES_DIR, 'fajok')
    names = []
    keretek = {}
    for f in sorted(os.listdir(fdir)):
        if not f.endswith('.yaml'):
            continue
        data = load_yaml(os.path.join(fdir, f))
        names.append(data['név'])
        keretek[data['név']] = data.get('tulajdonság_keretek', {})
    write_json('fajok.json', names)
    write_json('faj_tulajdonsag_keretek.json', keretek)


def validate_aktiv_ful(taktikak, helyzetek, szituaciok, manoverek):
    """Validate aktív fül YAML sources against schemas."""
    errors = []
    # Taktikák
    for i, t in enumerate(taktikak):
        ctx = f"taktikák[{i}] ({t.get('név', '?')})"
        if not t.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not t.get('feltétel_kulcs'): errors.append(f"{ctx}: hiányzó 'feltétel_kulcs'")
        if not isinstance(t.get('fokozatos'), bool): errors.append(f"{ctx}: 'fokozatos' nem boolean")
        km = t.get('kombó_mód', '')
        if km not in ('whitelist', 'blacklist'): errors.append(f"{ctx}: 'kombó_mód' invalid: '{km}'")
        if not isinstance(t.get('kombó_lista'), list): errors.append(f"{ctx}: 'kombó_lista' nem lista")
        if t.get('fokozatos') and not t.get('fokok'): errors.append(f"{ctx}: fokozatos de nincs 'fokok'")
        if not t.get('fokozatos') and not isinstance(t.get('módosítók', {}), dict): errors.append(f"{ctx}: 'módosítók' nem dict")
    # Harci helyzetek
    for i, h in enumerate(helyzetek):
        ctx = f"harci_helyzetek[{i}] ({h.get('név', '?')})"
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not h.get('feltétel_kulcs'): errors.append(f"{ctx}: hiányzó 'feltétel_kulcs'")
        if not h.get('infó'): errors.append(f"{ctx}: hiányzó 'infó'")
    # Szituációk
    for i, s in enumerate(szituaciok):
        ctx = f"szituációk[{i}] ({s.get('név', '?')})"
        if not s.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not s.get('feltétel_kulcs'): errors.append(f"{ctx}: hiányzó 'feltétel_kulcs'")
        if not s.get('infó'): errors.append(f"{ctx}: hiányzó 'infó'")
    # Manőverek
    valid_tipus = {'általános', 'belharcos'}
    for i, m in enumerate(manoverek):
        ctx = f"manőverek[{i}] ({m.get('név', '?')})"
        if not m.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if m.get('típus') not in valid_tipus: errors.append(f"{ctx}: 'típus' invalid: '{m.get('típus')}'")
        if not isinstance(m.get('nehézség'), (int, float)): errors.append(f"{ctx}: 'nehézség' nem szám")
        if not m.get('fázisok'): errors.append(f"{ctx}: hiányzó 'fázisok'")
        if not m.get('hatás'): errors.append(f"{ctx}: hiányzó 'hatás'")
    if errors:
        print("  ❌ Aktív fül validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def generate_aktiv_ful():
    """taktikak.yaml, harci_helyzetek.yaml, szituaciok.yaml, manoverek.yaml → JSON"""
    taktikak = load_yaml(os.path.join(SOURCES_DIR, 'taktikak.yaml'))['taktikák']
    helyzetek = load_yaml(os.path.join(SOURCES_DIR, 'harci_helyzetek.yaml'))['harci_helyzetek']
    szituaciok = load_yaml(os.path.join(SOURCES_DIR, 'szituaciok.yaml'))['szituációk']
    manoverek = load_yaml(os.path.join(SOURCES_DIR, 'manoverek.yaml'))['manőverek']

    validate_aktiv_ful(taktikak, helyzetek, szituaciok, manoverek)

    write_json('taktikak.json', taktikak)
    write_json('harci_helyzetek.json', helyzetek)
    write_json('szituaciok.json', szituaciok)
    write_json('manoverek.json', manoverek)


if __name__ == '__main__':
    print("Generating tables...")
    generate_konstansok()
    generate_kepzettsegek()
    generate_fortelyok()
    generate_kiterjesztesek()
    generate_primer_fortelyok()
    generate_fajok()
    generate_aktiv_ful()
    print("Done.")
