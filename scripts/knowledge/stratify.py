#!/usr/bin/env python3
"""Representative coverage strata; source density is not a human familiarity rating."""
import json
from pathlib import Path
from pilot import atomic_write, stable_json
ROOT=Path(__file__).resolve().parents[2]

def select(characters,limit=100):
    head=sorted([c for c in characters if c.get('featured')],key=lambda c:c['id'])[:limit]
    others=sorted([c for c in characters if not c.get('featured')],key=lambda c:(-sum(len(v) for v in c.get('facts',{}).values()),c['id']))
    remaining=limit-len(head);mid_count=remaining//2;tail_count=remaining-mid_count
    tail=others[-tail_count:] if tail_count else []
    pool=others[:-tail_count] if tail_count else others
    start=max(0,(len(pool)-mid_count)//2);middle=pool[start:start+mid_count]
    return [{'id':c['id'],'name':c['name'],'stratum':label,'legacySupportedClaimCount':sum(len(v) for v in c.get('facts',{}).values()),'featured':bool(c.get('featured'))} for label,rows in [('featured-head',head),('middle-source-density',middle),('sparse-tail',tail)] for c in rows]

def run():
    result={'limitations':['Featured head is an existing editorial selection. Middle/tail reflect structured source density, not independently measured familiarity.','This selection is an audit/acquisition cohort, not a qualified-playable projection.'],'categories':{}}
    for theme in ['people','fictional','animals','objects','movies']:
        pack=json.loads((ROOT/'src/data/packs'/(theme+'.json')).read_text())
        result['categories'][theme]=select(pack['characters'])
    atomic_write(ROOT/'scripts/knowledge/data/stratified-pilot.json',(stable_json(result)+'\n').encode())
if __name__=='__main__':run()
