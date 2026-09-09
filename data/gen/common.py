"""Közös alapok a tábla-generátorokhoz: útvonalak, YAML/JSON I/O, magyar rendezés."""

import yaml, json, os

# Resolve data directory (a gen/ csomag szülője)
DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES_DIR = os.path.join(DATA_DIR, 'sources')
SCHEMAS_DIR = os.path.join(DATA_DIR, 'schemas')
TABLES_DIR = os.path.join(DATA_DIR, 'tables')
GEN_DIR = os.path.join(DATA_DIR, 'gen')

os.makedirs(TABLES_DIR, exist_ok=True)


def hu_sort_key(s: str) -> str:
    r = s.lower()
    r = r.replace('á', 'a~').replace('é', 'e~').replace('í', 'i~')
    r = r.replace('ő', 'o~~').replace('ö', 'o~').replace('ó', 'o\x7e')
    r = r.replace('ű', 'u~~').replace('ü', 'u~').replace('ú', 'u\x7e')
    return r

def write_json(filename, data):
    path = os.path.join(TABLES_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {filename}")


def load_yaml(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)
