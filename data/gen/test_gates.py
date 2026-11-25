"""Build-gate-ek pozitív + negatív tesztje (refaktor 8. fázis).

Minden gate kétszer: a VALÓDI forrásadaton nem jelez (pozitív), egy szándékosan elrontott másolaton jelez (negatív) -
különben egy rossz útvonal vagy üres bemenet miatt csendben „0 hibát" adhatna.
Futtatás (a `data/` könyvtárból): python3 -m unittest gen.test_gates
"""
import contextlib
import copy
import io
import os
import tempfile
import unittest

from .common import SOURCES_DIR, SCHEMAS_DIR, load_yaml
from .schema import validate_schema
from .naming_lint import lint
from .validators import (
    validate_aktiv_ful, validate_esemenyek, validate_statuszok, validate_harci_helyzet_hatasok,
    validate_hatasok_katalogus, validate_effekt_hivatkozasok, id_hibak, session_toggle_hibak, proba_alcel_hibak,
    proba_alcel_refs,
)
from .hivatkozas import id_hivatkozasi_hibak, manover_ref_hibak, kepz_ref_hiba, fortely_ids
from .kiterjesztes_check import kiterjesztes_sync_hibak, kiterjesztes_leiras_hibak, md_tetel_leiras_van


def bukik(test, fn, *args):
    """A gate SystemExit-tel áll le (a várt hibaüzenetet elnyelve)."""
    with contextlib.redirect_stdout(io.StringIO()), test.assertRaises(SystemExit):
        fn(*args)


def src(*p):
    return load_yaml(os.path.join(SOURCES_DIR, *p))


class Adat:
    """A valódi forrásadat egyszer betöltve (a gate-ek ugyanígy kapják a pipeline-ban)."""
    taktikak = src('taktikak.yaml')['taktikák']
    helyzetek = src('harci_helyzetek.yaml')['harci_helyzetek']
    manoverek = src('manoverek.yaml')['manőverek']
    esemenyek = src('esemenyek.yaml')['események']
    statuszok = src('statuszok.yaml')['státuszok']
    hatasok = src('hatasok.yaml')['hatások']
    extrak = src('fegyverek', 'extrak.yaml')['extrak']
    konstansok = src('konstansok.yaml')
    effekt_modok = set(konstansok['effekt_módok'])
    harcertek_celok = konstansok.get('harcérték_célok', [])


class SchemaGate(unittest.TestCase):
    def test_valodi_fortely_ok(self):
        validate_schema('fortely', [src('fortelyok', 'harci', 'belharcos.yaml')], 'teszt')

    def test_ismeretlen_kulcs_bukik(self):
        d = copy.deepcopy(src('fortelyok', 'harci', 'belharcos.yaml')); d['nincs_ilyen_mezo'] = 1
        bukik(self, validate_schema, 'fortely', [d], 'teszt')

    def test_hianyzo_kotelezo_bukik(self):
        d = copy.deepcopy(src('fortelyok', 'harci', 'belharcos.yaml')); del d['név']
        bukik(self, validate_schema, 'fortely', [d], 'teszt')


class NamingGate(unittest.TestCase):
    def test_valodi_forrasok_ok(self):
        self.assertEqual(lint([SOURCES_DIR]), [])

    def test_vegyes_kisnagybetus_kulcs_bukik(self):
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, 'x.yaml'), 'w', encoding='utf-8') as f: f.write('RosszKulcs: 1\njó_kulcs: 2\n')
            self.assertEqual(len(lint([d])), 1)


class AktivFulGates(unittest.TestCase):
    A = Adat

    def test_valodi_ok(self):
        A = self.A
        validate_aktiv_ful(A.taktikak, A.helyzetek, [], A.manoverek, A.effekt_modok)
        validate_esemenyek(A.esemenyek, proba_alcel_refs(SOURCES_DIR, A.statuszok), A.konstansok['képzettség_csoportok'])
        validate_statuszok(A.statuszok, A.effekt_modok, A.esemenyek)
        validate_harci_helyzet_hatasok(A.helyzetek, A.effekt_modok, A.esemenyek, A.harcertek_celok)
        validate_hatasok_katalogus(A.hatasok, A.effekt_modok, A.esemenyek)
        validate_effekt_hivatkozasok(A.helyzetek, A.extrak, A.statuszok)

    def test_esemeny_duplikalt_id_bukik(self):
        e = copy.deepcopy(self.A.esemenyek); e.append(copy.deepcopy(e[0]))
        bukik(self, validate_esemenyek, e)

    def _esemeny_kat_bukik(self, módosít):
        e = copy.deepcopy(self.A.esemenyek)
        módosít({x['id']: x for x in e})
        bukik(self, validate_esemenyek, e, proba_alcel_refs(SOURCES_DIR, self.A.statuszok), self.A.konstansok['képzettség_csoportok'])

    def test_proba_kategoria_ismeretlen_tulajdonsag_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['fizikai_próba']['tulajdonságok'].append('nincs_ilyen'))

    def test_proba_kategoria_atfedes_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['fizikai_próba']['tulajdonságok'].append('intelligencia'))

    def test_proba_kategoria_hianyos_lefedes_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['szellemi_próba']['tulajdonságok'].remove('érzékenység'))

    def test_proba_kategoria_ismeretlen_kepzettseg_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['szociális_próba']['képzettségek'].append('nincs_ilyen'))

    def test_proba_kategoria_ismeretlen_csoport_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['nem_harci_próba']['kizárt_csoportok'].append('nincs_ilyen'))

    def test_proba_kategoria_nem_proba_csoporton_bukik(self):
        self._esemeny_kat_bukik(lambda d: d['mozgás'].update({'tulajdonságok': ['erő']}))

    def test_statusz_ismeretlen_mod_bukik(self):
        s = copy.deepcopy(self.A.statuszok)
        hat = next(h for st in s for f in st['fokok'] for h in (f.get('hatások') or []))
        hat['mód'] = 'nincs_ilyen_mód'
        bukik(self, validate_statuszok, s, self.A.effekt_modok, self.A.esemenyek)

    def test_helyzet_hatas_ismeretlen_mod_bukik(self):
        h = copy.deepcopy(self.A.helyzetek)
        next(x for x in h if x.get('hatások'))['hatások'][0]['mód'] = 'nincs_ilyen_mód'
        bukik(self, validate_harci_helyzet_hatasok, h, self.A.effekt_modok, self.A.esemenyek, self.A.harcertek_celok)

    def test_helyzet_megjegyzes_dobasra_ismeretlen_cel_bukik(self):
        h = copy.deepcopy(self.A.helyzetek)
        next(x for x in h if x.get('megjegyzés_dobásra'))['megjegyzés_dobásra']['nincs_ilyen_cél'] = 'szöveg'
        bukik(self, validate_harci_helyzet_hatasok, h, self.A.effekt_modok, self.A.esemenyek, self.A.harcertek_celok)

    def test_hatas_katalogus_ismeretlen_mod_bukik(self):
        h = copy.deepcopy(self.A.hatasok); h[0]['mechanika'][0]['mód'] = 'nincs_ilyen_mód'
        bukik(self, validate_hatasok_katalogus, h, self.A.effekt_modok, self.A.esemenyek)

    def test_effekt_hivatkozas_ismeretlen_helyzet_bukik(self):
        x = copy.deepcopy(self.A.extrak)
        x[0]['feltétel'] = (x[0].get('feltétel') or []) + [{'típus': 'harci_helyzet', 'id': 'nincs_ilyen_helyzet'}]
        bukik(self, validate_effekt_hivatkozasok, self.A.helyzetek, x, self.A.statuszok)

    def test_aktiv_ful_ismeretlen_taktika_mod_bukik(self):
        t = copy.deepcopy(self.A.taktikak)
        next(x for x in t if x.get('hatások'))['hatások'][0]['mód'] = 'nincs_ilyen_mód'
        bukik(self, validate_aktiv_ful, t, self.A.helyzetek, [], self.A.manoverek, self.A.effekt_modok)


class TisztaGates(unittest.TestCase):
    def test_id_hibak(self):
        self.assertEqual(id_hibak([('a', {'id': 'jó_id'}), ('b', {'id': 'másik'})], 'fortély'), [])
        self.assertEqual(len(id_hibak([('a', {'id': 'x'}), ('b', {'id': 'x'})], 'fortély')), 1)       # duplikált
        self.assertEqual(len(id_hibak([('a', {'id': 'Nagy Betű'})], 'fortély')), 1)                    # formátum
        self.assertEqual(len(id_hibak([('a', {})], 'fortély')), 1)                                     # hiányzó

    def test_session_toggle(self):
        session = load_yaml(os.path.join(SCHEMAS_DIR, 'karakter.yaml'))['session']
        self.assertEqual(session_toggle_hibak([{'id': 'harci_akrobatika', 'session_toggle': True}], session), [])
        self.assertEqual(len(session_toggle_hibak([{'id': 'uj_toggle', 'session_toggle': True}], session)), 1)

    def test_proba_alcel(self):
        refs = {'képzettség': {'akrobatika'}}
        self.assertEqual(proba_alcel_hibak('képzettségpróba', 'képzettség:akrobatika', 'x', refs), [])
        self.assertEqual(len(proba_alcel_hibak('képzettségpróba', 'képzettség:nincs', 'x', refs)), 1)
        self.assertEqual(len(proba_alcel_hibak('képzettségpróba', 'akrobatika', 'x', refs)), 1)       # prefix nélkül


class HivatkozasGates(unittest.TestCase):
    def test_id_hivatkozas_valodi_ok(self):
        self.assertEqual(id_hivatkozasi_hibak(), [])

    def test_kepz_ref(self):
        self.assertIsNone(kepz_ref_hiba('akrobatika'))
        self.assertIsNotNone(kepz_ref_hiba('nincs_ilyen_kepzettseg'))
        self.assertIn('harci_akrobatika', fortely_ids())

    def test_manover_ref(self):
        self.assertEqual(manover_ref_hibak(), [])   # valódi (generált) táblák
        rossz = [{'név': 'X', 'fokok': [{'fok': 1, 'módosítók': [{'cél': 'manőver:nincs_ilyen'}]}]}]
        self.assertEqual(len(manover_ref_hibak(rossz, {'lefegyverzés'})), 1)
        self.assertEqual(manover_ref_hibak([{'név': 'X', 'fokok': [{'fok': 1, 'módosítók': [{'cél': 'manőver:a'}]}]}], {'a'}), [])

    def test_kiterjesztes_sync_valodi_ok(self):
        self.assertEqual(kiterjesztes_sync_hibak(), [])

    def test_kiterjesztes_leiras_valodi_ok(self):
        self.assertEqual(kiterjesztes_leiras_hibak(), [])

    def test_md_tetel_leiras_felismeres(self):
        sorok = ['- [A](x.md): Leírás a sorban.', '- [B](x.md):', '  - alpont leírás', '- [C](x.md)\\', '(közös megjegyzés)', '- [D](x.md)']
        self.assertTrue(md_tetel_leiras_van(sorok, 0, ': Leírás a sorban.'))
        self.assertTrue(md_tetel_leiras_van(sorok, 1, ':'))           # sub-bullets under it
        self.assertFalse(md_tetel_leiras_van(sorok, 3, '\\'))        # only the md line break
        self.assertFalse(md_tetel_leiras_van(sorok, 5, ''))

    def test_kiterjesztes_leiras_md_maradek_bukik(self):
        kit = {'természetjárás': [
            {'fortély': 'tájtípus_sivatagi', 'leírás': '\\'},
            {'fortély': 'tájtípus_erdős', 'leírás': ''},
            {'fortély': 'keresés_rejtés', 'leírás': 'Nyomok észrevétele.'},
        ]}
        hibak = kiterjesztes_leiras_hibak(kit)
        self.assertEqual(len(hibak), 1)
        self.assertIn('tájtípus_sivatagi', hibak[0])



class FrissessegCache(unittest.TestCase):
    """A failed generation must not leave a valid source hash (else restoring the sources skips regeneration)."""

    def test_bukott_futas_utan_nincs_ervenyes_hash(self):
        import tempfile
        import sys as _sys
        from unittest import mock
        from . import cache
        import generate_tables
        with tempfile.TemporaryDirectory() as tmp:
            hash_file = os.path.join(tmp, '.sources_hash')
            with mock.patch.object(cache, 'HASH_FILE', hash_file):
                cache.write_hash()                       # state after a previous successful run
                self.assertTrue(cache.sources_unchanged())

                def bukik_generator():
                    raise SystemExit(1)                  # a generator / gate stops the run mid-way
                with mock.patch.object(generate_tables, 'GENERATORS', [bukik_generator]), \
                        mock.patch.object(_sys, 'argv', ['generate_tables.py', '--force']), \
                        contextlib.redirect_stdout(io.StringIO()), self.assertRaises(SystemExit):
                    generate_tables.main()
                self.assertFalse(cache.sources_unchanged(), 'a bukott futás után nem maradhat érvényes hash')


if __name__ == '__main__':
    unittest.main()
