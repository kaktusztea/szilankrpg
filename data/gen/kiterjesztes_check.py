"""Build-gate (2026-10-28): képzettség md kiterjesztés-szekciók ↔ data layer (kiterjesztesek.json) szinkron.

A képzettség md "Normál/Erős kiterjesztés" szekciói a source of truth; a fortély yaml `kiterjeszti`
mezője ebből generálódik. Ez a gate gépileg őrzi, hogy a kettő ne csússzon el csendben (2026-10-28-i
refaktor: 11 képzettségben 40 eltérés gyűlt fel észrevétlenül).

Parse-szabály (a csendes csapdák ellen, l. refactorlog/2026-10-28.md):
  - Egy kiterjesztés-tétel = a LISTAELEM elején (`-`, opc. `❗`/`🔁`/emoji után) álló ELSŐ fortély-link.
    A sor további linkjei (leírásban hivatkozott képzettség/fortély) NEM tételek.
  - Csak `fortelyok.*` útvonalú link számít (a `kepzettsegek.`/`szituaciok.` kiesik).
Determinisztikus: tiszta statikus szövegelemzés (md + a már legenerált json), nincs I/O-mellékhatás.
"""

import glob
import json
import os
import re

from .common import SOURCES_DIR, TABLES_DIR

_MD_DIR = os.path.join(os.path.dirname(os.path.dirname(SOURCES_DIR)), 'md')
# listaelem eleji fortely-link: "- [Név](../fortelyok.x/fajl.md" (opc. ❗/🔁/emoji prefix a - után)
_ITEM = re.compile(r'^\s*-\s*(?:\S{0,3}\s+)?\[[^\]]+\]\((?:\.\./)+fortelyok\.[a-zá-ű]+/([a-z0-9_]+)\.md\)')
_HEAD = re.compile(r'^### .*(Normál|Erős) kiterjesztés')


def _id_by_fajl(subdir):
    """{yaml-fájlnév (kiterjesztés nélkül) → id} az adott sources-alkönyvtárból."""
    out = {}
    for y in glob.glob(os.path.join(SOURCES_DIR, subdir, '**', '*.yaml'), recursive=True):
        base = os.path.splitext(os.path.basename(y))[0]
        for line in open(y, encoding='utf-8'):
            m = re.match(r'\s*id:\s*"([^"]+)"', line)
            if m:
                out[base] = m.group(1)
                break
    return out


def kiterjesztes_sync_hibak():
    """Visszaad egy hibalistát (üres = szinkron)."""
    fajl2id = _id_by_fajl('fortelyok')
    kfajl2id = _id_by_fajl('kepzettsegek')
    with open(os.path.join(TABLES_DIR, 'kiterjesztesek.json'), encoding='utf-8') as f:
        kit = json.load(f)
    data_map = {k: {e['fortély']: e['típus'] for e in rows} for k, rows in kit.items()}

    errors = []
    md_files = sorted(
        glob.glob(os.path.join(_MD_DIR, 'kepzettsegek.szekunder', '*.md'))
        + glob.glob(os.path.join(_MD_DIR, 'kepzettsegek.primer', '**', '*.md'), recursive=True)
    )
    for md in md_files:
        base = os.path.splitext(os.path.basename(md))[0]
        kepz_id = kfajl2id.get(base)
        section = None
        md_map = {}
        for ln in open(md, encoding='utf-8'):
            ln = ln.rstrip('\n')
            h = _HEAD.match(ln)
            if h:
                section = 'normál' if h.group(1) == 'Normál' else 'erős'
                continue
            if ln.startswith('### '):
                section = None
            if not section:
                continue
            m = _ITEM.match(ln)
            if not m:
                continue
            fid = fajl2id.get(m.group(1))
            if not fid:
                errors.append(f"{base}.md: a kiterjesztés-link nem létező fortély yaml-re mutat: '{m.group(1)}'")
                continue
            if fid in md_map and md_map[fid] != section:
                errors.append(f"{base}.md: '{fid}' Normál ÉS Erős szekcióban is szerepel (tételként)")
            md_map[fid] = section
        if not md_map:
            continue
        if kepz_id is None:
            errors.append(f"{base}.md: van kiterjesztés-szekció, de nincs hozzá képzettség yaml id")
            continue
        dm = data_map.get(kepz_id, {})
        for fid in sorted(set(md_map) | set(dm)):
            m, d = md_map.get(fid), dm.get(fid)
            if m and not d:
                errors.append(f"{kepz_id}: md-ben van ({m}), data layerben NINCS: '{fid}'")
            elif d and not m:
                errors.append(f"{kepz_id}: data layerben van ({d}), md-ben NINCS: '{fid}'")
            elif m != d:
                errors.append(f"{kepz_id}: '{fid}' szint eltér - md={m}, data={d}")
    return errors
