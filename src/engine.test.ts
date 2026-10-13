import { describe, expect, it } from 'vitest';
import { rankCandidates, selectQuestion, shouldGuess } from './engine';
import type { Character, Question, AnswerRecord } from './types';
const make = (id: string, traits: Character['traits']): Character => ({ id, name: id, description: '', category: 'fictional', tags: [], color: '#fff', initials: id, traits });
const questions: Question[] = ['a', 'b', 'c'].map(id => ({ id, text: id, hint: '' }));
const catalog = [make('one', { a: true, b: true, c: false }), make('two', { a: false, b: true, c: true }), make('three', { a: false, b: false, c: false })];
describe('candidate inference', () => {
  it('uses uniform priors and normalized positive soft evidence', () => {
    expect(rankCandidates(catalog, []).map(c => c.probability)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    const ranked = rankCandidates(catalog, [{ questionId: 'a', answer: 'yes' }]);
    expect(ranked[0].character.id).toBe('one');
    expect(ranked.reduce((sum, c) => sum + c.probability, 0)).toBeCloseTo(1);
    expect(ranked.every(c => c.probability > 0 && c.probability < 1)).toBe(true);
  });
  it('unknown provides no evidence and missing traits preserve uncertainty', () => {
    expect(rankCandidates(catalog, [{ questionId: 'a', answer: 'unknown' }])).toEqual(rankCandidates(catalog, []));
    const incomplete = [make('a', { a: null }), make('b', {})];
    expect(rankCandidates(incomplete, [{ questionId: 'a', answer: 'yes' }]).map(c => c.probability)).toEqual([0.5, 0.5]);
  });
  it('probably is weaker evidence than yes', () => {
    const probability = (answer: 'yes' | 'probably') => rankCandidates(catalog, [{ questionId: 'a', answer }])[0].probability;
    expect(probability('probably')).toBeLessThan(probability('yes'));
  });
  it('replays undo, rejects explicitly, and handles all rejected', () => {
    const history: AnswerRecord[] = [{ questionId: 'a', answer: 'yes' }, { questionId: 'b', answer: 'no' }];
    expect(rankCandidates(catalog, history.slice(0, -1))).toEqual(rankCandidates(catalog, [history[0]]));
    expect(rankCandidates(catalog, [], ['one']).map(c => c.character.id)).toEqual(['three', 'two']);
    expect(rankCandidates(catalog, [], catalog.map(c => c.id))).toEqual([]);
  });
  it('contradictory evidence remains finite without pretending certainty', () => {
    const history: AnswerRecord[] = Array.from({ length: 1000 }, (_, i) => ({ questionId: 'a', answer: i % 2 ? 'yes' : 'no' }));
    const ranked = rankCandidates(catalog, history);
    expect(ranked.every(c => Number.isFinite(c.probability))).toBe(true);
    expect(ranked[0].probability).toBeCloseTo(1 / 3);
  });
});
describe('adaptive questions', () => {
  it('never repeats answered questions, including unknown', () => {
    const history: AnswerRecord[] = [{ questionId: 'a', answer: 'unknown' }];
    expect(selectQuestion(rankCandidates(catalog, history), questions, history)?.question.id).not.toBe('a');
  });
  it('prefers a balanced partition and deterministically breaks ties by ID', () => {
    const candidates = rankCandidates([make('a', { a: true, b: true }), make('b', { a: true, b: false }), make('c', { a: true, b: true }), make('d', { a: false, b: false })], []);
    expect(selectQuestion(candidates, questions, [])?.question.id).toBe('b');
    expect(selectQuestion(rankCandidates(catalog, []), [...questions].reverse(), [])?.question.id).toBe('a');
  });
  it('returns null when exhausted or no informative traits exist', () => {
    expect(selectQuestion([], questions, [])).toBeNull();
    expect(selectQuestion(rankCandidates([make('a', { a: true }), make('b', { a: true })], []), questions, [])).toBeNull();
    expect(selectQuestion(rankCandidates(catalog, []), questions, questions.map(q => ({ questionId: q.id, answer: 'unknown' })))).toBeNull();
  });
  it('can recover each distinct synthetic catalog member using truthful adaptive answers', () => {
    const synthetic = Array.from({ length: 8 }, (_, n) => make(String(n), { a: Boolean(n & 1), b: Boolean(n & 2), c: Boolean(n & 4) }));
    for (const target of synthetic) {
      const history: AnswerRecord[] = [];
      for (let i = 0; i < 3; i++) {
        const next = selectQuestion(rankCandidates(synthetic, history), questions, history);
        expect(next).not.toBeNull();
        history.push({ questionId: next!.question.id, answer: target.traits[next!.question.id] ? 'yes' : 'no' });
      }
      expect(rankCandidates(synthetic, history)[0].character.id).toBe(target.id);
    }
  });
  it('requires sufficient confidence and informative answers unless one candidate remains', () => {
    expect(shouldGuess([], 10)).toBe(false);
    expect(shouldGuess(rankCandidates(catalog, []), 10)).toBe(false);
    const strong = [{ character: catalog[0], probability: 0.9 }, { character: catalog[1], probability: 0.1 }];
    expect(shouldGuess(strong, 2)).toBe(false);
    expect(shouldGuess(strong, 3)).toBe(true);
    expect(shouldGuess(strong.slice(0, 1), 0)).toBe(true);
  });
});
