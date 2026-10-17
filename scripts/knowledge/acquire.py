#!/usr/bin/env python3
"""Bounded real-source pilot. Raw assertions are quarantined, never auto-playable."""
import argparse
import hashlib
import json
from pathlib import Path
from pilot import Cache, atomic_write, stable_json
from adapters.dbpedia import query_url, parse_bindings
from adapters.eltontraits import parse_traits
from adapters.wordnet import acquire as acquire_wordnet

ROOT=Path(__file__).resolve().parents[2]

def run(cache_root, limit=100):
    cache=Cache(cache_root)
    output=ROOT/'scripts/knowledge/data'; output.mkdir(exist_ok=True)
    report={'schemaVersion':1,'requestedPerCategory':limit,'categories':{},'sources':{},'qualifiedTotal':0,'limitations':['Pilot selection is deterministic by ID, not yet stratified by familiarity.','DBpedia and Wikidata share conservative Wikimedia origin; they are not independent corroboration.','Raw structured assertions are not reviewed familiar question propositions.','Complete-universe semantic replay has not run.']}
    for theme in ['people','fictional','animals','objects','movies']:
        pack=json.loads((ROOT/'src/data/packs'/f'{theme}.json').read_text())
        candidates=sorted([c for c in pack['characters'] if c['id'].startswith('Q') and c.get('facts')],key=lambda c:c['id'])[:limit]
        assertions=[]; failures=[]; receipts=[]
        for start in range(0,len(candidates),20):
            url=query_url([c['id'] for c in candidates[start:start+20]])
            try:
                payload=json.loads(cache.get(url)); assertions.extend(parse_bindings(payload['results']['bindings']))
                receipts.append(cache.metadata(url))
            except (OSError,ValueError,KeyError) as error: failures.append(str(error))
        wd=[]
        for c in candidates:
            for predicate,values in c['facts'].items():
                for value in values:
                    key=hashlib.sha256((c['id']+'|'+predicate+'|'+value).encode()).hexdigest()
                    wd.append({'id':'wikidata-legacy:'+key,'subject':c['id'],'predicate':predicate,'object':value,'source':'wikidata','origin':'wikimedia-unresolved','status':'supported','retrievedAt':c.get('source',{}).get('retrievedAt'),'lineageLimitation':'Legacy truthy export; original statement/reference IDs unavailable.'})
        data={'subjects':[{'id':c['id'],'name':c['name'],'scope':'default'} for c in candidates],'assertions':wd+assertions,'receipts':receipts}
        atomic_write(output/(theme+'-pilot.json'),(stable_json(data)+'\n').encode())
        report['categories'][theme]={'selected':len(candidates),'wikidataAssertions':len(wd),'dbpediaSubjects':len({a['subject'] for a in assertions}),'dbpediaAssertions':len(assertions),'sourceFamiliesAcquired':2 if assertions else 1,'independentOrigins':1,'screened':0,'replayQualified':0,'target':5000,'failures':failures}
        print(theme,report['categories'][theme],flush=True)
    try:
        url='https://api.figshare.com/v2/articles/3559887/versions/1'
        metadata=json.loads(cache.get(url))
        if metadata['license']['name']!='CC0': raise ValueError('EltonTraits license changed')
        records=[]; receipts=[cache.metadata(url)]
        for file in metadata['files']:
            if file['name'] not in ('MamFuncDat.txt','BirdFuncDat.txt'): continue
            content=cache.get(file['download_url'])
            if hashlib.md5(content).hexdigest()!=file['supplied_md5']: raise ValueError('EltonTraits published MD5 mismatch')
            records.extend(parse_traits(content.decode('cp1252')))
            receipts.append(cache.metadata(file['download_url']))
        sample_species=set(sorted({a['subject'] for a in records})[:limit])
        sample=[a for a in records if a['subject'] in sample_species]
        atomic_write(output/'eltontraits.json',(stable_json({'assertions':sample,'receipts':receipts})+'\n').encode())
        report['sources']['eltontraits']={'assertions':len(records),'species':len({a['subject'] for a in records}),'supported':sum(a['status']=='supported' for a in records),'imputed':sum(a['status']=='imputed' for a in records),'storedSampleAssertions':len(sample),'storedSampleSpecies':len(sample_species),'joinedToPilot':0,'note':'Scientific-name identity join and per-column metadata audit pending; not counted as pilot corroboration.'}
        print('eltontraits',report['sources']['eltontraits'],flush=True)
    except (OSError,ValueError,KeyError) as error: report['sources']['eltontraits']={'error':str(error)}
    try:
        report['sources']['wordnet']=acquire_wordnet(cache,output,limit)
    except (OSError,ValueError,KeyError) as error: report['sources']['wordnet']={'error':str(error)}
    atomic_write(ROOT/'docs/catalog-quality.json',(json.dumps(report,indent=2)+'\n').encode())
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--cache',default='/tmp/openguess-knowledge-v3'); parser.add_argument('--limit',type=int,default=100)
    args=parser.parse_args(); run(args.cache,args.limit)
