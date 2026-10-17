#!/usr/bin/env python3
"""Compile legacy positive pilot claims and measure screening, without auto-promoting imports."""
import json
from pathlib import Path
from compile import compile_subjects
from qualify import qualify
from pilot import atomic_write, stable_json

ROOT=Path(__file__).resolve().parents[2]
TOPICS={'P106':'occupation','P27':'citizenship','P21':'identity','P569':'birth','P19':'birth','P31':'classification','P1080':'universe','P1441':'works','P170':'creator','P413':'role','P171':'taxonomy','P105':'taxonomy','P183':'range','P814':'habitat','P575':'discovery','P405':'taxonomy','P279':'classification','P186':'material','P366':'purpose','P176':'maker','P138':'namesake','P136':'genre','P495':'origin','P577':'release','P57':'director','P364':'language','P179':'series'}

def build():
    directory=ROOT/'scripts/knowledge/data'
    registry=json.loads((ROOT/'scripts/knowledge/sources.json').read_text())
    quality=json.loads((ROOT/'docs/catalog-quality.json').read_text())
    for theme in quality['categories']:
        raw=json.loads((directory/(theme+'-pilot.json')).read_text())
        pack=json.loads((ROOT/'src/data/packs'/(theme+'.json')).read_text())
        questions=[{'id':q['id'],'text':q['text'],'proposition':q['id'],'topic':TOPICS[q['property']]} for q in pack['questions'] if q.get('property') in TOPICS]
        index={q['id'] for q in questions}
        assertions=[]
        for a in raw['assertions']:
            if a['source']!='wikidata': continue
            question=a['predicate']+'_'+str(a['object'])
            if question not in index: continue
            assertions.append({'id':a['id'],'subject':a['subject'],'question':question,'value':True,'source':'wikidata','scope':'default','evidenceGroup':a['id']})
        compiled=compile_subjects(raw['subjects'],assertions,questions,registry)
        compiled['subjects']=qualify(compiled['subjects'],compiled['questions'])
        atomic_write(directory/(theme+'-compiled.json'),(stable_json(compiled)+'\n').encode())
        counts=quality['categories'][theme]
        counts['compiledSubjects']=len(compiled['subjects'])
        counts['compiledPropositions']=sum(len(s['traits']) for s in compiled['subjects'])
        counts['screened']=sum(s['qualification']['screened'] for s in compiled['subjects'])
        counts['replayQualified']=sum(s['qualification']['qualified'] for s in compiled['subjects'])
        counts['screeningStatus']='executed; DBpedia and independent source template review pending'
        counts['screeningRejections']={reason:sum(reason in s['qualification']['reasons'] for s in compiled['subjects']) for reason in ['fewer-than-20-supported-propositions','fewer-than-five-topic-families','full-universe-replay-pending']}
    atomic_write(ROOT/'docs/catalog-quality.json',(json.dumps(quality,indent=2)+'\n').encode())

if __name__=='__main__': build()
