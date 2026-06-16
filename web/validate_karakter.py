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
karakter_path = BASE / "karakter" / "test_karakter.json"
with open(karakter_path, "r", encoding="utf-8") as f:
    karakter = json.load(f)

# Expected values
expected = {
    "ÉP": 40,
    "összes_kp": 408,
    "összes_szekunder_kp": 160,
    "kp_képzettségek": 235,
    "kp_fortélyok": 150,
    "kp_hm": 180,
    "kp_cm": 0,
    "elköltött_kp": 565,
    "maradék_kp": 3,
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
                         "sebzések", "aktív_fegyver_index", "aktív_fegyver_bal_index",
                         "kétkezes_harc", "aktív_pajzs",
                         "aktív_páncél", "aktív_taktikák", "aktív_helyzetek",
                         "aktív_szituációk", "aktív_manőver", "aktív_státuszok",
                         "narratív_módosítók", "harci_akrobatika", "fegyverfogás"]
for k in required_session_keys:
    if k not in session:
        err(f"Session mező hiányzik: '{k}'")
if not any("Session" in e for e in errors):
    ok("Minden session mező megvan")
valid_fegyverfogas = ["egyfegyveres", "fegyver_pajzs", "fegyver_hárító", "kétkezes"]
if session.get("fegyverfogás") not in valid_fegyverfogas:
    err(f"Session fegyverfogás érvénytelen: '{session.get('fegyverfogás')}' (megengedett: {valid_fegyverfogas})")

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
