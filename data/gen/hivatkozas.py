"""Fortély / képzettség hivatkozások (2026-10-17, id-átállás F2).

A forrás-YAML-ok a fortélyokra és képzettségekre `id`-vel hivatkoznak:
  - fortély:     `<fortély-id>`                       pl. "mesterfegyver"
  - képzettség:  `<képzettség-id>`                    pl. "lexikum"
                 `<képzettség-id>/<elem>` többszörösnél pl. "harcmodor/kardvívás", "ősi_nyelv_ismerete/Kyr"
                 `harcmodor` / `távolsági_harcmodor` elem nélkül = az aktív fegyver harcmodora (manőver-követelmény)
  - harcmodor-elem (fegyver-kategória, taktika-megkötés, helyzet-tiltás): a `konstansok.harcmodorok` eleme,
                 pl. "kardvívás"

ÁTMENETI (F2-F3): a webapp és a code/balance még NÉV szerint dolgozik, ezért a generátor a táblák kiírásakor
ezekkel a függvényekkel visszafordítja a hivatkozásokat névre. ponytail: a visszafordítás az F4-ben megszűnik
(a táblák id-t visznek, a GUI old fel), addig ez az egyetlen hely, ami a két világot összeköti.
"""

import glob
import json
import os

from .common import SOURCES_DIR, TABLES_DIR, load_yaml

HARCMODOR_ALAPOK = ('harcmodor', 'távolsági_harcmodor')

_cache = {}


def _maps():
    if not _cache:
        fort, kepz = {}, {}
        for f in glob.glob(os.path.join(SOURCES_DIR, 'fortelyok', '**', '*.yaml'), recursive=True):
            d = load_yaml(f); fort[d['id']] = d['név']
        for f in glob.glob(os.path.join(SOURCES_DIR, 'kepzettsegek', '**', '*.yaml'), recursive=True):
            d = load_yaml(f); kepz[d['id']] = d['név']
        hm = load_yaml(os.path.join(SOURCES_DIR, 'konstansok.yaml'))['harcmodorok']
        _cache.update(fort=fort, kepz=kepz, hm_kozel=set(hm['közelharci']), hm_tav=set(hm['távolsági']))
    return _cache


def fortely_ids():
    return set(_maps()['fort'])


def kepzettseg_ids():
    return set(_maps()['kepz'])


def harcmodor_elemek():
    m = _maps(); return m['hm_kozel'] | m['hm_tav']


def hm_nev(elem):
    """Harcmodor-elem → megjelenítési név (a karakter ma így tárolja): 'kardvívás' → 'Kardvívás'."""
    return elem[:1].upper() + elem[1:]


def _hiba(mi, x):
    raise SystemExit(f"  ❌ Ismeretlen {mi}-id a forrásban: '{x}' (gen/hivatkozas.py - l. data/sources fortelyok/kepzettsegek `id`)")


def fort_nev(fid):
    f = _maps()['fort']
    return f[fid] if fid in f else _hiba('fortély', fid)


def kepz_nev(ref):
    """Képzettség-hivatkozás → a mai (név-alapú) karakter-alak: 'harcmodor/kardvívás' → 'Kardvívás',
    'ősi_nyelv_ismerete/Kyr' → 'Ősi nyelv ismerete: Kyr', 'lexikum' → 'Lexikum'."""
    alap, _, elem = ref.partition('/')
    if elem and alap in HARCMODOR_ALAPOK:
        return hm_nev(elem)
    k = _maps()['kepz']
    nev = k[alap] if alap in k else _hiba('képzettség', alap)
    return f"{nev}: {elem}" if elem else nev


def kepz_ref_hiba(ref):
    """None, ha a képzettség-hivatkozás érvényes; különben a hiba szövege."""
    m = _maps()
    alap, _, elem = ref.partition('/')
    if alap not in m['kepz']:
        return f"ismeretlen képzettség-id: '{alap}'"
    if alap == 'harcmodor' and elem and elem not in m['hm_kozel']:
        return f"ismeretlen közelharci harcmodor: '{elem}'"
    if alap == 'távolsági_harcmodor' and elem and elem not in m['hm_tav']:
        return f"ismeretlen távolsági harcmodor: '{elem}'"
    return None


def prefixes_vissza(s):
    """'képzettség:<ref>' / 'fortély:<id>' → névre (a többi érték változatlan)."""
    if isinstance(s, str):
        if s.startswith('képzettség:'):
            return 'képzettség:' + kepz_nev(s[len('képzettség:'):])
        if s.startswith('fortély:'):
            return 'fortély:' + fort_nev(s[len('fortély:'):])
    return s


def kovetelmeny_vissza(k):
    """Követelmény-elem (fortély / manőver / extra) név-mezője vissza névre, típus szerint."""
    t, nev = k.get('típus'), k.get('név')
    if nev is None:
        return k
    f = kepz_nev if t == 'képzettség' else fort_nev if t in ('fortély', 'tiltó_fortély') else None
    if f is None:
        return k
    return {**k, 'név': [f(n) for n in nev] if isinstance(nev, list) else f(nev)}


def id_hivatkozasi_hibak():
    """Build-gate (2026-10-17, id-átállás F2): a FORRÁS-YAML-ok fortély / képzettség / harcmodor-hivatkozásai
    létező id-re mutatnak (gen/hivatkozas.py formátum). Hatókör: fortély követelmények / kiterjeszti /
    próba_enyhítések / módosító-prefixek, faj-listák + faj misztérium, manőver-követelmények, extrák
    (feltétel, `fortély:` cél), szituáció-mapping kulcsok, harcmodor-elemek (konstansok fegyver-kategória,
    taktika-megkötés / szűrő, helyzet-tiltás).
    """
    src = SOURCES_DIR
    F, HM = fortely_ids(), harcmodor_elemek()
    alcel_ok = {f"felszerelés:{v}" for v in load_yaml(os.path.join(src, 'fegyverek', 'extrak.schema.yaml'))['alcel_felszereles_enum']}
    fogas_ok = {o['id'] for o in load_yaml(os.path.join(src, 'konstansok.yaml'))['fegyverfogás_opciók']}
    errors = []
    def fort(ctx, n):
        for x in (n if isinstance(n, list) else [n]):
            if x not in F: errors.append(f"{ctx}: ismeretlen fortély-id: '{x}'")
    def kepz(ctx, n):
        for x in (n if isinstance(n, list) else [n]):
            h = kepz_ref_hiba(x)
            if h: errors.append(f"{ctx}: {h}")
    def hm(ctx, x):
        if x not in HM: errors.append(f"{ctx}: ismeretlen harcmodor: '{x}'")
    def prefix(ctx, v):
        if isinstance(v, str) and v.startswith('képzettség:'): kepz(ctx, v.split(':', 1)[1])
        if isinstance(v, str) and v.startswith('fortély:'): fort(ctx, v.split(':', 1)[1])
    def kov(ctx, k):
        if 'név' not in k: return
        if k.get('típus') == 'képzettség': kepz(ctx, k['név'])
        elif k.get('típus') in ('fortély', 'tiltó_fortély'): fort(ctx, k['név'])
    lst = lambda v: v if isinstance(v, list) else []
    for root, _, files in os.walk(os.path.join(src, 'fortelyok')):
        for fn in files:
            if not fn.endswith('.yaml'): continue
            d = load_yaml(os.path.join(root, fn)); c = f"fortelyok/{fn}"
            kit = d.get('kiterjeszti') or {}
            kit_ids = [(e.get('képzettség') if isinstance(e, dict) else e) for e in (lst(kit.get('normál')) + lst(kit.get('erős')))]
            kepz(f"{c} kiterjeszti", kit_ids)
            for fok in d.get('fokok') or []:
                cf = f"{c} fok {fok['fok']}"
                for k in lst(fok.get('követelmények')): kov(f"{cf} követelmény", k)
                for k in lst(fok.get('követelmények')):
                    if k.get('alcél') and k['alcél'] not in alcel_ok: errors.append(f"{cf} követelmény alcél: '{k['alcél']}' (érvényes: {sorted(alcel_ok)})")
                    if k.get('feltétel', '').startswith('fegyverfogás:') and k['feltétel'].split(':', 1)[1] not in fogas_ok:
                        errors.append(f"{cf} követelmény feltétel: ismeretlen fegyverfogás '{k['feltétel']}'")
                for m in lst(fok.get('módosítók')):
                    for kk in ('cél', 'alcél', 'feltétel'): prefix(f"{cf} módosító {kk}", m.get(kk))
                for pe in lst(fok.get('próba_enyhítések')): kepz(f"{cf} próba_enyhítés", pe['képzettség'])
    fdir = os.path.join(src, 'fajok')
    for fn in sorted(os.listdir(fdir)):
        if not fn.endswith('.yaml'): continue
        d = load_yaml(os.path.join(fdir, fn)); c = f"fajok/{fn}"
        for key in ('érzék_fortélyok', 'ajánlott_fortélyok'):
            for e in lst(d.get(key)): fort(f"{c} {key}", e.get('név', ''))
        for key in ('kötelező_fortélyok', 'faji_fortélyok', 'tiltott_fortélyok'): fort(f"{c} {key}", lst(d.get(key)))
        for key in ('ajánlott_képzettségek', 'tiltott_képzettségek'): kepz(f"{c} {key}", lst(d.get(key)))
        if d.get('faj_misztérium'): kepz(f"{c} faj_misztérium", d['faj_misztérium'])
    for m in load_yaml(os.path.join(src, 'manoverek.yaml'))['manőverek']:
        for k in lst(m.get('követelmények')): kov(f"manőver {m['id']} követelmény", k)
    for e in load_yaml(os.path.join(src, 'fegyverek', 'extrak.yaml'))['extrak']:
        for k in lst(e.get('feltétel')): kov(f"extra {e['id']} feltétel", k)
        for h in lst(e.get('hatás')):
            for kk in ('cél', 'alcél', 'feltétel'): prefix(f"extra {e['id']} hatás {kk}", h.get(kk))
    md_dir = os.path.join(os.path.dirname(src), '..', 'md')
    for k, sorok in (load_yaml(os.path.join(src, 'szituacio_mapping.yaml')) or {}).items():
        pre, _, ref = str(k).partition(':')
        if pre == 'képzettség': kepz("szituacio_mapping kulcs", ref)
        elif pre == 'fortély': fort("szituacio_mapping kulcs", ref)
        else: errors.append(f"szituacio_mapping kulcs: '{k}' (\"képzettség:<id>\" vagy \"fortély:<id>\" kell)")
        for sz in sorok or []:
            if not os.path.isfile(os.path.join(md_dir, sz.get('fájl', ''))): errors.append(f"szituacio_mapping {k}: nem létező md fájl: '{sz.get('fájl')}'")
    for k, v in load_yaml(os.path.join(src, 'konstansok.yaml'))['fegyver_kategória_harcmodor'].items():
        hm(f"konstansok fegyver_kategória_harcmodor.{k}", v)
    for t in load_yaml(os.path.join(src, 'taktikak.yaml'))['taktikák']:
        for mk in lst(t.get('megkötések')):
            if mk.get('típus') == 'harcmodor': hm(f"taktika {t['név']} megkötés", mk['érték'])
        for x in lst(t.get('szűrő_harcmodorok')): hm(f"taktika {t['név']} szűrő_harcmodorok", x)
    for h in load_yaml(os.path.join(src, 'harci_helyzetek.yaml'))['harci_helyzetek']:
        for ti in lst(h.get('tiltások')):
            for fe in lst(ti.get('feltétel')):
                if fe.get('forrás') == 'fegyver.harcmodor': hm(f"helyzet {h['név']} tiltás {ti['id']}", fe['érték'])
    return errors


def manover_ref_hibak(fortelyok=None, manover_ids=None):
    """Build-gate, post-hoc (hibalista): a fortély módosítók `manőver:<id>` céljai létező manővert jelölnek-e.

    Alapból a generált táblákat olvassa (csak generálás UTÁN futtatható); a paraméterek a teszthez.
    """
    if manover_ids is None:
        with open(os.path.join(TABLES_DIR, 'manoverek.json'), encoding='utf-8') as f:
            manover_ids = {m['id'] for m in json.load(f)}
    if fortelyok is None:
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
    return errors
