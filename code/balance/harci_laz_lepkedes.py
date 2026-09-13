#!/usr/bin/env python3
"""Harci láz — a FOKOZATLÉPKEDÉS mechanikájának modellje.

A hangolás lényege nem a nyers bónusz, hanem hogy a fokozatok közti lépkedést JÓL kell
taktikázni. Ez a modul azt méri, hogy egy adott képességű karakter egy adott stratégiával
milyen fokozat-eloszlásban tölti a harcot, és mekkora a két végzetes kimenet esélye.

Mechanika (md/kepzettsegek.primer/harci/harci_laz.md):
  Próba: tul + szint + k10(±Előny/Hátrány) ≥ célszám.
    Célszám: kör elején 18; esemény: megölés 12, sebzés adás/kapás 15.
  Lépkedés: SIKER → +1 fokozat feljebb; KUDARC → −1 fokozat lejjebb.
  A játékos VÁLASZTJA a módosítót: Hátrány−2, Hátrány−1, Előny+1, Előny+2.
    → feljebb akarsz: Előnnyel dobsz (sikert akarsz)
    → lejjebb akarsz:  Hátránnyal dobsz (kudarcot akarsz)
  Csapdák:
    Előny+2 + KUDARC → kizökkensz, a harc során TÖBBÉ nem térhetsz vissza lázba.
    Hátrány−2 + SIKER → automatikusan 4. fokozat (elszabadulsz).

Futtatás:  python3 code/balance/harci_laz_lepkedes.py
"""
import random
from statistics import mean
from collections import Counter

CÉLSZÁM_KÖR = 18   # minden kör eleji próba (a domináns eset)


def k10_eh(szint):
    """k10 Előny/Hátrány szinttel: |szint|+1 kocka, előnynél max, hátránynál min."""
    rolls = [random.randint(1, 10) for _ in range(abs(szint) + 1)]
    return min(rolls) if szint < 0 else max(rolls)


def probal(fix, célszám, mod):
    """Egy próba: sikeres-e? fix = tul+szint, mod = Előny/Hátrány szint [-2..+2]."""
    return fix + k10_eh(mod) >= célszám


def valassz_mod(fok, cél):
    """Stratégia: hogyan dobjon, hogy a cél-fokozat felé mozogjon / ott tartson.
    - fok < cél  → feljebb: Előny (mennél nagyobb a hézag, annál mohóbb, de a +2 kockázatos).
    - fok > cél  → lejjebb: Hátrány (a −2 gyors, de 'mégis siker → 4.fok' csapda).
    - fok == cél → tartani próbál: óvatos +1 (inkább feljebb egyet, mint véletlen elszabadulás
                    Hátrány−2-vel). Ez tudatos stratégiai döntés — modellezhető másképp is.
    """
    if fok < cél:
        return 2 if (cél - fok) >= 2 else 1     # nagy hézag → Előny+2 (mohó), kis hézag → +1
    if fok > cél:
        return -1                                # óvatos lecsúszás (a −2 a 4.fok-csapda miatt vészes)
    return 1                                      # tartás: óvatos +1


def harc_lepkedes(fix, cél, max_kor=8, kezdo_fok=1):
    """Egy harc fokozat-pályája. Visszaad: fokozat/kör lista, kizökkent?, elszabadult?."""
    fok = kezdo_fok
    kizokkent = False
    palya = []
    for _kor in range(max_kor):
        if kizokkent:
            palya.append(0)                      # 0 = nincs láz (kizökkent)
            continue
        mod = valassz_mod(fok, cél)
        siker = probal(fix, CÉLSZÁM_KÖR, mod)
        if siker:
            if mod == -2:                        # Hátrány−2 + siker → elszabadulás
                fok = 4
            else:
                fok = min(4, fok + 1)
        else:
            if mod == 2:                         # Előny+2 + kudarc → kizökken végleg
                kizokkent = True
                fok = 0
            else:
                fok = max(1, fok - 1)            # 1 alá nem csúszik (kilépés a lázból = kudarc 1-en)
        palya.append(fok)
    return palya, kizokkent


def meres(fix, cél, n=50000, max_kor=8):
    random.seed(20260913)
    fok_szamlalo = Counter()
    kizokkent_db = 0
    atlag_fok = []
    for _ in range(n):
        palya, kiz = harc_lepkedes(fix, cél, max_kor)
        fok_szamlalo.update(palya)
        kizokkent_db += kiz
        aktiv = [f for f in palya if f > 0]
        atlag_fok.append(mean(aktiv) if aktiv else 0)
    total = n * max_kor
    return dict(
        fok_eloszlas={f: fok_szamlalo[f] / total for f in range(5)},
        kizokkent=kizokkent_db / n,
        atlag_fok=mean(atlag_fok),
    )


def egy_probal_esely(fix, mod, célszám=CÉLSZÁM_KÖR, n=200000):
    random.seed(1)
    return sum(probal(fix, célszám, mod) for _ in range(n)) / n


print('=== EGY PRÓBA sikeresélye (célszám 18) különböző fix (tul+szint) és módosító mellett ===')
print(f"  {'fix=tul+szint':<16} {'Hát−2':>7} {'Hát−1':>7} {'Előny+1':>8} {'Előny+2':>8}")
for fix in (10, 12, 14, 16, 18):
    row = [egy_probal_esely(fix, m) for m in (-2, -1, 1, 2)]
    print(f"  {fix:<16} " + ' '.join(f'{x:>6.1%}' for x in ([row[0], row[1], row[2], row[3]])))
print("  (fix pl.: Önuralom 4 + Harci láz szint 10 = 14; szint 14 = 18)\n")


def blokk(cim, fix):
    print(f'=== {cim} (fix = tul+szint = {fix}) ===')
    for cél in (2, 3):
        r = meres(fix, cél)
        e = r['fok_eloszlas']
        print(f"  cél {cél}.fok → átlag {r['atlag_fok']:.2f} | "
              f"idő/fok: nincs {e[0]:.0%}, 1:{e[1]:.0%} 2:{e[2]:.0%} 3:{e[3]:.0%} 4:{e[4]:.0%} | "
              f"kizökkent {r['kizokkent']:.0%}")
    print()


blokk('GYENGE lázas', 12)     # Önuralom 2 + szint 10
blokk('KÖZEPES lázas', 14)    # Önuralom 4 + szint 10  (vagy Ö2+sz12)
blokk('ERŐS lázas', 17)       # Önuralom 4 + szint 13


# ── SWEET SPOT keresés ───────────────────────────────────────────────────────
# A "jó irányíthatóság" = a játékos a célfokozatán (3.) tud maradni, MINIMÁLIS
# akaratlan elszabadulással (4.fokon töltött idő) ÉS kizökkenés nélkül.
# Kontroll-pontszám: mennyi időt tölt a cél±0 fokon, mínusz a 4.fok (elszabadulás) büntetése.
print('=== SWEET SPOT: kontroll a fix (tul+szint) függvényében, cél = 3.fok ===')
print(f"  {'fix':>4} {'átlagfok':>9} {'3.fokon':>8} {'4.fokon':>8} {'kizökk':>7}  értékelés")
best = None
for fix in range(8, 19):
    r = meres(fix, cél=3)
    e = r['fok_eloszlas']
    # kontroll: a cél (3) és a szomszédos 2 idő jó; a 4.fok elszabadulás rossz; a kizökkenés rossz
    kontroll = e[2] + e[3] - e[4] - r['kizokkent']
    jel = ''
    if best is None or kontroll > best[1]:
        best = (fix, kontroll)
    print(f"  {fix:>4} {r['atlag_fok']:>9.2f} {e[3]:>7.0%} {e[4]:>7.0%} {r['kizokkent']:>6.0%}  "
          f"{'█' * int(max(0, kontroll) * 30)}")
print(f"\n  → legjobb kontroll: fix={best[0]} (efölött a láz elszabadul, alatta nehéz felkerülni)\n")

print('=== NARRATÍV: a KM-kötelezte szintemelés hatása (cél 3.fok tartása) ===')
print('  Ahogy a képzettség (fix) nő, a "3.fokon tartás" egyre lehetetlenebb → 4.fok dominál:')
for fix in (12, 14, 16, 18):
    r = meres(fix, cél=3)
    e = r['fok_eloszlas']
    print(f"    fix={fix}: 4.fokon töltött idő {e[4]:>4.0%}  (elszabadulás veszélye)")

