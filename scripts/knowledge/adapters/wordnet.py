"""WordNet sense identities and hypernyms; no synonym inflation or label-only joins."""
import io
import tarfile
from pilot import atomic_write, stable_json

def acquire(cache, output, limit=100):
    url='https://wordnetcode.princeton.edu/3.0/WNdb-3.0.tar.gz'
    body=cache.get(url)
    with tarfile.open(fileobj=io.BytesIO(body),mode='r:gz') as archive:
        text=archive.extractfile('dict/data.noun').read().decode('ascii')
    notice='\n'.join(line for line in text.splitlines() if line.startswith('  '))+'\n'
    records=[]
    for line in text.splitlines():
        if line.startswith('  '): continue
        fields=line.split('|',1)[0].split()
        if fields[1]!='06': continue
        count=int(fields[3],16)
        words=[fields[4+2*i].replace('_',' ') for i in range(count)]
        offset=4+2*count; pointer_count=int(fields[offset]); hypernyms=[]
        for i in range(pointer_count):
            symbol,target,pos,_=fields[offset+1+i*4:offset+5+i*4]
            if symbol in ('@','@i'): hypernyms.append('wn30:'+pos+':'+target)
        records.append({'id':'wn30:n:'+fields[0],'name':words[0],'aliases':words[1:],'scope':'WordNet 3.0 noun sense','hypernyms':hypernyms,'source':'wordnet','origin':'princeton-wordnet-3.0'})
    atomic_write(output/'wordnet-LICENSE.txt',notice.encode())
    atomic_write(output/'wordnet.json',(stable_json({'subjects':records[:limit],'receipt':cache.metadata(url)})+'\n').encode())
    return {'artifactSensesAvailable':len(records),'storedSampleSenses':min(len(records),limit),'joinedToPilot':0,'note':'Synonyms are aliases, not extra subjects. Sense joins and familiar distinguishing propositions pending.'}
