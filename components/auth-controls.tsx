'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logoutCurrentSession } from '@/lib/auth-flow';

export default function AuthControls() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useRef<SupabaseClient | null>(null);
  const busy = useRef(false);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      // Load the auth SDK after the public page paints; no server auth read is added.
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
      try {
        const { createClient } = await import('@/lib/supabase/client');
        if (!active) return;
        const supabase = createClient();
        client.current = supabase;
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (!active) return;
          setSignedIn(Boolean(session));
          if (event === 'SIGNED_OUT' && wasSignedIn.current && !busy.current) {
            window.location.replace('/login?loggedOut=1');
          }
          wasSignedIn.current = Boolean(session);
        });
        unsubscribe = () => data.subscription.unsubscribe();
        // INITIAL_SESSION updates the header; session data never authorizes server access.
      } catch {
        if (active) setError('Account controls are unavailable. Please refresh.');
      }
    }
    void initialize();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    function revalidateRestoredPage(event: PageTransitionEvent) {
      if (event.persisted && ['/baby-profile', '/recommendations', '/shortlist'].some((path) => pathname.startsWith(path))) {
        window.location.reload();
      }
    }
    window.addEventListener('pageshow', revalidateRestoredPage);
    return () => window.removeEventListener('pageshow', revalidateRestoredPage);
  }, [pathname]);

  async function logout() {
    if (busy.current || !client.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const ok = await logoutCurrentSession({
        signOut: (options) => client.current!.auth.signOut(options),
        navigate: (path) => window.location.replace(path),
      });
      if (!ok) setError('Unable to log out. Check your connection and try again.');
    } catch { setError('Unable to log out. Check your connection and try again.'); }
    finally { busy.current = false; setPending(false); }
  }

  return <div className="relative flex shrink-0 items-center gap-3 text-xs sm:gap-4 sm:text-sm">{signedIn ? <><span className="hidden text-stone-600 sm:inline">Your family space</span><button type="button" disabled={pending} onClick={logout} className="rounded-full border border-[#cdd7c4] px-4 py-2.5 font-medium text-[#304b3d] hover:bg-[#edf1e6] disabled:opacity-50">{pending ? 'Logging out…' : 'Log out'}</button></> : <><Link href="/login" className="text-stone-600 hover:text-[#304b3d]">Log in</Link><Link href="/signup" className="rounded-full bg-[#304b3d] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#22392c] sm:px-5">Get started</Link></>}{error && <p role="alert" className="absolute right-0 top-full mt-3 w-64 rounded-lg border border-red-100 bg-white p-3 text-xs text-red-700 shadow-sm">{error}</p>}</div>;
}
