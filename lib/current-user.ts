import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  const account = await prisma.user.findUnique({
    where: { email: user.email }, select: { id: true },
  });
  return account?.id ?? null;
}
