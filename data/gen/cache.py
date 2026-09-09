"""Freshness cache: a source YAML-ok ÉS a generátor kód hashe alapján skippelhető a futás."""

import hashlib, os

from .common import DATA_DIR, SOURCES_DIR, TABLES_DIR, GEN_DIR

HASH_FILE = os.path.join(TABLES_DIR, '.sources_hash')
MARKER_FILE = os.path.join(TABLES_DIR, '.generated_marker')


def _generator_files():
    """A generátor összes forrásfájlja — ha bármelyik változik, újra kell generálni."""
    files = [os.path.join(DATA_DIR, 'generate_tables.py')]
    files += [os.path.join(GEN_DIR, f) for f in sorted(os.listdir(GEN_DIR)) if f.endswith('.py')]
    return files


def compute_sources_hash():
    """Az összes YAML source + a teljes generátor kód kombinált hashe."""
    h = hashlib.md5()
    for path in _generator_files():
        with open(path, 'rb') as f:
            h.update(path.encode())
            h.update(f.read())
    # Walk all YAML sources sorted for determinism
    yaml_files = []
    for root, dirs, files in os.walk(SOURCES_DIR):
        dirs.sort()
        for f in sorted(files):
            if f.endswith('.yaml') or f.endswith('.yml'):
                yaml_files.append(os.path.join(root, f))
    for path in yaml_files:
        with open(path, 'rb') as f:
            h.update(path.encode())
            h.update(f.read())
    return h.hexdigest()


def sources_unchanged():
    """True, ha a source-ok és a generátor sem változott az utolsó sikeres futás óta."""
    if not os.path.exists(HASH_FILE):
        return False
    with open(HASH_FILE, 'r') as f:
        stored = f.read().strip()
    return stored == compute_sources_hash()


def write_hash():
    """Hash kiírása sikeres generálás után (a következő futás skip-ellenőrzéséhez)."""
    with open(HASH_FILE, 'w') as f:
        f.write(compute_sources_hash())


def write_marker():
    """Marker fájl a Vite plugin freshness ellenőrzéséhez."""
    with open(MARKER_FILE, 'w') as f:
        f.write('')
