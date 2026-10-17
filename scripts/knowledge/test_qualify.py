import unittest
from qualify import qualify, universe_digest

QUESTIONS = [{'id':str(i),'topic':str(i%5)} for i in range(20)]
def subject(id, value):
    return {'id':id,'name':id,'scope':'default','traits':{str(i):value for i in range(20)},'factEvidence':{str(i):[{'status':'supported','origin':'source'+str(i%2),'evidenceGroup':str(i)}] for i in range(20)}}
class QualificationTests(unittest.TestCase):
    def test_screening_is_not_replay_qualification(self):
        rows=[subject('a',True),subject('b',False)]
        result=qualify(rows, QUESTIONS)
        self.assertTrue(result[0]['qualification']['screened'])
        self.assertFalse(result[0]['qualification']['qualified'])
    def test_unknown_rival_is_not_negative_and_correlated_clues_fail(self):
        a=subject('a',True); b=subject('b',True); b['traits']={}
        self.assertFalse(qualify([a,b],QUESTIONS)[0]['qualification']['screened'])
        a=subject('a',True); b=subject('b',False)
        for facts in a['factEvidence'].values(): facts[0]['evidenceGroup']='same'
        self.assertFalse(qualify([a,b],QUESTIONS)[0]['qualification']['screened'])
    def test_replay_must_match_entire_union_and_five_seeds(self):
        rows=[subject('a',True),subject('b',False)]
        receipt={'universeDigest':universe_digest(rows,QUESTIONS),'seeds':[1,2,3,4,5],'exactSubjectIds':['a','b']}
        self.assertTrue(qualify(rows,QUESTIONS,receipt)[0]['qualification']['qualified'])
        self.assertFalse(qualify(rows+[subject('c',True)],QUESTIONS,receipt)[0]['qualification']['qualified'])
