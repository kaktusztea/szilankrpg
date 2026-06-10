#!/usr/bin/env python3
"""
Validate testdata karakter against:
1. karakter.yaml schema structure
2. fortelyok yaml definitions (spec_típus consistency)
3. Expected computed values (KP, ÉP, etc.)
4. Generate test JSON output
"""
import json
import yaml
import sys
import os
from pathlib import Path

BASE = Path(__file__).parent.parent / "data"
TABLES = BASE / "tables"

errors = []
warnings = []

def err(msg):
    errors.append(f"❌ {msg}")

def warn(msg):
    warnings.append(f"⚠️  {msg}")

def ok(msg):
    print(f"  ✅ {msg}")

# --- Load data ---
with open(TABLES / "fortelyok.json") as f:
    fortelyok_defs = {d["név"]: d for d in json.load(f)}

with open(TABLES / "konstansok.json") as f:
    konstansok = json.load(f)

with open(TABLES / "kepzettseg_kp.json") as f:
    kp_table_raw = json.load(f)
    kp_table = {int(e["Képzettség Szint"]): int(e["KP igény"]) for e in kp_table_raw}

with open(TABLES / "kepzettsegek.json") as f:
    kepzettseg_defs = {d["név"]: d for d in json.load(f)}

with open(TABLES / "fajok.json") as f:
    faj_nevek = json.load(f)

with open(TABLES / "faj_tulajdonsag_keretek.json") as f:
    faj_keretek = json.load(f)

# --- Define test karakter (matching testdata.ts) ---
karakter = {
    "schema_version": 2,
    "név": "von Agabor",
    "játékos": "",
    "mentés_dátum": "",
    "tsz": 8,
    "leírás": "Toroni zsoldos lovag",
    "kor": 32,
    "vallás": "",
    "tulajdonságok": {
        "erő": 3, "edzettség": 3, "ügyesség": 3, "gyorsaság": 3,
        "intelligencia": 1, "emlékezet": 0, "önuralom": 2, "érzékenység": 0,
    },
    "HM_TÉ": 15,
    "HM_VÉ": 17,
    "CM": 0,
    "képzettségek": [
        {"név": "Közelharc", "szint": 6},
        {"név": "Kardvívás", "szint": 8},
        {"név": "Rombolás", "szint": 4},
        {"név": "Akrobatika", "szint": 3},
        {"név": "Fájdalomtűrés", "szint": 5},
        {"név": "Észlelés", "szint": 6},
        {"név": "Nyelvtanulás", "szint": 6},
        {"név": "Lovaglás", "szint": 4},
        {"név": "Mászás", "szint": 5},
        {"név": "Kvantikum", "szint": 5},
        {"név": "Előadóművészet", "szint": 5},
        {"név": "Etikett", "szint": 5},
        {"név": "Értékbecslés", "szint": 3},
        {"név": "Művészetismeret", "szint": 5},
        {"név": "Városi jártasság", "szint": 6},
        {"név": "Természetjárás", "szint": 5},
    ],
    "fortélyok": [
        {"név": "Merevvértviselet", "fok": 3, "spec_típus": "", "spec_elem": ""},
        {"név": "Harcos elme", "fok": 2, "spec_típus": "", "spec_elem": ""},
        {"név": "Gyors kezdeményezés", "fok": 2, "spec_típus": "", "spec_elem": ""},
        {"név": "Pajzshasználat", "fok": 2, "spec_típus": "", "spec_elem": ""},
        {"név": "Harckeret növelés", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Elpusztíthatatlan", "fok": 2, "spec_típus": "", "spec_elem": ""},
        {"név": "Kaszabolás", "fok": 2, "spec_típus": "", "spec_elem": ""},
        {"név": "Támadás erőből", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Fárasztás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Mesterfegyver", "fok": 3, "spec_típus": "fegyver", "spec_elem": "kard, lovag"},
        {"név": "Építészet", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Futás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Szájról olvasás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Éber alvó", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Kocsihajtás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Keresés/rejtés", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Kultúrkör", "fok": 1, "spec_típus": "kultúrkör", "spec_elem": "dw00n"},
        {"név": "Kultúrkör", "fok": 1, "spec_típus": "kultúrkör", "spec_elem": "erv"},
        {"név": "Kultúrkör", "fok": 1, "spec_típus": "kultúrkör", "spec_elem": "py4r"},
        {"név": "Kultúrkör", "fok": 1, "spec_típus": "kultúrkör", "spec_elem": "dzs4d"},
        {"név": "Helyismeret", "fok": 1, "spec_típus": "település", "spec_elem": "Erion"},
        {"név": "Helyismeret", "fok": 1, "spec_típus": "település", "spec_elem": "Pyarron"},
        {"név": "Helyismeret", "fok": 1, "spec_típus": "település", "spec_elem": "Haonwell"},
        {"név": "Helyismeret", "fok": 1, "spec_típus": "település", "spec_elem": "Shulur"},
        {"név": "Gazdálkodás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Kézműves: Lakatos", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Kihallgatás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Színjátszás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Éneklés", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Bűvészet", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Alkudozás", "fok": 1, "spec_típus": "", "spec_elem": ""},
        {"név": "Térképészet", "fok": 1, "spec_típus": "", "spec_elem": ""},
    ],
    "fortélyok_speciális": {
        "analfabéta": False, "apró_méretű_lény": False,
        "tartós_sérülés_fok": 0, "vakság": False, "süketség": False,
    },
    "hátterek": {"faj": "Ember (Északi)", "leíró": [], "karma": []},
    "fegyverek": [
        {"alap": "kard, lovag", "név": "", "anyag": "acél", "idea": 0, "mesterfegyver_fok": 2},
        {"alap": "tőr", "név": "", "anyag": "acél", "idea": 0, "mesterfegyver_fok": 1},
    ],
    "páncél": {
        "alap": "bőr", "név": "", "fémalapanyag": "", "idea": 0,
        "kidolgozottság": "átlagos", "sisak": False, "végtagvédettség": 0,
        "méret_illeszkedés": "passzol", "rongálódás": 0,
    },
    "pajzs": {
        "méret": "közepes", "pajzshasználat_fok": 2,
    },
    "felszerelés": {"nagy_tárgyak": []},
    "jegyzetek": "",
    "napló": [],
    "session": {
        "szilánk": 1,
        "vé_csökkenés": 0, "vé_history": [], "manőver_pont_használt": 0,
        "sebzések": [], "aktív_fegyver_index": 0, "aktív_pajzs": False,
        "aktív_páncél": True, "aktív_taktika": "", "aktív_helyzet": "",
        "aktív_manőver": "", "aktív_státuszok": [],
    },
}

# Expected values
expected = {
    "ÉP": 40,
    "összes_kp": 408,
    "összes_szekunder_kp": 160,
    "kp_képzettségek": 224,
    "kp_fortélyok": 150,
    "kp_hm": 192,
    "kp_cm": 0,
    "elköltött_kp": 566,
    "maradék_kp": 2,
}

print("=" * 60)
print("SZILÁNK RPG — Karakter adatkonzisztencia validáció")
print("=" * 60)

# ============================================================
# 1. Fortélyok: spec_típus konzisztencia a yaml definíciókkal
# ============================================================
print("\n--- 1. Fortélyok spec_típus validáció ---")

for f in karakter["fortélyok"]:
    ddef = fortelyok_defs.get(f["név"])
    if not ddef:
        err(f"Fortély '{f['név']}' nem található a definíciók között")
        continue

    # spec_típus egyezés
    yaml_spec = ddef.get("többszörös_típus", "")
    if f["spec_típus"] != yaml_spec:
        err(f"Fortély '{f['név']}': spec_típus mismatch: karakter='{f['spec_típus']}', yaml='{yaml_spec}'")

    # Ha többszörös és van fix lista, ellenőrizzük hogy spec_elem benne van
    if yaml_spec and f["spec_elem"]:
        yaml_lista = ddef.get("többszörös_lista", [])
        if yaml_lista and f["spec_elem"] not in yaml_lista:
            err(f"Fortély '{f['név']}' spec_elem='{f['spec_elem']}' nincs a spec_listában: {yaml_lista[:5]}...")

    # Ha NEM többszörös, spec_elem üres kell legyen
    if not yaml_spec and f["spec_elem"]:
        err(f"Fortély '{f['név']}': nem többszörös, de spec_elem='{f['spec_elem']}' nem üres")

    # fok max ellenőrzés
    if f["fok"] > ddef["maxfok"]:
        err(f"Fortély '{f['név']}': fok={f['fok']} > maxfok={ddef['maxfok']}")

if not any("spec_típus" in e for e in errors):
    ok("Minden fortély spec_típus konzisztens a yaml definícióval")

# ============================================================
# 2. Képzettségek: létezés ellenőrzés
# ============================================================
print("\n--- 2. Képzettségek validáció ---")

# Build valid képzettség names including többszörös alnevek
valid_kep_names = set(kepzettseg_defs.keys())
for kdef in kepzettseg_defs.values():
    többszörös = kdef.get("többszörös", [])
    if többszörös:
        for alnév in többszörös:
            valid_kep_names.add(alnév)

for k in karakter["képzettségek"]:
    if k["név"] not in valid_kep_names:
        err(f"Képzettség '{k['név']}' nem található a definíciók között")
    elif k["szint"] > 15:
        err(f"Képzettség '{k['név']}': szint={k['szint']} > 15")

if not any("Képzettség" in e for e in errors):
    ok("Minden képzettség létezik és szintje valid")

# ============================================================
# 3. Faj validáció
# ============================================================
print("\n--- 3. Faj validáció ---")

faj = karakter["hátterek"]["faj"]
if faj not in faj_nevek:
    err(f"Faj '{faj}' nem található a fajok listájában")
else:
    ok(f"Faj '{faj}' létezik")
    # Tulajdonság keretek
    if faj in faj_keretek:
        for tul, val in karakter["tulajdonságok"].items():
            keret = faj_keretek[faj].get(tul)
            if keret:
                if val < keret[0] or val > keret[1]:
                    warn(f"Tulajdonság '{tul}'={val} kívül esik a faj keretén [{keret[0]}, {keret[1]}]")

# ============================================================
# 4. KP számítás validáció
# ============================================================
print("\n--- 4. KP számítás validáció ---")

tsz = karakter["tsz"]
tul = karakter["tulajdonságok"]
kp_config = konstansok["kp"]

# összes_kp
összes_kp = tsz * (kp_config["perszint"] + tul["intelligencia"])
if összes_kp != expected["összes_kp"]:
    err(f"összes_kp: számolt={összes_kp}, elvárt={expected['összes_kp']}")
else:
    ok(f"összes_kp = {összes_kp}")

# összes_szekunder_kp
összes_szekunder_kp = tsz * (kp_config["szekunder_perszint"] + tul["emlékezet"])
if összes_szekunder_kp != expected["összes_szekunder_kp"]:
    err(f"összes_szekunder_kp: számolt={összes_szekunder_kp}, elvárt={expected['összes_szekunder_kp']}")
else:
    ok(f"összes_szekunder_kp = {összes_szekunder_kp}")

# kp_képzettségek
kp_kepz = sum(kp_table.get(k["szint"], 0) for k in karakter["képzettségek"])
if kp_kepz != expected["kp_képzettségek"]:
    err(f"kp_képzettségek: számolt={kp_kepz}, elvárt={expected['kp_képzettségek']}")
else:
    ok(f"kp_képzettségek = {kp_kepz}")

# kp_fortélyok (only fortélyok with kp_perfok > 0)
kp_fort = 0
szabad_count = 0
szabad_ingyenes_db = karakter["tsz"]
for f in karakter["fortélyok"]:
    ddef = fortelyok_defs.get(f["név"])
    if not ddef:
        continue
    perfok = ddef.get("kp_perfok", 6)
    # Ingyenes keret: ha ingyenes_perszint > 0, az első N db ingyenes
    ingyenes_perszint = ddef.get("ingyenes_perszint", 0)
    if ingyenes_perszint > 0:
        # Skip — kiemelt kp logika külön (0 KP a base)
        perfok = 0
    # Szabad fortélyok: csoport-szintű ingyenes keret (TSz db)
    if ddef.get("csoport") == "szabad" and not f.get("kiérdemelt") and perfok > 0:
        if szabad_count < szabad_ingyenes_db:
            szabad_count += 1
            perfok = 0
    if perfok > 0:
        kp_fort += f["fok"] * perfok

if kp_fort != expected["kp_fortélyok"]:
    err(f"kp_fortélyok: számolt={kp_fort}, elvárt={expected['kp_fortélyok']}")
else:
    ok(f"kp_fortélyok = {kp_fort}")

# kp_hm
kp_hm = (karakter["HM_TÉ"] + karakter["HM_VÉ"]) * kp_config["hm"]
if kp_hm != expected["kp_hm"]:
    err(f"kp_hm: számolt={kp_hm}, elvárt={expected['kp_hm']}")
else:
    ok(f"kp_hm = {kp_hm}")

# kp_cm
kp_cm = karakter["CM"] * kp_config["cm"]
if kp_cm != expected["kp_cm"]:
    err(f"kp_cm: számolt={kp_cm}, elvárt={expected['kp_cm']}")
else:
    ok(f"kp_cm = {kp_cm}")

# elköltött_kp (kiemelt_kp = 0 mert ingyenes keret fedi a többszörös kiemelteket)
kiemelt_kp = 0
# Kultúrkör: ingyenes_perszint=2, floor((8+1)/2)=4 db ingyenes, 4 felvéve → 0 fizetős
# Helyismeret: ingyenes_perszint=2, floor((8+1)/2)=4 db ingyenes, 4 felvéve → 0 fizetős
for ddef in fortelyok_defs.values():
    ips = ddef.get("ingyenes_perszint", 0)
    if ips <= 0:
        continue
    ingyenes_db = (tsz + 1) // ips
    felvett_db = sum(1 for f in karakter["fortélyok"] if f["név"] == ddef["név"])
    fizetos_db = max(0, felvett_db - ingyenes_db)
    kiemelt_kp += fizetos_db * ddef.get("kp_perfok", 6)

elköltött_kp = kp_kepz + kp_fort + kp_hm + kp_cm + kiemelt_kp
if elköltött_kp != expected["elköltött_kp"]:
    err(f"elköltött_kp: számolt={elköltött_kp} (kiemelt_kp={kiemelt_kp}), elvárt={expected['elköltött_kp']}")
else:
    ok(f"elköltött_kp = {elköltött_kp} (kiemelt_kp={kiemelt_kp})")

# maradék_kp
spec_kp = 0  # nincs speciális KP bónusz
maradék_kp = összes_kp + spec_kp + összes_szekunder_kp - elköltött_kp
if maradék_kp != expected["maradék_kp"]:
    err(f"maradék_kp: számolt={maradék_kp}, elvárt={expected['maradék_kp']}")
else:
    ok(f"maradék_kp = {maradék_kp}")

# ÉP
ép = 28 + tul["edzettség"] * 4
if ép != expected["ÉP"]:
    err(f"ÉP: számolt={ép}, elvárt={expected['ÉP']}")
else:
    ok(f"ÉP = {ép}")

# ============================================================
# 5. Session szekció validáció
# ============================================================
print("\n--- 5. Session validáció ---")

session = karakter["session"]
required_session_keys = ["szilánk", "vé_csökkenés", "vé_history", "manőver_pont_használt",
                         "sebzések", "aktív_fegyver_index", "aktív_pajzs",
                         "aktív_páncél", "aktív_taktika", "aktív_helyzet",
                         "aktív_manőver", "aktív_státuszok"]
for k in required_session_keys:
    if k not in session:
        err(f"Session mező hiányzik: '{k}'")
if not any("Session" in e for e in errors):
    ok("Minden session mező megvan")

# ============================================================
# 6. Schema struktúra validáció
# ============================================================
print("\n--- 6. Schema struktúra validáció ---")

required_top = ["schema_version", "név", "játékos", "mentés_dátum", "tsz", "tulajdonságok", "HM_TÉ", "HM_VÉ", "CM",
                "képzettségek", "fortélyok", "fortélyok_speciális",
                "hátterek", "fegyverek", "páncél", "felszerelés", "napló", "session"]
for k in required_top:
    if k not in karakter:
        err(f"Top-level mező hiányzik: '{k}'")

# NEM szabad származtatott/számított érték
forbidden = ["származtatott", "ÉP", "KÉ", "TÉ", "VÉ", "SFÉ", "MGT"]
for k in forbidden:
    if k in karakter:
        err(f"Tiltott származtatott mező jelen van: '{k}'")

if not any("struktúra" in e.lower() or "mező hiányzik" in e for e in errors):
    ok("Schema struktúra helyes (v2)")

# ============================================================
# Output
# ============================================================
print("\n" + "=" * 60)

# Generate test JSON
output_path = BASE / "karakter" / "test_karakter.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(karakter, f, ensure_ascii=False, indent=2)
print(f"\n📄 Teszt JSON generálva: {output_path}")

if errors:
    print(f"\n{'=' * 60}")
    print(f"HIBÁK ({len(errors)}):")
    for e in errors:
        print(f"  {e}")

if warnings:
    print(f"\nFigyelmeztetések ({len(warnings)}):")
    for w in warnings:
        print(f"  {w}")

if not errors:
    print(f"\n✅ MINDEN VALIDÁCIÓ SIKERES — nincs hiba")
    sys.exit(0)
else:
    print(f"\n❌ {len(errors)} hiba található")
    sys.exit(1)
