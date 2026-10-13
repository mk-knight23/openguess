#!/usr/bin/env python3
"""Reproducible, serial CC0 Wikidata import. Cached queries avoid repeated endpoint work."""
import json, pathlib, subprocess, urllib.parse, hashlib, time, collections, re, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=pathlib.Path('/tmp/openguess-wikidata-v2'); CACHE.mkdir(exist_ok=True)
SPECS={
 'people': ('real','?item wdt:P31 wd:Q5; wdt:P106 ?seed.', ['P106','P27','P21','P569','P19']),
 'fictional': ('fictional','VALUES ?class { wd:Q95074 wd:Q15632617 wd:Q15711870 } ?item wdt:P31 ?class.', ['P31','P1080','P1441','P170','P21','P413']),
 'animals': ('animal','?item wdt:P31 wd:Q16521; wdt:P171 ?parent. ?parent wdt:P171* wd:Q729.', ['P171','P105','P183','P814','P575','P405']),
 'objects': ('object','?item wdt:P279 ?parent. ?parent wdt:P279* wd:Q223557.', ['P279','P31','P186','P366','P176','P138']),
 'movies': ('movie','?item wdt:P31 wd:Q11424; wdt:P57 ?director.', ['P136','P495','P577','P57','P364','P179']),
}
def query(q):
 key=hashlib.sha256(q.encode()).hexdigest(); p=CACHE/(key+'.json')
 if p.exists(): return json.loads(p.read_text())['results']['bindings']
 url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':q,'format':'json'})
 for attempt in range(5):
  r=subprocess.run(['curl','-fsSL','--max-time','100','-A','OpenGuess/0.2 (https://github.com/mk-knight23/openguess)',url],capture_output=True,text=True)
  try:
   data=json.loads(r.stdout); rows=data['results']['bindings']; p.write_text(r.stdout); time.sleep(1); return rows
  except (json.JSONDecodeError,KeyError):
   print('Retry',attempt,r.stderr[:200],flush=True);time.sleep(min(60, 10 * (attempt + 1)))
 raise RuntimeError('Wikidata query failed: '+q)
def ident(v): return v.rsplit('/',1)[-1]
retrieved=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
for theme,(category,selection,properties) in SPECS.items():
 selected=[arg for arg in sys.argv[1:] if arg != '--force']
 if selected and theme not in selected: continue
 output=ROOT/'src/data/packs'/f'{theme}.json'
 if output.exists() and '--force' not in sys.argv: continue
 # Select English-labeled entities; label service is avoided for predictable endpoint load.
 seedquery='SELECT DISTINCT ?item WHERE { '+selection+' ?item rdfs:label ?label. FILTER(LANG(?label)="en") } LIMIT 1200'
 if theme == 'objects': seedquery='SELECT DISTINCT ?item WHERE { VALUES ?class { wd:Q42889 wd:Q39546 wd:Q34379 } ?item wdt:P279+ ?class. ?item rdfs:label ?label. FILTER(LANG(?label)="en") } LIMIT 1200'
 if theme == 'animals': seedquery='SELECT DISTINCT ?item WHERE { ?item wdt:P171+ wd:Q7377. ?item rdfs:label ?label. FILTER(LANG(?label)="en") } LIMIT 1100'
 seeds=query(seedquery); ids=list(dict.fromkeys(ident(r['item']['value']) for r in seeds))[:1200 if theme == 'fictional' else 1100]; print(theme,len(ids),'seeds',flush=True)
 records={}; labels={}
 for start in range(0,len(ids),100):
  values=' '.join('wd:'+i for i in ids[start:start+100]); props=' '.join('wdt:'+i for i in properties)
  q='SELECT ?item ?name ?description ?property ?value ?valueLabel WHERE { VALUES ?item { '+values+' } ?item rdfs:label ?name. FILTER(LANG(?name)="en") OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description)="en") } VALUES ?property { '+props+' } ?item ?property ?value. OPTIONAL { ?value rdfs:label ?valueLabel. FILTER(LANG(?valueLabel)="en") } }'
  for r in query(q):
   item=ident(r['item']['value']); rec=records.setdefault(item,{'name':r['name']['value'],'description':r.get('description',{}).get('value','Wikidata entity'),'facts':{}})
   prop=ident(r['property']['value']); val=r['value']['value']
   if r['value']['type']=='uri': val=ident(val)
   elif prop in ('P569','P577','P575'): val=val.split('T')[0].rsplit('-',2)[0]
   rec['facts'].setdefault(prop,set()).add(val); labels[(prop,val)]=r.get('valueLabel',{}).get('value',val)
   if prop in ('P569','P577','P575') and val.startswith('-'): labels[(prop,val)]=str(abs(int(val)))+' BCE'
  print(theme,start+100,'facts',len(records),flush=True)
 counts=collections.Counter((p,v) for r in records.values() for p,vs in r['facts'].items() for v in vs)
 # Even rare factual distinctions are retained, but no direct entity-name questions.
 chosen=sorted([pair for pair,n in counts.items() if 1<=n<len(records) and not re.fullmatch(r'Q\d+',labels[pair])])
 templates={'P106':'Is your person associated with the occupation {v}?','P27':'Is your person a citizen of {v}?','P21':'Is your character described as {v}?','P569':'Was your person born in {v}?','P19':'Was your person born in {v}?','P31':'Is your choice classified as {v}?','P1080':'Is your character from the fictional universe {v}?','P1441':'Does your character appear in {v}?','P170':'Was your character created by {v}?','P413':'Does your character play the position {v}?','P171':'Does your animal belong to the taxonomic group {v}?','P105':'Is your animal classified at the rank {v}?','P183':'Is your animal endemic to {v}?','P814':'Does your animal inhabit {v}?','P575':'Is its recorded discovery year {v}?','P405':'Was your animal taxon authored by {v}?','P279':'Is your object a kind of {v}?','P186':'Is your object made with {v}?','P366':'Is your object used for {v}?','P176':'Is your object made by {v}?','P138':'Is your object named after {v}?','P136':'Does your film belong to the genre {v}?','P495':'Is your film from {v}?','P577':'Was your film released in {v}?','P57':'Was your film directed by {v}?','P364':'Is your film originally in {v}?','P179':'Is your film part of {v}?'}
 questions=[{'id':p+'_'+v,'text':templates[p].format(v=labels[(p,v)]),'hint':'Based on the structured Wikidata claim. Missing claims are treated as unknown.','property':p,'value':v} for p,v in chosen]
 questions += [{'id':'name_letter_'+letter,'text':f'Does its English name contain the letter {letter.upper()}?','hint':'Use the familiar English display name. This is a spelling fallback, not a biological or story fact.','property':'name','value':letter} for letter in 'abcdefghijklmnopqrstuvwxyz']
 chars=[]
 for item,r in records.items():
  traits={p+'_'+v:True for p,vs in r['facts'].items() for v in sorted(vs) if (p,v) in chosen}
  if not traits: continue
  traits.update({'name_letter_'+letter:letter in r['name'].lower() for letter in 'abcdefghijklmnopqrstuvwxyz'})
  chars.append({'id':item,'name':r['name'],'description':r['description'],'category':category,'tags':list(dict.fromkeys(labels[(p,v)] for p,vs in r['facts'].items() for v in sorted(vs)))[:8],'color':'#3276a5','initials':''.join(w[0] for w in r['name'].split()[:2]),'traits':traits,'facts':{p:sorted(vs) for p,vs in r['facts'].items()},'source':{'url':'https://www.wikidata.org/wiki/'+item,'license':'CC0-1.0','retrievedAt':retrieved}})
 signatures=len(set(json.dumps(c['traits'],sort_keys=True) for c in chars))
 pack={'theme':theme,'version':'0.2.0','characters':chars,'questions':questions,'source':{'name':'Wikidata structured statements','license':'CC0-1.0','retrievedAt':retrieved,'query':seedquery,'url':'https://www.wikidata.org/wiki/Wikidata:Licensing'},'quality':{'total':len(chars),'uniqueTraitSignatures':signatures,'collisionCount':len(chars)-signatures,'semanticUniqueTraitSignatures':len(set(json.dumps({k:v for k,v in c['traits'].items() if not k.startswith('name_letter_')},sort_keys=True) for c in chars)),'questionCount':len(questions),'averagePositiveTraits':round(sum(sum(v is True for v in c['traits'].values()) for c in chars)/len(chars),2)}}
 output.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n'); print(theme,pack['quality'],flush=True)
