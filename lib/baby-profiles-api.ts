import { parseBabyProfile, type BabyProfileData, type BabyProfileRecord } from './baby-profiles';
import { isUuid } from './shortlist-api';

export interface BabyProfileStore {
  list: (userId: string) => Promise<BabyProfileRecord[]>;
  create: (userId: string, data: BabyProfileData) => Promise<BabyProfileRecord>;
  update: (userId: string, id: string, data: BabyProfileData) => Promise<BabyProfileRecord | null>;
}

export function createBabyProfileHandlers({ getUserId, store, onError = () => {} }: {
  getUserId: () => Promise<string | null>;
  store: BabyProfileStore;
  onError?: () => void;
}) {
  const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
  async function handle(request: Request, method: 'GET' | 'POST' | 'PUT') {
    try {
      const userId = await getUserId();
      if (!userId) return json({ error: 'Please sign in to manage baby profiles.' }, 401);
      if (method === 'GET') return json({ profiles: await store.list(userId) });
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return json({ error: 'This request is not allowed.' }, 403);
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({ error: 'Send a JSON request body.' }, 415);
      const body = await request.json().catch(() => null);
      const parsed = parseBabyProfile(body);
      if (parsed.error || !parsed.data) return json({ error: parsed.error ?? 'Invalid profile.' }, 400);
      if (method === 'POST') return json({ profile: await store.create(userId, parsed.data) }, 201);
      const id: unknown = body?.id;
      if (!isUuid(id)) return json({ error: 'A valid baby profile ID is required.' }, 400);
      const profile = await store.update(userId, id, parsed.data);
      return profile ? json({ profile }) : json({ error: 'Baby profile not found.' }, 404);
    } catch {
      onError();
      return json({ error: 'Unable to load or save baby profiles. Please try again.' }, 500);
    }
  }
  return {
    GET: (request: Request) => handle(request, 'GET'),
    POST: (request: Request) => handle(request, 'POST'),
    PUT: (request: Request) => handle(request, 'PUT'),
  };
}
