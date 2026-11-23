interface SavedNameRecord {
  id: string;
  nameId: string;
}

export interface ShortlistStore {
  ownsProfile: (userId: string, profileId: string) => Promise<boolean>;
  nameExists: (nameId: string) => Promise<boolean>;
  list: (userId: string, profileId: string) => Promise<SavedNameRecord[]>;
  save: (userId: string, profileId: string, nameId: string) => Promise<void>;
  remove: (userId: string, profileId: string, nameId: string) => Promise<void>;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function createShortlistHandlers({ getUserId, store, onError = () => {} }: {
  getUserId: () => Promise<string | null>;
  store: ShortlistStore;
  onError?: () => void;
}) {
  const json = (body: object, status = 200) => Response.json(body, {
    status, headers: { 'Cache-Control': 'private, no-store' },
  });

  async function handle(request: Request, action: 'list' | 'save' | 'remove') {
    try {
      const userId = await getUserId();
      if (!userId) return json({ error: 'Please sign in to manage saved names.' }, 401);

      let profileId: unknown;
      let nameId: unknown;
      if (action === 'list') {
        profileId = new URL(request.url).searchParams.get('profileId');
      } else {
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin) {
          return json({ error: 'This request is not allowed.' }, 403);
        }
        if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
          return json({ error: 'Send a JSON request body.' }, 415);
        }
        const body = await request.json().catch(() => null);
        profileId = body?.profileId;
        nameId = body?.nameId;
      }
      if (!isUuid(profileId) || (action !== 'list' && !isUuid(nameId))) {
        return json({ error: 'A valid baby profile and name are required.' }, 400);
      }
      // Never accept userId from a client or trust a profile ID without ownership.
      if (!await store.ownsProfile(userId, profileId)) {
        return json({ error: 'Baby profile not found.' }, 404);
      }
      if (action === 'list') return json({ savedNames: await store.list(userId, profileId) });
      if (action === 'save') {
        if (!await store.nameExists(nameId as string)) return json({ error: 'Name not found.' }, 404);
        await store.save(userId, profileId, nameId as string);
      } else {
        await store.remove(userId, profileId, nameId as string);
      }
      return json({ saved: action === 'save' });
    } catch {
      onError();
      return json({ error: 'Unable to update saved names. Please try again.' }, 500);
    }
  }

  return {
    GET: (request: Request) => handle(request, 'list'),
    POST: (request: Request) => handle(request, 'save'),
    DELETE: (request: Request) => handle(request, 'remove'),
  };
}
