const destinations = new Set(['/baby-profile', '/recommendations', '/shortlist', '/names']);

export function safeAuthDestination(value?: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/baby-profile';
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid') return '/baby-profile';
    const nameDetails = /^\/names\/[0-9a-f-]{36}$/i.test(url.pathname);
    return destinations.has(url.pathname) || nameDetails ? `${url.pathname}${url.search}` : '/baby-profile';
  } catch { return '/baby-profile'; }
}

export async function finishEmailAuthentication({ mode, hasSession, syncUser, navigate, destination }: {
  mode: 'login' | 'signup';
  hasSession: boolean;
  syncUser: () => Promise<boolean>;
  navigate: (path: string) => void;
  destination?: string;
}): Promise<'confirm-email' | 'session-missing' | 'sync-failed' | 'redirected'> {
  if (!hasSession) return mode === 'signup' ? 'confirm-email' : 'session-missing';
  if (!await syncUser()) return 'sync-failed';
  navigate(safeAuthDestination(destination));
  return 'redirected';
}

export async function logoutCurrentSession({ signOut, navigate }: {
  signOut: (options: { scope: 'local' }) => Promise<{ error: unknown }>;
  navigate: (path: string) => void;
}): Promise<boolean> {
  const result = await signOut({ scope: 'local' });
  if (result.error) return false;
  // A full document navigation also discards Next's in-memory private route cache.
  navigate('/login?loggedOut=1');
  return true;
}

export function googleProviderStatus(value: unknown): 'enabled' | 'disabled' | 'unknown' {
  if (!value || typeof value !== 'object') return 'unknown';
  const external = (value as { external?: { google?: unknown } }).external;
  return external?.google === true ? 'enabled' : external?.google === false ? 'disabled' : 'unknown';
}
