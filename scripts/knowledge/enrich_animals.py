#!/usr/bin/env python3
"""Audited numeric animal enrichment; exact scientific identities, no name guessing."""
import json
from pathlib import Path
from urllib.parse import urlencode
from pilot import Cache, atomic_write, stable_json
from adapters.eltontraits import parse_traits
from compile import compile_subjects
from qualify import qualify

ROOT=Path(__file__).resolve().parents[2]
SCOPE='EltonTraits species-level average adult body mass, grams; not every individual'

def join_species(rows, names):
    options={}
    for row in rows:
        if row['rank']=='Q7432' and row['scientific'] in names:
            options.setdefault(row['subject'],set()).add(row['scientific'])
    return {id:next(iter(values)) for id,values in options.items() if len(values)==1}

def compile_trait_assertions(joins, facts):
    assertions=[]; questions=[]
    for kg in [1,10,100,1000]:
        questions.append({'id':'elton_adult_average_mass_gt_'+str(kg)+'kg','text':'Is its species average adult body mass greater than '+str(kg)+' kilograms?','topic':'body-size','proposition':'species-adult-average-mass-gt-'+str(kg)+'kg','scope':SCOPE})
    by_name={}
    for fact in facts: by_name.setdefault(fact['subject'],[]).append(fact)
    for id,name in sorted(joins.items()):
        for fact in by_name.get(name,[]):
            if fact['predicate'] not in ('BodyMass-Value','BodyMass.Value') or fact['speciesLevelFlag']!='1': continue
            if any(term.lower() in fact.get('sourceMethod','').lower() for term in ['PrimScale','GenAvg','Phylo','Imput']): continue
            try: mass=float(fact['object'])
            except ValueError: continue
            if not 0<mass<1e10: continue
            for question,kg in zip(questions,[1,10,100,1000]):
                assertions.append({'id':fact['id']+':'+str(kg),'subject':id,'question':question['id'],'value':mass>kg*1000,'source':'eltontraits','scope':SCOPE,'evidenceGroup':fact['id']})
    return assertions,questions

def run():
    cache=Cache('/tmp/openguess-knowledge-v3')
    facts=[]; receipts=[]
    metadata_url='https://ndownloader.figshare.com/files/5631093'
    cache.get(metadata_url);receipts.append(cache.metadata(metadata_url))
    for file in ['5631084','5631081']:
        url='https://ndownloader.figshare.com/files/'+file
        body=cache.get(url);facts.extend(parse_traits(body.decode('cp1252')));receipts.append(cache.metadata(url))
    pack=json.loads((ROOT/'src/data/packs/animals.json').read_text())
    characters=pack['characters'];ids=[c['id'] for c in characters if c['id'].startswith('Q')]
    rows=[];failures=[]
    for start in range(0,len(ids),100):
        values=' '.join('wd:'+id for id in ids[start:start+100])
        query='SELECT ?item ?scientific ?rank WHERE { VALUES ?item { '+values+' } ?item wdt:P225 ?scientific; wdt:P105 ?rank. }'
        url='https://query.wikidata.org/sparql?'+urlencode({'query':query,'format':'json'})
        try:
            bindings=json.loads(cache.get(url))['results']['bindings'];receipts.append(cache.metadata(url))
            rows.extend({'subject':r['item']['value'].rsplit('/',1)[-1],'scientific':r['scientific']['value'],'rank':r['rank']['value'].rsplit('/',1)[-1]} for r in bindings)
        except (OSError,ValueError,KeyError) as error:failures.append(str(error))
        print('animal identities',min(start+100,len(ids)),'/',len(ids),'rows',len(rows),flush=True)
    joins=join_species(rows,{f['subject'] for f in facts})
    assertions,questions=compile_trait_assertions(joins,facts)
    subjects=[{'id':id,'name':next(c['name'] for c in characters if c['id']==id),'scope':'default'} for id in sorted(joins)]
    registry=json.loads((ROOT/'scripts/knowledge/sources.json').read_text())
    compiled=compile_subjects(subjects,assertions,questions,registry)
    compiled['subjects']=qualify(compiled['subjects'],questions) if subjects else []
    report={'queriedIds':len(ids),'taxonRows':len(rows),'exactSpeciesJoins':len(joins),'subjectsWithSupportedNumericFacts':len({a['subject'] for a in assertions}),'supportedBooleanProjections':len(assertions),'evidenceGroups':len({a['evidenceGroup'] for a in assertions}),'screened':sum(s['qualification']['screened'] for s in compiled['subjects']),'qualified':sum(s['qualification']['qualified'] for s in compiled['subjects']),'failures':failures,'limitations':['Only species-rank Q7432 with one exact scientific-name match is joined.','Adult average mass questions share one evidence group; four thresholds are not four independent facts.','Mass-only enrichment has one topic and cannot meet twenty-proposition/five-topic qualification.','Mammal diet/activity ABC may include congeneric estimates; not compiled as verified.','No original curated animal identity is merged from a display label.']}
    output=ROOT/'scripts/knowledge/data'
    atomic_write(output/'animal-enrichment.json',(stable_json({'compiled':compiled,'assertions':assertions,'identityRows':rows,'sourceAssertions':[f for f in facts if f['subject'] in set(joins.values()) and f['predicate'].startswith('BodyMass')],'receipts':receipts,'report':report})+'\n').encode())
    quality=json.loads((ROOT/'docs/catalog-quality.json').read_text());quality['animalEnrichment']=report
    atomic_write(ROOT/'docs/catalog-quality.json',(json.dumps(quality,indent=2)+'\n').encode())
    print(report,flush=True)

if __name__=='__main__':run()
