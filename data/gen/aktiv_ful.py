"""Aktív fül adatai: taktikák, harci helyzetek, manőverek, státuszok, események, operátorok, hátterek."""

import os

from .common import SOURCES_DIR, load_yaml, write_json
from .schema import validate_schema
from .validators import (
    validate_aktiv_ful, validate_hatasok, validate_esemenyek,
    validate_statuszok, validate_hatasok_katalogus,
)


def generate_aktiv_ful():
    """taktikak.yaml, harci_helyzetek.yaml, manoverek.yaml, statuszok.yaml, hatas_operatorok.yaml, esemenyek.yaml → JSON
    (hatasok.yaml csak validációhoz töltődik be, nincs JSON kimenete)"""
    taktikak = load_yaml(os.path.join(SOURCES_DIR, 'taktikak.yaml'))['taktikák']
    helyzetek = load_yaml(os.path.join(SOURCES_DIR, 'harci_helyzetek.yaml'))['harci_helyzetek']
    manoverek = load_yaml(os.path.join(SOURCES_DIR, 'manoverek.yaml'))['manőverek']
    hatas_operatorok = load_yaml(os.path.join(SOURCES_DIR, 'hatas_operatorok.yaml'))['hatás_operátorok']
    esemenyek = load_yaml(os.path.join(SOURCES_DIR, 'esemenyek.yaml'))['események']
    statuszok = load_yaml(os.path.join(SOURCES_DIR, 'statuszok.yaml'))['státuszok']
    hatasok = load_yaml(os.path.join(SOURCES_DIR, 'hatasok.yaml'))['hatások']
    hatterek = load_yaml(os.path.join(SOURCES_DIR, 'hatterek.yaml'))

    validate_schema('taktika', taktikak, 'taktikak.yaml', root_key='taktikák')
    validate_schema('harci_helyzet', helyzetek, 'harci_helyzetek.yaml', root_key='harci_helyzetek')
    validate_schema('manover', manoverek, 'manoverek.yaml', root_key='manőverek')
    validate_schema('statusz', statuszok, 'statuszok.yaml', root_key='státuszok')
    validate_schema('esemeny', esemenyek, 'esemenyek.yaml', root_key='események')
    validate_schema('hatas', hatas_operatorok, 'hatas_operatorok.yaml', root_key='hatás_operátorok')
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

    # Manőver: helyzetfüggő_módosítók normalizálás ("" vagy hiányzó → [])
    for m in manoverek:
        hm = m.get('helyzetfüggő_módosítók')
        m['helyzetfüggő_módosítók'] = hm if isinstance(hm, list) else []
        köv = m.get('követelmények')
        m['követelmények'] = köv if isinstance(köv, list) else []
        fi = m.get('fázis_info')
        m['fázis_info'] = fi if isinstance(fi, dict) else {}
        fcs = m.get('fázis_cselekvő')
        m['fázis_cselekvő'] = fcs if isinstance(fcs, dict) else {}
        m.setdefault('ellenpróba_bünteti', False)
        m.setdefault('végrehajtás_té_módosító', 4)

    write_json('taktikak.json', taktikak)
    write_json('harci_helyzetek.json', helyzetek)
    write_json('manoverek.json', manoverek)
    write_json('hatas_operatorok.json', hatas_operatorok)
    write_json('esemenyek.json', esemenyek)
    # hatasok.json NEM generálódik: az app nem tölti be, csak a validáció használja
    # Statuszok: default mezők biztosítása
    for s in statuszok:
        s.setdefault('többszörös', False)
        s.setdefault('alkategóriák', [])

    write_json('statuszok.json', statuszok)
    write_json('hatterek.json', hatterek)
