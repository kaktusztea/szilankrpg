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
        self.table_sections = []   # list of sections; each section is list of lines
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
        between self.tag_start and self.tag_end markers.

        Each collected section is stored as a list of cleaned, non-empty lines
        in self.table_sections. We do NOT merge tables at the raw-text level
        anymore; instead convert_md_to_json will parse each section separately
        and append its rows. This prevents column/shift corruption when
        headers differ or when tables are repeated in the same file.
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
                if current_section_lines:
                    # strip whitespace and drop fully empty lines
                    cleaned = [l.strip() for l in current_section_lines if l.strip() != ""]
                    if cleaned:
                        sections.append(cleaned)
                current_section_lines = []
                continue
            if is_between_markers:
                current_section_lines.append(line)

        # If file ended while still inside a section, append it as well
        if current_section_lines:
            cleaned = [l.strip() for l in current_section_lines if l.strip() != ""]
            if cleaned:
                sections.append(cleaned)

        self.table_sections = sections

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
        """
        Parse each table section independently. Each section is expected to be
        a Markdown table with header on the first line and separator on the
        second line (e.g. | Col1 | Col2 |).
        For each section:
          - extract header columns
          - for each data row (from line index 2 onward) split values
          - if a row has fewer values than header, pad with empty strings
          - if a row has more values than header, truncate extras
        This prevents misalignment across multiple table sections and preserves
        each table's header mapping.
        """
        for sec_idx, sec in enumerate(self.table_sections):
            if not sec:
                continue
            if len(sec) < 2:
                # Not a valid table (no header + separator); skip
                print(f"MdToJsonConverter.convert_md_to_json(): skipping section {sec_idx} (too few lines)")
                continue

            header_line = sec[0]
            # header_line format: | Col1 | Col2 | ...
            header = [t.strip() for t in header_line.split('|')[1:-1]]

            # iterate data rows (skip header and separator lines)
            for row_idx, row_line in enumerate(sec[2:], start=2):
                # skip empty rows
                if not row_line.strip():
                    continue
                values = [t.strip() for t in row_line.split('|')[1:-1]]

                # normalize length: pad with "" or truncate to match header length
                if len(values) < len(header):
                    values += [""] * (len(header) - len(values))
                elif len(values) > len(header):
                    values = values[:len(header)]

                data = {}
                for col, value in zip(header, values):
                    if col not in self.skip_columns:
                        if self.is_csv_string(value):
                            parts = [tp.strip() for tp in value.split(';')]
                            data[col] = dict()
                            # Split by ":" and store them as key:value entry
                            for pp in parts:
                                # protect against malformed pp without ":"
                                if ":" in pp:
                                    k = pp.split(":", 1)[0].strip()
                                    v = pp.split(":", 1)[1].strip()
                                    data[col][k] = v
                                else:
                                    # treat whole part as key with empty value
                                    data[col][pp] = ""
                        else:
                            data[col] = value
                # Only append non-empty dicts (or append empty if that's desired)
                self.list_dicts.append(data)

    def order_json_by_key(self):
        """"
        Order json by sortkey value
        """
        if self.sortkey:
            try:
                self.list_dicts = natsort.natsorted(self.list_dicts, key=lambda x: str(x.get(self.sortkey, "")).lower())
            except KeyError as e:
                print(f"MdToJsonConverter.sortkey(): 'sortkey' in dict is not present at '{self.id}'")
                sys.exit(1)

    def write_json(self, path_json=None):
        if not path_json:
            path_json = self.path_json
        with open(path_json, 'w', encoding="utf-8") as fj:
            json.dump(self.list_dicts, fj, ensure_ascii=False, indent=4)

    def get_json_data(self):
        return self.list_dicts