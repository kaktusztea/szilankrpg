#!/usr/bin/env python3
"""SFÉ struktúra hangolási kísérlet (nem pipeline, tervezői eszköz).

A harcszimulacio.spec.md §3-§6 motorját általánosítja tetszőleges statblokkra,
és beépíti a §6.5.1 jelleg/íves SP bónuszt + a §8 harci helyzeteket, mert a
Szilánk alapelve, hogy a szituáció dönt — és épp ez befolyásolja, hogy egy
SFÉ érték "jó"-e játékélmény szempontjából.

Cél: megnézni, hogy a különböző páncélstruktúrák SFÉ értékei
  - realisztikus túlélési arányt adnak-e (nehezebb páncél = tovább él),
  - de a harc ne nyúljon el unalmasan (játékélmény),
  - és a jelleg-bónusz (zúzó fém ellen, szúró könnyű ellen) érvényesüljön.

A páncél SFÉ értékeket a data layerből olvassa (konstansok.json).
Importálható: a demó csak `__main__`-ben fut, így az A/B szkript is használhatja.
"""
import random
import json
from statistics import mean

DATA = '/repo/github/szilank.code/data'
K = json.load(open(f'{DATA}/tables/konstansok.json'))
STRUKT = {s['struktúra']: s for s in K['páncél_struktúrák']}

CLAMP = lambda v, lo, hi: max(lo, min(hi, v))
d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10

FÉM_STRUKT = {'lánc/sodrony', 'pikkely', 'lemez'}
KÖNNYŰ_VAGY_LÁNC = {'posztó', 'fegyverkabát', 'bőr', 'lánc/sodrony'}
BŐR_VAGY_GYENGÉBB = {'', 'posztó', 'fegyverkabát', 'bőr'}
STRUKTÚRÁK = ['posztó', 'fegyverkabát', 'bőr', 'lánc/sodrony', 'pikkely', 'lemez']


def elony(szint, sides=20):
    rolls = [random.randint(1, sides) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def sebzes_elony(k):
    return 2 if k == 20 else (1 if k >= 16 else 0)


def jelleg_bonusz(jelleg, struktura):
    """§6.5.1 — a fegyver elsődleges jellegére adódó SP bónusz."""
    j = jelleg[0] if jelleg else ''
    if j == 'Z' and struktura in FÉM_STRUKT:
        return 3
    if j == 'S' and struktura in KÖNNYŰ_VAGY_LÁNC:
        return 3
    if j == 'V' and struktura in BŐR_VAGY_GYENGÉBB:
        return 1
    return 0


def tul_bonusz(t):
    return 3 * (t // 5)


class Harcos:
    def __init__(s, oldal, TÉ, VÉ, SP, ÉP, SFÉ, KÉ, Átütés, jelleg, struktura, enyh, támadások=1, pengeviszony=0):
        s.oldal, s.TÉ0, s.VÉ0, s.SP, s.ÉP, s.SFÉ = oldal, TÉ, VÉ, SP, ÉP, SFÉ
        s.KÉ, s.Átütés, s.jelleg, s.struktura, s.enyh = KÉ, Átütés, jelleg, struktura, enyh
        s.támadások = támadások
        s.oszl = max(1, ÉP // 4)
        s.used = 0; s.vf = 0; s.vs = 0; s.el = True
        s.pengeviszony = pengeviszony  # +1 pengeelőny / -1 pengehátrány a másik oldalhoz képest

    @property
    def ve(s):
        return max(0, s.VÉ0 - s.vf - s.vs)

    @property
    def s_kat(s):
        return 0 if s.used <= 0 else min(4, -(-s.used // s.oszl))

    @property
    def te(s):
        a = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[s.s_kat]
        lev = 0 if a == 0 else min(0, a + s.enyh)
        tobb_tam = -3 if s.támadások >= 2 else 0     # §3.7: ≥2 támadásnál minden támadásra
        return s.TÉ0 + lev + tobb_tam


def kuzdelem(mk_a, mk_b, helyzet_a=0, helyzet_b=0, max_kor=60):
    """mk_* = factory(sb) → Harcos. helyzet = té_dobás előny/hátrány szint az adott oldalra.
    §6.3: a támadások támadásindex szerint interleave-elődnek (nem harcosonként egyben)."""
    A_ = [mk_a(0)]; B_ = [mk_b(1)]

    def támad(h):
        ell = [x for x in (B_ if h.oldal == 0 else A_) if x.el]
        if not ell:
            return
        c = ell[0]
        éh = helyzet_a if h.oldal == 0 else helyzet_b
        r = elony(éh)
        if h.te + r >= c.ve:
            bon = tul_bonusz(h.te + r - c.ve)
            sr = elony(CLAMP(sebzes_elony(r), -2, 2))
            jb = jelleg_bonusz(h.jelleg, c.struktura)
            sfe = max(0, c.SFÉ - h.Átütés)
            c.used += max(0, sr + h.SP + bon + jb - sfe)
            c.vs += 3
            if c.used >= c.ÉP:
                c.el = False
        else:
            c.vf += {1: 2, 0: 1, -1: 0}[h.pengeviszony] + k20T(r)

    for kor in range(1, max_kor + 1):
        for h in A_ + B_:
            if h.el:
                h.vf = max(0, h.vf - 1)  # Harcos elme 1 alapeset regeneráció
        rend = sorted([x for x in A_ + B_ if x.el], key=lambda x: -(x.KÉ + d20()))
        max_tam = max((x.támadások for x in rend), default=1)
        for i in range(1, max_tam + 1):
            for h in rend:
                if not h.el or i > h.támadások:
                    continue
                támad(h)
        if not any(x.el for x in A_):
            return 'B', kor
        if not any(x.el for x in B_):
            return 'A', kor
    return 'D', max_kor


def _harckeret_tamadasok(struktura, harcmodor_szint, gyorsaság, erő, fegyver_sebesség, fortély_hk=1):
    """§3.6-§3.7: MGT a struktúrából (acél, átlagos kidolgozás, passzol, sisak+3 végtag),
    ebből harckeret és támadásszám. Ez a nehéz páncél valódi ellensúlya."""
    st = STRUKT[struktura]
    # tag_mgt átlagos kidolgozás szerint:  nem-fém 0.5 · hajlékony fém 1 · merevvért fém 2
    if st['merev']:
        tag_mgt = 2
    elif st['fém']:
        tag_mgt = 1
    else:
        tag_mgt = 0.5
    csatolt_db = 3 + 1  # végtagvédettség 3 + sisak
    mgt = max(0, st['mgt'] + 0 + int(csatolt_db * tag_mgt) + 0 - erő)  # acél mgt+0, passzol 0
    harckeret = max(0, harcmodor_szint + gyorsaság - mgt + fortély_hk)
    támadások = 1 + harckeret // fegyver_sebesség
    return mgt, támadások


def stat(struktura, tsz='hős'):
    """REF-A szintű hős (tsz10) vagy REF-D pribék (tsz5), adott páncélstruktúrával.
    SFÉ + MGT + támadásszám a struktúrából (acél/idea0/rongálódás0/passzol)."""
    st = STRUKT[struktura]
    sfe = st['sfé_fizikai']
    if tsz == 'hős':
        # Kard, lovag: Sebesség 8, kardvívás 8, gyorsaság 3, erő 3, Harckeret növelés +1
        mgt, tám = _harckeret_tamadasok(struktura, 8, 3, 3, 8, fortély_hk=1)
        return dict(TÉ=47, VÉ=60, SP=11, ÉP=40, KÉ=19, Átütés=1, jelleg='V/S', enyh=2,
                    SFÉ=sfe, struktura=struktura, támadások=tám, MGT=mgt)
    # REF-D pribék: Kard, hosszú Sebesség 7, kardvívás 5, gyorsaság 1, erő 2
    mgt, tám = _harckeret_tamadasok(struktura, 5, 1, 2, 7, fortély_hk=0)
    return dict(TÉ=27, VÉ=44, SP=6, ÉP=32, KÉ=6, Átütés=0, jelleg='V/S', enyh=0,
                SFÉ=sfe, struktura=struktura, támadások=tám, MGT=mgt)


def stat_kozepes(struktura='bőr'):
    """Közepes harcos (tsz~7): Kard, hosszú Sebesség 7, kardvívás 7, gyorsaság 2, erő 2."""
    st = STRUKT[struktura]
    mgt, tám = _harckeret_tamadasok(struktura, 7, 2, 2, 7, fortély_hk=0)
    return dict(TÉ=38, VÉ=52, SP=8, ÉP=36, KÉ=12, Átütés=0, jelleg='V/S', enyh=1,
                SFÉ=st['sfé_fizikai'], struktura=struktura, támadások=tám, MGT=mgt)


def factory(sb, pengeviszony=0):
    return lambda oldal: Harcos(oldal, sb['TÉ'], sb['VÉ'], sb['SP'], sb['ÉP'], sb['SFÉ'],
                                sb['KÉ'], sb['Átütés'], sb['jelleg'], sb['struktura'], sb['enyh'],
                                sb.get('támadások', 1), pengeviszony)


def futtat(sb_a, sb_b, N=6000, pv_a=0, pv_b=0, helyzet_a=0, helyzet_b=0):
    random.seed(20260910)
    res = [kuzdelem(factory(sb_a, pv_a), factory(sb_b, pv_b), helyzet_a, helyzet_b) for _ in range(N)]
    aw = sum(1 for x in res if x[0] == 'A') / N
    dw = sum(1 for x in res if x[0] == 'D') / N
    h = mean(x[1] for x in res)
    return aw, h, dw


def _demo():
    print("SFÉ értékek (data layer, fizikai):")
    for s in STRUKTÚRÁK:
        st = STRUKT[s]
        print(f"  {s:14} SFÉ_fiz={st['sfé_fizikai']:2}  SFÉ_ener={st['sfé_energia']:2}  MGT={st['mgt']}")

    print("\n" + "=" * 72)
    print("1. TESZT — Hős vs Hős, azonos páncél (harc HOSSZA)")
    print("   Most az MGT→harckeret→támadásszám ellensúllyal: a nehéz páncél lassít.")
    print("=" * 72)
    print(f"  {'páncél':14} {'MGT':>4} {'tám/kör':>8} {'hossz (kör)':>12}  {'döntetlen%':>11}")
    for s in STRUKTÚRÁK:
        sb = stat(s, 'hős')
        _, h, dw = futtat(sb, dict(sb))
        print(f"  {s:14} {sb['MGT']:>4} {sb['támadások']:>8} {h:>12.2f}  {dw:>10.1%}")

    print("\n" + "=" * 72)
    print("2. TESZT — Hős (páncél X) vs KÖZEPES harcos (bőr, TÉ38 — tud sebezni)")
    print("   A páncél tényleg számít: túlél-e a hős, milyen gyorsan győz.")
    print("=" * 72)
    print(f"  {'hős páncél':14} {'hős győz%':>10} {'hossz':>8}")
    for s in STRUKTÚRÁK:
        aw, h, _ = futtat(stat(s, 'hős'), stat_kozepes('bőr'))
        print(f"  {s:14} {aw:>9.1%} {h:>8.2f}")

    print("\n" + "=" * 72)
    print("3. TESZT — Jelleg-bónusz: Vágó vs Zúzó támadó (harc HOSSZA a védő ellen)")
    print("   Elvárás: zúzó gyorsabb fém páncél ellen; vágó gyorsabb könnyű ellen.")
    print("=" * 72)
    print(f"  {'védő páncél':14} {'vágó hossz':>12} {'zúzó hossz':>12}")
    for s in STRUKTÚRÁK:
        védő = stat(s, 'hős')
        tv = stat('lánc/sodrony', 'hős'); tv['jelleg'] = 'V'
        tz = stat('lánc/sodrony', 'hős'); tz['jelleg'] = 'Z'
        _, hv, _ = futtat(tv, dict(védő))
        _, hz, _ = futtat(tz, dict(védő))
        print(f"  {s:14} {hv:>12.2f} {hz:>12.2f}")

    print("\n" + "=" * 72)
    print("4. TESZT — Szituáció dönt: Hátulról támadás (Előny+1) hatása páncélonként")
    print("   Elvárás: az előny minden páncél ellen segít, de a nehéz páncél maradjon releváns.")
    print("=" * 72)
    print(f"  {'védő páncél':14} {'sima hossz':>11} {'hátulról hossz':>15}")
    for s in STRUKTÚRÁK:
        védő = stat(s, 'hős')
        tám = stat('bőr', 'hős')
        _, h0, _ = futtat(tám, dict(védő))
        _, h1, _ = futtat(tám, dict(védő), helyzet_a=1)
        print(f"  {s:14} {h0:>11.2f} {h1:>15.2f}")


if __name__ == '__main__':
    _demo()
