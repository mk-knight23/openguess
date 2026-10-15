"""Reproducible build-time source cache. No network requests occur in the game."""
import hashlib
import json
import pathlib
import subprocess
import time
from datetime import datetime, timezone

USER_AGENT = 'OpenGuessKnowledge/0.3 (https://github.com/mk-knight23/openguess)'

def digest(value):
    return hashlib.sha256(value).hexdigest()

def stable_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))

def atomic_write(path, content):
    temporary = path.with_suffix(path.suffix + '.part')
    temporary.write_bytes(content)
    temporary.replace(path)

class Cache:
    """Serial, rate-limited, checksum-verified URL cache; successful requests resume."""
    def __init__(self, root, interval=1.1, transport=None):
        self.root = pathlib.Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.interval = interval
        self.transport = transport or self.download
        self.last_request = 0

    @staticmethod
    def download(url):
        result = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location',
                                 '--max-time', '60', '--retry', '1', '--retry-delay', '3',
                                 '--user-agent', USER_AGENT, url], capture_output=True)
        if result.returncode:
            raise OSError(result.stderr.decode(errors='replace').strip())
        return result.stdout

    def get(self, url):
        key = digest(url.encode())
        body = self.root / (key + '.body')
        metadata = self.root / (key + '.meta.json')
        if body.exists() and metadata.exists():
            data = body.read_bytes()
            if digest(data) != json.loads(metadata.read_text())['sha256']:
                raise ValueError('cache checksum mismatch: ' + str(body))
            return data
        time.sleep(max(0, self.last_request + self.interval - time.monotonic()))
        try:
            self.last_request = time.monotonic()
            data = self.transport(url)
        except Exception as error:
            failures = self.root / 'failures.json'
            events = json.loads(failures.read_text()) if failures.exists() else []
            events.append({'url': url, 'error': str(error), 'retrievedAt': datetime.now(timezone.utc).isoformat()})
            atomic_write(failures, stable_json(events).encode())
            raise
        meta = {'url': url, 'sha256': digest(data), 'bytes': len(data),
                'retrievedAt': datetime.now(timezone.utc).isoformat(), 'userAgent': USER_AGENT}
        atomic_write(body, data)
        atomic_write(metadata, stable_json(meta).encode())
        return data

    def metadata(self, url):
        return json.loads((self.root / (digest(url.encode()) + '.meta.json')).read_text())

def validate_assertion(assertion, registry):
    source = registry.get(assertion.get('source'), {})
    if not source.get('license') or not source.get('licenseUrl'):
        raise ValueError('source license and licenseUrl required')
    if not source.get('origin'):
        raise ValueError('upstream origin required')
    return source['origin']
