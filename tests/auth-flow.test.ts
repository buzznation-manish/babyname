import assert from 'node:assert/strict';
import test from 'node:test';
import { finishEmailAuthentication, googleProviderStatus, logoutCurrentSession, safeAuthDestination } from '../lib/auth-flow';

test('login return destination retains local profile context', () => {
  assert.equal(safeAuthDestination('/recommendations?profileId=abc'), '/recommendations?profileId=abc');
  assert.equal(safeAuthDestination('/shortlist?profileId=abc'), '/shortlist?profileId=abc');
});

test('external, protocol-relative, backslash and unsupported auth destinations are refused', () => {
  for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/auth/callback', '/login', '/unknown']) {
    assert.equal(safeAuthDestination(value), '/baby-profile', value);
  }
});

test('email confirmation pending does not call user sync or navigate', async () => {
  let synced = false;
  let navigated = false;
  const result = await finishEmailAuthentication({ mode: 'signup', hasSession: false,
    syncUser: async () => { synced = true; return true; }, navigate: () => { navigated = true; } });
  assert.equal(result, 'confirm-email');
  assert.equal(synced, false);
  assert.equal(navigated, false);
});

test('authenticated login syncs before navigation and sync failure does not redirect', async () => {
  const events: string[] = [];
  const result = await finishEmailAuthentication({ mode: 'login', hasSession: true,
    syncUser: async () => { events.push('sync'); return true; }, navigate: (path) => { events.push(path); }, destination: '/shortlist?profileId=abc' });
  assert.equal(result, 'redirected');
  assert.deepEqual(events, ['sync', '/shortlist?profileId=abc']);
  assert.equal(await finishEmailAuthentication({ mode: 'login', hasSession: true, syncUser: async () => false, navigate: () => assert.fail('must not navigate') }), 'sync-failed');
  assert.equal(await finishEmailAuthentication({ mode: 'login', hasSession: false, syncUser: async () => assert.fail('must not sync'), navigate: () => assert.fail('must not navigate') }), 'session-missing');
});

test('logout signs out the current session then performs a full-document destination change', async () => {
  const events: unknown[] = [];
  assert.equal(await logoutCurrentSession({ signOut: async (options) => { events.push(options); return { error: null }; }, navigate: (path) => { events.push(path); } }), true);
  assert.deepEqual(events, [{ scope: 'local' }, '/login?loggedOut=1']);
});

test('logout failure or network exception does not claim success or navigate', async () => {
  const navigate = () => assert.fail('must not navigate after failure');
  assert.equal(await logoutCurrentSession({ signOut: async () => ({ error: new Error('offline') }), navigate }), false);
  await assert.rejects(logoutCurrentSession({ signOut: async () => { throw new Error('offline'); }, navigate }), /offline/);
});

test('Google availability is based on an explicit provider flag, never assumed', () => {
  assert.equal(googleProviderStatus({ external: { google: true } }), 'enabled');
  assert.equal(googleProviderStatus({ external: { google: false } }), 'disabled');
  for (const value of [null, {}, { external: {} }, { external: { google: 'false' } }]) assert.equal(googleProviderStatus(value), 'unknown');
});
