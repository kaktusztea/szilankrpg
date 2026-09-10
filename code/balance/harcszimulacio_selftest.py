#!/usr/bin/env python3
"""A harcszimulacio.spec.md §15 önteszt állításainak validálása.
Referencia implementáció közvetlenül a spec §3-§6 formuláiból."""
import random, json
from statistics import mean

DATA = '/repo/github/szilank.code/data'
K = json.load(open(f'{DATA}/tables/konstansok.json'))
FEGY = {f['Fegyver']: f for f in json.load(open(f'{DATA}/tables/fegyverek.json'))}
HB = {int(r['Harcmodor Szint']): int(r['TÉ']) for r in
      json.load(open(f'{DATA}/tables/harcmodor_kepzettsegek_bonuszok.json'))}
KAR = json.load(open(f'{DATA}/karakter/test_karakter2.json'))

d20 = lambda: random.randint(1, 20)
k20T = lambda r: r // 10
CLAMP = lambda v, lo, hi: max(lo, min(hi, v))


def elony(szint, sides=20):
    rolls = [random.randint(1, sides) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def sebzes_elony(k):  return 2 if k == 20 else (1 if k >= 16 else 0)
def net_eh(hs):       return CLAMP(sum(abs(v) if op in ('előny', 'enyhít') else -abs(v)
                                       for op, v in hs), -2, 2)
def ep_max(edz):      return 28 + edz * 4
def s_kat(used, oszl): return 0 if used <= 0 else min(4, -(-used // oszl))
def te_lev(kat, enyh): a = {0: 0, 1: 0, 2: -3, 3: -6, 4: -9}[kat]; return 0 if a == 0 else min(0, a + enyh)
def tul_bonusz(t):    return 3 * (t // 5)
def compute_ve(b, bon, takt, csokk): return max(0, b + bon + takt - csokk)


# ── REF-A származtatás a spec §3 szerint ─────────────────────────────────────
def ref_a(fegyver_nev, mf_fok, harcmodor_szint):
    t = KAR['tulajdonságok']
    f = FEGY[fegyver_nev]
    mf = next((b for b in K['mesterfegyver_bónuszok'] if b['fok'] == mf_fok), {'TÉ': 0, 'VÉ': 0, 'SP': 0})
    te = (10 + t['erő'] + t['ügyesség'] + t['gyorsaság'] + KAR['HM_TÉ']
          + HB[harcmodor_szint] + int(f['TÉ']) + mf['TÉ'])
    ve = (30 + t['gyorsaság'] + t['ügyesség'] + KAR['HM_VÉ']
          + HB[harcmodor_szint] + int(f['VÉ']) + mf['VÉ'])
    erolim = 99 if f['Erőbónusz limit'] in ('', '99') else int(f['Erőbónusz limit'])
    sp = int(f['SP']) + min(t['erő'], erolim) + mf['SP']
    # páncél
    p = KAR['páncél']
    st = next(s for s in K['páncél_struktúrák'] if s['struktúra'] == p['alap'])
    al = next(a for a in K['páncél_fémalapanyagok'] if a['anyag'] == p['fémalapanyag'])
    tag = K['páncél_csatolt_tag_mgt']['merevvért_fém' if st['merev'] else
                                     ('hajlékonyvért_fém' if st['fém'] else 'hajlékonyvért_nem_fém')][p['kidolgozottság']]
    csat = p['végtagvédettség'] + (1 if p['sisak'] else 0)
    meret = {'passzol': 0, 'nem passzol': 3, 'borzalmas': 6}[p['méret_illeszkedés']]
    mgt = max(0, st['mgt'] + al['mgt'] + csat * tag + meret - t['erő'])
    sfe = st['sfé_fizikai'] + al['sfé_bónusz'] + p['idea'] - p['rongálódás']
    mv_fok = next((x['fok'] for x in KAR['fortélyok'] if x['név'] == 'Merevvértviselet'), 0)
    mv_csokk = next(b['TÉ_büntetés_csökkentés'] for b in K['merevvértviselet_bónuszok'] if b['fok'] == mv_fok)
    mv_bunt = max(0, mgt - mv_csokk) if st['merev'] else 0
    hk = max(0, harcmodor_szint + t['gyorsaság'] - mgt - 0 + 1)   # +1 = Harckeret növelés 1.fok
    return dict(TÉ=te - mv_bunt, VÉ=ve, SP=sp, harckeret=hk,
                támadások=1 + hk // int(f['Sebesség']), MGT=mgt, SFÉ=sfe, mv_bunt=mv_bunt)


A = ref_a('Kard, lovag', 2, 8)
T = ref_a('Tőr', 1, 6)

# ── Statikus állítások ───────────────────────────────────────────────────────
tests = [
    ('A1  ÉP(edz=3)==40',                    ep_max(3) == 40, ep_max(3)),
    ('A2  s_kat(10,10)==1',                  s_kat(10, 10) == 1, s_kat(10, 10)),
    ('A3  s_kat(11,10)==2',                  s_kat(11, 10) == 2, s_kat(11, 10)),
    ('A4  te_lev(kat3,enyh2)==-4',           te_lev(3, 2) == -4, te_lev(3, 2)),
    ('A5  Kard,lovag TÉ47/VÉ60/SP11/tám1',   (A['TÉ'], A['VÉ'], A['SP'], A['támadások']) == (47, 60, 11, 1),
                                             (A['TÉ'], A['VÉ'], A['SP'], A['támadások'])),
    ('A6  Tőr TÉ40/VÉ54/SP5',                (T['TÉ'], T['VÉ'], T['SP']) == (40, 54, 5),
                                             (T['TÉ'], T['VÉ'], T['SP'])),
    ('A7  MGT14/SFÉ5/mvbünt0',               (A['MGT'], A['SFÉ'], A['mv_bunt']) == (14, 5, 0),
                                             (A['MGT'], A['SFÉ'], A['mv_bunt'])),
    ('A8  k20T 5/16/20 == 0/1/2',            (k20T(5), k20T(16), k20T(20)) == (0, 1, 2), None),
    ('A9  sebzésElőny 15/16/20 == 0/1/2',    (sebzes_elony(15), sebzes_elony(16), sebzes_elony(20)) == (0, 1, 2), None),
    ('A10 netÉH(előny+2,előny+2)==2',        net_eh([('előny', 2), ('előny', 2)]) == 2,
                                             net_eh([('előny', 2), ('előny', 2)])),
    ('A11 tul_bonusz(11)==6',                tul_bonusz(11) == 6, tul_bonusz(11)),
    ('A12 computeVÉ(10,0,-5,50)==0',         compute_ve(10, 0, -5, 50) == 0, compute_ve(10, 0, -5, 50)),
]
print('=== STATIKUS ÁLLÍTÁSOK ===')
fail = 0
for név, ok, got in tests:
    print(f"  {'✔' if ok else '✘ HIBA'}  {név}" + ('' if ok else f"   → kapott: {got}"))
    fail += not ok

# ── Statisztikai: REF-B szimuláció ───────────────────────────────────────────
TE, VE, SP, SFE, EP, KE, OSZL, ENYH, REGEN = 47, 60, 11, 5, 40, 19, 10, 2, 1


class H:
    def __init__(s, oldal): s.oldal, s.used, s.vf, s.vs, s.el = oldal, 0, 0, 0, True
    ve = property(lambda s: max(0, VE - s.vf - s.vs))
    te = property(lambda s: TE + te_lev(s_kat(s.used, OSZL), ENYH))


def kuzdelem(n_a, n_b, max_kor=40):
    A_ = [H(0) for _ in range(n_a)]; B_ = [H(1) for _ in range(n_b)]
    for kor in range(1, max_kor + 1):
        for h in A_ + B_:
            if h.el: h.vf = max(0, h.vf - REGEN)
        for h in sorted([x for x in A_ + B_ if x.el], key=lambda x: -(KE + d20())):
            if not h.el: continue
            ell = [x for x in (B_ if h.oldal == 0 else A_) if x.el]
            if not ell: break
            c = random.choice(ell)
            r = d20()
            if h.te + r >= c.ve:
                bon = tul_bonusz(h.te + r - c.ve)
                sr = elony(sebzes_elony(r))
                c.used += max(0, sr + SP + bon - SFE)
                c.vs += 3
                if c.used >= EP: c.el = False
            else:
                c.vf += 1 + k20T(r)        # §13.1 közös kocka olvasat
        if not any(x.el for x in A_): return 'B', kor
        if not any(x.el for x in B_): return 'A', kor
    return 'D', max_kor


random.seed(20260910)
N = 20000
print('\n=== STATISZTIKAI ÁLLÍTÁSOK (%d futás) ===' % N)

r11 = [kuzdelem(1, 1) for _ in range(N)]
aw = sum(1 for x in r11 if x[0] == 'A') / N
h11 = mean(x[1] for x in r11)
ok = abs(aw - 0.5) < 0.02 and abs(h11 - 3.9) < 0.15
print(f"  {'✔' if ok else '✘ HIBA'}  B1  1:1 → A győz {aw:.1%} (elvárt 50%), hossz {h11:.2f} kör (elvárt 3,9)")
fail += not ok

r13 = [kuzdelem(1, 3) for _ in range(N)]
aw3 = sum(1 for x in r13 if x[0] == 'A') / N
h13 = mean(x[1] for x in r13)
ok = aw3 < 0.01 and abs(h13 - 1.8) < 0.15
print(f"  {'✔' if ok else '✘ HIBA'}  B2  1:3 → magányos {aw3:.1%} (elvárt ~0%), hossz {h13:.2f} kör (elvárt 1,8)")
fail += not ok

dmg = mean(max(0, d20() + SP - SFE) for _ in range(200000))
ok = abs(dmg - 16.5) < 0.15
print(f"  {'✔' if ok else '✘ HIBA'}  B3  E[sebzés|találat] {dmg:.2f} (elvárt 16,5)")
fail += not ok

hit = sum(1 for _ in range(200000) if TE + d20() >= VE) / 200000
ok = abs(hit - 0.40) < 0.005
print(f"  {'✔' if ok else '✘ HIBA'}  B4  P(találat) {hit:.3f} (elvárt 0,400)")
fail += not ok

print(f"\n{'MINDEN ÁLLÍTÁS TELJESÜL' if fail == 0 else str(fail) + ' ÁLLÍTÁS HIBÁS'}")
