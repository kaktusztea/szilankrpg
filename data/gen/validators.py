import re
"""Referenciális és tartalmi validátorok az Aktív fül adataihoz (taktikák, helyzetek, hatások)."""

# A tiltás-feltételek fegyverenként kiértékelt forrásai (web: engine/effekt.ts → tiltásokFegyverre).
TILTAS_FORRASOK = {'fegyver.fegyverhossz', 'fegyver.harcmodor'}


def tiltas_ids_of(helyzetek):
    """Minden harci helyzet `tiltások[].id`-je (a `tiltás:<id>` hivatkozások célkészlete)."""
    return {t.get('id') for h in helyzetek for t in (h.get('tiltások') or [])}


# Próba-alcél (§42.4): a cél határozza meg a kötelező prefixet.
ALCEL_PROBA_PREFIX = {'képzettségpróba': 'képzettség', 'tulajdonságpróba': 'tulajdonság', 'érzék_próba': 'érzék'}


def proba_alcel_hibak(cel, alcel, ctx, refs):
    """Egy fortély-/státusz-hatás alcéljának ellenőrzése: `prefix:név`, a prefix a célhoz illik, a név létezik
    (refs: {'képzettség': id-k (2026-10-17), 'tulajdonság': karakter-séma kulcsok, 'érzék': Érzék-státusz alkategóriák})."""
    if not alcel: return []
    pre, _, nev = alcel.partition(':')
    if not nev: return [f"{ctx}: alcél '{alcel}' - 'prefix:név' alak kell"]
    want = ALCEL_PROBA_PREFIX.get(cel)
    if want != pre: return [f"{ctx}: alcél prefix '{pre}' nem illik a célhoz '{cel}' (várt: '{want}')"]
    if nev not in refs.get(pre, set()): return [f"{ctx}: ismeretlen {pre} '{nev}'"]
    return []


def proba_alcel_refs(sources_dir, statuszok):
    import glob, os, yaml
    kepz = {yaml.safe_load(open(f, encoding='utf-8'))['id'] for f in glob.glob(os.path.join(sources_dir, 'kepzettsegek', '**', '*.yaml'), recursive=True)}
    with open(os.path.join(sources_dir, '..', 'schemas', 'karakter.yaml'), encoding='utf-8') as fh:
        tul = set(yaml.safe_load(fh)['tulajdonságok'])
    erz = {a for s in statuszok for a in (s.get('alkategóriák') or [])}
    return {'képzettség': kepz, 'tulajdonság': tul, 'érzék': erz}


def validate_effekt_hivatkozasok(helyzetek, extrak):
    """`tiltás:<id>` és `ellenfél_harci_helyzet:<id>` hivatkozások létező célra mutassanak
    (fegyver_override feltétel + extra hatás cél / al-feltétel). Különben a hatás CSENDBEN nem élne."""
    errors = []
    tiltasok = tiltas_ids_of(helyzetek)
    helyzet_ids = {h.get('id') for h in helyzetek}
    def ref(s, hely):
        if not isinstance(s, str) or ':' not in s: return
        pre, _, val = s.partition(':')
        if pre == 'tiltás' and val not in tiltasok: errors.append(f"{hely}: ismeretlen tiltás '{val}'")
        if pre == 'ellenfél_harci_helyzet' and val not in helyzet_ids: errors.append(f"{hely}: ismeretlen harci helyzet '{val}'")
    for h in helyzetek:
        for p in (h.get('fegyver_override') or {}).get('feltétel') or []:
            ref(p.get('forrás'), f"harci_helyzetek ({h.get('név')}) fegyver_override")
    for e in extrak:
        for x in e.get('hatás') or []:
            ref(x.get('cél'), f"extrak [{e.get('id')}] hatás.cél")
            ref(x.get('feltétel'), f"extrak [{e.get('id')}] hatás.feltétel")
            if isinstance(x.get('cél'), str) and x['cél'].startswith('tiltás:') and x.get('mód') != 'letilt':
                errors.append(f"extrak [{e.get('id')}]: tiltás-cél csak mód 'letilt' lehet (kapott '{x.get('mód')}')")
    if errors:
        print("  ❌ Effekt-hivatkozás hibák (tiltás / ellenfél_harci_helyzet):")
        for e in errors: print(f"     {e}")
        raise SystemExit(1)


def validate_aktiv_ful(taktikak, helyzetek, _szituaciok, manoverek, effekt_modok):
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
        # Nem-fokozatos taktika opcionális strukturált hatások egy dobáscélra/numerikus célra.
        # Több elem egy célra: §42.3 precedencia (override = bázis-csere, utána flat/szorzó).
        valid_hatas_cel = {'té_dobás', 'sebzésdobás', 'cé_dobás', 'vé_csökkentés'}
        if not t.get('fokozatos'):
            for j, h in enumerate(t.get('hatások') or []):
                hctx = f"{ctx} hatások[{j}]"
                if h.get('mód') not in effekt_modok:
                    errors.append(f"{hctx}: 'mód' invalid: '{h.get('mód')}' (konstansok.effekt_módok)")
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
    tiltas_ids = set()
    for i, h in enumerate(helyzetek):
        ctx = f"harci_helyzetek[{i}] ({h.get('név', '?')})"
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        if not h.get('id'): errors.append(f"{ctx}: hiányzó 'id'")
        if not h.get('infó'): errors.append(f"{ctx}: hiányzó 'infó'")
        # Nevesített tiltások (§42.4): {id, leírás, feltétel[]}, a feltétel forrása fegyverenként kiértékelhető érték
        for j, t in enumerate(h.get('tiltások') or []):
            tctx = f"{ctx} tiltások[{j}]"
            if not t.get('id') or not t.get('leírás'): errors.append(f"{tctx}: hiányzó 'id' / 'leírás'")
            if t.get('id') in tiltas_ids: errors.append(f"{tctx}: duplikált tiltás id '{t.get('id')}'")
            tiltas_ids.add(t.get('id'))
            felt = t.get('feltétel')
            if not isinstance(felt, list) or not felt: errors.append(f"{tctx}: 'feltétel' nem üres lista kell")
            for p in felt or []:
                if p.get('forrás') not in TILTAS_FORRASOK:
                    errors.append(f"{tctx}: ismeretlen forrás '{p.get('forrás')}' (engedett: {sorted(TILTAS_FORRASOK)})")
        # fegyver_override: a fegyver-komponens bázis-cseréje (§42.4) - cél harcérték, alcél felszerelés:fegyver
        for j, m in enumerate((h.get('fegyver_override') or {}).get('módosítók') or []):
            if m.get('cél') not in ('TÉ', 'VÉ', 'SP') or m.get('alcél') != 'felszerelés:fegyver':
                errors.append(f"{ctx} fegyver_override.módosítók[{j}]: cél TÉ/VÉ/SP + alcél 'felszerelés:fegyver' kell (kapott {m.get('cél')!r}, {m.get('alcél')!r})")
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


def validate_statuszok(statuszok, effekt_modok, esemenyek):
    """Validate statuszok.yaml - struktúra + referenciális integritás.

    A státusz hatások `mód` mezője a konstansok.yaml → effekt_módok egyike (engine_spec §42.2),
    NEM a hatasok.yaml katalógus-id-kre hivatkozik.
    """
    errors = []
    valid_kategoria = {'fizikai', 'szellemi', 'harci', 'mágikus'}
    valid_esemeny_ids = {e['id'] for e in esemenyek}
    from .common import SOURCES_DIR
    alcel_refs = proba_alcel_refs(SOURCES_DIR, statuszok)
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
                        if h.get('mód') not in effekt_modok: errors.append(f"{hctx}: ismeretlen mód: '{h.get('mód')}'")
                        if h.get('cél') not in valid_esemeny_ids: errors.append(f"{hctx}: ismeretlen cél esemény: '{h.get('cél')}'")
                        errors.extend(proba_alcel_hibak(h.get('cél'), h.get('alcél'), hctx, alcel_refs))
    if errors:
        print("  ❌ Státusz validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_harci_helyzet_hatasok(helyzetek, effekt_modok, esemenyek, harcertek_celok):
    """Validate harci_helyzetek.yaml `hatások[]` - mód a konstansok.effekt_módok-ból, cél esemény-id VAGY
    csupasz harcérték-cél (konstansok.yaml → harcérték_célok, engine_spec §42.4)."""
    errors = []
    valid_cel = {e['id'] for e in esemenyek} | set(harcertek_celok)
    for h in helyzetek:
        for k, x in enumerate(h.get('hatások') or []):
            hctx = f"harci_helyzetek ({h.get('név', '?')}) hatások[{k}]"
            if not isinstance(x, dict): errors.append(f"{hctx}: nem objektum"); continue
            if x.get('mód') not in effekt_modok: errors.append(f"{hctx}: ismeretlen mód: '{x.get('mód')}'")
            if x.get('cél') not in valid_cel: errors.append(f"{hctx}: ismeretlen cél: '{x.get('cél')}'")
    if errors:
        print("  ❌ Harci helyzet hatás validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_hatasok_katalogus(hatasok, effekt_modok, esemenyek):
    """Validate hatasok.yaml - id egyediség + mechanika referenciális integritás."""
    errors = []
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
                if m.get('mód') not in effekt_modok: errors.append(f"{mctx}: ismeretlen mód: '{m.get('mód')}'")
                if m.get('cél') and m['cél'] not in valid_cel_ids: errors.append(f"{mctx}: ismeretlen cél: '{m.get('cél')}'")
    if errors:
        print("  ❌ Hatás katalógus validációs hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


ID_FORMÁTUM = re.compile(r'^[0-9a-záéíóöőúüű]+(_[0-9a-záéíóöőúüű]+)*$')


def id_hibak(elemek, mi):
    """Build-gate: minden elemnek van `id`-je, formátuma kanonikus és egyedi (2026-10-17, id-átállás F1)."""
    errors, látott = [], {}
    for ctx, d in elemek:
        i = d.get('id', '')
        if not i: errors.append(f"{ctx}: hiányzó 'id'"); continue
        if not ID_FORMÁTUM.match(i): errors.append(f"{ctx}: {mi}-id formátum: '{i}' (kisbetű, ékezet, _ elválasztó)")
        if i in látott: errors.append(f"{ctx}: duplikált {mi}-id '{i}' (már: {látott[i]})")
        látott[i] = ctx
    return errors
