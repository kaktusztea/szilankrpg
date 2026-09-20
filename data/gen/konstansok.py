"""konstansok.yaml → konstansok.json

A `mesterfegyver_bónuszok` fok→{TÉ,VÉ,CÉ,SP} táblát NEM kézzel tároljuk, hanem a Mesterfegyver
fortély (fortelyok/harci/mesterfegyver.yaml) per-fok `módosítóiból` DERIVÁLJUK — egyetlen forrás,
nincs duplikáció (a fortély a mérvadó).
"""

import os

from .common import SOURCES_DIR, load_yaml, write_json

_MF_CÉLOK = ('TÉ', 'VÉ', 'CÉ', 'SP')


def _derive_mf_bónuszok():
    """A Mesterfegyver fortély per-fok flat módosítóiból építi a fok→{TÉ,VÉ,CÉ,SP} lookup-táblát."""
    mf = load_yaml(os.path.join(SOURCES_DIR, 'fortelyok', 'harci', 'mesterfegyver.yaml'))
    tábla = []
    for fok in mf.get('fokok', []):
        mods = {
            m['cél']: m['érték']
            for m in (fok.get('módosítók') or [])
            if m.get('mód') == 'flat' and m.get('cél') in _MF_CÉLOK
        }
        tábla.append({'fok': fok['fok'], **{k: mods[k] for k in _MF_CÉLOK if k in mods}})
    return tábla


def generate_konstansok():
    """konstansok.yaml → konstansok.json (+ derivált mesterfegyver_bónuszok)"""
    data = load_yaml(os.path.join(SOURCES_DIR, 'konstansok.yaml'))
    data['mesterfegyver_bónuszok'] = _derive_mf_bónuszok()
    write_json('konstansok.json', data)
