import { describe, expect, it } from 'vitest';
import { CATALOG_VERSION, characters, questions } from './catalog';

describe('independently authored starter catalog', () => {
  it('provides a version and a useful supported pool', () => {
    expect(CATALOG_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(characters.length).toBeGreaterThanOrEqual(60);
    expect(questions.length).toBeGreaterThanOrEqual(40);
    expect(questions.length).toBeLessThanOrEqual(60);
  });
  it('uses unique ids and complete valid question references', () => {
    expect(new Set(characters.map(c => c.id)).size).toBe(characters.length);
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
    for (const character of characters) {
      expect(Object.keys(character.traits).sort()).toEqual(questions.map(q => q.id).sort());
      expect(Object.values(character.traits).every(v => v === true || v === false || v === null)).toBe(true);
      expect(character.name.length).toBeGreaterThan(0);
    }
  });
  it('distinguishes every supported character with observable semantic traits', () => {
    const signatures = characters.map(c => questions.map(q => String(c.traits[q.id])).join('|'));
    expect(new Set(signatures).size).toBe(characters.length);
    expect(questions.every(q => q.text.endsWith('?') && q.hint.length > 0)).toBe(true);
  });
});
