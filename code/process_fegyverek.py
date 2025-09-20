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
    dir_patterns = os.path.join(Path(dir_code).parent, 'data/patterns')

    pattern_files = os.listdir(dir_patterns)
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
        write_list_of_dicts_to_jsonfile(path_json, full_json)
