#!/bin/bash
find md -name "*.md" -type f -exec bash -c '
  for file; do
    sed -E '\''s/[[:space:]]+$//'\'' "$file" | sponge "$file"
  done
' bash {} +

