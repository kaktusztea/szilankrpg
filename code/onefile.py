#!/usr/bin/env python3
# -*- coding: utf-8 -*-

## Usage: python3 onefile.py <szilank repo-path> [<output-file>]
##        python3 onefile.py --selftest

"""
Egyesiti az `md/` konyvtar markdown tartalmat egyetlen nagy fajlba.

Felepites:
  1. Gerinc: a repo-gyoker PREPEND_FILES fajljai (README, LICENSE), majd a
     tartalomjegyzek (TOC_FILE), vegul az md/ osszes top-level .md fajlja
     ABC-sorrendben.
  2. Horgonyok: egyes gerinc-fajlok utan beszurodik egy vagy tobb alkonyvtar
     rekurziv markdown tartalma (INJECT_POINTS).
  3. BLACKLIST_DIRS: szandekosan kihagyott alkonyvtarak.

TELJESSEGI GARANCIA
  Minden top-level alkonyvtarnak PONTOSAN egy helyre kell tartoznia: vagy a
  BLACKLIST_DIRS-be, vagy egy INJECT_POINTS mintara illeszkednie. Ha egy
  alkonyvtar egyikbe sem tartozik (vagy tobbe), a script HIBAVAL leall - igy
  soha nem veszhet el neman tartalom (ez volt a regi, substring-alapu valtozat
  csendes hibaja: pl. a magia.faj.arkanumok eltunt a kimenetbol).
"""

import os
import sys
import fnmatch
from pathlib import Path


# ---------------------------------------------------------------------------
# Konfiguracio
# ---------------------------------------------------------------------------

# Alkonyvtar-horgonyok: <md/ gerinc-fajl neve> -> alkonyvtar-mintak listaja.
# A minta pontos nev ('hatterek.faji') vagy glob ('fortelyok.*') lehet.
# A mintakra illeszkedo (nem-blacklistelt) alkonyvtarak rekurziv tartalma a
# horgony-fajl UTAN kerul be, ABC-sorrendben.
INJECT_POINTS = {
    '021_faj_hatterek.md':              ['hatterek.faji'],
    '030_01_kepzettseglista.md':        ['kepzettsegek.*'],
    '045_misztikus_magia_fortelyok.md': ['fortelyok.*'],
    '150_szituaciok.md':                ['szituaciok'],
}

# Szandekosan kihagyott alkonyvtarak (nem kerulnek a kombinalt fajlba).
BLACKLIST_DIRS = [
    'views', 'template', 'images', '.obsidian',
    'diszciplinak.pszi',
    'fortelyok.misztikus',       # WIP misztikus fortelyek
    'magia.papi.varazslatok',    # WIP papi varazslatok
    'magia.faj.arkanumok',       # WIP faji arkanum-stubok (TODO)
]

# A gerinc elejere kerulo, md/ konyvtaron KIVULi fajlok (repo-gyoker).
PREPEND_FILES = ['README.md', 'LICENSE']

# A gerinc elso md/ fajlja (tartalomjegyzek); a tobbi gyoker-md ABC-ben koveti.
TOC_FILE = 'szabalyrendszer.md'

# Fajlok kozti elvalaszto a kimenetben.
FILE_SEP = '\n\n---\n---\n'


# ---------------------------------------------------------------------------
# Segedfuggvenyek
# ---------------------------------------------------------------------------

def read_text(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def md_files(directory, recursive):
    """Alkonyvtar .md fajljai teljes utvonallal, ABC-sorrendben."""
    pattern = '**/*.md' if recursive else '*.md'
    return sorted(str(p.resolve()) for p in Path(directory).glob(pattern))


def top_level_dirs(root):
    return sorted(p.name for p in Path(root).iterdir() if p.is_dir())


def classify(all_dirs):
    """
    Tiszta (lemez-fuggetlen) besorolas.
    Visszaad: ({anchor_fajl: [dirnev, ...]}, [hiba_szoveg, ...]).
    Hiba, ha egy nem-blacklistelt alkonyvtart nulla vagy tobb horgony fed.
    """
    anchor_to_dirs = {}
    for anchor, patterns in INJECT_POINTS.items():
        matched = []
        for pat in patterns:
            matched += [d for d in all_dirs
                        if d not in BLACKLIST_DIRS and fnmatch.fnmatch(d, pat)]
        anchor_to_dirs[anchor] = sorted(set(matched))

    errors = []
    for d in all_dirs:
        if d in BLACKLIST_DIRS:
            continue
        hits = [a for a, ds in anchor_to_dirs.items() if d in ds]
        if not hits:
            errors.append(f"'{d}': nincs besorolva - add a BLACKLIST_DIRS-hez "
                          f"VAGY egy INJECT_POINTS mintahoz")
        elif len(hits) > 1:
            errors.append(f"'{d}': tobb horgony is fedi {hits} - nem egyertelmu")
    return anchor_to_dirs, errors


def validate_and_map(all_dirs, root):
    """classify + lemez-ellenorzesek; hiba eseten SystemExit (fail-fast)."""
    anchor_to_dirs, errors = classify(all_dirs)
    for anchor, patterns in INJECT_POINTS.items():
        if not os.path.isfile(os.path.join(root, anchor)):
            errors.append(f"horgony-fajl hianyzik: md/{anchor}")
        if not anchor_to_dirs[anchor]:
            errors.append(f"'{anchor}' mintai egyetlen alkonyvtarra sem "
                          f"illeszkednek: {patterns}")
    if errors:
        raise SystemExit("HIBA - md/ alkonyvtarak besorolasa nem teljes:\n  - "
                         + "\n  - ".join(errors))
    return anchor_to_dirs


def emit_file(out, abs_path, repo_path):
    """Egy fajl kiirasa a kimenetbe (## File: fejlec + tartalom + elvalaszto)."""
    rel_path = abs_path.replace(repo_path + os.sep, '')
    out.write('## File: ' + rel_path + '\n\n')
    out.write(read_text(abs_path))
    out.write(FILE_SEP)
    return rel_path


# ---------------------------------------------------------------------------
# Onteszt
# ---------------------------------------------------------------------------

def selftest():
    """A besorolasi logika ellenorzese (happy path, blacklist, hiany)."""
    dirs = ['fortelyok.harci', 'fortelyok.misztikus', 'kepzettsegek.primer',
            'kepzettsegek.szekunder', 'hatterek.faji', 'szituaciok',
            'magia.faj.arkanumok', 'template']

    mapping, errors = classify(dirs)
    assert not errors, f"vart hibamentes besorolas, kaptunk: {errors}"
    assert mapping['150_szituaciok.md'] == ['szituaciok'], mapping
    assert 'fortelyok.harci' in mapping['045_misztikus_magia_fortelyok.md'], mapping
    # blacklist-precedencia: fortelyok.misztikus illeszkedne a 'fortelyok.*'-ra,
    # de blacklistelt -> nem kerul be
    assert 'fortelyok.misztikus' not in mapping['045_misztikus_magia_fortelyok.md'], mapping
    assert set(mapping['030_01_kepzettseglista.md']) == {
        'kepzettsegek.primer', 'kepzettsegek.szekunder'}, mapping

    # hiany: besoroltalan konyvtar -> hiba keletkezik
    _, errors = classify(dirs + ['uj_besorolatlan_konyvtar'])
    assert any('uj_besorolatlan_konyvtar' in e for e in errors), \
        "a besorolatlan konyvtart hibaval kell jelezni"

    print("selftest OK")


# ---------------------------------------------------------------------------
# Fo
# ---------------------------------------------------------------------------

def main(argv):
    if '--selftest' in argv:
        selftest()
        return

    if len(argv) < 1:
        raise SystemExit("Usage: onefile.py <szilank repo-path> [<output-file>]")

    repo_path = os.path.abspath(argv[0])
    root = os.path.join(repo_path, 'md')
    if not os.path.isdir(root):
        raise SystemExit("HIBA: a(z) 'md' konyvtar nem letezik a megadott repo-ban")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = (os.path.abspath(argv[1]) if len(argv) > 1
                else os.path.join(script_dir, '..', 'work', 'szilank.rpg.full.md'))

    all_dirs = top_level_dirs(root)
    anchor_to_dirs = validate_and_map(all_dirs, root)

    # Gerinc: PREPEND_FILES (repo-gyoker) + TOC + tobbi md/ gyoker-fajl ABC-ben.
    spine = [os.path.join(repo_path, f) for f in PREPEND_FILES]
    spine.append(os.path.join(root, TOC_FILE))
    spine += [f for f in md_files(root, recursive=False)
              if os.path.basename(f) != TOC_FILE]

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    if os.path.exists(out_path):
        os.remove(out_path)

    emitted_dirs = set()
    with open(out_path, 'w', encoding='utf-8') as out:
        for md_file in spine:
            rel_path = emit_file(out, md_file, repo_path)
            print(f"Hozzaadva: {rel_path}")

            anchor = os.path.basename(md_file)
            for dirname in anchor_to_dirs.get(anchor, []):
                subs = md_files(os.path.join(root, dirname), recursive=True)
                for sub in subs:
                    emit_file(out, sub, repo_path)
                emitted_dirs.add(dirname)
                print(f"  + alkonyvtar beszurva: md/{dirname} ({len(subs)} fajl)")

    # Zaro biztonsagi halo: minden besorolt alkonyvtar tenyleg kiirodott-e.
    expected = {d for ds in anchor_to_dirs.values() for d in ds}
    missing = expected - emitted_dirs
    if missing:
        raise SystemExit(f"HIBA: besorolt, de ki nem irt alkonyvtarak: "
                         f"{sorted(missing)}")

    print(f"\nKesz: {out_path}")
    print(f"Gerinc-fajlok: {len(spine)} | beszurt alkonyvtarak: {len(emitted_dirs)}")


if __name__ == '__main__':
    main(sys.argv[1:])
