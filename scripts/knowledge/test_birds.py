import unittest
from enrich_birds import project_bird
class BirdProjectionTests(unittest.TestCase):
    def test_known_percent_zero_negative_missing_unknown_and_groups_shared(self):
        row={'Scientific':'A b','Diet-Certainty':'A','Diet-Inv':'0','Diet-Fruit':'25','Diet-Source':'Ref_1','ForStrat-SpecLevel':'1','ForStrat-ground':'100','ForStrat-aerial':'0','ForStrat-Source':'Ref_1','Nocturnal':'0','BodyMass-SpecLevel':'1','BodyMass-Source':'Dunning08','BodyMass-Value':'2500','BLFamilyLatin':'Family','BLFamilyEnglish':'Test birds'}
        facts,questions=project_bird('Q1',row)
        byq={a['question']:a for a in facts}
        self.assertFalse(byq['bird_diet_invertebrates']['value'])
        self.assertTrue(byq['bird_diet_fruit']['value'])
        self.assertNotIn('bird_diet_seeds',byq)
        self.assertEqual(byq['bird_diet_invertebrates']['evidenceGroup'],byq['bird_diet_fruit']['evidenceGroup'])
    def test_imputed_data_never_produces_boolean(self):
        row={'Scientific':'A b','Diet-Certainty':'D1','Diet-Inv':'100','ForStrat-SpecLevel':'0','ForStrat-ground':'100','BodyMass-SpecLevel':'2','BodyMass-Source':'Imputed','BodyMass-Value':'2500'}
        self.assertEqual(project_bird('Q1',row)[0],[])
    def test_complete_profile_has_twenty_propositions_five_topics_and_correlated_mass_group(self):
        from enrich_birds import DIET,FORAGE
        row={'Scientific':'A b','Diet-Certainty':'A','Diet-Source':'Ref_1','ForStrat-SpecLevel':'1','ForStrat-Source':'Ref_1','Nocturnal':'0','BodyMass-SpecLevel':'1','BodyMass-Source':'Dunning08','BodyMass-Value':'2500','BLFamilyLatin':'Family','BLFamilyEnglish':'Test birds'}
        row.update({'Diet-'+key:'0' for key in DIET});row.update({'ForStrat-'+key:'0' for key in FORAGE})
        facts,questions=project_bird('Q1',row)
        self.assertGreaterEqual(len(facts),20);self.assertEqual(len({q['topic'] for q in questions}),5)
        mass=[a for a in facts if a['question'].startswith('bird_mass_')]
        self.assertEqual(len(mass),4);self.assertEqual(len({a['evidenceGroup'] for a in mass}),1)
