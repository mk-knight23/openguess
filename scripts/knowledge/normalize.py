"""Conservative identity normalization: labels never establish equivalence."""
import hashlib

def normalize(rows):
    groups, aliases = {}, {}
    for row in sorted(rows, key=lambda r: (r.get('canonicalId',r['id']),r.get('scope','default'),r['id'])):
        scope = row.get('scope','default')
        canonical = row.get('canonicalId', row['id'])
        key = (canonical, scope)
        identity = canonical if scope == 'default' else canonical + '@' + hashlib.sha256(scope.encode()).hexdigest()[:16]
        subject = groups.setdefault(key, {'id':identity,'name':row['name'],'scope':scope,'aliases':[]})
        for alias in [row['id'], *row.get('aliases',[])]:
            if alias in aliases and aliases[alias] != identity:
                raise ValueError('ambiguous legacy alias: ' + alias)
            aliases[alias] = identity
            if alias != identity and alias not in subject['aliases']: subject['aliases'].append(alias)
    return list(groups.values()), dict(sorted(aliases.items()))
