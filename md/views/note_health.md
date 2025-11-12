
### Orphan notes

```dataview
LIST FROM ""
WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0 
  AND file.name != "note_health" 
  AND !endswith(file.name, "_template")
```
