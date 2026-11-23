-- Strengthen existing policies without changing rows or the table structure.
-- A saved name's user and baby profile must both belong to the authenticated account.
begin;

drop policy if exists "saved_names_select_own" on public.saved_names;
drop policy if exists "saved_names_insert_own" on public.saved_names;
drop policy if exists "saved_names_update_own" on public.saved_names;
drop policy if exists "saved_names_delete_own" on public.saved_names;

create policy "saved_names_select_own" on public.saved_names for select to authenticated
using (exists (
  select 1 from public.baby_profiles b join public.users u on u.id = b.user_id
  where b.id = saved_names.baby_profile_id and u.id = saved_names.user_id
    and u.email = (auth.jwt() ->> 'email')
));

create policy "saved_names_insert_own" on public.saved_names for insert to authenticated
with check (exists (
  select 1 from public.baby_profiles b join public.users u on u.id = b.user_id
  where b.id = saved_names.baby_profile_id and u.id = saved_names.user_id
    and u.email = (auth.jwt() ->> 'email')
));

create policy "saved_names_update_own" on public.saved_names for update to authenticated
using (exists (
  select 1 from public.baby_profiles b join public.users u on u.id = b.user_id
  where b.id = saved_names.baby_profile_id and u.id = saved_names.user_id
    and u.email = (auth.jwt() ->> 'email')
))
with check (exists (
  select 1 from public.baby_profiles b join public.users u on u.id = b.user_id
  where b.id = saved_names.baby_profile_id and u.id = saved_names.user_id
    and u.email = (auth.jwt() ->> 'email')
));

create policy "saved_names_delete_own" on public.saved_names for delete to authenticated
using (exists (
  select 1 from public.baby_profiles b join public.users u on u.id = b.user_id
  where b.id = saved_names.baby_profile_id and u.id = saved_names.user_id
    and u.email = (auth.jwt() ->> 'email')
));

commit;
