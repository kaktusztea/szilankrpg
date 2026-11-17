"""Freshness cache: a source YAML-ok, a sémák ÉS a generátor kód hashe alapján skippelhető a futás."""

import hashlib, os, unicodedata

from .common import DATA_DIR, SOURCES_DIR, SCHEMAS_DIR, TABLES_DIR, GEN_DIR

HASH_FILE = os.path.join(TABLES_DIR, '.sources_hash')
MARKER_FILE = os.path.join(TABLES_DIR, '.generated_marker')


def _rel(path):
    """Machine-independent key for a hashed file: data/-relative, '/' separators, NFC (macOS may store NFD names)."""
    return unicodedata.normalize('NFC', os.path.relpath(path, DATA_DIR)).replace(os.sep, '/')


def _generator_files():
    """A generátor összes forrásfájlja - ha bármelyik változik, újra kell generálni."""
    files = [os.path.join(DATA_DIR, 'generate_tables.py')]
    files += [os.path.join(GEN_DIR, f) for f in sorted(os.listdir(GEN_DIR)) if f.endswith('.py')]
    return files


def compute_sources_hash():
    """Az összes YAML source + séma (a build-gate-ek ezekhez mérnek) + a teljes generátor kód kombinált hashe."""
    h = hashlib.md5()
    for path in _generator_files():
        with open(path, 'rb') as f:
            h.update(_rel(path).encode())
            h.update(f.read())
    # Walk all YAML sources sorted for determinism
    yaml_files = []
    for base in (SOURCES_DIR, SCHEMAS_DIR):
        for root, dirs, files in os.walk(base):
            dirs.sort()
            for f in sorted(files):
                if f.endswith('.yaml') or f.endswith('.yml'):
                    yaml_files.append(os.path.join(root, f))
    for path in sorted(yaml_files, key=_rel):
        with open(path, 'rb') as f:
            h.update(_rel(path).encode())
            h.update(f.read())
    return h.hexdigest()


def sources_unchanged():
    """True, ha a source-ok és a generátor sem változott az utolsó sikeres futás óta."""
    if not os.path.exists(HASH_FILE):
        return False
    with open(HASH_FILE, 'r') as f:
        stored = f.read().strip()
    return stored == compute_sources_hash()


def invalidate_hash():
    """Empty the stored hash BEFORE writing any table. If a generator or build-gate then stops the run,
    the tables on disk may come from broken sources: with an empty hash the next run regenerates for sure
    (restoring the sources would otherwise match the old hash and skip, keeping the broken tables)."""
    with open(HASH_FILE, 'w') as f:
        f.write('')


def write_hash():
    """Hash kiírása sikeres generálás után (a következő futás skip-ellenőrzéséhez)."""
    with open(HASH_FILE, 'w') as f:
        f.write(compute_sources_hash())


def write_marker():
    """Marker fájl a Vite plugin freshness ellenőrzéséhez."""
    with open(MARKER_FILE, 'w') as f:
        f.write('')
