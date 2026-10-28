#!/usr/bin/env python3
"""Generate tables/*.json from YAML source files.

A generátorok a `gen/` csomagban élnek (egy modul = egy adatterület), ez a fájl
csak a CLI-t, a freshness ellenőrzést és a sorrendet tartja.

Run from repo root or from data/ directory.
Usage: python3 data/generate_tables.py
       python3 data/generate_tables.py --force   # skip freshness check
"""

import json, os, sys

# A gen/ csomag importálható legyen bármelyik munkakönyvtárból indítva
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen.common import TABLES_DIR, load_yaml  # noqa: E402
from gen.cache import sources_unchanged, write_hash, write_marker  # noqa: E402
from gen.konstansok import generate_konstansok  # noqa: E402
from gen.kepzettsegek import generate_kepzettsegek  # noqa: E402
from gen.fortelyok import generate_fortelyok, generate_kiterjesztesek, generate_primer_fortelyok  # noqa: E402
from gen.fajok import generate_fajok  # noqa: E402
from gen.aktiv_ful import generate_aktiv_ful  # noqa: E402
from gen.fegyverek_v2 import generate_fegyverek_v2, generate_sebzesjelleg_pancel_matrix, generate_fegyver_extrak, generate_fegyver_idea_tabla, generate_tavfegyverek_v2  # noqa: E402
from gen.naming_lint import lint as lint_naming  # noqa: E402

# Generálási sorrend: a későbbiek az előzők kimenetére építhetnek
GENERATORS = [
    generate_konstansok,
    generate_kepzettsegek,
    generate_fortelyok,
    generate_kiterjesztesek,
    generate_primer_fortelyok,
    generate_fajok,
    generate_aktiv_ful,
    generate_fegyverek_v2,
    generate_sebzesjelleg_pancel_matrix,
    generate_fegyver_extrak,
    generate_fegyver_idea_tabla,
    generate_tavfegyverek_v2,
]


def validate_fortely_manover_refs():
    """Post-hoc: a fortély módosítók `manőver:<id>` céljai létező manővert jelölnek-e.

    Csak generálás UTÁN futtatható, mert mindkét tábla kimenetét használja.
    """
    with open(os.path.join(TABLES_DIR, 'manoverek.json'), encoding='utf-8') as f:
        manover_ids = {m['id'] for m in json.load(f)}
    with open(os.path.join(TABLES_DIR, 'fortelyok.json'), encoding='utf-8') as f:
        fortelyok = json.load(f)

    errors = []
    for fort in fortelyok:
        for fok in fort.get('fokok', []):
            for mod in (fok.get('módosítók') or []):
                if isinstance(mod, dict) and isinstance(mod.get('cél'), str) and mod['cél'].startswith('manőver:'):
                    mid = mod['cél'].split(':', 1)[1]
                    if mid not in manover_ids:
                        errors.append(f"{fort['név']} fok {fok['fok']}: ismeretlen manőver id: '{mid}'")
    if errors:
        print("  ❌ Fortély → manőver referenciális hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_id_hivatkozasok():
    """Build-gate (2026-10-17, id-átállás F2): a FORRÁS-YAML-ok fortély / képzettség / harcmodor-hivatkozásai
    létező id-re mutatnak (gen/hivatkozas.py formátum). Hatókör: fortély követelmények / kiterjeszti /
    próba_enyhítések / módosító-prefixek, faj-listák + faj misztérium, manőver-követelmények, extrák
    (feltétel, `fortély:` cél), szituáció-mapping kulcsok, harcmodor-elemek (konstansok fegyver-kategória,
    taktika-megkötés / szűrő, helyzet-tiltás).
    """
    from gen.hivatkozas import fortely_ids, kepz_ref_hiba, harcmodor_elemek
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sources')
    F, HM = fortely_ids(), harcmodor_elemek()
    alcel_ok = {f"felszerelés:{v}" for v in load_yaml(os.path.join(src, 'fegyverek', 'extrak.schema.yaml'))['alcel_felszereles_enum']}
    fogas_ok = {o['id'] for o in load_yaml(os.path.join(src, 'konstansok.yaml'))['fegyverfogás_opciók']}
    errors = []
    def fort(ctx, n):
        for x in (n if isinstance(n, list) else [n]):
            if x not in F: errors.append(f"{ctx}: ismeretlen fortély-id: '{x}'")
    def kepz(ctx, n):
        for x in (n if isinstance(n, list) else [n]):
            h = kepz_ref_hiba(x)
            if h: errors.append(f"{ctx}: {h}")
    def hm(ctx, x):
        if x not in HM: errors.append(f"{ctx}: ismeretlen harcmodor: '{x}'")
    def prefix(ctx, v):
        if isinstance(v, str) and v.startswith('képzettség:'): kepz(ctx, v.split(':', 1)[1])
        if isinstance(v, str) and v.startswith('fortély:'): fort(ctx, v.split(':', 1)[1])
    def kov(ctx, k):
        if 'név' not in k: return
        if k.get('típus') == 'képzettség': kepz(ctx, k['név'])
        elif k.get('típus') in ('fortély', 'tiltó_fortély'): fort(ctx, k['név'])
    lst = lambda v: v if isinstance(v, list) else []
    for root, _, files in os.walk(os.path.join(src, 'fortelyok')):
        for fn in files:
            if not fn.endswith('.yaml'): continue
            d = load_yaml(os.path.join(root, fn)); c = f"fortelyok/{fn}"
            kit = d.get('kiterjeszti') or {}
            kit_ids = [(e.get('képzettség') if isinstance(e, dict) else e) for e in (lst(kit.get('normál')) + lst(kit.get('erős')))]
            kepz(f"{c} kiterjeszti", kit_ids)
            for fok in d.get('fokok') or []:
                cf = f"{c} fok {fok['fok']}"
                for k in lst(fok.get('követelmények')): kov(f"{cf} követelmény", k)
                for k in lst(fok.get('követelmények')):
                    if k.get('alcél') and k['alcél'] not in alcel_ok: errors.append(f"{cf} követelmény alcél: '{k['alcél']}' (érvényes: {sorted(alcel_ok)})")
                    if k.get('feltétel', '').startswith('fegyverfogás:') and k['feltétel'].split(':', 1)[1] not in fogas_ok:
                        errors.append(f"{cf} követelmény feltétel: ismeretlen fegyverfogás '{k['feltétel']}'")
                for m in lst(fok.get('módosítók')):
                    for kk in ('cél', 'alcél', 'feltétel'): prefix(f"{cf} módosító {kk}", m.get(kk))
                for pe in lst(fok.get('próba_enyhítések')): kepz(f"{cf} próba_enyhítés", pe['képzettség'])
    fdir = os.path.join(src, 'fajok')
    for fn in sorted(os.listdir(fdir)):
        if not fn.endswith('.yaml'): continue
        d = load_yaml(os.path.join(fdir, fn)); c = f"fajok/{fn}"
        for key in ('érzék_fortélyok', 'ajánlott_fortélyok'):
            for e in lst(d.get(key)): fort(f"{c} {key}", e.get('név', ''))
        for key in ('kötelező_fortélyok', 'faji_fortélyok', 'tiltott_fortélyok'): fort(f"{c} {key}", lst(d.get(key)))
        for key in ('ajánlott_képzettségek', 'tiltott_képzettségek'): kepz(f"{c} {key}", lst(d.get(key)))
        if d.get('faj_misztérium'): kepz(f"{c} faj_misztérium", d['faj_misztérium'])
    for m in load_yaml(os.path.join(src, 'manoverek.yaml'))['manőverek']:
        for k in lst(m.get('követelmények')): kov(f"manőver {m['id']} követelmény", k)
    for e in load_yaml(os.path.join(src, 'fegyverek', 'extrak.yaml'))['extrak']:
        for k in lst(e.get('feltétel')): kov(f"extra {e['id']} feltétel", k)
        for h in lst(e.get('hatás')):
            for kk in ('cél', 'alcél', 'feltétel'): prefix(f"extra {e['id']} hatás {kk}", h.get(kk))
    md_dir = os.path.join(os.path.dirname(src), '..', 'md')
    for k, sorok in (load_yaml(os.path.join(src, 'szituacio_mapping.yaml')) or {}).items():
        pre, _, ref = str(k).partition(':')
        if pre == 'képzettség': kepz("szituacio_mapping kulcs", ref)
        elif pre == 'fortély': fort("szituacio_mapping kulcs", ref)
        else: errors.append(f"szituacio_mapping kulcs: '{k}' (\"képzettség:<id>\" vagy \"fortély:<id>\" kell)")
        for sz in sorok or []:
            if not os.path.isfile(os.path.join(md_dir, sz.get('fájl', ''))): errors.append(f"szituacio_mapping {k}: nem létező md fájl: '{sz.get('fájl')}'")
    for k, v in load_yaml(os.path.join(src, 'konstansok.yaml'))['fegyver_kategória_harcmodor'].items():
        hm(f"konstansok fegyver_kategória_harcmodor.{k}", v)
    for t in load_yaml(os.path.join(src, 'taktikak.yaml'))['taktikák']:
        for mk in lst(t.get('megkötések')):
            if mk.get('típus') == 'harcmodor': hm(f"taktika {t['név']} megkötés", mk['érték'])
        for x in lst(t.get('szűrő_harcmodorok')): hm(f"taktika {t['név']} szűrő_harcmodorok", x)
    for h in load_yaml(os.path.join(src, 'harci_helyzetek.yaml'))['harci_helyzetek']:
        for ti in lst(h.get('tiltások')):
            for fe in lst(ti.get('feltétel')):
                if fe.get('forrás') == 'fegyver.harcmodor': hm(f"helyzet {h['név']} tiltás {ti['id']}", fe['érték'])
    if errors:
        print("  ❌ Fortély / képzettség id-hivatkozási hibák:")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def validate_naming_convention():
    """Build-gate: egységes YAML naming-convention (nem-mozaikszó kulcs/érték = csupa kisbetű).

    A data/sources (pipeline, a fegyvergenerátor `fegyverek/` almappáját is beleértve) fájljait ellenőrzi.
    """
    data_dir = os.path.dirname(os.path.abspath(__file__))
    dirs = [os.path.join(data_dir, 'sources')]
    errors = lint_naming(dirs)
    if errors:
        print("  ❌ YAML naming-convention hibák (nem-mozaikszó nagybetűs kulcs/érték):")
        for e in errors:
            print(f"     {e}")
        raise SystemExit(1)


def main():
    force = '--force' in sys.argv

    # Naming-convention build-gate: MINDIG fut (a freshness-skip előtt is)
    validate_naming_convention()

    if not force and sources_unchanged():
        print("Tables up-to-date, skipping generation.")
        return

    print("Generating tables...")
    for generate in GENERATORS:
        generate()

    validate_fortely_manover_refs()
    validate_id_hivatkozasok()
    write_marker()   # Vite plugin freshness detection
    write_hash()     # a következő futás skip-ellenőrzéséhez
    print("Done.")


if __name__ == '__main__':
    main()
