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
    """kepzettsegek/**/*.yaml → kepzettsegek.json"""
    kdir = os.path.join(SOURCES_DIR, 'kepzettsegek')
    result = []
    errors = []
    for root, dirs, files in os.walk(kdir):
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            ctx = f"kepzettsegek/{os.path.relpath(os.path.join(root, f), kdir)}"
            if not data.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
            if not data.get('csoport'): errors.append(f"{ctx}: hiányzó 'csoport'")
            if not isinstance(data.get('primer', False), bool): errors.append(f"{ctx}: 'primer' nem boolean")
            if not isinstance(data.get('többszörös', []), list): errors.append(f"{ctx}: 'többszörös' nem lista")
            if data.get('próba', 'nincs') not in ('nincs', 'dobható', 'ellenpróba', 'nem dobható'): errors.append(f"{ctx}: 'próba' invalid: '{data.get('próba')}'")
            result.append({
                'név': data['név'],
                'csoport': data['csoport'],
                'primer': data.get('primer', False),
                'többszörös': data.get('többszörös', []),
                'próba': data.get('próba', 'nincs'),
                'domináns_tulajdonságok': data.get('domináns_tulajdonságok', []),
            })
    if errors:
        print("  ❌ Képzettség validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)
    write_json('kepzettsegek.json', result)


def generate_fortelyok():
    """fortelyok/**/*.yaml → fortelyok.json"""
    fdir = os.path.join(SOURCES_DIR, 'fortelyok')
    result = []
    errors = []
    valid_csoportok = {'harci', 'általános', 'érzékek', 'szabad', 'kiemelt', 'misztikus'}
    for root, dirs, files in os.walk(fdir):
        for f in sorted(files):
            if not f.endswith('.yaml'):
                continue
            data = load_yaml(os.path.join(root, f))
            ctx = f"fortelyok/{os.path.relpath(os.path.join(root, f), fdir)}"
            if not data.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
            if data.get('csoport', '') not in valid_csoportok: errors.append(f"{ctx}: 'csoport' invalid: '{data.get('csoport')}'")
            if not isinstance(data.get('maxfok', 1), int): errors.append(f"{ctx}: 'maxfok' nem szám")
            if not isinstance(data.get('kp_perfok', 6), int): errors.append(f"{ctx}: 'kp_perfok' nem szám")
            fokok_summary = []
            for fok in (data.get('fokok') or []):
                hatás = [h['text'] for h in (fok.get('hatástext') or []) if h.get('text')]
                köv = fok.get('követelménytext', '')
                mods = fok.get('módosítók') or []
                if mods == '':
                    mods = []
                követelmények = fok.get('követelmények') or []
                if követelmények == '': követelmények = []
                fokok_summary.append({'fok': fok['fok'], 'hatás': hatás, 'követelmény': köv, 'követelmények': követelmények, 'módosítók': mods})
            leírás = ' '.join([l['text'] for l in (data.get('leírások') or []) if l.get('text')])
            leírás = leírás.replace('**', '').replace('`', '')
            kiterjeszti = data.get('kiterjeszti', {})
            kit_norm = kiterjeszti.get('normál', []) if kiterjeszti else []
            kit_eros = kiterjeszti.get('erős', []) if kiterjeszti else []
            tobbszorosseg = data.get('többszörösség', {})
            result.append({
                'név': data['név'],
                'csoport': data.get('csoport', ''),
                'alcsoport': os.path.relpath(root, fdir),
                'maxfok': data.get('maxfok', 1),
                'session_toggle': data.get('session_toggle', False),
                'emlékeztető': data.get('emlékeztető', False),
                'kp_perfok': data.get('kp_perfok', 6),
                'ingyenes_perszint': data.get('ingyenes_perszint', 0),
                'többszörös_típus': tobbszorosseg.get('spec_típus', '') if tobbszorosseg else '',
                'többszörös_lista': tobbszorosseg.get('spec_lista', []) if tobbszorosseg else [],
                'leírás': leírás,
                'kiterjeszti_normál': kit_norm,
                'kiterjeszti_erős': kit_eros,
                'fokok': fokok_summary,
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
    errors = []
    required_tul = {'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység'}
    for f in sorted(os.listdir(fdir)):
        if not f.endswith('.yaml'):
            continue
        data = load_yaml(os.path.join(fdir, f))
        ctx = f"fajok/{f}"
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


def validate_aktiv_ful(taktikak, helyzetek, _szituaciok, manoverek):
    """Validate aktív fül YAML sources against schemas."""
    errors = []
    # Taktikák
    valid_megkotes_tipus = {'harci_helyzet', 'harcmodor', 'szituáció', 'támadások', 'többes_harc', 'per_küzdelem'}
    valid_megkotes_mod = {'tiltott', 'szükséges', 'min', 'max'}
    for i, t in enumerate(taktikak):
        ctx = f"taktikák[{i}] ({t.get('név', '?')})"
        if not t.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not t.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if not isinstance(t.get('fokozatos'), bool): errors.append(f"{ctx}: 'fokozatos' nem boolean")
        km = t.get('kombó_mód', '')
        if km not in ('whitelist', 'blacklist'): errors.append(f"{ctx}: 'kombó_mód' invalid: '{km}'")
        if not isinstance(t.get('kombó_lista'), list): errors.append(f"{ctx}: 'kombó_lista' nem lista")
        if t.get('fokozatos') and not t.get('fokok'): errors.append(f"{ctx}: fokozatos de nincs 'fokok'")
        if not t.get('fokozatos') and not isinstance(t.get('módosítók', {}), dict): errors.append(f"{ctx}: 'módosítók' nem dict")
        # Megkötések validáció
        for j, mk in enumerate(t.get('megkötések') or []):
            mctx = f"{ctx} megkötések[{j}]"
            if mk.get('típus') not in valid_megkotes_tipus:
                errors.append(f"{mctx}: 'típus' invalid: '{mk.get('típus')}' (érvényes: {valid_megkotes_tipus})")
            if mk.get('mód') not in valid_megkotes_mod:
                errors.append(f"{mctx}: 'mód' invalid: '{mk.get('mód')}' (érvényes: {valid_megkotes_mod})")
            # érték kötelező kivéve többes_harc
            if mk.get('típus') != 'többes_harc' and 'érték' not in mk:
                errors.append(f"{mctx}: hiányzó 'érték' (típus: {mk.get('típus')})")
    # Harci helyzetek
    for i, h in enumerate(helyzetek):
        ctx = f"harci_helyzetek[{i}] ({h.get('név', '?')})"
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not h.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if not h.get('infó'): errors.append(f"{ctx}: hiányzó 'infó'")
    # Manőverek
    valid_tipus = {'általános', 'belharcos'}
    for i, m in enumerate(manoverek):
        ctx = f"manőverek[{i}] ({m.get('név', '?')})"
        if not m.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not m.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if m.get('típus') not in valid_tipus: errors.append(f"{ctx}: 'típus' invalid: '{m.get('típus')}'")
        if not isinstance(m.get('nehézség'), (int, float)): errors.append(f"{ctx}: 'nehézség' nem szám")
        if not m.get('fázisok'): errors.append(f"{ctx}: hiányzó 'fázisok'")
        if not m.get('hatás'): errors.append(f"{ctx}: hiányzó 'hatás'")
    # ID egyediség
    taktika_ids = [t.get('id') for t in taktikak if t.get('id')]
    helyzet_ids = [h.get('id') for h in helyzetek if h.get('id')]
    manover_ids = [m.get('id') for m in manoverek if m.get('id')]
    for ids, label in [(taktika_ids, 'taktika'), (helyzet_ids, 'harci_helyzet'), (manover_ids, 'manőver')]:
        dupes = [x for x in ids if ids.count(x) > 1]
        if dupes: errors.append(f"{label} duplikált id-k: {set(dupes)}")
    if errors:
        print("  ❌ Aktív fül validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def generate_aktiv_ful():
    """taktikak.yaml, harci_helyzetek.yaml, manoverek.yaml, statuszok.yaml, hatas_operatorok.yaml, esemenyek.yaml, hatasok.yaml → JSON"""
    taktikak = load_yaml(os.path.join(SOURCES_DIR, 'taktikak.yaml'))['taktikák']
    helyzetek = load_yaml(os.path.join(SOURCES_DIR, 'harci_helyzetek.yaml'))['harci_helyzetek']
    manoverek = load_yaml(os.path.join(SOURCES_DIR, 'manoverek.yaml'))['manőverek']
    hatas_operatorok = load_yaml(os.path.join(SOURCES_DIR, 'hatas_operatorok.yaml'))['hatás_operátorok']
    esemenyek = load_yaml(os.path.join(SOURCES_DIR, 'esemenyek.yaml'))['események']
    statuszok = load_yaml(os.path.join(SOURCES_DIR, 'statuszok.yaml'))['státuszok']
    hatasok = load_yaml(os.path.join(SOURCES_DIR, 'hatasok.yaml'))['hatások']
    hatterek = load_yaml(os.path.join(SOURCES_DIR, 'hatterek.yaml'))

    validate_aktiv_ful(taktikak, helyzetek, [], manoverek)
    validate_hatasok(hatas_operatorok)
    validate_esemenyek(esemenyek)
    validate_statuszok(statuszok, hatas_operatorok, esemenyek)
    validate_hatasok_katalogus(hatasok, hatas_operatorok, esemenyek)

    # feltétel_kulcs generálás id-ból (yaml-ban nincs, JSON-ban kell)
    for t in taktikak:
        t['feltétel_kulcs'] = f"taktika:{t['id']}"
    for h in helyzetek:
        h['feltétel_kulcs'] = f"harci_helyzet:{h['id']}"

    write_json('taktikak.json', taktikak)
    write_json('harci_helyzetek.json', helyzetek)
    write_json('manoverek.json', manoverek)
    write_json('hatas_operatorok.json', hatas_operatorok)
    write_json('esemenyek.json', esemenyek)
    write_json('hatasok.json', hatasok)
    # Statuszok: default mezők biztosítása
    for s in statuszok:
        s.setdefault('többszörös', False)
        s.setdefault('alkategóriák', [])

    write_json('statuszok.json', statuszok)
    write_json('hatterek.json', hatterek)


def validate_hatasok(hatasok):
    """Validate hatas_operatorok.yaml hatás_operátorok."""
    errors = []
    valid_mod = {'előny_hátrány', 'szorzó', 'letilt', 'max_limit', 'szöveges', 'enyhít'}
    ids_seen = set()
    for i, h in enumerate(hatasok):
        ctx = f"hatás_operátorok[{i}] ({h.get('id', '?')})"
        if not h.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if h.get('mód') not in valid_mod: errors.append(f"{ctx}: 'mód' invalid: '{h.get('mód')}'")
        if h.get('id') in ids_seen: errors.append(f"{ctx}: duplikált id!")
        ids_seen.add(h.get('id'))
    if errors:
        print("  ❌ Hatás validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_esemenyek(esemenyek):
    """Validate esemenyek.yaml."""
    errors = []
    valid_csoport = {'harci', 'próba', 'fizikai', 'képesség'}
    ids_seen = set()
    for i, e in enumerate(esemenyek):
        ctx = f"események[{i}] ({e.get('id', '?')})"
        if not e.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if not e.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if e.get('csoport') not in valid_csoport: errors.append(f"{ctx}: 'csoport' invalid: '{e.get('csoport')}'")
        if e.get('id') in ids_seen: errors.append(f"{ctx}: duplikált id!")
        ids_seen.add(e.get('id'))
    if errors:
        print("  ❌ Esemény validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_statuszok(statuszok, hatasok, esemenyek):
    """Validate statuszok.yaml — struktúra + referenciális integritás."""
    errors = []
    valid_kategoria = {'fizikai', 'szellemi', 'harci', 'mágikus'}
    valid_hatas_ids = {h['id'] for h in hatasok}
    valid_esemeny_ids = {e['id'] for e in esemenyek}
    for i, s in enumerate(statuszok):
        ctx = f"státuszok[{i}] ({s.get('név', '?')})"
        if not s.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if s.get('kategória') not in valid_kategoria: errors.append(f"{ctx}: 'kategória' invalid: '{s.get('kategória')}'")
        fokok = s.get('fokok')
        if not fokok or not isinstance(fokok, list): errors.append(f"{ctx}: hiányzó vagy üres 'fokok'")
        else:
            for j, f in enumerate(fokok):
                fctx = f"{ctx} fokok[{j}]"
                if not isinstance(f.get('fok'), int): errors.append(f"{fctx}: 'fok' nem szám")
                if not f.get('alcím'): errors.append(f"{fctx}: hiányzó 'alcím'")
                hatasok_lista = f.get('hatások')
                if not hatasok_lista or not isinstance(hatasok_lista, list): errors.append(f"{fctx}: hiányzó vagy üres 'hatások'")
                else:
                    for k, h in enumerate(hatasok_lista):
                        hctx = f"{fctx} hatások[{k}]"
                        if not isinstance(h, dict): errors.append(f"{hctx}: nem objektum"); continue
                        if h.get('operátor') not in valid_hatas_ids: errors.append(f"{hctx}: ismeretlen operátor: '{h.get('operátor')}'")
                        if h.get('cél') not in valid_esemeny_ids: errors.append(f"{hctx}: ismeretlen cél esemény: '{h.get('cél')}'")
    if errors:
        print("  ❌ Státusz validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_hatasok_katalogus(hatasok, hatas_operatorok, esemenyek):
    """Validate hatasok.yaml — id egyediség + mechanika referenciális integritás."""
    errors = []
    valid_op_ids = {h['id'] for h in hatas_operatorok}
    valid_cel_ids = {e['id'] for e in esemenyek}
    ids_seen = set()
    for i, h in enumerate(hatasok):
        ctx = f"hatások[{i}] ({h.get('id', '?')})"
        if not h.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        elif h['id'] in ids_seen: errors.append(f"{ctx}: duplikált id")
        else: ids_seen.add(h['id'])
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        mechanika = h.get('mechanika')
        if not mechanika or not isinstance(mechanika, list): errors.append(f"{ctx}: hiányzó vagy üres 'mechanika'")
        else:
            for j, m in enumerate(mechanika):
                mctx = f"{ctx} mechanika[{j}]"
                if m.get('operátor') not in valid_op_ids: errors.append(f"{mctx}: ismeretlen operátor: '{m.get('operátor')}'")
                if m.get('cél') and m['cél'] not in valid_cel_ids: errors.append(f"{mctx}: ismeretlen cél: '{m.get('cél')}'")
    if errors:
        print("  ❌ Hatás katalógus validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


if __name__ == '__main__':
    print("Generating tables...")
    generate_konstansok()
    generate_kepzettsegek()
    generate_fortelyok()
    generate_kiterjesztesek()
    generate_primer_fortelyok()
    generate_fajok()
    generate_aktiv_ful()
    # Post-hoc: fortély manőver cél validáció
    import json
    with open(os.path.join(TABLES_DIR, 'manoverek.json'), encoding='utf-8') as f:
        manover_ids = set(m['id'] for m in json.load(f))
    with open(os.path.join(TABLES_DIR, 'fortelyok.json'), encoding='utf-8') as f:
        fortelyok = json.load(f)
    errors = []
    for fort in fortelyok:
        for fok in fort.get('fokok', []):
            for mod in (fok.get('módosítók') or []):
                if isinstance(mod, dict) and isinstance(mod.get('cél'), str) and mod['cél'].startswith('manőver:'):
                    mid = mod['cél'].split(':', 1)[1]
                    if mid not in manover_ids:
                        errors.append(f"{fort['név']} fok {fok['fok']}: ismeretlen manőver id: '{mid}'")
    if errors:
        print("  ❌ Fortély → manőver referenciális hibák:")
        for e in errors: print(f"     {e}")
        raise SystemExit(1)
    print("Done.")
