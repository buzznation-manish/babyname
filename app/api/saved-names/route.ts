import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/current-user';
import { createShortlistHandlers } from '@/lib/shortlist-api';

export const dynamic = 'force-dynamic';

const handlers = createShortlistHandlers({
  getUserId: getCurrentUserId,
  onError: () => console.error('Saved-name operation failed.'),
  store: {
    ownsProfile: async (userId, profileId) => Boolean(await prisma.babyProfile.findFirst({
      where: { id: profileId, userId }, select: { id: true },
    })),
    nameExists: async (nameId) => Boolean(await prisma.name.findUnique({
      where: { id: nameId }, select: { id: true },
    })),
    list: (userId, profileId) => prisma.savedName.findMany({
      where: { userId, babyProfileId: profileId },
      select: { id: true, nameId: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    save: async (userId, profileId, nameId) => {
      await prisma.savedName.upsert({
        where: { babyProfileId_nameId: { babyProfileId: profileId, nameId } },
        create: { userId, babyProfileId: profileId, nameId },
        // The verified profile owner is also the owner of the saved-name row.
        update: { userId },
      });
    },
    remove: async (userId, profileId, nameId) => {
      await prisma.savedName.deleteMany({ where: { userId, babyProfileId: profileId, nameId } });
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
