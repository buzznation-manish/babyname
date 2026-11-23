'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { finishEmailAuthentication, googleProviderStatus, safeAuthDestination } from '@/lib/auth-flow';

type AuthMode = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthMode;
}

interface SyncUserResponse {
  ok?: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
}

export default function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'checking' | 'enabled' | 'disabled' | 'unknown'>('checking');

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    if (query.get('loggedOut') === '1') setMessage('You have been logged out.');
    if (query.has('error')) setError('Sign-in could not be completed. Please try again.');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    async function checkGoogle() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) { if (active) setGoogleStatus('unknown'); return; }
        const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
          headers: { apikey: key }, signal: controller.signal, credentials: 'omit',
        });
        const body: unknown = await response.json().catch(() => null);
        if (active && !controller.signal.aborted) setGoogleStatus(response.ok ? googleProviderStatus(body) : 'unknown');
      } catch { if (active) setGoogleStatus('unknown'); }
      finally { window.clearTimeout(timeout); }
    }
    void checkGoogle();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, []);

  async function syncUserWithPrisma(): Promise<boolean> {
    try {
      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const syncBody = (await syncResponse.json().catch(() => null)) as SyncUserResponse | null;

      if (!syncResponse.ok || !syncBody?.ok) {
        setError(syncBody?.error ?? 'Failed to sync your user profile. Please try again.');
        return false;
      }

      return true;
    } catch {
      setError('Could not reach the user sync service. Please try again.');
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setMessage(null);
    if (mode === 'signup' && !fullName.trim()) { setError('Please enter your name.'); return; }
    setIsSubmitting(true);
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(), password,
            options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
      if (result.error) { setError(result.error.message); return; }
      const destination = new URLSearchParams(window.location.search).get('redirectedFrom');
      const outcome = await finishEmailAuthentication({
        mode, hasSession: Boolean(result.data.session), syncUser: syncUserWithPrisma,
        destination: safeAuthDestination(destination), navigate: (path) => window.location.assign(path),
      });
      if (outcome === 'confirm-email') setMessage('Account created. Check your email to confirm your account, then sign in.');
      if (outcome === 'session-missing') setError('No sign-in session was created. Please try again.');
    } catch { setError('Unable to reach sign-in. Check your connection and try again.'); }
    finally { setIsSubmitting(false); }
  }

  async function handleGoogleLogin() {
    if (isSubmitting || googleStatus === 'disabled' || googleStatus === 'checking') return;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) setError(oauthError.message);
    } catch { setError('Unable to start Google sign-in. Please try email sign-in or retry.'); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="text-3xl font-bold text-stone-900">
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        {mode === 'login' ? 'Sign in to continue finding the perfect name.' : 'Start your baby name journey today.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <label className="block text-sm font-medium text-stone-700">
            Full name
            <input maxLength={120} autoComplete="name" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
        )}
        <label className="block text-sm font-medium text-stone-700">
          Email
          <input type="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Password
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : 1} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button disabled={isSubmitting} className="w-full rounded-lg bg-stone-900 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />OR<span className="h-px flex-1 bg-stone-200" /></div>
      <button type="button" disabled={isSubmitting || googleStatus === 'disabled' || googleStatus === 'checking'} onClick={handleGoogleLogin} className="w-full rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 disabled:opacity-50">{googleStatus === 'checking' ? 'Checking Google sign-in…' : 'Continue with Google'}</button>
      {googleStatus === 'disabled' && <p className="mt-3 text-sm text-stone-600">Google sign-in is not enabled for this app yet. Please use email.</p>}
      {googleStatus === 'unknown' && <p className="mt-3 text-sm text-stone-600">Google sign-in availability could not be verified. You can use email or try Google.</p>}
      {message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}
