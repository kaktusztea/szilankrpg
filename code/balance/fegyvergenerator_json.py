#!/usr/bin/env python3
"""Fegyvergenerátor → JSON export (a jövőbeli webapp adatforrás első lépése).

A mainstream fegyverek (fegyverek.yaml, `kategória` mezővel bíró rekordok) a v2 (mátrix)
modellel leszármaztatva, EGY fegyver = EGY JSON elem, benne egy `módok` tömb
(fegyvermódonként - Aktoronként). NEM lapított/kompatibilis a kivezetett v1 `archive/data_fegyverek_v1/fegyverek.json`
formátumával (nincs MK_pár/Alapnév név-konkatenálás) - a régi rendszert várhatóan több szabály
is felváltja majd a cserénél, a cél itt a generátor natural modellje, nem a visszafelé
kompatibilitás.

Kimenet: {fegyver mezők} + módok: [ {aktor, jelleg, sebzéstípus, TÉ, VÉ, SP, Átütés,
Sebesség, Forgatás, Erőlimit, FP}, ... ]. Erő=0 bázisérték (mint a fegyverlista.py).

A `build()` a build pipeline része: a `data/gen/fegyverek_v2.py::generate_fegyverek_v2()`
adapter hívja, és a `generate_tables.py` a kimenetet `data/tables/fegyverek_v2.json`-ba írja
(ezt olvassa a webapp runtime, `engine/data-loader.ts`). CLI-ből futtatva (`python3
code/balance/fegyvergenerator_json.py`) a JSON a STDOUT-ra íródik - ad-hoc ellenőrzésre.
"""
import json
import sys

import fegyvergenerator_balansz as bal

F = bal.Fegyver

_EXTRAK = {m["id"]: m for m in bal._load("extrak.yaml")["extrak"]}


def _extra_id_lista(fv):
    """Az extra id-k listája: saját (fegyverek.yaml → extrak) + ÖRÖKÖLT (fegyverhossz-kategória,
    szálfegyver_nyélanyag, hajlékony, láncos) - ugyanaz a leszármaztatás, mint a fegyverlista.py-ban,
    csak itt a nyers id-kat adjuk vissza (nem a megjelenítendő nevet)."""
    ids = []
    ids += list(fv.get("_saját_extrak", []))
    ids += list(bal.FEGYVERHOSSZ[fv["hossz"]].get("extrak", []))
    ids += list(bal.SZALFEGYVER_NYELANYAG[fv.get("szálfegyver_nyélanyag", "sima")].get("extrak", []))
    ids += list(bal.HAJLEKONY[fv.get("hajlékony", 0)].get("extrak", []))
    ids += list(bal.LANCOS[fv.get("láncos", 0)].get("extrak", []))
    return ids


def _fegyver_json(r):
    fv = dict(r["fegyver"])
    fv["_saját_extrak"] = r.get("extrak", [])
    f = F(név=r["név"], **r["fegyver"])

    módok = []
    for m in f.modok(ero=0):
        módok.append({
            "aktor": m["aktor"],
            "jelleg": m["tipus"],
            "sebzéstípus": m["sebzestipus"],
            "TÉ": m["TE"],
            "VÉ": m["VE"],
            "SP": m["SP"],
            "Átütés": m["AT"],
            "Sebesség": m["SEB"],
            "Forgatás": m["forgatás"],
            "Erőlimit": m["erőbónusz_limit"],
            "FP": bool(m.get("puha", False)),
        })
    # erő_követelmény fegyver-szintű (nem mód-szintű): a súly-kategória tulajdonsága, minden
    # mód ugyanazt kapja (md/064_02_06 "Fegyverek Erő követelménye" - Hátrány-1 Támadó dobásra,
    # ha a karakter Ereje nem éri el).
    erő_követelmény = f.modok(ero=0)[0]["erő_követelmény"] if módok else 0

    extra_ids = _extra_id_lista(fv)
    akadály = fv.get("akadály", 0)
    súly = fv.get("súly", "átlagos")

    return {
        "név": r["név"],
        "kategória": r["kategória"],
        "megjegyzés": r.get("megjegyzés", ""),
        "fegyverhossz": fv["hossz"],
        "akadály": akadály,
        "súly": súly,  # könnyű/átlagos/nehéz/súlyos - a Felszerelés-pont forrása (md/010_03_06, VAGY-VAGY a fegyverhosszal)
        "övön_hordható": bool(bal.FEGYVERHOSSZ[fv["hossz"]].get("övön_hordható", False)),
        "ár": None,  # TODO: placeholder - kalkulált érték lesz (fegyverhossz/alapanyag/idea szorzókból), lásd v2.md "Ár"
        "idea_default": f.idea_default,  # a standard példány kezdő-Ideája; a fenti harcértékek EZT MÁR tartalmazzák (Modell 2). A webapp a felvett példány idea-ját erről indítja.
        "erő_követelmény": erő_követelmény,
        "extrák": [{"id": eid, "név": _EXTRAK.get(eid, {}).get("név", eid)} for eid in extra_ids],
        "módok": módok,
    }


def build():
    """A `fegyverek.yaml` (WORK-paraméterek, a generátor modellen át) + `fegyverek_fixed.json`
    (Garott, hárítófegyverek, Kopják - már végleges módok[] JSON, nem megy át a modellen,
    l. `sync_fegyvertablazatok.py` azonos logikája) mainstream fegyvereinek egyesített listája."""
    generalt = [_fegyver_json(r) for r in bal._load("fegyverek.yaml") if "kategória" in r]
    with open(bal.DATA_DIR / "fegyverek_fixed.json", encoding="utf-8") as fh:
        fixed = json.load(fh)
    # A fixed fegyverek (Garott, hárítók, Kopják) gyári Ideája 0 - egységes v2 séma (idea_default mindenütt).
    # Nincs súly paraméterük (aktor:"kivétel") → erő_követelmény mindig 0.
    for r in fixed:
        r.setdefault("idea_default", 0)
        r.setdefault("erő_követelmény", 0)
        r.setdefault("súly", "átlagos")
    return generalt + fixed


def run():
    # A validátorok print()-je STDOUT-ra menne (elszennyezné a JSON-t) - ideiglenesen STDERR-re irányítjuk.
    _stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        ok = extrak_validator.run() and fegyverek_validator.run()
    finally:
        sys.stdout = _stdout
    if not ok:
        raise SystemExit("séma-hiba - javítsd a fentieket (lásd fenn), a JSON export nem futott.")

    adat = build()
    json.dump(adat, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    import extrak_validator, fegyverek_validator
    run()
