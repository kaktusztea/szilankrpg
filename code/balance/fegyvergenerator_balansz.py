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

from dataclasses import dataclass, field

# ─────────────────────────────────────────────────────────────────────────────
# PARAMÉTER TÁBLÁK
# ─────────────────────────────────────────────────────────────────────────────

# fegyverhossz: kat -> (TÉ/VÉ, SP, Sebesség, forgatás)
FEGYVERHOSSZ = {
    0:  dict(tv=0,  sp=0, seb=5, forg="egykezes"),
    1:  dict(tv=1,  sp=1, seb=5, forg="egykezes"),
    2:  dict(tv=2,  sp=2, seb=5, forg="egykezes"),
    3:  dict(tv=3,  sp=3, seb=6, forg="egykezes"),
    5:  dict(tv=5,  sp=4, seb=6, forg="másfélkezes"),
    7:  dict(tv=7,  sp=5, seb=7, forg="kétkezes"),
    9:  dict(tv=9,  sp=5, seb=8, forg="kétkezes"),
    12: dict(tv=12, sp=5, seb=9, forg="kétkezes"),
}

# aktor: név -> (típus, sp, átütés, TÉ, VÉ, seb)
AKTOR = {
    "botvég":                     dict(t="zúzó",         sp=0, at=0, te=0, ve=0,  seb=0),
    "buzogányfej-tompa":          dict(t="zúzó",         sp=2, at=0, te=0, ve=-2, seb=0),
    "buzogányfej-szöges":         dict(t="zúzó",         sp=1, at=2, te=0, ve=-3, seb=0),
    "pengehegy-apró":             dict(t="szúró",        sp=0, at=0, te=0, ve=0,  seb=0),
    "pengehegy-tőr":              dict(t="szúró",        sp=1, at=0, te=0, ve=0,  seb=0),
    "pengehegy-kard":             dict(t="szúró",        sp=2, at=1, te=0, ve=0,  seb=0),
    "vágóél-egyenes-rövid":       dict(t="vágó-egyenes", sp=0, at=0, te=1, ve=1,  seb=0),
    "vágóél-egyenes-átlagos":     dict(t="vágó-egyenes", sp=1, at=0, te=2, ve=2,  seb=0),
    "vágóél-egyenes-nagy":        dict(t="vágó-egyenes", sp=2, at=0, te=2, ve=2,  seb=0),
    "vágóél-íves-rövid":          dict(t="vágó-íves",    sp=1, at=0, te=0, ve=0,  seb=0),
    "vágóél-íves-átlagos":        dict(t="vágó-íves",    sp=2, at=0, te=0, ve=0,  seb=1),
    "vágóél-íves-nagy":           dict(t="vágó-íves",    sp=3, at=0, te=0, ve=0,  seb=1),
    "lándzsahegy-rövid-átlagos":  dict(t="szúró",        sp=3, at=2, te=0, ve=0,  seb=0),
    "lándzsahegy-rövid-széles":   dict(t="szúró",        sp=4, at=0, te=0, ve=0,  seb=0),
    "lándzsahegy-rövid-keskeny":  dict(t="szúró",        sp=2, at=4, te=0, ve=0,  seb=0),
    "lándzsahegy-tőrhossz":       dict(t="szúró",        sp=4, at=0, te=0, ve=0,  seb=0),
    "lándzsahegy-rövidkardhossz": dict(t="szúró",        sp=5, at=0, te=0, ve=0,  seb=0),
    "lándzsahegy-hosszúkardhossz":dict(t="szúró",        sp=6, at=0, te=0, ve=0,  seb=1),
    "kampós-vég":                 dict(t="nincs",        sp=0, at=0, te=0, ve=0,  seb=0),
}

# fejdarab: n -> (seb, TÉ)
FEJDARAB = {0: dict(seb=0, te=0), 1: dict(seb=1, te=0), 2: dict(seb=2, te=-2), 3: dict(seb=3, te=-4)}

# súly: név -> (sp, seb, erőköv)   [nehéz/súlyos: sp VAGY átütés — alább 'nehéz_mód' dönt]
SULY = {
    "könnyű":  dict(sp=-1, seb=-1, erő=0),   # DÖNTÉS: könnyű = -1 SP (a vitatott kérdés lezárva)
    "átlagos": dict(sp=0,  seb=0,  erő=0),
    "nehéz":   dict(sp=1,  seb=1,  erő=2),
    "súlyos":  dict(sp=2,  seb=2,  erő=3),
}

# idea: szint -> (tvc, sp, seb, súly_delta)
IDEA = {
    -5: dict(tvc=-3, sp=-5, seb=2,  suly=0),
    -4: dict(tvc=-2, sp=-4, seb=1,  suly=0),
    -3: dict(tvc=-1, sp=-3, seb=1,  suly=0),
    -2: dict(tvc=-1, sp=-2, seb=0,  suly=0),
    -1: dict(tvc=0,  sp=-1, seb=0,  suly=0),
     0: dict(tvc=0,  sp=0,  seb=0,  suly=0),
     1: dict(tvc=0,  sp=1,  seb=0,  suly=0),
     2: dict(tvc=1,  sp=2,  seb=0,  suly=0),
     3: dict(tvc=1,  sp=3,  seb=-1, suly=0),
     4: dict(tvc=2,  sp=4,  seb=-1, suly=-1),
     5: dict(tvc=3,  sp=5,  seb=-2, suly=-2),
}

# alapanyag: név -> (tvc, sp, [extra])   — ÚJ értékek a legendás fémekre
ALAPANYAG = {
    "test":       dict(tvc=-3, sp=-5),
    "krumpli":    dict(tvc=-3, sp=-5),
    "csont":      dict(tvc=0,  sp=-4),
    "kő":         dict(tvc=0,  sp=-3),
    "bronz":      dict(tvc=0,  sp=-2),
    "acél":       dict(tvc=0,  sp=0),
    "abbitacél":  dict(tvc=1,  sp=1),
    "mithrill":   dict(tvc=1,  sp=2,  suly=-1),
    "lunír":      dict(tvc=1,  sp=0,  suly=-2),          # ÚJ: gyorsaság-fém
    "feketeacél": dict(tvc=1,  sp=1),                    # Mara-Sequor — Chi-harcban törhetetlen
    "ősfém":      dict(tvc=2,  sp=2),                    # ÚJ: 1-2. kori — szellem/élőholt sebez
    "élőereklye": dict(tvc=2,  sp=3),                    # ÚJ: törhetetlen, kötődik
    "álomfém":    dict(tvc=1,  sp=1,  at=2),             # ÚJ: +2 Átütés, mágiaűrben elveszik
}

# sebzéstípus TÉ/VÉ módosító alkotáskor (típus-szint)
# MEGJEGYZÉS: a szúró TÉ+1/VÉ-1 variánst teszteltük, de ELVETVE — a szúró módok
# már +3 SP-t kapnak láncing-és-alatta ellen; egy plusz flat TÉ átfedne a 'pontos'
# paraméterrel és felülerősítené a szúrást (a cut/thrust egyensúly romlana).
TIPUS_TV = {
    "zúzó":         dict(te=0,  ve=0),
    "szúró":        dict(te=0,  ve=0),
    "vágó-egyenes": dict(te=0,  ve=0),    # a +2 az AKTOR szinten van elosztva
    "vágó-íves":    dict(te=0,  ve=0),
    "nincs":        dict(te=0,  ve=0),
}

# ─────────────────────────────────────────────────────────────────────────────
# PÁNCÉLOK (balansz teszthez)
# ─────────────────────────────────────────────────────────────────────────────
# név -> (SFÉ, fém?, kategória a típusbónuszokhoz)
PANCEL = [
    ("csupasz",      0,  False),
    ("posztó",       2,  False),
    ("fegyverkabát", 3,  False),
    ("bőr",          7,  False),
    ("lánc",         10, True),
    ("pikkely",      15, True),
    ("lemez",        20, True),
]

K20_ATLAG = 10.5
EP_PER_KAT = 9.0  # ~ÉP/4 tipikus kalandozónál


# típus × páncélosztály: flat SP delta (bónusz + büntetés)
TIPUS_PANCEL = {
    "zúzó":         dict(csupasz=0,  puha=0,  bor=+1, lanc=+3, merev=+3),  # páncéltörő, gyenge húson
    "szúró":        dict(csupasz=+2, puha=+3, bor=+1, lanc=0,  merev=-3),  # réseket talál, plate-ről lecsúszik
    "vágó-egyenes": dict(csupasz=+1, puha=+1, bor=0,  lanc=-2, merev=-4),  # húson jó, fémen rossz
    "vágó-íves":    dict(csupasz=+3, puha=+2, bor=0,  lanc=-2, merev=-4),  # húson kiváló, fémen a legrosszabb
    "nincs":        dict(csupasz=0,  puha=0,  bor=0,  lanc=0,  merev=0),
}


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
    nev: str
    hossz: int
    aktorok: list
    fejdarab_alap: int = 0
    penges: int = 0
    lancos: int = 0
    suly: str = "átlagos"
    idea: int = 0
    alapanyag: str = "acél"
    hajlekony: int = 0
    nehez_mod: str = "sp"        # "sp" vagy "átütés" — mire fordítjuk a nehéz/súlyos deltát
    egykezes_kenyszer: bool = False  # pl. lándzsa pajzzsal (kétkezes → 1 kézzel)

    def modok(self, ero=2):
        """Visszaadja fegyvermódonként (aktoronként) a végső harcértékeket."""
        h = FEGYVERHOSSZ[self.hossz]
        s = dict(SULY[self.suly])
        i = IDEA[self.idea]
        mat = ALAPANYAG[self.alapanyag]

        # idea és alapanyag súly-delta → eltolja a súly kategóriát (Sebesség/SP-re hat)
        # egyszerűsítés: a súly-delta közvetlenül a Sebesség-et és a súly-SP-t módosítja
        suly_delta = i.get("suly", 0) + mat.get("suly", 0)

        fejdarab = self.fejdarab_alap + (1 if self.penges else 0)
        fd = FEJDARAB[fejdarab]

        eredmeny = []
        for aktor_nev in self.aktorok:
            a = AKTOR[aktor_nev]
            tt = TIPUS_TV[a["t"]]

            # ── TÉ ──
            te = (h["tv"] + a["te"] + tt["te"] + fd["te"]
                  + (1 if self.penges else 0)      # pengés TÉ/VÉ +1
                  + i["tvc"] + mat["tvc"])
            # ── VÉ ──
            ve = (h["tv"] + a["ve"] + tt["ve"]
                  + (1 if self.penges else 0)
                  + i["tvc"] + mat["tvc"]
                  - 2 * self.hajlekony)            # hajlékony VÉ:-2
            # kat 9+ pengés → párbajban (1v1, fürge ellen) VÉ:0 — SZITUÁCIÓS,
            # nem a bázis VÉ. A bázisértékbe NEM építjük be (lásd doksi GAME).
            parbaj_alkalmatlan = (self.hossz >= 9 and self.penges)

            # ── SP ──
            szuro = a["t"] == "szúró"
            sp = h["sp"] + a["sp"] + mat["sp"] + i["sp"] + ero
            if self.penges:
                sp += 1
            if self.lancos:
                sp += 1
            # súly SP: szúrásnál NEM számít
            if not szuro:
                weff = s["sp"] + suly_delta  # súly-delta könnyíti → kevesebb súly-SP
                if self.nehez_mod == "sp":
                    sp += weff
                # ha nehéz_mod == átütés, a súly SP-je átütésbe megy (lásd lent)
            # forgatás: egykezes kényszer
            if self.egykezes_kenyszer:
                if h["forg"] == "másfélkezes":
                    sp -= 2
                elif h["forg"] == "kétkezes":
                    sp -= 4

            # ── Átütés ──
            at = a["at"] + mat.get("at", 0)
            if self.nehez_mod == "átütés" and not szuro:
                at += max(0, s["sp"])  # nehéz +1 / súlyos +2 átütésbe

            # ── Sebesség ── (magasabb = lassabb)
            seb = (h["seb"] + fd["seb"] + a["seb"] + s["seb"]
                   + (1 if self.lancos else 0)
                   + i["seb"] + suly_delta + self.hajlekony)

            eredmeny.append(dict(
                aktor=aktor_nev, tipus=a["t"],
                TE=te, VE=ve, SP=sp, AT=at, SEB=seb,
                parbaj_alkalmatlan=parbaj_alkalmatlan,
            ))
        return eredmeny


# ─────────────────────────────────────────────────────────────────────────────
# FEGYVER DEFINÍCIÓK (a doksi WORK blokkjai)
# ─────────────────────────────────────────────────────────────────────────────

FEGYVEREK = {
    "Kő": Fegyver("Kő", 0, ["buzogányfej-tompa"], fejdarab_alap=1, suly="könnyű", alapanyag="kő"),
    "Kés": Fegyver("Kés", 0, ["vágóél-íves-rövid", "pengehegy-apró"], penges=1, suly="könnyű"),
    "Tőr": Fegyver("Tőr", 1, ["vágóél-egyenes-rövid", "pengehegy-tőr"], penges=1, suly="átlagos"),
    "Kard, rövid": Fegyver("Kard, rövid", 2, ["vágóél-egyenes-rövid", "pengehegy-tőr"], penges=1),
    "Furkósbot": Fegyver("Furkósbot", 1, ["botvég"]),
    "Hosszú kard": Fegyver("Hosszú kard", 3, ["vágóél-egyenes-átlagos", "pengehegy-kard"], penges=1),
    "Kard, másfélkezes": Fegyver("Kard, másfélkezes", 5, ["vágóél-egyenes-átlagos", "pengehegy-kard"], penges=1),
    "Kard, kétkezes": Fegyver("Kard, kétkezes", 7, ["vágóél-egyenes-nagy", "pengehegy-kard"], penges=1, suly="nehéz"),
    "Rapír": Fegyver("Rapír", 3, ["pengehegy-kard", "vágóél-egyenes-átlagos"], penges=1),
    "Slan kard (Idea2)": Fegyver("Slan kard", 5, ["vágóél-íves-átlagos", "pengehegy-kard"], penges=1, idea=2),
    "Mara-Sequor (Idea3)": Fegyver("Mara-Sequor", 5, ["vágóél-íves-átlagos"], penges=1, idea=3, alapanyag="feketeacél"),
    "Alabárd": Fegyver("Alabárd", 9, ["vágóél-íves-nagy", "lándzsahegy-rövid-átlagos", "buzogányfej-tompa"],
                       fejdarab_alap=2, penges=1, suly="nehéz"),
    "Lándzsa": Fegyver("Lándzsa", 9, ["lándzsahegy-rövid-átlagos"], penges=1),
    "Wakizashi": Fegyver("Wakizashi", 2, ["vágóél-íves-rövid"], penges=1),
    "Naginata (Idea2)": Fegyver("Naginata", 12, ["vágóél-íves-nagy"], penges=1, idea=2),
    # balansz-referenciák
    "Kétkezes buzogány": Fegyver("Kétkezes buzogány", 7, ["buzogányfej-tompa"], suly="súlyos"),
}


# ─────────────────────────────────────────────────────────────────────────────
# TESZTEK
# ─────────────────────────────────────────────────────────────────────────────

def teszt_regresszio():
    """Ellenőrzi, hogy a modell reprodukálja a doksi GAME értékeit (Erő nélkül a doksi
    a nyers alapértékeket adja — a GAME blokkok Erő=0-val készültek a legtöbb helyen,
    de a doksi TÉ/VÉ Erőtől független)."""
    # (fegyver, aktor, várt TÉ, VÉ)  — a doksi GAME blokkjaiból, TÉ/VÉ Erő-független
    # FIGYELEM: a doksi thrust-módjai MÉG a régi (szúró TÉ/VÉ=0) szabállyal készültek.
    # Az új szúró TÉ+1/VÉ-1 szándékos eltérés — a vágó módokat ellenőrizzük regresszióra.
    vart = [
        ("Kő", "buzogányfej-tompa", 0, -2),
        ("Furkósbot", "botvég", 1, 1),
        ("Hosszú kard", "vágóél-egyenes-átlagos", 6, 6),
        ("Kard, kétkezes", "vágóél-egyenes-nagy", 10, 10),
        ("Naginata (Idea2)", "vágóél-íves-nagy", 14, 14),
        ("Alabárd", "vágóél-íves-nagy", 6, 10),
    ]
    print("=== REGRESSZIÓ (vágó/zúzó módok TÉ/VÉ, Erő-független) ===")
    ok = True
    for fnev, aktor, vte, vve in vart:
        f = FEGYVEREK[fnev]
        m = next(x for x in f.modok(ero=0) if x["aktor"].startswith(aktor.split("-")[0])
                 and x["aktor"] == aktor)
        jel = "✅" if (m["TE"] == vte and m["VE"] == vve) else "❌"
        if jel == "❌":
            ok = False
        print(f"  {jel} {fnev:24s} {aktor:24s} TÉ {m['TE']:>3}(≈{vte}) VÉ {m['VE']:>3}(≈{vve})")
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
        print(f"\n### {fnev}")
        for m in f.modok(ero=ero):
            par = "  [párbajra alkalmatlan: VÉ→0 fürge ellen]" if m["parbaj_alkalmatlan"] else ""
            print(f"  {m['aktor']:26s} ({m['tipus']:12s}) "
                  f"TÉ:{m['TE']:>3} VÉ:{m['VE']:>3} SP:{m['SP']:+d} "
                  f"Átütés:{m['AT']} Sebesség:{m['SEB']}{par}")
    print()


if __name__ == "__main__":
    teszt_regresszio()
    teszt_dump(ero=0)
    teszt_sebzes_matrix(ero=2)
    teszt_tempo(ero=2)
    teszt_tempo(ero=4)
