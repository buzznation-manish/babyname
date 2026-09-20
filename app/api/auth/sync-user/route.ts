import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { AuthProvider } from '@prisma/client';

export async function POST(request: NextRequest) {
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
    const fullName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0
        ? user.user_metadata.full_name.trim()
        : typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
          ? user.user_metadata.name.trim()
          : email.split('@')[0];

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

    return NextResponse.json({ ok: true, user: { id: dbUser.id, email: dbUser.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
