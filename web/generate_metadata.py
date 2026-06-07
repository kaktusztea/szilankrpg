#!/usr/bin/env python3
"""Generate metadata.json with app name and version (YY.DAYOFYEAR.DAILYBUILD)."""
import json
import os
from datetime import datetime
from pathlib import Path

out_dir = Path(__file__).parent / "public"
out_dir.mkdir(exist_ok=True)
out_path = out_dir / "metadata.json"

now = datetime.now()
year = now.year % 100
day_of_year = now.timetuple().tm_yday

# Daily build counter: count existing builds today (file mtime) or start at 1
build_counter_file = Path(__file__).parent / ".build_counter"
counter = 1
if build_counter_file.exists():
    try:
        data = json.loads(build_counter_file.read_text())
        if data.get("date") == now.strftime("%Y-%m-%d"):
            counter = data.get("count", 0) + 1
    except (json.JSONDecodeError, KeyError):
        pass

build_counter_file.write_text(json.dumps({"date": now.strftime("%Y-%m-%d"), "count": counter}))

version = f"{year}.{day_of_year}.{counter}"

metadata = {
    "app": "Szilánk RPG",
    "version": version,
}

out_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
print(f"[metadata] {version}")
