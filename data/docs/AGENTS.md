# Szilánk RPG — AI fejlesztői irányelvek

## Projekt

Magyar nyelvű asztali szerepjáték (RPG) webes karakteralkotó.
- **App**: React 19 + Vite 6 + TypeScript 5.8
- **Deploy**: GitHub Pages (`https://kaktusztea.github.io/szilankrpg/`)
- **Nyelv**: Magyar válaszok, kód kommentek angolul

## Build & Test

```bash
cd /mnt/c/repo/szilank.code/web/karakter
npm run build    # generate_tables.py + tsc + vite build
npm run dev      # localhost:5173
```

Build CSAK kód/yaml változáskor kell. Spec fájlok (engine_spec, gui_spec, DEVSTATE) módosításakor NEM.

## Munkafolyamat

1. Tervet SOHA ne hajtsd végre automatikusan — mutasd be, kérj jóváhagyást
2. Nem egyértelmű kérésnél kérdezz vissza
3. Backward compatibility: NEM szükséges (régi localStorage invalidálódhat)
4. Feature után ajánld fel DEVSTATE/spec szinkront (`szilank-devstate-sync` skill)

## Architektúra — 3 pillér

### 1. Reactive Engine
- `data/rules.json` (54 deklaratív szabály) + `engine/reactive.ts` (evaluate)
- Minden kalkuláció ide megy, ha a formula nyelv elég kifejező
- Maradék TS logika: Fájdalomtűrés, Kétkezes harc, Fortély módosítók, Taktika mods

### 2. Data Pipeline
- **YAML** (`data/sources/`) → **`generate_tables.py`** → **JSON** (`data/tables/`) → **fetchJson** (runtime)
- Vite plugin automatikusan futtatja `buildStart`-kor
- Nincs runtime YAML parse, nincs js-yaml dependency

### 3. React App
- Prop drilling (nincs context/store)
- State: App-szintű `karakter` objektum (schema v2, `engine/types.ts`)
- Hooks: `hooks/useKarakterState.ts` (localStorage, slot), `hooks/useOverlays.ts` (overlay state)

## Konvenciók

### Data layer elsőbbség
Konfigurálható értékek → data layer (YAML/JSON/rules.json), NE hardcoded:
- Konstansok, küszöbök → `konstansok.yaml`
- Fortély hatások → fortély yaml `módosítók`
- Kalkuláció → `rules.json`
- Hardcoded CSAK ha reactive engine nem elég (2D lookup, per-fegyver override)

### Strict schema
- Minden YAML source explicit tartalmaz minden sémamezőt (nincs implicit default)
- Új mező: schema + ÖSSZES source yaml frissítendő

### UI konvenciók
- CSS class (prefix: `he-`, `aktiv-`, `naplo-`, stb.) — NEM inline style
- Popup: `createPortal(document.body)`, Escape bezár, mellé-katt bezár
- Értékválasztó: kiválasztás = bezárás (nincs OK gomb)
- Dark theme, mobil-first, LF sorvégek
- Tab bar: tükrözött renderelés (reverse), swipe invertált

### Karakter adatmodell
- Schema v2 (`data/schemas/karakter.yaml`)
- `session` szekció = runtime harc state (NEM mentett állapot)
- Fortélyok: `{ név, fok, spec_típus, spec_elem, kiérdemelt? }` — név = alapnév
- Multi-slot localStorage: `szilank_char_{uid}`, max 10

### Feltétel rendszer
- String feltétel: `"prefix:érték"` → aktívFeltételek Set lookup
- Strukturált: `[{forrás, operátor, érték}]` → computed/session/ctx lookup
- Prefixek: `harci_helyzet:`, `taktika:`, `fegyver:`, `fegyver_kategória:`, `fegyverfogás:`

## Szabályrendszer (md/)
- Éles: `/mnt/c/repo/szilank.code/md/` — tartalomjegyzék: `szabalyrendszer.md`
- Wiki (fejlesztő portál): `/mnt/c/repo/szilank.wiki/` — félkész, NE keverd az élessel
- Link audit: anchor módosításkor `grep -r` a teljes md/ könyvtáron
- `.obsidian/` könyvtár: SOHA ne módosítsd

## Dokumentáció navigáció

| Feladattípus | Olvasd be |
|---|---|
| Engine kalkuláció | `engine_spec.md` releváns §-ja + `rules.json` |
| UI viselkedés | `gui_spec.md` releváns szekció |
| Data módosítás | `data/sources/*.yaml` + `generate_tables.py` |
| Séma változás | `data/schemas/*.yaml` + `engine/types.ts` |
| Komponens | `gui_spec.md` + `components/{screen}/` |
| Fortély/képzettség | `engine_spec.md §16/§25` + `data/sources/fortelyok/` |
| Új feature | Releváns `features/*.md` ha létezik |
