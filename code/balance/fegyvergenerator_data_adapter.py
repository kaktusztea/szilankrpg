#!/usr/bin/env python3
"""Fegyvergenerátor — adatvezérelt adapter a webapp Taktikák / Harci helyzetek / Manőverek
forrásaihoz (`data/tables/*.json`, generálva a `data/sources/*.yaml`-ból).

Cél: a `fegyvergenerator_harcszimulator.py`/`fegyvergenerator_taktikai_ai.py` korábbi,
KÉZZEL írt `TAKTIKAK`/`HARCI_HELYZETEK` Python dict-jei csak egy RÉSZLETET fedtek le a
valós adatból (hiányzott pl. Csúszós talaj, Elvesztett egyensúly, Közrefogás, Orvtámadás,
Kezdeményező, Kiváró, Plusz támadás, Tettetés, a `megkötések[]`/`kombó_mód` validáció).

Ez a modul KÖZVETLENÜL a webapp JSON forrásait tölti be és egy GENERIKUS hatás-kiértékelőt
ad — nincs több kézzel duplikált adat. A hatás-mechanika szemantikája `hatas_operatorok.yaml`
+ `engine_spec.md §22.2` szerint:
    előny/hátrány → kocka reroll szint (netÉH taghoz, [-2,+2] clamp)
    arányos/duplázás → szorzó (0.5 = felez, 2 = duplázódik)
    letilt → boolean (képesség/próba elvesztése)
    max_limit → felső korlát
    szöveges → nem kumulálható, informatív (a szimulátor kihagyja, csak logolja)
    enyhít → csökkenti egy másik hatás fokát (csak fortélyokból jön, itt nem releváns)

Futtatás (önteszt):  python3 code/balance/fegyvergenerator_data_adapter.py
"""
import json
import pathlib

DATA_TABLES = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "tables"


def _load(nev):
    with open(DATA_TABLES / nev, encoding="utf-8") as fh:
        return json.load(fh)


TAKTIKAK_RAW = {t["id"]: t for t in _load("taktikak.json")}
HARCI_HELYZETEK_RAW = {h["id"]: h for h in _load("harci_helyzetek.json")}
MANOVEREK_RAW = {m["id"]: m for m in _load("manoverek.json")}
STATUSZOK_RAW = {s["név"]: s for s in _load("statuszok.json")}


# ─────────────────────────────────────────────────────────────────────────────
# Generikus hatás-kiértékelő (hatas_operatorok.yaml szemantikája)
# ─────────────────────────────────────────────────────────────────────────────

def hatasok_kiertekelese(hatasok, cel_szuro=None):
    """A `hatások[]` (vagy taktika `hatások[]`, ott a kulcs `hatás` nem `operátor`) listát
    egy összesített dict-té bontja: {cél: {'eh': összesített_szint, 'szorzo': szorzó, ...}}.
    `cel_szuro`: ha adott, csak az adott célra vonatkozó hatásokat gyűjti (pl. "té_dobás")."""
    eredmeny = {}
    for h in hatasok or []:
        op = h.get("operátor") or h.get("hatás")   # taktikák "hatás" kulcsot használnak
        cel = h.get("cél")
        if cel_szuro is not None and cel != cel_szuro:
            continue
        if cel not in eredmeny:
            eredmeny[cel] = dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
        if op in ("előny", "hátrány"):
            eredmeny[cel]["eh"] += h.get("érték", 0)
        elif op in ("arányos", "duplázás"):
            eredmeny[cel]["szorzo"] *= h.get("érték", 1)
        elif op == "letilt":
            eredmeny[cel]["letiltott"] = True
        elif op == "max_limit":
            cur = eredmeny[cel]["max_limit"]
            eredmeny[cel]["max_limit"] = h.get("érték") if cur is None else min(cur, h["érték"])
        elif op == "szöveges":
            eredmeny[cel]["szoveges"].append(h.get("megjegyzés", ""))
    return eredmeny


def helyzet_hatasa(helyzet_id, cel):
    """Egy adott Harci helyzet (id) adott célra vonatkozó összesített hatása."""
    h = HARCI_HELYZETEK_RAW.get(helyzet_id)
    if h is None:
        return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
    return hatasok_kiertekelese(h.get("hatások", []), cel_szuro=cel).get(
        cel, dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[]))


def taktika_modositok(taktika_id, fok=0):
    """Egy Taktika numerikus módosítói (TÉ/VÉ/SP/KÉ/CÉ) — fokozatos esetén a `fokok[]`
    listából, egyébként a `módosítók` map-ből. Visszaad egy {TÉ, VÉ, SP, KÉ, CÉ: int} dict-et."""
    t = TAKTIKAK_RAW.get(taktika_id)
    if t is None:
        return {}
    if t.get("fokozatos"):
        for f in t.get("fokok", []):
            if f["fok"] == fok:
                return {k: v for k, v in f.items() if k != "fok"}
        return {}
    return dict(t.get("módosítók", {}))


def taktika_strukturalt_hatasok(taktika_id, cel=None):
    """A taktika `hatások[]` listája (pl. Visszafogott → Hátrány-2 sebzésdobás)."""
    t = TAKTIKAK_RAW.get(taktika_id)
    if t is None:
        return {}
    return hatasok_kiertekelese(t.get("hatások", []), cel_szuro=cel)


def taktika_megkotesek(taktika_id):
    """A `megkötések[]` lista — minden elem {típus, mód, érték}."""
    t = TAKTIKAK_RAW.get(taktika_id)
    return t.get("megkötések", []) if t else []


def taktika_kombo(taktika_id):
    """(kombó_mód, kombó_lista) — whitelist: CSAK ezekkel kombinálható; blacklist: mindennel
    KIVÉVE ezeket."""
    t = TAKTIKAK_RAW.get(taktika_id)
    if t is None:
        return "whitelist", []
    return t.get("kombó_mód", "whitelist"), t.get("kombó_lista", [])


def helyzet_kizarasok(helyzet_id):
    """(tiltja_taktikákat: bool, kizár_helyzetek: [id]) egy adott Harci helyzethez."""
    h = HARCI_HELYZETEK_RAW.get(helyzet_id)
    if h is None:
        return False, []
    return h.get("tiltja_taktikákat", False), h.get("kizár_helyzetek", [])


def helyzet_fegyver_override(helyzet_id):
    """A `fegyver_override` mező (pl. Belharci helyzet) — {feltétel[], módosítók[]} vagy None."""
    h = HARCI_HELYZETEK_RAW.get(helyzet_id)
    return h.get("fegyver_override") if h else None


def manover_nehezseg(manover_id):
    m = MANOVEREK_RAW.get(manover_id)
    return m["nehézség"] if m else None


def manover_helyzetfuggo_modositok(manover_id):
    """A `helyzetfüggő_módosítók[]` kategóriák sorai — {kategória: [{érték, leírás}, ...]}."""
    m = MANOVEREK_RAW.get(manover_id)
    if m is None:
        return {}
    return {k["kategória"]: k["sorok"] for k in m.get("helyzetfüggő_módosítók", [])}


def statusz_hatasa(nev, fok, cel):
    """Egy Státusz (név) adott fokának adott célra vonatkozó összesített hatása
    (statuszok.json → fokok[].hatások[])."""
    s = STATUSZOK_RAW.get(nev)
    if s is None:
        return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
    for f in s.get("fokok", []):
        if f["fok"] == fok:
            return hatasok_kiertekelese(f.get("hatások", []), cel_szuro=cel).get(
                cel, dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[]))
    return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])


# ─────────────────────────────────────────────────────────────────────────────
# ÖNTESZT
# ─────────────────────────────────────────────────────────────────────────────

def selftest():
    print("=== SELF-TEST — data adapter ===")
    ok = True

    # T1: Földön fekve → té_dobás Hátrány-2, vé_veszteség duplázás
    h = helyzet_hatasa("földön_fekve", "té_dobás")
    t1 = h["eh"] == -2
    print(f"  {'✔' if t1 else '✘ HIBA'}  T1  Földön fekve té_dobás eh={h['eh']} (elvárt -2)")
    ok &= t1

    h2 = helyzet_hatasa("földön_fekve", "vé_veszteség")
    t1b = h2["szorzo"] == 2
    print(f"  {'✔' if t1b else '✘ HIBA'}  T1b Földön fekve vé_veszteség szorzó={h2['szorzo']} (elvárt 2)")
    ok &= t1b

    # T2: Belharci helyzet fegyver_override létezik és a feltétele pengehossz>0
    fo = helyzet_fegyver_override("belharci_helyzet")
    t2 = fo is not None and fo["feltétel"][0]["forrás"] == "aktív_fegyver_pengehossz"
    print(f"  {'✔' if t2 else '✘ HIBA'}  T2  Belharci helyzet fegyver_override betöltve")
    ok &= t2

    # T3: Roham taktika módosítói
    m = taktika_modositok("roham")
    t3 = m == {"TÉ": 4, "VÉ": -8, "SP": 5}
    print(f"  {'✔' if t3 else '✘ HIBA'}  T3  Roham módosítók: {m}")
    ok &= t3

    # T4: Támadó(2) skálázható fok
    m2 = taktika_modositok("támadó", fok=2)
    t4 = m2 == {"TÉ": 2, "VÉ": -4}
    print(f"  {'✔' if t4 else '✘ HIBA'}  T4  Támadó(2) módosítók: {m2}")
    ok &= t4

    # T5: Visszafogott strukturált hatása (sebzésdobás Hátrány-2)
    vh = taktika_strukturalt_hatasok("visszafogott", cel="sebzésdobás")
    t5 = vh.get("sebzésdobás", {}).get("eh") == -2
    print(f"  {'✔' if t5 else '✘ HIBA'}  T5  Visszafogott sebzésdobás eh={vh.get('sebzésdobás', {}).get('eh')} (elvárt -2)")
    ok &= t5

    # T6: Fárasztás megkötése tiltja Pengehátrányból
    mk = taktika_megkotesek("fárasztás")
    t6 = any(m["mód"] == "tiltott" and m["érték"] == "Pengehátrány" for m in mk)
    print(f"  {'✔' if t6 else '✘ HIBA'}  T6  Fárasztás megkötés (Pengehátrány tiltott): {t6}")
    ok &= t6

    # T7: Mögékerülés nehézsége és helyzetfüggő módosítói
    n = manover_nehezseg("mögékerülés")
    hm = manover_helyzetfuggo_modositok("mögékerülés")
    t7 = n == 8 and "Túlerő" in hm
    print(f"  {'✔' if t7 else '✘ HIBA'}  T7  Mögékerülés nehézség={n}, 'Túlerő' kategória betöltve: {'Túlerő' in hm}")
    ok &= t7

    print(f"\n{'MIND OK' if ok else 'HIBA VAN'}\n")
    return ok


if __name__ == "__main__":
    selftest()
