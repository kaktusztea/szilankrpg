#!/usr/bin/env python3
"""Fegyvergenerátor → JSON export (a jövőbeli webapp adatforrás első lépése).

A mainstream fegyverek (fegyverek.yaml, `kategória` mezővel bíró rekordok) a v2 (mátrix)
modellel leszármaztatva, EGY fegyver = EGY JSON elem, benne egy `módok` tömb
(fegyvermódonként — Aktoronként). NEM lapított/kompatibilis a régi `data/tables/fegyverek.json`
formátumával (nincs MK_pár/Alapnév név-konkatenálás) — a régi rendszert várhatóan több szabály
is felváltja majd a cserénél, a cél itt a generátor natural modellje, nem a visszafelé
kompatibilitás.

Kimenet: {fegyver mezők} + módok: [ {aktor, jelleg, sebzéstípus, TÉ, VÉ, SP, Átütés,
Sebesség, Forgatás, Erőlimit, FP}, ... ]. Erő=0 bázisérték (mint a fegyverlista.py).

Futtatás:  python3 code/balance/fegyvergenerator_json.py > data/fegyvergenerator/fegyverek.generated.json

FIGYELEM: tervezői eszköz, NEM a build pipeline (generate_tables.py) része — a webapp
jelenleg nem olvassa ezt a fájlt. A bekötés (data-loader.ts, types.ts, fegyver-calc.ts
átírása) külön lépés.
"""
import json
import sys

import fegyvergenerator_balansz as bal

F = bal.Fegyver

_EXTRAK = {m["id"]: m for m in bal._load("extrak.yaml")["extrak"]}


def _extra_id_lista(fv):
    """Az extra id-k listája: saját (fegyverek.yaml → extrak) + ÖRÖKÖLT (fegyverhossz-kategória,
    szálfegyver_nyélanyag, hajlékony, láncos) — ugyanaz a leszármaztatás, mint a fegyverlista.py-ban,
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

    extra_ids = _extra_id_lista(fv)
    akadály = fv.get("akadály", 0)

    return {
        "név": r["név"],
        "kategória": r["kategória"],
        "megjegyzés": r.get("megjegyzés", ""),
        "fegyverhossz": fv["hossz"],
        "akadály": akadály,
        "övön_hordható": bool(bal.FEGYVERHOSSZ[fv["hossz"]].get("övön_hordható", False)),
        "extrák": [{"id": eid, "név": _EXTRAK.get(eid, {}).get("név", eid)} for eid in extra_ids],
        "módok": módok,
    }


def build():
    return [_fegyver_json(r) for r in bal._load("fegyverek.yaml") if "kategória" in r]


def run():
    # A validátorok print()-je STDOUT-ra menne (elszennyezné a JSON-t) — ideiglenesen STDERR-re irányítjuk.
    _stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        ok = extrak_validator.run() and fegyverek_validator.run()
    finally:
        sys.stdout = _stdout
    if not ok:
        raise SystemExit("séma-hiba — javítsd a fentieket (lásd fenn), a JSON export nem futott.")

    adat = build()
    json.dump(adat, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    import extrak_validator, fegyverek_validator
    run()
