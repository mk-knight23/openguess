import { expect, it } from 'vitest';
import { characters, questions } from './data/catalog';
import { rankCandidates, selectQuestion, shouldGuess } from './engine';
import type { AnswerRecord } from './types';

it('identifies every starter catalog member with ideal catalog-consistent answers within 25 questions', () => {
  const results = characters.map(target => {
    const history: AnswerRecord[] = [];
    const rejected: string[] = [];
    let firstGuess: string | null = null;
    let found = false;
    while (history.length <= 25) {
      const ranked = rankCandidates(characters, history, rejected);
      const next = selectQuestion(ranked, questions, history);
      const informative = history.filter(record => record.answer !== 'unknown').length;
      if (shouldGuess(ranked, informative) || !next || history.length === 25) {
        const guess = ranked[0]?.character.id;
        if (!guess) break;
        firstGuess ??= guess;
        if (guess === target.id) { found = true; break; }
        rejected.push(guess);
        continue;
      }
      const trait = target.traits[next.question.id];
      history.push({ questionId: next.question.id, answer: trait == null ? 'unknown' : trait ? 'yes' : 'no' });
    }
    return { id: target.id, firstCorrect: firstGuess === target.id, found, questions: history.length, rejections: rejected.length };
  });
  const counts = results.map(result => result.questions).sort((a, b) => a - b);
  const metrics = {
    catalogSize: characters.length,
    firstGuessAccuracy: results.filter(result => result.firstCorrect).length / results.length,
    maximumQuestions: Math.max(...counts),
    medianQuestions: (counts[Math.floor((counts.length - 1) / 2)] + counts[Math.floor(counts.length / 2)]) / 2,
    unresolved: results.filter(result => !result.found).map(result => result.id),
    wrongFirstGuesses: results.filter(result => !result.firstCorrect),
  };
  console.info('Ideal catalog replay metrics:', JSON.stringify(metrics));
  expect(metrics.unresolved).toEqual([]);
  expect(metrics.firstGuessAccuracy).toBeGreaterThanOrEqual(0.9);
  expect(metrics.maximumQuestions).toBeLessThanOrEqual(25);
});
