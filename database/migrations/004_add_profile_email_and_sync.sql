-- =============================================================================
-- Migration: 004_add_profile_email_and_sync.sql
-- Ensure public.profiles table contains email column, syncs with auth.users,
-- and supports dual-layer authentication across Supabase and local environments.
-- =============================================================================

-- 1. Add email column to public.profiles if it does not already exist
alter table public.profiles
  add column if not exists email text;

-- 2. Create index on public.profiles(email) for fast lookups
create index if not exists idx_profiles_email on public.profiles(email);

-- 3. Update public.handle_new_user() trigger function to populate email on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'user',
    new.email
  )
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = now();
  return new;
end;
$$;

-- 4. Backfill existing profiles from auth.users if auth schema is present
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    update public.profiles p
       set email = u.email
      from auth.users u
     where p.id = u.id
       and (p.email is null or p.email = '');
  end if;
end $$;
