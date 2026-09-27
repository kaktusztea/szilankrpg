#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from lib.MdToJsonConverter import MdToJsonConverter
from lib.util import *

from pathlib import Path
import json
import os

if __name__ == "__main__":

    dir_code = os.path.dirname(os.path.abspath(__file__))
    dir_md = os.path.join(Path(dir_code).parent, 'md')
    dir_data = os.path.join(Path(dir_code).parent, 'data')
    # md → json kinyerés konfigja (kézzel szerkesztett, NEM generált adat)
    dir_patterns = os.path.join(Path(dir_code).parent, 'data/patterns')

    pattern_files = [f for f in os.listdir(dir_patterns) if f.endswith('_pattern.json')]
    data = []

    for pfile in pattern_files:
        with open(os.path.join(dir_patterns, pfile)) as fj:
                data.append(json.load(fj))

    for d in data:
        path_json = os.path.join(dir_data, d['output'])
        full_json = []
        fcount = 0
        for fname in os.listdir(dir_md):
            if (d['file_pattern']) in fname:
                path_md = os.path.join(dir_md, fname)
                mjc = MdToJsonConverter(path_md, None, d)
                full_json.extend(mjc.get_json_data())
                fcount += 1

        # Sort the unified list by sortkey if there are multiple tables
        if d['sortkey'] and fcount > 1:
            full_json = order_list_of_dicts_by_key(full_json, d['sortkey'])

        # Write output file
        path_json=os.path.join(dir_data, 'tables', d['output'])

        # Post-process: tavfegyverek.json — Harcmodor és Kategória mező
        if d['output'] == 'tavfegyverek.json':
            # Mágiatáv I-IV hozzáfűzése (virtuális mágikus távfegyverek)
            for fokozat, (ce, oszto) in enumerate([('1','1'),('2','2'),('3','3'),('4','4')], start=1):
                roman = ['I','II','III','IV'][fokozat-1]
                full_json.append({
                    'Fegyver': f'Mágiatáv {roman}',
                    'CÉ': ce,
                    'Osztó': oszto,
                    'SP': '0',
                    'Sebesség': '0',
                    'Sebzés módja': 'spec',
                    'Forgatás módja': 'spec',
                    'Erőbónusz': '0',
                    'Átütés': '0',
                    'Hatótáv': '0',
                    'Speciális / Megjegyzés': 'Varázslat-specifikus SP/Hatótáv/Sebesség',
                    'Kategória': 'mágikus',
                    'Harcmodor': 'Mágikus célzás',
                })

            # Lőfegyverek: íjak → Íjászat, nyílpuskák → Lövészet, fúvócsövek → Lövészet
            lofegyver_keywords = ['íj', 'visszacsapó']
            loveszet_keywords = ['nyílpuska', 'fúvócső', 'shad0ni']
            for entry in full_json:
                name_lower = entry['Fegyver'].lower()
                if 'mágiatáv' in name_lower:
                    continue  # már be van állítva
                elif any(kw in name_lower for kw in loveszet_keywords):
                    entry.setdefault('Kategória', 'lőfegyver')
                    entry.setdefault('Harcmodor', 'Lövészet')
                elif any(kw in name_lower for kw in lofegyver_keywords):
                    entry.setdefault('Kategória', 'lőfegyver')
                    entry.setdefault('Harcmodor', 'Íjászat')
                else:
                    entry.setdefault('Kategória', 'hajító')
                    entry.setdefault('Harcmodor', 'Hajítás')

        write_list_of_dicts_to_jsonfile(path_json, full_json)
