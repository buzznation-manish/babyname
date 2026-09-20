'use client';

import { type FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

  async function syncUserWithPrisma(): Promise<boolean> {
    try {
      console.log('Supabase auth succeeded; syncing user with Prisma...');

      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const syncBody = (await syncResponse.json().catch(() => null)) as SyncUserResponse | null;

      if (!syncResponse.ok) {
        console.error('Prisma user sync failed:', syncBody);
        setError(syncBody?.error ?? 'Failed to sync your user profile. Please try again.');
        return false;
      }

      console.log('Prisma user sync succeeded:', syncBody);
      return true;
    } catch (syncError) {
      console.error('Prisma user sync request failed:', syncError);
      setError('Could not reach the user sync service. Please try again.');
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

    if (result.error) {
      setIsSubmitting(false);
      setError(result.error.message);
      console.error('Supabase auth error:', result.error.message);
      return;
    }

    const didSync = await syncUserWithPrisma();
    setIsSubmitting(false);

    if (!didSync) return;

    if (mode === 'signup' && !result.data.session) {
      setMessage('Account created. Check your email if confirmation is enabled.');
      return;
    }

    window.location.assign('/baby-profile');
  }

  async function handleGoogleLogin() {
    setError(null);
    setMessage(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (oauthError) {
      setError(oauthError.message);
      console.error('Google OAuth error:', oauthError.message);
    }
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
            <input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
        )}
        <label className="block text-sm font-medium text-stone-700">
          Email
          <input type="email" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Password
          <input type="password" minLength={6} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button disabled={isSubmitting} className="w-full rounded-lg bg-stone-900 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />OR<span className="h-px flex-1 bg-stone-200" /></div>
      <button onClick={handleGoogleLogin} className="w-full rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700">Continue with Google</button>
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}
