import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNameFilters, getSupportedStyle, rankNames, type NameCandidate, type ProfilePreferences } from '../lib/recommendations';

const profile: ProfilePreferences = { gender: 'BOY', preferredStartSyllable: null, preferredLengthMax: null, preferredStyle: null };
const candidate = (id: string, popularityScore: number, style?: string): NameCandidate => ({ id, nameRomanized: id, popularityScore, trendScore: 1, categories: style ? [{ category: { name: style } }] : [] });

test('boy and girl profiles allow unisex names, while no gender preference allows all', () => {
  assert.deepEqual(buildNameFilters(profile), { gender: { in: ['BOY', 'UNISEX'] } });
  assert.deepEqual(buildNameFilters({ ...profile, gender: 'GIRL' }), { gender: { in: ['GIRL', 'UNISEX'] } });
  assert.deepEqual(buildNameFilters({ ...profile, gender: 'UNISEX' }), {});
});

test('explicit syllable and length constraints are kept rather than silently relaxed', () => {
  assert.deepEqual(buildNameFilters({ ...profile, preferredStartSyllable: ' Aa ', preferredLengthMax: 4 }), {
    gender: { in: ['BOY', 'UNISEX'] }, startingSyllable: { equals: 'Aa', mode: 'insensitive' }, characterLength: { lte: 4 },
  });
});

test('supported style wins over popularity without modifying the input', () => {
  const names = [candidate('popular', 100), candidate('style-match', 10, 'Modern')];
  assert.deepEqual(rankNames(names, ' modern ').map((name) => name.id), ['style-match', 'popular']);
  assert.equal(names[0].id, 'popular');
});

test('unknown styles use popularity and do not invent a style match', () => {
  assert.equal(getSupportedStyle('traditional'), undefined);
  assert.deepEqual(rankNames([candidate('low', 1), candidate('high', 99)], 'traditional').map((name) => name.id), ['high', 'low']);
});

test('ties use trend then name and empty candidate sets stay empty', () => {
  const names = [candidate('Zara', 20), candidate('Anaya', 20), { ...candidate('Tara', 20), trendScore: 10 }];
  assert.deepEqual(rankNames(names, null).map((name) => name.id), ['Tara', 'Anaya', 'Zara']);
  assert.deepEqual(rankNames([], 'Modern'), []);
});
