#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path
import json
import os

class MdToJsonConverter:

    def __init__(self, path_md, path_json, params):
        self.path_md = path_md
        self.path_json = path_json

        if not isinstance(params, dict):
            raise Exception("MdToJsonConverter.init(): params is not dict")

        self.md = None
        self.list_dicts = []
        self.filepattern = params['file_pattern']
        self.table_pattern = params['table_pattern']
        self.sortkey = params['sortkey']

        self.tag_start = f"<!-- tag: md_table_{self.table_pattern}_start -->"
        self.tag_end = f"<!-- tag: md_table_{self.table_pattern}_end -->"
        self.filter_out_chars = ['**', '`', '⭕TODO⭕', '⭕TODO', '⭕']
        self.skip_columns = params['skip_columns']

        # execute processing
        self.read_md()
        self.filter_raw_md()
        self.get_table_sections_from_raw_md()
        self.convert_md_to_json()
        self.order_json_by_key()

    def read_md(self):
        with open(path_md, 'r') as fh:
            self.md = fh.read()

    def filter_raw_md(self):
        """
        Filter unnecessary strings from raw markdown data
        """
        for ch in self.filter_out_chars:
            self.md = self.md.replace(ch, '')

    def get_table_sections_from_raw_md(self):
        """
        Filter markdown table code from raw markdown data
        """
        extracted_lines = []
        is_between_markers = False

        for line in self.md.split("\n"):
            if self.tag_start in line:
                is_between_markers = True
                continue
            if self.tag_end in line:
                is_between_markers = False
                break
            if is_between_markers:
                extracted_lines.append(line.strip())
        self.md = "\n".join(extracted_lines)

    def convert_md_to_json(self):
        for n, line in enumerate(self.md[1:-1].split('\n')):
            data = {}
            if n == 0:
                header = [t.strip() for t in line.split('|')[1:-1]]
            if n > 1:
                values = [t.strip() for t in line.split('|')[1:-1]]
                for col, value in zip(header, values):
                    if col not in self.skip_columns:
                        data[col] = value
                self.list_dicts.append(data)
            n += 1

    def order_json_by_key(self):
        """"
        Order json by fegyver nev
        """
        self.list_dicts = sorted(self.list_dicts, key=lambda x: x[self.sortkey].lower())

    def write_json(self, path_json=None):
        if not path_json:
            path_json = self.path_json
        with open(path_json, 'w', encoding="utf-8") as fj:
            json.dump(self.list_dicts, fj, ensure_ascii=False, indent=4)

    def get_json_data(self):
        return self.list_dicts


## Global defs
def order_list_of_dicts_by_key(list_dicts, sortkey):
    """"
    Order list of dicts  by key
    """
    return sorted(list_dicts, key=lambda x: x[sortkey].lower())


def write_out_to_json(path_json, list_dicts):
    with open(path_json, 'w', encoding="utf-8") as fj:
        fj.seek(0)
        fj.truncate()
        json.dump(list_dicts, fj, ensure_ascii=False, indent=4)


## START SCRIPT ########################################
if __name__ == "__main__":

    dir_code = os.path.dirname(os.path.abspath(__file__))
    dir_data = os.path.join(Path(dir_code).parent, 'data')
    dir_md = os.path.join(Path(dir_code).parent, 'md')

    data = [
       {
        'id':'fegyverek',
        'output':'fegyverek.json',
        'file_pattern': 'fegyverek.md',
        'table_pattern': 'fegyver',
        'sortkey': 'Fegyver',
        'skip_columns': []
       },
       {
        'id':'tavfegyverek',
        'output':'tavfegyverek.json',
        'file_pattern': 'fegyverek.md',
        'table_pattern': 'tavfegyver',
        'sortkey': 'Fegyver',
        'skip_columns': []
       },
       {
        'id':'kepzettseg_kp',
        'output':'kepzettseg_kp.json',
        'file_pattern': 'kepzettsegszintek_kp_igenye.md',
        'table_pattern': 'kepzettsegkp',
        'sortkey': 'Képzettség Szint',
        'skip_columns': ['Fokozat']
       },
       {
        'id':'harcmodor_kepzettseg_bonuszok',
        'output':'harcmodor_kepzettseg_bonuszok.json',
        'file_pattern': 'harcmodor_kepzettsegek_es_bonuszaik.md',
        'table_pattern': 'harcmodor_kepzettseg_bonuszok',
        'sortkey': 'Harcmodor Szint',
        'skip_columns': []
       }
    ]

    for d in data:
        path_json = os.path.join(dir_data, d['output'])
        full_json = []
        for fname in os.listdir(dir_md):
            if (d['file_pattern']) in fname:
                path_md = os.path.join(dir_md, fname)
                mjc = MdToJsonConverter(path_md, None, d)
                full_json.extend(mjc.get_json_data())
        # Sort the list by sortkey
        full_json = order_list_of_dicts_by_key(full_json, d['sortkey'])
        path_json=os.path.join(dir_data, 'tables', d['output'])
        write_out_to_json(path_json, full_json)
