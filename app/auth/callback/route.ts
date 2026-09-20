import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { AuthProvider } from '@prisma/client';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL('/login?error=missing_email', requestUrl.origin));

  const provider: AuthProvider = user.app_metadata.provider === 'google' ? 'GOOGLE' : 'EMAIL';
  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName = typeof metadata.full_name === 'string' && metadata.full_name.trim().length > 0
    ? metadata.full_name.trim()
    : typeof metadata.name === 'string' && metadata.name.trim().length > 0
      ? metadata.name.trim()
      : user.email.split('@')[0];

  await prisma.user.upsert({
    where: { email: user.email },
    update: { fullName, authProvider: provider },
    create: { email: user.email, fullName, authProvider: provider },
  });

  return NextResponse.redirect(new URL('/baby-profile', requestUrl.origin));
}
