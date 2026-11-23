import assert from 'node:assert/strict';
import test from 'node:test';
import { createShortlistHandlers, type ShortlistStore } from '../lib/shortlist-api';

const ownedProfile = '11111111-1111-4111-8111-111111111111';
const foreignProfile = '22222222-2222-4222-8222-222222222222';
const nameId = '33333333-3333-4333-8333-333333333333';
const otherName = '44444444-4444-4444-8444-444444444444';

function fixture(signedIn = true) {
  const records = new Map<string, { id: string; nameId: string }>();
  const calls: string[] = [];
  const store: ShortlistStore = {
    ownsProfile: async (user, profile) => { calls.push('ownership'); return user === 'current-user' && profile === ownedProfile; },
    nameExists: async (id) => id === nameId,
    list: async (user, profile) => { calls.push(`list:${user}:${profile}`); return [...records.values()]; },
    save: async (user, profile, id) => { calls.push(`save:${user}:${profile}`); records.set(`${profile}:${id}`, { id: 'saved-id', nameId: id }); },
    remove: async (user, profile, id) => { calls.push(`remove:${user}:${profile}`); records.delete(`${profile}:${id}`); },
  };
  return { records, calls, store, handlers: createShortlistHandlers({ getUserId: async () => signedIn ? 'current-user' : null, store }) };
}

function request(method: 'POST' | 'DELETE', body: object, origin = 'https://example.com') {
  return new Request('https://example.com/api/saved-names', {
    method, headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
}

test('all shortlist operations require authentication before storage access', async () => {
  const { handlers, calls } = fixture(false);
  for (const method of ['GET', 'POST', 'DELETE'] as const) {
    const response = await handlers[method](method === 'GET' ? new Request(`https://example.com/api/saved-names?profileId=${ownedProfile}`) : request(method, { profileId: ownedProfile, nameId }));
    assert.equal(response.status, 401);
  }
  assert.deepEqual(calls, []);
});

test('another account profile cannot be listed, saved to, or removed from', async () => {
  const { handlers, calls } = fixture();
  for (const method of ['GET', 'POST', 'DELETE'] as const) {
    const response = await handlers[method](method === 'GET' ? new Request(`https://example.com/api/saved-names?profileId=${foreignProfile}`) : request(method, { profileId: foreignProfile, nameId }));
    assert.equal(response.status, 404);
  }
  assert.deepEqual(calls, ['ownership', 'ownership', 'ownership']);
});

test('forged userId is ignored; saves are scoped to the authenticated account', async () => {
  const { handlers, calls } = fixture();
  assert.equal((await handlers.POST(request('POST', { userId: 'victim', profileId: ownedProfile, nameId }))).status, 200);
  assert.ok(calls.includes(`save:current-user:${ownedProfile}`));
  assert.ok(!calls.some((call) => call.includes('victim')));
});

test('repeated save then list/remove preserves idempotent shortlist behavior', async () => {
  const { handlers, records } = fixture();
  const body = { profileId: ownedProfile, nameId };
  for (let i = 0; i < 2; i++) assert.deepEqual(await (await handlers.POST(request('POST', body))).json(), { saved: true });
  assert.equal(records.size, 1);
  const response = await handlers.GET(new Request(`https://example.com/api/saved-names?profileId=${ownedProfile}`));
  assert.match(response.headers.get('cache-control')!, /private, no-store/);
  assert.deepEqual(await response.json(), { savedNames: [{ id: 'saved-id', nameId }] });
  for (let i = 0; i < 2; i++) assert.deepEqual(await (await handlers.DELETE(request('DELETE', body))).json(), { saved: false });
  assert.equal(records.size, 0);
});

test('unknown names and invalid IDs cannot be written', async () => {
  const { handlers, records } = fixture();
  assert.equal((await handlers.POST(request('POST', { profileId: ownedProfile, nameId: otherName }))).status, 404);
  assert.equal((await handlers.POST(request('POST', { profileId: 'invalid', nameId }))).status, 400);
  assert.equal((await handlers.DELETE(request('DELETE', { profileId: ownedProfile, nameId: null }))).status, 400);
  assert.equal((await handlers.GET(new Request('https://example.com/api/saved-names'))).status, 400);
  assert.equal(records.size, 0);
});

test('cross-origin mutations and unsupported or malformed bodies are rejected', async () => {
  const { handlers, calls } = fixture();
  assert.equal((await handlers.POST(request('POST', { profileId: ownedProfile, nameId }, 'https://other.example'))).status, 403);
  assert.equal((await handlers.POST(new Request('https://example.com/api/saved-names', { method: 'POST', body: '{}' }))).status, 415);
  assert.equal((await handlers.POST(new Request('https://example.com/api/saved-names', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.deepEqual(calls, []);
});

test('storage failures return a generic error without leaking database details', async () => {
  const { store } = fixture();
  store.save = async () => { throw new Error('private database connection details'); };
  let logged = false;
  const handlers = createShortlistHandlers({ getUserId: async () => 'current-user', store, onError: () => { logged = true; } });
  const response = await handlers.POST(request('POST', { profileId: ownedProfile, nameId }));
  assert.equal(response.status, 500);
  assert.equal(logged, true);
  assert.doesNotMatch(await response.text(), /private database/);
});
