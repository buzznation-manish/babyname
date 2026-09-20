import { NextRequest, NextResponse } from 'next/server';
import { Gender, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search')?.trim() ?? '';
  const genderParam = searchParams.get('gender');
  const startingSyllable = searchParams.get('startingSyllable')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const requestedPageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE);

  const gender = Object.values(Gender).includes(genderParam as Gender)
    ? (genderParam as Gender)
    : undefined;

  const where: Prisma.NameWhereInput = {
    ...(search
      ? {
          OR: [
            { nameRomanized: { contains: search, mode: 'insensitive' } },
            { nameNative: { contains: search, mode: 'insensitive' } },
            { meaning: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(gender ? { gender } : {}),
    ...(startingSyllable
      ? { startingSyllable: { equals: startingSyllable, mode: 'insensitive' } }
      : {}),
    ...(category
      ? {
          categories: {
            some: {
              category: { name: { equals: category, mode: 'insensitive' } },
            },
          },
        }
      : {}),
  };

  const [total, names, categories] = await prisma.$transaction([
    prisma.name.count({ where }),
    prisma.name.findMany({
      where,
      select: {
        id: true,
        nameRomanized: true,
        nameNative: true,
        startingSyllable: true,
        gender: true,
        origin: true,
        meaning: true,
        pronunciation: true,
        syllablesCount: true,
        characterLength: true,
        popularityScore: true,
        trendScore: true,
        modernityScore: true,
        spiritualityScore: true,
        uniquenessScore: true,
        categories: {
          select: { category: { select: { name: true } } },
        },
      },
      orderBy: [{ popularityScore: 'desc' }, { trendScore: 'desc' }, { nameRomanized: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.nameCategory.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({
    names,
    categories: categories.map(({ name }) => name),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
