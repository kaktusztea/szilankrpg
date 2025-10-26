#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simplified processor for the KP table in the markdown file.

- Finds the section between START_TAG and END_TAG.
- If a fenced code block exists (```), uses its inner content; otherwise uses the whole section.
- Parses lines like: "1.szint:   6 KP   (+6KP)" and emits JSON to the output file.

Usage:
    python code/process_kp_igeny2.py [input_md] [output_json]
"""
from pathlib import Path
import re
import json
import sys

DEFAULT_INPUT = Path("md/030_05_kepzettsegszintek_kp_igenye.md")
DEFAULT_OUTPUT = Path("data/tables/kepzettseg_kp.json")

START_TAG = "<!-- tag: md_codeblock_kepzettsegkp_start -->"
END_TAG = "<!-- tag: md_codeblock_kepzettsegkp_end -->"

LINE_RE = re.compile(r"^\s*(\d+)\.szint:\s*(\d+)\s*KP\s*\(\s*(\+?\d+KP)\s*\)", re.I)

def main(argv):
    in_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_INPUT
    out_path = Path(argv[2]) if len(argv) > 2 else DEFAULT_OUTPUT

    if not in_path.exists():
        print(f"ERROR: Input markdown file not found: {in_path}", file=sys.stderr)
        return 2

    text = in_path.read_text(encoding="utf-8")

    start = text.find(START_TAG)
    end = text.find(END_TAG)
    if start == -1 or end == -1 or end < start:
        print("ERROR: Could not find KP table tags in the markdown file.", file=sys.stderr)
        return 3

    section = text[start + len(START_TAG):end].strip()

    # If there's a fenced block, the content between the first pair of ``` is the block
    parts = section.split("```")
    if len(parts) >= 3:
        block = parts[1]
    else:
        block = section

    entries = []
    for line in block.splitlines():
        m = LINE_RE.match(line)
        if not m:
            continue
        level, kp, diff = m.group(1), m.group(2), m.group(3)
        entries.append({
            "Képzettség Szint": level,
            "KP igény": kp,
            "Diff": diff
        })

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(entries, ensure_ascii=False, indent=4), encoding="utf-8")

    if not entries:
        print("WARN: No KP lines parsed. Section found but no matching lines.", file=sys.stderr)
    print(f"Wrote {len(entries)} entries to {out_path}")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))

