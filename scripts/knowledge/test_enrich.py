import unittest
from enrich_animals import compile_trait_assertions, join_species
class EnrichTests(unittest.TestCase):
    def test_exact_species_join_rejects_genus_ambiguity_and_name_guess(self):
        rows=[{'subject':'Q1','scientific':'Panthera leo','rank':'Q7432'}, {'subject':'Q2','scientific':'Panthera','rank':'Q34740'}]
        self.assertEqual(join_species(rows,{'Panthera leo','Panthera'}),{'Q1':'Panthera leo'})
        rows.append({'subject':'Q1','scientific':'Panthera spelaea','rank':'Q7432'})
        self.assertNotIn('Q1',join_species(rows,{'Panthera leo','Panthera spelaea'}))
    def test_numeric_threshold_is_scoped_and_omitted_or_imputed_is_unknown(self):
        facts=[{'id':'f','subject':'Panthera leo','predicate':'BodyMass-Value','object':'120000','speciesLevelFlag':'1','sourceMethod':'Literature','source':'eltontraits','origin':'eltontraits-1.0'}]
        assertions,questions=compile_trait_assertions({'Q1':'Panthera leo'},facts)
        self.assertTrue(assertions[0]['value']);self.assertEqual(assertions[0]['evidenceGroup'],'f')
        facts[0]['speciesLevelFlag']='2'
        self.assertEqual(compile_trait_assertions({'Q1':'Panthera leo'},facts)[0],[])
        facts[0]['speciesLevelFlag']='1';facts[0]['sourceMethod']='PrimScale'
        self.assertEqual(compile_trait_assertions({'Q1':'Panthera leo'},facts)[0],[])
