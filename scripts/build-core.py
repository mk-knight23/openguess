#!/usr/bin/env python3
"""Build an honest authored semantic core alongside an experimental CC0 catalog."""
import json,pathlib,subprocess,re,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
core=json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',"import {characters,questions} from './src/data/catalog.ts'; console.log(JSON.stringify({characters,questions}));"],cwd=ROOT,text=True))
family={'real':'identity','male':'gender','india':'location','japan':'location','usa':'location','uk':'location','deceased':'time','sport':'occupation','cricket':'occupation','football':'occupation','basketball':'occupation','tennis':'occupation','actor':'occupation','music':'occupation','science':'occupation','leader':'occupation','business':'occupation','writer':'occupation','anime':'media','game':'media','film':'media','book':'media','comic':'media','hero':'role','villain':'role','detective':'role','royal':'role','pirate':'role','wizard':'role','student':'role','child':'appearance','adult':'appearance','animal':'species','robot':'species','alien':'species','mask':'appearance','armor':'appearance','cape':'appearance','glasses':'appearance','sword':'equipment','magic':'abilities','flight':'abilities','speed':'abilities','strength':'abilities','space':'setting'}
family.update({'us':'location','portugal':'location','tv':'media','animated':'media','school':'setting','electric':'abilities','ice':'abilities','sprinting':'occupation','wicketkeeper':'occupation','host':'occupation','wealth':'occupation','inventor':'occupation','fly':'abilities','bow':'equipment'})
WHEN=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
for theme in ['people','fictional','animals','objects','movies']:
 p=ROOT/'src/data/packs'/f'{theme}.json'
 # Idempotently rebuild annotations over the retained structured source records.
 pack=json.loads(p.read_text())
 pack['characters']=[c for c in pack['characters'] if re.fullmatch(r'Q\d+',c['id'])]
 pack['questions']=[q for q in pack['questions'] if q['id'].startswith('P')]
 raw_ids={q['id'] for q in pack['questions']}
 for c in pack['characters']:
  c['traits']={k:v for k,v in c['traits'].items() if k in raw_ids}
  for key in ['featured','annotationLicense','annotationSources']:c.pop(key,None)
 pack['questions']=[dict(q,kind='semantic',family=q.get('property','semantic')) for q in pack['questions'] if not q['id'].startswith('name_')]
 for c in pack['characters']:c['traits']={k:v for k,v in c['traits'].items() if not k.startswith('name_')}
 existing={c['name'].casefold():c for c in pack['characters']}
 if theme in ['people','fictional']:
  pack['questions'] += [dict(q,kind='semantic',family=family.get(q['id'],'appearance')) for q in core['questions']]
  for authored in core['characters']:
   if (authored['category']=='real') != (theme=='people'):continue
   char=existing.get(authored['name'].casefold())
   if char is None:
    char=dict(authored,id='authored:'+authored['id'],source={'url':'https://github.com/mk-knight23/openguess/blob/main/src/data/catalog.ts','license':'MIT','retrievedAt':WHEN},facts={'authored:profile':authored['tags']});pack['characters'].append(char)
   char['traits'].update(authored['traits']);char['featured']=True;char['annotationLicense']='MIT';char['annotationSources']=['https://github.com/mk-knight23/openguess/blob/main/src/data/catalog.ts']
 else:
  section=json.loads((ROOT/'scripts/curated-core.json').read_text())[theme]
  pack['questions'] += section['questions']
  category={'animals':'animal','objects':'object','movies':'movie'}[theme]
  for entry in section['characters']:
   name=entry['name'];tags=set(entry['tags']);unknown=set(entry.get('unknown',[]))
   url='https://en.wikipedia.org/wiki/'+entry['article']
   traits={q['id']:None if q['id'].removeprefix('core_') in unknown else q['id'].removeprefix('core_') in tags for q in section['questions']}
   ident='authored:'+theme+':'+re.sub(r'[^a-z0-9]+','-',name.casefold()).strip('-')
   canonical=next((c for c in pack['characters'] if c['id']==entry.get('wikidataId')),None)
   if canonical is not None:
    assert canonical['name'].casefold()==name.casefold(), 'Canonical identity does not match the curated profile'
    canonical['traits'].update(traits);canonical['featured']=True;canonical['annotationLicense']='MIT';canonical['annotationSources']=[url]
   else:
    pack['characters'].append({'id':ident,'name':name,'description':{'animals':'Familiar adult animal','objects':'Familiar everyday object','movies':'Named film and its main story'}[theme], 'category':category,'tags':sorted(tags),'color':'#3276a5','initials':''.join(w[0] for w in name.split()[:2]),'traits':traits,'facts':{'authored:profile':sorted(tags)},'source':{'url':url,'license':'MIT authored annotations','retrievedAt':WHEN},'featured':True,'annotationLicense':'MIT','annotationSources':[url]})
 pack['source']['annotationLicense']='MIT';pack['source']['license']='CC0-1.0; MIT authored annotations';pack['source']['coreNotice']='Independently authored closed-catalog annotations. Raw Wikidata records are experimental; sources are reference links, not a claim that every answer was independently audited.'
 signatures=len(set(json.dumps(c['traits'],sort_keys=True) for c in pack['characters']))
 pack['quality']={'total':len(pack['characters']),'uniqueTraitSignatures':signatures,'semanticUniqueTraitSignatures':signatures,'collisionCount':len(pack['characters'])-signatures,'questionCount':len(pack['questions']),'featuredCount':sum(c.get('featured',False) for c in pack['characters']),'spellingQuestions':0,'knownNegativeTraits':sum(sum(v is False for v in c['traits'].values()) for c in pack['characters'])}
 p.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n');print(theme,pack['quality'],flush=True)

manifest=ROOT/'src/data/manifest.ts'
text=manifest.read_text()
for theme in ['people','fictional','animals','objects','movies']:
 count=len(json.loads((ROOT/'src/data/packs'/f'{theme}.json').read_text())['characters'])
 text=re.sub(r'(id: "'+theme+r'"[\s\S]*?count: )\d+',lambda match:match.group(1)+str(count),text,count=1)
manifest.write_text(text)
