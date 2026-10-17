"""Screen evidence conservatively; only an external full-universe replay can qualify."""
import copy
from pilot import digest, stable_json

def universe_digest(subjects, questions):
    return digest(stable_json({'subjects':sorted(subjects,key=lambda s:s['id']),'questions':sorted(questions,key=lambda q:q['id'])}).encode())

def qualify(subjects, questions, replay=None):
    universe = universe_digest(subjects, questions)
    topics = {q['id']:q['topic'] for q in questions}
    output = copy.deepcopy(subjects)
    for s in output:
        reasons = []
        supported = {q:v for q,v in s['traits'].items() if q in topics and any(e['status']=='supported' for e in s['factEvidence'].get(q,[]))}
        if len(supported)<20: reasons.append('fewer-than-20-supported-propositions')
        if len({topics[q] for q in supported})<5: reasons.append('fewer-than-five-topic-families')
        if not s.get('id') or not s.get('name') or not s.get('scope'): reasons.append('incomplete-identity')
        if len(subjects)<2: reasons.append('no-rival-universe')
        for rival in subjects:
            if rival['id']==s['id']: continue
            # Unknown on either side cannot discriminate. Two evidence groups and
            # two origins are a conservative proxy, not a human familiarity audit.
            clues=[q for q,v in supported.items() if q in rival['traits'] and rival['traits'][q] is not v]
            groups={e['evidenceGroup'] for q in clues for e in s['factEvidence'][q] if e['status']=='supported'}
            origins={e['origin'] for q in clues for e in s['factEvidence'][q] if e['status']=='supported'}
            if len(clues)<2 or len(groups)<2 or len(origins)<2:
                reasons.append('insufficient-independent-distinction:'+rival['id'])
        screened = not reasons
        valid_replay = bool(replay and replay.get('universeDigest')==universe and len(set(replay.get('seeds',[])))>=5 and s['id'] in replay.get('exactSubjectIds',[]))
        s['qualification']={'screened':screened,'qualified':screened and valid_replay,'reasons':reasons + ([] if valid_replay else ['full-universe-replay-pending']),'replay':{'status':'passed' if valid_replay else 'pending','universeDigest':universe,'seeds':replay['seeds'] if valid_replay else []}}
    return output
