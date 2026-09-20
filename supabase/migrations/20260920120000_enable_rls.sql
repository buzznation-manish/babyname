-- Supabase RLS policies for the application schema.
-- The current Prisma schema identifies application users by email rather than
-- storing auth.users.id, so ownership checks use auth.jwt()->>'email'.

alter table public.users enable row level security;
alter table public.baby_profiles enable row level security;
alter table public.saved_names enable row level security;
alter table public.search_history enable row level security;
alter table public.recommendations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.names enable row level security;
alter table public.name_categories enable row level security;
alter table public.name_category_mappings enable row level security;
alter table public.astrology_mappings enable row level security;
alter table public.name_astrology_scores enable row level security;
alter table public.numerology_scores enable row level security;
alter table public.voting_sessions enable row level security;
alter table public.votes enable row level security;

create policy "users_select_own" on public.users for select to authenticated using (email = (auth.jwt() ->> 'email'));
create policy "users_insert_own" on public.users for insert to authenticated with check (email = (auth.jwt() ->> 'email'));
create policy "users_update_own" on public.users for update to authenticated using (email = (auth.jwt() ->> 'email')) with check (email = (auth.jwt() ->> 'email'));
create policy "users_delete_own" on public.users for delete to authenticated using (email = (auth.jwt() ->> 'email'));

create policy "baby_profiles_select_own" on public.baby_profiles for select to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "baby_profiles_insert_own" on public.baby_profiles for insert to authenticated with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "baby_profiles_update_own" on public.baby_profiles for update to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "baby_profiles_delete_own" on public.baby_profiles for delete to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));

create policy "saved_names_select_own" on public.saved_names for select to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "saved_names_insert_own" on public.saved_names for insert to authenticated with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "saved_names_update_own" on public.saved_names for update to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "saved_names_delete_own" on public.saved_names for delete to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));

create policy "search_history_own" on public.search_history for all to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));
create policy "recommendations_own" on public.recommendations for all to authenticated using (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email')));
create policy "subscriptions_own" on public.subscriptions for all to authenticated using (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.users u where u.id = user_id and u.email = (auth.jwt() ->> 'email')));

create policy "names_public_read" on public.names for select to anon, authenticated using (true);
create policy "name_categories_public_read" on public.name_categories for select to anon, authenticated using (true);
create policy "name_category_mappings_public_read" on public.name_category_mappings for select to anon, authenticated using (true);
create policy "astrology_mappings_public_read" on public.astrology_mappings for select to anon, authenticated using (true);
create policy "name_astrology_scores_public_read" on public.name_astrology_scores for select to anon, authenticated using (true);
create policy "numerology_scores_public_read" on public.numerology_scores for select to anon, authenticated using (true);

create policy "voting_sessions_public_read" on public.voting_sessions for select to anon, authenticated using (true);
create policy "voting_sessions_owner_insert" on public.voting_sessions for insert to authenticated with check (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email')));
create policy "voting_sessions_owner_update" on public.voting_sessions for update to authenticated using (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email')));
create policy "voting_sessions_owner_delete" on public.voting_sessions for delete to authenticated using (exists (select 1 from public.baby_profiles b join public.users u on u.id = b.user_id where b.id = baby_profile_id and u.email = (auth.jwt() ->> 'email')));

create policy "votes_public_read" on public.votes for select to anon, authenticated using (true);
create policy "votes_public_insert" on public.votes for insert to anon, authenticated with check (exists (select 1 from public.voting_sessions s where s.id = voting_session_id) and exists (select 1 from public.names n where n.id = name_id));
create policy "votes_owner_update" on public.votes for update to authenticated using (exists (select 1 from public.voting_sessions s join public.baby_profiles b on b.id = s.baby_profile_id join public.users u on u.id = b.user_id where s.id = voting_session_id and u.email = (auth.jwt() ->> 'email'))) with check (exists (select 1 from public.voting_sessions s join public.baby_profiles b on b.id = s.baby_profile_id join public.users u on u.id = b.user_id where s.id = voting_session_id and u.email = (auth.jwt() ->> 'email')));
create policy "votes_owner_delete" on public.votes for delete to authenticated using (exists (select 1 from public.voting_sessions s join public.baby_profiles b on b.id = s.baby_profile_id join public.users u on u.id = b.user_id where s.id = voting_session_id and u.email = (auth.jwt() ->> 'email')));
