import unittest
from adapters.dbpedia import parse_bindings
from adapters.eltontraits import parse_traits
class AdapterTests(unittest.TestCase):
    def test_dbpedia_only_explicit_assertions_and_upstream_lineage(self):
        rows=[{'identity':{'value':'http://www.wikidata.org/entity/Q1'},'s':{'value':'http://dbpedia.org/resource/A'},'p':{'value':'http://dbpedia.org/ontology/occupation'},'o':{'value':'http://dbpedia.org/resource/Actor'}}]
        facts=parse_bindings(rows)
        self.assertEqual(facts[0]['subject'],'Q1')
        self.assertEqual(facts[0]['origin'],'wikimedia-unresolved')
        self.assertNotIn('false',str(facts))
    def test_imputed_species_trait_stays_uncertain(self):
        text='Scientific\tDiet.Inv\tDiet.SpecLevel\nA b\t100\t0\nC d\t50\t1\n'
        facts=parse_traits(text)
        self.assertEqual(facts[0]['status'],'imputed')
        self.assertEqual(facts[1]['status'],'supported')
