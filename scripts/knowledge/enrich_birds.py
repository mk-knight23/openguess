#!/usr/bin/env python3
"""Species-level bird propositions with explicit zeroes, uncertainty and correlation groups."""
import csv
import io
import json
from pathlib import Path
from urllib.parse import urlencode
from pilot import Cache,atomic_write,stable_json,digest
from compile import compile_subjects
from qualify import qualify
ROOT=Path(__file__).resolve().parents[2]
DIET={'Inv':('invertebrates','invertebrates such as insects or worms'),'Vend':('warm_blooded_prey','warm-blooded vertebrate prey'),'Vect':('cold_blooded_prey','cold-blooded vertebrate prey other than fish'),'Vfish':('fish','fish'),'Scav':('carrion','carrion'),'Fruit':('fruit','fruit'),'Nect':('nectar','nectar'),'Seed':('seeds','seeds'),'PlantO':('other_plants','plant material other than fruit, nectar or seeds')}
FORAGE={'watbelowsurf':'below the water surface','wataroundsurf':'at or around the water surface','ground':'on the ground','understory':'in low vegetation beneath the canopy','midhigh':'in mid-level tree vegetation','canopy':'in the tree canopy','aerial':'in the air'}

def select_birds(rows,limit):
    families={}
    for row in rows:families.setdefault(row.get('BLFamilyLatin','unknown'),[]).append(row)
    for family in families:families[family].sort(key=lambda row:(-sum(value not in ('','NA') for value in row.values()),row['Scientific']))
    selected=[]
    while len(selected)<limit and any(families.values()):
        for family in sorted(families):
            if families[family] and len(selected)<limit:selected.append(families[family].pop(0))
    return selected

def project_bird(id,row,references=None,family_templates=None):
    scientific=row['Scientific'];facts=[];questions=[]
    references=references or {}
    def add(qid,text,topic,value,group,reference,scope):
        source='eltontraits'
        if reference=='Dunning08': source='eltontraits-dunning08'
        elif reference.startswith('BirdLife taxonomy '): source='eltontraits-birdlife'
        elif reference=='Handbook of the Birds of the World' or references.get(reference,'').startswith('Handbook of the Birds of the World'): source='eltontraits-hbw'
        questions.append({'id':qid,'text':text,'topic':topic,'proposition':qid,'scope':scope})
        facts.append({'id':'bird:'+digest((id+'|'+qid).encode()),'subject':id,'question':qid,'value':value,'source':source,'scope':scope,'evidenceGroup':scientific+':'+group,'upstreamReference':reference})
    def number(field):
        try:return float(row[field])
        except (KeyError,ValueError):return None
    if row.get('Diet-Certainty')=='A':
        for field,(key,label) in DIET.items():
            value=number('Diet-'+field)
            if value is not None and 0<=value<=100:add('bird_diet_'+key,'Does its recorded diet include '+label+'?','diet',value>0,'diet',row.get('Diet-Source',''),'EltonTraits species diet composition; certainty A')
    if row.get('ForStrat-SpecLevel')=='1':
        for field,label in FORAGE.items():
            value=number('ForStrat-'+field)
            if value is not None and 0<=value<=100:add('bird_forage_'+field,'Does it forage at least partly '+label+'?','foraging',value>0,'foraging',row.get('ForStrat-Source',''),'EltonTraits species-level foraging stratum percentage')
    if row.get('Nocturnal') in ('0','1'):
        add('bird_nocturnal','Does it mainly forage at night?','activity',row['Nocturnal']=='1','activity','Handbook of the Birds of the World','EltonTraits main foraging activity at night')
    mass=number('BodyMass-Value')
    if row.get('BodyMass-SpecLevel')=='1' and row.get('BodyMass-Source')=='Dunning08' and mass is not None and mass>0:
        for grams in [10,50,100,500,1000,5000,10000]:add('bird_mass_gt_'+str(grams)+'g','Is its species average adult body mass greater than '+str(grams)+' grams?','body-size',mass>grams,'body-mass','Dunning08','EltonTraits species-level average adult mass; not every individual')
    if row.get('BLFamilyLatin') and row.get('BLFamilyEnglish'):
        key=digest((row.get('Taxo','unspecified')+'|'+row['BLFamilyLatin']).encode())[:16]
        add('bird_family_'+key,'Does it belong to the bird family called '+row['BLFamilyEnglish']+'?','taxonomy',True,'taxonomy','BirdLife taxonomy '+row.get('Taxo','unspecified'),'EltonTraits supplied BirdLife family classification '+row.get('Taxo','unspecified'))
        for family in family_templates or []:
            if not row.get('Taxo') or family['version']!=row['Taxo'] or family['latin']==row['BLFamilyLatin']:continue
            otherkey=digest((family['version']+'|'+family['latin']).encode())[:16]
            add('bird_family_'+otherkey,'Does it belong to the bird family called '+family['english']+'?','taxonomy',False,'taxonomy','BirdLife taxonomy '+row['Taxo'],'EltonTraits supplied BirdLife family classification '+row['Taxo'])
    return facts,questions

def run(limit=100):
    cache=Cache('/tmp/openguess-knowledge-v3');url='https://ndownloader.figshare.com/files/5631081'
    rows=list(csv.DictReader(io.StringIO(cache.get(url).decode('cp1252')),delimiter='\t'))
    eligible=[r for r in rows if r.get('Diet-Certainty')=='A' and r.get('ForStrat-SpecLevel')=='1' and r.get('BodyMass-SpecLevel')=='1' and r.get('BodyMass-Source')=='Dunning08']
    selected=select_birds(eligible,limit);identities=[];receipts=[cache.metadata(url)];failures=[]
    reference_url='https://ndownloader.figshare.com/files/5631087'
    references={r['Ref_ID']:r['Full Reference'] for r in csv.DictReader(io.StringIO(cache.get(reference_url).decode('cp1252')),delimiter='\t')}
    receipts.append(cache.metadata(reference_url))
    for start in range(0,len(selected),50):
        values=' '.join(json.dumps(r['Scientific']) for r in selected[start:start+50])
        query='SELECT ?item ?scientific ?label WHERE { VALUES ?scientific { '+values+' } ?item wdt:P225 ?scientific; wdt:P105 wd:Q7432; rdfs:label ?label . FILTER(LANG(?label)="en") }'
        endpoint='https://query.wikidata.org/sparql?'+urlencode({'query':query,'format':'json'})
        try:
            bindings=json.loads(cache.get(endpoint))['results']['bindings'];receipts.append(cache.metadata(endpoint))
            identities.extend({'id':r['item']['value'].rsplit('/',1)[-1],'scientific':r['scientific']['value'],'name':r['label']['value']} for r in bindings)
        except (OSError,ValueError,KeyError) as error:failures.append(str(error))
    by_name={}
    for identity in identities:by_name.setdefault(identity['scientific'],[]).append(identity)
    subjects=[];assertions=[];questions={};source_rows=[]
    family_templates=list({(r['BLFamilyLatin'],r.get('Taxo','')):{'latin':r['BLFamilyLatin'],'english':r['BLFamilyEnglish'],'version':r.get('Taxo','')} for r in selected if r.get('BLFamilyLatin') and r.get('BLFamilyEnglish')}.values())
    for row in selected:
        matches=by_name.get(row['Scientific'],[])
        if len(matches)!=1:continue
        identity=matches[0]
        if any(s['id']==identity['id'] for s in subjects):continue
        subjects.append({'id':identity['id'],'name':identity['name'],'scope':'default'})
        facts,templates=project_bird(identity['id'],row,references,family_templates);assertions.extend(facts);questions.update({q['id']:q for q in templates});source_rows.append(row)
    compiled=compile_subjects(subjects,assertions,list(questions.values()),json.loads((ROOT/'scripts/knowledge/sources.json').read_text()))
    compiled['subjects']=qualify(compiled['subjects'],compiled['questions']) if subjects else []
    topics={q['id']:q['topic'] for q in compiled['questions']}
    coverage=sum(len(s['traits'])>=20 and len({topics[q] for q in s['traits']})>=5 for s in compiled['subjects'])
    pair_count=0;weak_pairs=0;collision_subjects=set();examples=[]
    for position,left in enumerate(compiled['subjects']):
        for right in compiled['subjects'][position+1:]:
            opposed=[q for q,v in left['traits'].items() if q in right['traits'] and right['traits'][q] is not v]
            groups={e['evidenceGroup'] for q in opposed for e in left['factEvidence'][q]}
            if len(groups)<2: weak_pairs+=1
            if not opposed:
                pair_count+=1;collision_subjects.update([left['id'],right['id']])
                if len(examples)<12: examples.append([left['name'],right['name']])
    report={'zeroExplicitDistinctionPairs':pair_count,'subjectsInZeroDistinctionPairs':len(collision_subjects),'pairsWithFewerThanTwoEvidenceGroups':weak_pairs,'collisionExamples':examples,'minimumNonTaxonomicPropositions':min((sum(topics[q]!='taxonomy' for q in s['traits']) for s in compiled['subjects']),default=0),'sourceBirdSpecies':len(rows),'eligibleSourceRows':len(eligible),'sampled':len(selected),'unambiguousSpeciesJoins':len(subjects),'supportedProjections':len(assertions),'twentyPropositionsFiveTopics':coverage,'screened':sum(s['qualification']['screened'] for s in compiled['subjects']),'qualified':0,'originalPrimaryBooksIndependentlyRead':False,'failures':failures,'limitations':['Sample stratified across supplied families and source completeness, not a familiarity survey.','Diet/foraging percentage zero is explicit source evidence, not absent-claim completion.','Related thresholds and diet components retain shared evidence groups.','Upstream reference families grouped from publisher metadata/source index; original books not independently checked.','Body-mass thresholds are species adult means and may be difficult for humans to answer.','Opposing family negatives derive only from explicit functional family assignments within the same taxonomy version; missing claims stay unknown.','No full-universe replay receipt.']}
    atomic_write(ROOT/'scripts/knowledge/data/bird-enrichment.json',(stable_json({'compiled':compiled,'assertions':assertions,'upstreamReferenceIndex':references,'sourceRows':source_rows,'receipts':receipts,'report':report})+'\n').encode())
    quality=json.loads((ROOT/'docs/catalog-quality.json').read_text());quality['birdEnrichment']=report
    atomic_write(ROOT/'docs/catalog-quality.json',(json.dumps(quality,indent=2)+'\n').encode());print(report,flush=True)
if __name__=='__main__':run()
