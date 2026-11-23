import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNameFilters } from '../lib/name-filters';

test('home search and inspiration links preserve their intended browse filters', () => {
  assert.deepEqual(parseNameFilters({ search: ' light ', category: ' Nature ', gender: 'GIRL' }), { search: 'light', category: 'Nature', gender: 'GIRL' });
});

test('ambiguous URL arrays and unsupported genders do not become invalid browse queries', () => {
  assert.deepEqual(parseNameFilters({ search: ['Aarav', 'Tara'], category: ['Modern'], gender: 'OTHER' }), { search: '', category: '', gender: '' });
  assert.deepEqual(parseNameFilters({}), { search: '', category: '', gender: '' });
});

test('home URL filters stay within their intended length bounds', () => {
  const filters = parseNameFilters({ search: 'x'.repeat(500), category: 'y'.repeat(150), gender: 'UNISEX' });
  assert.equal(filters.search.length, 200);
  assert.equal(filters.category.length, 80);
  assert.equal(filters.gender, 'UNISEX');
});
