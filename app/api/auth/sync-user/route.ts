import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { AuthProvider } from '@prisma/client';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'This request is not allowed.' }, { status: 403 });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const provider = (user.app_metadata?.provider === 'google' ? 'GOOGLE' : 'EMAIL') as AuthProvider;
    const rawName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0
        ? user.user_metadata.full_name.trim()
        : typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
          ? user.user_metadata.name.trim()
          : email.split('@')[0];

    const fullName = Array.from(rawName).slice(0, 120).join('');
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        authProvider: provider,
      },
      create: {
        email,
        fullName,
        authProvider: provider,
      },
    });

    return NextResponse.json({ ok: true, user: { id: dbUser.id, email: dbUser.email } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    console.error('Authenticated user sync failed.');
    return NextResponse.json({ error: 'Unable to prepare your account. Please try again.' }, { status: 500 });
  }
}
