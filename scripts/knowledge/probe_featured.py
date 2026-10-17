#!/usr/bin/env python3
"""Probe featured-source links; source pages are identity candidates, never silent merges."""
import json
from pathlib import Path
from urllib.parse import urlencode
from pilot import Cache,atomic_write,stable_json
ROOT=Path(__file__).resolve().parents[2]

def run():
    cache=Cache('/tmp/openguess-knowledge-v3');subjects=[];receipts=[];failures=[]
    for theme in ['people','fictional','animals','objects','movies']:
        pack=json.loads((ROOT/'src/data/packs'/(theme+'.json')).read_text())
        for c in pack['characters']:
            if not c.get('featured'):continue
            urls=[c.get('source',{}).get('url',''),*c.get('annotationSources',[])]
            wiki=next((u for u in urls if u.startswith('https://en.wikipedia.org/wiki/')),None)
            subjects.append({'id':c['id'],'theme':theme,'name':c['name'],'sourcePage':wiki,'status':'pending','candidateQids':[]})
    for start in range(0,len(subjects),20):
        batch=subjects[start:start+20];clauses=[]
        for i,s in enumerate(batch):
            if s['id'].startswith('Q'):
                clauses.append('{ ?resource <http://www.w3.org/2002/07/owl#sameAs> <http://www.wikidata.org/entity/'+s['id']+'> . BIND('+str(i)+' AS ?row) BIND(<http://www.wikidata.org/entity/'+s['id']+'> AS ?identity) }')
            elif s['sourcePage']:
                resource='http://dbpedia.org/resource/'+s['sourcePage'].split('/wiki/',1)[1]
                clauses.append('{ <'+resource+'> <http://www.w3.org/2002/07/owl#sameAs> ?identity . FILTER(STRSTARTS(STR(?identity),"http://www.wikidata.org/entity/")) BIND('+str(i)+' AS ?row) }')
        if not clauses:continue
        query='SELECT DISTINCT ?row ?identity WHERE { '+' UNION '.join(clauses)+' }'
        url='https://dbpedia.org/sparql?'+urlencode({'query':query,'format':'application/sparql-results+json'})
        try:
            rows=json.loads(cache.get(url))['results']['bindings'];receipts.append(cache.metadata(url))
            for r in rows:
                s=batch[int(r['row']['value'])];qid=r['identity']['value'].rsplit('/',1)[-1]
                if qid not in s['candidateQids']:s['candidateQids'].append(qid)
        except (OSError,ValueError,KeyError) as error:failures.append(str(error))
    for s in subjects:
        s['status']='existing-qid-provider-match' if s['id'].startswith('Q') and s['candidateQids'] else 'source-page-candidate-needs-scope-audit' if s['candidateQids'] else 'unmatched'
    report={'totalFeatured':len(subjects),'existingQidMatches':sum(s['status']=='existing-qid-provider-match' for s in subjects),'sourcePageCandidates':sum(s['status']=='source-page-candidate-needs-scope-audit' for s in subjects),'unmatched':sum(s['status']=='unmatched' for s in subjects),'autoMerged':0,'failures':failures,'limitation':'A source page can describe a work, broad animal group, object type or different portrayal. Provider sameAs is recorded for audit, not accepted as identity equivalence.'}
    atomic_write(ROOT/'scripts/knowledge/data/featured-source-probe.json',(stable_json({'subjects':subjects,'report':report,'receipts':receipts})+'\n').encode())
    print(report,flush=True)
if __name__=='__main__':run()
