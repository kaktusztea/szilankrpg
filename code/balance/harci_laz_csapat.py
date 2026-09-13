#!/usr/bin/env python3
"""Harci láz — CSAPATKONTEXTUS: a 4.fok berserk önveszélye mint valós balansz-ár.

Az 1v1 modell (harci_laz_egyesitett.py) felülbecsüli a túlképzett (elszabaduló) karaktert,
mert a 4.fok önveszélye — "bárkit, barátot is megtámadsz, aki legközelebb van" — csak
CSAPATBAN büntet. Ez a modul azt méri ki.

Csapatfelállás: a lázas + (N-1) sima szövetséges  vs  M sima ellenség (mind referencia-statú).
A lázas cselekvése fokozatfüggő:
  fok 1-2: normál — ellenséget támad
  fok 3:   "bárki ELLENFELET" — random ellenséget támad (nem célozhat, de nem bánt barátot)
  fok 4:   BERSERK — a legközelebbi ÉLŐT támadja: barát VAGY ellenség (modell: random bárki).

Mérőszámok: a lázas CSAPATÁNAK győzelmi aránya + a baráti tűz (saját oldalra osztott sebzés).
Harc-motor: spec §3-§6 (selftest-validált). Lépkedés: harci_laz_lepkedes.py logika.

Futtatás:  python3 code/balance/harci_laz_csapat.py
"""
import random
from statistics import mean

REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, KE, OSZL, ENYH, REGEN = 47, 60, 11, 5, 40, 19, 10, 2, 1
CÉLSZÁM_KÖR = 18

d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10


def elony(szint, sides=20):
    rolls = [random.randint(1, sides) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def sebzes_elony(k): return 2 if k == 20 else (1 if k >= 16 else 0)
def s_kat(u, o):     return 0 if u <= 0 else min(4, -(-u // o))
def te_lev(k, e):    a = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[k]; return 0 if a == 0 else min(0, a + e)


def k10_eh(szint):
    rolls = [random.randint(1, 10) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def valassz_mod(fok, cél):
    if fok < cél: return 2 if (cél - fok) >= 2 else 1
    if fok > cél: return -1
    return 1


def lepj(fok, kizokkent, fix, cél):
    if kizokkent: return 0, True
    mod = valassz_mod(fok, cél)
    if fix + k10_eh(mod) >= CÉLSZÁM_KÖR:
        return (4, False) if mod == -2 else (min(4, fok + 1), False)
    if mod == 2: return 0, True
    return max(1, fok - 1), False


class H:
    def __init__(s, oldal, lazas=False, prof=None):
        s.oldal, s.lazas = oldal, lazas
        p = prof or dict(te=REF_TE, ve=REF_VE, sp=REF_SP, sfe=REF_SFE, ep=REF_EP)
        s.te0, s.ve0, s.sp, s.sfe = p['te'], p['ve'], p['sp'], p['sfe']
        s.ep, s.valos_ep, s.sebz = p['ep'], p['ep'], 0
        s.used, s.vf, s.vs, s.el = 0, 0, 0, True
        s.oszl = max(1, p['ep'] // 4)
        s.fok, s.kizokkent = (1, False) if lazas else (0, True)
    ve = property(lambda s: max(0, s.ve0 - s.vf - s.vs))
    te = property(lambda s: s.te0 + te_lev(s_kat(s.used, s.oszl), ENYH))


def tamad(h, c):
    r = d20()
    if h.te + r >= c.ve:
        bon = 3 * ((h.te + r - c.ve) // 5)
        sr = elony(sebzes_elony(r) + h.sebz)
        seb = max(0, sr + h.sp + bon - c.sfe)
        c.used += seb; c.vs += 3
        if c.used >= c.ep: c.el = False
        return seb
    else:
        c.vf += 1 + k20T(r); return 0


def celpont(h, sajat, ellen):
    """Kit támad? fok4 berserk → bárki élő (barát is); egyébként élő ellenség."""
    elo_ellen = [x for x in ellen if x.el]
    if h.lazas and h.fok == 4:
        mind = [x for x in sajat + ellen if x.el and x is not h]
        return random.choice(mind) if mind else None
    return random.choice(elo_ellen) if elo_ellen else None


def kuzdelem(keszlet, fix, cél, sajat_prof, ellen_prof, n_sajat=3, n_ellen=3, max_kor=60):
    sajat = [H(0, lazas=(i == 0), prof=(None if i == 0 else sajat_prof)) for i in range(n_sajat)]
    ellen = [H(1, prof=ellen_prof) for _ in range(n_ellen)]
    laz = sajat[0]
    baráti_tuz = 0
    for _kor in range(1, max_kor + 1):
        if laz.el:
            laz.fok, laz.kizokkent = lepj(laz.fok, laz.kizokkent, fix, cél)
            dTE, dSP, dSEBZ, vEP = keszlet.get(laz.fok, (0, 0, 0, 0))
            laz.te0 = REF_TE + dTE; laz.sp = REF_SP + dSP
            laz.sebz = dSEBZ; laz.ep = laz.valos_ep + vEP
        for h in sajat + ellen:
            if h.el: h.vf = max(0, h.vf - REGEN)
        for h in sorted([x for x in sajat + ellen if x.el], key=lambda x: -(KE + d20())):
            if not h.el: continue
            s_oldal = sajat if h.oldal == 0 else ellen
            e_oldal = ellen if h.oldal == 0 else sajat
            c = celpont(h, s_oldal, e_oldal)
            if c is None: continue
            seb = tamad(h, c)
            if h.lazas and c.oldal == 0:
                baráti_tuz += seb
        if not any(x.el for x in sajat): return 'ELLEN', _kor, baráti_tuz, laz
        if not any(x.el for x in ellen): return 'SAJÁT', _kor, baráti_tuz, laz
    return 'D', max_kor, baráti_tuz, laz


def meres(keszlet, fix, sajat_prof, ellen_prof, cél=3, n_sajat=3, n_ellen=3, n=15000, seed=20260913):
    random.seed(seed)
    wins, hosszak, btuz, virt = 0, [], [], 0
    for _ in range(n):
        who, kor, bt, laz = kuzdelem(keszlet, fix, cél, sajat_prof, ellen_prof, n_sajat, n_ellen)
        hosszak.append(kor); btuz.append(bt)
        if who == 'SAJÁT':
            wins += 1
            if laz.used > laz.valos_ep: virt += 1
    return dict(win=wins / n, hossz=mean(hosszak), btuz=mean(btuz),
                virt=(virt / wins if wins else 0))


# ── Ellenfél-profilok (data layer skálán kalibrálva) ─────────────────────────
REF    = dict(te=REF_TE, ve=REF_VE, sp=REF_SP, sfe=REF_SFE, ep=REF_EP)       # tükör
CSOCS  = dict(te=35, ve=48, sp=6, sfe=3, ep=32)   # gyenge, rosszul képzett, könnyű páncél
TANK   = dict(te=42, ve=62, sp=11, sfe=17, ep=48) # lemez+abbitacél: magas SFÉ/VÉ/ÉP, TÉ csökkent (MGT)


def forgatokonyv(cim, keszlet, sajat_prof, ellen_prof, n_sajat, n_ellen, fixek=(10, 12, 14, 16)):
    print(f'=== {cim} — {n_sajat}v{n_ellen} ===')
    # baseline: a lázas is sima harcos (a saját társak profiljával)
    base = meres({}, 1, sajat_prof, ellen_prof, n_sajat=n_sajat, n_ellen=n_ellen)
    print(f"  baseline (lázas is sima {sajat_prof and 'társ' or 'ref'}): csapat győz {base['win']:.1%}")
    print(f"  {'karakter (fix)':<14} {'csapat győz':>11} {'hossz':>6} {'baráti tűz':>11} {'virtÉP':>7}")
    for fix in fixek:
        r = meres(keszlet, fix, sajat_prof, ellen_prof, n_sajat=n_sajat, n_ellen=n_ellen)
        print(f"  fix={fix:<10} {r['win']:>10.1%} {r['hossz']:>5.1f} {r['btuz']:>10.1f} {r['virt']:>6.1%}")
    print()


# ELFOGADOTT készlet (E) — átvezetve a md/kepzettsegek.primer/harci/harci_laz.md-be (2026-09-13).
# fok: (+TÉ, +SP, sebzés-Előny, virtuális ÉP). A lázas társai referencia-statúak (kaland-csapat).
# FIGYELEM: az SP értékek (+1/+3/+5/+7) a JELENLEGI fegyver-SP skálához igazodnak. A folyamatban
# lévő Fegyvergenerátor megváltoztathatja a fegyver-SP tartományt → akkor ezeket újra kell hangolni.
B = {1: (2, 1, 0, 4), 2: (5, 3, 0, 6), 3: (7, 5, 1, 9), 4: (10, 7, 1, 12)}

if __name__ == '__main__':
    print('### ELFOGADOTT (E) KÉSZLET — több ellenfél-típus ellen ###')
    print('  (lázas + 2 referencia-társ; a "fix" = a lázas Önuralom+szint; sweet spot ~12-14)\n')

    forgatokonyv('TÜKÖR (referencia ellenfél)', B, REF, REF, 3, 3)
    forgatokonyv('CSŐCSELÉK (gyenge, túlerőben)', B, REF, CSOCS, 3, 6)
    forgatokonyv('TANK (páncélos, kevesebb de kemény)', B, REF, TANK, 3, 2)

