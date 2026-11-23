export interface ProfilePreferences {
  gender: 'BOY' | 'GIRL' | 'UNISEX';
  preferredStartSyllable: string | null;
  preferredLengthMax: number | null;
  preferredStyle: string | null;
}

export interface NameCandidate {
  id: string;
  nameRomanized: string;
  popularityScore: number;
  trendScore: number;
  categories: { category: { name: string } }[];
}

const supportedStyles = ['Modern', 'Spiritual', 'Nature'] as const;

export function getSupportedStyle(style: string | null): string | undefined {
  return supportedStyles.find((item) => item.toLowerCase() === style?.trim().toLowerCase());
}

// UNISEX in a profile means the family has no gender preference.
export function buildNameFilters(profile: ProfilePreferences) {
  const syllable = profile.preferredStartSyllable?.trim();
  return {
    ...(profile.gender !== 'UNISEX'
      ? { gender: { in: [profile.gender, 'UNISEX' as const] } }
      : {}),
    ...(syllable
      ? { startingSyllable: { equals: syllable, mode: 'insensitive' as const } }
      : {}),
    ...(profile.preferredLengthMax !== null
      ? { characterLength: { lte: profile.preferredLengthMax } }
      : {}),
  };
}

export function matchesStyle(name: NameCandidate, style: string): boolean {
  return name.categories.some(({ category }) => category.name.toLowerCase() === style.toLowerCase());
}

export function rankNames<T extends NameCandidate>(names: readonly T[], style: string | null): T[] {
  const supportedStyle = getSupportedStyle(style);
  return [...names].sort((a, b) => {
    const styleDifference = supportedStyle
      ? Number(matchesStyle(b, supportedStyle)) - Number(matchesStyle(a, supportedStyle))
      : 0;
    return styleDifference || b.popularityScore - a.popularityScore ||
      b.trendScore - a.trendScore || a.nameRomanized.localeCompare(b.nameRomanized, 'en') ||
      a.id.localeCompare(b.id, 'en');
  });
}
