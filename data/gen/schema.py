"""Séma validáció: a source entitások kulcshalmazát a `schemas/*.yaml`-hoz méri.

A kötelezőséget a sémák megjegyzés-konvenciója adja:
  `# opcionális ...` → a source-ban elhagyható
  `# generált ...`   → a source-ban NEM szerepel (a generátor adja hozzá)
  bármi más          → kötelező (AGENTS.md: strict schema, nincs implicit default)
"""

import os
from functools import lru_cache

from .common import SCHEMAS_DIR, load_yaml


@lru_cache(maxsize=None)
def _schema_fields(schema_name, root_key=None):
    """(kulcsok, opcionális, generált) halmazok a séma yaml-ból + a megjegyzéseiből."""
    path = os.path.join(SCHEMAS_DIR, f'{schema_name}.yaml')
    doc = load_yaml(path)
    if root_key:
        node = doc[root_key]
        node = node[0] if isinstance(node, list) else node
    else:
        node = doc
    fields = set(node.keys())

    optional, generated = set(), set()
    for line in open(path, encoding='utf-8'):
        if '#' not in line:
            continue
        key_part, comment = line.split('#', 1)
        # "  - kulcs: érték   # megjegyzés" → "kulcs"
        key = key_part.strip().lstrip('- ').split(':')[0].strip()
        if key not in fields:
            continue
        if 'opcionális' in comment:
            optional.add(key)
        elif 'generált' in comment:
            generated.add(key)
    return fields, optional, generated


def validate_schema(schema_name, docs, label, root_key=None, name_key='név'):
    """Strict séma ellenőrzés: ismeretlen kulcs vagy hiányzó kötelező mező → hiba."""
    fields, optional, generated = _schema_fields(schema_name, root_key)
    required = fields - optional - generated
    errors = []
    for doc in docs:
        keys = set(doc.keys())
        who = doc.get(name_key) or doc.get('id') or '(névtelen)'
        for k in sorted(keys - fields):
            errors.append(f'{label} [{who}]: ismeretlen kulcs "{k}" (nincs a {schema_name} sémában)')
        for k in sorted(required - keys):
            errors.append(f'{label} [{who}]: hiányzó kötelező mező "{k}"')
    if errors:
        raise SystemExit('SÉMA HIBA:\n  ' + '\n  '.join(errors))
