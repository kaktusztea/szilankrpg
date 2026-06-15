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
    dir_patterns = os.path.join(Path(dir_code).parent, 'data/tables')

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

        # Post-process: add MK_pár and Alapnév for másfélkezes weapons
        if d['output'] == 'fegyverek.json':
            pairs = {}
            for entry in full_json:
                name = entry['Fegyver']
                if name.endswith(' (1K)') or name.endswith(' 1K'):
                    base = name.replace(' (1K)', '').replace(' 1K', '')
                    pairs.setdefault(base, {})['1K'] = name
                elif name.endswith(' (2K)') or name.endswith(' 2K'):
                    base = name.replace(' (2K)', '').replace(' 2K', '')
                    pairs.setdefault(base, {})['2K'] = name
            pair_map = {}
            for base, p in pairs.items():
                if '1K' in p and '2K' in p:
                    pair_map[p['1K']] = p['2K']
                    pair_map[p['2K']] = p['1K']
            for entry in full_json:
                if 'MK_pár' not in entry:
                    entry['MK_pár'] = pair_map.get(entry['Fegyver'], '')
                elif not entry['MK_pár']:
                    entry['MK_pár'] = pair_map.get(entry['Fegyver'], '')
                if 'Alapnév' not in entry:
                    entry['Alapnév'] = ''
                if entry['MK_pár'] and entry.get('Forgatás módja') == 'egykezes':
                    entry['Alapnév'] = entry['Fegyver'].replace(' (1K)', '').replace(' 1K', '')
                # Hárítófegyver flag (ha még nincs beállítva)
                if 'Hárító' not in entry:
                    name = entry['Fegyver']
                    spec = entry.get('Speciális', '')
                    spec_str = spec if isinstance(spec, str) else ''
                    entry['Hárító'] = '1' if (name.startswith('Hárító:') or ', hárító' in name.lower() or 'hárítófegyverként' in spec_str.lower()) else '0'

        write_list_of_dicts_to_jsonfile(path_json, full_json)
