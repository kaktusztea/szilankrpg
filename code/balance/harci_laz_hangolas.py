#!/usr/bin/env python3
"""Harci láz fokozat-bónuszok balansz hangolása.

A harcszimulacio.spec.md §3-§6 REF-B motorjára épül (lásd harcszimulacio_selftest.py,
B1 validált: 1v1 tükör-harc → 50% / 3,9 kör). Egy Harci láz-os PC-t mérünk egy azonos
REFERENCIA harcos ellen (TÉ47/VÉ60/SP11/SFÉ5/ÉP40, oszlopméret 10).

A fokozat egy PC-nek ad: +TÉ (támadás), +SP (sebzés), sebzés-Előny szint, virtuális ÉP.
CSERÉBE (a szabály ára): nincs pajzs-VÉ, harci taktikák tiltottak (kivéve Roham), a
virtuális ÉP a harc végén ELTŰNIK → ha a valódi ÉP alá csúszott, haldoklik.

A modell két árat számszerűsít:
  1) VÉ_hátrány: a Harci láz-os elveszít egy tipikus védekezési előnyt (pajzs/taktika).
     A referencia harcos ezt megtarthatja. Konzervatívan: a lázas VÉ-je csökken.
  2) virtuális ÉP kockázat: a győzelemkor mért "valódi ÉP alatti" állapot arányát mérjük
     (ha a lázas a valódi ÉP-jét meghaladó sebet vitt, a harc után haldoklana).

Futtatás:  python3 code/balance/harci_laz_hangolas.py
"""
import random
from statistics import mean

# ── Referencia harcos (a selftest REF-B konstansai, spec §15) ────────────────
REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, KE, OSZL, ENYH, REGEN = 47, 60, 11, 5, 40, 19, 10, 2, 1

d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10
CLAMP = lambda v, lo, hi: max(lo, min(hi, v))


def elony(szint, sides=20):
    rolls = [random.randint(1, sides) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def sebzes_elony(k):  return 2 if k == 20 else (1 if k >= 16 else 0)
def s_kat(used, oszl): return 0 if used <= 0 else min(4, -(-used // oszl))
def te_lev(kat, enyh): a = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[kat]; return 0 if a == 0 else min(0, a + enyh)


class Harcos:
    """Egy fél. A lázas fél kap fokozat-bónuszokat; virtuális ÉP a max keretet emeli."""
    def __init__(self, oldal, te, ve, sp, sfe, ep, valos_ep, sebz_elony=0):
        self.oldal, self.base_te, self.base_ve = oldal, te, ve
        self.sp, self.sfe, self.ep, self.valos_ep = sp, sfe, ep, valos_ep
        self.sebz_elony = sebz_elony
        self.used, self.vf, self.vs, self.el = 0, 0, 0, True

    @property
    def ve(self): return max(0, self.base_ve - self.vf - self.vs)

    @property
    def te(self): return self.base_te + te_lev(s_kat(self.used, OSZL), ENYH)


def kuzdelem(mk_lazas, max_kor=40):
    """mk_lazas: a lázas fél Harcos-gyártó paramétercsomagja (dict)."""
    lazas = Harcos(0, mk_lazas['te'], mk_lazas['ve'], mk_lazas['sp'], REF_SFE,
                   mk_lazas['ep'], mk_lazas['valos_ep'], mk_lazas['sebz_elony'])
    ref = Harcos(1, REF_TE, REF_VE, REF_SP, REF_SFE, REF_EP, REF_EP)
    A_, B_ = [lazas], [ref]
    for _kor in range(1, max_kor + 1):
        for h in A_ + B_:
            if h.el:
                h.vf = max(0, h.vf - REGEN)
        for h in sorted([x for x in A_ + B_ if x.el], key=lambda x: -(KE + d20())):
            if not h.el:
                continue
            ell = [x for x in (B_ if h.oldal == 0 else A_) if x.el]
            if not ell:
                break
            c = ell[0]
            r = d20()
            if h.te + r >= c.ve:
                bon = 3 * ((h.te + r - c.ve) // 5)
                sr = elony(sebzes_elony(r) + h.sebz_elony)
                c.used += max(0, sr + h.sp + bon - c.sfe)
                c.vs += 3
                if c.used >= c.ep:
                    c.el = False
            else:
                c.vf += 1 + k20T(r)
        if not lazas.el:
            return 'REF', _kor, lazas
        if not ref.el:
            return 'LÁZ', _kor, lazas
    return 'D', max_kor, lazas


def meres(te, sp, sebz_elony, virt_ep, ve_hatrany, n=20000, seed=20260913):
    """Egy fokozat-bónuszkészlet kimérése. ve_hatrany: a pajzs/taktika-vesztés VÉ ára."""
    random.seed(seed)
    valos_ep = REF_EP
    mk = dict(te=REF_TE + te, ve=REF_VE - ve_hatrany, sp=REF_SP + sp,
              sebz_elony=sebz_elony, ep=valos_ep + virt_ep, valos_ep=valos_ep)
    wins, hosszak, virt_veszely = 0, [], 0
    for _ in range(n):
        who, kor, lazas = kuzdelem(mk)
        hosszak.append(kor)
        if who == 'LÁZ':
            wins += 1
            # A harc végén a virtuális keret eltűnik: ha a valódi ÉP fölé sebződött → haldoklás.
            if lazas.used > lazas.valos_ep:
                virt_veszely += 1
    return dict(win=wins / n, hossz=mean(hosszak),
                virt_veszely=(virt_veszely / wins) if wins else 0.0)


# ── Hangolási jelöltek ───────────────────────────────────────────────────────
# ve_hatrany: a láz elveszíti a pajzs/taktika védelmét. Tipikus pajzs-VÉ ~ +8..+12,
# taktikai VÉ változó → konzervatív közép: 8. A referencia ezt megtartja.
VE_HATRANY = 8

print('=== BASELINE (nincs Harci láz, tükör-harc a VÉ-hátránnyal) ===')
b = meres(te=0, sp=0, sebz_elony=0, virt_ep=0, ve_hatrany=VE_HATRANY)
print(f"  győzelem {b['win']:.1%}  |  hossz {b['hossz']:.2f} kör")
print(f"  (a lázas VÉ-hátránnyal indul, ezért <50%; a fokozat-bónuszok ezt fordítják meg)\n")


def blokk(cim, jeloltek):
    print(f'=== {cim} ===')
    print(f"  {'fokozat':<28} {'győz':>7} {'hossz':>7} {'virtÉP-kock':>12}")
    for nev, p in jeloltek:
        r = meres(**p, ve_hatrany=VE_HATRANY)
        print(f"  {nev:<28} {r['win']:>6.1%} {r['hossz']:>6.2f}  {r['virt_veszely']:>11.1%}")
    print()


# A) A JELENLEGI ad-hoc értékek (md): +5/+10/+15/+20 TÉ ÉS SP, 3-4. fok sebzés Előny+1
blokk('A) JELENLEGI ad-hoc (md) — várhatóan OP', [
    ('1.fok +5TÉ +5SP',        dict(te=5,  sp=5,  sebz_elony=0, virt_ep=5)),
    ('2.fok +10TÉ +10SP',      dict(te=10, sp=10, sebz_elony=0, virt_ep=10)),
    ('3.fok +15TÉ +15SP EÜ+1', dict(te=15, sp=15, sebz_elony=1, virt_ep=15)),
    ('4.fok +20TÉ +20SP EÜ+1', dict(te=20, sp=20, sebz_elony=1, virt_ep=20)),
])

# B) JAVASLAT — TÉ a rendszer taktika/fortély skáláján (Roham+4, Öngyilkos+5, max fortély ~+9..12),
#    SP mérsékelt (fegyver SP ~ -3..+4 → a láz ne adjon egy plusz fegyvernyinél többet),
#    sebzés-Előny csak a felső fokokon, virtuális ÉP fokozatosan ~fél..egy oszlopnyi.
blokk('B) JAVASLAT v1', [
    ('1.fok +3TÉ +0SP  +5vÉP',       dict(te=3,  sp=0, sebz_elony=0, virt_ep=5)),
    ('2.fok +6TÉ +2SP  +10vÉP',      dict(te=6,  sp=2, sebz_elony=0, virt_ep=10)),
    ('3.fok +9TÉ +4SP EÜ+1 +15vÉP',  dict(te=9,  sp=4, sebz_elony=1, virt_ep=15)),
    ('4.fok +12TÉ +6SP EÜ+2 +20vÉP', dict(te=12, sp=6, sebz_elony=2, virt_ep=20)),
])

# C) JAVASLAT v2 — kicsit visszafogottabb felső vég (ha B4 túl erős)
blokk('C) JAVASLAT v2 (visszafogottabb csúcs)', [
    ('1.fok +2TÉ +0SP  +4vÉP',       dict(te=2,  sp=0, sebz_elony=0, virt_ep=4)),
    ('2.fok +5TÉ +2SP  +8vÉP',       dict(te=5,  sp=2, sebz_elony=0, virt_ep=8)),
    ('3.fok +8TÉ +3SP EÜ+1 +12vÉP',  dict(te=8,  sp=3, sebz_elony=1, virt_ep=12)),
    ('4.fok +10TÉ +5SP EÜ+1 +16vÉP', dict(te=10, sp=5, sebz_elony=1, virt_ep=16)),
])

# D) VÉGLEGES javaslat — 3.fok az "optimális" (erős, de nem biztos ~75%), 4.fok kockázatos
#    csúcs (~88%) magas virtuális-ÉP kockázattal. SP a fegyverskálán belül (max +5),
#    sebzés-Előny csak 3-4. fokon (a berserk "vakon csapkod, de erősen" jellege).
blokk('D) VÉGLEGES javaslat', [
    ('1.fok +3TÉ +0SP  +5vÉP',       dict(te=3,  sp=0, sebz_elony=0, virt_ep=5)),
    ('2.fok +6TÉ +2SP  +8vÉP',       dict(te=6,  sp=2, sebz_elony=0, virt_ep=8)),
    ('3.fok +8TÉ +3SP EÜ+1 +12vÉP',  dict(te=8,  sp=3, sebz_elony=1, virt_ep=12)),
    ('4.fok +11TÉ +5SP EÜ+2 +18vÉP', dict(te=11, sp=5, sebz_elony=2, virt_ep=18)),
])

