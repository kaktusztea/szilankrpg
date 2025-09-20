#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import sys
import json
import natsort

class MdToJsonConverter:

    def __init__(self, path_md, path_json, params):
        self.path_md = path_md
        self.path_json = path_json

        if not isinstance(params, dict):
            print("Error in MdToJsonConverter.init(): params is not dict")
            sys.exit(1)

        self.md = None
        self.list_dicts = []
        self.id = params['id']
        self.filepattern = params['file_pattern']
        self.table_pattern = params['table_pattern']
        self.sortkey = params['sortkey']

        self.tag_start = f"<!-- tag: md_table_{self.table_pattern}_start -->"
        self.tag_end = f"<!-- tag: md_table_{self.table_pattern}_end -->"
        self.filter_out_chars = ['**', '`', '⭕TODO⭕', '⭕']
        self.skip_columns = params['skip_columns']

        # execute processing
        self.read_md()
        self.filter_raw_md()
        self.get_table_sections_from_raw_md()
        self.convert_md_to_json()
        self.order_json_by_key()

    def read_md(self):
        with open(self.path_md, 'r') as fh:
            self.md = fh.read()

    def filter_raw_md(self):
        """
        Filter unnecessary strings from raw markdown data
        """
        for ch in self.filter_out_chars:
            self.md = self.md.replace(ch, '')

        for ch in ['<br />- ', '<br>- ']:
            self.md = self.md.replace(ch, ' ')

        for ch in ['<br /><br />', '<br />', '<br>']:
            self.md = self.md.replace(ch, ' ')

    def get_table_sections_from_raw_md(self):
        """
        Extract one or more markdown table sections from raw markdown data
        between self.tag_start and self.tag_end markers. If multiple table
        sections are found, keep the header from the first section and append
        only data rows from subsequent sections (skipping their header and
        separator lines) so the converter can treat them as one continuous table.
        """
        sections = []
        current_section_lines = []
        is_between_markers = False

        for line in self.md.split("\n"):
            if self.tag_start in line:
                is_between_markers = True
                current_section_lines = []
                continue
            if self.tag_end in line:
                is_between_markers = False
                # store the collected section (strip empty lines)
                if current_section_lines:
                    sections.append([l.strip() for l in current_section_lines if l.strip() != ""])
                current_section_lines = []
                continue
            if is_between_markers:
                current_section_lines.append(line)

        # If file ended while still inside a section, append it as well
        if current_section_lines:
            sections.append([l.strip() for l in current_section_lines if l.strip() != ""])

        # Build the combined markdown: keep the first section's header+separator,
        # and for subsequent sections append only data rows (skip first two lines).
        extracted_lines = []
        for idx, sec in enumerate(sections):
            if not sec:
                continue
            if idx == 0:
                extracted_lines.extend(sec)
            else:
                # Skip header and separator lines of subsequent sections if present
                if len(sec) > 2:
                    extracted_lines.extend(sec[2:])
                else:
                    # If section doesn't have expected header+separator, try to add whatever lines exist
                    extracted_lines.extend(sec)

        self.md = "\n".join(extracted_lines)

    def is_csv_string(self, vstr):
        """
        If data segments splitted by ";" equal the number
        of key:value counts.
        """
        parts_sc = vstr.split(';')
        if len(parts_sc) > 1 and (len(parts_sc) == vstr.count(":")):
            return True
        else:
            return False

    def convert_md_to_json(self):
        for n, line in enumerate(self.md[1:-1].split('\n')):
            data = {}
            if n == 0:
                header = [t.strip() for t in line.split('|')[1:-1]]
            if n > 1:
                values = [t.strip() for t in line.split('|')[1:-1]]
                for col, value in zip(header, values):
                    if col not in self.skip_columns:
                        if self.is_csv_string(value):
                            parts = [ tp.strip() for tp in value.split(';') ]
                            data[col] = dict()
                            # Split by ":" and store them as key:value entry
                            for pp in parts:
                                k = pp.split(":")[0].strip()
                                v = pp.split(":")[1].strip()
                                data[col][k] = v
                        else:
                            data[col] = value
                self.list_dicts.append(data)
            n += 1

    def order_json_by_key(self):
        """"
        Order json by sortkey value
        """
        if self.sortkey:
            # Detect entries missing the sortkey
            missing_count = sum(1 for d in self.list_dicts if self.sortkey not in d)
            if missing_count:
                print(f"MdToJsonConverter.sortkey(): 'sortkey' in dict is not present at '{self.id}' for {missing_count} entr{'y' if missing_count==1 else 'ies'}; those will be treated as empty string for sorting.")
            try:
                # Use get() and str() to avoid KeyError and ensure .lower() works
                self.list_dicts = natsort.natsorted(self.list_dicts, key=lambda x: str(x.get(self.sortkey, "")).lower())
            except Exception as e:
                print(f"MdToJsonConverter.sortkey(): error sorting by 'sortkey' at '{self.id}': {e}")
                # Leave list unsorted if sorting fails

    def write_json(self, path_json=None):
        if not path_json:
            path_json = self.path_json
        with open(path_json, 'w', encoding="utf-8") as fj:
            json.dump(self.list_dicts, fj, ensure_ascii=False, indent=4)

    def get_json_data(self):
        return self.list_dicts