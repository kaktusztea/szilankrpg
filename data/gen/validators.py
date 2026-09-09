"""Referenciális és tartalmi validátorok az Aktív fül adataihoz (taktikák, helyzetek, hatások)."""

def validate_aktiv_ful(taktikak, helyzetek, _szituaciok, manoverek):
    """Validate aktív fül YAML sources against schemas."""
    errors = []
    # Taktikák
    valid_megkotes_tipus = {'harci_helyzet', 'harcmodor', 'szituáció', 'támadások', 'többes_harc', 'per_küzdelem', 'távfegyver_kategória'}
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
        # Nem-fokozatos taktika opcionális strukturált hatások (előny/hátrány/enyhít/szöveges egy dobáscélra)
        valid_hatas_operator = {'előny', 'hátrány', 'enyhít', 'szöveges'}
        valid_hatas_cel = {'té_dobás', 'sebzésdobás', 'cé_dobás'}
        if not t.get('fokozatos'):
            for j, h in enumerate(t.get('hatások') or []):
                hctx = f"{ctx} hatások[{j}]"
                if h.get('hatás') not in valid_hatas_operator:
                    errors.append(f"{hctx}: 'hatás' invalid: '{h.get('hatás')}' (érvényes: {valid_hatas_operator})")
                if h.get('cél') not in valid_hatas_cel:
                    errors.append(f"{hctx}: 'cél' invalid: '{h.get('cél')}' (érvényes: {valid_hatas_cel})")
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
    valid_tipus = {'általános', 'belharcos', 'lovas'}
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
    valid_csoport = {'harci', 'próba', 'fizikai', 'képesség', 'egyéb'}
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
