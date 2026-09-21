#!/usr/bin/env python3
"""Fegyvergenerátor — determinisztikus harcérték-számoló + balansz teszt.

Cél:
  1) Reprodukálja a STUDY.fegyvergenerator.md meglévő GAME értékeit (regresszió).
  2) A hiányzó TODO paraméterekre javasolt értékek balansz-tesztje.
  3) Kimutatja, hogy nincs "mindent vivő" fegyver (tempóval súlyozott sebzés).

Konvenció: magasabb Sebesség szám = LASSABB fegyver.

Futtatás:  python3 code/fegyvergenerator_balansz.py

─────────────────────────────────────────────────────────────────────────────
Eredet: szilank.wiki/STUDY.fegyvergenerator.balance.py — migrálva 2026-09-10.
Kapcsolódó tervezési doksik (a WIKI-ben élnek, NEM éles anyag):
  STUDY.fegyvergenerator.md · STUDY.fegyvergenerator_v2_balanced.md
  STUDY.fegyvergenerator_v2_fegyverlista.md

FIGYELEM: ez egy TERVEZŐI eszköz, nem a data pipeline része. A generátor
paraméterei (FEGYVERHOSSZ, AKTOR, SULY, IDEA, ALAPANYAG, TIPUS_PANCEL) NEM
azonosak az éles `data/tables/fegyverek.json` értékeivel — a generátor egy
javasolt modell, a fegyvertáblák kézzel hangolt élesek. A kettőt NE
szinkronizáld automatikusan.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
import pathlib
import yaml

# ─────────────────────────────────────────────────────────────────────────────
# ADAT BETÖLTÉS — minden paraméter a data/fegyvergenerator/ YAML-okból jön.
# A szkriptben NINCS beégetett adat, csak modell-logika.
# ─────────────────────────────────────────────────────────────────────────────
DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "fegyvergenerator"


def _load(nev):
    with open(DATA_DIR / nev, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


_K = _load("konstansok.yaml")
# int kulcsok normalizálása (YAML-ban stringként is jöhetnének)
FEGYVERHOSSZ = {int(k): v for k, v in _K["fegyverhossz"].items()}
FEJDARAB     = {int(k): v for k, v in _K["fejdarab"].items()}
IDEA         = {int(k): v for k, v in _K["idea"].items()}
AKTOR        = _K["aktor"]
SULY         = _K["súly"]
ALAPANYAG    = _K["alapanyag"]
TIPUS_TV     = _K["tipus_tv"]
FORGATAS_LEVONAS = _K["forgatás_levonás"]
SZALFEGYVER_NYEL = _K["szalfegyver_nyel"]
PANCEL       = [tuple(x) for x in _K["pancel"]]
K20_ATLAG    = _K["k20_atlag"]
EP_PER_KAT   = _K["ep_per_kat"]

# sebzésjelleg × páncélosztály mátrix (flat SP delta) — a szituációs balansz motorja
TIPUS_PANCEL = _load("sebzesjelleg_pancel_matrix.yaml")["matrix"]


def tipusbonusz(tipus, sfe, fem):
    """Sebzéstípus SP-módosító páncélosztály ellen — bónusz ÉS büntetés (szituációs balansz).
    Páncélosztály: csupasz | puha (posztó/kabát) | bőr | fém-hajlékony (lánc) | fém-merev (pikkely/lemez)."""
    if sfe == 0:              osztaly = "csupasz"
    elif not fem and sfe <= 3: osztaly = "puha"
    elif not fem:            osztaly = "bor"
    elif sfe <= 10:          osztaly = "lanc"
    else:                    osztaly = "merev"
    return TIPUS_PANCEL[tipus][osztaly]


# ─────────────────────────────────────────────────────────────────────────────
# FEGYVER MODELL
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Fegyver:
    név: str
    hossz: int
    aktorok: list
    fejdarab_alap: int = 0
    penges: int = 0
    lancos: int = 0
    súly: str = "átlagos"
    idea: int = 0
    alapanyag: str = "acél"
    hajlekony: int = 0
    nehez_mod: str = "sp"        # "sp" vagy "átütés" — mire fordítjuk a nehéz/súlyos deltát
    szalfegyver_nyel: str = "sima"   # sima/fanyelű/vasaltszárú/tömörszárú — súly/SP hatás
    erőbónusz_limit: int = 99        # SP-re alkalmazható Erőbónusz plafonja (md/064_02_06); 99 = nincs plafon; passthrough (Erő=0 bázist nem érinti)

    def modok(self, ero=2):
        """Fegyvermódonként (fogás × aktor) a végső harcértékek.

        A másfélkezes fegyver KÉT fogás-variánst ad: '2 kéz' (teljes) és '1 kéz' (MK-levonás).
        Az MK a KONTROLLT bünteti (TÉ/VÉ/Átütés/erő-plafon), a sebzést (SP) NEM.
        A levonás-értékek: konstansok.yaml → forgatás_levonás['másfélkezes_egykézzel'].
        (A kétkezes-1-kézzel eset SZITUÁCIÓ, nem itt emittált sor — lásd forgatás_levonás['kétkezes_egykézzel'].)
        """
        h = FEGYVERHOSSZ[self.hossz]
        s = dict(SULY[self.súly])
        i = IDEA[self.idea]
        mat = ALAPANYAG[self.alapanyag]
        nyel = SZALFEGYVER_NYEL[self.szalfegyver_nyel]

        # idea, alapanyag és szálfegyver-nyél súly-delta → eltolja a súly kategóriát (Sebesség/SP-re hat)
        suly_delta = i.get("súly", 0) + mat.get("súly", 0) + nyel.get("súly", 0)

        fejdarab = self.fejdarab_alap + (1 if self.penges else 0)
        fd = FEJDARAB[fejdarab]

        # Fogás-variánsok: a másfélkezes fegyver 2 kézzel ÉS 1 kézzel (MK) is forgatható → 2 sor-készlet.
        forg = h["forgatás"]
        grips = [(forg, None)]
        if forg == "másfélkezes":
            grips.append((forg + " · 1 kéz", FORGATAS_LEVONAS["másfélkezes_egykézzel"]))

        eredmeny = []
        for forg_cimke, mk in grips:
            for idx, aktor_nev in enumerate(self.aktorok):
                a = AKTOR[aktor_nev]
                tt = TIPUS_TV[a["sebzésjelleg"]]
                # Elsődleges aktor = a lista 1. eleme (alap sebzésmód, nincs büntetés).
                # Másodlagos aktor(ok) = a többi → bejelentés után, Hátrány-1 a Sebzésdobásra (064_02_05).
                sebzestipus = "elsődleges" if idx == 0 else "másodlagos"
                sebzes_hatrany = 0 if idx == 0 else 1

                # ── TÉ ──
                te = (h["TÉ"] + a["TÉ"] + tt["TÉ"] + fd["TÉ"]
                      + (1 if self.penges else 0)      # pengés TÉ/VÉ +1
                      + i["TÉ"] + mat["TÉ"])
                # ── VÉ ──
                ve = (h["VÉ"] + a["VÉ"] + tt["VÉ"]
                      + (1 if self.penges else 0)
                      + i["VÉ"] + mat["VÉ"]
                      - 2 * self.hajlekony)            # hajlékony VÉ:-2

                # ── SP ── (a sebzést az MK NEM érinti)
                szuro = a["sebzésjelleg"] == "szúró"
                sp = h["SP"] + a["SP"] + mat["SP"] + i["SP"] + ero + nyel.get("SP", 0)
                if self.penges:
                    sp += 1
                if self.lancos:
                    sp += 1
                # súly SP: szúrásnál NEM számít
                if not szuro:
                    weff = s["SP"] + suly_delta  # súly-delta könnyíti → kevesebb súly-SP
                    if self.nehez_mod == "sp":
                        sp += weff

                # ── Átütés ──
                at = a["átütés"] + mat.get("átütés", 0)
                if self.nehez_mod == "átütés" and not szuro:
                    at += max(0, s["SP"])  # nehéz +1 / súlyos +2 átütésbe

                # ── Sebesség ── (magasabb = lassabb)
                seb = (h["sebesség"] + fd["sebesség"] + a["sebesség"] + s["sebesség"]
                       + (1 if self.lancos else 0)
                       + i["sebesség"] + suly_delta + self.hajlekony)

                # ── Fogás-kényszer (MK): kontroll-levonás, a sebzést NEM érinti ──
                ero_limit = self.erőbónusz_limit
                if mk:
                    te += mk["TÉ"]
                    ve += mk["VÉ"]
                    at = min(at, mk["átütés_max"])
                    ero_limit = min(ero_limit, mk["erőbónusz_limit_max"])

                eredmeny.append(dict(
                    aktor=aktor_nev, tipus=a["sebzésjelleg"], forgatás=forg_cimke,
                    TE=te, VE=ve, SP=sp, AT=at, SEB=seb, erőbónusz_limit=ero_limit,
                    sebzestipus=sebzestipus, sebzes_hatrany=sebzes_hatrany,
                ))
        return eredmeny


# ─────────────────────────────────────────────────────────────────────────────
# FEGYVER KATALÓGUS — WORK paraméterek a data/fegyvergenerator/fegyverek.yaml-ből.
# FEGYVEREK = a `teszt_minta: true` rekordok (balansz self-test/elemzés).
# ─────────────────────────────────────────────────────────────────────────────

FEGYVER_RECORDS = _load("fegyverek.yaml")
# A balansz self-testben részt vevő kiemelt fegyverek (teszt_minta: true).
FEGYVEREK = {r["név"]: Fegyver(név=r["név"], **r["fegyver"])
             for r in FEGYVER_RECORDS if r.get("teszt_minta")}


# ─────────────────────────────────────────────────────────────────────────────
# TESZTEK
# ─────────────────────────────────────────────────────────────────────────────

def teszt_regresszio():
    """Ellenőrzi, hogy a modell reprodukálja az elvárt bázis TÉ/VÉ értékeket.
    Az elvárt értékek a fegyverek.yaml `elvart` mezőiből jönnek (Erő-független).
    FIGYELEM: csak vágó/zúzó módokat ellenőrzünk — a doksi thrust-módjai a régi
    (szúró TÉ/VÉ=0) szabállyal készültek, az új szúró szándékos eltérés lehet."""
    print("=== REGRESSZIÓ (elvárt TÉ/VÉ, Erő-független) ===")
    ok = True
    for r in FEGYVER_RECORDS:
        if "elvart" not in r:
            continue
        f = FEGYVEREK[r["név"]]
        for aktor, (vte, vve) in r["elvart"].items():
            m = next(x for x in f.modok(ero=0) if x["aktor"] == aktor)
            jel = "✅" if (m["TE"] == vte and m["VE"] == vve) else "❌"
            if jel == "❌":
                ok = False
            print(f"  {jel} {r['név']:24s} {aktor:24s} TÉ {m['TE']:>3}(≈{vte}) VÉ {m['VE']:>3}(≈{vve})")
    print(f"  → {'MIND OK' if ok else 'ELTÉRÉS!'}\n")
    return ok


def teszt_sebzes_matrix(ero=2):
    """Effektív sebzés (sebesülés-kategóriában) minden fegyver-mód × páncél ellen."""
    print(f"=== SEBZÉS MÁTRIX (Erő={ero}, érték = sebesülés-kategória) ===")
    fejlec = "fegyver / mód".ljust(38) + "".join(p[0][:6].rjust(8) for p in PANCEL)
    print(fejlec)
    print("-" * len(fejlec))
    for fnev, f in FEGYVEREK.items():
        for m in f.modok(ero=ero):
            sor = f"{fnev} [{m['aktor'][:16]}]".ljust(38)
            for pnev, sfe, fem in PANCEL:
                bonus = tipusbonusz(m["tipus"], sfe, fem)
                eff_sfe = max(0, sfe - m["AT"])
                dmg = K20_ATLAG + m["SP"] + bonus - eff_sfe
                kat = max(0.0, dmg) / EP_PER_KAT
                sor += f"{kat:8.2f}"
            print(sor)
    print()


def teszt_tempo(ero=2, csak_mundan=False):
    """Tempóval súlyozott sebzés: (sebzés/kör) ~ effektív_kat / Sebesség.
    Ha egy fegyver MINDEN páncél ellen a legjobb tempó-sebzésű → mindent vivő (rossz)."""
    cimke = " [CSAK MUNDÁN: Idea 0, acél]" if csak_mundan else ""
    print(f"=== TEMPÓ-SÚLYOZOTT SEBZÉS (Erő={ero}){cimke} — kat/Sebesség × 10 ===")
    print("(csak az elsődleges/legjobb mód páncélonként; magasabb = jobb throughput)")
    fejlec = "fegyver".ljust(24) + "".join(p[0][:6].rjust(8) for p in PANCEL)
    print(fejlec)
    print("-" * len(fejlec))
    # páncélonként gyűjtjük, melyik fegyver a legjobb
    legjobb = {p[0]: (None, -1) for p in PANCEL}
    for fnev, f in FEGYVEREK.items():
        if csak_mundan and (f.idea != 0 or f.alapanyag not in ("acél", "kő", "bronz", "csont")):
            continue
        modok = f.modok(ero=ero)
        sor = fnev.ljust(24)
        for pnev, sfe, fem in PANCEL:
            best = 0.0
            for m in modok:
                bonus = tipusbonusz(m["tipus"], sfe, fem)
                eff_sfe = max(0, sfe - m["AT"])
                dmg = max(0.0, K20_ATLAG + m["SP"] + bonus - eff_sfe)
                kat = dmg / EP_PER_KAT
                tempo = kat / m["SEB"] * 10
                best = max(best, tempo)
            sor += f"{best:8.2f}"
            if best > legjobb[pnev][1]:
                legjobb[pnev] = (fnev, best)
        print(sor)
    print("\n  Páncélonkénti LEGJOBB tempó-sebzésű fegyver:")
    dominancia = {}
    for pnev, (fnev, val) in legjobb.items():
        print(f"    {pnev:14s}: {fnev} ({val:.2f})")
        dominancia[fnev] = dominancia.get(fnev, 0) + 1
    print("\n  Dominancia (hány páncél-kategóriában legjobb):")
    for fnev, n in sorted(dominancia.items(), key=lambda x: -x[1]):
        flag = "  ⚠️ MINDENT VIVŐ?" if n >= len(PANCEL) - 1 else ""
        print(f"    {fnev}: {n}/{len(PANCEL)}{flag}")
    print()


def teszt_dump(ero=0):
    """Teljes GAME dump — az új szabályokkal (szúró TÉ+1/VÉ-1) regenerált értékek.
    Erő=0: a doksi GAME blokkjai Erő nélkül adják a TÉ/VÉ-t; az SP a példákban Erővel."""
    print(f"=== GAME DUMP (Erő={ero}) — regenerált értékek ===")
    for fnev, f in FEGYVEREK.items():
        besz = " [Beszorítható]" if "beszorithato" in FEGYVERHOSSZ[f.hossz].get("extrak", []) else ""
        print(f"\n### {fnev}{besz}")
        for m in f.modok(ero=ero):
            print(f"  {m['aktor']:26s} ({m['tipus']:12s}) "
                  f"TÉ:{m['TE']:>3} VÉ:{m['VE']:>3} SP:{m['SP']:+d} "
                  f"Átütés:{m['AT']} Sebesség:{m['SEB']}")
    print()


if __name__ == "__main__":
    import extrak_validator, fegyverek_validator
    if not extrak_validator.run():
        raise SystemExit("extrak.yaml séma-hiba — javítsd a fentieket (lásd fenn).")
    if not fegyverek_validator.run():
        raise SystemExit("fegyverek.yaml séma-hiba — javítsd a fentieket (lásd fenn).")
    print()
    teszt_regresszio()
    teszt_dump(ero=0)
    teszt_sebzes_matrix(ero=2)
    teszt_tempo(ero=2)
    teszt_tempo(ero=4)
