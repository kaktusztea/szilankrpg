#!/usr/bin/env python3
"""
Simple extractor for the harcmodor képzettség bónuszok table.

It finds the text between these markers in the markdown file:
  <!-- tag: md_codeblock_harcmodor_kepzettseg_bonuszok_start -->
  <!-- tag: md_codeblock_harcmodor_kepzettseg_bonuszok_end -->

Parses lines like:
  0. szint:  TÉ/VÉ/CÉ:-9

and writes a JSON array to:
  data/tables/harcmodor_kepzettseg_bonuszok.json

Usage:
  ./tools/extract_harcmodor_bonuszok.py
  ./tools/extract_harcmodor_bonuszok.py path/to/input.md path/to/output.json
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

START = "<!-- tag: md_codeblock_harcmodor_kepzettseg_bonuszok_start -->"
END = "<!-- tag: md_codeblock_harcmodor_kepzettseg_bonuszok_end -->"

DEFAULT_IN = Path("md/062_02_harcmodor_kepzettsegek_es_bonuszaik.md")
DEFAULT_OUT = Path("data/tables/harcmodor_kepzettseg_bonuszok.json")

# permissive pattern: capture level (digits) and last integer in the line (with optional +/-)
LINE_RE = re.compile(r"(?P<level>\d+).*?(?P<value>[+-]?\d+)\s*$")

def main(argv: list[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    in_path = Path(argv[0]) if len(argv) >= 1 else DEFAULT_IN
    out_path = Path(argv[1]) if len(argv) >= 2 else DEFAULT_OUT

    if not in_path.exists():
        print(f"Input file not found: {in_path}", file=sys.stderr)
        return 2

    text = in_path.read_text(encoding="utf-8")

    try:
        start = text.index(START) + len(START)
        end = text.index(END, start)
    except ValueError:
        print("Start or end tag not found.", file=sys.stderr)
        return 3

    block = text[start:end].strip()

    # remove surrounding triple-backtick fence if present
    if block.startswith("```"):
        parts = block.splitlines()
        # drop first fence and, if present, last fence
        if parts and parts[-1].strip().startswith("```"):
            parts = parts[1:-1]
        else:
            parts = parts[1:]
        block = "\n".join(parts).strip()

    rows = []
    for line in block.splitlines():
        line = line.strip()
        if not line:
            continue
        m = LINE_RE.search(line)
        if not m:
            # skip unrecognized lines
            continue
        level = m.group("level")
        value = m.group("value")
        rows.append({
            "Harcmodor Szint": level,
            "TÉ": value,
            "VÉ": value,
            "CÉ": value
        })

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(rows, ensure_ascii=False, indent=4), encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {out_path}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())