"""Tulajdonság-kategóriák (md/010_05_01_00 Fizikai / Szellemi Tulajdonságok): az egyetlen forrás a
konstansok.yaml → `tulajdonság_kategóriák`. Ebből derivált a `tulajdonság_sorrend` (konstansok.json) és az
esemenyek.yaml próba-kategóriák (`tulajdonság_kategória: <kat>` → `tulajdonságok` lista, md/010_11)."""

import os

from .common import SCHEMAS_DIR, load_yaml

KATEGÓRIÁK = ('fizikai', 'szellemi')


def tulajdonsag_sorrend(konstansok):
    """A Tulajdonságok sorrendje: a kategóriák listái egymás után (fizikai, majd szellemi)."""
    kat = konstansok.get('tulajdonság_kategóriák') or {}
    return [t for k in KATEGÓRIÁK for t in (kat.get(k) or [])]


def tulajdonsag_kategoria_hibak(konstansok, schema_tul=None):
    """A két kategória átfedés nélkül, pontosan lefedi a karakter-séma Tulajdonságait."""
    if schema_tul is None:
        schema_tul = set(load_yaml(os.path.join(SCHEMAS_DIR, 'karakter.yaml'))['tulajdonságok'])
    kat = konstansok.get('tulajdonság_kategóriák') or {}
    errors = []
    if set(kat) != set(KATEGÓRIÁK):
        errors.append(f"tulajdonság_kategóriák: a kulcsok {sorted(KATEGÓRIÁK)} kell legyenek (van: {sorted(kat)})")
    sorrend = tulajdonsag_sorrend(konstansok)
    dup = sorted({t for t in sorrend if sorrend.count(t) > 1})
    if dup: errors.append(f"tulajdonság_kategóriák: átfedő / ismétlődő tulajdonság(ok): {dup}")
    ismeretlen = sorted(set(sorrend) - schema_tul)
    if ismeretlen: errors.append(f"tulajdonság_kategóriák: ismeretlen tulajdonság(ok): {ismeretlen}")
    hiany = sorted(schema_tul - set(sorrend))
    if hiany: errors.append(f"tulajdonság_kategóriák: nem fedi le a Tulajdonságokat (hiányzik: {hiany})")
    return errors


def esemeny_kategoria_kifejt(esemenyek, konstansok):
    """`tulajdonság_kategória: <kat>` → `tulajdonságok` lista, helyben (a JSON-ban csak a lista marad)."""
    kat = konstansok.get('tulajdonság_kategóriák') or {}
    errors = []
    for e in esemenyek:
        k = e.pop('tulajdonság_kategória', None)
        if k is None: continue
        ctx = f"esemény '{e.get('id')}'"
        if e.get('tulajdonságok'): errors.append(f"{ctx}: 'tulajdonság_kategória' és 'tulajdonságok' egyszerre")
        elif k not in kat: errors.append(f"{ctx}: ismeretlen tulajdonság_kategória '{k}' (megengedett: {sorted(kat)})")
        else: e['tulajdonságok'] = list(kat[k])
    return errors
