import json
import re

# tag: md_codeblock_kepzettsegkp_start
# tag: md_codeblock_kepzettsegkp_end

data = ""

pattern = re.compile(r"(\d+)\.szint:\s+(\d+)\s+KP\s+\((\+\d+KP)\)")

result = []
for line in data.strip().splitlines():
    match = pattern.search(line)
    if match:
        level, kp, diff = match.groups()
        result.append({
            "Képzettség Szint": level,
            "KP igény": kp,
            "Diff": diff
        })

print(json.dumps(result, indent=4, ensure_ascii=False))
