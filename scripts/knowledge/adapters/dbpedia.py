"""DBpedia ontology assertions; Wikipedia-derived origins remain correlated."""
from urllib.parse import urlencode
from pilot import digest

def query_url(ids):
    values=' '.join('<http://www.wikidata.org/entity/'+id+'>' for id in ids)
    query='SELECT DISTINCT ?identity ?s ?p ?o WHERE { VALUES ?identity { '+values+' } ?s <http://www.w3.org/2002/07/owl#sameAs> ?identity . ?s ?p ?o . FILTER(STRSTARTS(STR(?p), "http://dbpedia.org/ontology/")) FILTER(?p != <http://dbpedia.org/ontology/abstract> && ?p != <http://dbpedia.org/ontology/wikiPageWikiLink> && ?p != <http://dbpedia.org/ontology/wikiPageExternalLink>) FILTER(!isLiteral(?o) || LANG(?o)="" || LANG(?o)="en") } LIMIT 10000'
    return 'https://dbpedia.org/sparql?'+urlencode({'query':query,'format':'application/sparql-results+json'})

def parse_bindings(rows):
    facts={}
    for r in rows:
        subject=r['identity']['value'].rsplit('/',1)[-1]
        predicate=r['p']['value']; value=r['o']['value']
        key=digest((subject+'|'+predicate+'|'+value).encode())
        facts[key]={'id':'dbpedia:'+key,'subject':subject,'predicate':predicate,'object':value,'source':'dbpedia','origin':'wikimedia-unresolved','sourceEntity':r['s']['value'],'status':'supported'}
    return list(facts.values())
