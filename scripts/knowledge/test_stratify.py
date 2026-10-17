import unittest
from stratify import select
class StratifyTests(unittest.TestCase):
    def test_featured_head_middle_tail_distinct_and_exact_size(self):
        rows=[{'id':str(i),'name':str(i),'featured':i<20,'facts':{'p':list(range(i%10))}} for i in range(300)]
        result=select(rows)
        self.assertEqual(len(result),100)
        self.assertEqual(len({s['id'] for s in result}),100)
        self.assertEqual(sum(s['stratum']=='featured-head' for s in result),20)
        self.assertEqual({s['stratum'] for s in result},{'featured-head','middle-source-density','sparse-tail'})
