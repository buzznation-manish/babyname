export type ProfileGender = 'BOY' | 'GIRL' | 'UNISEX';

export interface BabyProfileData {
  babyName: string | null;
  gender: ProfileGender;
  dob: string;
  birthTime: string | null;
  birthPlace: string | null;
  nakshatra: string | null;
  rashi: string | null;
  preferredStyle: string | null;
  preferredLengthMax: number | null;
  preferredStartSyllable: string | null;
  religion: string;
}

export interface BabyProfileRecord extends BabyProfileData { id: string }

export function emptyProfileForm(): BabyProfileData {
  return {
    babyName: '', gender: 'UNISEX', dob: '', birthTime: '', birthPlace: '',
    nakshatra: '', rashi: '', preferredStyle: '', preferredLengthMax: null,
    preferredStartSyllable: '', religion: 'Hindu',
  };
}

export function profileFormState(profile: BabyProfileData): BabyProfileData {
  // Select only editable fields: never copy an ID/userId into a form payload.
  return {
    babyName: profile.babyName ?? '', gender: profile.gender, dob: profile.dob.slice(0, 10),
    birthTime: profile.birthTime ?? '', birthPlace: profile.birthPlace ?? '',
    nakshatra: profile.nakshatra ?? '', rashi: profile.rashi ?? '',
    preferredStyle: profile.preferredStyle ?? '', preferredLengthMax: profile.preferredLengthMax,
    preferredStartSyllable: profile.preferredStartSyllable ?? '', religion: profile.religion,
  };
}

export function serializeBabyProfile(profile: Omit<BabyProfileRecord, 'dob'> & { dob: Date | string }): BabyProfileRecord {
  return { id: profile.id, ...profileFormState({ ...profile, dob: profile.dob instanceof Date ? profile.dob.toISOString() : profile.dob }) };
}

export function selectBabyProfile<T extends { id: string }>(profiles: readonly T[], query: {
  profileId?: string | string[];
  new?: string | string[];
}): { mode: 'new' } | { mode: 'edit'; profile: T } | { mode: 'unavailable' } {
  if (query.new === '1') return { mode: 'new' };
  if (query.profileId !== undefined) {
    const profile = typeof query.profileId === 'string' ? profiles.find((item) => item.id === query.profileId) : undefined;
    return profile ? { mode: 'edit', profile } : { mode: 'unavailable' };
  }
  return profiles.length ? { mode: 'edit', profile: profiles[0] } : { mode: 'new' };
}

export function parseBabyProfile(body: unknown): { data: BabyProfileData; error?: never } | { error: string; data?: never } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid request body.' };
  const payload = body as Record<string, unknown>;
  if (!['BOY', 'GIRL', 'UNISEX'].includes(payload.gender as string)) return { error: 'Choose Boy, Girl or Unisex.' };
  const dob = payload.dob;
  if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob.startsWith('0000')) {
    return { error: 'Enter a valid birth or expected date (YYYY-MM-DD).' };
  }
  const date = new Date(`${dob}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dob) return { error: 'Enter a real calendar date.' };

  const fields = [
    ['babyName', 100, 'Baby name'], ['birthTime', 10, 'Birth time'],
    ['birthPlace', 150, 'Birth place'], ['nakshatra', 50, 'Nakshatra'],
    ['rashi', 50, 'Rashi'], ['preferredStyle', 50, 'Preferred style'],
    ['preferredStartSyllable', 10, 'Starting syllable'], ['religion', 50, 'Religion'],
  ] as const;
  const strings: Record<string, string | null> = {};
  for (const [key, max, label] of fields) {
    const value = payload[key];
    if (value !== undefined && value !== null && typeof value !== 'string') return { error: `${label} must be text.` };
    const clean = typeof value === 'string' ? value.trim() : '';
    if (Array.from(clean).length > max) return { error: `${label} must be ${max} characters or fewer.` };
    strings[key] = clean || null;
  }
  if (strings.birthTime && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(strings.birthTime)) {
    return { error: 'Birth time must be a valid 24-hour time.' };
  }
  const maximum = payload.preferredLengthMax;
  if (maximum !== undefined && maximum !== null && (typeof maximum !== 'number' || !Number.isInteger(maximum) || maximum < 1 || maximum > 100)) {
    return { error: 'Maximum name length must be a whole number between 1 and 100.' };
  }
  return { data: {
    babyName: strings.babyName, gender: payload.gender as ProfileGender, dob,
    birthTime: strings.birthTime, birthPlace: strings.birthPlace, nakshatra: strings.nakshatra,
    rashi: strings.rashi, preferredStyle: strings.preferredStyle,
    preferredLengthMax: maximum === undefined || maximum === null ? null : maximum as number,
    preferredStartSyllable: strings.preferredStartSyllable, religion: strings.religion ?? 'Hindu',
  } };
}
