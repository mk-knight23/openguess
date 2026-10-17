"""Project explicit assertions without closed-world completion or evidence inflation."""
from pilot import validate_assertion
from normalize import normalize

def validate_questions(questions):
    index = {q['id']:q for q in questions}
    if len(index) != len(questions): raise ValueError('duplicate question id')
    propositions = {}
    for q in questions:
        if not q.get('topic') or not q.get('proposition'): raise ValueError('question semantics required')
        key = (q['proposition'],q.get('scope','default'))
        if key in propositions: raise ValueError('equivalent proposition needs one canonical question')
        propositions[key] = q['id']
    visiting, visited = set(), set()
    def visit(id):
        if id not in index: raise ValueError('unresolved question: '+id)
        if id in visiting: raise ValueError('implication/prerequisite cycle')
        if id in visited: return
        visiting.add(id)
        for child in index[id].get('implies',[]) + index[id].get('prerequisites',[]): visit(child)
        visiting.remove(id); visited.add(id)
    for id in index: visit(id)
    return index

def compile_subjects(rows, assertions, questions, registry):
    index = validate_questions(questions)
    subjects, aliases = normalize(rows)
    by_id = {s['id']:s for s in subjects}
    for s in subjects: s.update(traits={},factEvidence={})
    seen = set()
    for a in sorted(assertions,key=lambda a:a['id']):
        origin = validate_assertion(a, registry)
        if a['id'] in seen: raise ValueError('duplicate assertion id')
        seen.add(a['id'])
        if a['subject'] not in aliases: raise ValueError('unresolved subject')
        if a['question'] not in index: raise ValueError('unresolved question')
        s = by_id[aliases[a['subject']]]
        status = a.get('status','supported')
        if a.get('scope','default') != index[a['question']].get('scope',s['scope']): status = 'out-of-scope'
        if a.get('value') is not True and a.get('value') is not False: status = 'unknown'
        s['factEvidence'].setdefault(a['question'],[]).append({'assertionId':a['id'],'source':a['source'],'origin':origin,'evidenceGroup':a.get('evidenceGroup',a['id']),'status':status,'scope':a.get('scope','default'),'value':a.get('value')})
    for s in subjects:
        for q, evidence in s['factEvidence'].items():
            values = {e['value'] for e in evidence if e['status']=='supported'}
            if len(values) == 1: s['traits'][q] = values.pop()
            elif len(values) > 1:
                for e in evidence:
                    if e['status']=='supported': e['status']='conflict'
    return {'schemaVersion':1,'subjects':subjects,'aliases':aliases,'questions':sorted(questions,key=lambda q:q['id'])}
