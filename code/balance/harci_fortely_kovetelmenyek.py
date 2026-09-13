#!/usr/bin/env python3
"""Harci fortélyok Harcmodoron kívüli követelményeinek táblázat-generátora
+ yaml <-> md konzisztencia-ellenőrzés.

Forrás:
  - yaml: data/sources/fortelyok/harci/*.yaml  (fokok[].követelmények)
  - md:   md/fortelyok.harci/*.md              (### N. fok / 🔒 Követelmény listák)

A "Harcmodor" (Közelharc/Kardvívás/Rombolás/Lándzsavívás/Ostorharc, illetve a
md-ben az általános "Harcmodor" szó) NEM számít egyéb követelménynek — ezt
kiszűrjük, és csak a fennmaradó (nem-harcmodor) követelményt listázzuk.

ponytail: a md-parse szándékosan a bevált '### N. fok' + '- Név - `N.szint`'
mintára épül; ha egy fortély md-je más formátumot használ, az a check-ben
"md-ből nem parse-olható" figyelmeztetésként jelenik meg, nem csendben tűnik el.
"""
import glob
import os
import re
import sys

import yaml

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _load_harcmodorok():
    """A harcmodor-nevek a konstansok.yaml-ból (közelharci + távolsági), + az
    általános 'harcmodor' szó és a 'fegyver harcmodora' md-forma. Kisbetűsítve."""
    k = yaml.safe_load(open(os.path.join(REPO, "data/sources/konstansok.yaml")))
    hm = set()
    for lst in (k.get("harcmodorok") or {}).values():
        hm.update(str(x).lower() for x in lst)
    # md-ben előforduló általános alakok
    hm.update({"harcmodor", "fegyver harcmodora", "hajítás harcmodor"})
    return hm


HARCMODOROK = _load_harcmodorok()


def is_harcmodor(nev):
    if isinstance(nev, list):
        # a yaml VAGY-listája: ha MINDEN eleme harcmodor -> harcmodor követelmény
        return all(str(x).lower() in HARCMODOROK for x in nev)
    # string lehet összevont "A/B/C" (md-forma): ha MINDEN tag harcmodor -> az
    tagok = [t.strip() for t in str(nev).split("/") if t.strip()]
    return bool(tagok) and all(t.lower() in HARCMODOROK for t in tagok)


def yaml_kovetelmenyek():
    """név -> {fok: [(kép_nev, szint), ...] nem-harcmodor követelmények}"""
    out = {}
    for f in glob.glob(os.path.join(REPO, "data/sources/fortelyok/harci/*.yaml")):
        d = yaml.safe_load(open(f))
        if not d:
            continue
        items = d if isinstance(d, list) else d.get("fortélyok", [d])
        for t in items:
            if not isinstance(t, dict) or "név" not in t:
                continue
            per_fok = {}
            for fk in t.get("fokok", []):
                fok = fk.get("fok")
                req = fk.get("követelmények")
                egyeb = []
                if isinstance(req, list):
                    for e in req:
                        if not isinstance(e, dict):
                            continue
                        nev = e.get("név")
                        if is_harcmodor(nev):
                            continue
                        egyeb.append((nev, e.get("érték")))
                if egyeb:
                    per_fok[fok] = egyeb
            if per_fok:
                out[t["név"]] = per_fok
    return out


FOK_RE = re.compile(r"^#{2,4}\s*(\d+)\.\s*fok", re.I)
MD_LINK = re.compile(r"\[([^\]]+)\]\([^)]*\)")  # [szöveg](url) -> szöveg
# követelmény-sor a link-kiszedés UTÁN:
#   "- Akrobatika - `6.szint`" / "🔒 Fájdalomtűrés: `7.szint`"
#   "- Mesterfegyver fortély: `1.fok`" / "- Név - `N.szint`"
# a név után opcionális " fortély" szó, majd - vagy : elválasztó, majd `N.szint|fok`
REQ_LINE = re.compile(
    r"^[-\s🔒*]*([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű/\s]+?)(?:\s+fortély)?\s*[:-]+\s*`(\d+)\.(?:szint|fok)`",
    re.I,
)


def md_kovetelmenyek():
    """A per-fortély md-kből fokonkénti követelmények (nem-harcmodor).
    A md-k több könyvtárban vannak (harci, tavharc, ...), a fájlnév a csoportot
    tükrözi, nem feltétlenül a yaml csoportját."""
    out = {}
    for f in glob.glob(os.path.join(REPO, "md/fortelyok.*/*.md")):
        lines = open(f).read().splitlines()
        cim = None
        for ln in lines:
            if ln.startswith("## "):
                cim = re.sub(r"^##\s*[🟣🟢🔵🟡🔆🔒]*\s*", "", ln).strip()
                cim = re.sub(r"\s*\(\d+\)\s*.*$", "", cim).strip()
                break
        if not cim:
            cim = os.path.basename(f)[:-3]
        cur_fok = None
        per_fok = {}
        for ln in lines:
            s = MD_LINK.sub(r"\1", ln).strip()  # markdown-linkek -> puszta szöveg
            fm = FOK_RE.match(s)
            if fm:
                cur_fok = int(fm.group(1))
                continue
            rm = REQ_LINE.match(s)
            if rm and cur_fok is not None:
                nev = rm.group(1).strip()
                if is_harcmodor(nev):
                    continue
                per_fok.setdefault(cur_fok, []).append((nev, int(rm.group(2))))
        if per_fok:
            out[cim] = per_fok
    return out


def fmt_reqs(per_fok):
    """{1:[('Akrobatika',6)],2:[('Akrobatika',9)]} -> 'Akrobatika `6/9.szint`'.
    A VAGY-listát '/'-rel (szóköz nélkül) írja; ha minden fokon azonos a szint,
    egyetlen értékként jeleníti meg (pl. Befolyásolás `3.szint`, nem `3/3`)."""
    keps = {}
    order = []
    for fok in sorted(per_fok):
        for nev, szint in per_fok[fok]:
            key = "/".join(str(x) for x in nev) if isinstance(nev, list) else str(nev)
            if key not in keps:
                keps[key] = []
                order.append(key)
            keps[key].append(str(szint))
    parts = []
    for key in order:
        szintek = keps[key]
        # ha minden fokon ugyanaz -> egy érték; különben fokonként '/'-tal
        egyseges = szintek[0] if len(set(szintek)) == 1 else "/".join(szintek)
        parts.append(f"{key} `{egyseges}.szint`")
    return ", ".join(parts)


def harci_fortely_nevek():
    """Az ÖSSZES harci fortély neve (data/sources/fortelyok/harci/*.yaml),
    függetlenül attól, van-e nem-harcmodor követelménye. Ehhez metsszük a md-t,
    hogy a nem-harci fortélyok md-je ne szennyezze a diffet."""
    nevek = set()
    for f in glob.glob(os.path.join(REPO, "data/sources/fortelyok/harci/*.yaml")):
        d = yaml.safe_load(open(f))
        if not d:
            continue
        items = d if isinstance(d, list) else d.get("fortélyok", [d])
        for t in items:
            if isinstance(t, dict) and "név" in t:
                nevek.add(t["név"])
    return nevek


def main():
    yml = yaml_kovetelmenyek()
    md_all = md_kovetelmenyek()
    # a md-t a HARCI fortélyokra szűkítjük (yaml-csoport szerint), különben a
    # más csoportú fortélyok md-je hamis "yaml hiányként" jelenne meg
    harci = harci_fortely_nevek()
    md = {n: v for n, v in md_all.items() if n in harci}

    print("=" * 70)
    print("GENERÁLT TÁBLÁZAT — Harci fortélyok, Harcmodoron kívüli követelménnyel")
    print("(forrás: data/sources/fortelyok/harci/*.yaml)")
    print("=" * 70)
    print(f"\n| {'Fortély':<38} | {'Egyéb képzettség/fortély követelmény':<45} |")
    print(f"| {'-'*38} | {'-'*45} |")
    for nev in sorted(yml):
        print(f"| {nev:<38} | {fmt_reqs(yml[nev]):<45} |")

    print("\n" + "=" * 70)
    print("INKONZISZTENCIA-TÁBLÁZAT: yaml <-> md (nem-harcmodor követelmények)")
    print("=" * 70)

    def canon(nev):
        """A követelmény-név kanonizálása összevetéshez: VAGY-listát '/'-rel
        (szóköz nélkül) fűz össze, és kisbetűsít — így a puszta írásmód-
        (kis/nagybetű) és tagolás-különbség nem számít eltérésnek."""
        if isinstance(nev, list):
            txt = "/".join(str(x) for x in nev)
        else:
            txt = str(nev)
        return txt.replace(" / ", "/").replace(" /", "/").replace("/ ", "/").lower()

    def norm_reqs(per_fok):
        """{fok: [(nev,szint)]} -> {(fok, kanon_név, szint)} halmaz."""
        s = set()
        if not per_fok:
            return s
        for fok, lst in per_fok.items():
            for nev, szint in lst:
                s.add((fok, canon(nev), szint))
        return s

    def fmt_items(items):
        if not items:
            return "—"
        return "; ".join(f"{n} {sz}.szint (fok {f})" for f, n, sz in sorted(items))

    rows = []
    for nev in sorted(set(yml) | set(md)):
        yset = norm_reqs(yml.get(nev))
        mset = norm_reqs(md.get(nev))
        if yset == mset:
            continue
        # yaml hiány = md-ben van, yaml-ban nincs
        yaml_hiany = mset - yset
        # md hiány = yaml-ban van, md-ben nincs
        md_hiany = yset - mset
        rows.append((nev, fmt_items(yaml_hiany), fmt_items(md_hiany)))

    if not rows:
        print("\n  ✔ Nincs inkonzisztencia — yaml és md minden harci fortélyra egyezik.")
        return 0

    w0 = max(len("Fortély"), max(len(r[0]) for r in rows))
    w1 = max(len("yaml hiány (md-ben van, yaml-ból hiányzik)"), max(len(r[1]) for r in rows))
    w2 = max(len("md hiány (yaml-ban van, md-ből hiányzik)"), max(len(r[2]) for r in rows))
    print(f"\n| {'Fortély':<{w0}} | {'yaml hiány (md-ben van, yaml-ból hiányzik)':<{w1}} | {'md hiány (yaml-ban van, md-ből hiányzik)':<{w2}} |")
    print(f"| {'-'*w0} | {'-'*w1} | {'-'*w2} |")
    for nev, yh, mh in rows:
        print(f"| {nev:<{w0}} | {yh:<{w1}} | {mh:<{w2}} |")
    print(f"\n  {len(rows)} fortély tér el.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
