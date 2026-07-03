#!/usr/bin/env python3
"""
Validate testdata karakterek against:
1. karakter.yaml schema structure
2. fortelyok yaml definitions (spec_típus consistency)
3. Expected computed values (KP, ÉP, etc.)
"""
import json
import yaml
import sys
import os
from pathlib import Path

BASE = Path(__file__).parent.parent.parent / "data"
TABLES = BASE / "tables"

# --- Load shared data ---
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

# Build valid képzettség names including többszörös alnevek
valid_kep_names = set(kepzettseg_defs.keys())
# képzettségek with többszörös=['*'] accept any suffix after ": "
wildcard_kep_prefixes = set()
for kdef in kepzettseg_defs.values():
    többszörös = kdef.get("többszörös", [])
    if többszörös == ['*']:
        wildcard_kep_prefixes.add(kdef["név"])
    elif többszörös:
        for alnév in többszörös:
            valid_kep_names.add(alnév)

# Misztikus képzettségek (Tradíció, Faj misztérium, Arkánum) are stored with suffix
# but have empty többszörös — treat them as wildcard prefix match
for kdef in kepzettseg_defs.values():
    if kdef.get("csoport") == "misztikus":
        wildcard_kep_prefixes.add(kdef["név"])

# ============================================================
# Test karakter definitions
# ============================================================

TEST_KARAKTEREK = [
    {
        "fájl": "test_karakter2.json",
        "leírás": "von Agabor, 10. TSz, Dzsenn, komplex session",
        "expected": {
            "ÉP": 40,
            "összes_kp": 510,
            "összes_szekunder_kp": 200,
            "kp_képzettségek": 336,
            "kp_fortélyok": 192,
            "kp_hm": 174,
            "kp_cm": 6,
            "elköltött_kp": 714,
            "maradék_kp": -4,
        },
    },
    {
        "fájl": "test_karakter3.json",
        "leírás": "pak-Teth, 11. TSz, Amund, misztikus mágus",
        "expected": {
            "ÉP": 36,
            "összes_kp": 572,
            "összes_szekunder_kp": 253,
            "kp_képzettségek": 626,
            "kp_fortélyok": 156,
            "kp_hm": 18,
            "kp_cm": 30,
            "elköltött_kp": 830,
            "maradék_kp": -5,
        },
    },
]


def validate_karakter(karakter_path, leírás, expected):
    """Validate a single karakter. Returns (errors, warnings) lists."""
    errors = []
    warnings = []

    def err(msg):
        errors.append(f"❌ {msg}")

    def warn(msg):
        warnings.append(f"⚠️  {msg}")

    def ok(msg):
        print(f"  ✅ {msg}")

    with open(karakter_path, "r", encoding="utf-8") as f:
        karakter = json.load(f)

    print(f"\n{'=' * 60}")
    print(f"Karakter: {leírás}")
    print(f"Fájl: {karakter_path.name}")
    print(f"{'=' * 60}")

    # ============================================================
    # 1. Fortélyok: spec_típus konzisztencia
    # ============================================================
    print("\n--- 1. Fortélyok spec_típus validáció ---")

    for fo in karakter["fortélyok"]:
        ddef = fortelyok_defs.get(fo["név"])
        if not ddef:
            err(f"Fortély '{fo['név']}' nem található a definíciók között")
            continue

        yaml_spec = ddef.get("többszörös_típus", "")
        if fo["spec_típus"] != yaml_spec:
            err(f"Fortély '{fo['név']}': spec_típus mismatch: karakter='{fo['spec_típus']}', yaml='{yaml_spec}'")

        if yaml_spec and fo["spec_elem"]:
            yaml_lista = ddef.get("többszörös_lista", [])
            if yaml_lista and fo["spec_elem"] not in yaml_lista:
                err(f"Fortély '{fo['név']}' spec_elem='{fo['spec_elem']}' nincs a spec_listában: {yaml_lista[:5]}...")

        if not yaml_spec and fo["spec_elem"]:
            err(f"Fortély '{fo['név']}': nem többszörös, de spec_elem='{fo['spec_elem']}' nem üres")

        if fo["fok"] > ddef["maxfok"]:
            err(f"Fortély '{fo['név']}': fok={fo['fok']} > maxfok={ddef['maxfok']}")

    if not any("spec_típus" in e for e in errors):
        ok("Minden fortély spec_típus konzisztens a yaml definícióval")

    # ============================================================
    # 2. Képzettségek: létezés ellenőrzés
    # ============================================================
    print("\n--- 2. Képzettségek validáció ---")

    for k in karakter["képzettségek"]:
        kep_név = k["név"]
        if kep_név not in valid_kep_names:
            # Check wildcard prefix match (e.g. "Tradíció: Vulgármágia" → "Tradíció")
            base_név = kep_név.split(":")[0].strip() if ":" in kep_név else None
            if not (base_név and base_név in wildcard_kep_prefixes):
                err(f"Képzettség '{kep_név}' nem található a definíciók között")
        if k["szint"] > 15:
            err(f"Képzettség '{kep_név}': szint={k['szint']} > 15")

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

    # kp_fortélyok
    kp_fort = 0
    szabad_count = 0
    szabad_ingyenes_db = tsz
    for fo in karakter["fortélyok"]:
        ddef = fortelyok_defs.get(fo["név"])
        if not ddef:
            continue
        perfok = ddef.get("kp_perfok", 6)
        ingyenes_perszint = ddef.get("ingyenes_perszint", 0)
        if ingyenes_perszint > 0:
            perfok = 0
        if ddef.get("csoport") == "szabad" and not fo.get("kiérdemelt") and perfok > 0:
            if szabad_count < szabad_ingyenes_db:
                szabad_count += 1
                perfok = 0
        if perfok > 0:
            kp_fort += fo["fok"] * perfok

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

    # kiemelt_kp
    kiemelt_kp = 0
    for ddef in fortelyok_defs.values():
        ips = ddef.get("ingyenes_perszint", 0)
        if ips <= 0:
            continue
        ingyenes_db = (tsz + 1) // ips
        felvett_db = sum(1 for fo in karakter["fortélyok"] if fo["név"] == ddef["név"])
        fizetos_db = max(0, felvett_db - ingyenes_db)
        kiemelt_kp += fizetos_db * ddef.get("kp_perfok", 6)

    elköltött_kp = kp_kepz + kp_fort + kp_hm + kp_cm + kiemelt_kp
    if elköltött_kp != expected["elköltött_kp"]:
        err(f"elköltött_kp: számolt={elköltött_kp} (kiemelt_kp={kiemelt_kp}), elvárt={expected['elköltött_kp']}")
    else:
        ok(f"elköltött_kp = {elköltött_kp} (kiemelt_kp={kiemelt_kp})")

    # maradék_kp
    maradék_kp = összes_kp + összes_szekunder_kp - elköltött_kp
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
                             "aktív_manőver", "aktív_státuszok",
                             "narratív_módosítók", "harci_akrobatika", "fegyverfogás",
                             "aktív_távfegyver_index"]
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

    required_top = ["schema_version", "név", "becenév", "játékos", "mentés_dátum", "tsz", "leírás", "kor", "anyanyelv", "vallás",
                    "tulajdonságok", "HM_TÉ", "HM_VÉ", "CM",
                    "képzettségek", "fortélyok", "fortélyok_speciális",
                    "hátterek", "fegyverek", "távfegyverek", "páncél", "pajzs", "felszerelés", "jegyzetek", "napló", "session"]
    for k in required_top:
        if k not in karakter:
            err(f"Top-level mező hiányzik: '{k}'")

    forbidden = ["származtatott", "ÉP", "KÉ", "TÉ", "VÉ", "SFÉ", "MGT"]
    for k in forbidden:
        if k in karakter:
            err(f"Tiltott származtatott mező jelen van: '{k}'")

    if not any("struktúra" in e.lower() or "mező hiányzik" in e for e in errors):
        ok("Schema struktúra helyes (v2)")

    return errors, warnings


# ============================================================
# Main
# ============================================================

print("=" * 60)
print("SZILÁNK RPG — Karakter adatkonzisztencia validáció")
print("=" * 60)

all_errors = []
all_warnings = []

for cfg in TEST_KARAKTEREK:
    karakter_path = BASE / "karakter" / cfg["fájl"]
    if not karakter_path.exists():
        print(f"\n⚠️  Fájl nem található: {karakter_path}")
        all_errors.append(f"❌ Fájl nem található: {cfg['fájl']}")
        continue
    errs, warns = validate_karakter(karakter_path, cfg["leírás"], cfg["expected"])
    all_errors.extend(errs)
    all_warnings.extend(warns)

# ============================================================
# Output
# ============================================================
print(f"\n{'=' * 60}")
print(f"ÖSSZESÍTÉS ({len(TEST_KARAKTEREK)} karakter)")
print(f"{'=' * 60}")

if all_errors:
    print(f"\nHIBÁK ({len(all_errors)}):")
    for e in all_errors:
        print(f"  {e}")

if all_warnings:
    print(f"\nFigyelmeztetések ({len(all_warnings)}):")
    for w in all_warnings:
        print(f"  {w}")

if not all_errors:
    print(f"\n✅ MINDEN VALIDÁCIÓ SIKERES — {len(TEST_KARAKTEREK)} karakter, 0 hiba")
    sys.exit(0)
else:
    print(f"\n❌ {len(all_errors)} hiba található")
    sys.exit(1)
