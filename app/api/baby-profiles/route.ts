import { NextResponse } from 'next/server';
import { Gender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface BabyProfilePayload {
  babyName?: string | null;
  gender?: Gender;
  dob?: string;
  birthTime?: string | null;
  birthPlace?: string | null;
  nakshatra?: string | null;
  rashi?: string | null;
  preferredStyle?: string | null;
  preferredLengthMax?: number | null;
  preferredStartSyllable?: string | null;
  religion?: string;
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePayload(body: unknown): { data?: BabyProfilePayload; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body.' };

  const payload = body as Record<string, unknown>;
  const gender = payload.gender;
  const dob = payload.dob;

  if (!Object.values(Gender).includes(gender as Gender)) {
    return { error: 'Gender must be BOY, GIRL, or UNISEX.' };
  }

  if (typeof dob !== 'string' || Number.isNaN(Date.parse(dob))) {
    return { error: 'A valid date of birth is required.' };
  }

  const preferredLengthMax = payload.preferredLengthMax;
  if (
    preferredLengthMax !== undefined &&
    preferredLengthMax !== null &&
    (typeof preferredLengthMax !== 'number' ||
      !Number.isInteger(preferredLengthMax) ||
      preferredLengthMax < 1)
  ) {
    return { error: 'Preferred maximum length must be a positive whole number.' };
  }

  return {
    data: {
      babyName: cleanOptionalString(payload.babyName),
      gender: gender as Gender,
      dob,
      birthTime: cleanOptionalString(payload.birthTime),
      birthPlace: cleanOptionalString(payload.birthPlace),
      nakshatra: cleanOptionalString(payload.nakshatra),
      rashi: cleanOptionalString(payload.rashi),
      preferredStyle: cleanOptionalString(payload.preferredStyle),
      preferredLengthMax:
        preferredLengthMax === null || preferredLengthMax === undefined
          ? null
          : preferredLengthMax as number,
      preferredStartSyllable: cleanOptionalString(payload.preferredStartSyllable),
      religion: cleanOptionalString(payload.religion) ?? 'Hindu',
    },
  };
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;
  return prisma.user.findUnique({ where: { email: user.email } });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await prisma.babyProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = parsePayload(await request.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? 'Invalid request.' }, { status: 400 });
  }

  const profile = await prisma.babyProfile.create({
    data: {
      userId: user.id,
      babyName: parsed.data.babyName,
      gender: parsed.data.gender!,
      dob: new Date(parsed.data.dob!),
      birthTime: parsed.data.birthTime,
      birthPlace: parsed.data.birthPlace,
      nakshatra: parsed.data.nakshatra,
      rashi: parsed.data.rashi,
      preferredStyle: parsed.data.preferredStyle,
      preferredLengthMax: parsed.data.preferredLengthMax,
      preferredStartSyllable: parsed.data.preferredStartSyllable,
      religion: parsed.data.religion!,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const profileId =
    body &&
    typeof body === 'object' &&
    'id' in body &&
    typeof body.id === 'string'
      ? body.id
      : null;

  if (!profileId) {
    return NextResponse.json({ error: 'Profile id is required.' }, { status: 400 });
  }

  const parsed = parsePayload(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? 'Invalid request.' }, { status: 400 });
  }

  const existing = await prisma.babyProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Baby profile not found.' }, { status: 404 });
  }

  const profile = await prisma.babyProfile.update({
    where: { id: profileId },
    data: {
      babyName: parsed.data.babyName,
      gender: parsed.data.gender!,
      dob: new Date(parsed.data.dob!),
      birthTime: parsed.data.birthTime,
      birthPlace: parsed.data.birthPlace,
      nakshatra: parsed.data.nakshatra,
      rashi: parsed.data.rashi,
      preferredStyle: parsed.data.preferredStyle,
      preferredLengthMax: parsed.data.preferredLengthMax,
      preferredStartSyllable: parsed.data.preferredStartSyllable,
      religion: parsed.data.religion!,
    },
  });

  return NextResponse.json({ profile });
}
