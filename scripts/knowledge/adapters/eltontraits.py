"""Preserve source numbers and per-trait species-level certainty, without Boolean invention."""
import csv
import io
from pilot import digest

def parse_traits(text):
    facts=[]
    for row in csv.DictReader(io.StringIO(text),delimiter='\t'):
        scientific=row.get('Scientific')
        if not scientific: continue
        for predicate,value in row.items():
            if not predicate or value in ('','NA',None) or not predicate.startswith(('Diet.','Diet-','ForStrat.','ForStrat-','BodyMass','Activity-')): continue
            if any(term in predicate for term in ('SpecLevel','Cert','Source','Method','Comment')): continue
            separator='-' if '-' in predicate else '.'
            prefix=predicate.split(separator)[0]
            flag=row.get(prefix+separator+'SpecLevel',row.get('SpecLevel',''))
            status='supported' if flag=='1' else 'imputed'
            key=digest((scientific+'|'+predicate+'|'+value).encode())
            facts.append({'id':'eltontraits:'+key,'subject':scientific,'predicate':predicate,'object':value,'source':'eltontraits','origin':'eltontraits-1.0','status':status,'speciesLevelFlag':flag,'certaintyFlag':row.get(prefix+separator+'Certainty','')})
    return facts
