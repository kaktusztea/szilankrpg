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
PENGES       = {int(k): v for k, v in _K["pengés"].items()}
LANCOS       = {int(k): v for k, v in _K["láncos"].items()}
IDEA         = {int(k): v for k, v in _K["idea"].items()}
AKTOR        = _K["aktor"]
SULY         = _K["súly"]
SULY_BY_ID   = {v["id"]: v for v in SULY.values()}   # súlykategória-index → kategória (súly-delta tolás)
_SULY_MIN, _SULY_MAX = min(SULY_BY_ID), max(SULY_BY_ID)
ALAPANYAG    = _K["alapanyag"]
SEBZESJELLEG_ALAPERTEK = _K["sebzésjelleg_alapérték"]
EGYKEZES_FORGATAS = _K["egykezes_forgatás"]
SZALFEGYVER_NYELANYAG = _K["szálfegyver_nyélanyag"]
HAJLEKONY = _K["hajlékony"]
SEBZESTIPUS_HATRANY = _K["sebzéstípus_hátrány"]   # sebzésmód rang → Sebzésdobás E/H szint (cél=sebzésdobás, mód=hátrány)
K20_ATLAG    = _K["k20_atlag"]
EP_PER_KAT   = _K["ep_per_kat"]

# sebzésjelleg × páncélosztály mátrix (flat SP delta) — a szituációs balansz motorja
_MATRIX_YAML = _load("sebzesjelleg_pancel_matrix.yaml")
TIPUS_PANCEL = _MATRIX_YAML["matrix"]
_STRUKTURA_OSZTALY = _MATRIX_YAML["struktúra_osztály"]

# Páncélok a balansz-teszthez az ELSŐDLEGES forrásból (data/sources/konstansok.yaml → páncél_struktúrák):
# (név, fizikai SFÉ, páncélosztály). csupasz = nincs vért (nem struktúra). Fizikai SFÉ, mert a fegyver-balansz fizikai.
with open(DATA_DIR.parent / "sources" / "konstansok.yaml", encoding="utf-8") as _fh:
    _STRUKTURAK = yaml.safe_load(_fh)["páncél_struktúrák"]
PANCEL = [("csupasz", 0, "csupasz")] + [
    (s["struktúra"], s["sfé_fizikai"], _STRUKTURA_OSZTALY[s["struktúra"]]) for s in _STRUKTURAK
]


def tipusbonusz(tipus, osztaly):
    """Sebzéstípus SP-módosító páncélosztály ellen — bónusz ÉS büntetés (szituációs balansz).
    Az osztály a páncél-struktúrából jön (struktúra_osztály leképezés), NEM SFÉ-küszöbből származtatva."""
    return TIPUS_PANCEL[tipus][osztaly]


# ─────────────────────────────────────────────────────────────────────────────
# FEGYVER MODELL
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Fegyver:
    """FIGYELEM: az alábbi mező-defaultok a fegyverek.schema.yaml `default:` értékeit tükrözik
    (Python dataclass nem tud sémából generálni statikus mezőt) — séma-default módosításkor
    ITT IS frissítendő, különben a kettő csendben elszakadhat."""
    név: str
    hossz: int
    aktorok: list
    fejdarab: int = 0
    pengés: int = 0
    láncos: int = 0
    súly: str = "átlagos"
    idea: int = 0
    alapanyag: str = "acél"
    hajlékony: int = 0
    súly_delta_cél: str = "sp"        # "sp" vagy "átütés" — mire fordítjuk a nehéz/súlyos deltát (konstansok.yaml súly_delta_cél)
    szálfegyver_nyélanyag: str = "sima"   # sima/fanyelű/vasaltszárú/tömörszárú — súly/SP hatás
    erőbónusz_limit: int = 99        # SP-re alkalmazható Erőbónusz plafonja (md/064_02_06); 99 = nincs plafon; passthrough (Erő=0 bázist nem érinti)
    akadály: int = 0                  # 0/1/2 — utazásnál mennyire akadályoz; NINCS harcérték-hatás, csak leíró/logisztikai

    def modok(self, ero=2):
        """Fegyvermódonként (fogás × aktor) a végső harcértékek.

        A másfélkezes fegyver KÉT fogás-variánst ad: '2 kéz' (teljes) és '1 kéz' (MK-levonás).
        Az MK a KONTROLLT bünteti (TÉ/VÉ/Átütés/erő-plafon), a sebzést (SP) NEM.
        A levonás-értékek: konstansok.yaml → forgatás_levonás['másfélkezes_egykézzel'].
        (A kétkezes-1-kézzel eset SZITUÁCIÓ, nem itt emittált sor — lásd konstansok.yaml → kétkezes_egykézzel.)
        """
        h = FEGYVERHOSSZ[self.hossz]
        i = IDEA[self.idea]
        mat = ALAPANYAG[self.alapanyag]
        nyel = SZALFEGYVER_NYELANYAG[self.szálfegyver_nyélanyag]

        # idea/alapanyag/szálfegyver-nyél súly-delta → a súly KATEGÓRIÁT tolja (clamp a szélső osztályokra);
        # a cél-kategória TELJES sora (SP, Sebesség, erő_követelmény) érvényesül. Negatív delta = könnyebb.
        suly_shift = i.get("súly", 0) + mat.get("súly", 0) + nyel.get("súly", 0)
        s = SULY_BY_ID[max(_SULY_MIN, min(_SULY_MAX, SULY[self.súly]["id"] + suly_shift))]

        pen = PENGES[self.pengés]
        # A fejdarab a fegyver EXPLICIT bemenő paramétere, FÜGGETLEN a pengés-től (a pengés
        # csak a "van éle" harcérték-bónuszt adja, lásd konstansok.yaml → pengés).
        fd = FEJDARAB[self.fejdarab]

        # Fogás-variánsok: ha a forgatásnak van "1 kézzel" MINDIG EMITTÁLT extra variánsa
        # (jelenleg csak a másfélkezesnek — konstansok.yaml → egykezes_forgatás), a fegyver
        # két sort ad ki. A kétkezes 1-kézzel eset SZITUÁCIÓ (mindig_emittált: false), nem itt jön.
        forg = h["forgatás"]
        grips = [(forg, None)]
        egykezes_levonas = EGYKEZES_FORGATAS.get(forg)
        if egykezes_levonas and egykezes_levonas.get("mindig_emittált"):
            grips.append((forg + " · 1 kéz", egykezes_levonas))

        eredmeny = []
        for forg_cimke, mk in grips:
            for idx, aktor_nev in enumerate(self.aktorok):
                a = AKTOR[aktor_nev]
                tt = SEBZESJELLEG_ALAPERTEK[a["sebzésjelleg"]]
                # Elsődleges aktor = a lista 1. eleme (alap sebzésmód, nincs büntetés).
                # Másodlagos aktor(ok) = a többi → bejelentés után, Hátrány-1 a Sebzésdobásra (064_02_05).
                sebzestipus = "elsődleges" if idx == 0 else "másodlagos"
                sebzes_hatrany = SEBZESTIPUS_HATRANY[sebzestipus]["érték"]   # Sebzésdobás E/H szint (0 / -1)

                # ── TÉ ──
                te = (h["TÉ"] + a["TÉ"] + tt["TÉ"] + fd["TÉ"]
                      + pen["TÉ"]
                      + i["TÉ"] + mat["TÉ"])
                # ── VÉ ──
                ve = (h["VÉ"] + a["VÉ"] + tt["VÉ"]
                      + pen["VÉ"]
                      + i["VÉ"] + mat["VÉ"]
                      + HAJLEKONY[self.hajlékony]["VÉ"])   # hajlékony VÉ (tábla)

                # ── SP ── (a sebzést az MK NEM érinti)
                suly_szamit = tt.get("súly_számít", True)
                sp = h["SP"] + a["SP"] + mat["SP"] + i["SP"] + ero + nyel.get("SP", 0)
                sp += pen["SP"]
                lanc = LANCOS[self.láncos]
                sp += lanc["SP"]
                # súly SP: ha a sebzésjelleg nem "számít" a súllyal (pl. szúrásnál nincs erőkar)
                if suly_szamit:
                    weff = s["SP"]  # az eff. (eltolt) súly-kategória SP-je
                    if self.súly_delta_cél == "sp":
                        sp += weff

                # ── Átütés ──
                at = a["átütés"] + mat.get("átütés", 0)
                if self.súly_delta_cél == "átütés" and suly_szamit:
                    at += max(0, s["SP"])  # nehéz +1 / súlyos +2 átütésbe

                # ── Sebesség ── (magasabb = lassabb)
                seb = (h["sebesség"] + fd["sebesség"] + a["sebesség"] + s["sebesség"]
                       + lanc["sebesség"]
                       + i["sebesség"] + HAJLEKONY[self.hajlékony]["sebesség"])

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
                    puha=a.get("puha", False),
                ))
        return eredmeny


# ─────────────────────────────────────────────────────────────────────────────
# FEGYVER KATALÓGUS — WORK paraméterek a data/fegyvergenerator/fegyverek.yaml-ből.
# FEGYVEREK = a `teszt.teszt_minta: true` rekordok (balansz self-test/elemzés).
# ─────────────────────────────────────────────────────────────────────────────

FEGYVER_RECORDS = _load("fegyverek.yaml")
# A balansz self-testben részt vevő kiemelt fegyverek (teszt.teszt_minta: true).
FEGYVEREK = {r["név"]: Fegyver(név=r["név"], **r["fegyver"])
             for r in FEGYVER_RECORDS if r.get("teszt", {}).get("teszt_minta")}


# ─────────────────────────────────────────────────────────────────────────────
# TESZTEK
# ─────────────────────────────────────────────────────────────────────────────

def teszt_regresszio():
    """Ellenőrzi, hogy a modell reprodukálja az elvárt bázis TÉ/VÉ értékeket.
    Az elvárt értékek a fegyverek.yaml `teszt.elvart` mezőiből jönnek (Erő-független).
    FIGYELEM: csak vágó/zúzó módokat ellenőrzünk — a doksi thrust-módjai a régi
    (szúró TÉ/VÉ=0) szabállyal készültek, az új szúró szándékos eltérés lehet.

    `teszt.elvart_1kez_kétkezes`: a KÉTKEZES fegyver szituációs 1-kezes (pajzs/kiesett kéz) TÉ/VÉ-je —
    ez a modok()-ban NEM emittált sor (mindig_emittált: false), itt manuálisan alkalmazzuk az
    egykezes_forgatás.kétkezes levonást, hogy a v2.md-ben kézzel leírt szituációs blokkok
    (pl. "Lándzsa pajzzsal") ne szakadjanak el csendben a data layertől."""
    print("=== REGRESSZIÓ (elvárt TÉ/VÉ, Erő-független) ===")
    ok = True
    for r in FEGYVER_RECORDS:
        teszt = r.get("teszt", {})
        f = FEGYVEREK.get(r["név"])
        if "elvart" in teszt:
            for aktor, (vte, vve) in teszt["elvart"].items():
                m = next(x for x in f.modok(ero=0) if x["aktor"] == aktor)
                jel = "✅" if (m["TE"] == vte and m["VE"] == vve) else "❌"
                if jel == "❌":
                    ok = False
                print(f"  {jel} {r['név']:24s} {aktor:24s} TÉ {m['TE']:>3}(≈{vte}) VÉ {m['VE']:>3}(≈{vve})")
        if "elvart_1kez_kétkezes" in teszt:
            lev = EGYKEZES_FORGATAS["kétkezes"]
            for aktor, (vte, vve) in teszt["elvart_1kez_kétkezes"].items():
                m = next(x for x in f.modok(ero=0) if x["aktor"] == aktor)
                te1, ve1 = m["TE"] + lev["TÉ"], m["VE"] + lev["VÉ"]
                jel = "✅" if (te1 == vte and ve1 == vve) else "❌"
                if jel == "❌":
                    ok = False
                print(f"  {jel} {r['név']:24s} {aktor:24s} · 1 kéz (szituáció) TÉ {te1:>3}(≈{vte}) VÉ {ve1:>3}(≈{vve})")
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
            for pnev, sfe, oszt in PANCEL:
                bonus = tipusbonusz(m["tipus"], oszt)
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
        if csak_mundan and (f.idea != 0 or ALAPANYAG[f.alapanyag].get("mágikus")):
            continue
        modok = f.modok(ero=ero)
        sor = fnev.ljust(24)
        for pnev, sfe, oszt in PANCEL:
            best = 0.0
            for m in modok:
                bonus = tipusbonusz(m["tipus"], oszt)
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
