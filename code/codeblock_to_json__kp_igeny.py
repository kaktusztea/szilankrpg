#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
code/codeblock_to_json__kp_igeny.py

Reads the markdown file md/030_05_kepzettsegszintek_kp_igenye.md,
extracts the section between:
  <!-- tag: md_codeblock_kepzettsegkp_start -->
and
  <!-- tag: md_codeblock_kepzettsegkp_end -->

Parses the KP table inside that section and writes a JSON array to:
  data/tables/kepzettseg_kp.json
"""

from pathlib import Path
import re
import json
import sys

DEFAULT_INPUT = Path("md/030_05_kepzettsegszintek_kp_igenye.md")
DEFAULT_OUTPUT = Path("data/tables/kepzettseg_kp.json")

START_TAG = "<!-- tag: md_codeblock_kepzettsegkp_start -->"
END_TAG = "<!-- tag: md_codeblock_kepzettsegkp_end -->"

# Regex to extract the first fenced code block content (``` ... ```)
FENCED_BLOCK_RE = re.compile(r"```(?:[^\n]*)\n(.*?)\n```", re.S)

# Regex to parse lines like:
#  1.szint:   6 KP   (+6KP)
# 10.szint: 114 KP   (+20KP)
LINE_RE = re.compile(r"^\s*(\d+)\.szint:\s*([0-9]+)\s*KP\s*\((\+[0-9]+KP)\)", re.M)


def read_markdown(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Input markdown file not found: {path}")
    return path.read_text(encoding="utf-8")


def extract_section(md_text: str) -> str:
    """Return the raw content between START_TAG and END_TAG (exclusive),
    or raise ValueError if tags are not found."""
    start_idx = md_text.find(START_TAG)
    end_idx = md_text.find(END_TAG)
    if start_idx == -1 or end_idx == -1 or end_idx < start_idx:
        raise ValueError("Could not find KP table tags in the markdown file.")
    # content between the tags
    return md_text[start_idx + len(START_TAG):end_idx]


def extract_fenced_block(section_text: str) -> str:
    """If the section contains a fenced code block, return its inner content,
    otherwise return the whole trimmed section_text."""
    m = FENCED_BLOCK_RE.search(section_text)
    if m:
        return m.group(1)
    # fallback: return trimmed section
    return section_text.strip()


def parse_table(block_text: str):
    """Parse the block text into a list of dicts with the desired fields."""
    results = []
    for m in LINE_RE.finditer(block_text):
        level = m.group(1)
        kp = m.group(2)
        diff = m.group(3)
        results.append({
            "Képzettség Szint": level,
            "KP igény": kp,
            "Diff": diff
        })
    return results


def write_json(data, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=4), encoding="utf-8")


def main(argv):
    in_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_INPUT
    out_path = Path(argv[2]) if len(argv) > 2 else DEFAULT_OUTPUT

    try:
        md_text = read_markdown(in_path)
    except FileNotFoundError as e:
        print("ERROR:", e, file=sys.stderr)
        return 2

    try:
        section = extract_section(md_text)
    except ValueError as e:
        print("ERROR:", e, file=sys.stderr)
        return 3

    block = extract_fenced_block(section)
    parsed = parse_table(block)

    if not parsed:
        print("WARN: No KP lines parsed. The section was found but no matching lines were detected.", file=sys.stderr)

    write_json(parsed, out_path)
    print(f"Wrote {len(parsed)} entries to {out_path}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))