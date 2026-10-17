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
import os

from .common import SOURCES_DIR, load_yaml

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
