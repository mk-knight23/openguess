import unittest
from compile import compile_subjects, validate_questions

SOURCE = {'s': {'license':'CC0','licenseUrl':'https://example.test/license','origin':'upstream'}}
Q = [{'id':'q','topic':'biology','proposition':'has-wings'}]
def assertion(value, **kw):
    return {'id':str(value), 'subject':'a', 'question':'q','value':value,'source':'s','scope':'default','evidenceGroup':'g', **kw}
class CompileTests(unittest.TestCase):
    def build(self, assertions):
        return compile_subjects([{'id':'a','name':'A','scope':'default'}], assertions, Q, SOURCE)['subjects'][0]
    def test_absence_is_unknown_and_conflict_keeps_lineage(self):
        self.assertEqual(self.build([])['traits'], {})
        subject = self.build([assertion(True), assertion(False)])
        self.assertEqual(subject['traits'], {})
        self.assertEqual(subject['factEvidence']['q'][0]['status'], 'conflict')
    def test_scope_mismatch_and_uncertain_evidence_are_not_boolean(self):
        self.assertEqual(self.build([assertion(False,scope='other')])['traits'], {})
        self.assertEqual(self.build([assertion(True,status='imputed')])['traits'], {})
    def test_missing_license_and_unknown_question_fail(self):
        with self.assertRaisesRegex(ValueError,'license'):
            compile_subjects([{'id':'a','name':'A'}], [assertion(True)], Q, {})
        with self.assertRaisesRegex(ValueError,'question'):
            self.build([assertion(True,question='missing')])
    def test_cycles_fail_and_output_is_deterministic(self):
        with self.assertRaisesRegex(ValueError,'cycle'):
            validate_questions([{'id':'a','topic':'x','proposition':'a','implies':['b']},{'id':'b','topic':'x','proposition':'b','implies':['a']}])
        self.assertEqual(self.build([assertion(True)])['traits'], {'q':True})
        self.assertEqual(self.build([assertion(True)]), self.build([assertion(True)]))
    def test_measurement_scope_is_bound_to_question_not_entire_entity(self):
        questions=[{'id':'q','topic':'size','proposition':'average-adult-mass','scope':'species adult average'}]
        result=compile_subjects([{'id':'a','name':'A','scope':'species identity'}],[assertion(True,scope='species adult average')],questions,SOURCE)
        self.assertEqual(result['subjects'][0]['traits'],{'q':True})
