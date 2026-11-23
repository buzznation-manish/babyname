import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/current-user';
import { createBabyProfileHandlers } from '@/lib/baby-profiles-api';
import { serializeBabyProfile, type BabyProfileData } from '@/lib/baby-profiles';

export const dynamic = 'force-dynamic';

function databaseFields(data: BabyProfileData) {
  return { ...data, dob: new Date(`${data.dob}T00:00:00.000Z`) };
}

const handlers = createBabyProfileHandlers({
  getUserId: getCurrentUserId,
  onError: () => console.error('Baby-profile operation failed.'),
  store: {
    list: async (userId) => (await prisma.babyProfile.findMany({
      where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    })).map(serializeBabyProfile),
    create: async (userId, data) => serializeBabyProfile(await prisma.babyProfile.create({
      data: { userId, ...databaseFields(data) },
    })),
    update: (userId, id, data) => prisma.$transaction(async (transaction) => {
      const result = await transaction.babyProfile.updateMany({
        where: { id, userId }, data: databaseFields(data),
      });
      if (!result.count) return null;
      const profile = await transaction.babyProfile.findFirst({ where: { id, userId } });
      return profile ? serializeBabyProfile(profile) : null;
    }),
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
