-- Add missing RLS coverage for public-facing analytics and audio data.
-- Reads are public. Direct client-side writes are intentionally not granted.
-- Backend/server code using the service role or direct Prisma connection remains responsible for writes.

alter table public.audio_pronunciations enable row level security;
alter table public.name_trends enable row level security;

create policy "audio_pronunciations_public_read"
on public.audio_pronunciations
for select
to anon, authenticated
using (true);

create policy "name_trends_public_read"
on public.name_trends
for select
to anon, authenticated
using (true);
