"""Hatás-sablonok (hatasok.yaml, md/081): validáció + a státusz `hatás: <id>` sorainak kifejtése mód/cél effekt-sorokra.

Build-idejű réteg (engine_spec §22.4): a futó kód a kifejtett sorokat kapja (statuszok.json alakja változatlan), kiegészítve
a `hatás_id` / `hatás_név` mezőkkel. Nyers `mód:` sor (sablon nélkül) is megengedett - a hívó dönti el, kötelező-e a hivatkozás.
"""

import re

PARAM_TIPUSOK = {'szám', 'célpont', 'taktika', 'taktika_fok', 'fortély', 'érzék'}
ÁTMENŐ = ('alcél', 'megjegyzés')   # a státusz-sor mezői, amelyek minden Hatásnál átmennek a kifejtett sorokba
HELYŐRZŐ = re.compile(r'\{([^{}]+)\}')
ALKATEGÓRIA = '{alkategória}'   # futásidejű helyőrző: a státusz felvételekor választott alkategória (a webapp tölti ki)
ALKATEGÓRIA_FORRÁSOK = ('tulajdonságok', 'képzettségek')
ÖSSZEADÓDÓ_MÓDOK = {'előny', 'hátrány', 'enyhít', 'flat', 'scaled', 'override'}   # ismétlésük ugyanarra a célra kétszer számolna


def alkategoria_kifejt(statuszok, tulajdonsagok, kepzettsegek):
    """`alkategória_forrás` → `alkategóriák` lista + `alkategória_címkék` (érték → megjelenítési név), helyben.
    `kepzettsegek`: id-lista vagy {id: név}."""
    errors = []
    for s in statuszok:
        f = s.get('alkategória_forrás')
        if not f: continue
        if s.get('alkategóriák'): errors.append(f"státusz '{s.get('id')}': 'alkategóriák' és 'alkategória_forrás' egyszerre"); continue
        if f not in ALKATEGÓRIA_FORRÁSOK: errors.append(f"státusz '{s.get('id')}': ismeretlen alkategória_forrás '{f}' (megengedett: {ALKATEGÓRIA_FORRÁSOK})"); continue
        if f == 'tulajdonságok':
            s['alkategóriák'] = list(tulajdonsagok)
            s['alkategória_címkék'] = {t: t[:1].upper() + t[1:] for t in tulajdonsagok}
        else:
            nevek = kepzettsegek if isinstance(kepzettsegek, dict) else {k: k for k in kepzettsegek}
            s['alkategóriák'] = list(nevek)
            s['alkategória_címkék'] = dict(nevek)
    return errors


def sablon_hibak(hatasok, effekt_modok, esemenyek):
    """A sablon-katalógus szerkezete: id egyedi, név, paraméter-típusok, mechanika mód / cél, helyőrzők deklarálva."""
    errors, látott = [], set()
    esemeny_ids = {e['id'] for e in esemenyek}
    csoportok = {e.get('csoport') for e in esemenyek}
    for i, h in enumerate(hatasok):
        ctx = f"hatások[{i}] ({h.get('id', '?')})"
        hid = h.get('id')
        if not hid: errors.append(f"{ctx}: hiányzó 'id'")
        elif hid in látott: errors.append(f"{ctx}: duplikált id")
        else: látott.add(hid)
        if not h.get('név'): errors.append(f"{ctx}: hiányzó 'név'")
        params = h.get('paraméterek') or {}
        for pn, pd in params.items():
            if not isinstance(pd, dict) or pd.get('típus') not in PARAM_TIPUSOK:
                errors.append(f"{ctx}: paraméter '{pn}': ismeretlen típus '{(pd or {}).get('típus') if isinstance(pd, dict) else pd}'")
                continue
            if pd['típus'] == 'érzék' and not pd.get('értékek'):
                errors.append(f"{ctx}: paraméter '{pn}': az 'érzék' típushoz 'értékek' lista kell")
            for c in pd.get('csoport') or []:
                if c not in csoportok: errors.append(f"{ctx}: paraméter '{pn}': ismeretlen célpont-csoport '{c}'")
            # 'célpontok': explicit extra allowed targets outside the 'csoport' filter (e.g. ké_dobás for automatikus_kudarc)
            for c in pd.get('célpontok') or []:
                if c not in esemeny_ids: errors.append(f"{ctx}: paraméter '{pn}': ismeretlen célpont '{c}'")
        deklarált = set(params)
        for mező in ('név', 'szöveg'):
            for p in HELYŐRZŐ.findall(h.get(mező) or ''):
                if p not in deklarált: errors.append(f"{ctx}: '{mező}' nem deklarált helyőrző '{{{p}}}'")
        mech = h.get('mechanika')
        if not mech or not isinstance(mech, list): errors.append(f"{ctx}: hiányzó vagy üres 'mechanika'"); continue
        for j, m in enumerate(mech):
            mctx = f"{ctx} mechanika[{j}]"
            if m.get('mód') not in effekt_modok: errors.append(f"{mctx}: ismeretlen mód: '{m.get('mód')}'")
            for k, v in m.items():
                if isinstance(v, str) and HELYŐRZŐ.search(v):
                    for p in HELYŐRZŐ.findall(v):
                        if p not in deklarált: errors.append(f"{mctx}: '{k}' nem deklarált helyőrző '{{{p}}}'")
                elif k == 'cél' and v not in esemeny_ids:
                    errors.append(f"{mctx}: ismeretlen cél: '{v}'")
    return errors


def _param_hiba(pn, pd, v, esemeny_by_id, taktika_ids, fortely_ids):
    t = pd['típus']
    if t == 'szám':
        if not isinstance(v, (int, float)) or isinstance(v, bool): return f"'{pn}' szám kell (kapott: {v!r})"
        if pd.get('értékek') and v not in pd['értékek']: return f"'{pn}' = {v}: megengedett {pd['értékek']}"
    elif t == 'célpont':
        e = esemeny_by_id.get(v)
        if not e: return f"'{pn}': ismeretlen célpont '{v}'"
        if pd.get('csoport') and e.get('csoport') not in pd['csoport'] and v not in (pd.get('célpontok') or []):
            extra = f" + {pd['célpontok']}" if pd.get('célpontok') else ''
            return f"'{pn}' = '{v}': a célpont csoportja '{e.get('csoport')}', megengedett {pd['csoport']}{extra}"
    elif t == 'taktika':
        if v not in taktika_ids: return f"'{pn}': ismeretlen taktika '{v}'"
    elif t == 'fortély':
        if v not in fortely_ids: return f"'{pn}': ismeretlen fortély '{v}'"
    elif t == 'érzék':
        if v not in (pd.get('értékek') or []): return f"'{pn}' = {v!r}: megengedett {pd.get('értékek')}"
    elif t == 'taktika_fok':
        if v != 'MAX' and not (isinstance(v, int) and not isinstance(v, bool) and v >= 1):
            return f"'{pn}' = {v!r}: 1+ egész szám vagy \"MAX\" kell"
    return None


def _megjelenít(pn, pd, v, taktika_nev, fortely_nev):
    """A név / szöveg helyőrző megjelenítési alakja (taktika: név; fok: " (3)" / " (MAX)", hiányzó opcionális: "")."""
    if v is None: return ''
    if pd['típus'] == 'taktika': return taktika_nev.get(v, v)
    if pd['típus'] == 'fortély': return fortely_nev.get(v, v)
    if v == ALKATEGÓRIA: return f" ({v})" if pd['típus'] in ('érzék', 'taktika_fok') else v
    if pd['típus'] == 'érzék': return f" ({v})"
    if pd['típus'] == 'taktika_fok': return f" ({v})"
    return str(v)


def kifejt_statuszok(statuszok, hatasok, esemenyek, taktikak, fortelyok=(), hivatkozas_kotelezo=False):
    """A státuszok `hatás:` sorait kifejti (helyben); visszaadja a hibalistát.
    `fortelyok`: [{id, név}] (validators.fortely_lista); `hivatkozas_kotelezo`: nyers `mód:` sor (sablon nélkül) hiba."""
    sablonok = {h['id']: h for h in hatasok}
    esemeny_by_id = {e['id']: e for e in esemenyek}
    taktika_ids = {t['id'] for t in taktikak}
    taktika_nev = {t['id']: t['név'] for t in taktikak}
    fortely_ids = {f['id'] for f in fortelyok}
    fortely_nev = {f['id']: f['név'] for f in fortelyok}
    errors = []
    for s in statuszok:
        for f in s.get('fokok') or []:
            ki = []
            for k, sor in enumerate(f.get('hatások') or []):
                ctx = f"státusz '{s.get('név')}' fok {f.get('fok')} hatások[{k}]"
                if not isinstance(sor, dict): errors.append(f"{ctx}: nem objektum"); continue
                if 'hatás' not in sor:
                    if hivatkozas_kotelezo: errors.append(f"{ctx}: nyers '{sor.get('mód')}' sor - 'hatás: <id>' hivatkozás kell")
                    ki.append(sor); continue
                sablon = sablonok.get(sor['hatás'])
                if not sablon: errors.append(f"{ctx}: ismeretlen hatás '{sor['hatás']}'"); continue
                pdef = sablon.get('paraméterek') or {}
                ertekek = {pn: v for pn, v in sor.items() if pn not in ('hatás',) + ÁTMENŐ}
                for pn in ertekek:
                    if pn not in pdef: errors.append(f"{ctx}: '{sor['hatás']}': ismeretlen paraméter '{pn}'")
                for pn, pd in pdef.items():
                    if pn not in ertekek:
                        if not pd.get('opcionális'): errors.append(f"{ctx}: '{sor['hatás']}': hiányzó paraméter '{pn}'")
                        continue
                    if ertekek[pn] == ALKATEGÓRIA:
                        alk = s.get('alkategóriák') or []
                        if not alk: errors.append(f"{ctx}: '{sor['hatás']}': '{pn}' = {ALKATEGÓRIA}, de a státusznak nincs alkategóriája")
                        for a in alk:
                            h = _param_hiba(pn, pd, a, esemeny_by_id, taktika_ids, fortely_ids)
                            if h: errors.append(f"{ctx}: '{sor['hatás']}': alkategória '{a}': {h}")
                        continue
                    h = _param_hiba(pn, pd, ertekek[pn], esemeny_by_id, taktika_ids, fortely_ids)
                    if h: errors.append(f"{ctx}: '{sor['hatás']}': {h}")
                if ALKATEGÓRIA in str(sor.get('alcél', '')) and not s.get('alkategóriák'):
                    errors.append(f"{ctx}: alcél {ALKATEGÓRIA} helyőrző, de a státusznak nincs alkategóriája")
                if sablon.get('megjegyzés_kötelező') and not sor.get('megjegyzés'):
                    errors.append(f"{ctx}: '{sor['hatás']}': kötelező 'megjegyzés'")
                disp = {pn: _megjelenít(pn, pd, ertekek.get(pn), taktika_nev, fortely_nev) for pn, pd in pdef.items()}
                tölt = lambda minta: HELYŐRZŐ.sub(lambda m: disp.get(m.group(1), m.group(0)), minta)
                hatás_név = tölt(sablon['név'])
                célp = [pn for pn, pd in pdef.items() if pd['típus'] == 'célpont' and pn in ertekek and '{' + pn + '}' not in sablon['név']]
                if célp and sablon['id'] != 'narratív':
                    hatás_név += ': ' + esemeny_by_id.get(ertekek[célp[0]], {}).get('név', ertekek[célp[0]])
                for m in sablon['mechanika']:
                    row = {}
                    for kk, vv in m.items():
                        if isinstance(vv, str) and HELYŐRZŐ.fullmatch(vv):
                            v = ertekek.get(vv[1:-1])
                            if v is None: continue
                            row[kk] = v
                        elif isinstance(vv, str) and HELYŐRZŐ.search(vv):
                            # részleges helyőrző (pl. "fortély:{fortély}") - a nyers paraméter-érték (id) kerül be;
                            # hiányzó (opcionális) paraméternél a kulcs kimarad (pl. "érzék:{érzék}" érzék nélkül)
                            if any(p not in ertekek for p in HELYŐRZŐ.findall(vv)): continue
                            row[kk] = HELYŐRZŐ.sub(lambda mm: str(ertekek.get(mm.group(1), mm.group(0))), vv)
                        else:
                            row[kk] = vv
                    if sor.get('alcél'): row['alcél'] = sor['alcél']
                    alap = tölt(sablon['szöveg']) if row.get('mód') == 'szöveges' and sablon.get('szöveg') else None
                    mj = sor.get('megjegyzés')
                    mj_ki = f"{alap} - {mj}" if alap and mj else (alap or mj)
                    if mj_ki: row['megjegyzés'] = mj_ki
                    row['hatás_id'] = sablon['id']
                    row['hatás_név'] = hatás_név
                    ki.append(row)
            # Nincs összevonás: a tiltó / szorzó / max-korlát / szöveges sor ismétlése ugyanazt adja (pl. Harcképtelenség +
            # Mozgás - képtelen mindkettő letiltja a harci_képesség-et - a megjelenítésben mindkét Hatás látszik). Az
            # összeadódó (kocka / additív) mód ugyanarra a célra viszont kétszer számolna: hiba.
            látott = set()
            for r in ki:
                if r.get('mód') not in ÖSSZEADÓDÓ_MÓDOK: continue
                kulcs = (r.get('mód'), r.get('cél'), r.get('alcél'))
                if kulcs in látott:
                    errors.append(f"státusz '{s.get('név')}' fok {f.get('fok')}: ismétlődő {kulcs[0]} hatás ugyanarra a célra ({kulcs[1]}{', ' + kulcs[2] if kulcs[2] else ''})")
                látott.add(kulcs)
            f['hatások'] = ki
    return errors
