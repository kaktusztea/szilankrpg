#!/usr/bin/env python3
"""Fegyvergenerátor — Taktikai döntési AI (Harci taktikák / Harci helyzetek / Manőverek).

Cél: a `fegyvergenerator_harcszimulator.py` alap harci motorját bővíti egy körönkénti
DÖNTÉSI RÉTEGGEL — minden harcos minden körben felméri a helyzetet (saját/ellenfél fegyver-
hossz, VÉ/ÉP állapot, létszámarány) és SÚLYOZOTT VÉLETLENNEL választ taktikát vagy próbál
meg egy manővert. Ez válaszol arra a kérdésre, hogy a hosszú fegyverek (Pika/Lándzsa) 1:1
nyílt-terepi dominanciáját (l. STUDY.fegyvergenerator_harcszimulacio.md) a rendszer más
pillérei (Belharcba kerülés manőver, Mögékerülés, taktikaváltás) mennyire ellensúlyozzák.

FONTOS: a nyílt-terepi dominancia NEM hiba — a Szilánk rendszer taktikai/szituációs, egy
pikás szemtől szemben simán győz. A kérdés az, hogy egy rövidebb fegyveres, aki ÉL a
taktikai eszközökkel (belharcba kerülés, mögékerülés), mennyire tudja megfordítani.

Manőver-ellenpróba (EGYSZERŰSÍTETT, l. harcszimulacio.spec.md §3.13 + engine_spec §21.4):
  siker  ⟺  manőver_alap(támadó) + mp_fok + k10  >=  manőver_alap(ellenfél) + nehézség (+ helyzetfüggő_mód)
  manőver_alap = CEIL((HM_TÉ + HM_VÉ) / 10)  — statikus, a Profilból számolható
  mp_fok       = a harcos döntése, hány Manőver Pontot fektet be (0..4, a manőver_pont limitig)
  A §13.8 hangolási spec explicit óva int a manőverek bevonásától ALAP hangolási tesztekben
  (nagy variancia) — ez a modul EZT a varianciát vizsgálja SZÁNDÉKOSAN, külön forgatókönyvben.

Futtatás:  python3 code/balance/fegyvergenerator_taktikai_ai.py
"""
import json
import pathlib
import random
import sys
from statistics import mean

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import fegyvergenerator_harcszimulator as S

DATA_TABLES = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "tables"


def _load_table(nev):
    with open(DATA_TABLES / nev, encoding="utf-8") as fh:
        return json.load(fh)


# ─────────────────────────────────────────────────────────────────────────────
# Manőver-adapter (manoverek.json → egyszerűsített ellenpróba-adatok)
# ─────────────────────────────────────────────────────────────────────────────

_MANOVEREK_RAW = {m["id"]: m for m in _load_table("manoverek.json")}

# Csak azok a manőverek, amiket az AI ismer/próbálhat (l. NEXT STEPS a riportban: bővíthető).
MANOVER_NEHEZSEG = {mid: _MANOVEREK_RAW[mid]["nehézség"] for mid in
                    ("belharcba_kerülés", "mögékerülés", "lefegyverzés", "fegyvertörés")}


def manover_alap(profil: "S.Profil"):
    """§3.13: statikus, a HM_TÉ/HM_VÉ-ből — a Profilnak nincs külön HM_TÉ/HM_VÉ mezője,
    ezért a harcmodor-bónuszból közelítjük: manőver_alap ≈ CEIL((hm_te+hm_ve)/10)."""
    import math
    return math.ceil((profil.hm_te + profil.hm_ve) / 10)


def manover_pont(profil: "S.Profil", harcmodor_osszeg, limit=4):
    """§3.13 + md/066_02: CEIL(harcmodor_összeg × 2 / tsz), [0,10] clamp, a felhasználható
    mennyiség viszont Ellenpróbánként limitált: TÁMADÓ oldalon max 4 MP, VÉDEKEZŐ ("counter",
    a Nehézséget növeli) oldalon max 2 MP — ez a `limit` paraméter."""
    import math
    mp = math.ceil(harcmodor_osszeg * 2 / max(1, profil.tsz))
    return min(limit, max(0, min(10, mp)))


def probal_manover(mid, harcos, ellenfel, mp_fok, helyzetfuggo_mod=0, mp_ellenfel_fok=0):
    """Ellenpróba (md/066_04_manover_vegbevitele.md + md/066_02_manover_pontok.md):
        Manőver Alap(támadó) + MP_támadó(≤4) + k10
            >=
        Manőver Alap(ellenfél) + Nehézség + MP_ellenfél(≤2) (+ helyzetfüggő mód)
    A `mp_ellenfel_fok` a védekező fél opcionális "counter" MP-befektetése (max 2, a
    Nehézséget növeli) — a döntést az ő oldalán a döntési AI hozza meg, ELŐRE, a dobás előtt.
    Visszaad: (siker: bool, mértéke: int — a túldobás, nagy siker (+4) jelzéshez)."""
    alap_tamado = manover_alap(harcos.profil)
    alap_ellenfel = manover_alap(ellenfel.profil) if ellenfel is not None else 0
    k10 = random.randint(1, 10)
    eredmeny = alap_tamado + mp_fok + k10
    kell = alap_ellenfel + MANOVER_NEHEZSEG[mid] + helyzetfuggo_mod + mp_ellenfel_fok
    return eredmeny >= kell, eredmeny - kell


# ─────────────────────────────────────────────────────────────────────────────
# Helyzet-felmérés — mit "lát" a harcos a döntéshez
# ─────────────────────────────────────────────────────────────────────────────

def fegyver_kategoria_hossz(mod: "S.FegyverMod"):
    """Durva 'rövid/hosszú' besorolás a pengehossz-becslésből (l. adapter docstring)."""
    return mod.pengehossz


def belharcos_fegyver(mod: "S.FegyverMod"):
    """'Belharcba kerülés' manőver követelménye: rövid, Közelharc-kategóriájú fegyver."""
    return mod.pengehossz <= 0.5 and mod.kategoria == "közelharci"


def helyzet_felmeres(harcos: "S.Harcos", csapatok):
    """A döntéshez szükséges kontextus egy adott harcos szemszögéből."""
    ellenfelek = [h for h in csapatok if h.oldal != harcos.oldal and h.el]
    sajatok = [h for h in csapatok if h.oldal == harcos.oldal and h.el]
    cel = S.celvalasztas(harcos, csapatok)
    return dict(
        cel=cel,
        pengehossz_kulonbseg=(cel.mod.pengehossz - harcos.mod.pengehossz) if cel else 0,
        sajat_ep_arany=1 - harcos.ep_hasznalt / harcos.ep,
        tulero_ellene=len(ellenfelek) - len(sajatok),   # pozitív = a harcos van túlerőben ELLEN
        mar_belharcban=harcos.helyzet == "belharci_helyzet",
        ero_kulonbseg=(harcos.profil.ero - cel.profil.ero) if cel else 0,   # + = a harcos erősebb
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helyzetfüggő módosítók (manoverek.yaml → data/sources/manoverek.yaml)
# ─────────────────────────────────────────────────────────────────────────────
# A yaml "sorok[]" listáiból csak a szimulátorban ÉRTELMEZHETŐ (számszerűsíthető) kategóriák
# vannak bekötve — a "KM dönt" jellegű, tisztán narratív sorok (pl. Ellenfél háttal áll,
# Ellenfél pajzsa) kimaradnak, mert a Profil/Harcos modell nem tartalmaz pajzsot vagy
# hátrafordultság-állapotot. A pozitív érték NEHEZEBB, a negatív KÖNNYEBB Célszámot jelent
# (a Célszámhoz adódik hozzá, ahogy a manoverek.yaml/engine_spec §21.4 is leírja).

def belharcba_kerules_helyzetfuggo_mod(ctx):
    """'Belharc körülmények (KM)': Testméret/páncél/Erő előny -3, hátrány +3.
    Az Erő-különbséget használjuk közelítésként (testméret/páncél nincs a Profilban)."""
    if ctx["ero_kulonbseg"] > 0:
        return -3   # a harcos erősebb → könnyebb belharcba kényszerítenie az ellenfelet
    if ctx["ero_kulonbseg"] < 0:
        return 3    # a harcos gyengébb → nehezebb
    return 0


def mogekerules_helyzetfuggo_mod(ctx):
    """'Túlerő' kategória (manoverek.yaml): 1:2 → 0, 1:3 → -2, 1:4+ → -4 — az "Egy" a manővert
    próbáló, minél nagyobb a LÉTSZÁM-KÜLÖNBSÉG a helyszínen (akár ellene, akár mellette), annál
    könnyebb elvegyülni/hátba kerülni egy konkrét célnak. Közelítés: a harcos oldalán ÉS az
    ellenfél oldalán lévő összes fő aránya, tulero_ellene abszolút értékével."""
    aranyszam = abs(ctx["tulero_ellene"]) + 1   # "1:N" arány közelítése
    if aranyszam >= 4:
        return -4
    if aranyszam == 3:
        return -2
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# Védekező-oldali MP "counter" döntés (md/066_02_manover_pontok.md → Ellenfelhasználás)
# ─────────────────────────────────────────────────────────────────────────────
# A célpont (a manőver ÁLDOZATA) is befektethet max 2 MP-t a Nehézség növelésére, MIELŐTT
# a dobás megtörténne. Súlyozott véletlen: minél veszélyesebb rá a manőver sikere (pl. a
# Belharcba kerülés a hosszú fegyveresnek nagyon rossz, a rövid/belharcos fegyveresnek nem),
# annál nagyobb eséllyel fektet be a maximumig.

def ellenfel_mp_counter_dontes(cel: "S.Harcos", mid):
    """Visszaadja, a célpont hány MP-t fektet be counter-ként (0..2)."""
    veszelyesseg = 0.3   # alap, kis eséllyel mindig résen van
    if mid == "belharcba_kerülés" and cel.mod.pengehossz > 0:
        veszelyesseg = 0.8   # hosszú fegyveresnek katasztrofális, ha belharcba kerül
    if mid == "mögékerülés":
        veszelyesseg = 0.5

    mp_max = manover_pont(cel.profil, cel.szarmaztatott["TE"] // 3, limit=2)
    if mp_max <= 0:
        return 0
    # súlyozott véletlen: 0 MP / részleges / teljes befektetés
    r = random.random()
    if r > veszelyesseg:
        return 0
    if r > veszelyesseg / 2:
        return max(1, mp_max // 2)
    return mp_max


# ─────────────────────────────────────────────────────────────────────────────
# Döntési szabályok — súlyozott véletlen (NEM determinisztikus if-else)
# ─────────────────────────────────────────────────────────────────────────────
# Minden szabály egy (feltétel, akció, súly) hármas. A feltétel eldönti, aktiválható-e;
# a súly relatív eséllyel versenyez a többi aktiválható szabállyal (nem fix %, hanem
# egymáshoz viszonyított arány) — így könnyen bővíthető/hangolható tábla, nem kódba
# ágyazott elágazás-rengeteg.

def dontesi_szabalyok(harcos: "S.Harcos", ctx):
    """Visszaadja az adott körben ELÉRHETŐ (feltétel, akció-fn, súly) szabályokat."""
    szabalyok = []

    # Ha jelentős pengehátrányban van (ellenfél fegyvere hosszabb) ÉS a saját fegyvere
    # belharcos-alkalmas ÉS még nincs belharcban → próbálja a Belharcba kerülést.
    if (ctx["pengehossz_kulonbseg"] >= 1.5 and belharcos_fegyver(harcos.mod)
            and not ctx["mar_belharcban"]):
        szabalyok.append(("belharcba_kerülés", 3.0))

    # Ha túlerőben van ELLENE (több ellenfél, mint szövetséges) → próbáljon Mögékerülést,
    # hogy hátulról-bónuszt szerezzen (vagy egy szövetségesének).
    if ctx["tulero_ellene"] >= 1:
        szabalyok.append(("mögékerülés", 1.5))

    # Alap taktikai hajlandóság — mindig elérhető, súlyozva az állapottal:
    if ctx["sajat_ep_arany"] < 0.3:
        szabalyok.append(("taktika:teljes_védekezés", 3.0))
        szabalyok.append(("taktika:kiváró", 1.5))
    elif ctx["sajat_ep_arany"] > 0.7 and not ctx["mar_belharcban"]:
        szabalyok.append(("taktika:támadó:1", 1.0))

    szabalyok.append(("nincs_valtas", 1.0))   # mindig van "marad a jelenlegi" opció
    return szabalyok


def valassz_dontes(harcos: "S.Harcos", ctx):
    szabalyok = dontesi_szabalyok(harcos, ctx)
    total = sum(w for _, w in szabalyok)
    r = random.uniform(0, total)
    akku = 0
    for akcio, w in szabalyok:
        akku += w
        if r <= akku:
            return akcio
    return "nincs_valtas"


def alkalmaz_dontes(harcos: "S.Harcos", akcio, ctx):
    """A választott akciót érvényesíti a Harcos állapotán (taktika/helyzet váltás,
    vagy manőver-próba azonnali, egyszeri hatással a jelenlegi körre)."""
    if akcio == "nincs_valtas":
        return None
    if akcio.startswith("taktika:"):
        resz = akcio.split(":")
        nev = resz[1]
        fok = int(resz[2]) if len(resz) > 2 else 0
        harcos.taktika = None if nev == "nincs" else nev
        harcos.taktika_fok = fok
        return f"taktika→{nev}"
    if akcio in MANOVER_NEHEZSEG:
        mp = manover_pont(harcos.profil, harcos.szarmaztatott["TE"] // 3, limit=4)   # közelítés, ha nincs explicit harcmodor-összeg
        mp_fok = min(4, mp)
        if akcio == "belharcba_kerülés":
            szit_mod = belharcba_kerules_helyzetfuggo_mod(ctx)
        elif akcio == "mögékerülés":
            szit_mod = mogekerules_helyzetfuggo_mod(ctx)
        else:
            szit_mod = 0
        mp_ellenfel_fok = ellenfel_mp_counter_dontes(ctx["cel"], akcio) if ctx["cel"] is not None else 0
        siker, tuldobas = probal_manover(akcio, harcos, ctx["cel"], mp_fok,
                                          helyzetfuggo_mod=szit_mod, mp_ellenfel_fok=mp_ellenfel_fok)
        if siker and akcio == "belharcba_kerülés":
            # a Belharc megosztott, fizikai szituáció — mindkét fél helyzete belharci_helyzet lesz
            harcos.helyzet = "belharci_helyzet"
            if ctx["cel"] is not None:
                ctx["cel"].helyzet = "belharci_helyzet"
            return f"belharcba_kerülés✔ (ellenfél MP:{mp_ellenfel_fok})" if mp_ellenfel_fok else "belharcba_kerülés✔"
        if siker and akcio == "mögékerülés":
            harcos.helyzet = "hátulról"
            return f"mögékerülés✔ (ellenfél MP:{mp_ellenfel_fok})" if mp_ellenfel_fok else "mögékerülés✔"
        return f"{akcio}✘ (ellenfél MP:{mp_ellenfel_fok})" if mp_ellenfel_fok else f"{akcio}✘"
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Kör-motor bővítve döntési fázissal
# ─────────────────────────────────────────────────────────────────────────────

def kuzdelem_ai(csapatok, pancel_oszaly="csupasz", max_kor=40, regen=1, naplo=None):
    """A `fegyvergenerator_harcszimulator.kuzdelem` bővítése: minden kör elején minden
    élő harcos dönt (taktika-váltás VAGY manőver-próba), MIELŐTT a támadási körök futnak."""
    for kor in range(1, max_kor + 1):
        for h in csapatok:
            if h.el:
                h.kor_eleji_regeneracio(regen)

        for h in csapatok:
            if not h.el:
                continue
            ctx = helyzet_felmeres(h, csapatok)
            akcio = valassz_dontes(h, ctx)
            eredmeny = alkalmaz_dontes(h, akcio, ctx)
            if naplo is not None and eredmeny:
                naplo.append((kor, h.nev, eredmeny))

        sorrend = sorted([h for h in csapatok if h.el], key=lambda h: -(S.d20()))

        max_tam = max((h.tamadasok_effektiv() for h in csapatok if h.el), default=1)
        for i in range(1, max_tam + 1):
            for h in sorrend:
                if not h.el:
                    continue
                if i > h.tamadasok_effektiv():
                    continue
                cel = S.celvalasztas(h, csapatok)
                if cel is None:
                    continue
                S.akcio_feloldas(h, cel, pancel_oszaly, h.tamadasok_effektiv() >= 2)

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
# SELF-TEST
# ─────────────────────────────────────────────────────────────────────────────

def selftest():
    print("=== SELF-TEST — Taktikai AI validáció ===")
    ok = True
    import random

    # T1: rövid, belharcos fegyver (Tőr) az AI-val jelentősen jobban teljesít hosszú
    # fegyver (Pika) ellen, mint AI nélkül (a Belharcba kerülés kompenzálja a hátrányt).
    tor = S.ALL_WEAPON_MODES["Tőr"][0]
    pika = S.ALL_WEAPON_MODES["Pika, keskeny hegyű"][0]
    N = 600

    random.seed(600)
    wins_alap = 0
    for _ in range(N):
        a = S.Harcos("Toros", 0, S._profil_referencia("Toros"), tor)
        b = S.Harcos("Pikas", 1, S._profil_referencia("Pikas"), pika)
        gy, kor = S.kuzdelem([a, b], pancel_oszaly="lanc")
        wins_alap += gy == 0

    random.seed(600)
    wins_ai = 0
    for _ in range(N):
        a = S.Harcos("Toros", 0, S._profil_referencia("Toros"), tor)
        b = S.Harcos("Pikas", 1, S._profil_referencia("Pikas"), pika)
        gy, kor = kuzdelem_ai([a, b], pancel_oszaly="lanc")
        wins_ai += gy == 0

    t1 = wins_ai > wins_alap + N * 0.3   # jelentős, nem zaj-szintű javulás
    print(f"  {'✔' if t1 else '✘ HIBA'}  T1  Tőr vs Pika: alap {wins_alap/N:.1%} → AI-val {wins_ai/N:.1%} (a Belharcba kerülés kompenzál)")
    ok &= t1

    # T2: hosszú fegyveres (Pika), aki NEM tud belharcba kerülni (kategóriája nem
    # 'közelharci'), az AI se nem ront, se nem javít drasztikusan a saját eredményén,
    # amikor ELLENFELE próbálkozik — csak a defenzívát méri, ez determinisztikusan a
    # T1-ben már bizonyított, itt csak azt ellenőrizzük, hogy AI nélkül/AI-val a tükör-harc
    # (két Pikás egymás ellen, senki se tud belharcba kerülni) nem torzul.
    random.seed(601)
    wins_tukör = 0
    for _ in range(N):
        a = S.Harcos("A", 0, S._profil_referencia("A"), pika)
        b = S.Harcos("B", 1, S._profil_referencia("B"), pika)
        gy, kor = kuzdelem_ai([a, b], pancel_oszaly="lanc")
        wins_tukör += gy == 0
    t2 = abs(wins_tukör / N - 0.5) < 0.08
    print(f"  {'✔' if t2 else '✘ HIBA'}  T2  Pika vs Pika (AI-val, tükör) → A győz {wins_tukör/N:.1%} (elvárt ~50%, senki se tud belharcba kerülni)")
    ok &= t2

    print(f"\n{'MIND OK' if ok else 'HIBA VAN'}\n")
    return ok


# ─────────────────────────────────────────────────────────────────────────────
# FORGATÓKÖNYV — rövid/belharcos fegyverek a Pika ellen, AI-val vs AI nélkül
# ─────────────────────────────────────────────────────────────────────────────

def scenario_belharc_ellensuly(ellenfel_fegyver="Pika, keskeny hegyű", pancel_oszaly="lanc", n=600, seed=700):
    """Belharcos-alkalmas (rövid, közelharci) fegyverek: mennyit nyer a döntési AI
    (Belharcba kerülés próbálkozás) az alap (helyzet-mentes) motorhoz képest."""
    random.seed(seed)
    ellenfel_mod = ALL_WEAPON_MODES.get(ellenfel_fegyver) if False else S.ALL_WEAPON_MODES[ellenfel_fegyver][0]
    sorok = []
    for fnev, modok in S.ALL_WEAPON_MODES.items():
        mod = modok[0]
        if not belharcos_fegyver(mod):
            continue
        wins_alap = 0
        wins_ai = 0
        for _ in range(n):
            a = S.Harcos(fnev, 0, S._profil_referencia("A"), mod)
            b = S.Harcos(ellenfel_fegyver, 1, S._profil_referencia("B"), ellenfel_mod)
            gy, _ = S.kuzdelem([a, b], pancel_oszaly=pancel_oszaly)
            wins_alap += gy == 0
        for _ in range(n):
            a = S.Harcos(fnev, 0, S._profil_referencia("A"), mod)
            b = S.Harcos(ellenfel_fegyver, 1, S._profil_referencia("B"), ellenfel_mod)
            gy, _ = kuzdelem_ai([a, b], pancel_oszaly=pancel_oszaly)
            wins_ai += gy == 0
        sorok.append((fnev, wins_alap / n, wins_ai / n))
    return sorted(sorok, key=lambda x: -(x[2] - x[1]))


if __name__ == "__main__":
    if not selftest():
        raise SystemExit("Self-test hiba a taktikai AI-ban.")

    print(f"=== Belharcba kerülés ellensúly-hatása (ellenfél: Pika, keskeny hegyű, lánc páncél) ===")
    print(f"  {'fegyver':<26s} {'alap győz':>10s} {'AI-val győz':>12s} {'javulás':>10s}")
    for fnev, alap, ai in scenario_belharc_ellensuly():
        print(f"  {fnev:<26s} {alap:>9.1%} {ai:>11.1%} {ai-alap:>+9.1%}")
