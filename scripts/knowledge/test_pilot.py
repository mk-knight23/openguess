import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from pilot import Cache, validate_assertion

class SourceBoundaryTests(unittest.TestCase):
    def test_missing_license_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'license'):
            validate_assertion({'source': 'bad'}, {'bad': {'origin': 'original'}})

    def test_cache_replays_exact_bytes_and_detects_corruption(self):
        with tempfile.TemporaryDirectory() as root:
            calls = []
            cache = Cache(Path(root), interval=0, transport=lambda url: calls.append(url) or b'{"fact":true}')
            first = cache.get('https://example.test/facts')
            second = cache.get('https://example.test/facts')
            self.assertEqual(first, second)
            self.assertEqual(len(calls), 1)
            meta = json.loads(next(Path(root).glob('*.meta.json')).read_text())
            self.assertEqual(meta['sha256'], hashlib.sha256(first).hexdigest())
            next(Path(root).glob('*.body')).write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError, 'checksum'):
                cache.get('https://example.test/facts')

    def test_failed_acquisition_is_explicit_and_never_cached_as_success(self):
        with tempfile.TemporaryDirectory() as root:
            def fail(url): raise OSError('offline')
            cache = Cache(Path(root), interval=0, transport=fail)
            with self.assertRaises(OSError): cache.get('https://example.test/fail')
            report = json.loads((Path(root) / 'failures.json').read_text())
            self.assertEqual(report[0]['error'], 'offline')
            self.assertEqual(list(Path(root).glob('*.body')), [])

    def test_mirrors_retain_same_upstream_origin(self):
        registry = {s: {'license': 'CC0-1.0', 'origin': 'eltontraits', 'licenseUrl': 'https://example.test/license'} for s in ['original','mirror']}
        self.assertEqual(validate_assertion({'source':'original'}, registry), 'eltontraits')
        self.assertEqual(validate_assertion({'source':'mirror'}, registry), 'eltontraits')

if __name__ == '__main__': unittest.main()
