-- Run this in the Supabase dashboard's SQL editor (Database > SQL Editor),
-- after 003_admin.sql. Safe to run once; every statement is idempotent.

-- 1. Marks whether a profile's username is a real, user-chosen handle (true)
--    or a placeholder waiting on the onboarding flow (false). Email/password
--    signups already collect a real username up front (see signUp() in
--    AuthContext.tsx), so every existing row is treated as already set.
alter table public.profiles
  add column if not exists username_set boolean not null default true;

-- 2. Auto-create a profiles row the moment a new auth.users row appears,
--    for both signup paths:
--    - email/password: signUp() already passed a real `username` in
--      user_metadata, so username_set is true immediately.
--    - Google OAuth: no `username` in user_metadata, so a short placeholder
--      is used and username_set is false -- the frontend's onboarding modal
--      watches for this and asks the user to pick a real one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  fallback_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (user_id, username, display_name, avatar_url, username_set)
  values (
    new.id,
    coalesce(meta_username, 'user_' || substr(replace(new.id::text, '-', ''), 1, 12)),
    fallback_name,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    meta_username is not null
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
