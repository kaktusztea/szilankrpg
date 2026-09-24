#!/usr/bin/env python3
"""Fegyvergenerátor — kör-alapú harci szimulátor a fegyverek egymáshoz mérésére.

Cél: a `data/fegyvergenerator/fegyverek.generated.json` FEGYVEREIT valódi, kör-alapú
harcban (§3-§6 `harcszimulacio.spec.md`) mérjük össze, nem csak statikus sebzés/tempó
metrikával (az utóbbit a `fegyvergenerator_balansz.py` már adja).

A harci motor a `harcszimulacio_selftest.py` REFERENCIA implementációjának bővítése:
  - Fegyver-adapter: a generátor `módok[]` (aktoronkénti elsődleges/másodlagos sor)
    → a spec §6.5.1 sebzésjelleg×páncél mátrixa (a generátor SAJÁT, finomabb mátrixa,
    NEM a régi spec flat Z/S/V bónusza — a generátor fegyvereit a saját mátrixukkal kell
    mérni, különben a WORK-paraméterek elszakadnak a mért eredménytől).
  - Taktika / harci helyzet / státusz: a spec §7-§9 tábláinak Python leképezése (kézzel,
    mint a `harci_laz_*` szkriptek — a teljes JSON-vezérelt kiértékelés túl nagy scope
    egy hangolási eszközhöz).
  - Manőver: OPT-IN (a spec §13.8 óva int a bevonásától hangolási tesztekben — a
    varianciája nagyobb, mint a mérendő különbség), csak explicit jelölt forgatókönyvben.

NYITOTT DÖNTÉS ÁTVEZETVE (§13.1): k20T forrása a sikertelen támadás VÉ csökkentésénél
  KÖZÖS KOCKA (a már eldobott támadó k20-ából) — a user 2026-09-24 döntése. Ha ennek
  hatását vizsgálni kell, a `K20T_FUGGETLEN` konstanst állítsd True-ra.

Célválasztás politika (mindenki, csak REF/N:N/N:1 nem): "legveszélyesebb gyenge" —
  az élő, még harcképes ellenfelek közül a legkisebb ÉP-hátralévővel/VÉ-vel rendelkezőt
  célozza (nem a legerősebbet, de nem is vaktában/randomul).

Futtatás:  python3 code/balance/fegyvergenerator_harcszimulator.py
"""
import json
import pathlib
import random
import sys
from dataclasses import dataclass, field
from statistics import mean

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import fegyvergenerator_balansz as FB   # AKTOR, TIPUS_PANCEL, PANCEL, Fegyver, FEGYVER_RECORDS

DATA_TABLES = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "tables"

# ── NYITOTT DÖNTÉS kapcsoló (§13.1) ──────────────────────────────────────────
K20T_FUGGETLEN = False   # False = közös kocka (user döntés, 2026-09-24)

# ─────────────────────────────────────────────────────────────────────────────
# Adatbetöltés (data/tables/ — a webapp runtime JSON-jai, NEM a fegyvergenerátor)
# ─────────────────────────────────────────────────────────────────────────────

def _load_table(nev):
    with open(DATA_TABLES / nev, encoding="utf-8") as fh:
        return json.load(fh)


_HM_BONUSZ = {int(r["Harcmodor Szint"]): int(r["TÉ"]) for r in _load_table("harcmodor_kepzettsegek_bonuszok.json")}
_MF_BONUSZ = {b["fok"]: b for b in _load_table("konstansok.json")["mesterfegyver_bónuszok"]}
_MVV_BONUSZ = {b["fok"]: b["TÉ_büntetés_csökkentés"] for b in _load_table("konstansok.json")["merevvértviselet_bónuszok"]}
_PANCEL_MEREV = {s["struktúra"]: s["merev"] for s in _load_table("konstansok.json")["páncél_struktúrák"]}
_PANCEL_MEREV["csupasz"] = False

# Mátrix-osztály (a `fegyvergenerator_balansz.PANCEL`-ből) → (struktúra, sfé_fizikai, mgt).
# Az első struktúrát választjuk minden osztályból (pl. "merev" → pikkely, nem lemez) —
# konzisztens, determinisztikus, és a Profil páncél-mezőit ÖSSZHANGBAN tartja a
# sebzésjelleg×páncél mátrix-oldallal (l. §6.5.1 megjegyzés a modul docstringjében).
# EGYSZERŰSÍTÉS: nincs fémalapanyag-módosítás (a nyers struktúra sfé_fizikai/mgt megy).
_PANCEL_STRUKTURA_MGT = {s["struktúra"]: s["mgt"] for s in _load_table("konstansok.json")["páncél_struktúrák"]}


def pancel_profil_mezok(pancel_oszaly):
    """A mátrix-osztályból (csupasz/puha/bor/lanc/merev) konzisztens Profil páncél-mezők."""
    if pancel_oszaly == "csupasz":
        return dict(pancel_struktura="csupasz", pancel_sfe=0, pancel_mgt=0)
    for struktura, sfe, oszaly in FB.PANCEL:
        if oszaly == pancel_oszaly and struktura != "csupasz":
            return dict(pancel_struktura=struktura, pancel_sfe=sfe, pancel_mgt=_PANCEL_STRUKTURA_MGT[struktura])
    raise ValueError(f"Ismeretlen páncélosztály: {pancel_oszaly}")

d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10
CLAMP = lambda v, lo, hi: max(lo, min(hi, v))


def elony_hatrany(szint, oldalak=20):
    """§4: előnyHátrányDobás. szint<0 → Hátrány (MIN), szint>0 → Előny (MAX), 0 → 1 kocka."""
    db = abs(szint) + 1
    dobasok = [random.randint(1, oldalak) for _ in range(db)]
    return min(dobasok) if szint < 0 else max(dobasok)


def sebzes_elony(te_k20):
    """§5: a Támadó dobás k20-ából a Sebzésdobásra átvitt Előny."""
    if te_k20 == 20:
        return 2
    if te_k20 >= 16:
        return 1
    return 0


def s_kategoria(ep_hasznalt, oszlopmeret):
    """§3.1"""
    if ep_hasznalt <= 0:
        return 0
    return min(4, -(-ep_hasznalt // oszlopmeret))


def sebesules_te_levonas(kat, ft_enyhites):
    """§5.5"""
    alap = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[kat]
    if alap == 0:
        return 0
    return min(0, alap + ft_enyhites)


# ─────────────────────────────────────────────────────────────────────────────
# Fegyvergenerátor-adapter: generátor módok[] → spec-kompatibilis "fegyver mód"
# ─────────────────────────────────────────────────────────────────────────────

# fegyverhossz kategória → durva "Pengehossz" (pengeviszony §5.2). A generátor
# fegyverhossz kat. (0..12) egy MÁS skála, mint a régi 0/0.5/1/1.5/2/3/4/5 pengehossz —
# ez a leképezés BECSLÉS (nincs 1:1 kanonikus megfeleltetés), csak a pengeviszony
# elő/hátrány irányához kell, ne kezeld pontos fizikai mértékként.
_FEGYVERHOSSZ_TO_PENGEHOSSZ = {
    0: 0, 1: 0, 2: 0.5, 3: 1, 4: 1, 5: 1.5, 6: 1.5, 7: 2, 8: 2, 9: 3, 10: 3, 11: 4, 12: 5,
}

KATEGORIA_TO_HARCMODOR = {
    "közelharci": "Közelharc", "kardvívó": "Kardvívás", "romboló": "Rombolás",
    "lándzsavívó": "Lándzsavívás", "ostorharc": "Ostorharc",
}
# ⚠ §3.8 referencia-tábla — jelenleg NEM automatizált levezetés. A `Profil.harcmodor_szint`
# mezőt a hívónak KÉZZEL kell a fegyver kategóriájának megfelelő harcmodor szintjére állítania
# (a Harcos NEM ellenőrzi az összhangot). Ha a szkript több, eltérő kategóriájú fegyvert kap
# ugyanazon Profillal, ezt a táblát kell(ene) a validáláshoz/automatikus szint-választáshoz
# felhasználni — jelenlegi forgatókönyvekben minden teszt egy konzisztens profil+fegyver
# párost használ, ezért ez eddig nem okozott hibát, de a jövőbeli bővítésnél kötelező betartani.


@dataclass
class FegyverMod:
    """Egy fegyver EGY konkrét módja (aktor), kész a harci motorhoz."""
    nev: str
    kategoria: str
    te: int
    ve: int
    sp: int
    sebesseg: int
    atutes: int
    jelleg: str          # a generátor sebzésjelleg-neve (zúzó/szúró/vágó-egyenes/vágó-íves)
    erolimit: int
    pengehossz: float
    sebzes_hatrany: int   # 0 = elsődleges, -1 = másodlagos (Hátrány-1 sebzésdobásra)


def generator_fegyverek(ero=2):
    """Az ÖSSZES fegyvergenerátor-fegyver ÖSSZES módja, FegyverMod listaként (fegyver_név → [mód,...]).

    A `kategória` mező nélküli rekordok (pl. Naginata/Wakizashi self-test-fixture bejegyzések,
    amik csak a regressziós tesztre valók, nem valós katalógus-elemek) kimaradnak."""
    eredmeny = {}
    for rec in FB.FEGYVER_RECORDS:
        if "kategória" not in rec:
            continue
        f = FB.Fegyver(név=rec["név"], **rec["fegyver"])
        modok = []
        for m in f.modok(ero=ero):
            if m["forgatás"].endswith("· 1 kéz"):
                continue   # szituációs variáns, a mátrixba nem vesszük be alapból
            modok.append(FegyverMod(
                nev=rec["név"], kategoria=rec["kategória"],
                te=m["TE"], ve=m["VE"], sp=m["SP"], sebesseg=m["SEB"], atutes=m["AT"],
                jelleg=m["tipus"], erolimit=m["erőbónusz_limit"],
                pengehossz=_FEGYVERHOSSZ_TO_PENGEHOSSZ[f.hossz],
                sebzes_hatrany=m["sebzes_hatrany"],
            ))
        if modok:
            eredmeny[rec["név"]] = modok
    return eredmeny


ALL_WEAPON_MODES = generator_fegyverek(ero=2)


# ─────────────────────────────────────────────────────────────────────────────
# Harcos statblokk
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Profil:
    """Karakter-oldali bemenetek (a fegyver NÉLKÜL — azt a Harcos kapja meg)."""
    nev: str
    tsz: int
    ero: int; edzettseg: int; ugyesseg: int; gyorsasag: int
    hm_te: int; hm_ve: int
    harcmodor_szint: int          # a fegyver kategóriájának megfelelő HM szint
    fajdalomtures_szint: int = 0
    mesterfegyver_fok: int = 0    # a HASZNÁLT fegyverre
    merevvert_fok: int = 0
    harckeret_novles_fok: int = 0
    # páncél (egyszerűsített — csak a szimulációhoz kell mezők)
    pancel_struktura: str = "csupasz"   # csupasz|posztó|fegyverkabát|bőr|lánc/sodrony|pikkely|lemez
    pancel_sfe: int = 0
    pancel_mgt: int = 0
    pancel_sisak: bool = True           # §3.10, páncél_lefedettség = torzó 50 + sisak 10 + végtagvédettség×10
    pancel_vegtagvedettseg: int = 3     # 0..4 (REF-A minta: végtagvédettség 3 + sisak → 90% lefedettség)


def ep_max(edzettseg):
    return 28 + edzettseg * 4


def profil_szarmaztatott(p: Profil, mod: FegyverMod):
    """§3.3-3.7: a Profil + egy adott FegyverMod → TÉ/VÉ/SP/harckeret/támadások."""
    hm_bonusz = _HM_BONUSZ[CLAMP(p.harcmodor_szint, 0, 15)]
    mf = _MF_BONUSZ.get(p.mesterfegyver_fok, {"TÉ": 0, "VÉ": 0, "SP": 0})
    mv_csokk = _MVV_BONUSZ.get(p.merevvert_fok, 0)

    te_alap = 10 + p.ero + p.ugyesseg + p.gyorsasag + p.hm_te
    ve_alap = 30 + p.gyorsasag + p.ugyesseg + p.hm_ve

    merev = _PANCEL_MEREV.get(p.pancel_struktura, False)
    mv_buntetes = max(0, p.pancel_mgt - mv_csokk) if merev else 0

    # §3.10/§10.1: Merevvértviselet 3.fok VÉ+3, HA merev páncél ÉS lefedettség >= 70%
    lefedettseg = 50 + (10 if p.pancel_sisak else 0) + p.pancel_vegtagvedettseg * 10
    mv_ve_bonusz = 3 if (merev and p.merevvert_fok >= 3 and lefedettseg >= 70) else 0

    te = te_alap + hm_bonusz + mod.te + mf["TÉ"] - mv_buntetes
    ve = ve_alap + hm_bonusz + mod.ve + mf["VÉ"] + mv_ve_bonusz

    erolimit = 99 if mod.erolimit in (99, "", None) else mod.erolimit
    erobonusz = min(p.ero, erolimit) if erolimit >= 0 else 0
    sp = mod.sp + erobonusz + mf["SP"]

    harckeret = max(0, p.harcmodor_szint + p.gyorsasag - p.pancel_mgt + p.harckeret_novles_fok)
    tamadasok = 1 + harckeret // mod.sebesseg

    ft_enyhites = {4: 1, 6: 2, 8: 3, 10: 4, 11: 5, 12: 6, 13: 7, 14: 8, 15: 9}
    ft_e = 0
    for szint, enyh in sorted(ft_enyhites.items()):
        if p.fajdalomtures_szint >= szint:
            ft_e = enyh

    ep = ep_max(p.edzettseg)
    oszlopmeret = ep / 4

    return dict(TE=te, VE=ve, SP=sp, harckeret=harckeret, tamadasok=max(1, tamadasok),
                ep=ep, oszlopmeret=oszlopmeret, ft_enyhites=ft_e, sfe=p.pancel_sfe,
                erobonusz_limit=erolimit)


# ── Taktika / helyzet — ADATVEZÉRELT (data/tables/taktikak.json, harci_helyzetek.json) ──
# A korábbi, kézzel írt TAKTIKAK/HARCI_HELYZETEK dict-ek megszűntek — minden mező a valós
# webapp forrásból jön (`fegyvergenerator_data_adapter.py`). Az id-k a JSON id-jei (ékezetes,
# pl. "roham", "támadó", "belharci_helyzet"), NEM a korábbi ASCII-sított custom kulcsok.

import fegyvergenerator_data_adapter as DA


def netEH(*ertekek):
    """§5: nettó Előny/Hátrány összegzés, [-2,+2] clamp."""
    return CLAMP(sum(ertekek), -2, 2)


# Taktikák, amiknek van "első csere után lejár, VÉ csökk ×2" szabálya (§13.5) — ez a
# szabálykönyvben SZÖVEGES/megjegyzés-szintű infó (nem strukturált mező a taktikak.yaml-ban),
# ezért itt egy explicit lista jelzi, melyik taktika-id-kra vonatkozik.
CSAK_ELSO_CSERE_TAKTIKAK = {"roham", "öngyilkos_roham"}
SEBZ_TE_BUNTETES_KIKAPCSOL_TAKTIKAK = {"öngyilkos_roham"}
NEM_TAMAD_TAKTIKAK = {"teljes_védekezés", "fárasztás"}
SP_NULLA_TAKTIKAK = {"érintő"}
MIN_TAMADAS_TAKTIKAK = {"1_támadás": 2}


# ─────────────────────────────────────────────────────────────────────────────
# Harcos (kör közben mutálódó állapot)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Harcos:
    nev: str
    oldal: int
    profil: Profil
    mod: FegyverMod
    taktika: str = None       # a taktikak.json id-je (pl. "roham", "támadó"), None = nincs
    taktika_fok: int = 0
    helyzet: str = None       # a harci_helyzetek.json id-je (pl. "belharci_helyzet"), None = nincs
    statusz: str = None       # a statuszok.json "név" mezője (pl. "Eszmélet"), None = nincs
    statusz_fok: int = 0

    def __post_init__(self):
        sz = profil_szarmaztatott(self.profil, self.mod)
        self.szarmaztatott = sz
        self.ep_hasznalt = 0
        self.ve_faradas = 0
        self.ve_seb = 0
        self.el = True
        self.roham_elhasznalt = False

    @property
    def ep(self):
        return self.szarmaztatott["ep"]

    @property
    def s_kat(self):
        return s_kategoria(self.ep_hasznalt, self.szarmaztatott["oszlopmeret"])

    def taktika_mod(self):
        """Numerikus TÉ/VÉ/SP módosítók (fokozatos taktikáknál a `taktika_fok` szerint)."""
        if self.taktika is None:
            return dict(te=0, ve=0, sp=0)
        t = DA.taktika_modositok(self.taktika, self.taktika_fok)
        return dict(te=t.get("TÉ", 0), ve=CLAMP(t.get("VÉ", 0), -10, 10), sp=t.get("SP", 0))

    def taktika_hatas(self, cel):
        """A taktika strukturált `hatások[]` egy adott célra (pl. Visszafogott → sebzésdobás)."""
        if self.taktika is None:
            return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
        return DA.taktika_strukturalt_hatasok(self.taktika, cel=cel).get(
            cel, dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[]))

    def helyzet_hatas(self, cel):
        if self.helyzet is None:
            return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
        return DA.helyzet_hatasa(self.helyzet, cel)

    def statusz_hatas(self, cel):
        if self.statusz is None:
            return dict(eh=0, szorzo=1.0, letiltott=False, max_limit=None, szoveges=[])
        return DA.statusz_hatasa(self.statusz, self.statusz_fok, cel)

    def te_aktualis(self, tobbszoros_tamadas):
        tm = self.taktika_mod()
        lev = sebesules_te_levonas(self.s_kat, self.szarmaztatott["ft_enyhites"])
        if self.taktika in SEBZ_TE_BUNTETES_KIKAPCSOL_TAKTIKAK:
            lev = 0
        te = self.szarmaztatott["TE"] + lev + tm.get("te", 0)
        if tobbszoros_tamadas:
            te -= 3
        # §8: Belharci helyzet — hosszú fegyver (pengehossz > 0) TÉ override 0 (fegyver_override,
        # a helyzet_fegyver_override() adatból); rövid/belharcos fegyver (pengehossz <= 0)
        # Belharcos fortély 1.fok TÉ+2 (egyszerűsítés: a döntési AI-hoz kötött karakter
        # feltételezetten birtokolja 1.fokon — a fortély-adat maga NINCS ide bekötve)
        if self.helyzet == "belharci_helyzet":
            if self.mod.pengehossz > 0:
                te = 0
            else:
                te += 2
        return te

    def ve_aktualis(self):
        tm = self.taktika_mod()
        hh = self.helyzet_hatas("vé")   # pl. Takarásban → VÉ Előny+5 (a séma "vé"-nek nevezi)
        ve = self.szarmaztatott["VE"] + tm.get("ve", 0) + hh.get("eh", 0)
        ve -= self.ve_faradas + self.ve_seb
        if self.helyzet == "belharci_helyzet":
            if self.mod.pengehossz > 0:
                ve = 0
            else:
                ve += 2
        return max(0, ve)

    def tamadasok_effektiv(self):
        n = self.szarmaztatott["tamadasok"]
        sh = self.statusz_hatas("támadások_száma")
        if sh.get("max_limit") is not None:
            n = min(n, sh["max_limit"])
        return max(1, n)

    def kor_eleji_regeneracio(self, regen=1):
        self.ve_faradas = max(0, self.ve_faradas - regen)


# ─────────────────────────────────────────────────────────────────────────────
# Egy akció feloldása (§6.5)
# ─────────────────────────────────────────────────────────────────────────────

def pengeviszony(tamado: Harcos, vedo: Harcos):
    d = tamado.mod.pengehossz - vedo.mod.pengehossz
    if d >= 1:
        return "pengeelőny"
    if d <= -1:
        return "pengehátrány"
    return "alappenge"


def sikertelen_tamadas_ve_csokkentes(tamado: Harcos, vedo: Harcos, te_k20):
    alap_tab = {"pengehátrány": 0, "alappenge": 1, "pengeelőny": 2}
    pv = pengeviszony(tamado, vedo)
    if K20T_FUGGETLEN:
        k20t_ertek = k20T(d20())
    else:
        k20t_ertek = k20T(te_k20)
    alap = alap_tab[pv] + k20t_ertek

    # Meglepetés: "VÉ csökkentés: +2" — ez a helyzet HATÁSA az áldozat (vedo) oldalán,
    # a schema cél-neve "vé_csökkentés" (nem "vé"!)
    hh = tamado.helyzet_hatas("vé_csökkentés")
    alap += hh.get("eh", 0)

    vhh = vedo.helyzet_hatas("vé_veszteség")
    if vhh.get("szorzo", 1.0) != 1.0:
        alap *= vhh["szorzo"]
    if tamado.taktika in CSAK_ELSO_CSERE_TAKTIKAK:
        alap *= 2
        if not tamado.roham_elhasznalt:
            tamado.roham_elhasznalt = True

    vedo.ve_faradas += alap


def talalat_ve_csokkentes(vedo: Harcos):
    vedo.ve_seb += 3


def jelleg_bonusz(mod: FegyverMod, pancel_oszaly):
    return FB.tipusbonusz(mod.jelleg, pancel_oszaly)


def akcio_feloldas(tamado: Harcos, vedo: Harcos, pancel_oszaly, tobbszoros_tamadas):
    if tamado.taktika == "fárasztás":
        v = 3
        vedo.ve_faradas += v
        return "fárasztás", 0

    if tamado.taktika in NEM_TAMAD_TAKTIKAK:
        return "passzív", 0

    te_dobas_eh = netEH(tamado.helyzet_hatas("té_dobás").get("eh", 0),
                        tamado.statusz_hatas("té_dobás").get("eh", 0))
    k20 = elony_hatrany(te_dobas_eh, 20)
    ta = tamado.te_aktualis(tobbszoros_tamadas) + k20
    ve = vedo.ve_aktualis()

    # Hátulról támadás: "Pajzs VÉ nem számít" — szöveges hatás, a jelen modellben nincs
    # pajzs a Profilban, ezért ez jelenleg nem hat semmire (dokumentált egyszerűsítés).

    if ta < ve:
        sikertelen_tamadas_ve_csokkentes(tamado, vedo, k20)
        return "tévesztés", 0

    tuldobas = ta - ve
    tul_bonusz = 3 * (tuldobas // 5)

    seb_eh = CLAMP(sebzes_elony(k20) + tamado.mod.sebzes_hatrany, -2, 2)
    seb_k20 = elony_hatrany(seb_eh, 20)

    tm = tamado.taktika_mod()
    sp = seb_k20 + tamado.szarmaztatott["SP"] + tm.get("sp", 0) + tul_bonusz
    sp += jelleg_bonusz(tamado.mod, pancel_oszaly)
    if tamado.taktika in SP_NULLA_TAKTIKAK:
        sp = 0

    sfe = max(0, vedo.szarmaztatott["sfe"] - tamado.mod.atutes)
    vegso_sp = max(0, sp - sfe)

    if vegso_sp > 0:
        vedo.ep_hasznalt += vegso_sp
    talalat_ve_csokkentes(vedo)

    if tm.get("csak_elso_csere"):
        # §7: "Ha betalál: VÉ büntetése megszűnik és a visszatámadó nem kap +5/+7 SP-t"
        # — a roham a TALÁLAT pillanatában lejár (nem csak a kör végén), hogy a
        # rohamozó saját VÉ-je már a védő visszatámadásakor is büntetés nélküli legyen.
        tamado.roham_elhasznalt = True
        tamado.taktika = None
        tamado.taktika_fok = 0

    if vedo.ep_hasznalt >= vedo.ep:
        vedo.el = False

    return "találat", vegso_sp


# ─────────────────────────────────────────────────────────────────────────────
# Célválasztás — "legveszélyesebb gyenge": élő, harcképes ellenfelek közül a
# legkisebb hátralévő ÉP-vel/VÉ-vel rendelkezőt célozza.
# ─────────────────────────────────────────────────────────────────────────────

def celvalasztas(tamado: Harcos, csapatok):
    ellenfelek = [h for h in csapatok if h.oldal != tamado.oldal and h.el]
    if not ellenfelek:
        return None
    return min(ellenfelek, key=lambda h: (h.ep - h.ep_hasznalt, h.ve_aktualis()))


# ─────────────────────────────────────────────────────────────────────────────
# Kör-motor (§6)
# ─────────────────────────────────────────────────────────────────────────────

def kuzdelem(csapatok, pancel_oszaly="csupasz", max_kor=40, regen=1):
    for kor in range(1, max_kor + 1):
        for h in csapatok:
            if h.el:
                h.kor_eleji_regeneracio(regen)

        sorrend = sorted([h for h in csapatok if h.el], key=lambda h: -(d20()))

        max_tam = max((h.tamadasok_effektiv() for h in csapatok if h.el), default=1)
        for i in range(1, max_tam + 1):
            for h in sorrend:
                if not h.el:
                    continue
                if i > h.tamadasok_effektiv():
                    continue
                cel = celvalasztas(h, csapatok)
                if cel is None:
                    continue
                akcio_feloldas(h, cel, pancel_oszaly, h.tamadasok_effektiv() >= 2)

        # --- kör végi fázis: Roham/Öngyilkos roham csak az 1. oda-vissza csapás (§7, §13.5) ---
        for h in csapatok:
            if h.roham_elhasznalt and h.taktika in ("roham", "öngyilkos_roham"):
                h.taktika = None
                h.taktika_fok = 0

        oldalak_elo = {h.oldal for h in csapatok if h.el}
        if len(oldalak_elo) <= 1:
            gyoztes = next(iter(oldalak_elo)) if oldalak_elo else None
            return gyoztes, kor
    return "döntetlen", max_kor


# ─────────────────────────────────────────────────────────────────────────────
# SELF-TEST — a motor viselkedésének validálása a spec §15 elveivel (NEM a
# hitelesített `harcszimulacio_selftest.py` értékeivel, mert MÁS fegyverkészletet
# (fegyvergenerátor) és MÁS sebzésjelleg×páncél mátrixot használunk — a cél az,
# hogy a MOTOR (kör-feloldás, VÉ könyvelés, terminálás) helyesen működjön, nem
# az, hogy szám szerint egyezzen a régi fegyvertáblás referenciával.
# ─────────────────────────────────────────────────────────────────────────────

def _profil_referencia(nev, tsz=10, ero=3, edzettseg=3, ugyesseg=3, gyorsasag=3,
                        hm_te=15, hm_ve=13, harcmodor_szint=8, fajdalomtures_szint=7,
                        mesterfegyver_fok=2, merevvert_fok=3,
                        pancel_struktura="lánc/sodrony", pancel_sfe=5, pancel_mgt=14):
    return Profil(nev=nev, tsz=tsz, ero=ero, edzettseg=edzettseg, ugyesseg=ugyesseg,
                  gyorsasag=gyorsasag, hm_te=hm_te, hm_ve=hm_ve, harcmodor_szint=harcmodor_szint,
                  fajdalomtures_szint=fajdalomtures_szint, mesterfegyver_fok=mesterfegyver_fok,
                  merevvert_fok=merevvert_fok, pancel_struktura=pancel_struktura,
                  pancel_sfe=pancel_sfe, pancel_mgt=pancel_mgt)


def _profil_pribek(nev):
    return Profil(nev=nev, tsz=5, ero=2, edzettseg=1, ugyesseg=1, gyorsasag=1,
                  hm_te=7, hm_ve=6, harcmodor_szint=5, fajdalomtures_szint=0,
                  mesterfegyver_fok=0, merevvert_fok=0,
                  pancel_struktura="bőr", pancel_sfe=7, pancel_mgt=3)


def selftest():
    print("=== SELF-TEST — motor-validáció (fegyvergenerátor fegyverekkel) ===")
    ok = True
    mod = ALL_WEAPON_MODES["Kard, hosszú"][0]

    # T1: tükör-harc (azonos profil, azonos fegyver) → ~50/50, nem 0/100
    random.seed(2026)
    N = 3000
    wins = {0: 0, 1: 0}
    hosszak = []
    for _ in range(N):
        a = Harcos("A", 0, _profil_referencia("A"), mod)
        b = Harcos("B", 1, _profil_referencia("B"), mod)
        gy, kor = kuzdelem([a, b], pancel_oszaly="lanc")
        wins[gy] = wins.get(gy, 0) + 1
        hosszak.append(kor)
    aw = wins[0] / N
    t1 = abs(aw - 0.5) < 0.03
    print(f"  {'✔' if t1 else '✘ HIBA'}  T1  tükör-harc 1:1 → A győz {aw:.1%} (elvárt ~50%), hossz {mean(hosszak):.2f} kör")
    ok &= t1

    # T2: 1:3 azonos erő → a magányos veszítsen, nem véletlenszerű
    random.seed(2027)
    N = 500
    wins = {0: 0, 1: 0}
    for _ in range(N):
        a = Harcos("A", 0, _profil_referencia("A"), mod)
        bs = [Harcos(f"B{i}", 1, _profil_referencia(f"B{i}"), mod) for i in range(3)]
        gy, kor = kuzdelem([a] + bs, pancel_oszaly="lanc")
        wins[gy] = wins.get(gy, 0) + 1
    t2 = wins[0] / N < 0.05
    print(f"  {'✔' if t2 else '✘ HIBA'}  T2  1:3 azonos erő → magányos győz {wins[0]/N:.1%} (elvárt ~0%)")
    ok &= t2

    # T3: erős hős 1 gyengébb (pribék) ellen → a hős dominál
    random.seed(2028)
    N = 500
    wins = {0: 0, 1: 0}
    for _ in range(N):
        a = Harcos("Hős", 0, _profil_referencia("Hős"), mod)
        p = Harcos("Pribék", 1, _profil_pribek("Pribék"), mod)
        gy, kor = kuzdelem([a, p], pancel_oszaly="bor")
        wins[gy] = wins.get(gy, 0) + 1
    t3 = wins[0] / N > 0.9
    print(f"  {'✔' if t3 else '✘ HIBA'}  T3  hős vs 1 pribék → hős győz {wins[0]/N:.1%} (elvárt >90%)")
    ok &= t3

    # T4: hős egyre több pribék ellen → a győzelmi arány monoton csökken
    random.seed(2029)
    aranyok = []
    for n_pribek in (1, 3, 5, 8):
        N = 300
        wins0 = 0
        for _ in range(N):
            a = Harcos("Hős", 0, _profil_referencia("Hős"), mod)
            ps = [Harcos(f"P{i}", 1, _profil_pribek(f"P{i}"), mod) for i in range(n_pribek)]
            gy, kor = kuzdelem([a] + ps, pancel_oszaly="bor", max_kor=60)
            wins0 += gy == 0
        aranyok.append(wins0 / N)
    t4 = all(aranyok[i] >= aranyok[i + 1] for i in range(len(aranyok) - 1))
    print(f"  {'✔' if t4 else '✘ HIBA'}  T4  monoton csökkenő győzelem (1,3,5,8 pribék) → {[f'{a:.0%}' for a in aranyok]}")
    ok &= t4

    # T5: jobb SP-jű (erősebb) fegyver azonos profillal legyőzi a gyengébbet
    random.seed(2030)
    kes = ALL_WEAPON_MODES["Kés"][0]
    kard = ALL_WEAPON_MODES["Kard, hosszú"][0]
    N = 1000
    wins = {0: 0, 1: 0}
    for _ in range(N):
        a = Harcos("Kard", 0, _profil_referencia("A"), kard)
        b = Harcos("Kés", 1, _profil_referencia("B"), kes)
        gy, kor = kuzdelem([a, b], pancel_oszaly="lanc")
        wins[gy] = wins.get(gy, 0) + 1
    t5 = wins[0] / N > 0.55
    print(f"  {'✔' if t5 else '✘ HIBA'}  T5  Kard,hosszú vs Kés (azonos profil) → kard győz {wins[0]/N:.1%} (elvárt >55%)")
    ok &= t5

    print(f"\n{'MIND OK' if ok else 'HIBA VAN'}\n")
    return ok


# ─────────────────────────────────────────────────────────────────────────────
# FORGATÓKÖNYVEK — a fegyverek egymáshoz mérése
# ─────────────────────────────────────────────────────────────────────────────

REFERENCIA_FEGYVER = "Kard, hosszú"   # a mátrix-összevetés fix ellenfele (mint a tempó-teszt)


def scenario_1v1_mind_a_referencia_ellen(pancel_oszaly="lanc", n=800, seed=100):
    """1:1, azonos karakter-profil mindkét oldalon, csak a fegyver változik.
    Minden fegyvert a REFERENCIA_FEGYVER ellen mérünk (nem N² páros-mátrix)."""
    random.seed(seed)
    pm = pancel_profil_mezok(pancel_oszaly)
    ref_mod = ALL_WEAPON_MODES[REFERENCIA_FEGYVER][0]
    sorok = []
    for fnev, modok in ALL_WEAPON_MODES.items():
        mod = modok[0]   # elsődleges mód
        wins = 0
        hosszak = []
        for _ in range(n):
            a = Harcos(fnev, 0, _profil_referencia("A", **pm), mod)
            b = Harcos(REFERENCIA_FEGYVER, 1, _profil_referencia("B", **pm), ref_mod)
            gy, kor = kuzdelem([a, b], pancel_oszaly=pancel_oszaly)
            wins += gy == 0
            hosszak.append(kor)
        sorok.append((fnev, wins / n, mean(hosszak)))
    return sorted(sorok, key=lambda x: -x[1])


def scenario_tulero(fnev="Kard, hosszú", pancel_oszaly="bor", letszamok=(1, 2, 3, 4, 5, 8), n=400, seed=200):
    """Egy erős hős N gyengébb (pribék) ellen — a győzelmi arány letszám-görbéje."""
    random.seed(seed)
    pm = pancel_profil_mezok(pancel_oszaly)
    mod = ALL_WEAPON_MODES[fnev][0]
    sorok = []
    for letszam in letszamok:
        wins = 0
        hosszak = []
        for _ in range(n):
            a = Harcos("Hős", 0, _profil_referencia("Hős", **pm), mod)
            ps = [Harcos(f"P{i}", 1, _profil_pribek(f"P{i}"), mod) for i in range(letszam)]
            gy, kor = kuzdelem([a] + ps, pancel_oszaly=pancel_oszaly, max_kor=60)
            wins += gy == 0
            hosszak.append(kor)
        sorok.append((letszam, wins / n, mean(hosszak)))
    return sorok


def scenario_csapat_azonos_ero(fnev="Kard, hosszú", pancel_oszaly="lanc", letszamok=(1, 2, 3, 4), n=400, seed=300):
    """N:N azonos erejű csapatok, mindkét oldal azonos profillal/fegyverrel → ~50/50 minden létszámnál."""
    random.seed(seed)
    pm = pancel_profil_mezok(pancel_oszaly)
    mod = ALL_WEAPON_MODES[fnev][0]
    sorok = []
    for letszam in letszamok:
        wins = {0: 0, 1: 0}
        hosszak = []
        for _ in range(n):
            a_csapat = [Harcos(f"A{i}", 0, _profil_referencia(f"A{i}", **pm), mod) for i in range(letszam)]
            b_csapat = [Harcos(f"B{i}", 1, _profil_referencia(f"B{i}", **pm), mod) for i in range(letszam)]
            gy, kor = kuzdelem(a_csapat + b_csapat, pancel_oszaly=pancel_oszaly, max_kor=60)
            wins[gy] = wins.get(gy, 0) + 1
            hosszak.append(kor)
        sorok.append((letszam, wins[0] / n, mean(hosszak)))
    return sorok


def scenario_szituaciok(fnev="Kard, hosszú", n=600, seed=400):
    """Egy fegyver 1:1 tükör-harca, eltérő páncél / harci helyzet / taktika kombinációkban."""
    random.seed(seed)
    mod = ALL_WEAPON_MODES[fnev][0]
    variansok = [
        ("csupasz páncél, nincs helyzet/taktika",      "csupasz", None, None, 0),
        ("bőr páncél, nincs helyzet/taktika",          "bor",     None, None, 0),
        ("lánc páncél, nincs helyzet/taktika",         "lanc",    None, None, 0),
        ("merev páncél, nincs helyzet/taktika",        "merev",   None, None, 0),
        ("lánc páncél, A-nak Hátulról támadás",        "lanc",    "hátulról", None, 0),
        ("lánc páncél, A-nak Beszorított ellenfél",    "lanc",    "ellenfél_beszorított", None, 0),
        ("lánc páncél, A Roham taktikával",            "lanc",    None, "roham", 0),
        ("lánc páncél, A Támadó(2) taktikával",        "lanc",    None, "támadó", 2),
        ("lánc páncél, A Teljes Védekezés taktikával", "lanc",    None, "teljes_védekezés", 0),
    ]
    sorok = []
    for cimke, panc, helyzet, taktika, fok in variansok:
        pm = pancel_profil_mezok(panc)
        wins = 0
        hosszak = []
        for _ in range(n):
            a = Harcos("A", 0, _profil_referencia("A", **pm), mod, taktika=taktika, taktika_fok=fok,
                       helyzet=helyzet)
            b = Harcos("B", 1, _profil_referencia("B", **pm), mod)
            gy, kor = kuzdelem([a, b], pancel_oszaly=panc)
            wins += gy == 0
            hosszak.append(kor)
        sorok.append((cimke, wins / n, mean(hosszak)))
    return sorok


if __name__ == "__main__":
    if not selftest():
        raise SystemExit("Self-test hiba — a motor NEM megbízható, ne futtass forgatókönyveket.")

    print("=== 1:1 minden fegyver a referencia (%s) ellen — lánc páncél ===" % REFERENCIA_FEGYVER)
    for fnev, arany, hossz in scenario_1v1_mind_a_referencia_ellen():
        print(f"  {fnev:28s} győz {arany:>6.1%}  hossz {hossz:>5.2f}")

    print(f"\n=== TÚLERŐ: Hős ({REFERENCIA_FEGYVER}) N pribék ellen (bőr páncél) ===")
    for letszam, arany, hossz in scenario_tulero():
        print(f"  1:{letszam:<3d} hős győz {arany:>6.1%}  hossz {hossz:>5.2f}")

    print(f"\n=== N:N azonos erő, azonos fegyver ({REFERENCIA_FEGYVER}, lánc páncél) ===")
    for letszam, arany, hossz in scenario_csapat_azonos_ero():
        print(f"  {letszam}v{letszam}  A győz {arany:>6.1%}  hossz {hossz:>5.2f}")

    print(f"\n=== SZITUÁCIÓK ({REFERENCIA_FEGYVER}, A-oldal variál) ===")
    for cimke, arany, hossz in scenario_szituaciok():
        print(f"  {cimke:45s} A győz {arany:>6.1%}  hossz {hossz:>5.2f}")
