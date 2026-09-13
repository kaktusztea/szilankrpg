#!/usr/bin/env python3
"""Harci láz — EGYESÍTETT modell: fokozatlépkedés + harc, súlyozott balansz.

A bónusz-hangolás mércéje NEM az idealizált "mindig 3.fokon" eset, hanem a TÉNYLEGES
harci kimenet: minden körben a pillanatnyi fokozat bónuszai hatnak, a fokozat pedig
körről körre a lépkedés-mechanika szerint mozog (harci_laz_lepkedes.py logikája).

Így a súlyozás automatikus:
  - egy sweet-spot karakter (fix≈12) sokat a 2-3.fokon → mérsékelt, kontrollált nyereség,
  - a 4.fokon töltött idő extra bónuszt AD, de önveszélyt és virtuális-ÉP kockázatot is,
  - a kizökkenés (Előny+2 kudarc) a láz végét jelenti → onnantól bónusz nélkül harcol.

Harc-motor: harcszimulacio.spec.md §3-§6 (a selftest B1 validált). Pajzs nélküli lázas
feltételezés → VÉ-hátrány = 0 (a pajzs/taktika-vesztés nem ár, ha nincs pajzs).

Futtatás:  python3 code/balance/harci_laz_egyesitett.py
"""
import random
from statistics import mean
from collections import Counter

# ── Referencia harcos (selftest REF-B, spec §15) ────────────────────────────
REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, KE, OSZL, ENYH, REGEN = 47, 60, 11, 5, 40, 19, 10, 2, 1
CÉLSZÁM_KÖR = 18

d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10
CLAMP = lambda v, lo, hi: max(lo, min(hi, v))


def elony(szint, sides=20):
    rolls = [random.randint(1, sides) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def sebzes_elony(k):  return 2 if k == 20 else (1 if k >= 16 else 0)
def s_kat(u, o):      return 0 if u <= 0 else min(4, -(-u // o))
def te_lev(kat, e):   a = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[kat]; return 0 if a == 0 else min(0, a + e)


# ── Fokozat → bónuszkészlet (EZT hangoljuk) ──────────────────────────────────
# fok: (+TÉ, +SP, sebzés-Előny, virtuális ÉP).  fok 0 = nincs láz (kizökkent).
def keszlet_bonusz(keszlet, fok):
    return keszlet.get(fok, (0, 0, 0, 0))


# ── Lépkedés (harci_laz_lepkedes.py-ból) ─────────────────────────────────────
def k10_eh(szint):
    rolls = [random.randint(1, 10) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def valassz_mod(fok, cél):
    if fok < cél:
        return 2 if (cél - fok) >= 2 else 1
    if fok > cél:
        return -1
    return 1


def lepj(fok, kizokkent, fix, cél):
    """Egy kör lépkedés-frissítése. Visszaad: (uj_fok, uj_kizokkent)."""
    if kizokkent:
        return 0, True
    mod = valassz_mod(fok, cél)
    siker = fix + k10_eh(mod) >= CÉLSZÁM_KÖR
    if siker:
        return (4, False) if mod == -2 else (min(4, fok + 1), False)
    if mod == 2:
        return 0, True          # Előny+2 kudarc → kizökken
    return max(1, fok - 1), False


# ── Egyesített harc ──────────────────────────────────────────────────────────
class Harcos:
    def __init__(s, base_te, base_ve, sp, sfe, ep, valos_ep, sebz=0):
        s.base_te, s.base_ve, s.sp, s.sfe = base_te, base_ve, sp, sfe
        s.ep, s.valos_ep, s.sebz = ep, valos_ep, sebz
        s.used, s.vf, s.vs, s.el = 0, 0, 0, True
    ve = property(lambda s: max(0, s.base_ve - s.vf - s.vs))
    te = property(lambda s: s.base_te + te_lev(s_kat(s.used, OSZL), ENYH))


def tamad(h, c):
    r = d20()
    if h.te + r >= c.ve:
        bon = 3 * ((h.te + r - c.ve) // 5)
        sr = elony(sebzes_elony(r) + h.sebz)
        c.used += max(0, sr + h.sp + bon - c.sfe)
        c.vs += 3
        if c.used >= c.ep:
            c.el = False
    else:
        c.vf += 1 + k20T(r)


def kuzdelem(keszlet, fix, cél, max_kor=40):
    ref = Harcos(REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, REF_EP)
    fok, kizokkent = 1, False
    laz = Harcos(REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, REF_EP)  # base; fokonként újraszámolt
    fok_szamlalo = Counter()
    for _kor in range(1, max_kor + 1):
        fok, kizokkent = lepj(fok, kizokkent, fix, cél)
        fok_szamlalo[fok] += 1
        dTE, dSP, dSEBZ, vEP = keszlet_bonusz(keszlet, fok)
        # a lázas aktuális értékei a pillanatnyi fokozat szerint (VÉ-hátrány = 0, pajzs nélküli)
        laz.base_te = REF_TE + dTE
        laz.sp = REF_SP + dSP
        laz.sebz = dSEBZ
        laz.ep = laz.valos_ep + vEP
        for h in (laz, ref):
            if h.el:
                h.vf = max(0, h.vf - REGEN)
        for h in sorted([laz, ref], key=lambda x: -(KE + d20())):
            if not h.el:
                continue
            c = ref if h is laz else laz
            if c.el:
                tamad(h, c)
        if not laz.el:
            return 'REF', _kor, laz, fok_szamlalo
        if not ref.el:
            return 'LÁZ', _kor, laz, fok_szamlalo
    return 'D', max_kor, laz, fok_szamlalo


def meres(keszlet, fix, cél=3, n=20000, seed=20260913):
    random.seed(seed)
    wins, hosszak, virt_veszely = 0, [], 0
    fok_total = Counter()
    for _ in range(n):
        who, kor, laz, fsz = kuzdelem(keszlet, fix, cél)
        hosszak.append(kor)
        fok_total.update(fsz)
        if who == 'LÁZ':
            wins += 1
            if laz.used > laz.valos_ep:
                virt_veszely += 1
    tot = sum(fok_total.values())
    return dict(win=wins / n, hossz=mean(hosszak),
                virt=(virt_veszely / wins) if wins else 0,
                fok={f: fok_total[f] / tot for f in range(5)})


def blokk(cim, keszlet, fixek=(10, 12, 14)):
    print(f'=== {cim} ===')
    print(f"  {'karakter (fix)':<16} {'győz':>6} {'hossz':>6} {'virtÉP':>7}  fokozat-eloszlás (0/1/2/3/4)")
    for fix in fixek:
        r = meres(keszlet, fix)
        e = r['fok']
        print(f"  fix={fix:<12} {r['win']:>5.1%} {r['hossz']:>5.2f} {r['virt']:>6.1%}  "
              f"{e[0]:.0%}/{e[1]:.0%}/{e[2]:.0%}/{e[3]:.0%}/{e[4]:.0%}")
    print()


# Referencia baseline: nincs láz (mind fok üres) → tükör-harc, ~50%
print('=== BASELINE tükör-harc (nincs bónusz) ===')
r = meres({}, fix=12)
print(f"  győzelem {r['win']:.1%} (elvárt ~50%, mert a lázas ref-azonos ha nincs bónusz)\n")

# A) régi D javaslat (VE_HATRANY=0 mellett túl erősnek bizonyult)
D = {1: (3, 0, 0, 5), 2: (6, 2, 0, 8), 3: (8, 3, 1, 12), 4: (11, 5, 2, 18)}
blokk('A) régi D javaslat', D)

# B) visszafogott — a súlyozott (tényleges eloszlású) győzelmet nézzük, nem az idealizáltat
B = {1: (2, 0, 0, 4), 2: (4, 1, 0, 6), 3: (6, 2, 1, 9), 4: (8, 3, 1, 12)}
blokk('B) visszafogott javaslat', B)

# C) még óvatosabb felső vég
C = {1: (2, 0, 0, 3), 2: (3, 1, 0, 5), 3: (5, 2, 1, 8), 4: (7, 3, 1, 10)}
blokk('C) óvatos javaslat', C)
