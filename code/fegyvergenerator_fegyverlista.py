#!/usr/bin/env python3
"""Teljes mainstream közelharci fegyverlista generálása a v2 (mátrix) modellel.

Az éles 068_0x fegyvertáblák mainstream közelharci fegyvereit képezi le a
fegyvergenerátor paramétereire, és markdown táblát emittál (Erő=0 bázisértékek,
mint a v2 'Konkrét fegyverek' szekció).

Leképezés: pengehossz→fegyverhossz (0→0/1, 0.5→2, 1→3, 1.5→5, 2→7, 3/4→9, 5→12),
sebzés módja→Aktor (S→pengehegy, V-egyenes→vágóél-egyenes, V-íves→vágóél-íves, Z→botvég/buzogányfej),
súly az Erő-követelményből. Kihagyva: hárítófegyverek, puszta kéz, exotikus-speciális, pajzs, távharc.

Futtatás:  python3 code/fegyvergenerator_fegyverlista.py > /tmp/fegyverlista.md

─────────────────────────────────────────────────────────────────────────────
Eredet: szilank.wiki/STUDY.fegyvergenerator_v2_fegyverlista.gen.py — migrálva 2026-09-10.
A migrációnál a `STUDY.` prefixes fájlnév miatti importlib-hack helyére sima
import került (a modulnév most már valid Python azonosító).

FIGYELEM: tervezői eszköz, nem a data pipeline része. A kimenetét NE írd rá
automatikusan az éles `md/068_0x_*.md` fegyvertáblákra — azok kézzel hangoltak.
─────────────────────────────────────────────────────────────────────────────
"""
import fegyvergenerator_balansz as bal

F = bal.Fegyver
FEGYVERHOSSZ = bal.FEGYVERHOSSZ

# (kategória, megjelenített név, Fegyver, opcionális megjegyzés)
W = [
 # ── KÖZELHARCI (tőr-osztály) ──
 ("Közelharci", "Kés", F("x",0,["vágóél-íves-rövid","pengehegy-apró"],penges=1,suly="könnyű"), ""),
 ("Közelharci", "Tőr", F("x",1,["vágóél-egyenes-rövid","pengehegy-tőr"],penges=1), ""),
 ("Közelharci", "Dzsambia", F("x",1,["vágóél-íves-rövid","pengehegy-apró"],penges=1,suly="könnyű"), "íves"),
 ("Közelharci", "Kriszkés", F("x",1,["pengehegy-apró","vágóél-egyenes-rövid"],penges=1), "páncéltalan szúrás +3 (spec)"),
 ("Közelharci", "Levéltőr", F("x",1,["pengehegy-apró","vágóél-egyenes-rövid"],penges=1), ""),
 ("Közelharci", "Pugoss", F("x",2,["pengehegy-tőr","vágóél-egyenes-rövid"],penges=1), "KF"),
 ("Közelharci", "Ramiera", F("x",2,["pengehegy-tőr","vágóél-egyenes-rövid"],penges=1), "KF"),
 ("Közelharci", "Tőr, kígyó", F("x",1,["pengehegy-apró","vágóél-egyenes-rövid"],penges=1), ""),
 ("Közelharci", "Tőr, páncélszúró", F("x",2,["pengehegy-tőr"],penges=1), "belharcban SFÉ:0 (spec)"),
 ("Közelharci", "Tőr, Slan", F("x",2,["pengehegy-tőr","vágóél-egyenes-rövid"],penges=1,idea=2), "Idea:2"),
 # ── KARDVÍVÓ ──
 ("Kardvívó", "Kard, rövid", F("x",2,["vágóél-egyenes-rövid","pengehegy-tőr"],penges=1), ""),
 ("Kardvívó", "Kard, hosszú", F("x",3,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1), ""),
 ("Kardvívó", "Kard, szablya", F("x",3,["vágóél-íves-átlagos","pengehegy-kard"],penges=1), "íves"),
 ("Kardvívó", "Kard, dzsenn szablya", F("x",3,["vágóél-íves-átlagos","pengehegy-kard"],penges=1), "íves"),
 ("Kardvívó", "Kard, handzsár", F("x",3,["vágóél-íves-átlagos"],penges=1,suly="nehéz"), "íves, nehéz"),
 ("Kardvívó", "Kard, jatagán", F("x",2,["vágóél-íves-rövid","pengehegy-tőr"],penges=1), "íves"),
 ("Kardvívó", "Kard, kígyó", F("x",3,["vágóél-íves-átlagos","pengehegy-kard"],penges=1), "íves"),
 ("Kardvívó", "Kard, emrelin", F("x",3,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1), "elf"),
 ("Kardvívó", "Kard, khossas", F("x",3,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1), "elf"),
 ("Kardvívó", "Kard, hiequar", F("x",3,["pengehegy-kard","vágóél-egyenes-átlagos"],penges=1), "elf"),
 ("Kardvívó", "Kard, predoci egyeneskard", F("x",3,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1), ""),
 ("Kardvívó", "Kard, lovag", F("x",3,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1,suly="nehéz"), "nehéz"),
 ("Kardvívó", "Kard, rapír", F("x",3,["pengehegy-kard","vágóél-egyenes-átlagos"],penges=1), ""),
 ("Kardvívó", "Tőrkard", F("x",3,["pengehegy-kard","vágóél-egyenes-átlagos"],penges=1), ""),
 ("Kardvívó", "Kard, másfélkezes (2K)", F("x",5,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1), ""),
 ("Kardvívó", "Kard, másfélkezes (1K)", F("x",5,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1,egykezes_kenyszer=True), "1 kézzel"),
 ("Kardvívó", "Kard, mesterkard (2K)", F("x",5,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1,suly="nehéz"), "nehéz"),
 ("Kardvívó", "Kard, mesterkard (1K)", F("x",5,["vágóél-egyenes-átlagos","pengehegy-kard"],penges=1,suly="nehéz",egykezes_kenyszer=True), "nehéz, 1 kézzel"),
 ("Kardvívó", "Kard, kétkezes", F("x",7,["vágóél-egyenes-nagy","pengehegy-kard"],penges=1,suly="nehéz"), ""),
 ("Kardvívó", "Meneth", F("x",2,["vágóél-íves-rövid"],penges=1), "íves; SFÉ duplán (spec)"),
 ("Kardvívó", "Sequor", F("x",2,["vágóél-íves-rövid","pengehegy-tőr"],penges=1), "íves"),
 ("Kardvívó", "Vívóbot (fa gyakorló)", F("x",3,["botvég"],alapanyag="csont"), "fa, Z"),
 ("Kardvívó", "Kard, Slan rövid", F("x",2,["vágóél-íves-rövid","pengehegy-tőr"],penges=1,idea=2), "Idea:2"),
 ("Kardvívó", "Kard, Slan (1K)", F("x",5,["vágóél-íves-átlagos","pengehegy-kard"],penges=1,idea=3,egykezes_kenyszer=True), "Idea:3, 1 kézzel"),
 ("Kardvívó", "Kard, Slan (2K)", F("x",5,["vágóél-íves-átlagos","pengehegy-kard"],penges=1,idea=3), "Idea:3"),
 ("Kardvívó", "Kard, Slan csatakard", F("x",7,["vágóél-íves-nagy","pengehegy-kard"],penges=1,idea=4,suly="nehéz"), "Idea:4"),
 ("Kardvívó", "Mara-sequor (1K)", F("x",5,["vágóél-íves-átlagos"],penges=1,idea=3,alapanyag="feketeacél",egykezes_kenyszer=True), "Idea:3, feketeacél"),
 ("Kardvívó", "Mara-sequor (2K)", F("x",5,["vágóél-íves-átlagos"],penges=1,idea=3,alapanyag="feketeacél"), "Idea:3, feketeacél"),
 # ── LÁNDZSAVÍVÓ ──
 ("Lándzsavívó", "Lándzsa, átlagos", F("x",9,["lándzsahegy-rövid-átlagos"],penges=1), ""),
 ("Lándzsavívó", "Lándzsa, keskeny hegyű", F("x",9,["lándzsahegy-rövid-keskeny"],penges=1), "páncéltörő"),
 ("Lándzsavívó", "Lándzsa, széles hegyű", F("x",9,["lándzsahegy-rövid-széles"],penges=1), ""),
 ("Lándzsavívó", "Pika, keskeny hegyű", F("x",12,["lándzsahegy-rövid-keskeny"],penges=1), "páncéltörő"),
 ("Lándzsavívó", "Pika, széles hegyű", F("x",12,["lándzsahegy-rövid-széles"],penges=1), ""),
 ("Lándzsavívó", "Szigony, egykezes", F("x",5,["lándzsahegy-tőrhossz"]), ""),
 ("Lándzsavívó", "Szigony, kétkezes", F("x",9,["lándzsahegy-rövid-átlagos"]), ""),
 ("Lándzsavívó", "Alabárd", F("x",9,["vágóél-íves-nagy","lándzsahegy-rövid-átlagos","buzogányfej-tompa"],fejdarab_alap=2,penges=1,suly="nehéz"), "3 mód: V/S/Z"),
 ("Lándzsavívó", "Bot, hosszú", F("x",7,["botvég"]), "Z"),
 # ── ROMBOLÓ ──
 ("Romboló", "Balta", F("x",2,["vágóél-íves-rövid"],fejdarab_alap=1,suly="nehéz"), "íves (bárd)"),
 ("Romboló", "Bot, rövid", F("x",2,["botvég"],suly="könnyű"), "Z"),
 ("Romboló", "Bot, furkós", F("x",3,["botvég"]), "Z"),
 ("Romboló", "Buzogány, egykezes", F("x",3,["buzogányfej-tompa"],suly="nehéz"), "Z"),
 ("Romboló", "Buzogány, kétkezes", F("x",7,["buzogányfej-tompa"],suly="súlyos"), "Z"),
 ("Romboló", "Buzogány, láncos", F("x",3,["buzogányfej-tompa"],lancos=1), "pajzs VÉ feleződik"),
 ("Romboló", "Buzogány, shadleki", F("x",3,["buzogányfej-szöges"],suly="nehéz"), "szöges"),
 ("Romboló", "Buzogány, tollas", F("x",2,["buzogányfej-szöges"]), "szöges"),
 ("Romboló", "Csatabárd, egykezes", F("x",2,["vágóél-íves-átlagos"],fejdarab_alap=1,suly="nehéz",nehez_mod="átütés"), "íves, átütés"),
 ("Romboló", "Csatabárd, kétkezes", F("x",5,["vágóél-íves-nagy"],fejdarab_alap=1,suly="súlyos",nehez_mod="átütés"), "íves, átütés"),
 ("Romboló", "Csatacsákány", F("x",3,["lándzsahegy-rövid-keskeny"]), "páncéltörő; 50% beakad (spec)"),
 ("Romboló", "Harci kalapács", F("x",7,["buzogányfej-tompa"],suly="súlyos"), "Z, kétkezes"),
 # ── OSTORHARC ──
 ("Ostorharc", "Korbács", F("x",3,["botvég"],hajlekony=1), "hajlékony"),
 ("Ostorharc", "Ostor", F("x",9,["botvég"],hajlekony=1), "hajlékony"),
 ("Ostorharc", "Ostorkard (Urumi)", F("x",9,["vágóél-íves-átlagos"],hajlekony=1), "hajlékony; önsebzés kockázat (spec)"),
]

def forg(f):
    base = FEGYVERHOSSZ[f.hossz]["forg"]
    return base + (" (1 kézzel)" if f.egykezes_kenyszer else "")

last_kat = None
for kat, nev, f, megj in W:
    if kat != last_kat:
        print(f"\n### {kat}\n")
        print("| Fegyver | Mód (Aktor) | Típus | TÉ | VÉ | SP | Átütés | Seb. | Forgatás | Fh | Megj. |")
        print("|---|---|---|--:|--:|--:|--:|--:|---|--:|---|")
        last_kat = kat
    modok = f.modok(ero=0)
    for i, m in enumerate(modok):
        n = nev if i == 0 else ""
        mm = megj if i == 0 else ""
        par = " ⚠️párbaj:VÉ0" if m["parbaj_alkalmatlan"] else ""
        print(f"| {n} | {m['aktor']} | {m['tipus']} | {m['TE']} | {m['VE']} | {m['SP']:+d} | {m['AT']} | {m['SEB']} | {forg(f)} | {f.hossz} | {mm}{par} |")
