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
    def test_published_hyphenated_columns_and_certainty_preserved(self):
        facts=parse_traits('Scientific\tDiet-Inv\tDiet-Certainty\tBodyMass-Value\tBodyMass-SpecLevel\nA b\t100\t3\t20\t1\n')
        self.assertEqual(len(facts),2)
        self.assertEqual(facts[0]['certaintyFlag'],'3')
        self.assertEqual(facts[0]['status'],'imputed')
        self.assertEqual(facts[1]['status'],'supported')
    def test_wordnet_synonyms_are_one_sense_and_notice_retained(self):
        import io,tarfile,tempfile,json
        from pathlib import Path
        from pilot import Cache
        from adapters.wordnet import acquire
        payload=b'  1 License notice\n00000001 06 n 02 axe 0 ax 0 001 @ 00000002 n 0000 | definition excluded\n'
        body=io.BytesIO()
        with tarfile.open(fileobj=body,mode='w:gz') as archive:
            member=tarfile.TarInfo('dict/data.noun');member.size=len(payload);archive.addfile(member,io.BytesIO(payload))
        with tempfile.TemporaryDirectory() as root:
            output=Path(root);cache=Cache(output/'cache',interval=0,transport=lambda url:body.getvalue())
            report=acquire(cache,output)
            subjects=json.loads((output/'wordnet.json').read_text())['subjects']
            self.assertEqual(report['storedSampleSenses'],1)
            self.assertEqual(subjects[0]['aliases'],['ax'])
            self.assertIn('License notice',(output/'wordnet-LICENSE.txt').read_text())
            self.assertNotIn('definition',str(subjects))
