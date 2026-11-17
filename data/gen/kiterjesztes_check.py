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


def _sorok(path):
    """Read all lines and close the file (a bare open() in a for loop leaks the handle)."""
    with open(path, encoding='utf-8') as fh:
        return fh.read().splitlines()


def _id_by_fajl(subdir):
    """{yaml-fájlnév (kiterjesztés nélkül) → id} az adott sources-alkönyvtárból."""
    out = {}
    for y in glob.glob(os.path.join(SOURCES_DIR, subdir, '**', '*.yaml'), recursive=True):
        base = os.path.splitext(os.path.basename(y))[0]
        for line in _sorok(y):
            m = re.match(r'\s*id:\s*"([^"]+)"', line)
            if m:
                out[base] = m.group(1)
                break
    return out


_ALPONT = re.compile(r'^\s{2,}[-*]\s+\S')


def md_tetel_leiras_van(sorok, i, maradek):
    """Has the md kiterjesztés item at line `i` a description? Either text after the link on the same line
    (more than md punctuation / the `\\` line break), or indented sub-bullets right under it."""
    if re.search(r'\w', re.sub(r'\\\s*$', '', maradek)):
        return True
    return i + 1 < len(sorok) and bool(_ALPONT.match(sorok[i + 1]))


def kiterjesztes_sync_hibak():
    """Visszaad egy hibalistát (üres = szinkron)."""
    fajl2id = _id_by_fajl('fortelyok')
    kfajl2id = _id_by_fajl('kepzettsegek')
    with open(os.path.join(TABLES_DIR, 'kiterjesztesek.json'), encoding='utf-8') as f:
        kit = json.load(f)
    data_map = {k: {e['fortély']: e['típus'] for e in rows} for k, rows in kit.items()}
    data_leiras = {k: {e['fortély']: (e.get('leírás') or '').strip() for e in rows} for k, rows in kit.items()}

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
        md_leiras = {}
        sorok = _sorok(md)
        for i, ln in enumerate(sorok):
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
            md_leiras[fid] = md_tetel_leiras_van(sorok, i, ln[m.end():])
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
            if m and d and md_leiras.get(fid) and not data_leiras.get(kepz_id, {}).get(fid):
                errors.append(f"{kepz_id}: '{fid}' az md-ben van leírása (sor vége vagy alpontok), a data layerben ÜRES")
    return errors


def kiterjesztes_leiras_hibak(kit=None):
    """Kiterjesztés-leírás tartalom-ellenőrzés (2026-11-17).

    A `kiterjeszti` leírásokat egyszeri script bányászta az md-ből; a lista utolsó tétele utáni md
    sortörés (`\\`) leírásként maradt bent (tajtipus_sivatagi). Egy nem üres leírásban legyen betű vagy
    szám - különben az md-formázás maradéka (az app aláhúzva, koppinthatóan mutatná).
    `kit`: tesztből injektálható {képzettség: [ {fortély, leírás, ...} ]}; alapból a legenerált json.
    """
    if kit is None:
        with open(os.path.join(TABLES_DIR, 'kiterjesztesek.json'), encoding='utf-8') as f:
            kit = json.load(f)
    errors = []
    for kepz, rows in kit.items():
        for e in rows:
            l = (e.get('leírás') or '').strip()
            if l and not re.search(r'\w', l):
                errors.append(f"{kepz}: '{e.get('fortély')}' leírása csak írásjel/formázás: {l!r} (md-maradék? legyen üres)")
    return errors
