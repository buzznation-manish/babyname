import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyProfileForm, parseBabyProfile, profileFormState, selectBabyProfile, serializeBabyProfile, type BabyProfileRecord } from '../lib/baby-profiles';
import { createBabyProfileHandlers, type BabyProfileStore } from '../lib/baby-profiles-api';

const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';
const foreign = '33333333-3333-4333-8333-333333333333';
const created = '44444444-4444-4444-8444-444444444444';
const valid = { ...emptyProfileForm(), babyName: 'First baby', gender: 'BOY' as const, dob: '2024-02-29' };

test('profile selection distinguishes new mode from editing the explicit saved baby', () => {
  const profiles = [{ id: first }, { id: second }];
  assert.deepEqual(selectBabyProfile([], {}), { mode: 'new' });
  assert.deepEqual(selectBabyProfile(profiles, {}), { mode: 'edit', profile: profiles[0] });
  assert.deepEqual(selectBabyProfile(profiles, { profileId: second }), { mode: 'edit', profile: profiles[1] });
  assert.deepEqual(selectBabyProfile(profiles, { new: '1', profileId: first }), { mode: 'new' });
});

test('invalid or another account profile ID never falls back to editing a different baby', () => {
  for (const profileId of [foreign, 'invalid', [first, second]]) {
    assert.deepEqual(selectBabyProfile([{ id: first }], { profileId }), { mode: 'unavailable' });
  }
});

test('new forms are independent and edit payloads do not carry record identifiers', () => {
  const a = emptyProfileForm();
  a.babyName = 'Changed';
  assert.equal(emptyProfileForm().babyName, '');
  const state = profileFormState({ ...valid, id: first, userId: 'private', dob: '2024-02-29T00:00:00.000Z' } as BabyProfileRecord);
  assert.equal(state.dob, '2024-02-29');
  assert.ok(!('id' in state));
  assert.ok(!('userId' in state));
});

test('date validation rejects rolled-over/ambiguous dates and allows real leap and expected dates', () => {
  for (const dob of ['2023-02-29', '2024-02-30', '2024-13-01', '02/03/2024', '0000-01-01', '2024-02-29T00:00:00Z']) {
    assert.ok(parseBabyProfile({ ...valid, dob }).error, dob);
  }
  assert.ok(parseBabyProfile(valid).data);
  assert.ok(parseBabyProfile({ ...valid, dob: '2030-01-01' }).data);
});

test('invalid times, overlong fields and invalid maximum lengths are rejected before storage', () => {
  for (const overrides of [
    { birthTime: '25:00' }, { birthTime: '12:99' }, { birthPlace: 'x'.repeat(151) },
    { preferredStartSyllable: 'x'.repeat(11) }, { babyName: 123 },
    { preferredLengthMax: 0 }, { preferredLengthMax: 1.5 }, { preferredLengthMax: 101 }, { gender: 'OTHER' },
  ]) assert.ok(parseBabyProfile({ ...valid, ...overrides }).error);
  const parsed = parseBabyProfile({ ...valid, babyName: '  Aarav  ', birthTime: '09:15:30', religion: ' ', userId: 'forged' });
  assert.equal(parsed.data?.babyName, 'Aarav');
  assert.equal(parsed.data?.religion, 'Hindu');
  assert.ok(!('userId' in parsed.data!));
});

test('serialization returns a stable date-only record without account metadata', () => {
  const record = serializeBabyProfile({ ...valid, id: first, dob: new Date('2024-02-29T00:00:00Z'), userId: 'private' } as Omit<BabyProfileRecord, 'dob'> & { dob: Date });
  assert.equal(record.id, first);
  assert.equal(record.dob, '2024-02-29');
  assert.ok(!('userId' in record));
});

function fixture(signedIn = true) {
  const records = new Map<string, BabyProfileRecord>([
    [first, { ...valid, id: first }],
    [second, { ...valid, id: second, babyName: 'Second baby' }],
    [foreign, { ...valid, id: foreign, babyName: 'Other account' }],
  ]);
  const calls: string[] = [];
  const store: BabyProfileStore = {
    list: async (userId) => { calls.push(`list:${userId}`); return [records.get(first)!, records.get(second)!]; },
    create: async (userId, data) => { calls.push(`create:${userId}`); const record = { ...data, id: created }; records.set(created, record); return record; },
    update: async (userId, id, data) => {
      calls.push(`update:${userId}:${id}`);
      if (userId !== 'current-user' || (id !== first && id !== second)) return null;
      const record = { ...data, id }; records.set(id, record); return record;
    },
  };
  return { records, calls, store, handlers: createBabyProfileHandlers({ getUserId: async () => signedIn ? 'current-user' : null, store }) };
}

function request(method: 'POST' | 'PUT', body: unknown, origin = 'https://example.com') {
  return new Request('https://example.com/api/baby-profiles', {
    method, headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
}

test('profile list, create and update all reject signed-out requests before storage', async () => {
  const { handlers, calls } = fixture(false);
  assert.equal((await handlers.GET(new Request('https://example.com/api/baby-profiles'))).status, 401);
  for (const method of ['POST', 'PUT'] as const) assert.equal((await handlers[method](request(method, valid))).status, 401);
  assert.deepEqual(calls, []);
});

test('list uses the authenticated account and returns uncached profile data', async () => {
  const { handlers, calls } = fixture();
  const response = await handlers.GET(new Request('https://example.com/api/baby-profiles?userId=victim'));
  const body = await response.json() as { profiles: BabyProfileRecord[] };
  assert.deepEqual(calls, ['list:current-user']);
  assert.deepEqual(body.profiles.map((item) => item.id), [first, second]);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('adding another baby creates a separate record without overwriting either existing baby', async () => {
  const { handlers, records, calls } = fixture();
  const response = await handlers.POST(request('POST', { ...valid, id: first, userId: 'victim', babyName: 'New baby' }));
  assert.equal(response.status, 201);
  const body = await response.json() as { profile: BabyProfileRecord };
  assert.equal(body.profile.id, created);
  assert.equal(records.get(first)?.babyName, 'First baby');
  assert.equal(records.get(second)?.babyName, 'Second baby');
  assert.deepEqual(calls, ['create:current-user']);
});

test('editing the second baby updates only that record and returns its ID for navigation', async () => {
  const { handlers, records } = fixture();
  const response = await handlers.PUT(request('PUT', { ...valid, id: second, userId: 'victim', babyName: 'Updated second' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json() as { profile: BabyProfileRecord }).profile.id, second);
  assert.equal(records.get(second)?.babyName, 'Updated second');
  assert.equal(records.get(first)?.babyName, 'First baby');
});

test('another account baby cannot be updated and stays unchanged', async () => {
  const { handlers, records } = fixture();
  assert.equal((await handlers.PUT(request('PUT', { ...valid, id: foreign, babyName: 'Attacker change' }))).status, 404);
  assert.equal(records.get(foreign)?.babyName, 'Other account');
});

test('invalid IDs, invalid body, missing JSON type and cross-origin writes are rejected', async () => {
  const { handlers, calls } = fixture();
  assert.equal((await handlers.PUT(request('PUT', { ...valid, id: 'invalid' }))).status, 400);
  assert.equal((await handlers.POST(request('POST', { ...valid, dob: '2023-02-29' }))).status, 400);
  assert.equal((await handlers.POST(request('POST', valid, 'https://other.example'))).status, 403);
  assert.equal((await handlers.POST(new Request('https://example.com/api/baby-profiles', { method: 'POST', body: '{}' }))).status, 415);
  assert.equal((await handlers.POST(new Request('https://example.com/api/baby-profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.deepEqual(calls, []);
});

test('storage failure gives a useful error without exposing private connection details', async () => {
  const { store } = fixture();
  store.create = async () => { throw new Error('private connection details'); };
  const handlers = createBabyProfileHandlers({ getUserId: async () => 'current-user', store });
  const response = await handlers.POST(request('POST', valid));
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private connection/);
});
