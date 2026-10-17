import unittest
from normalize import normalize

class NormalizeTests(unittest.TestCase):
    def test_aliases_merge_only_with_explicit_canonical_identity_and_scope(self):
        rows = [{'id':'a','canonicalId':'Q1','name':'Title','scope':'1997'}, {'id':'b','canonicalId':'Q1','name':'Alias','scope':'1997'}, {'id':'c','canonicalId':'Q1','name':'Title','scope':'1953'}]
        subjects, aliases = normalize(rows)
        self.assertEqual(len(subjects), 2)
        self.assertEqual(aliases['a'], aliases['b'])
        self.assertNotEqual(aliases['a'], aliases['c'])
    def test_label_alone_never_merges(self):
        subjects, _ = normalize([{'id':'a','name':'Same'}, {'id':'b','name':'Same'}])
        self.assertEqual(len(subjects), 2)
    def test_ambiguous_legacy_alias_rejected(self):
        with self.assertRaisesRegex(ValueError, 'alias'):
            normalize([{'id':'a','name':'A','aliases':['old']}, {'id':'b','name':'B','aliases':['old']}])
